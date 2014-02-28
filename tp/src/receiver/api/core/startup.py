import logging
import tornado.httpserver
import tornado.web

from json import dumps

from server.handlers import BaseHandler
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import agent_authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments

from agent import *
from errorz.error_messages import GenericResults
from agent.agents import update_agent
from db.hardware import Hardware
from receiver.corehandler import process_queue_data
from receiver.rqueuemanager import QueueWorker

from receiver.rvhandler import RvHandOff
import plugins.ra.handoff as RaHandoff
#from server.handlers import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvlistener')


class StartUpV1(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        try:
            username = self.get_current_user()
            customer_name = get_current_customer_name(username)
            uri = self.request.uri
            method = self.request.method
            rebooted = self.arguments.get(AgentKey.Rebooted)
            plugins = self.arguments.get(AgentKey.Plugins)
            system_info = self.arguments.get(AgentKey.SystemInfo)
            hardware = self.arguments.get(AgentKey.Hardware)
            logger.info(
                'data received on startup: %s' % self.request.body
            )
            agent_data = (
                update_agent(
                    username, customer_name,
                    uri, method,
                    agent_id, system_info,
                    hardware, rebooted
                )
            )
            agent_data.pop('data')
            agent_data['data'] = []
            logger.info(agent_data)
            self.set_status(agent_data['http_status'])

            if agent_data['http_status'] == 200:
                if 'rv' in plugins:
                    RvHandOff(
                        username, customer_name, uri, method,
                        agent_id, plugins['rv']['data'],
                        oper_type='updates_applications'
                    )

                if 'ra' in plugins:
                    RaHandoff.startup(agent_id, plugins['ra'])

            self.set_header('Content-Type', 'application/json')
            self.write(dumps(agent_data))

        except Exception as e:
            status = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'startup', e)
            )

            logger.exception(status['message'])
            self.write(dumps(status))
