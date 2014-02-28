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

from plugins.patching.store_operations import StoreOperation
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


class FetchValidProductionLevels(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user().encode('utf-8')
        uri = self.request.uri
        method = self.request.method
        try:
            data = get_production_levels()
            results = (
                GenericResults(
                    username, uri, method
                ).information_retrieved(data, len(data))
            )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('Get OS Codes', 'Agent', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class FetchSupportedOperatingSystems(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user().encode('utf-8')
        uri = self.request.uri
        method = self.request.method
        try:
            os_code = self.get_argument('os_code', None)
            os_string = self.get_argument('os_string', None)
            if not os_code and not os_string or os_code and not os_string:
                data = get_supported_os_codes()

            elif os_string:
                data = get_supported_os_strings()

            results = (
                GenericResults(
                    username, uri, method
                ).information_retrieved(data, len(data))
            )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('Get OS Codes', 'Agent', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class AgentsHandler(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user()
        uri = self.request.uri
        method = self.request.method
        try:
            count = int(self.get_argument('count', 30))
            offset = int(self.get_argument('offset', 0))
            query = self.get_argument('query', None)
            filter_key = self.get_argument('filter_key', None)
            filter_val = self.get_argument('filter_val', None)
            customer_name = self.get_argument('customer_name', None)
            if not customer_name:
                customer_name = get_current_customer_name(username)
            ip = self.get_argument('ip', None)
            mac = self.get_argument('mac', None)
            sort = self.get_argument('sort', 'asc')
            sort_by = self.get_argument('sort_by', AgentKey.ComputerName)
            agent = (
                AgentSearcher(
                    username, customer_name,
                    uri, method, count, offset,
                    sort, sort_by
                )
            )
            if (not ip and not mac and not query and
                    not filter_key and not filter_val):
                results = agent.get_all_agents()

            elif (not ip and not mac and query and not
                    filter_key and not filter_val):
                results = agent.query_agents_by_name(query)

            elif (ip and not mac and not query and not
                    filter_key and not filter_val):
                results = agent.query_agents_by_ip(ip)

            elif (not ip and mac and not query and not
                    filter_key and not filter_val):
                results = agent.query_agents_by_mac(mac)

            elif (not ip and not mac and not query and
                    filter_key and filter_val):
                results = agent.filter_by(filter_key, filter_val)

            elif (not ip and not mac and query and
                    filter_key and filter_val):
                results = agent.filter_by_and_query(filter_key, filter_val, query)

            elif (ip and not mac and not query and
                    filter_key and filter_val):
                results = agent.query_agents_by_ip_and_filter(ip, filter_key, filter_val)

            elif (not ip and mac and not query and
                    filter_key and filter_val):
                results = agent.query_agents_by_mac_and_filter(mac, filter_key, filter_val)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('Agents Api', 'agent', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    @convert_json_to_arguments
    def put(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            agent_ids = self.arguments.get('agent_ids')
            new_customer = self.arguments.get('customer_name')
            if not isinstance(agent_ids, list):
                agent_ids = agent_ids.split()
            agentids_moved =[]
            agentids_not_moved =[]
            for agent_id in agent_ids:
                agent = AgentManager(agent_id, customer_name=customer_name)
                results = agent.change_customer(new_customer, uri, method)
                if results['http_status'] == 200:
                    agentids_moved.append(agent_id)
                else:
                    agentids_not_moved.append(agent_id)
            results['data'] = {
                'agentids_moved': agentids_moved,
                'agentids_not_moved': agentids_not_moved
            }
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('agent_ids', 'delete agentids', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


    @authenticated_request
    @convert_json_to_arguments
    def delete(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            agent_ids = self.arguments.get('agent_ids')
            if not isinstance(agent_ids, list):
                agent_ids = agent_ids.split()
            agentids_deleted =[]
            agentids_not_deleted =[]
            for agent_id in agent_ids:
                agent = AgentManager(agent_id, customer_name=customer_name)
                results = agent.delete_agent(uri, method)
                if results['http_status'] == 200:
                    delete_oper = (
                        StoreOperation(
                            username, customer_name, uri, method
                        )
                    )
                    delete_oper.uninstall_agent(agent_id)
                    agentids_deleted.append(agent_id)
                else:
                    agentids_not_deleted.append(agent_id)
            results['data'] = {
                'agentids_deleted': agentids_deleted,
                'agentids_not_deleted': agentids_not_deleted
            }
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('agent_ids', 'delete agentids', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class AgentHandler(BaseHandler):
    @authenticated_request
    def get(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            agent = AgentManager(agent_id, customer_name=customer_name)
            results = agent.get_data(uri=uri, method=method)
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
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            displayname = self.arguments.get('display_name', None)
            hostname = self.arguments.get('hostname', None)
            prod_level = self.arguments.get('production_level', None)
            new_customer = self.arguments.get('customer_name', None)
            agent = AgentManager(agent_id, customer_name=customer_name)

            if (displayname and not hostname and not
                    prod_level and not new_customer):
                results = agent.displayname_changer(displayname, uri, method)

            elif (hostname and not prod_level and not displayname
                    and not new_customer):
                results = agent.hostname_changer(hostname, uri, method)

            elif (prod_level and not hostname and not displayname
                    and not new_customer):
                results = agent.production_state_changer(prod_level, uri, method)

            elif prod_level and hostname and displayname and not new_customer:
                agent_data = {
                    'host_name': hostname,
                    'production_level': prod_level,
                    'display_name': displayname
                }
                results = agent.update_fields(agent_data, uri, method)

            elif (new_customer and not prod_level and not hostname
                and not displayname):
                results = agent.change_customer(new_customer, uri, method)

            else:
                results = (
                    GenericResults(
                        username, uri, method
                    ).incorrect_arguments()
                )

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
    def delete(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            agent = AgentManager(agent_id, customer_name=customer_name)
            delete_oper = StoreOperation(username, customer_name, uri, method)
            delete_oper.uninstall_agent(agent_id)
            results = agent.delete_agent(uri, method)
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
    @permission_check(permission=Permission.Reboot)
    def post(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            reboot = self.arguments.get('reboot', None)
            shutdown = self.arguments.get('shutdown', None)
            apps_refresh = self.arguments.get('apps_refresh', None)
            operation = (
                StoreOperation(
                    username, customer_name, uri, method
                )
            )
            if reboot:
                results = (
                    operation.reboot([agent_id])
                )
            elif shutdown:
                results = (
                    operation.shutdown([agent_id])
                )
            elif apps_refresh:
                results = (
                    operation.apps_refresh([agent_id])
                )
            else:
                results = (
                    GenericResults(
                        username, uri, method
                    ).incorrect_arguments()
                )

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




'''
class NodeWolHandler(BaseHandler):
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        session = self.application.session
        session = validate_session(session)
        list_of_nodes = self.get_arguments('nodes')
        if (list_of_nodes) >0:
            result = wake_up_nodes(session,
                    node_list=list_of_nodes
                    )
        else:
            result = {
                'pass': False,
                'message': 'Incorrect argument passed. %s' %
                    ('Arguments needed are: nodeid')
                }
        self.session.close()
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))
'''
