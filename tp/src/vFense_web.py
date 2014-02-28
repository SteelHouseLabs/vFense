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

from server.handlers import RootHandler, LoginHandler, LogoutHandler
from server.handlers import WebSocketHandler, AdminHandler
from server.api.scheduler_api import ScheduleListerHandler
#from server.api.scheduler_api import ScheduleRemoveHandler
from server.api.scheduler_api import ScheduleAppDetailHandler
from server.api.scheduler_api import SchedulerDateBasedJobHandler
from server.api.scheduler_api import SchedulerDailyRecurrentJobHandler
from server.api.scheduler_api import SchedulerMonthlyRecurrentJobHandler
from server.api.scheduler_api import SchedulerYearlyRecurrentJobHandler
from server.api.scheduler_api import SchedulerWeeklyRecurrentJobHandler
from server.api.scheduler_api import SchedulerCustomRecurrentJobHandler
from server.api.reports_api import *

from db.client import *
from scheduler.jobManager import start_scheduler
##from server.api.auth_api import LoginHandler, LogoutHandler
from plugins.patching.Api.app_data import *
from plugins.patching.Api.node_api import *
from plugins.patching.Api.stats_api import *
from plugins.patching.Api.notification_handler import *
from plugins.patching.Api.os_updates_handler import *
from plugins.patching.Api.agent_updates_handler import *
from plugins.patching.Api.custom_updates_handler import *
from plugins.patching.Api.supported_updates_handler import *
from plugins.mightymouse.api.relay_servers import *

from plugins.ra.api.status import RDStatusQueue
from plugins.ra.api.rdsession import RDSession
from plugins.ra.api.settings import SetPassword
from server.hierarchy import db as hierarchy_db
from server.api.transactions_api import *
from server.api.log_api import *
from server.api.email_api import *
from server.api.tag_api import *
from server.api.users_api import *
from server.api.groups_api import *
from server.api.customer_api import *
from server.api.permissions_api import *
from server.api.monit_api import *
from scripts.create_indexes import initialize_indexes_and_create_tables

from tornado.options import define, options

define("port", default=9000, help="run on port", type=int)
define("debug", default=True, help="enable debugging features", type=bool)

rq_host = 'localhost'
rq_port = 6379
rq_db = 0

rq_pool = StrictRedis(host=rq_host, port=rq_port, db=rq_db)


class HeaderModule(tornado.web.UIModule):
    def render(self):
        return self.render_string(
            "../templates/header.html"
        )


