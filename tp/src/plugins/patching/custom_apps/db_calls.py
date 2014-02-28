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
            .table(CustomAppsPerAgentCollection)
            .get_all(
                [app_id, customer_name],
                index=CustomAppsPerAgentIndexes.AppIdAndCustomer
            )
            .group_by(CustomAppsPerAgentKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        CustomAppsPerAgentKey.Status: i['group'][CustomAppsPerAgentKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][CustomAppsPerAgentKey.Status].capitalize()
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
            .table(CustomAppsPerAgentCollection)
            .get_all(app_id, index=CustomAppsPerAgentKey.AppId)
            .eq_join(CustomAppsPerAgentKey.AgentId, r.table(AgentsCollection))
            .zip()
            .grouped_map_reduce(
                lambda x: x[CustomAppsPerAgentKey.Status],
                lambda x: {
                    AGENTS:
                    [
                        {
                            AgentKey.ComputerName: x[AgentKey.ComputerName],
                            AgentKey.DisplayName: x[AgentKey.DisplayName],
                            CustomAppsPerAgentKey.AgentId: x[CustomAppsPerAgentKey.AgentId]
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
                new_data[CustomAppsPerAgentKey.Status] = i['group']
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
            .table(CustomAppsPerAgentCollection)
            .get_all(agent_id, index=CustomAppsPerAgentKey.AgentId)
            .group_by(CustomAppsPerAgentKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        CustomAppsPerAgentKey.Status: i['group'][CustomAppsPerAgentKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][CustomAppsPerAgentKey.Status].capitalize()
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
            .table(CustomAppsPerTagCollection)
            .get_all(tag_id, index=CustomAppsPerTagKey.TagId)
            .group_by(CustomAppsPerTagKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        CustomAppsPerTagKey.Status: i['group'][CustomAppsPerTagKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][CustomAppsPerTagKey.Status].capitalize()
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
