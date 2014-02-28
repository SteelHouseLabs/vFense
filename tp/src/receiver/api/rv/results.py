import logging
import tornado.httpserver
import tornado.web

import simplejson as json
from json import dumps

from receiver.rvhandler import RvHandOff
from server.handlers import BaseHandler
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import agent_authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments

from db.update_table import AddAppResults
from db.notification_sender import send_notifications
from errorz.error_messages import GenericResults
from errorz.status_codes import OperationCodes


logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvlistener')


class InstallOsAppsResults(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            logger.info(self.request.body)
            oper_id = self.arguments.get('operation_id')
            data = self.arguments.get('data')
            apps_to_delete = self.arguments.get('apps_to_delete', [])
            apps_to_add = self.arguments.get('apps_to_add', [])
            error = self.arguments.get('error', None)
            reboot_required = self.arguments.get('reboot_required')
            app_id = self.arguments.get('app_id')
            success = self.arguments.get('success')
            results = (
                AddAppResults(
                    username, uri, method, agent_id,
                    app_id, oper_id, reboot_required,
                    success, data, apps_to_delete,
                    apps_to_add, error
                )
            )
            results_data = results.install_os_apps(data)
            self.set_status(results_data['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results_data, indent=4))
            send_notifications(username, customer_name, oper_id, agent_id)
        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'install_os_apps results', e)
            )
            logger.exception(results)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))


class InstallCustomAppsResults(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            logger.info(self.request.body)
            oper_id = self.arguments.get('operation_id')
            data = self.arguments.get('data')
            apps_to_delete = self.arguments.get('apps_to_delete', [])
            apps_to_add = self.arguments.get('apps_to_add', [])
            error = self.arguments.get('error', None)
            reboot_required = self.arguments.get('reboot_required')
            app_id = self.arguments.get('app_id')
            success = self.arguments.get('success')
            results = (
                AddAppResults(
                    username, uri, method, agent_id,
                    app_id, oper_id, reboot_required,
                    success, data, apps_to_delete,
                    apps_to_add, error
                )
            )

            data = results.install_custom_apps(data)

            self.set_status(data['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(data, indent=4))
            send_notifications(username, customer_name, oper_id, agent_id)
        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'install_custom_apps results', e)
            )
            logger.exception(results)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))


class InstallSupportedAppsResults(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            oper_id = self.arguments.get('operation_id')
            data = self.arguments.get('data')
            apps_to_delete = self.arguments.get('apps_to_delete', [])
            apps_to_add = self.arguments.get('apps_to_add', [])
            error = self.arguments.get('error', None)
            reboot_required = self.arguments.get('reboot_required')
            app_id = self.arguments.get('app_id')
            success = self.arguments.get('success')
            results = (
                AddAppResults(
                    username, uri, method, agent_id,
                    app_id, oper_id, reboot_required,
                    success, data, apps_to_delete,
                    apps_to_add, error
                )
            )

            data = results.install_supported_apps(data)

            self.set_status(data['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(data, indent=4))
            send_notifications(username, customer_name, oper_id, agent_id)
        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'install_supported_apps results', e)
            )
            logger.exception(results)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))


class InstallAgentAppsResults(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            logger.info(self.request.body)
            oper_id = self.arguments.get('operation_id')
            data = self.arguments.get('data')
            apps_to_delete = self.arguments.get('apps_to_delete', [])
            apps_to_add = self.arguments.get('apps_to_add', [])
            error = self.arguments.get('error', None)
            reboot_required = self.arguments.get('reboot_required')
            app_id = self.arguments.get('app_id')
            success = self.arguments.get('success')
            results = (
                AddAppResults(
                    username, uri, method, agent_id,
                    app_id, oper_id, reboot_required,
                    success, data, apps_to_delete,
                    apps_to_add, error
                )
            )

            data = results.install_agent_update(data)

            self.set_status(data['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(data, indent=4))
            send_notifications(username, customer_name, oper_id, agent_id)
        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'install_agent_apps results', e)
            )
            logger.exception(results)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))


class UnInstallAppsResults(BaseHandler):
    @agent_authenticated_request
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            logger.info(self.request.body)
            oper_id = self.arguments.get('operation_id')
            data = self.arguments.get('data')
            apps_to_delete = self.arguments.get('apps_to_delete', [])
            apps_to_add = self.arguments.get('apps_to_add', [])
            error = self.arguments.get('error', None)
            reboot_required = self.arguments.get('reboot_required')
            app_id = self.arguments.get('app_id')
            success = self.arguments.get('success')
            results = (
                AddAppResults(
                    username, uri, method, agent_id,
                    app_id, oper_id, reboot_required,
                    success, data, apps_to_delete,
                    apps_to_add, error
                )
            )
            results_data = results.install_os_apps(data)
            self.set_status(results_data['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results_data, indent=4))
            send_notifications(username, customer_name, oper_id, agent_id)
        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'uninstall_os_apps results', e)
            )
            logger.exception(results)

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(dumps(results, indent=4))