class Application(tornado.web.Application):
    def __init__(self, debug):
        handlers = [
            (r"/?", RootHandler),
            (r"/login/?", LoginHandler),
            (r"/logout/?", LogoutHandler),
            #(r"/ws/?", WebSocketHandler),
            (r"/adminForm", AdminHandler),

            ##### User and Groups API
            (r"/api/user/?", GetUserApi),
            (r"/api/users/?", GetUsersApi),
            (r"/api/users/create/?", CreateUserApi),
            (r"/api/users/delete/?", DeleteUserApi),
            (r"/api/users/edit/?", ModifyUserApi),

            (r"/api/groups/?", GetGroupApi),
            (r"/api/groups/create", AddGroupApi),
            (r"/api/groups/delete", DeleteGroupApi),
            (r"/api/groups/edit", ModifyGroupApi),

            ##### Notification API
            (r"/api/v1/notifications?", NotificationsHandler),
            (r"/api/v1/notification/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})?", NotificationHandler),
            (r"/api/v1/notifications/get_valid_fields/?",
                GetAllValidFieldsForNotifications),
            (r"/api/permissions/?", GetPermissionsApi),

            ##### Customers API
            (r"/api/customers/?", GetCustomerHandler),
            (r"/api/customers/create/?", AddCustomerHandler),
            (r"/api/customers/delete/?", DeleteCustomerHandler),
            (r"/api/customers/edit/?", ModifyCustomerHandler),

            ##### Monitoring Api
            (r"/api/monitor/memory/?", GetMemoryStats),
            (r"/api/monitor/filesystem/?", GetFileSystemStats),
            (r"/api/monitor/cpu/?", GetCpuStats),
            (r"/api/monitor/?", GetAllStats),

            ##### RA Api
            (r"/api/ra/rd/password/?", SetPassword),
            (r"/api/ra/rd/([^/]+)/?", RDSession),
            (r"/ws/ra/status/?", RDStatusQueue),

            ##### Email API Handlers
            (r"/api/email/config/create?", CreateEmailConfigHandler),
            (r"/api/email/config/list?", GetEmailConfigHandler),

            ##### Logger API Handlers
            (r"/api/logger/modifyLogging?", LoggingModifyerHandler),
            (r"/api/logger/getParams?", LoggingListerHandler),

            ##### Scheduler API Handlers
            (r"/api/v1/schedules?", ScheduleListerHandler),
            (r"/api/v1/schedule/([A-Za-z0-9_ ]+.*)?", ScheduleAppDetailHandler),
            (r"/api/v1/schedules/recurrent/none?", SchedulerDateBasedJobHandler),
            (r"/api/v1/schedules/recurrent/daily?", SchedulerDailyRecurrentJobHandler),
            (r"/api/v1/schedules/recurrent/monthly?", SchedulerMonthlyRecurrentJobHandler),
            (r"/api/v1/schedules/recurrent/yearly?", SchedulerYearlyRecurrentJobHandler),
            (r"/api/v1/schedules/recurrent/weekly?", SchedulerWeeklyRecurrentJobHandler),
            (r"/api/v1/schedules/recurrent/custom?", SchedulerCustomRecurrentJobHandler),
            
            ##### Reports Api
            (r"/api/v1/reports/osdetails?", AgentsOsDetailsHandler),
            (r"/api/v1/reports/hardwaredetails?",AgentsHardwareDetailsHandler),
            (r"/api/v1/reports/cpudetails?",AgentsCPUDetailsHandler),
            (r"/api/v1/reports/memorydetails?",AgentsMemoryDetailsHandler),
            (r"/api/v1/reports/diskdetails?",AgentsDiskDetailsHandler),
            (r"/api/v1/reports/networkdetails?",AgentsNetworkDetailsHandler),


            ##### Agent API Handlers
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})?", AgentHandler),
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/graphs/bar/severity?",AgentSeverityHandler),
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/graphs/column/range/apps/os?", AgentOsAppsOverTimeHandler),
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/tag?", TagsAgentHandler),
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/apps/os?", AgentIdOsAppsHandler),
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/apps/remediationvault?", AgentIdAgentAppsHandler),
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/apps/custom?", AgentIdCustomAppsHandler),
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/apps/supported?", AgentIdSupportedAppsHandler),
            (r"/api/v1/agent/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/operations?", AgentOperationsHandler),

            ##### Agents API Handlers
            (r"/api/v1/agents", AgentsHandler),

            ##### Tag API Handlers
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})?", TagHandler),
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/graphs/bar/severity?",TagSeverityHandler),
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/graphs/column/range/apps/os?", TagOsAppsOverTimeHandler),
            #(r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/graphs/linear/severity?",TagPackageSeverityOverTimeHandler),
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/apps/os?", TagIdOsAppsHandler),
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/apps/remediationvault?", TagIdAgentAppsHandler),
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/apps/supported?", TagIdSupportedAppsHandler),
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/apps/custom?", TagIdCustomAppsHandler),
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/operations?", TagOperationsHandler),
            (r"/api/v1/tag/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/stats_by_os?", TagStatsByOsHandler),

            ##### Tags API Handlers
            (r"/api/v1/tags", TagsHandler),

            ##### FileData API Handlers
            (r'/api/v1/apps/info?', FileInfoHandler),

            ##### MightyMouse API Handlers
            (r'/api/v1/relay/([A-Za-z0-9:,"_ ]+.*)?', RelayServerHandler),
            (r"/api/v1/relay", RelayServersHandler),

            ##### Os Apps API Handlers
            (r"/api/v1/app/os/([0-9A-Za-z]{64})?", AppIdOsAppsHandler),
            (r"/api/v1/app/os/([0-9A-Za-z]{64})/agents?", GetAgentsByAppIdHandler),
            (r"/api/v1/apps/os", OsAppsHandler),

            ##### Custom Apps API Handlers
            (r"/api/v1/app/custom/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})?", AppIdCustomAppsHandler),
            (r"/api/v1/app/custom/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})/agents?", GetAgentsByCustomAppIdHandler),
            (r"/api/v1/apps/custom?", CustomAppsHandler),

            (r"/api/v1/apps/custom/upload/finalize?", ThirdPartyPackageUploadHandler),
            (r"/api/v1/apps/custom/upload/data?",ThirdPartyUploadHandler),
            (r"/upload/package?",ThirdPartyPackageUploadHandler),
            (r"/api/v1/apps/custom/upload/uuid?", GetThirdPartyUuidHandler),

            ##### Supported Apps API Handlers
            (r"/api/v1/app/supported/([0-9A-Za-z]{64})?", AppIdSupportedAppsHandler),
            (r"/api/v1/app/supported/([0-9A-Za-z]{64})/agents?", GetAgentsBySupportedAppIdHandler),
            (r"/api/v1/apps/supported?", SupportedAppsHandler),

            ##### Agent Apps API Handlers
            (r"/api/v1/app/remediationvault/([0-9A-Za-z]{64})?", AppIdAgentAppsHandler),
            (r"/api/v1/app/remediationvault/([0-9A-Za-z]{64})/agents?", GetAgentsByAgentAppIdHandler),
            (r"/api/v1/apps/remediationvault?", AgentAppsHandler),

            ##### Dashboard API Handlers
            (r"/api/v1/dashboard/graphs/bar/severity?",CustomerSeverityHandler),
            #(r"/api/v1/dashboard/graphs/linear/severity?",PackageSeverityOverTimeHandler),
            (r"/api/v1/dashboard/graphs/bar/stats_by_os?", CustomerStatsByOsHandler),
            (r"/api/v1/dashboard/graphs/column/range/apps/os?", OsAppsOverTimeHandler),
            (r"/api/v1/dashboard/widgets/unique_count?", WidgetHandler),
            (r"/api/v1/dashboard/widgets/top_needed?", TopAppsNeededHandler),
            (r"/api/v1/dashboard/widgets/recently_released?", RecentlyReleasedHandler),

            ##### Operations API Handlers
            (r"/api/v1/operations?", GetTransactionsHandler),
            (r"/api/v1/operation/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12})?", OperationHandler),

            ##### Generic API Handlers
            (r"/api/v1/supported/operating_systems?", FetchSupportedOperatingSystems),
            (r"/api/v1/supported/production_levels?", FetchValidProductionLevels),
            #(r"/api/package/getDependecies?", GetDependenciesHandler),

            ##### File system access whitelist
            (r"/css/(.*?)", tornado.web.StaticFileHandler,
                {"path": "wwwstatic/css"}),
            (r"/font/(.*?)", tornado.web.StaticFileHandler,
                {"path": "wwwstatic/font"}),
            (r"/img/(.*?)", tornado.web.StaticFileHandler,
                {"path": "wwwstatic/img"}),
            (r"/js/(.*?)", tornado.web.StaticFileHandler,
                {"path": "wwwstatic/js"}),
            (r"/packages/*/(.*?)", tornado.web.StaticFileHandler,
                {"path": "/opt/TopPatch/var/packages"})
        ]

        template_path = "/opt/TopPatch/tp/templates"
        settings = {
            "cookie_secret": base64.b64encode(uuid.uuid4().bytes +
                                              uuid.uuid4().bytes),
            "login_url": "/login",
        }
        self.scheduler = start_scheduler()
        initialize_indexes_and_create_tables()
        hierarchy_db.init()

        tornado.web.Application.__init__(self, handlers,
                                         template_path=template_path,
                                         debug=debug, **settings)

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
            log_message = '%d %s %s %s %s, %.2fms' % (handler.get_status(), handler._request_summary(), real_ip, forwarded_ip, user_agent, request_time)
        log_method(log_message)

if __name__ == '__main__':
    tornado.options.parse_command_line()
    https_server = tornado.httpserver.HTTPServer(
        Application(options.debug),
        ssl_options={
            "certfile": os.path.join("/opt/TopPatch/tp/data/ssl/", "server.crt"),
            "keyfile": os.path.join("/opt/TopPatch/tp/data/ssl/", "server.key")
        }
    )
    https_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
