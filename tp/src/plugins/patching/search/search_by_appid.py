import logging
import logging.config

from db.client import db_create_close, r
from plugins.patching import *
from plugins.patching.os_apps.db_calls import get_all_stats_by_appid
from plugins.patching.rv_db_calls import get_file_data
from agent import *
from errorz.error_messages import GenericResults, PackageResults

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class RetrieveAppsByAppId(object):
    """
        Main Class for retrieving package information.
    """
    def __init__(self, username, customer_name, app_id,
                 uri=None, method=None, count=30, offset=0):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.app_id = app_id
        self.CurrentAppsCollection = AppsCollection
        self.CurrentAppsIndexes = AppsIndexes
        self.CurrentAppsPerAgentCollection = AppsPerAgentCollection
        self.CurrentAppsKey = AppsKey
        self.CurrentAppsPerAgentKey = AppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = AppsPerAgentIndexes

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Description: r.row[self.CurrentAppsKey.Description],
                self.CurrentAppsKey.Kb: r.row[self.CurrentAppsKey.Kb],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.VendorSeverity: r.row[self.CurrentAppsKey.VendorSeverity],
                self.CurrentAppsKey.VendorName: r.row[self.CurrentAppsKey.VendorName],
                self.CurrentAppsKey.SupportUrl: r.row[self.CurrentAppsKey.SupportUrl],
                self.CurrentAppsKey.OsCode: r.row[self.CurrentAppsKey.OsCode],
                self.CurrentAppsKey.FilesDownloadStatus: r.row[self.CurrentAppsKey.FilesDownloadStatus],
            }
        )

    @db_create_close
    def get_by_app_id(self, stats=False, conn=None):
        """
        """
        try:
            pkg = list(
                r
                .table(self.CurrentAppsCollection, use_outdated=True)
                .get_all(self.app_id, index=self.CurrentAppsIndexes.AppId)
                .map(self.map_hash)
                .run(conn)
            )
            if pkg:
                pkg[0][self.CurrentAppsKey.FileData] = get_file_data(self.app_id)

                if stats:
                    pkg[0]['agent_stats'] = (
                        get_all_stats_by_appid(
                            self.username, self.customer_name,
                            self.uri, self.method, self.app_id,
                            table=self.CurrentAppsPerAgentCollection
                        )['data']
                    )

                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).information_retrieved(pkg[0], 1)
                )

            else:
                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.app_id, 'package')
                )

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(self.app_id, 'package', e)
            )
            logger.exception(e)

        return(status)


