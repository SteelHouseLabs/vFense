"""
Main launching point of the Top Patch Server
"""
import base64
import uuid
import os
import logging
import logging.config

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.options

from redis import StrictRedis
from rq import Connection, Queue

from server.handlers import RootHandler, RvlLoginHandler, RvlLogoutHandler
from server.handlers import WebSocketHandler, AdminHandler
from receiver.api.core.newagent import NewAgentV1
from receiver.api.core.checkin import CheckInV1
from receiver.api.core.startup import StartUpV1
from receiver.api.rv.results import *
from receiver.api.core.results import *
from receiver.api.rv.updateapplications import UpdateApplicationsV1
from receiver.api.ra.results import RemoteDesktopResults
from receiver.api.monitoring.monitoringdata import UpdateMonitoringStatsV1

from db.client import *
from scheduler.jobManager import start_scheduler

from tornado.options import define, options

#import newrelic.agent
#newrelic.agent.initialize('/opt/TopPatch/conf/newrelic.ini')

define("port", default=9001, help="run on port", type=int)
define("debug", default=True, help="enable debugging features", type=bool)


class Application(tornado.web.Application):
    def __init__(self, debug):
        handlers = [

            #Operations for the Monitoring Plugin
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/monitoring/monitordata/?", UpdateMonitoringStatsV1),

            #RA plugin
            (r"/rvl/ra/rd/results/?", RemoteDesktopResults),

            #Login and Logout Operations
            (r"/rvl/?", RootHandler),
            (r"/rvl/login/?", RvlLoginHandler),
            (r"/rvl/logout/?", RvlLogoutHandler),

            #Operations for the New Core Plugin
            (r"/rvl/v1/core/newagent/?", NewAgentV1),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/core/startup/?", StartUpV1),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/core/checkin/?", CheckInV1),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/rv/updatesapplications/?", UpdateApplicationsV1),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/core/results/reboot/?", RebootResultsV1),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/core/results/shutdown/?", ShutdownResultsV1),

            #New Operations for the New RV Plugin
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/rv/results/install/apps/os?",
                InstallOsAppsResults),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/rv/results/install/apps/custom?",
                InstallCustomAppsResults),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/rv/results/install/apps/supported?",
                InstallSupportedAppsResults),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/rv/results/install/apps/agent?",
                InstallAgentAppsResults),
            (r"/rvl/v1/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/rv/results/uninstall?",
                UnInstallAppsResults),

        ]

        template_path = "/opt/TopPatch/tp/templates"
        settings = {
            "cookie_secret": "patching-0.7",
            "login_url": "/rvl/login",
        }
        tornado.web.Application.__init__(self, handlers,
                                         template_path=template_path,
                                         debug=True, **settings)

    def log_request(self, handler):
        logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
        log = logging.getLogger('rvweb')
        log_method = log.debug
        if handler.get_status() <= 299:
            log_method = log.info
        elif handler.get_status() <= 399 and \
                handler.get_status() >= 300:
            log_method = log.warn
        elif handler.get_status() <= 499 and \
                handler.get_status() >= 400:
            log_method = log.error
        elif handler.get_status() <= 599 and \
                handler.get_status() >= 500:
            log_method = log.error
        request_time = 1000.0 * handler.request.request_time()
        real_ip = handler.request.headers.get('X-Real-Ip', None)
        #remote_ip = handler.request.remote_ip
        #uri = handler.request.remote_ip
        forwarded_ip = handler.request.headers.get('X-Forwarded-For', None)
        user_agent = handler.request.headers.get('User-Agent')
        log_message = '%d %s %s, %.2fms' % (handler.get_status(), handler._request_summary(), user_agent, request_time)
        if real_ip:
            log_message = (
                '%d %s %s %s %s, %.2fms' %
                (
                    handler.get_status(), handler._request_summary(),
                    real_ip, forwarded_ip, user_agent, request_time
                )
            )
        log_method(log_message)

if __name__ == '__main__':
    tornado.options.parse_command_line()
    https_server = tornado.httpserver.HTTPServer(
        Application(options.debug),
        ssl_options={
            "certfile": os.path.join(
                "/opt/TopPatch/tp/data/ssl/",
                "server.crt"),
            "keyfile": os.path.join(
                "/opt/TopPatch/tp/data/ssl/", 
                "server.key"),
        }
    )
    https_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
