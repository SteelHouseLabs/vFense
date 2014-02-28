import logging
import logging.config

from datetime import datetime
from db.client import db_create_close, r
from plugins.patching import *
from agent import *
from tagging import *
from tagging.tagManager import tag_exists
from errorz.error_messages import GenericResults, PackageResults

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

class RetrieveAppsByTagId(object):
    """
        This class is used to get tag data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 tag_id, uri=None, method=None,
                 count=30, offset=0, sort='asc',
                 sort_key=AppsKey.Name,
                 show_hidden=NO):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.tag_id = tag_id
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
                self.CurrentAppsKey.Hidden,
                self.CurrentAppsPerAgentKey.Update,
                self.CurrentAppsPerAgentKey.Dependencies,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.RebootRequired,
                self.CurrentAppsPerAgentKey.InstallDate,
                self.CurrentAppsPerAgentKey.Status,
                self.CurrentAppsKey.RvSeverity,
                self.CurrentAppsKey.FilesDownloadStatus,
            ]
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row['right'][self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row['right'][self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row['right'][self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Hidden: r.row['right'][self.CurrentAppsKey.Hidden],
                self.CurrentAppsPerAgentKey.Update: r.row['left']['right'][self.CurrentAppsPerAgentKey.Update],
                self.CurrentAppsKey.ReleaseDate: r.row['right'][self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.InstallDate: r.row['left']['right'][self.CurrentAppsPerAgentKey.InstallDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Status: r.row['left']['right'][self.CurrentAppsPerAgentKey.Status],
                self.CurrentAppsPerAgentKey.Dependencies: r.row['left']['right'][self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsKey.RvSeverity: r.row['right'][self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.RebootRequired: r.row['right'][self.CurrentAppsKey.RebootRequired],
                self.CurrentAppsKey.FilesDownloadStatus: r.row['right'][self.CurrentAppsKey.FilesDownloadStatus],
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
            tag = tag_exists(self.tag_id)
            if tag:
                if pkg_status in ValidPackageStatuses:
                    base = (
                        r
                        .table(TagsPerAgentCollection, use_outdated=True)
                        .get_all(self.tag_id, index=TagsPerAgentIndexes.TagId)
                        .pluck(TagsPerAgentKey.AgentId)
                        .eq_join(
                            lambda x: [
                                pkg_status,
                                x[self.CurrentAppsPerAgentKey.AgentId]
                            ],
                            r.table(self.CurrentAppsPerAgentCollection),
                            index=self.CurrentAppsPerAgentIndexes.StatusAndAgentId
                        )
                        .eq_join(
                            lambda y:
                            y['right'][self.CurrentAppsKey.AppId],
                            r.table(self.CurrentAppsCollection)
                        )
                        .map(self.map_hash)
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
                        ).invalid_status(self.tag_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.tag_id, 'tags')
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
            tag = tag_exists(self.tag_id)
            if tag:
                if pkg_status in ValidPackageStatuses:
                    base = (
                        r
                        .table(TagsPerAgentCollection, use_outdated=True)
                        .get_all(self.tag_id, index=TagsPerAgentIndexes.TagId)
                        .pluck(TagsPerAgentKey.AgentId)
                        .eq_join(
                            lambda x: [
                                pkg_status,
                                x[self.CurrentAppsPerAgentKey.AgentId]
                            ],
                            r.table(self.CurrentAppsPerAgentCollection),
                            index=self.CurrentAppsPerAgentIndexes.StatusAndAgentId
                        )
                        .eq_join(lambda y: y['right'][self.CurrentAppsKey.AppId], r.table(self.CurrentAppsCollection))
                        .map(self.map_hash)
                    )
                    if self.show_hidden == NO:
                        base = base.filter({self.CurrentAppsKey.Hidden: NO})

                    packages = list(
                        base
                        .filter(lambda z: z[self.CurrentAppsKey.Name].match("(?i)"+name))
                        .distinct()
                        .order_by(self.sort(self.sort_key))
                        .skip(self.offset)
                        .limit(self.count)
                        .run(conn)
                    )

                    pkg_count = (
                        base
                        .filter(lambda x: x[self.CurrentAppsKey.Name].match("(?i)"+name))
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
                        ).invalid_status(self.tag_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.tag_id, 'tags')
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
            tag = tag_exists(self.tag_id)
            if tag:
                base = (
                    r
                    .table(TagsPerAgentCollection, use_outdated=True)
                    .get_all(self.tag_id, index=TagsPerAgentIndexes.TagId)
                    .pluck(TagsPerAgentKey.AgentId)
                    .eq_join(
                        self.CurrentAppsPerAgentIndexes.AgentId,
                        r.table(self.CurrentAppsPerAgentCollection),
                        index=self.CurrentAppsPerAgentIndexes.AgentId
                    )
                    .eq_join(lambda y: y['right'][self.CurrentAppsKey.AppId], r.table(self.CurrentAppsCollection))
                    .map(self.map_hash)
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
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.tag_id, 'tags')
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
            tag = tag_exists(self.tag_id)
            if tag:
                if pkg_status in ValidPackageStatuses:
                    if sev in ValidRvSeverities:
                        base = (
                            r
                            .table(TagsPerAgentCollection, use_outdated=True)
                            .get_all(self.tag_id, index=TagsPerAgentIndexes.TagId)
                            .pluck(TagsPerAgentKey.AgentId)
                            .eq_join(
                                lambda x: [
                                    pkg_status,
                                    x[self.CurrentAppsPerAgentKey.AgentId]
                                ],
                                r.table(self.CurrentAppsPerAgentCollection),
                                index=self.CurrentAppsPerAgentIndexes.StatusAndAgentId
                            )
                            .eq_join(lambda y: y['right'][self.CurrentAppsKey.AppId], r.table(self.CurrentAppsCollection))
                            .map(self.map_hash)
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
                            .filter(
                                (r.row[self.CurrentAppsKey.RvSeverity] == sev)
                                &
                                (r.row[self.CurrentAppsKey.Name].match("(?i)"+name))
                            )
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
                        ).invalid_status(self.tag_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.tag_id, 'tags')
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
            tag = tag_exists(self.tag_id)
            if tag:
                if sev in ValidRvSeverities:
                    base = (
                        r
                        .table(TagsPerAgentCollection, use_outdated=True)
                        .get_all(self.tag_id, index=TagsPerAgentIndexes.TagId)
                        .pluck(TagsPerAgentKey.AgentId)
                        .eq_join(
                            self.CurrentAppsPerAgentIndexes.AgentId,
                            r.table(self.CurrentAppsPerAgentCollection),
                            index=self.CurrentAppsPerAgentIndexes.AgentId
                        )
                        .eq_join(lambda y: y['right'][self.CurrentAppsKey.AppId], r.table(self.CurrentAppsCollection))
                        .map(self.map_hash)
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
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.tag_id, 'tags')
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
            tag = tag_exists(self.tag_id)
            if tag:
                if sev in ValidRvSeverities:
                    base = (
                        r
                        .table(TagsPerAgentCollection, use_outdated=True)
                        .get_all(self.tag_id, index=TagsPerAgentIndexes.TagId)
                        .pluck(TagsPerAgentKey.AgentId)
                        .eq_join(
                            self.CurrentAppsPerAgentIndexes.AgentId,
                            r.table(self.CurrentAppsPerAgentCollection),
                            index=self.CurrentAppsPerAgentIndexes.AgentId
                        )
                        .eq_join(lambda y: y['right'][self.CurrentAppsKey.AppId], r.table(self.CurrentAppsCollection))
                        .map(self.map_hash)
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
                        .filter(
                            (r.row[self.CurrentAppsKey.RvSeverity] == sev)
                            &
                            (r.row[self.CurrentAppsKey.Name].match("(?i)"+name))
                        )
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
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.tag_id, 'agents')
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
            tag = tag_exists(self.tag_id)
            if tag:
                if pkg_status in ValidPackageStatuses:
                    if sev in ValidRvSeverities:
                        base = (
                            r
                            .table(TagsPerAgentCollection, use_outdated=True)
                            .get_all(self.tag_id, index=TagsPerAgentIndexes.TagId)
                            .pluck(TagsPerAgentKey.AgentId)
                            .eq_join(
                                lambda x: [
                                    pkg_status,
                                    x[self.CurrentAppsPerAgentKey.AgentId]
                                ],
                                r.table(self.CurrentAppsPerAgentCollection),
                                index=self.CurrentAppsPerAgentIndexes.StatusAndAgentId
                            )
                            .eq_join(lambda y: y['right'][self.CurrentAppsKey.AppId], r.table(self.CurrentAppsCollection))
                            .map(self.map_hash)
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
                        ).invalid_status(self.tag_id, pkg_status)
                    )

            else:
                return_status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(self.tag_id, 'tags')
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


class RetrieveCustomAppsByTagId(RetrieveAppsByTagId):
    """
        This class is used to get tag data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 tag_id, uri=None, method=None,
                 count=30, offset=0, sort='asc',
                 sort_key=CustomAppsKey.Name,
                 show_hidden=NO):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.tag_id = tag_id
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
                self.CurrentAppsPerAgentKey.Dependencies,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.RebootRequired,
                self.CurrentAppsPerAgentKey.InstallDate,
                self.CurrentAppsPerAgentKey.Status,
                self.CurrentAppsKey.RvSeverity,
                self.CurrentAppsKey.FilesDownloadStatus,
            ]
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row['right'][self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row['right'][self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row['right'][self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Hidden: r.row['right'][self.CurrentAppsKey.Hidden],
                self.CurrentAppsPerAgentKey.Update: r.row['left']['right'][self.CurrentAppsPerAgentKey.Update],
                self.CurrentAppsPerAgentKey.Dependencies: r.row['left']['right'][self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsKey.ReleaseDate: r.row['right'][self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.InstallDate: r.row['left']['right'][self.CurrentAppsPerAgentKey.InstallDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Status: r.row['left']['right'][self.CurrentAppsPerAgentKey.Status],
                self.CurrentAppsKey.RvSeverity: r.row['right'][self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.RebootRequired: r.row['right'][self.CurrentAppsKey.RebootRequired],
                self.CurrentAppsKey.FilesDownloadStatus: r.row['right'][self.CurrentAppsKey.FilesDownloadStatus],
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


class RetrieveSupportedAppsByTagId(RetrieveAppsByTagId):
    """
        This class is used to get tag data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 tag_id, uri=None, method=None,
                 count=30, offset=0, sort='asc',
                 sort_key=SupportedAppsKey.Name,
                 show_hidden=NO):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.tag_id = tag_id
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
                self.CurrentAppsPerAgentKey.Dependencies,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.RebootRequired,
                self.CurrentAppsPerAgentKey.InstallDate,
                self.CurrentAppsPerAgentKey.Status,
                self.CurrentAppsKey.RvSeverity,
                self.CurrentAppsKey.FilesDownloadStatus,
            ]
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row['right'][self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row['right'][self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row['right'][self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Hidden: r.row['right'][self.CurrentAppsKey.Hidden],
                self.CurrentAppsPerAgentKey.Update: r.row['left']['right'][self.CurrentAppsPerAgentKey.Update],
                self.CurrentAppsPerAgentKey.Dependencies: r.row['left']['right'][self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsKey.ReleaseDate: r.row['right'][self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.InstallDate: r.row['left']['right'][self.CurrentAppsPerAgentKey.InstallDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Status: r.row['left']['right'][self.CurrentAppsPerAgentKey.Status],
                self.CurrentAppsKey.RvSeverity: r.row['right'][self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.RebootRequired: r.row['right'][self.CurrentAppsKey.RebootRequired],
                self.CurrentAppsKey.FilesDownloadStatus: r.row['right'][self.CurrentAppsKey.FilesDownloadStatus],
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


class RetrieveAgentAppsByTagId(RetrieveAppsByTagId):
    """
        This class is used to get tag data from within the Packages Page
    """
    def __init__(self, username, customer_name,
                 tag_id, uri=None, method=None,
                 count=30, offset=0, sort='asc',
                 sort_key=AgentAppsKey.Name,
                 show_hidden=NO):
        """
        """
        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.tag_id = tag_id
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
                self.CurrentAppsPerAgentKey.Dependencies,
                self.CurrentAppsKey.ReleaseDate,
                self.CurrentAppsKey.RebootRequired,
                self.CurrentAppsPerAgentKey.InstallDate,
                self.CurrentAppsPerAgentKey.Status,
                self.CurrentAppsKey.RvSeverity,
                self.CurrentAppsKey.FilesDownloadStatus,
            ]
        )

        self.map_hash = (
            {
                self.CurrentAppsKey.AppId: r.row['right'][self.CurrentAppsKey.AppId],
                self.CurrentAppsKey.Version: r.row['right'][self.CurrentAppsKey.Version],
                self.CurrentAppsKey.Name: r.row['right'][self.CurrentAppsKey.Name],
                self.CurrentAppsKey.Hidden: r.row['right'][self.CurrentAppsKey.Hidden],
                self.CurrentAppsPerAgentKey.Update: r.row['left']['right'][self.CurrentAppsPerAgentKey.Update],
                self.CurrentAppsPerAgentKey.Dependencies: r.row['left']['right'][self.CurrentAppsPerAgentKey.Dependencies],
                self.CurrentAppsKey.ReleaseDate: r.row['right'][self.CurrentAppsKey.ReleaseDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.InstallDate: r.row['left']['right'][self.CurrentAppsPerAgentKey.InstallDate].to_epoch_time(),
                self.CurrentAppsPerAgentKey.Status: r.row['left']['right'][self.CurrentAppsPerAgentKey.Status],
                self.CurrentAppsKey.RvSeverity: r.row['right'][self.CurrentAppsKey.RvSeverity],
                self.CurrentAppsKey.RebootRequired: r.row['right'][self.CurrentAppsKey.RebootRequired],
                self.CurrentAppsKey.FilesDownloadStatus: r.row['right'][self.CurrentAppsKey.FilesDownloadStatus],
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