class RetrieveAgentsByAppId(object):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 app_id, uri=None, method=None,
                 count=30, offset=0):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.app_id = app_id
        self.CurrentAppsCollection = AppsCollection
        self.CurrentAppsIndexes = AppsIndexes
        self.CurrentAppsPerAgentCollection = AppsPerAgentCollection
        self.CurrentAppsKey = AppsKey
        self.CurrentAppsPerAgentKey = AppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = AppsPerAgentIndexes

        self.map_hash = (
            {
                AgentKey.ComputerName: r.row[AgentKey.ComputerName],
                AgentKey.DisplayName: r.row[AgentKey.DisplayName],
                self.CurrentAppsPerAgentKey.AgentId: r.row[self.CurrentAppsPerAgentKey.AgentId]
            }
        )

    @db_create_close
    def filter_by_status(self, pkg_status, conn=None):
        """
        """
        try:
            pkg = (
                r
                .table(self.CurrentAppsCollection, use_outdated=True)
                .get(self.app_id)
                .run(conn)
            )
            if pkg:
                if pkg_status in ValidPackageStatuses:
                    agents = list(
                        r
                        .table(self.CurrentAppsPerAgentCollection, use_outdated=True)
                        .get_all([self.app_id, pkg_status],
                                 index=self.CurrentAppsPerAgentIndexes.AppIdAndStatus)
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AgentId,
                            r.table(AgentsCollection)
                        )
                        .zip()
                        .order_by(r.asc(AgentKey.ComputerName))
                        .skip(self.offset)
                        .limit(self.count)
                        .map(self.map_hash)
                        .run(conn)
                    )

                    agent_count = (
                        r
                        .table(self.CurrentAppsPerAgentCollection, use_outdated=True)
                        .get_all([self.app_id, pkg_status],
                                 index=self.CurrentAppsPerAgentIndexes.AppIdAndStatus)
                        .count()
                        .run(conn)
                    )

                    return_status = (
                        GenericResults(
                            self.username, self.uri, self.method
                        ).information_retrieved(agents, agent_count)
                    )

                else:
                    return_status = (
                        PackageResults(
                            self.username, self.uri, self.method
                        ).invalid_status(self.app_id, pkg_status)
                    )

            else:
                return_status = (
                    PackageResults(
                        self.username, self.uri, self.method
                    ).invalid_package_id(self.app_id)
                )

        except Exception as e:
            return_status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    "Package Searching went haywire",
                    'os_updates', e
                    )
            )
            logger.exception(e)

        return(return_status)

    @db_create_close
    def query_by_name(self, name, conn=None):
        try:
            pkg = (
                r
                .table(self.CurrentAppsCollection, use_outdated=True)
                .get(self.app_id)
                .run(conn)
            )
            if pkg:
                agents = list(
                    r
                    .table(self.CurrentAppsPerAgentCollection)
                    .get_all(self.app_id, index=self.CurrentAppsPerAgentIndexes.AppId)
                    .eq_join(
                        self.CurrentAppsPerAgentKey.AgentId,
                        r.table(AgentsCollection)
                    )
                    .zip()
                    .filter(
                        r.row[AgentKey.ComputerName].match("(?i)"+name)
                        |
                        r.row[AgentKey.DisplayName].match("(?i)"+name)
                    )
                    .order_by(r.asc('computer_name'))
                    .skip(self.offset)
                    .limit(self.count)
                    .map(self.map_hash)
                    .run(conn)
                )

                agent_count = (
                    r
                    .table(self.CurrentAppsPerAgentCollection, use_outdated=True)
                    .get_all(self.app_id, index=self.CurrentAppsPerAgentIndexes.AppId)
                    .eq_join(
                        self.CurrentAppsPerAgentKey.AgentId,
                        r.table(AgentsCollection)
                    )
                    .zip()
                    .filter(
                        r.row[AgentKey.ComputerName].match("(?i)"+name)
                        |
                        r.row[AgentKey.DisplayName].match("(?i)"+name)
                    )
                    .count()
                    .run(conn)
                )

                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).information_retrieved(agents, agent_count)
                )

            else:
                return_status = (
                    PackageResults(
                        self.username, self.uri, self.method
                    ).invalid_package_id(self.app_id)
                )

        except Exception as e:
            return_status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    "Package Searching went haywire",
                    'os_updates', e
                    )
            )
            logger.exception(e)

        return(return_status)

    @db_create_close
    def filter_by_status_and_query_by_name(self, name, pkg_status, conn=None):
        try:
            pkg = (
                r
                .table(self.CurrentAppsCollection, use_outdated=True)
                .get(self.app_id)
                .run(conn)
            )
            if pkg:
                if pkg_status in ValidPackageStatuses:
                    agents = list(
                        r
                        .table(self.CurrentAppsPerAgentCollection, use_outdated=True)
                        .get_all([self.app_id, pkg_status],
                                 index=self.CurrentAppsPerAgentIndexes.AppIdAndStatus)
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AgentId,
                            r.table(AgentsCollection)
                        )
                        .zip()
                        .filter(
                            r.row[AgentKey.ComputerName].match("(?i)"+name)
                            |
                            r.row[AgentKey.DisplayName].match("(?i)"+name)
                        )
                        .order_by(r.asc(AgentKey.ComputerName))
                        .skip(self.offset)
                        .limit(self.count)
                        .map(self.map_hash)
                        .run(conn)
                    )

                    agent_count = (
                        r
                        .table(self.CurrentAppsPerAgentCollection, use_outdated=True)
                        .get_all([self.app_id, pkg_status],
                                 index=self.CurrentAppsPerAgentIndexes.AppIdAndStatus)
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AgentId,
                            r.table(AgentsCollection)
                        )
                        .zip()
                        .filter(
                            r.row[AgentKey.ComputerName].match("(?i)"+name)
                            |
                            r.row[AgentKey.DisplayName].match("(?i)"+name)
                        )
                        .count()
                        .run(conn)
                    )

                    return_status = (
                        GenericResults(
                            self.username, self.uri, self.method
                        ).information_retrieved(agents, agent_count)
                    )

                else:
                    return_status = (
                        PackageResults(
                            self.username, self.uri, self.method
                        ).invalid_status(self.app_id, pkg_status)
                    )

            else:
                return_status = (
                    PackageResults(
                        self.username, self.uri, self.method
                    ).invalid_package_id(self.app_id)
                )

        except Exception as e:
            return_status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    "Package Searching went haywire",
                    'os_updates', e
                    )
            )
            logger.exception(e)

        return(return_status)

    @db_create_close
    def filter_by_status_and_query_by_name_and_sev(self, name, pkg_status,
                                                   sev, conn=None):

        try:
            pkg = (
                r
                .table(self.CurrentAppsCollection, use_outdated=True)
                .get(self.app_id)
                .run(conn)
            )
            if agent:
                if pkg_status in ValidPackageStatuses:
                    if sev in ValidRvSeverities:
                        agents = list(
                            r
                            .table(self.CurrentAppsPerAgentCollection)
                            .get_all(
                                [self.app_id, pkg_status],
                                index=self.CurrentAppsPerAgentIndexes.AppIdAndStatus
                            )
                            .eq_join(
                                self.CurrentAppsPerAgentKey.AppId,
                                r.table(self.CurrentAppsCollection)
                            )
                            .zip()
                            .eq_join(
                                self.CurrentAppsPerAgentKey.AgentId,
                                r.table(AgentsCollection)
                            )
                            .zip()
                            .filter(
                                (r.row[self.CurrentAppsKey.RvSeverity] == sev)
                                &
                                (r.row[self.CurrentAppsKey.Name].match("(?i)"+name))
                            )
                            .order_by(r.asc(self.CurrentAppsKey.Name))
                            .skip(self.offset)
                            .limit(self.count)
                            .map(self.map_hash)
                            .run(conn)
                        )

                        agent_count = (
                            r
                            .table(self.CurrentAppsPerAgentCollection)
                            .get_all(
                                [self.app_id, pkg_status],
                                index=self.CurrentAppsPerAgentIndexes.AppIdAndStatus
                            )
                            .eq_join(self.CurrentAppsPerAgentKey.AppId,
                                     r.table(self.CurrentAppsCollection))
                            .zip()
                            .filter(
                                (r.row[self.CurrentAppsKey.RvSeverity] == sev)
                                &
                                (r.row[self.CurrentAppsKey.Name].match("(?i)"+name))
                                )
                            .count()
                            .run(conn)
                        )

                        return_status = (
                            GenericResults(
                                self.username, self.uri, self.method
                            ).information_retrieved(agents, agent_count)
                        )

                    else:
                        return_status = (
                            PackageResults(
                                self.username, self.uri, self.method
                            ).invalid_severity(sev)
                        )

                else:
                    return_status = (
                        PackageResults(
                            self.username, self.uri, self.method
                        ).invalid_status(self.app_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.app_id, 'os_apps')
                )

        except Exception as e:
            return_status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    "Package Searching went haywire",
                    'os_updates', e
                    )
            )
            logger.exception(e)

        return(return_status)

    @db_create_close
    def filter_by_severity(self, sev, conn=None):
        try:
            pkg = (
                r
                .table(self.CurrentAppsCollection, use_outdated=True)
                .get(self.app_id)
                .run(conn)
            )
            if pkg:
                if sev in ValidRvSeverities:
                    agents = list(
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            self.app_id, index=self.CurrentAppsPerAgentIndexes.AppId
                            )
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AppId,
                            r.table(self.CurrentAppsCollection)
                        )
                        .zip()
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AgentId,
                            r.table(AgentsCollection)
                        )
                        .zip()
                        .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                        .order_by(r.asc(self.CurrentAppsKey.Name))
                        .skip(self.offset)
                        .limit(self.count)
                        .map(self.map_hash)
                        .run(conn)
                    )

                    agent_count = (
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(self.app_id, index=self.CurrentAppsPerAgentIndexes.AppId)
                        .eq_join(self.CurrentAppsPerAgentKey.AppId, r.table(self.CurrentAppsCollection))
                        .zip()
                        .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                        .count()
                        .run(conn)
                    )

                    return_status = (
                        GenericResults(
                            self.username, self.uri, self.method
                        ).information_retrieved(agents, agent_count)
                    )

                else:
                    return_status = (
                        PackageResults(
                            self.username, self.uri, self.method
                        ).invalid_severity(sev)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.app_id, 'os_apps')
                )

        except Exception as e:
            return_status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    "Package Searching went haywire",
                    'os_updates', e
                    )
            )
            logger.exception(e)

        return(return_status)

    @db_create_close
    def filter_by_sev_and_query_by_name(self, name, sev, conn=None):

        try:
            pkg = (
                r
                .table(self.CurrentAppsCollection, use_outdated=True)
                .get(self.app_id)
                .run(conn)
            )
            if pkg:
                if sev in ValidRvSeverities:
                    agents = list(
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            self.app_id, index=self.CurrentAppsPerAgentIndexes.AppId
                        )
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AppId,
                            r.table(self.CurrentAppsCollection)
                        )
                        .zip()
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AgentId,
                            r.table(AgentsCollection)
                        )
                        .zip()
                        .filter(
                            (r.row[self.CurrentAppsKey.RvSeverity] == sev)
                            &
                            (r.row[self.CurrentAppsKey.Name].match("(?i)"+name))
                        )
                        .order_by(r.asc(self.CurrentAppsKey.Name))
                        .skip(self.offset)
                        .limit(self.count)
                        .map(self.map_hash)
                        .run(conn)
                    )

                    agent_count = (
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            self.app_id, index=self.CurrentAppsPerAgentIndexes.AppId
                        )
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AppId,
                            r.table(self.CurrentAppsCollection)
                        )
                        .zip()
                        .filter(
                            (r.row[self.CurrentAppsKey.RvSeverity] == sev)
                            &
                            (r.row[self.CurrentAppsKey.Name].match("(?i)"+name))
                        )
                        .count()
                        .run(conn)
                    )

                    return_status = (
                        GenericResults(
                            self.username, self.uri, self.method
                        ).information_retrieved(agents, agent_count)
                    )

                else:
                    return_status = (
                        PackageResults(
                            self.username, self.uri, self.method
                        ).invalid_severity(sev)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.app_id, 'agents')
                )

        except Exception as e:
            return_status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    "Package Searching went haywire",
                    'os_updates', e
                    )
            )
            logger.exception(e)

        return(return_status)


    @db_create_close
    def filter_by_status_and_sev(self, pkg_status, sev, conn=None):

        try:
            pkg = (
                r
                .table(self.CurrentAppsCollection, use_outdated=True)
                .get(self.app_id)
                .run(conn)
            )
            if pkg:
                if pkg_status in ValidPackageStatuses:
                    if sev in ValidRvSeverities:
                        agents = list(
                            r
                            .table(self.CurrentAppsPerAgentCollection)
                            .get_all(
                                [self.app_id, pkg_status],
                                index=self.CurrentAppsPerAgentIndexes.AppIdAndStatus
                            )
                            .eq_join(
                                self.CurrentAppsPerAgentKey.AppId,
                                r.table(self.CurrentAppsCollection)
                            )
                            .zip()
                            .eq_join(
                                self.CurrentAppsPerAgentKey.AgentId,
                                r.table(AgentsCollection)
                            )
                            .zip()
                            .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                            .order_by(r.asc(self.CurrentAppsKey.Name))
                            .skip(self.offset)
                            .limit(self.count)
                            .map(self.map_hash)
                            .run(conn)
                        )

                        agent_count = (
                            r
                            .table(self.CurrentAppsPerAgentCollection)
                            .get_all(
                                [self.app_id, pkg_status],
                                index=self.CurrentAppsPerAgentIndexes.AppIdAndStatus
                            )
                            .eq_join(
                                self.CurrentAppsPerAgentKey.AppId,
                                r.table(self.CurrentAppsCollection)
                            )
                            .zip()
                            .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                            .count()
                            .run(conn)
                        )

                        return_status = (
                            GenericResults(
                                self.username, self.uri, self.method
                            ).information_retrieved(agents, agent_count)
                        )

                    else:
                        return_status = (
                            PackageResults(
                                self.username, self.uri, self.method
                            ).invalid_severity(sev)
                        )

                else:
                    return_status = (
                        PackageResults(
                            self.username, self.uri, self.method
                        ).invalid_status(self.app_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.app_id, 'os_apps')
                )

        except Exception as e:
            return_status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    "Package Searching went haywire",
                    'os_updates', e
                    )
            )
            logger.exception(e)

        return(return_status)

