import logging
from agent import *
from db.client import r
from plugins.patching import *
from agent.agents import get_all_agent_ids, get_agent_info
from tagging import *
from tagging.tagManager import get_tag_ids_by_agent_id
from plugins.patching.rv_db_calls import \
    apps_to_insert_per_agent, get_apps_data, get_app_data,\
    apps_to_insert_per_tag, update_file_data, get_file_data

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


def add_custom_app_to_agents(username, customer_name, uri, method,
                             file_data, agent_id=None, app_id=None):

    if app_id and not agent_id:
        app_info = (
            get_app_data(
                app_id, table=CustomAppsCollection
            )
        )

        agent_ids = get_all_agent_ids(customer_name, agent_os=app_info[AgentKey.OsCode])
        if len(agent_ids) > 0:
            for agentid in agent_ids:
                update_file_data(app_id, agentid, file_data)
                agent_info_to_insert = (
                    {
                        CustomAppsPerAgentKey.AgentId: agentid,
                        CustomAppsPerAgentKey.AppId: app_id,
                        CustomAppsPerAgentKey.Status: AVAILABLE,
                        CustomAppsPerAgentKey.CustomerName: customer_name,
                        CustomAppsPerAgentKey.InstallDate: r.epoch_time(0.0)
                    }
                )
                apps_to_insert_per_agent(username, uri, method, agent_info_to_insert)

    if agent_id and not app_id:
        agent_info = get_agent_info(agent_id)
        apps_info = get_apps_data(customer_name, os_code=agent_info[AgentKey.OsCode])
        if len(apps_info) > 0:
            for app_info in apps_info:
                app_id = app_info.get(CustomAppsKey.AppId)
                file_data = get_file_data(app_id)
                update_file_data(
                    app_id,
                    agent_id, file_data
                )
                agent_info_to_insert = (
                    {
                        CustomAppsPerAgentKey.AgentId: agent_id,
                        CustomAppsPerAgentKey.AppId: app_id,
                        CustomAppsPerAgentKey.Status: AVAILABLE,
                        CustomAppsPerAgentKey.CustomerName: customer_name,
                        CustomAppsPerAgentKey.InstallDate: r.epoch_time(0.0)
                    }
                )
                apps_to_insert_per_agent(username, uri, method, agent_info_to_insert)
