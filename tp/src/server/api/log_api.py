import tornado.httpserver
import tornado.web

import simplejson as json

import logging
import logging.config
from server.handlers import BaseHandler, LoginHandler
from db.client import *
from utils.common import *
from logger.rvlogger import RvLogger
from server.hierarchy.decorators import authenticated_request
from server.hierarchy.manager import get_current_customer_name

from jsonpickle import encode

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class LoggingModifyerHandler(BaseHandler):
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        host = self.get_argument('host', None)
        port = self.get_argument('port', None)
        proto = self.get_argument('proto', 'UDP')
        level = self.get_argument('level', 'INFO')
        proto = proto.upper()
        level = level.upper()
        if host and port and proto and level:
            rvlogger = RvLogger()
            connected = rvlogger.connect_to_loghost(host, port, proto)
            if connected:
                rvlogger.create_config(loglevel=level, loghost=host,
                        logport=port, logproto=proto)
                results = rvlogger.results
            else:
                results = {
                        'pass': False,
                        'message': 'Cant connect to %s on %s using proto %s' %\
                                (host, port, proto)
                        }
        elif level and not host and not port:
            rvlogger = RvLogger()
            rvlogger.create_config(loglevel=level)
            results = rvlogger.results
        else:
            results = {
                    'pass': False,
                    'message': 'incorrect parameters passed'
                    }
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))


class LoggingListerHandler(BaseHandler):
    @authenticated_request
    def get(self):
        rvlogger = RvLogger()
        rvlogger.get_logging_config()
        results = rvlogger.results
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))
