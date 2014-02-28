from db.client import db_create_close, r
from plugins.patching import *
from agent import *
from errorz.error_messages import GenericResults, PackageResults

import logging
import logging.config

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


@db_create_close
def get_all_stats_by_appid(username, customer_name,
                          uri, method, app_id, conn=None):
    data = []
    try:
        apps = (
            r
            .table(AgentAppsPerAgentCollection)
            .get_all(
                [app_id, customer_name],
                index=AgentAppsPerAgentIndexes.AppIdAndCustomer
            )
            .group_by(AgentAppsPerAgentKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        AgentAppsPerAgentKey.Status: i['group'][AgentAppsPerAgentKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][AgentAppsPerAgentKey.Status].capitalize()
                    }
                )
                data.append(new_data)

        statuses = map(lambda x: x['status'], data)
        difference = set(ValidPackageStatuses).difference(statuses)
        if len(difference) > 0:
            for status in difference:
                status = {
                    COUNT: 0,
                    STATUS: status,
                    NAME: status.capitalize()
                }
                data.append(status)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

        logger.info(results)

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('getting_pkg_stats', 'updates', e)
        )

        logger.info(results)

    return(results)


@db_create_close
def get_all_agents_per_appid(username, customer_name,
                            uri, method, app_id, conn=None):
    data = []
    try:
        agents = (
            r
            .table(AgentAppsPerAgentCollection)
            .get_all(app_id, index=AgentAppsPerAgentKey.AppId)
            .eq_join(AgentAppsPerAgentKey.AgentId, r.table(AgentsCollection))
            .zip()
            .grouped_map_reduce(
                lambda x: x[AgentAppsPerAgentKey.Status],
                lambda x: {
                    AGENTS:
                    [
                        {
                            AgentKey.ComputerName: x[AgentKey.ComputerName],
                            AgentKey.DisplayName: x[AgentKey.DisplayName],
                            AgentAppsPerAgentKey.AgentId: x[AgentAppsPerAgentKey.AgentId]
                        }
                    ],
                    COUNT: 1
                },
                lambda x, y: {
                    AGENTS: x[AGENTS] + y[AGENTS],
                    COUNT: x[COUNT] + y[COUNT]
                }
            ).run(conn)
        )
        if agents:
            for i in agents:
                new_data = i['reduction']
                new_data[AgentAppsPerAgentKey.Status] = i['group']
                data.append(new_data)

        statuses = map(lambda x: x['status'], data)
        difference = set(ValidPackageStatuses).difference(statuses)
        if len(difference) > 0:
            for status in difference:
                status = {
                    COUNT: 0,
                    AGENTS: [],
                    STATUS: status
                }
                data.append(status)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

        logger.info(results)

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('getting_pkg_stats', 'updates', e)
        )

        logger.info(results)

    return(results)


@db_create_close
def get_all_stats_by_agentid(username, customer_name,
                              uri, method, agent_id, conn=None):
    data = []
    try:
        apps = (
            r
            .table(AgentAppsPerAgentCollection)
            .get_all(agent_id, index=AgentAppsPerAgentKey.AgentId)
            .group_by(AgentAppsPerAgentKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        AgentAppsPerAgentKey.Status: i['group'][AgentAppsPerAgentKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][AgentAppsPerAgentKey.Status].capitalize()
                    }
                )
                data.append(new_data)

        statuses = map(lambda x: x['status'], data)
        difference = set(ValidPackageStatuses).difference(statuses)
        if len(difference) > 0:
            for status in difference:
                status = {
                    COUNT: 0,
                    STATUS: status,
                    NAME: status.capitalize()
                }
                data.append(status)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

        logger.info(results)

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('getting_pkg_stats', 'updates', e)
        )
        logger.info(results)

    return(results)