class RetrieveCustomAppsByAppId(RetrieveAppsByAppId):
    """
        Main Class for retrieving package information.
    """
    def __init__(self, username, customer_name, app_id,
                 uri=None, method=None, count=30, offset=0):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.app_id = app_id
        self.CurrentAppsCollection = CustomAppsCollection
        self.CurrentAppsIndexes = CustomAppsIndexes
        self.CurrentAppsPerAgentCollection = CustomAppsPerAgentCollection
        self.CurrentAppsKey = CustomAppsKey
        self.CurrentAppsPerAgentKey = CustomAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = CustomAppsPerAgentIndexes

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsPerAgentKey.Dependencies: r.row[self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsKey.Description: r.row[self.CurrentAppsKey.Description],
                self.CurrentAppsKey.Kb: r.row[self.CurrentAppsKey.Kb],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.VendorSeverity: r.row[self.CurrentAppsKey.VendorSeverity],
                self.CurrentAppsKey.VendorName: r.row[self.CurrentAppsKey.VendorName],
                self.CurrentAppsKey.SupportUrl: r.row[self.CurrentAppsKey.SupportUrl],
                self.CurrentAppsKey.OsCode: r.row[self.CurrentAppsKey.OsCode],
                self.CurrentAppsKey.FilesDownloadStatus: r.row[self.CurrentAppsKey.FilesDownloadStatus],
                self.CurrentAppsKey.CliOptions: r.row[self.CurrentAppsKey.CliOptions],
            }
        )


