import logging
import logging.config

from db.client import db_create_close, r
from plugins.patching import *
from agent import *
from errorz.error_messages import GenericResults, PackageResults

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class RetrieveApps(object):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 uri=None, method=None, count=30,
                 offset=0, sort='asc', sort_key=AppsKey.Name,
                 show_hidden=NO):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method

        self.set_global_properties(AppsCollection, AppsIndexes, 
            AppsPerAgentCollection, AppsKey, AppsPerAgentKey,
            AppsPerAgentIndexes
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

    def set_global_properties(self, apps_collection, apps_indexes,
                              apps_per_agent_collection, apps_key,
                              apps_per_agent_key, apps_per_agent_indexes):
        """ Set the global properties. """

        self.CurrentAppsCollection = apps_collection
        self.CurrentAppsIndexes = apps_indexes
        self.CurrentAppsPerAgentCollection = apps_per_agent_collection
        self.CurrentAppsKey = apps_key
        self.CurrentAppsPerAgentKey = apps_per_agent_key
        self.CurrentAppsPerAgentIndexes = apps_per_agent_indexes

        self.joined_map_hash = (
            {                                                                                                                                                      
                self.CurrentAppsKey.AppId: r.row['right'][self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row['right'][self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row['right'][self.CurrentAppsKey.Name],
                self.CurrentAppsKey.ReleaseDate: r.row['right'][self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row['right'][self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.Hidden: r.row['right'][self.CurrentAppsKey.Hidden],
            }
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row[self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row[self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row[self.CurrentAppsKey.Name],
                self.CurrentAppsKey.ReleaseDate: r.row[self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsKey.RvSeverity: r.row[self.CurrentAppsKey.RvSeverity],
            }
        )
        self.pluck_list = (
            [
                self.CurrentAppsKey.AppId,
                self.CurrentAppsKey.Version,
                self.CurrentAppsKey.Name,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.RvSeverity,
            ]
        )

    @db_create_close
    def filter_by_status(self, pkg_status, conn=None):
        try:
            if pkg_status in ValidPackageStatuses:
                base = (
                    r
                    .table(self.CurrentAppsPerAgentCollection, use_outdated=True)
                    .get_all(
                        [pkg_status, self.customer_name],
                        index=self.CurrentAppsPerAgentIndexes.StatusAndCustomer)
                    .eq_join(self.CurrentAppsKey.AppId, r.table(self.CurrentAppsCollection))
                    .map(self.joined_map_hash)
                )

                if self.show_hidden == NO:
                    base = base.filter({self.CurrentAppsKey.Hidden: NO})

                packages = list(
                    base
                    .distinct()
                    .order_by(self.sort(self.sort_key))
                    .skip(self.offset)
                    .limit(self.count)
                    .run(conn)
                )

                pkg_count = (
                    base
                    .pluck(self.CurrentAppsKey.AppId)
                    .distinct()
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
                    ).invalid_global_status(pkg_status)
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
            if sev in ValidRvSeverities:
                base = (
                    r
                    .table(self.CurrentAppsCollection)
                    .get_all(self.customer_name, sev, index=self.CurrentAppsIndexes.CustomerAndRvSeverity)
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
                    .pluck(self.pluck_list)
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
            if pkg_status in ValidPackageStatuses:
                if sev in ValidRvSeverities:
                    base = (
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            [pkg_status, self.customer_name],
                            index=self.CurrentAppsPerAgentIndexes.StatusAndCustomer
                        )
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AppId,
                            r.table(self.CurrentAppsCollection)
                        )
                        .map(self.joined_map_hash)
                    )

                    if self.show_hidden == NO:
                        base = base.filter({self.CurrentAppsKey.Hidden: NO})

                    packages = list(
                        base
                        .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                        .distinct()
                        .order_by(self.sort(self.sort_key))
                        .skip(self.offset)
                        .limit(self.count)
                        .run(conn)
                    )

                    pkg_count = (
                        base
                        .filter(r.row[self.CurrentAppsKey.RvSeverity] == sev)
                        .pluck(self.pluck_list)
                        .distinct()
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
                    ).invalid_global_status(pkg_status)
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
    def get_all_apps(self, conn=None):
        try:
            base = (
                r
                .table(self.CurrentAppsCollection)
                .get_all(self.customer_name, index=self.CurrentAppsIndexes.Customers)
            )

            if self.show_hidden == NO:
                base = base.filter({self.CurrentAppsKey.Hidden: NO})

            packages = list(
                base
                .order_by(self.sort(self.sort_key))
                .map(self.map_hash)
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
            base = (
                r
                .table(self.CurrentAppsCollection)
                .get_all(self.customer_name, index=self.CurrentAppsIndexes.Customers)
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
                .pluck(self.CurrentAppsKey.AppId)
                .count()
                .run(conn)
            )

            return_status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(packages, pkg_count)
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
            if pkg_status in ValidPackageStatuses:
                base = (
                    r
                    .table(self.CurrentAppsPerAgentCollection)
                    .get_all(
                        pkg_status, index=self.CurrentAppsPerAgentIndexes.Status
                    )
                    .eq_join(self.CurrentAppsPerAgentKey.AppId, r.table(self.CurrentAppsCollection))
                    .map(self.joined_map_hash)
                )

                if self.show_hidden == NO:
                    base = base.filter({self.CurrentAppsKey.Hidden: NO})

                packages = list(
                    base
                    .filter(lambda x: x[self.CurrentAppsKey.Name].match("(?i)"+name))
                    .distinct()
                    .order_by(self.sort(self.sort_key))
                    .skip(self.offset)
                    .limit(self.count)
                    .run(conn)
                )

                pkg_count = (
                    base
                    .filter(lambda x: x[self.CurrentAppsKey.Name].match("(?i)"+name))
                    .pluck(self.CurrentAppsKey.AppId)
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
                    ).invalid_global_status(pkg_status)
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
            if pkg_status in ValidPackageStatuses:
                if sev in ValidRvSeverities:
                    base = (
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            [pkg_status, self.customer_name],
                            index=self.CurrentAppsPerAgentIndexes.StatusAndCustomer
                        )
                        .eq_join(
                            self.CurrentAppsPerAgentKey.AppId,
                            r.table(self.CurrentAppsCollection)
                        )
                        .map(self.joined_map_hash)
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
                        .distinct()
                        .order_by(self.sort(self.sort_key))
                        .skip(self.offset)
                        .limit(self.count)
                        .run(conn)
                    )

                    pkg_count = (
                        base
                        .pluck(self.CurrentAppsKey.RvSeverity, self.CurrentAppsKey.Name)
                        .distinct()
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
                    ).invalid_global_status(pkg_status)
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


class RetrieveCustomApps(RetrieveApps):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 uri=None, method=None, count=30,
                 offset=0, sort='asc', sort_key=CustomAppsKey.Name,
                 show_hidden=NO):

        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method

        self.set_global_properties(CustomAppsCollection, CustomAppsIndexes, 
            CustomAppsPerAgentCollection, CustomAppsKey, CustomAppsPerAgentKey,
            CustomAppsPerAgentIndexes
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

class RetrieveSupportedApps(RetrieveApps):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 uri=None, method=None, count=30,
                 offset=0, sort='asc',
                 sort_key=SupportedAppsKey.Name,
                 show_hidden=NO):

        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method

        self.set_global_properties(SupportedAppsCollection, SupportedAppsIndexes, 
            SupportedAppsPerAgentCollection, SupportedAppsKey, SupportedAppsPerAgentKey,
            SupportedAppsPerAgentIndexes
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

class RetrieveAgentApps(RetrieveApps):
    """
        This class is used to get agent data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 uri=None, method=None, count=30,
                 offset=0, sort='asc',
                 sort_key=AgentAppsKey.Name,
                 show_hidden=NO):

        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method

        self.set_global_properties(AgentAppsCollection, AgentAppsIndexes, 
            AgentAppsPerAgentCollection, AgentAppsKey, AgentAppsPerAgentKey,
            AgentAppsPerAgentIndexes
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

