import tornado.httpserver
import tornado.web

import simplejson as json

from server.handlers import BaseHandler
import logging
import logging.config

from agent import *
from agent.agent_searcher import AgentSearcher
from agent.agent_handler import AgentManager
from errorz.error_messages import GenericResults

from plugins.mightymouse.mousey import MightyMouse
from plugins.mightymouse.mouse_db import get_all_mouseys, mouse_exists
from agent.agents import get_supported_os_codes, get_supported_os_strings, \
    get_production_levels
from operations import *
from server.hierarchy.permissions import Permission
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import authenticated_request, permission_check
from server.hierarchy.decorators import convert_json_to_arguments

from scheduler.jobManager import job_scheduler


#from server.handlers import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

class RelayServersHandler(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            results = (
                get_all_mouseys(
                    username, uri, method
                )
            )
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'get agent_info', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    def delete(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            mouse_names = self.arguments.get('names')
            mm = MightyMouse(username, customer_name, uri, method)
            for mouse in mouse_names:
                results = mm.remove(mouse_name)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'delete agent', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    @convert_json_to_arguments
    def post(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            mouse_name = self.arguments.get('name')
            address = self.arguments.get('address')
            customers = self.arguments.get('customers', None)
            mm = MightyMouse(username, customer_name, uri, method)
            results = mm.add(mouse_name, address, customers)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, '', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class RelayServerHandler(BaseHandler):
    @authenticated_request
    def get(self, mouse_name):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            mouse = mouse_exists(mouse_name)
            mouse = [mouse]
            results = (
                GenericResults(
                    username, uri, method
                ).information_retrieved(mouse, len(mouse))
            )

            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(mouse_name, 'get mouse', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    @convert_json_to_arguments
    def put(self, mouse_name):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            address = self.arguments.get('address', None)
            customers = self.arguments.get('customers', None)
            mm = MightyMouse(username, customer_name, uri, method)
            results = mm.update(mouse_name, customers, address)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'modify agent', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    def delete(self, mouse_name):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            mm = MightyMouse(username, customer_name, uri, method)
            results = mm.remove(mouse_name)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'delete agent', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))