class RetrieveSupportedAppsByAppId(RetrieveAppsByAppId):
    """
        Main Class for retrieving package information.
    """
    def __init__(self, username, customer_name, app_id,
                 uri=None, method=None, count=30, offset=0):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.app_id = app_id
        self.CurrentAppsCollection = SupportedAppsCollection
        self.CurrentAppsIndexes = SupportedAppsIndexes
        self.CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
        self.CurrentAppsKey = SupportedAppsKey
        self.CurrentAppsPerAgentKey = SupportedAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = SupportedAppsPerAgentIndexes

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsPerAgentKey.Dependencies: r.row[self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsKey.Description: r.row[self.CurrentAppsKey.Description],
                self.CurrentAppsKey.Kb: r.row[self.CurrentAppsKey.Kb],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.VendorSeverity: r.row[self.CurrentAppsKey.VendorSeverity],
                self.CurrentAppsKey.VendorName: r.row[self.CurrentAppsKey.VendorName],
                self.CurrentAppsKey.SupportUrl: r.row[self.CurrentAppsKey.SupportUrl],
                self.CurrentAppsKey.OsCode: r.row[self.CurrentAppsKey.OsCode],
                self.CurrentAppsKey.FilesDownloadStatus: r.row[self.CurrentAppsKey.FilesDownloadStatus],
            }
        )

