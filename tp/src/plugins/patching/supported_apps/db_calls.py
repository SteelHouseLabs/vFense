from db.client import db_create_close, r
from plugins.patching import *
from agent import *
from agent.agents import get_all_agent_ids, get_agent_info
from errorz.error_messages import GenericResults, PackageResults
from plugins.patching.rv_db_calls import \
    apps_to_insert_per_agent, get_apps_data, get_app_data,\
    apps_to_insert_per_tag, update_file_data, get_file_data

import logging
import logging.config

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


def add_supported_app_to_agents(username, customer_name, uri, method, agent_id=None):

    if agent_id:
        agent_info = get_agent_info(agent_id)
        apps_info = (
            get_apps_data(
                customer_name,
                table=SupportedAppsCollection,
                os_code=agent_info[AgentKey.OsCode]
            )
        )
        if len(apps_info) > 0:
            for app_info in apps_info:
                app_id = app_info.get(SupportedAppsKey.AppId)
                file_data = get_file_data(app_id)
                update_file_data(
                    app_id,
                    agent_id, file_data
                )
                agent_info_to_insert = (
                    {
                        SupportedAppsPerAgentKey.AgentId: agent_id,
                        SupportedAppsPerAgentKey.AppId: app_id,
                        SupportedAppsPerAgentKey.Status: AVAILABLE,
                        SupportedAppsPerAgentKey.CustomerName: customer_name,
                        SupportedAppsPerAgentKey.InstallDate: r.epoch_time(0.0)
                    }
                )
                apps_to_insert_per_agent(
                    username, uri, method, agent_info_to_insert,
                    table=SupportedAppsPerAgentCollection
                )


@db_create_close
def get_all_stats_by_appid(username, customer_name,
                          uri, method, app_id, conn=None):
    data = []
    try:
        apps = (
            r
            .table(SupportedAppsPerAgentCollection)
            .get_all(
                [app_id, customer_name],
                index=SupportedAppsPerAgentIndexes.AppIdAndCustomer
            )
            .group_by(SupportedAppsPerAgentKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        SupportedAppsPerAgentKey.Status: i['group'][SupportedAppsPerAgentKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][SupportedAppsPerAgentKey.Status].capitalize()
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
            .table(SupportedAppsPerAgentCollection)
            .get_all(app_id, index=SupportedAppsPerAgentKey.AppId)
            .eq_join(SupportedAppsPerAgentKey.AgentId, r.table(AgentsCollection))
            .zip()
            .grouped_map_reduce(
                lambda x: x[SupportedAppsPerAgentKey.Status],
                lambda x: {
                    AGENTS:
                    [
                        {
                            AgentKey.ComputerName: x[AgentKey.ComputerName],
                            AgentKey.DisplayName: x[AgentKey.DisplayName],
                            SupportedAppsPerAgentKey.AgentId: x[SupportedAppsPerAgentKey.AgentId]
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
                new_data[SupportedAppsPerAgentKey.Status] = i['group']
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
            .table(SupportedAppsPerAgentCollection)
            .get_all(agent_id, index=SupportedAppsPerAgentKey.AgentId)
            .group_by(SupportedAppsPerAgentKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        SupportedAppsPerAgentKey.Status: i['group'][SupportedAppsPerAgentKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][SupportedAppsPerAgentKey.Status].capitalize()
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
            .table(SupportedAppsPerTagCollection)
            .get_all(tag_id, index=SupportedAppsPerTagKey.TagId)
            .group_by(SupportedAppsPerTagKey.Status, r.count)
            .run(conn)
        )
        if apps:
            for i in apps:
                new_data = i['reduction']
                new_data = (
                    {
                        SupportedAppsPerTagKey.Status: i['group'][SupportedAppsPerTagKey.Status],
                        COUNT: i['reduction'],
                        NAME: i['group'][SupportedAppsPerTagKey.Status].capitalize()
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
