import logging
import sys
import tornado.httpserver
import tornado.web

from json import dumps

from server.handlers import BaseHandler

from server.hierarchy.decorators import agent_authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments
from agent import *
from operations import *
from agent.agents import add_agent
from errorz.error_messages import GenericResults
from receiver.rvhandler import RvHandOff

import plugins.ra.handoff as RaHandoff
#from server.handlers import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvlistener')


class NewAgentV1(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def post(self):
        username = self.get_current_user()
        customer_name = self.arguments.get(AgentKey.CustomerName)
        plugins = self.arguments.get(AgentKey.Plugins)
        rebooted = self.arguments.get(AgentKey.Rebooted)
        system_info = self.arguments.get(AgentKey.SystemInfo)
        hardware = self.arguments.get(AgentKey.Hardware)
        uri = self.request.uri
        method = self.request.method
        logger.info('data received on newagent: %s' % (self.request.body))

        try:
            new_agent = (
                add_agent(
                    username, customer_name, uri,
                    method, system_info, hardware
                )
            )
            agent_info = new_agent['data']
            self.set_status(new_agent['http_status'])

            if new_agent['http_status'] == 200:
                agent_id = agent_info[AgentKey.AgentId]
                json_msg = {
                    OperationKey.Operation: "new_agent_id",
                    OperationKey.OperationId: "",
                    OperationPerAgentKey.AgentId: agent_id
                }
                new_agent['data'] = [json_msg]
                self.set_header('Content-Type', 'application/json')
                try:
                    if 'rv' in plugins:
                        RvHandOff(
                            username, customer_name, uri, method, agent_id,
                            plugins['rv']['data'], agent_info
                        )

                    if 'ra' in plugins:
                        RaHandoff.startup(agent_id, plugins['ra'])

                except Exception as e:
                    logger.exception(e)
                self.write(dumps(new_agent, indent=4))

            else:
                self.set_header('Content-Type', 'application/json')
                self.write(dumps(new_agent, indent=4))

        except Exception as e:
            status = (
                GenericResults(
                    username, uri, method
                ).something_broke('agent', 'new_agent', e)
            )
            logger.exception(e)
            self.write(dumps(status, indent=4))