class RetrieveAgentAppsByAppId(RetrieveAppsByAppId):
    """
        Main Class for retrieving package information.
    """
    def __init__(self, username, customer_name, app_id,
                 uri=None, method=None, count=30, offset=0):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.app_id = app_id
        self.CurrentAppsCollection = AgentAppsCollection
        self.CurrentAppsIndexes = AgentAppsIndexes
        self.CurrentAppsPerAgentCollection = AgentAppsPerAgentCollection
        self.CurrentAppsKey = AgentAppsKey
        self.CurrentAppsPerAgentKey = AgentAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = AgentAppsPerAgentIndexes

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsPerAgentKey.Dependencies: r.row[self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsKey.Description: r.row[self.CurrentAppsKey.Description],
                self.CurrentAppsKey.Kb: r.row[self.CurrentAppsKey.Kb],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.VendorSeverity: r.row[self.CurrentAppsKey.VendorSeverity],
                self.CurrentAppsKey.VendorName: r.row[self.CurrentAppsKey.VendorName],
                self.CurrentAppsKey.SupportUrl: r.row[self.CurrentAppsKey.SupportUrl],
                self.CurrentAppsKey.OsCode: r.row[self.CurrentAppsKey.OsCode],
                self.CurrentAppsKey.FilesDownloadStatus: r.row[self.CurrentAppsKey.FilesDownloadStatus],
            }
        )


