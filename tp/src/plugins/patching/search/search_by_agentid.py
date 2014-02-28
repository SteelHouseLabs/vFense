import logging
import logging.config
from db.client import db_create_close, r
from plugins.patching import *
from agent import *
from agent.agents import get_agent_info
from errorz.error_messages import GenericResults, PackageResults

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

class RetrieveAppsByAgentId(object):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 agent_id, uri=None, method=None,
                 count=30, offset=0, sort='asc',
                 sort_key=AppsKey.Name,
                 show_hidden=NO):
        """
        """
        self.count = count
        self.uri = uri
        self.method = method
        self.offset = offset
        self.count = count
        self.sort = sort
        self.agent_id = agent_id
        self.username = username
        self.customer_name = customer_name
        self.CurrentAppsCollection = AppsCollection
        self.CurrentAppsIndexes = AppsIndexes
        self.CurrentAppsPerAgentCollection = AppsPerAgentCollection
        self.CurrentAppsKey = AppsKey
        self.CurrentAppsPerAgentKey = AppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = AppsPerAgentIndexes

        self.pluck_list = (
            [
                self.CurrentAppsKey.AppId,
                self.CurrentAppsKey.Version,
                self.CurrentAppsKey.Name,
                self.CurrentAppsPerAgentKey.Update,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.Hidden,
                self.CurrentAppsKey.RebootRequired,
                self.CurrentAppsKey.RvSeverity,
                self.CurrentAppsKey.FilesDownloadStatus,
                self.CurrentAppsPerAgentKey.Dependencies,
                self.CurrentAppsPerAgentKey.InstallDate,
                self.CurrentAppsPerAgentKey.Status,
                self.CurrentAppsPerAgentKey.Update,
            ]
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Hidden: r.row[self.CurrentAppsKey.Hidden],
                self.CurrentAppsPerAgentKey.Update: r.row[self.CurrentAppsPerAgentKey.Update],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.RebootRequired: r.row[self.CurrentAppsKey.RebootRequired],
                self.CurrentAppsKey.FilesDownloadStatus: r.row[self.CurrentAppsKey.FilesDownloadStatus],
                self.CurrentAppsPerAgentKey.Dependencies: r.row[self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsPerAgentKey.InstallDate: r.row[self.CurrentAppsPerAgentKey.InstallDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Status: r.row[self.CurrentAppsPerAgentKey.Status],
                self.CurrentAppsPerAgentKey.Update: r.row[self.CurrentAppsPerAgentKey.Update],
            }
        )

        if show_hidden in ValidHiddenVals:
            self.show_hidden = show_hidden
        else:
            self.show_hidden = NO

        if sort_key in self.pluck_list:
            self.sort_key = sort_key
        else:
            self.sort_key = self.CurrentAppsKey.Name

        if sort == 'asc':
            self.sort = r.asc
        else:
            self.sort = r.desc

    @db_create_close
    def filter_by_status(self, pkg_status, conn=None):
        try:
            agent = get_agent_info(self.agent_id)
            if agent:
                if pkg_status in ValidPackageStatuses:
                    base = (
                        r
                        .table(self.CurrentAppsPerAgentCollection, use_outdated=True)
                        .get_all(
                            [pkg_status, self.agent_id],
                            index=self.CurrentAppsPerAgentIndexes.StatusAndAgentId)
                        .eq_join(self.CurrentAppsPerAgentKey.AppId, r.table(self.CurrentAppsCollection))
                        .zip()
                    )
                    if self.show_hidden == NO:
                        base = base.filter({self.CurrentAppsKey.Hidden: NO})

                    packages = list(
                        base
                        .map(self.map_hash)
                        .order_by(self.sort(self.sort_key))
                        .skip(self.offset)
                        .limit(self.count)
                        .run(conn)
                    )

                    pkg_count = (
                        base
                        .count()
                        .run(conn)
                    )

                    return_status = (
                        GenericResults(
                            self.username, self.uri, self.method
                        ).information_retrieved(packages, pkg_count)
                    )

                else:
                    return_status = (
                        PackageResults(
                            self.username, self.uri, self.method
                        ).invalid_status(self.agent_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.agent_id, 'agents')
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
            agent = get_agent_info(self.agent_id)
            if agent:
                if pkg_status in ValidPackageStatuses:
                    base = (
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            [pkg_status, self.agent_id],
                            index=self.CurrentAppsPerAgentIndexes.StatusAndAgentId
                        )
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AppId,
                            r.table(self.CurrentAppsCollection)
                        )
                        .zip()
                    )
                    if self.show_hidden == NO:
                        base = base.filter({self.CurrentAppsKey.Hidden: NO})

                    packages = list(
                        base
                        .filter(lambda x: x[self.CurrentAppsKey.Name].match("(?i)"+name))
                        .map(self.map_hash)
                        .order_by(self.sort(self.sort_key))
                        .skip(self.offset)
                        .limit(self.count)
                        .run(conn)
                    )

                    pkg_count = (
                        base
                        .filter(lambda x: x[self.CurrentAppsKey.Name].match("(?i)"+name))
                        .count()
                        .run(conn)
                    )

                    return_status = (
                        GenericResults(
                            self.username, self.uri, self.method
                        ).information_retrieved(packages, pkg_count)
                    )

                else:
                    return_status = (
                        PackageResults(
                            self.username, self.uri, self.method
                        ).invalid_status(self.agent_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.agent_id, 'agents')
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
            agent = get_agent_info(self.agent_id)
            if agent:
                base = (
                    r
                    .table(self.CurrentAppsPerAgentCollection)
                    .get_all(self.agent_id, index=self.CurrentAppsPerAgentIndexes.AgentId)
                    .eq_join(self.CurrentAppsPerAgentKey.AppId, r.table(self.CurrentAppsCollection))
                    .zip()
                )
                if self.show_hidden == NO:
                    base = base.filter({self.CurrentAppsKey.Hidden: NO})

                packages = list(
                    base
                    .filter(lambda x: x[self.CurrentAppsKey.Name].match("(?i)"+name))
                    .map(self.map_hash)
                    .order_by(self.sort(self.sort_key))
                    .skip(self.offset)
                    .limit(self.count)
                    .run(conn)
                )

                pkg_count = (
                    base
                    .filter(lambda x: x[self.CurrentAppsKey.Name].match("(?i)"+name))
                    .count()
                    .run(conn)
                )

                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).information_retrieved(packages, pkg_count)
                )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.agent_id, 'agents')
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
            agent = get_agent_info(self.agent_id)
            if agent:
                if pkg_status in ValidPackageStatuses:
                    if sev in ValidRvSeverities:
                        base = (
                            r
                            .table(self.CurrentAppsPerAgentCollection)
                            .get_all(
                                [pkg_status, self.agent_id],
                                index=self.CurrentAppsPerAgentIndexes.StatusAndAgentId
                            )
                            .eq_join(
                                self.CurrentAppsPerAgentKey.AppId,
                                r.table(self.CurrentAppsCollection)
                            )
                            .zip()
                        )
                        if self.show_hidden == NO:
                            base = base.filter({self.CurrentAppsKey.Hidden: NO})

                        packages = list(
                            base
                            .filter(
                                (r.row[self.CurrentAppsKey.RvSeverity] == sev)
                                &
                                (r.row[self.CurrentAppsKey.Name].match("(?i)"+name))
                            )
                            .map(self.map_hash)
                            .order_by(self.sort(self.sort_key))
                            .skip(self.offset)
                            .limit(self.count)
                            .run(conn)
                        )

                        pkg_count = (
                            base
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
                            ).information_retrieved(packages, pkg_count)
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
                        ).invalid_status(self.agent_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.agent_id, 'agents')
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
            agent = get_agent_info(self.agent_id)
            if agent:
                if sev in ValidRvSeverities:
                    base = (
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            self.agent_id, index=self.CurrentAppsPerAgentIndexes.AgentId
                        )
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AppId,
                            r.table(self.CurrentAppsCollection)
                        )
                        .zip()
                    )
                    if self.show_hidden == NO:
                        base = base.filter({self.CurrentAppsKey.Hidden: NO})

                    packages = list(
                        base
                        .filter(
                            (r.row[self.CurrentAppsKey.RvSeverity] == sev)
                            &
                            (r.row[self.CurrentAppsKey.Name].match("(?i)"+name))
                        )
                        .map(self.map_hash)
                        .order_by(self.sort(self.sort_key))
                        .skip(self.offset)
                        .limit(self.count)
                        .run(conn)
                    )

                    pkg_count = (
                        base
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
                        ).information_retrieved(packages, pkg_count)
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
                    ).invalid_id(self.agent_id, 'agents')
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
            agent = get_agent_info(self.agent_id)
            if agent:
                if sev in ValidRvSeverities:
                    base = (
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            self.agent_id, index=self.CurrentAppsPerAgentIndexes.AgentId
                        )
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AppId,
                            r.table(self.CurrentAppsCollection)
                        )
                        .zip()
                    )
                    if self.show_hidden == NO:
                        base = base.filter({self.CurrentAppsKey.Hidden: NO})

                    packages = list(
                        base
                        .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                        .map(self.map_hash)
                        .order_by(self.sort(self.sort_key))
                        .skip(self.offset)
                        .limit(self.count)
                        .run(conn)
                    )

                    pkg_count = (
                        base
                        .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                        .count()
                        .run(conn)
                    )

                    return_status = (
                        GenericResults(
                            self.username, self.uri, self.method
                        ).information_retrieved(packages, pkg_count)
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
                    ).invalid_id(self.agent_id, 'agents')
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
            agent = get_agent_info(self.agent_id)
            if agent:
                if pkg_status in ValidPackageStatuses:
                    if sev in ValidRvSeverities:
                        base = (
                            r
                            .table(self.CurrentAppsPerAgentCollection)
                            .get_all(
                                [pkg_status, self.agent_id],
                                index=self.CurrentAppsPerAgentIndexes.StatusAndAgentId
                            )
                            .eq_join(
                                self.CurrentAppsPerAgentKey.AppId,
                                r.table(self.CurrentAppsCollection)
                            )
                            .zip()
                        )
                        if self.show_hidden == NO:
                            base = base.filter({self.CurrentAppsKey.Hidden: NO})

                        packages = list(
                            base
                            .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                            .map(self.map_hash)
                            .order_by(self.sort(self.sort_key))
                            .skip(self.offset)
                            .limit(self.count)
                            .run(conn)
                        )

                        pkg_count = (
                            base
                            .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                            .count()
                            .run(conn)
                        )

                        return_status = (
                            GenericResults(
                                self.username, self.uri, self.method
                            ).information_retrieved(packages, pkg_count)
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
                        ).invalid_status(self.agent_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.agent_id, 'agents')
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

