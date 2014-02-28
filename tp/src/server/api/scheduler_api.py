import tornado.httpserver
import tornado.web

import simplejson as json

import logging
import logging.config
from server.handlers import BaseHandler
from db.client import *
from errorz.error_messages import GenericResults
from errorz.status_codes import GenericCodes
from scheduler.jobManager import *
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import authenticated_request, permission_check
from server.hierarchy.permissions import Permission
from utils.common import *
from server.hierarchy.decorators import convert_json_to_arguments
from datetime import datetime

from jsonpickle import encode

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class ScheduleListerHandler(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri=self.request.uri
        method=self.request.method
        try:
            self.sched = self.application.scheduler
            results = job_lister(
                sched=self.sched, username=username,
                customer_name=customer_name.encode('utf-8'),
                uri=uri, method=method
            )

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('getting schedules', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class ScheduleAppDetailHandler(BaseHandler):
    @authenticated_request
    def get(self, jobname):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            self.sched = self.application.scheduler
            results = (
                get_schedule_details(
                    self.sched, job_name=jobname,
                    username=username, customer_name=customer_name,
                    uri=uri, method=method
                )
            )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))
        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('getting schedules', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

    @authenticated_request
    def delete(self, jobname):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri=self.request.uri
        method=self.request.method
        try:
            self.sched = self.application.scheduler
            results = (
                remove_job(
                    self.sched, jobname,
                    uri=uri,method=method,
                    customer_name=customer_name,
                    username=username
                )
            )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('delete schedule', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class SchedulerYearlyRecurrentJobHandler(BaseHandler):

    @authenticated_request
    @convert_json_to_arguments
    def post(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri=self.request.uri
        method=self.request.method
        try:
            result = None
            sched = self.application.scheduler
            operation = self.arguments.get('operation')
            pkg_type = self.arguments.get('pkg_type')
            severity = self.arguments.get('severity')
            jobname = self.arguments.get('jobname')
            node_ids = self.arguments.get('nodes', None)
            tag_ids = self.arguments.get('tags', None)
            all_tags = self.arguments.get('all_tags', False)
            all_agents = self.arguments.get('all_agents', False)
            epoch_time = self.arguments.get('epoch_time')
            every = self.arguments.get('every', None)
            custom = self.arguments.get('custom', None)

            if operation and jobname:
                results = (
                    add_yearly_recurrent(
                        sched, agent_ids=node_ids,all_agents=all_agents,
                        tag_ids=tag_ids, all_tags=all_tags, severity=severity,
                        pkg_type=pkg_type,operation=operation, 
                        name=jobname, epoch_time= epoch_time,
                        every = every, custom = custom,
                        customer_name=customer_name,
                        username=username, uri=uri, method=method,
                    )
                )

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('add yearly recurrent schedule', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

class SchedulerMonthlyRecurrentJobHandler(BaseHandler):

    @authenticated_request
    @convert_json_to_arguments
    def post(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            result = None
            sched = self.application.scheduler
            uri = self.request.uri
            method = self.request.method
            operation = self.arguments.get('operation', None)
            pkg_type = self.arguments.get('pkg_type', None)
            severity = self.arguments.get('severity', None)
            jobname = self.arguments.get('jobname', None)
            node_ids = self.arguments.get('nodes', None)
            tag_ids = self.arguments.get('tags', None)
            all_tags=self.arguments.get('all_tags', False)
            all_agents=self.arguments.get('all_agents', False)
            epoch_time = self.arguments.get('epoch_time')
            every = self.arguments.get('every', None)
            custom = self.arguments.get('custom', None)


            if operation and jobname:
                results = (
                    add_monthly_recurrent(
                        sched, agent_ids=node_ids,all_agents=all_agents,
                        all_tags=all_tags,tag_ids=tag_ids, severity=severity,
                        pkg_type=pkg_type,operation=operation, 
                        name=jobname, epoch_time= epoch_time,
                        custom = custom, every = every,
                        customer_name=customer_name,
                        username=username, uri=uri, method=method
                    )
                )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('add monthly recurrent schedule', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class SchedulerDailyRecurrentJobHandler(BaseHandler):

    @authenticated_request
    @convert_json_to_arguments
    def post(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            result = None
            sched = self.application.scheduler
            operation = self.arguments.get('operation', None)
            pkg_type = self.arguments.get('pkg_type', None)
            severity = self.arguments.get('severity', None)
            jobname = self.arguments.get('jobname', None)
            node_ids = self.arguments.get('nodes', None)
            tag_ids = self.arguments.get('tags', None)
            all_tags = self.arguments.get('all_tags', False)
            all_agents = self.arguments.get('all_agents', False)
            epoch_time = self.arguments.get('epoch_time')
            every = self.arguments.get('every', None)
            custom = self.arguments.get('custom', None)

            if operation and jobname:
                results = (
                    add_daily_recurrent(
                        sched, agent_ids=node_ids,all_agents=all_agents,
                        all_tags=all_tags,tag_ids=tag_ids, severity=severity,
                        pkg_type=pkg_type, operation=operation, 
                        name=jobname, epoch_time= epoch_time,
                        every = every, custom = custom,
                        customer_name=customer_name,
                        username=username, uri=uri, method=method,
                    )
                )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('add daily recurrent schedule', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class SchedulerWeeklyRecurrentJobHandler(BaseHandler):

    @authenticated_request
    @convert_json_to_arguments
    def post(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            result = None
            sched = self.application.scheduler
            operation = self.arguments.get('operation', None)
            pkg_type = self.arguments.get('pkg_type', None)
            severity = self.arguments.get('severity', None)
            jobname = self.arguments.get('jobname', None)
            node_ids = self.arguments.get('nodes', None)
            tag_ids = self.arguments.get('tags', None)
            all_tags = self.arguments.get('all_tags', False)
            all_agents = self.arguments.get('all_agents', False)
            epoch_time=self.arguments.get('epoch_time')
            every = self.arguments.get('every', None)
            custom=self.arguments.get('custom', None)
        
            results = (
                add_weekly_recurrent(
                    sched, agent_ids=node_ids,all_agents=all_agents,
                    all_tags=all_tags,tag_ids=tag_ids, severity=severity,
                    pkg_type=pkg_type, operation=operation, 
                    name=jobname, epoch_time=epoch_time,
                    every=every, custom=custom,
                    customer_name=customer_name,
                    username=username, uri=uri, method=method,
                )
            )

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('add custom recurrent schedule', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class SchedulerDateBasedJobHandler(BaseHandler):

    @authenticated_request
    @convert_json_to_arguments
    def post(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            result = None
            sched = self.application.scheduler
            operation = self.arguments.get('operation', None)
            pkg_type = self.arguments.get('pkg_type', None)
            severity = self.arguments.get('severity', None)
            epoch_time = self.arguments.get('epoch_time')
            date_to_execute = datetime.fromtimestamp(int(epoch_time))
            jobname = self.arguments.get('jobname')
            node_ids = self.arguments.get('nodes', None)
            tag_ids = self.arguments.get('tags', None)
            all_agents=self.arguments.get('all_agents', False)
            all_tags = self.arguments.get('all_tags', False)

            results = (
                schedule_once(
                    sched, agent_ids=node_ids,all_agents=all_agents,
                    all_tags=all_tags,tag_ids=tag_ids, severity=severity,
                    pkg_type=pkg_type, operation=operation, 
                    name=jobname, date=date_to_execute,
                    customer_name=customer_name,
                    username=username, uri=uri, method=method,
                )
            )
            
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('add schedule, once', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class SchedulerCustomRecurrentJobHandler(BaseHandler):

    @authenticated_request
    @convert_json_to_arguments
    def post(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            result = None
            sched = self.application.scheduler
            operation = self.arguments.get('operation', None)
            pkg_type = self.arguments.get('pkg_type', None)
            jobname = self.arguments.get('jobname')
            severity = self.arguments.get('severity')
            node_ids = self.arguments.get('nodes', None)
            tag_ids = self.arguments.get('tags', None)
            all_agents = self.arguments.get('all_agents', False)
            all_tags = self.arguments.get('all_tags', False)
            every = self.arguments.get('every')
            custom = self.arguments.get('custom') 
            epoch_time = self.arguments.get('epoch_time')
            datetime = datetime.fromtimestamp(epoch_time)
        
            results = (
                add_custom_recurrent(
                    sched, agent_ids=node_ids,all_agents=all_agents,
                    all_tags=all_tags,tag_ids=tag_ids, severity=severity,
                    pkg_type=pkg_type, operation=operation, name=jobname, 
                    every=every, custom=custom, frequency=frequency, date=datetime, 
                    customer_name=customer_name, username=username, 
                    uri=uri, method=method,
                )
            )
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('add custom recurrent schedule', '', e)
            )

            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))
