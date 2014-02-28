import logging
import tornado.httpserver
import tornado.web
from datetime import datetime

import simplejson as json
from json import dumps

from errorz.error_messages import GenericResults
from server.handlers import BaseHandler, LoginHandler
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import agent_authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments

from agent.agents import update_agent, update_agent_field
from receiver.corehandler import process_queue_data
from receiver.rqueuemanager import QueueWorker
from receiver.rvhandler import RvHandOff

from plugins.monit import update_agent_monit_stats

#from server.handlers import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvlistener')


class UpdateMonitoringStatsV1(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def post(self, agent_id):
        username = self.get_current_user()
        uri = self.request.uri
        method = self.request.method
        try:
            data = self.arguments.get('data')
            mem = data['memory']
            cpu = data['cpu']
            file_system = data['file_system']

            update_agent_monit_stats(
                agent=agent_id,
                memory=mem,
                cpu=cpu,
                file_system=file_system
            )
            results = (
                GenericResults(
                    username, uri, method
                ).object_updated(agent_id, 'monitoring data')
            )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))


        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'monitoring data', e)
            )
            logger.exception(results)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))