class RetrieveCustomAppsByAgentId(RetrieveAppsByAgentId):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 agent_id, uri=None, method=None,
                 count=30, offset=0, sort='asc',
                 sort_key=CustomAppsKey.Name,
                 show_hidden=NO):
        """
        """
        self.count = count
        self.uri = uri
        self.method = method
        self.offset = offset
        self.count = count
        self.sort = sort
        self.agent_id = agent_id
        self.username = username
        self.customer_name = customer_name
        self.CurrentAppsCollection = CustomAppsCollection
        self.CurrentAppsIndexes = CustomAppsIndexes
        self.CurrentAppsPerAgentCollection = CustomAppsPerAgentCollection
        self.CurrentAppsKey = CustomAppsKey
        self.CurrentAppsPerAgentKey = CustomAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = CustomAppsPerAgentIndexes

        self.pluck_list = (
            [
                self.CurrentAppsKey.AppId,
                self.CurrentAppsKey.Version,
                self.CurrentAppsKey.Name,
                self.CurrentAppsKey.Hidden,
                self.CurrentAppsPerAgentKey.Update,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.RebootRequired,
                self.CurrentAppsKey.RvSeverity,
                self.CurrentAppsKey.FilesDownloadStatus,
                self.CurrentAppsPerAgentKey.Dependencies,
                self.CurrentAppsPerAgentKey.InstallDate,
                self.CurrentAppsPerAgentKey.Status,
                self.CurrentAppsPerAgentKey.Update,
            ]
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Hidden: r.row[self.CurrentAppsKey.Hidden],
                self.CurrentAppsPerAgentKey.Update: r.row[self.CurrentAppsPerAgentKey.Update],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.RebootRequired: r.row[self.CurrentAppsKey.RebootRequired],
                self.CurrentAppsKey.FilesDownloadStatus: r.row[self.CurrentAppsKey.FilesDownloadStatus],
                self.CurrentAppsPerAgentKey.Dependencies: r.row[self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsPerAgentKey.InstallDate: r.row[self.CurrentAppsPerAgentKey.InstallDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Status: r.row[self.CurrentAppsPerAgentKey.Status],
                self.CurrentAppsPerAgentKey.Update: r.row[self.CurrentAppsPerAgentKey.Update],
            }
        )

        if show_hidden in ValidHiddenVals:
            self.show_hidden = show_hidden
        else:
            self.show_hidden = NO

        if sort_key in self.pluck_list:
            self.sort_key = sort_key
        else:
            self.sort_key = self.CurrentAppsKey.Name

        if sort == 'asc':
            self.sort = r.asc
        else:
            self.sort = r.desc


class RetrieveSupportedAppsByAgentId(RetrieveAppsByAgentId):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 agent_id, uri=None, method=None,
                 count=30, offset=0, sort='asc',
                 sort_key=SupportedAppsKey.Name,
                 show_hidden=NO):
        """
        """
        self.count = count
        self.uri = uri
        self.method = method
        self.offset = offset
        self.count = count
        self.sort = sort
        self.agent_id = agent_id
        self.username = username
        self.customer_name = customer_name
        self.CurrentAppsCollection = SupportedAppsCollection
        self.CurrentAppsIndexes = SupportedAppsIndexes
        self.CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
        self.CurrentAppsKey = SupportedAppsKey
        self.CurrentAppsPerAgentKey = SupportedAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = SupportedAppsPerAgentIndexes

        self.pluck_list = (
            [
                self.CurrentAppsKey.AppId,
                self.CurrentAppsKey.Version,
                self.CurrentAppsKey.Name,
                self.CurrentAppsKey.Hidden,
                self.CurrentAppsPerAgentKey.Update,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.RebootRequired,
                self.CurrentAppsKey.RvSeverity,
                self.CurrentAppsKey.FilesDownloadStatus,
                self.CurrentAppsPerAgentKey.Dependencies,
                self.CurrentAppsPerAgentKey.InstallDate,
                self.CurrentAppsPerAgentKey.Status,
                self.CurrentAppsPerAgentKey.Update,
            ]
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Hidden: r.row[self.CurrentAppsKey.Hidden],
                self.CurrentAppsPerAgentKey.Update: r.row[self.CurrentAppsPerAgentKey.Update],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.RebootRequired: r.row[self.CurrentAppsKey.RebootRequired],
                self.CurrentAppsKey.FilesDownloadStatus: r.row[self.CurrentAppsKey.FilesDownloadStatus],
                self.CurrentAppsPerAgentKey.Dependencies: r.row[self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsPerAgentKey.InstallDate: r.row[self.CurrentAppsPerAgentKey.InstallDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Status: r.row[self.CurrentAppsPerAgentKey.Status],
                self.CurrentAppsPerAgentKey.Update: r.row[self.CurrentAppsPerAgentKey.Update],
            }
        )

        if show_hidden in ValidHiddenVals:
            self.show_hidden = show_hidden
        else:
            self.show_hidden = NO

        if sort_key in self.pluck_list:
            self.sort_key = sort_key
        else:
            self.sort_key = self.CurrentAppsKey.Name

        if sort == 'asc':
            self.sort = r.asc
        else:
            self.sort = r.desc


class RetrieveAgentAppsByAgentId(RetrieveAppsByAgentId):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 agent_id, uri=None, method=None,
                 count=30, offset=0, sort='asc',
                 sort_key=AgentAppsKey.Name,
                 show_hidden=NO):

        self.count = count
        self.uri = uri
        self.method = method
        self.offset = offset
        self.count = count
        self.sort = sort
        self.agent_id = agent_id
        self.username = username
        self.customer_name = customer_name
        self.CurrentAppsCollection = AgentAppsCollection
        self.CurrentAppsIndexes = AgentAppsIndexes
        self.CurrentAppsPerAgentCollection = AgentAppsPerAgentCollection
        self.CurrentAppsKey = AgentAppsKey
        self.CurrentAppsPerAgentKey = AgentAppsPerAgentKey
        self.CurrentAppsPerAgentIndexes = AgentAppsPerAgentIndexes

        self.pluck_list = (
            [
                self.CurrentAppsKey.AppId,
                self.CurrentAppsKey.Version,
                self.CurrentAppsKey.Name,
                self.CurrentAppsKey.Hidden,
                self.CurrentAppsPerAgentKey.Update,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.RebootRequired,
                self.CurrentAppsKey.RvSeverity,
                self.CurrentAppsKey.FilesDownloadStatus,
                self.CurrentAppsPerAgentKey.Dependencies,
                self.CurrentAppsPerAgentKey.InstallDate,
                self.CurrentAppsPerAgentKey.Status,
                self.CurrentAppsPerAgentKey.Update,
            ]
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Hidden: r.row[self.CurrentAppsKey.Hidden],
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.RebootRequired: r.row[self.CurrentAppsKey.RebootRequired],
                self.CurrentAppsKey.FilesDownloadStatus: r.row[self.CurrentAppsKey.FilesDownloadStatus],
                self.CurrentAppsPerAgentKey.Update: r.row[self.CurrentAppsPerAgentKey.Update],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Dependencies: r.row[self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsPerAgentKey.InstallDate: r.row[self.CurrentAppsPerAgentKey.InstallDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Status: r.row[self.CurrentAppsPerAgentKey.Status],
                self.CurrentAppsPerAgentKey.Update: r.row[self.CurrentAppsPerAgentKey.Update],
            }
        )

        if show_hidden in ValidHiddenVals:
            self.show_hidden = show_hidden
        else:
            self.show_hidden = NO

        if sort_key in self.pluck_list:
            self.sort_key = sort_key
        else:
            self.sort_key = self.CurrentAppsKey.Name

        if sort == 'asc':
            self.sort = r.asc
        else:
            self.sort = r.desc

