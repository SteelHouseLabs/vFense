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
                           uri, method, app_id,
                           table=AppsPerAgentCollection,
                           conn=None):

    if table == AppsPerAgentCollection:
        CurrentAppsPerAgentCollection = AppsPerAgentCollection
        CurrentAppsPerAgentKey = AppsPerAgentKey
        CurrentAppsPerAgentIndexes = AppsPerAgentIndexes

    elif table == SupportedAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
        CurrentAppsPerAgentKey = SupportedAppsPerAgentKey
        CurrentAppsPerAgentIndexes = SupportedAppsPerAgentIndexes

    elif table == CustomAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = CustomAppsPerAgentCollection
        CurrentAppsPerAgentKey = CustomAppsPerAgentKey
        CurrentAppsPerAgentIndexes = CustomAppsPerAgentIndexes

    elif table == AgentAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = AgentAppsPerAgentCollection
        CurrentAppsPerAgentKey = AgentAppsPerAgentKey
        CurrentAppsPerAgentIndexes = AgentAppsPerAgentIndexes

    try:
        data = []
        apps = (
            r
            .table(CurrentAppsPerAgentCollection)
            .get_all(
                [app_id, customer_name],
                index=CurrentAppsPerAgentIndexes.AppIdAndCustomer
            )
            .group_by(CurrentAppsPerAgentKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        CurrentAppsPerAgentKey.Status: i['group'][CurrentAppsPerAgentKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][CurrentAppsPerAgentKey.Status].capitalize()
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
                             uri, method, app_id,
                             table=AppsPerAgentCollection,
                             conn=None):

    if table == AppsPerAgentCollection:
        CurrentAppsPerAgentCollection = AppsPerAgentCollection
        CurrentAppsPerAgentKey = AppsPerAgentKey

    elif table == SupportedAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
        CurrentAppsPerAgentKey = SupportedAppsPerAgentKey

    elif table == CustomAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = CustomAppsPerAgentCollection
        CurrentAppsPerAgentKey = CustomAppsPerAgentKey

    elif table == AgentAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = AgentAppsPerAgentCollection
        CurrentAppsPerAgentKey = AgentAppsPerAgentKey

    data = []
    try:
        data = []
        agents = (
            r
            .table(CurrentAppsPerAgentCollection)
            .get_all(app_id, index=CurrentAppsPerAgentKey.AppId)
            .eq_join(CurrentAppsPerAgentKey.AgentId, r.table(CurrentAgentsCollection))
            .zip()
            .grouped_map_reduce(
                lambda x: x[CurrentAppsPerAgentKey.Status],
                lambda x: {
                    AGENTS:
                    [
                        {
                            AgentKey.ComputerName: x[AgentKey.ComputerName],
                            AgentKey.DisplayName: x[AgentKey.DisplayName],
                            CurrentAppsPerAgentKey.AgentId: x[CurrentAppsPerAgentKey.AgentId]
                        }
                    ],
                    COUNT: 1
                },
                lambda x, y: {
                    AGENTS: x[AGENTS] + y[AGENTS],
                    COUNT: x[COUNT] + y[COUNT]
                }
            )
            .run(conn)
        )
        if agents:
            for i in agents:
                new_data = i['reduction']
                new_data[CurrentAppsPerAgentKey.Status] = i['group']
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
                             uri, method, agent_id,
                             table=AppsPerAgentCollection,
                             conn=None):

    if table == AppsPerAgentCollection:
        CurrentAppsPerAgentCollection = AppsPerAgentCollection
        CurrentAppsPerAgentKey = AppsPerAgentKey

    elif table == SupportedAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
        CurrentAppsPerAgentKey = SupportedAppsPerAgentKey

    elif table == CustomAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = CustomAppsPerAgentCollection
        CurrentAppsPerAgentKey = CustomAppsPerAgentKey

    elif table == AgentAppsPerAgentCollection:
        CurrentAppsPerAgentCollection = AgentAppsPerAgentCollection
        CurrentAppsPerAgentKey = AgentAppsPerAgentKey

    try:
        data = []
        apps = (
            r
            .table(CurrentAppsPerAgentCollection)
            .get_all(agent_id, index=CurrentAppsPerAgentKey.AgentId)
            .group_by(CurrentAppsPerAgentKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        AppsPerAgentKey.Status: i['group'][CurrentAppsPerAgentKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][CurrentAppsPerAgentKey.Status].capitalize()
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
