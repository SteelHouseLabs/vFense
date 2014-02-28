import logging
import logging.config

import tornado.httpserver
import tornado.web

from errorz.error_messages import GenericResults, NotificationResults
from notifications import *
import simplejson as json

from server.handlers import BaseHandler

from server.hierarchy.decorators import authenticated_request
from server.hierarchy.permissions import Permission
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import authenticated_request, permission_check
from server.hierarchy.decorators import convert_json_to_arguments
from notifications.search_alerts import AlertSearcher
from notifications.alerts import Notifier, get_valid_fields, get_all_notifications

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

class GetAllValidFieldsForNotifications(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        result = (
            get_valid_fields(
                customer_name=customer_name
            )
        )
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))


class NotificationsHandler(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            results = (
                get_all_notifications(
                    username, customer_name,
                    uri, method
                )
            )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('Get list of notifications', 'notifications', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


    @convert_json_to_arguments
    @authenticated_request
    def post(self):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            plugin = self.arguments.get('plugin', 'rv')
            rule_name = self.arguments.get('rule_name')
            rule_description = self.arguments.get('rule_description')
            agent_ids = self.arguments.get('agent_ids', [])
            tag_ids = self.arguments.get('tag_ids', [])
            user = self.arguments.get('user', None)
            group = self.arguments.get('group', None)
            all_agents = self.arguments.get('all_agents', 'true')
            rv_threshold = self.arguments.get('rv_threshold', None)
            operation_type = self.arguments.get('operation_type')
            monitoring_threshold = (
                self.arguments.get('monitoring_threshold', None)
            )
            file_systems = self.arguments.get('file_system', [])
            notification = (
                Notifier(
                    username, customer_name,
                    uri, method
                )
            )
            data = (
                {
                    NotificationKeys.NotificationType: operation_type,
                    NotificationKeys.RuleName: rule_name,
                    NotificationKeys.RuleDescription: rule_description,
                    NotificationKeys.CreatedBy: username,
                    NotificationKeys.ModifiedBy: username,
                    NotificationKeys.Plugin: plugin,
                    NotificationKeys.User: user,
                    NotificationKeys.Group: group,
                    NotificationKeys.AllAgents: all_agents,
                    NotificationKeys.Agents: agent_ids,
                    NotificationKeys.Tags: tag_ids,
                    NotificationKeys.CustomerName: customer_name,
                    NotificationKeys.AppThreshold: None,
                    NotificationKeys.RebootThreshold: None,
                    NotificationKeys.ShutdownThreshold: None,
                    NotificationKeys.CpuThreshold: None,
                    NotificationKeys.MemThreshold: None,
                    NotificationKeys.FileSystemThreshold: None,
                    NotificationKeys.FileSystem: file_systems,
                }
            )
            if rv_threshold:
                rv_threshold = rv_threshold.lower()
                if operation_type == INSTALL:
                    data[NotificationKeys.AppThreshold] = rv_threshold
                    results = notification.create_install_alerting_rule(**data)

                elif operation_type == UNINSTALL:
                    data[NotificationKeys.AppThreshold] = rv_threshold
                    results = notification.create_uninstall_alerting_rule(**data)

                elif operation_type == REBOOT:
                    data[NotificationKeys.RebootThreshold] = rv_threshold
                    results = notification.create_reboot_alerting_rule(**data)

                elif operation_type == SHUTDOWN:
                    data[NotificationKeys.ShutdownThreshold] = rv_threshold
                    results = notification.create_shutdown_alerting_rule(**data)

                else:
                    results = (
                        NotificationResults(
                            username, uri, method
                        ).invalid_notification_type(operation_type)
                    )

            elif monitoring_threshold:
                monitoring_threshold = int(monitoring_threshold)
                if operation_type == CPU:
                    data[NotificationKeys.CpuThreshold] = monitoring_threshold
                    results = notification.create_cpu_alerting_rule(**data)

                elif operation_type == MEM:
                    data[NotificationKeys.MemThreshold] = monitoring_threshold
                    results = notification.create_mem_alerting_rule(**data)

                elif operation_type == FS and file_systems:
                    data[NotificationKeys.FileSystemThreshold] = monitoring_threshold
                    data[NotificationKeys.FileSystem] = file_systems
                    results = notification.create_filesystem_alerting_rule(**data)

                else:
                    results = (
                        NotificationResults(
                            username, uri, method
                        ).invalid_notification_type(operation_type)
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
                ).something_broke('create notification', 'notifications', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class NotificationHandler(BaseHandler):
    @authenticated_request
    def get(self, notification_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            alert = AlertSearcher(username, customer_name, uri, method)
            results = alert.get_notification(notification_id)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(notification_id, 'notifications', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


    @authenticated_request
    def delete(self, notification_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            notification = (
                Notifier(
                    username, customer_name,
                    uri, method
                )
            )

            results = (
                notification.delete_alerting_rule(notification_id)
            )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('delete notification', 'notifications', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


    @convert_json_to_arguments
    @authenticated_request
    def put(self, notification_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            plugin = self.arguments.get('plugin', 'rv')
            rule_name = self.arguments.get('rule_name')
            rule_description = self.arguments.get('rule_description')
            agent_ids = self.arguments.get('agent_ids', [])
            tag_ids = self.arguments.get('tag_ids', [])
            user = self.arguments.get('user', None)
            group = self.arguments.get('group', None)
            all_agents = self.arguments.get('all_agents', 'true')
            rv_threshold = self.arguments.get('rv_threshold', None)
            operation_type = self.arguments.get('operation_type')
            monitoring_threshold = (
                self.arguments.get('monitoring_threshold', None)
            )
            file_systems = self.arguments.get('file_system', [])
            notification = (
                Notifier(
                    username, customer_name,
                    uri, method
                )
            )
            data = (
                {
                    NotificationKeys.NotificationId: notification_id,
                    NotificationKeys.NotificationType: operation_type,
                    NotificationKeys.RuleName: rule_name,
                    NotificationKeys.RuleDescription: rule_description,
                    NotificationKeys.CreatedBy: username,
                    NotificationKeys.ModifiedBy: username,
                    NotificationKeys.Plugin: plugin,
                    NotificationKeys.User: user,
                    NotificationKeys.Group: group,
                    NotificationKeys.AllAgents: all_agents,
                    NotificationKeys.Agents: agent_ids,
                    NotificationKeys.Tags: tag_ids,
                    NotificationKeys.CustomerName: customer_name,
                    NotificationKeys.AppThreshold: None,
                    NotificationKeys.RebootThreshold: None,
                    NotificationKeys.ShutdownThreshold: None,
                    NotificationKeys.CpuThreshold: None,
                    NotificationKeys.MemThreshold: None,
                    NotificationKeys.FileSystemThreshold: None,
                    NotificationKeys.FileSystem: file_systems,
                }
            )
            if rv_threshold:
                if operation_type == INSTALL:
                    data[NotificationKeys.AppThreshold] = rv_threshold
                    results = notification.modify_alerting_rule(**data)

                elif operation_type == UNINSTALL:
                    data[NotificationKeys.AppThreshold] = rv_threshold
                    results = notification.modify_alerting_rule(**data)

                elif operation_type == REBOOT:
                    data[NotificationKeys.RebootThreshold] = rv_threshold
                    results = notification.modify_alerting_rule(**data)

                elif operation_type == SHUTDOWN:
                    data[NotificationKeys.ShutdownThreshold] = rv_threshold
                    results = notification.modify_alerting_rule(**data)

                else:
                    results = (
                        NotificationResults(
                            username, uri, method
                        ).invalid_notification_type(operation_type)
                    )

            elif monitoring_threshold:
                if operation_type == CPU:
                    data[NotificationKeys.CpuThreshold] = monitoring_threshold
                    results = notification.modify_alerting_rule(**data)

                elif operation_type == MEM:
                    data[NotificationKeys.MemThreshold] = monitoring_threshold
                    results = notification.modify_alerting_rule(**data)

                elif operation_type == FS and file_systems:
                    data[NotificationKeys.FileSystemThreshold] = monitoring_threshold
                    data[NotificationKeys.FileSystem] = file_systems
                    results = notification.modify_alerting_rule(**data)

                else:
                    results = (
                        NotificationResults(
                            username, uri, method
                        ).invalid_notification_type(operation_type)
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
                ).something_broke('create notification', 'notifications', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))
