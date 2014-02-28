import logging

import redis
from rq import Connection, Queue

from agent.agents import get_agent_info
from plugins.patching.os_apps.incoming_updates import \
   incoming_packages_from_agent 
from plugins.patching.custom_apps.custom_apps import \
    add_custom_app_to_agents

from plugins.patching.supported_apps.syncer import \
    get_all_supported_apps_for_agent, get_all_agent_apps_for_agent

rq_host = 'localhost'
rq_port = 6379
rq_db = 0
rq_pool = redis.StrictRedis(host=rq_host, port=rq_port, db=rq_db)
logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class RvHandOff():

    def __init__(self, username, customer_name, uri, method,
                 agentid, rv_plugin, agent_data=None,
                 oper_type='newagent', delete_afterwards=True):

        self.delete_afterwards = delete_afterwards
        self.customer_name = customer_name
        if not agent_data:
            agent_data = get_agent_info(
                agentid=agentid
            )

        self.add_packages_from_agent(
            username, agentid,
            agent_data, rv_plugin
        )
        
        if oper_type == 'newagent':
            self.add_custom_apps(
                username, customer_name,
                uri, method, agentid
            )
            self.add_supported_apps(agentid)
            self.add_agent_apps(agentid)

        elif oper_type == 'updatesapplications':
            self.add_supported_apps(agentid)
            self.add_agent_apps(agentid)

    def add_custom_apps(self, username, customer_name,
                        uri, method, agentid):
        rv_q = Queue('incoming_updates', connection=rq_pool)
        rv_q.enqueue_call(
            func=add_custom_app_to_agents,
            args=(
                username, customer_name,
                uri, method, None, agentid
            ),
            timeout=3600
        )

    def add_supported_apps(self, agentid):
        rv_q = Queue('incoming_updates', connection=rq_pool)
        rv_q.enqueue_call(
            func=get_all_supported_apps_for_agent,
            args=(
                agentid,
            ),
            timeout=3600
        )

    def add_agent_apps(self, agentid):
        rv_q = Queue('incoming_updates', connection=rq_pool)
        rv_q.enqueue_call(
            func=get_all_agent_apps_for_agent,
            args=(
                agentid,
            ),
            timeout=3600
        )


    def add_packages_from_agent(self, username, agent_id, agent_data, apps):
        rv_q = Queue('incoming_updates', connection=rq_pool)
        rv_q.enqueue_call(
            func=incoming_packages_from_agent,
            args=(
                username, agent_id,
                self.customer_name,
                agent_data['os_code'], agent_data['os_string'],
                apps, self.delete_afterwards
            ),
            timeout=3600
        )
