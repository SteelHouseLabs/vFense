import logging
import tornado.httpserver
import tornado.web

import simplejson as json
from json import dumps

from server.handlers import BaseHandler
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import agent_authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments

from db.update_table import AddResults
from db.notification_sender import send_notifications
from errorz.error_messages import GenericResults
from errorz.status_codes import OperationCodes

#from server.handlers import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvlistener')


class RebootResultsV1(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            oper_id = self.arguments.get('operation_id')
            error = self.arguments.get('error', None)
            success = self.arguments.get('success')
            results = (
                AddResults(
                    username, uri, method, agent_id,
                    oper_id, success, error
                )
            )
            results_data = results.reboot()
            self.set_status(results_data['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results_data, indent=4))
            send_notifications(username, customer_name, oper_id, agent_id)
        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'reboot results', e)
            )
            logger.exception(results)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))
            

class ShutdownResultsV1(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            oper_id = self.arguments.get('operation_id')
            error = self.arguments.get('error', None)
            success = self.arguments.get('success')
            results = (
                AddResults(
                    username, uri, method, agent_id,
                    oper_id, success, error
                )
            )
            results_data = results.shutdown()
            self.set_status(results_data['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results_data, indent=4))
            send_notifications(username, customer_name, oper_id, agent_id)
        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'shutdown results', e)
            )
            logger.exception(results)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))
            
