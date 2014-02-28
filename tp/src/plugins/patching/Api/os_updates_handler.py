from datetime import datetime
import tornado.httpserver
import tornado.web

import simplejson as json

from server.handlers import BaseHandler
import logging
import logging.config

from scheduler.jobManager import schedule_once

from plugins.patching.search.search_by_tagid import \
    RetrieveAppsByTagId

from plugins.patching.search.search_by_agentid import \
    RetrieveAppsByAgentId

from plugins.patching.search.search_by_appid import \
    RetrieveAppsByAppId

from plugins.patching.search.search_by_appid import \
    RetrieveAgentsByAppId

from plugins.patching.search.search import \
    RetrieveApps

from plugins.patching import *
from errorz.error_messages import GenericResults, PackageResults

from plugins.patching.store_operations import StoreOperation
from plugins.patching.rv_db_calls import update_hidden_status, update_os_app
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import authenticated_request, permission_check
from server.hierarchy.decorators import convert_json_to_arguments
from server.hierarchy.permissions import Permission

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class AgentIdOsAppsHandler(BaseHandler):
    @authenticated_request
    def get(self, agent_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        query = self.get_argument('query', None)
        count = int(self.get_argument('count', 30))
        offset = int(self.get_argument('offset', 0))
        status = self.get_argument('status', 'installed')
        severity = self.get_argument('severity', None)
        sort = self.get_argument('sort', 'asc')
        sort_by = self.get_argument('sort_by', AppsKey.Name)
        hidden = self.get_argument('hidden', 'false')
        if hidden == 'false':
            hidden = NO
        else:
            hidden = YES
        uri = self.request.uri
        method = self.request.method
        patches = (
            RetrieveAppsByAgentId(
                username, customer_name, agent_id,
                uri, method, count, offset,
                sort, sort_by, show_hidden=hidden
            )
        )
        if not query and not severity and status:
            results = patches.filter_by_status(status)

        elif not query and status and severity:
            results = patches.filter_by_status_and_sev(status, severity)

        elif severity and not query and not status:
            results = patches.filter_by_severity(severity)

        elif severity and status and query:
            results = (
                patches.filter_by_status_and_query_by_name_and_sev(
                    query, status, severity
                )
            )

        elif status and query:
            results = (
                patches.filter_by_status_and_query_by_name(
                    query, status
                )
            )

        elif severity and query:
            results = (
                patches.filter_by_sev_and_query_by_name(
                    query, severity
                )
            )

        elif query and not severity and not status:
            results = patches.query_by_name(query)

        else:
            results = (
                GenericResults(
                    username, uri, method
                ).incorrect_arguments()
            )

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))

    @authenticated_request
    @permission_check(permission=Permission.Install)
    @convert_json_to_arguments
    def put(self, agent_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            app_ids = self.arguments.get('app_ids')
            epoch_time = self.arguments.get('time', None)
            label = self.arguments.get('label', None)
            restart = self.arguments.get('restart', 'none')
            cpu_throttle = self.arguments.get('cpu_throttle', 'normal')
            net_throttle = self.arguments.get('net_throttle', 0)
            if not epoch_time and not label and app_ids:
                operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
                )
                results = (
                    operation.install_os_apps(
                        app_ids, cpu_throttle,
                        net_throttle, restart,
                        agentids=[agent_id]
                    )
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            elif epoch_time and label and app_ids:
                date_time = datetime.fromtimestamp(int(epoch_time))
                sched = self.application.scheduler
                job = (
                    {
                        'cpu_throttle': cpu_throttle,
                        'net_throttle': net_throttle,
                        'restart': restart,
                        'pkg_type': 'system_apps',
                        'app_ids': app_ids
                    }
                )
                add_install_job = (
                    schedule_once(
                        sched, customer_name, username,
                        [agent_id], operation='install',
                        name=label, date=date_time, uri=uri,
                        method=method, job_extra=job
                    )
                )
                result = add_install_job
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(result))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'install_os_apps', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


    @authenticated_request
    @permission_check(permission=Permission.Install)
    @convert_json_to_arguments
    def delete(self, agent_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            app_ids = self.arguments.get('app_ids')
            epoch_time = self.arguments.get('time', None)
            label = self.arguments.get('label', None)
            restart = self.arguments.get('restart', 'none')
            cpu_throttle = self.arguments.get('cpu_throttle', 'normal')
            net_throttle = self.arguments.get('net_throttle', 0)
            if not epoch_time and not label and app_ids:
                operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
                )
                results = (
                    operation.uninstall_apps(
                        app_ids, cpu_throttle,
                        net_throttle, restart,
                        agentids=[agent_id]
                    )
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            elif epoch_time and label and app_ids:
                date_time = datetime.fromtimestamp(int(epoch_time))
                sched = self.application.scheduler
                job = (
                    {
                        'cpu_throttle': cpu_throttle,
                        'net_throttle': net_throttle,
                        'restart': restart,
                        'pkg_type': 'system_apps',
                        'app_ids': app_ids
                    }
                )
                add_uninstall_job = (
                    schedule_once(
                        sched, customer_name, username,
                        [agent_id], operation='uninstall',
                        name=label, date=date_time, uri=uri,
                        method=method, job_extra=job
                    )
                )
                result = add_uninstall_job
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(result))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(agent_id, 'uninstall_os_apps', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class TagIdOsAppsHandler(BaseHandler):
    @authenticated_request
    def get(self, tag_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        query = self.get_argument('query', None)
        count = int(self.get_argument('count', 30))
        offset = int(self.get_argument('offset', 0))
        status = self.get_argument('status', 'installed')
        severity = self.get_argument('severity', None)
        sort = self.get_argument('sort', 'asc')
        sort_by = self.get_argument('sort_by', AppsKey.Name)
        hidden = self.get_argument('hidden', 'false')
        if hidden == 'false':
            hidden = NO
        else:
            hidden = YES
        uri = self.request.uri
        method = self.request.method
        patches = (
            RetrieveAppsByTagId(
                username, customer_name, tag_id,
                uri, method, count, offset,
                sort, sort_by, show_hidden=hidden
            )
        )
        if not query and not severity and status:
            results = patches.filter_by_status(status)

        elif not query and status and severity:
            results = patches.filter_by_status_and_sev(status, severity)

        elif severity and not query and not status:
            results = patches.filter_by_severity(severity)

        elif severity and status and query:
            results = (
                patches.filter_by_status_and_query_by_name_and_sev(
                    query, status, severity
                )
            )

        elif status and query:
            results = (
                patches.filter_by_status_and_query_by_name(
                    query, status
                )
            )

        elif severity and query:
            results = (
                patches.filter_by_sev_and_query_by_name(
                    query, severity
                )
            )

        elif query and not severity and not status:
            results = patches.query_by_name(query)

        else:
            results = (
                GenericResults(
                    username, uri, method
                ).incorrect_arguments()
            )

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))


    @authenticated_request
    @permission_check(permission=Permission.Install)
    @convert_json_to_arguments
    def put(self, tag_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            app_ids = self.arguments.get('app_ids')
            epoch_time = self.arguments.get('time', None)
            label = self.arguments.get('label', None)
            restart = self.arguments.get('restart', 'none')
            cpu_throttle = self.arguments.get('cpu_throttle', 'normal')
            net_throttle = self.arguments.get('net_throttle', 0)
            if not epoch_time and not label and app_ids:
                operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
                )
                results = (
                    operation.install_os_apps(
                        app_ids, cpu_throttle,
                        net_throttle, restart,
                        tag_id=tag_id
                    )
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            elif epoch_time and label and app_ids:
                date_time = datetime.fromtimestamp(int(epoch_time))
                sched = self.application.scheduler
                job = (
                    {
                        'cpu_throttle': cpu_throttle,
                        'net_throttle': net_throttle,
                        'restart': restart,
                        'pkg_type': 'system_apps',
                        'app_ids': app_ids
                    }
                )
                add_install_job = (
                    schedule_once(
                        sched, customer_name, username,
                        tag_ids=[tag_id], operation='install',
                        name=label, date=date_time, uri=uri,
                        method=method, job_extra=job
                    )
                )
                result = add_install_job
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(result))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(tag_id, 'install_os_apps', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    @permission_check(permission=Permission.Install)
    @convert_json_to_arguments
    def delete(self, tag_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            app_ids = self.arguments.get('app_ids')
            epoch_time = self.arguments.get('time', None)
            label = self.arguments.get('label', None)
            restart = self.arguments.get('restart', 'none')
            cpu_throttle = self.arguments.get('cpu_throttle', 'normal')
            net_throttle = self.arguments.get('net_throttle', 0)
            if not epoch_time and not label and app_ids:
                operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
                )
                results = (
                    operation.uninstall_apps(
                        app_ids, cpu_throttle,
                        net_throttle, restart,
                        tag_id=tag_id
                    )
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            elif epoch_time and label and app_ids:
                date_time = datetime.fromtimestamp(int(epoch_time))
                sched = self.application.scheduler
                job = (
                    {
                        'restart': restart,
                        'pkg_type': 'system_apps',
                        'app_ids': app_ids
                    }
                )
                add_uninstall_job = (
                    schedule_once(
                        sched, customer_name, username,
                        tag_ids=[tag_id], operation='uninstall',
                        name=label, date=date_time, uri=uri,
                        method=method, job_extra=job
                    )
                )
                result = add_uninstall_job
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(result))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(tag_id, 'install_os_apps', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class AppIdOsAppsHandler(BaseHandler):
    @authenticated_request
    def get(self, app_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        patches = (
            RetrieveAppsByAppId(
                username, customer_name, app_id,
                uri, method
            )
        )
        results = patches.get_by_app_id(stats=True)
        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))


    @authenticated_request
    @convert_json_to_arguments
    def post(self, app_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            severity = self.arguments.get('severity').capitalize()
            if severity in ValidRvSeverities:
                sev_data = (
                    {
                        AppsKey.RvSeverity: severity
                    }
                )
                update_os_app(
                    app_id, sev_data
                )
                results = (
                    GenericResults(
                        username, uri, method
                    ).object_updated(app_id, 'app severity', [sev_data])
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            else:
                results = (
                    PackageResults(
                        username, uri, method
                    ).invalid_severity(severity)
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(app_id, 'update_severity', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    @permission_check(permission=Permission.Install)
    @convert_json_to_arguments
    def put(self, app_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            agent_ids = self.arguments.get('agent_ids')
            epoch_time = self.arguments.get('time', None)
            label = self.arguments.get('label', None)
            restart = self.arguments.get('restart', 'none')
            cpu_throttle = self.arguments.get('cpu_throttle', 'normal')
            net_throttle = self.arguments.get('net_throttle', 0)
            if not epoch_time and not label and agent_ids:
                operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
                )
                results = (
                    operation.install_os_apps(
                        [app_id], cpu_throttle,
                        net_throttle, restart,
                        agentids=agent_ids
                    )
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            elif epoch_time and label and agent_ids:
                date_time = datetime.fromtimestamp(int(epoch_time))
                sched = self.application.scheduler
                job = (
                    {
                        'cpu_throttle': cpu_throttle,
                        'net_throttle': net_throttle,
                        'restart': restart,
                        'pkg_type': 'system_apps',
                        'app_ids': [app_id]
                    }
                )
                add_install_job = (
                    schedule_once(
                        sched, customer_name, username,
                        agent_ids=[agent_ids], operation='install',
                        name=label, date=date_time, uri=uri,
                        method=method, job_extra=job
                    )
                )
                result = add_install_job
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(result))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(app_id, 'install_os_apps', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    @permission_check(permission=Permission.Install)
    @convert_json_to_arguments
    def delete(self, app_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            agent_ids = self.arguments.get('agent_ids')
            epoch_time = self.arguments.get('time', None)
            label = self.arguments.get('label', None)
            restart = self.arguments.get('restart', 'none')
            cpu_throttle = self.arguments.get('cpu_throttle', 'normal')
            net_throttle = self.arguments.get('net_throttle', 0)
            if not epoch_time and not label and app_id:
                operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
                )
                results = (
                    operation.uninstall_apps(
                        [app_id], cpu_throttle,
                        net_throttle, restart,
                        agentids=agent_ids
                    )
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            elif epoch_time and label and agent_ids:
                date_time = datetime.fromtimestamp(int(epoch_time))
                sched = self.application.scheduler
                job = (
                    {
                        'restart': restart,
                        'pkg_type': 'system_apps',
                        'app_ids': [app_id]
                    }
                )
                add_uninstall_job = (
                    schedule_once(
                        sched, customer_name, username,
                        agent_ids=[agent_ids], operation='uninstall',
                        name=label, date=date_time, uri=uri,
                        method=method, job_extra=job
                    )
                )
                result = add_uninstall_job
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(result))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(app_id, 'install_os_apps', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class GetAgentsByAppIdHandler(BaseHandler):
    @authenticated_request
    def get(self, app_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        query = self.get_argument('query', None)
        count = int(self.get_argument('count', 30))
        offset = int(self.get_argument('offset', 0))
        status = self.get_argument('status', 'installed')
        uri = self.request.uri
        method = self.request.method
        agents = (
            RetrieveAgentsByAppId(
                username, customer_name, app_id,
                uri, method, count, offset
            )
        )

        if status and not query:
            results = (
                agents.filter_by_status(
                    status
                )
            )

        elif status and query:
            results = (
                agents.filter_by_status_and_query_by_name(
                    query, status
                )
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


    @authenticated_request
    @permission_check(permission=Permission.Install)
    @convert_json_to_arguments
    def put(self, app_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            agent_ids = self.arguments.get('agent_ids')
            epoch_time = self.arguments.get('time', None)
            label = self.arguments.get('label', None)
            restart = self.arguments.get('restart', 'none')
            cpu_throttle = self.arguments.get('cpu_throttle', 'normal')
            net_throttle = self.arguments.get('net_throttle', 0)
            if not epoch_time and not label and agent_ids:
                operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
                )
                results = (
                    operation.install_os_apps(
                        [app_id], cpu_throttle,
                        net_throttle, restart,
                        agentids=agent_ids
                    )
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            elif epoch_time and label and agent_ids:
                date_time = datetime.fromtimestamp(int(epoch_time))
                sched = self.application.scheduler
                job = (
                    {
                        'cpu_throttle': cpu_throttle,
                        'net_throttle': net_throttle,
                        'restart': restart,
                        'pkg_type': 'system_apps',
                        'app_ids': [app_id]
                    }
                )
                add_install_job = (
                    schedule_once(
                        sched, customer_name, username,
                        agent_ids=agent_ids, operation='install',
                        name=label, date=date_time, uri=uri,
                        method=method, job_extra=job
                    )
                )
                result = add_install_job
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(result))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(app_id, 'install_os_apps', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    @permission_check(permission=Permission.Install)
    @convert_json_to_arguments
    def delete(self, app_id):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            agent_ids = self.arguments.get('agent_ids')
            epoch_time = self.arguments.get('time', None)
            label = self.arguments.get('label', None)
            restart = self.arguments.get('restart', 'none')
            cpu_throttle = self.arguments.get('cpu_throttle', 'normal')
            net_throttle = self.arguments.get('net_throttle', 0)
            if not epoch_time and not label and app_id:
                operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
                )
                results = (
                    operation.uninstall_apps(
                        [app_id], cpu_throttle,
                        net_throttle, restart,
                        agentids=agent_ids
                    )
                )
                self.set_status(results['http_status'])
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(results, indent=4))

            elif epoch_time and label and agent_ids:
                date_time = datetime.fromtimestamp(int(epoch_time))
                sched = self.application.scheduler
                job = (
                    {
                        'restart': restart,
                        'pkg_type': 'system_apps',
                        'app_ids': [app_id]
                    }
                )
                add_uninstall_job = (
                    schedule_once(
                        sched, customer_name, username,
                        agent_ids=agent_ids, operation='uninstall',
                        name=label, date=date_time, uri=uri,
                        method=method, job_extra=job
                    )
                )
                result = add_uninstall_job
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps(result))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(app_id, 'install_os_apps', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class OsAppsHandler(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        query = self.get_argument('query', None)
        count = int(self.get_argument('count', 30))
        offset = int(self.get_argument('offset', 0))
        status = self.get_argument('status', None)
        severity = self.get_argument('severity', None)
        sort = self.get_argument('sort', 'asc')
        sort_by = self.get_argument('sort_by', AppsKey.Name)
        hidden = self.get_argument('hidden', 'false')
        if hidden == 'false':
            hidden = NO
        else:
            hidden = YES
        uri = self.request.uri
        method = self.request.method
        if sort_by == 'severity':
            sort_by = AppsKey.RvSeverity

        patches = (
            RetrieveApps(
                username, customer_name,
                uri, method, count, offset,
                sort, sort_by, show_hidden=hidden
            )
        )
        if not query and not severity and not status:
            results = patches.get_all_apps()

        elif not query and status and severity:
            results = patches.filter_by_status_and_sev(status, severity)

        elif severity and not query and not status:
            results = patches.filter_by_severity(severity)

        elif severity and status and query:
            results = (
                patches.filter_by_status_and_query_by_name_and_sev(
                    query, status, severity
                )
            )

        elif status and not query and not severity:
            results = (
                patches.filter_by_status(
                    status
                )
            )

        elif status and query:
            results = (
                patches.filter_by_status_and_query_by_name(
                    query, status
                )
            )

        elif severity and query:
            results = (
                patches.filter_by_sev_and_query_by_name(
                    query, severity
                )
            )

        elif query and not severity and not status:
            results = patches.query_by_name(query)

        else:
            results = (
                GenericResults(
                    username, uri, method
                ).incorrect_arguments()
            )

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))

    @authenticated_request
    @convert_json_to_arguments
    def put(self):
        username = self.get_current_user().encode('utf-8')
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            app_ids = self.arguments.get('app_ids')
            toggle = self.arguments.get('hide', 'toggle')
            results = (
                update_hidden_status(
                    username, customer_name, uri,
                    method, app_ids, toggle
                )
            )

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            logger.exception(e)
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(app_ids, 'toggle hidden on os_apps', e)
            )

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))
