import logging
import tornado.httpserver
import tornado.web

from json import dumps

from db.update_table import AddResults
from errorz.error_messages import GenericResults, UpdateApplicationsResults
from server.handlers import BaseHandler
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import agent_authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments

from receiver.rvhandler import RvHandOff

#from server.handlers import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvlistener')


class UpdateApplicationsV1(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            oper_id = self.arguments.get('operation_id', None)
            error = self.arguments.get('error', None)
            success = self.arguments.get('success', 'true')
            app_data = self.arguments.get('data')
            RvHandOff(
               username, customer_name, uri, method, agent_id,
               app_data, oper_type='updates_applications'
            )
            if oper_id:
                results = (
                    AddResults(
                        username, uri, method, agent_id,
                        oper_id, success, error
                    )
                )
                results_apps_refresh = results.apps_refresh()
                self.set_status(results_apps_refresh['http_status'])
                self.write(dumps(results_apps_refresh))

            else:
                results = (
                    UpdateApplicationsResults(username, uri, method)
                    .applications_updated(agent_id, app_data)
                )
                results['data'] = []
                self.set_status(results['http_status'])
                self.write(dumps(results))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'udpates_applications', e)
            )
            logger.exception(results)
            self.set_status(results['http_status'])
            self.write(dumps(results))