class RetrieveAgentsByCustomAppId(RetrieveAgentsByAppId):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 app_id, uri=None, method=None,
                 count=30, offset=0):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.app_id = app_id
        self.CurrentAppsCollection = CustomAppsCollection
        self.CurrentAppsIndexes = CustomAppsIndexes
        self.CurrentAppsPerAgentCollection = CustomAppsPerAgentCollection
        self.CurrentAppsKey = CustomAppsKey
        self.CurrentAppsPerAgentKey = CustomAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = CustomAppsPerAgentIndexes

        self.map_hash = (
            {
                AgentKey.ComputerName: r.row[AgentKey.ComputerName],
                AgentKey.DisplayName: r.row[AgentKey.DisplayName],
                self.CurrentAppsPerAgentKey.AgentId: r.row[self.CurrentAppsPerAgentKey.AgentId]
            }
        )

class RetrieveAgentsBySupportedAppId(RetrieveAgentsByAppId):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 app_id, uri=None, method=None,
                 count=30, offset=0):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.app_id = app_id
        self.CurrentAppsCollection = SupportedAppsCollection
        self.CurrentAppsIndexes = SupportedAppsIndexes
        self.CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
        self.CurrentAppsKey = SupportedAppsKey
        self.CurrentAppsPerAgentKey = SupportedAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = SupportedAppsPerAgentIndexes

        self.map_hash = (
            {
                AgentKey.ComputerName: r.row[AgentKey.ComputerName],
                AgentKey.DisplayName: r.row[AgentKey.DisplayName],
                self.CurrentAppsPerAgentKey.AgentId: r.row[self.CurrentAppsPerAgentKey.AgentId]
            }
        )

class RetrieveAgentsByAgentAppId(RetrieveAgentsByAppId):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 app_id, uri=None, method=None,
                 count=30, offset=0):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.app_id = app_id
        self.CurrentAppsCollection = AgentAppsCollection
        self.CurrentAppsIndexes = AgentAppsIndexes
        self.CurrentAppsPerAgentCollection = AgentAppsPerAgentCollection
        self.CurrentAppsKey = AgentAppsKey
        self.CurrentAppsPerAgentKey = AgentAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = AgentAppsPerAgentIndexes

        self.map_hash = (
            {
                AgentKey.ComputerName: r.row[AgentKey.ComputerName],
                AgentKey.DisplayName: r.row[AgentKey.DisplayName],
                self.CurrentAppsPerAgentKey.AgentId: r.row[self.CurrentAppsPerAgentKey.AgentId]
            }
        )

