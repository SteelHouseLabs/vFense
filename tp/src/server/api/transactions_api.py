import simplejson as json
import re
import logging
import logging.config
from server.handlers import BaseHandler
from operations import *
from operations.retriever import OperationRetriever, oper_exists
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import authenticated_request
from errorz.error_messages import GenericResults

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class GetTransactionsHandler(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            count = int(self.get_argument('count', 20))
            offset = int(self.get_argument('offset', 0))
            sort = self.get_argument('sort', 'desc')
            sort_by = self.get_argument('sort_by', OperationKey.CreatedTime)
            oper_type = self.get_argument('opertype', None)
            operations = (
                OperationRetriever(
                    username, customer_name,
                    uri, method, count, offset,
                    sort, sort_by
                )
            )

            if oper_type:
                results = (
                    operations.get_all_operations_by_type(
                        oper_type
                    )
                )

            else:
                results = operations.get_all_operations()

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('operation', 'search by oper type', e)
            )
            logger.exception(results)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

class AgentOperationsHandler(BaseHandler):
    @authenticated_request
    def get(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            count = int(self.get_argument('count', 20))
            offset = int(self.get_argument('offset', 0))
            sort = self.get_argument('sort', 'desc')
            sort_by = self.get_argument('sort_by', OperationKey.CreatedTime)
            operations = (
                OperationRetriever(
                    username, customer_name,
                    uri, method, count, offset,
                    sort, sort_by
                )
            )

            results = operations.get_all_operations_by_agentid(agent_id)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('operation', 'search by oper type', e)
            )
            logger.exception(results)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class TagOperationsHandler(BaseHandler):
    @authenticated_request
    def get(self, tag_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            count = int(self.get_argument('count', 20))
            offset = int(self.get_argument('offset', 0))
            sort = self.get_argument('sort', 'desc')
            sort_by = self.get_argument('sort_by', OperationKey.CreatedTime)
            operations = (
                OperationRetriever(
                    username, customer_name,
                    uri, method, count, offset,
                    sort, sort_by
                )
            )

            results = operations.get_all_operations_by_tagid(tag_id)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('operation', 'search by oper type', e)
            )
            logger.exception(results)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

class OperationHandler(BaseHandler):
    @authenticated_request
    def get(self, oper_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            count = int(self.get_argument('count', 20))
            offset = int(self.get_argument('offset', 0))
            sort = self.get_argument('sort', 'desc')
            sort_by = self.get_argument('sort_by', OperationKey.CreatedTime)
            oper = oper_exists(oper_id)
            operations = (
                OperationRetriever(
                    username, customer_name,
                    uri, method, count, offset,
                    sort, sort_by
                )
            )
            if oper:
                if re.search('install', oper[OperationKey.Operation]):
                    results = operations.get_install_operation_by_id(oper_id)
                else:
                    results = operations.get_operation_by_id(oper_id)
            else:
                results = (
                    GenericResults(
                        username, uri, method
                    ).invalid_id(oper_id, 'operation')
                )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('operation', 'search by oper type', e)
            )
            logger.exception(results)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))
