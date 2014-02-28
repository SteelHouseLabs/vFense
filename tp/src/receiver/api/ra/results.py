import logging
import tornado.httpserver
import tornado.web

import simplejson as json
from json import dumps

from server.handlers import BaseHandler
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments

from db.update_table import AddResults
from errorz.error_messages import AgentResults

from plugins.ra.processor import Processor

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvlistener')


class RemoteDesktopResults(BaseHandler):

    @authenticated_request
    @convert_json_to_arguments
    def post(self):

        username = self.get_current_user()
        agent_id = self.arguments.get('agent_id')
        operation_id = self.arguments.get('operation_id')
        operation_type = self.arguments.get('operation')
        success = self.arguments.get('success')
        error = self.arguments.get('error', None)

        logger.info(
            'Data received on remote desktop results: %s' %
            (self.request.body)
        )

        processor = Processor()
        processor.handle(self.arguments)

        print self.arguments

#        results = AddResults(
#            username,
#            self.request.uri,
#            self.request.method,
#            agent_id,
#            operation_id,
#            success,
#            error
#        )
#        results.ra(operation_type)

        #agent_queue = get_agent_queue(agent_id)
        result = AgentResults(
            username, self.request.uri, "POST"
        ).ra_results(agent_id)

        self.set_header('Content-Type', 'application/json')
        self.write(result)