@db_create_close
def get_all_stats_by_tagid(username, customer_name,
                           uri, method, tag_id, conn=None):
    data = []
    try:
        apps = (
            r
            .table(AgentAppsPerTagCollection)
            .get_all(tag_id, index=AgentAppsPerTagKey.TagId)
            .group_by(AgentAppsPerTagKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        AgentAppsPerTagKey.Status: i['group'][AgentAppsPerTagKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][AgentAppsPerTagKey.Status].capitalize()
                    }
                )
                data.append(new_data)

        statuses = map(lambda x: x['status'], data)
        difference = set(ValidPackageStatuses).difference(statuses)
        if len(difference) > 0:
            for status in difference:
                status = {
                    COUNT: 0,
                    STATUS: status,
                    NAME: status.capitalize()
                }
                data.append(status)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

        logger.info(results)

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('getting_pkg_stats', 'updates', e)
        )
        logger.info(results)

    return(results)

@db_create_close
def insert_into_agent_apps(customer_name, app, conn=None):

    table=AgentAppsCollection

    exists = []
    try:
        exists = (
            r
            .table(table)
            .get(app[AgentAppsKey.AppId])
            .run(conn)
        )

    except Exception as e:
        msg = (
            'Failed to get unique app_id %s, error: %s' %
            (app[AppsKey.AppId], e)
        )
        logger.error(e)

    status = app.pop(AppsPerAgentKey.Status)
    if exists:

        if len(app[AppsKey.FileData]) > 0 and status == AVAILABLE:
            app[AppsKey.FileData] = (
                unique_uris(
                    uris=app[AppsKey.FileData],
                    orig_uris=exists[AppsKey.FileData],
                )
            )

        try:
            (
                r
                .table(table)
                .get(app[AppsKey.AppId])
                .update({AppsKey.FileData: app[AppsKey.FileData]})
                .run(conn, no_reply=True)
            )

        except Exception as e:
            msg = (
                'Failed to update unique_applications with %s, error: %s' %
                (app[AppsKey.AppId], e)
            )
            logger.error(msg)

    else:

        if (len(app[AppsKey.FileData]) > 0 and status == AVAILABLE or
                len(app[AppsKey.FileData]) > 0 and status == INSTALLED):
            app[AppsKey.FilesDownloadStatus] = PackageCodes.FilePendingDownload

            app[AppsKey.FileData] = (
                unique_uris(
                    uris=app[AppsKey.FileData],
                    orig_uris=app[AppsKey.FileData]
                )
            )
        elif len(app[AppsKey.FileData]) == 0 and status == AVAILABLE:
            app[AppsKey.FilesDownloadStatus] = PackageCodes.MissingUri

        elif len(app[AppsKey.FileData]) == 0 and status == INSTALLED:
            app[AppsKey.FilesDownloadStatus] = PackageCodes.FileNotRequired

        try:
            (
                r
                .table(AppsCollection)
                .insert(app)
                .run(conn, no_reply=True)
            )

        except Exception as e:
            msg = (
                'Failed to insert %s into unique_applications, error: %s' %
                (app[AppsKey.AppId], e)
            )
            logger.exception(msg)

    return(app)


@db_create_close
def add_or_update_applications(table=AppsPerAgentCollection, pkg_list=[],
                               delete_afterwards=True, conn=None):
    completed = False
    inserted_count = 0
    updated = None
    replaced_count = 0
    deleted_count = 0
    pkg_count = len(pkg_list)
    last_modified_time = mktime(datetime.now().timetuple())
    if pkg_count > 0:
        for pkg in pkg_list:
            pkg['last_modified_time'] = r.epoch_time(last_modified_time)

            try:
                updated = (
                    r
                    .table(table)
                    .insert(pkg, upsert=True)
                    .run(conn)
                )
                logger.info(updated)
                inserted_count += updated['inserted']
                replaced_count += updated['replaced']

            except Exception as e:
                logger.exception(e)

        try:
            if delete_afterwards:
                deleted = (
                    r
                    .table(table)
                    .get_all(
                        pkg[AppsPerAgentKey.AgentId],
                        index=AppsPerAgentIndexes.AgentId
                    )
                    .filter(
                        r.row['last_modified_time'] < r.epoch_time(
                            last_modified_time)
                    )
                    .delete()
                    .run(conn)
                )
                deleted_count += deleted['deleted']
        except Exception as e:
            logger.exception(e)

    return(
        {
            'pass': completed,
            'inserted': inserted_count,
            'replaced': replaced_count,
            'deleted': deleted_count,
            'pkg_count': pkg_count,
        }
    )

