#!/usr/bin/env python

from datetime import datetime
import logging
import logging.config
from copy import deepcopy
import apscheduler
from apscheduler.scheduler import Scheduler
from apscheduler.jobstores.redis_store import RedisJobStore

from utils.common import *
from db.client import db_create_close, r, db_connect
from agent import *
from tagging import *
from agent.agents import get_all_agent_ids, get_agent_info
from tagging.tagManager import get_all_tag_ids, get_tags_info, \
    get_tags_info_from_tag_ids
from plugins.patching import *
from plugins.patching.rv_db_calls import \
    get_appids_by_agentid_and_status, get_app_data, get_app_data_by_appids
from tagging.tagManager import get_agent_ids_from_tag
from plugins.patching.store_operations import StoreOperation
from errorz.error_messages import GenericResults, SchedulerResults
from server.hierarchy import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


@db_create_close
def start_scheduler(redis_db=10, conn=None):
    started = False
    sched = Scheduler(daemonic=False)
    list_of_customers = []
    customers = (
        r
        .table(Collection.Customers)
        .pluck(CustomerKey.CustomerName)
        .run(conn)
    )
    sched.add_jobstore(RedisJobStore(db=redis_db), 'patching')
    list_of_customers.append({'name': 'patching'})
    if customers:
        for customer in customers:
            sched.add_jobstore(RedisJobStore(db=redis_db),
                               customer[CustomerKey.CustomerName])
            list_of_customers.append(
                {
                    'name': customer[CustomerKey.CustomerName]
                }
            )
    if list_of_customers:
        msg = 'Starting Job Scheduler for customers %s' %\
            (', '.join(map(lambda x: x['name'], list_of_customers)))
        logger.info(msg)
        try:
            sched.start()
            logger.info('Scheduler Started Successfully')
            started = True
        except Exception as e:
            logger.error('Failed ot start Scheduler due to : %s' % (e))
            sched.shutdown()

    if started:
        return(sched)
    else:
        return(started)


def stop_scheduler(sched):
    stopped = False
    try:
        logger.info('Attempting to shutdown the Scheduler')
        sched.shutdown()
        logger.info('Scheduler has shutdown')
        stopped = True
    except Exception as e:
        log.error('Failed to shutdown the Scheduler')

    return(stopped)


def restart_scheduler():
    stop = stop_scheduler()
    succesfull = False
    sched = None
    if stop:
        start = start_scheduler()
        if start:
            sched = start
            successfull = True
            log.info('Scheduler restarted successfully')

    return(sched)


def job_exists(sched, jobname, customer_name, username):
    jobs = sched.get_jobs(name=customer_name)
    job_exists = False
    msg = ''
    count = 0
    for schedule in jobs:
        if jobname in schedule.name:
            msg = 'job with name %s already exists' % jobname
            logger.info(msg)
            job_exists = True

    return(job_exists)


@db_create_close
def job_lister(sched, customer_name, username, uri=None, method=None, conn=None):

    jobs = sched.get_jobs(name=customer_name)
    job_listing = []
    username = None
    cname = None
    agents = []
    tags = []

    for schedule in jobs:
        job = None
        cp_of_sched = deepcopy(schedule.args)
        if len(schedule.args) > 1:
            username = cp_of_sched.pop()
            cname = cp_of_sched.pop()
        if cp_of_sched:
            job = cp_of_sched.pop(0)
        else:
            continue
        if not isinstance(job, dict):
            json_is_valid, json_job = verify_json_is_valid(job)
        else:
            json_job = job
            json_is_valid = isinstance(json_job, dict)

        if isinstance(schedule.trigger,
                      apscheduler.triggers.cron.CronTrigger):
            schedule_type = 'cron'

        elif isinstance(schedule.trigger,
                        apscheduler.triggers.interval.IntervalTrigger):
            schedule_type = 'interval'

        elif isinstance(schedule.trigger,
                        apscheduler.triggers.simple.SimpleTrigger):
            schedule_type = 'once'

        json_job['next_run_time'] = str(schedule.next_run_time)
        json_job['job_name'] = schedule.name
        json_job['runs'] = schedule.runs
        json_job['username'] = username
        json_job['customer_name'] = customer_name
        json_job['schedule_type'] = schedule_type
        json_job['uri'] = uri
        json_job['method'] = method
        tag_ids = json_job.pop('tag_ids')
        agent_ids = json_job.pop('agent_ids')

        job_listing.append(json_job)

    try:
        data = job_listing
        results = (
            GenericResults(
                username, uri, method,
            ).information_retrieved(data, len(data))
        )

    except Exception as e:
        logger.exception(e)
        results = (
            GenericResults(
                username, uri, method
            ).something_broke(json_jon['job_name'], 'failed to retrieve data', e)
        )
    return(results)

@db_create_close
def get_agentids_per_job(job_info, customer_name, username,  conn=None):

    agent_ids = job_info['agent_ids']
    tag_ids = job_info['tag_ids']
    all_agents = job_info['all_agents']
    all_tags = job_info['all_tags']

    if (all_agents and not job_info['agent_ids']
            and not job_info['tag_ids'] and not all_tags):
        agent_ids = get_all_agent_ids(customer_name)

    elif (job_info['agent_ids'] and not all_agents
            and not job_info['tag_ids'] and not all_tags):
        agent_ids = agent_ids

    elif (all_tags and not all_agents and not
            job_info['agent_ids'] and not job_info['tag_ids']):
        agent_ids = []
        tag_ids = get_all_tag_ids(customer_name)

        if tag_ids:
            for tag_id in tag_ids:
                agent_ids = agent_ids + get_agent_ids_from_tag(tag_id)

        agent_ids = list(set(agent_ids))

    elif (job_info['tag_ids'] and not all_agents and not
            job_info['agent_ids'] and not all_tags):
        agent_ids = []
        tag_ids = tag_ids
        for tag_id in tag_ids:
            agent_ids = agent_ids + get_agent_ids_from_tag(tag_id)

        agent_ids = list(set(agent_ids))

    return(agent_ids)


def get_tags_per_job(job_info, username, customer_name, conn=None):

    tags = []
    keys_to_pluck = [TagsKey.TagId, TagsKey.TagName]

    if job_info['all_tags']:
        tags = get_tags_info(customer_name, keys_to_pluck)

    elif job_info['tag_ids']:
        tags = (
            get_tags_info_from_tag_ids(
                job_info['tag_ids'], keys_to_pluck
            )
        )

    return(tags)


def remove_job(sched, jobname, customer_name,
               username, uri=None, method=None):

    jobs = sched.get_jobs(name=customer_name)
    count = 0
    for schedule in jobs:
        if jobname in schedule.name:
            try:
                sched.unschedule_job(schedule)
                count = count + 1
                results = (
                    SchedulerResults(username, uri, method)
                    .removed(jobname)
                )
            except Exception as e:
                logger.exception(e)
                count = count + 1
                results = (
                    SchedulerResults(username, uri, method)
                    .remove_failed(jobname)
                )

    if count == 0:
        results = (
            SchedulerResults(username, uri, method)
            .invalid_schedule_name(jobname)
        )

    return(results)


def get_appid_list(agent_id, severity=None,
                   table=AppsPerAgentCollection):

    severities = ['Critical', 'Recommended', 'Optional']

    if severity:
        severity = severity.capitalize()

    if severity in severities:
        appids = (
            get_appids_by_agentid_and_status(
                agent_id, AVAILABLE, severity,
                table
            )
        )
    else:
        appids = (
            get_appids_by_agentid_and_status(
                agent_id, AVAILABLE,
                table=table
            )
        )

    return(appids)


def get_app_for_appids(table, app_id, conn=None):
    fields_to_pluck = [AppsKey.AppId, AppsKey.Name, AppsKey.RvSeverity]
    app = (
        get_app_data(
            app_id, table=table,
            fields_to_pluck=fields_to_pluck
        )
    )

    return(app)

@db_create_close
def get_agent_apps_details(job, agent_id, details=True, conn=None):
    app_ids = []
    app_ids_needed = []
    apps = []
    app_keys_to_pluck = [
        AppsKey.AppId,
        AppsKey.Name,
        AppsKey.RvSeverity
    ]

    if job['pkg_type'] == 'system_apps':
        CurrentAppsPerAgentCollection = AppsPerAgentCollection
        CurrentAppsCollection = AppsCollection

    elif job['pkg_type'] == 'custom_apps':
        CurrentAppsPerAgentCollection = CustomAppsPerAgentCollection
        CurrentAppsCollection = CustomAppsCollection

    elif job['pkg_type'] == 'supported_apps':
        CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
        CurrentAppsCollection = SupportedAppsCollection

    if not job.get('app_ids', None):
        app_ids = (
            get_appid_list(
                agent_id, job['severity'],
                CurrentAppsPerAgentCollection
            )
        )
    else:
        app_ids = job['app_ids']

    for app_id in app_ids:
        app_info=list(
                r
                .table(CurrentAppsCollection)
                .filter(
                    {
                        AppsKey.AppId:app_id
                        }
                    )
                .pluck(AppsKey.Hidden)
                .run(conn)
                )
        if app_info[0][AppsKey.Hidden] == 'no':
            app_ids_needed.append(app_id)

    if app_ids_needed and details:
        apps = (
            get_app_data_by_appids(
                app_ids_needed,
                table=CurrentAppsCollection,
                fields_to_pluck=app_keys_to_pluck
            )
        )
    elif app_ids_needed and not details:
        apps = app_ids_needed

    return(apps)


def get_schedule_details(sched, job_name, username,
                         customer_name,
                         uri=None, method=None,
                         conn=None):

    agents = []
    apps = []
    app_details = []
    tags = []

    jobs = sched.get_jobs(name=customer_name)
    agent_keys_to_pluck = [
        AgentKey.ComputerName,
        AgentKey.DisplayName,
        AgentKey.AgentId
    ]

    try:
        for schedule in jobs:
            if job_name == schedule.name:
                job = schedule.args[0]
                if job:
                    tags = (
                        get_tags_per_job(
                            job_info=job, username=username,
                            customer_name=customer_name
                        )
                    )
                    agent_ids = (
                        get_agentids_per_job(
                            job_info=job,
                            customer_name=customer_name,
                            username=username
                        )
                    )
                    if agent_ids:
                        for agent_id in agent_ids:
                            agent_id = agent_id
                            agent = (
                                get_agent_info(
                                    agent_id,
                                    agent_keys_to_pluck
                                )
                            )
                            if job['operation'] == 'install':
                                apps = (
                                    get_agent_apps_details(
                                        job, agent_id
                                    )
                                )
                                agent['apps'] = apps
                                agents.append(agent)

                            else:
                                agents.append(agent)

                    data = {
                        'agents': agents,
                        'tags': tags,
                        'next_run_time': str(schedule.next_run_time),
                        'job_name': schedule.name,
                        'runs': schedule.runs,
                        'username': username,
                        'customer_name': customer_name,
                        'operation': job['operation'],
                    }

                    if job['operation'] == 'install':
                        data['pkg_type'] = job['pkg_type']
                        data['severity'] = job['severity']

                    elif job['operation'] == 'reboot':
                        data['pkg_type'] = None
                        data['severity'] = None

                    results = (
                        GenericResults(
                            username, uri, method,
                        ).information_retrieved(data, len(data))
                    )


    except Exception as e:
        logger.exception(e)
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('schedules', 'failed to retrieve data', e)
        )

    return(results)

def scheduled_install_operation(job_info, customer_name,
                                username, uri=None, method=None):
    agent_ids = job_info['agent_ids']
    tag_ids = job_info['tag_ids']
    if job_info['severity']:
        severity = job_info['severity'].capitalize()
    else:
        severity = None

    jobname = job_info['job_name']

    store_operation = (
        StoreOperation(
            customer_name=customer_name,
            username=username, uri=uri, method=method
        )
    )

    if not agent_ids:
        agent_ids = []

    if not tag_ids:
        tag_ids = []

    agent_ids = (
        get_agentids_per_job(
            job_info=job_info, username=username,
            customer_name=customer_name
        )
    )

    msg = (
        '%s - Scheduled job %s is in the process\
        of running on the following agents\
        %s' % (username, jobname, agent_ids)
    )

    logger.info(msg)
    if agent_ids:
        for agent_id in agent_ids:
            if job_info['operation'] == 'install':
                if not job_info.get('app_ids', None):
                    job_info['app_ids'] = (
                        get_agent_apps_details(
                            job_info, agent_id, details=False
                        )
                    )
                if job_info['app_ids']:
                    logger.debug(
                        " About to execute the job %s" % (job_info)
                    )
                if job_info['pkg_type'] == 'system_apps':
                    oper = (
                        store_operation.install_os_apps(
                            job_info['app_ids'],
                            agentids=job_info['agent_ids'],
                            tag_id=job_info['tag_ids'],
                            restart=None
                        )
                    )
                    logger.debug(oper)

                elif job_info['pkg_type'] == 'custom_apps':
                    oper = (
                        store_operation.install_custom_apps(
                            job_info['app_ids'],
                            agentids=job_info['agent_ids'],
                            tag_id=job_info['tag_ids'],
                            restart=None
                        )
                    )
                    logger.debug(oper)

                elif job_info['pkg_type'] == 'supported_apps':
                    oper = (
                        store_operation.install_supported_apps(
                            job_info['app_ids'],
                            agentids=job_info['agent_ids'],
                            tag_id=job_info['tag_ids'],
                            restart=None
                        )
                    )

                    logger.debug(oper)


def scheduled_reboot_operation(job_info, customer_name, username,
                               uri=None, method=None, conn=None):

    store_operation = (
        StoreOperation(
            customer_name=customer_name,
            username=username, uri=uri, method=method
        )
    )

    operation = job_info['operation']
    agent_ids = (
        get_agentids_per_job(
            job_info=job_info,
            username=username,
            customer_name=customer_name
        )
    )

    if operation == 'reboot':
        logger.debug(" About to execute the job %s" % (job_info))
        oper = store_operation.reboot(agentids=agent_ids)
        logger.debug(oper)


def operation_info(operation=None, pkg_type=None, severity=None,
                   tag_ids=None, agent_ids=None, name=None,
                   all_agents=None, all_tags=None):

    jobby_job = {
        'operation': operation,
        'pkg_type': pkg_type,
        'severity': severity,
        'tag_ids': tag_ids,
        'agent_ids': agent_ids,
        'job_name': name,
        'all_agents': all_agents,
        'all_tags': all_tags,
    }

    return(jobby_job)


def add_yearly_recurrent(sched, customer_name, username,
                            agent_ids=None, all_agents=None,
                            tag_ids=None, all_tags=None,severity=None,
                            pkg_type=None, operation=None, name=None, 
                            custom=None, every=None, epoch_time=None,
                            uri=None, method=None,):

    if epoch_time:
        date=datetime.fromtimestamp(int(epoch_time))
        year = date.year
        month = date.month
        day = date.day
        hour = date.hour
        minute = date.minute

    succeeded = False
    msg = 'Recurrent Scheduled added successfully'
    job_data = (
        {
           'month': month,
           'day': day,
           'hour': hour,
           'minute': minute,
           'job_name': name,
           'all_tags': all_tags,
           'all_agents': all_agents,
           'agent_ids': agent_ids,
           'tag_ids': tag_ids,
           'operation': operation,
           'severity': severity,
           'pkg_type': pkg_type,
           'customer_name': customer_name,
           'created_by': username
        }
    )
    if name:
        job_exist = job_exists(sched=sched, jobname=name,
                                username=username, 
                                customer_name=customer_name,
                                )
        if job_exist:
            msg = 'Job Name Already Exists. Job Can not be Added'
            results = (
                 SchedulerResults(
                     username, uri, method
                 ).exists(name)
            )
        
        else:
            jobby_job = (
                operation_info(
                    operation=operation, pkg_type=pkg_type,
                    agent_ids=agent_ids, 
                    all_agents=all_agents,tag_ids=tag_ids, 
                    all_tags=all_tags, severity=severity, name=name
                )
            )

            if jobby_job['operation'] == 'install':
                
                try:
                    if not custom and not every:
                        sched.add_cron_job(
                                scheduled_install_operation,month=month, 
                                day=day, hour=hour, minute=minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                    
                    elif custom and every:
                        year = ("{0}/{1}".format(year,every))
                        month = (",".join(custom))
                        sched.add_cron_job(
                                scheduled_install_operation, year = year,
                                month=month, day=day, hour=hour, minute=minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                    results = (
                            SchedulerResults(
                                username, uri, method
                                ).created(name, job_data)
                            )
                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )

                
            elif jobby_job['operation'] == 'reboot':
                try:
                    if not custom and not every:
                        sched.add_cron_job(
                                scheduled_reboot_operation, month=month,
                                hour=hour,minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                    
                    elif custom and every:
                        year = ("{0}/{1}".format(year,every))
                        month = (",".join(custom))
                        sched.add_cron_job(
                                scheduled_reboot_operation, year = year,
                                month=month, day=day, hour=hour, minute=minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                    results = (
                            SchedulerResults(
                                username, uri, method
                                ).created(name, job_data)
                            )
                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )
                    
    return(results)


def add_monthly_recurrent(sched, customer_name, username,
                            agent_ids=None, all_agents=None,
                            tag_ids=None, all_tags=None,severity=None,
                            pkg_type=None, operation=None, name=None, 
                            custom=None, every=None, epoch_time=None,
                            uri=None, method=None,):

    if epoch_time:
        date=datetime.fromtimestamp(int(epoch_time))
        month = date.month
        day = date.day
        hour = date.hour
        minute = date.minute
        
    
    job_data = (
        {
           'day': day,
           'hour': hour,
           'minute': minute,
           'job_name': name,
           'all_tags': all_tags,
           'all_agents': all_agents,
           'agent_ids': agent_ids,
           'tag_ids': tag_ids,
           'operation': operation,
           'severity': severity,
           'pkg_type': pkg_type,
           'customer_name': customer_name,
           'created_by': username
        }
    )
    
    if name:
        job_exist = job_exists(sched=sched, jobname=name,
                                customer_name=customer_name, 
                                username=username
                                )
        
        if job_exist:
            msg = 'Job Name Already Exists. Job Can not be Added'
            results = (
                 SchedulerResults(
                     username, uri, method
                 ).exists(name)
            )
        
        else:
            jobby_job = (
                operation_info(
                    operation=operation, pkg_type=pkg_type, agent_ids=agent_ids,
                    all_agents=all_agents,tag_ids=tag_ids,
                    all_tags=all_tags, severity=severity, name=name
                )
            )
            
            if jobby_job['operation'] == 'install':
                
                try:
                    if not custom and not every:
                        sched.add_cron_job(
                                scheduled_install_operation, 
                                day=day, hour=hour, minute=minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )

                    elif custom and every:
                        month = ("{0}/{1}".format(month,every))
                        day = (",".join(custom))
                        sched.add_cron_job(
                                scheduled_install_operation,month = month, 
                                day=day, hour=hour, minute=minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                    results = (
                            SchedulerResults(
                                username, uri, method
                                ).created(name, job_data)
                            )
                
                except Exception as e:
                    logger.exception(e)
                    results = (
                            GenericResults(
                                username, uri, method
                                ).something_broke(name, 'adding schedule', e)
                            )
                
            elif jobby_job['operation'] == 'reboot':
                try:
                    if not custom and not every:
                        sched.add_cron_job(
                                scheduled_reboot_operation, day=day,
                                hour=hour,minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )

                    elif custom and every:
                        month = ("{0}/{1}".format(month,every))
                        day = (",".join(custom))
                        sched.add_cron_job(
                                scheduled_reboot_operation, month=month,
                                day=day, hour=hour,minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                    results = (
                            SchedulerResults(
                                username, uri, method
                                ).created(name, job_data)
                            )
                
                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )
    
    return(results)

def add_daily_recurrent(sched, customer_name, username,
                            agent_ids=None, all_agents=None,tag_ids=None, 
                            all_tags=None, severity=None, pkg_type=None,
                            operation=None, name=None, every=None, custom=None,
                            epoch_time=None, uri=None, method=None,):

    if epoch_time:
        date=datetime.fromtimestamp(int(epoch_time))
        day = date.day
        hour = date.hour
        minute = date.minute

    job_data = (
        {
           'hour': hour,
           'minute': minute,
           'job_name': name,
           'all_tags': all_tags,
           'all_agents': all_agents,
           'agent_ids': agent_ids,
           'tag_ids': tag_ids,
           'operation': operation,
           'severity': severity,
           'pkg_type': pkg_type,
           'customer_name': customer_name,
           'created_by': username
        }
    )
    succeeded = False
    msg = 'Recurrent Scheduled added successfully'
    if name:
        job_exist = job_exists(sched=sched, jobname=name,
                                customer_name=customer_name, 
                                username=username
                                )
        if job_exist:
            msg = 'Job Name Already Exists. Job Can not be Added'
            results = (
                 SchedulerResults(
                     username, uri, method
                 ).exists(name)
            )
        
        else:
            jobby_job = (
                operation_info(
                    operation=operation, pkg_type=pkg_type, agent_ids=agent_ids, 
                    all_agents=all_agents,tag_ids=tag_ids, 
                    all_tags=all_tags, severity=severity, name=name
                )
            )
            if jobby_job['operation'] == 'install':
                try:
                    if not custom and not every:
                        sched.add_cron_job(scheduled_install_operation, 
                                hour=hour, minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name)
                    elif every:
                        day = ("{0}/{1}".format(date.day, every))
                        sched.add_cron_job(scheduled_install_operation,
                                day = day, hour=hour, minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name)

                    results = (
                        SchedulerResults(
                            username, uri, method
                        ).created(name, job_data)
                    )

                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )

            elif jobby_job['operation'] == 'reboot':
                try:
                    if not custom and not every:
                        sched.add_cron_job(
                                scheduled_reboot_operation,
                                hour=hour, minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                    elif every:
                        day = ("{0}/{1}".format(date.day, every))
                        sched.add_cron_job(scheduled_install_operation, 
                                day = day, hour=hour, minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name)

                    results = (
                        SchedulerResults(
                            username, uri, method
                        ).created(name, job_data)
                    )

                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )

    return(results)
       

def add_weekly_recurrent(sched, customer_name, username,
                            agent_ids=None, all_agents=None,tag_ids=None, 
                            all_tags=None,severity=None, pkg_type=None, operation=None,
                            name=None, every=None, custom=None,
                            epoch_time=None, uri=None, method=None,):

    if epoch_time:
        date=datetime.fromtimestamp(int(epoch_time))
        week_num= (date.isocalendar()[1])
        week=("{0}/{1}".format(week_num,every))
        day_of_week = date.weekday()
        hour = date.hour
        minute = date.minute
        
    job_data = (
        {
           'hour': hour,
           'minute': minute,
           'day_of_week': day_of_week,
           'week_num':week_num,
           'job_name': name,
           'all_tags': all_tags,
           'all_agents': all_agents,
           'agent_ids': agent_ids,
           'tag_ids': tag_ids,
           'operation': operation,
           'severity': severity,
           'pkg_type': pkg_type,
           'customer_name': customer_name,
           'created_by': username
        }
    )
    succeeded = False
    msg = 'Recurrent Scheduled added successfully'
    
    if name:
        job_exist = job_exists(sched=sched, jobname=name,
                                username=username, 
                                customer_name=customer_name
                                )
        if job_exist:
            msg = 'Job Name Already Exists. Job Can not be Added'
            results = (
                 SchedulerResults(
                     username, uri, method
                 ).exists(name)
            )

        else: 
            jobby_job = (
                operation_info(
                    operation=operation, pkg_type=pkg_type, agent_ids=agent_ids, 
                    all_agents=all_agents,tag_ids=tag_ids, 
                    all_tags=all_tags, severity=severity, name=name
                )
            )
            if jobby_job['operation'] == 'install':
                try:
                    if not custom and not every:
                        sched.add_cron_job(
                            scheduled_install_operation, day_of_week=day_of_week,
                            hour=hour, minute=minute,
                            args=[jobby_job, customer_name, username],
                            name=name, jobstore=customer_name
                            )

                    elif custom and every:
                        week=("{0}/{1}".format(week_num,every))
                        day_of_week = (",".join(custom))

                        sched.add_cron_job(
                            scheduled_install_operation, week=week,
                            day_of_week=day_of_week,
                            hour=hour, minute=minute,
                            args=[jobby_job, customer_name, username],
                            name=name, jobstore=customer_name
                            )
                        
                    results = (
                            SchedulerResults(
                                username, uri, method
                                ).created(name, job_data)
                            )

                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )
                
            elif jobby_job['operation'] == 'reboot':

                try:
                    if not custom:
                        sched.add_cron_job(
                                scheduled_reboot_operation,day_of_week=day_of_week,
                                hour=hour, minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                    elif custom:
                        sched.add_cron_job(
                                scheduled_reboot_operation, week=week,
                                day_of_week=day_of_week,
                                hour=hour, minute=minute,
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )

                    results = (
                        SchedulerResults(
                            username, uri, method
                        ).created(name, job_data)
                    )

                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )
    
                
    return(results)


def schedule_once(sched, customer_name, username,
                  agent_ids=None, all_agents=None, tag_ids=None,
                  all_tags=None, severity=None, pkg_type=None, operation=None,
                  name=None, date=None, uri=None, method=None,
                  job_extra=None):

    job_data = (
        {
           'job_name': name,
           'all_tags': all_tags,
           'all_agents': all_agents,
           'agent_ids': agent_ids,
           'tag_ids': tag_ids,
           'operation': operation,
           'severity': severity,
           'pkg_type': pkg_type,
           'customer_name': customer_name,
           'created_by': username
        }
    )
    succeeded = False
    msg = 'Recurrent Scheduled added successfully'
    if name:
        job_exist = job_exists(sched=sched, jobname=name, 
                                customer_name=customer_name,
                                username=username)
        if job_exist:
            msg = 'Job Name Already Exists. Job Can not be Added'
            results = (
                 SchedulerResults(
                     username, uri, method
                 ).exists(name)
            )
        else:
            jobby_job = (
                operation_info(
                    operation=operation, pkg_type=pkg_type,
                    agent_ids=agent_ids, all_agents=all_agents,
                    tag_ids=tag_ids, all_tags=all_tags,
                    severity=severity, name=name
                )
            )
            if job_extra:
                for key, val in job_extra.items():
                    jobby_job[key] = val

            if jobby_job['operation'] == 'install':
                try:
                    sched.add_date_job(
                        scheduled_install_operation, date=date,
                        args=[jobby_job, customer_name, username],
                        name=name, jobstore=customer_name
                    )

                    results = (
                        SchedulerResults(
                            username, uri, method
                        ).created(name, job_data)
                    )
                
                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )
                
            elif jobby_job['operation'] == 'reboot':

                try:
                    sched.add_date_job(
                        scheduled_reboot_operation,
                        date=date,
                        args=[jobby_job, customer_name, username],
                        name=name, jobstore=customer_name
                    )
                    results = (
                        SchedulerResults(
                            username, uri, method
                        ).created(name, job_data)
                    )

                except Exception as e:
                    logger.exception(e)
                    results = (
                        GenericResults(
                            username, uri, method
                        ).something_broke(name, 'adding schedule', e)
                    )
    
    return(results)


def add_custom_recurrent(sched, customer_name, username,
                            agent_ids=None, all_agents=None,tag_ids=None,
                            all_tags=None,severity=None, pkg_type=None, operation=None,
                            name=None, uri=None, method=None, date=None,
                            every=None, custom=None, frequency=None,):
    
    job_data = (
        {
           'date': date,
           'frequency': frequency,
           'every': every,
           'job_name': name,
           'all_tags': all_tags,
           'all_agents': all_agents,
           'agent_ids': agent_ids,
           'tag_ids': tag_ids,
           'operation': operation,
           'severity': severity,
           'pkg_type': pkg_type,
           'customer_name': customer_name,
           'created_by': username
        }
    )

    if name:
        job_exist = job_exists(sched=sched, jobname=name,
                                customer_name=customer_name, 
                                username=username
                                )
        if job_exist:
            msg = 'Job Name Already Exists. Job Can not be Added'
            results = (
                 SchedulerResults(
                     username, uri, method
                 ).exists(name)
            )

        else:
            jobby_job = (
                operation_info(
                    operation=operation, pkg_type=pkg_type, 
                    agent_ids=agent_ids, all_agents=all_agents,
                    tag_ids=tag_ids, all_tags=all_tags, severity=severity, 
                    name=name
                )
            )
            
            if frequency == 'daily':
                day=("{0}/{1}".format(date.day,every))
                if jobby_job['operation'] == 'install':
                    try:
                        sched.add_cron_job(
                                scheduled_install_operation, day = day, 
                                hour=hour, minute=minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                        results = (
                                SchedulerResults(
                                    username, uri, method
                                    ).created(name, job_data)
                                )
                    except Exception as e:
                        logger.exception(e)
                        results = (
                                GenericResults(
                                    username, uri, method
                                    ).something_broke(name, 'adding schedule', e)
                                )
                elif jobby_job['operation'] == 'reboot':
                    try:
                        sched.add_cron_job(
                                scheduled_reboot_operation, day = day,
                                hour=date.hour, minute=date.minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                        
                        results = (
                                SchedulerResults(
                                    username, uri, method
                                    ).created(name, job_data)
                                )
                    except Exception as e:
                        logger.exception(e)
                        results = (
                                GenericResults(
                                    username, uri, method
                                    ).something_broke(name, 'adding schedule', e)
                                )
            elif frequency == 'weekly':
                week_num= (date.isocalendar()[1])
                week=("{0}/{1}".format(week_num,every))
                if jobby_job['operation'] == 'install':
                    try:
                        sched.add_cron_job(scheduled_install_operation, week = week, 
                                            day_of_week=custom, hour=date.hour, minute=date.minute, 
                                            args=[jobby_job, customer_name, username],
                                            name=name, jobstore=customer_name)
                        results = (
                            SchedulerResults(
                                username, uri, method
                            ).created(name, job_data)
                        )
                
                    except Exception as e:
                        logger.exception(e)
                        results = (
                                GenericResults(
                                    username, uri, method
                                    ).something_broke(name, 'adding schedule', e)
                                )
                elif jobby_job['operation'] == 'reboot':
                    try:
                        sched.add_cron_job(
                                scheduled_reboot_operation, week = week,
                                day_of_week=custom, hour=date.hour, minute=date.minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                        
                        results = (
                            SchedulerResults(
                                username, uri, method
                            ).created(name, job_data)
                        )
                
                    except Exception as e:
                        logger.exception(e)
                        results = (
                            GenericResults(
                                username, uri, method
                                ).something_broke(name, 'adding schedule', e)
                            )
            
            elif frequency == 'monthly':
                month=("{0}/{1}".format(date.month,every))
                if jobby_job['operation'] == 'install':
                    try:
                        sched.add_cron_job(scheduled_install_operation, month = month, 
                                            day = custom, hour=date.hour, minute=date.minute, 
                                            args=[jobby_job, customer_name, username],
                                            name=name, jobstore=customer_name)
                        results = (
                            SchedulerResults(
                                username, uri, method
                            ).created(name, job_data)
                        )
                
                    except Exception as e:
                        logger.exception(e)
                        results = (
                                GenericResults(
                                    username, uri, method
                                    ).something_broke(name, 'adding schedule', e)
                                )

                elif jobby_job['operation'] == 'reboot':
                    try:
                        sched.add_cron_job(
                                scheduled_reboot_operation, month = month,
                                day=custom,hour=date.hour, minute=date.minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                        
                        results = (
                            SchedulerResults(
                                username, uri, method
                            ).created(name, job_data)
                        )
                
                    except Exception as e:
                        logger.exception(e)
                        results = (
                                GenericResults(
                                    username, uri, method
                                    ).something_broke(name, 'adding schedule', e)
                                )
            elif frequency=='yearly':
                year=("{0}/{1}".format(date.year,every))
                if jobby_job['operation'] == 'install':
                    try:
                        sched.add_cron_job(scheduled_install_operation, year = year,
                                            month = custom, day = date.day, hour=date.hour, minute=date.minute, 
                                            args=[jobby_job, customer_name, username],
                                            name=name, jobstore=customer_name)
                        results = (
                            SchedulerResults(
                                username, uri, method
                            ).created(name, job_data)
                        )
                
                    except Exception as e:
                        logger.exception(e)
                        results = (
                                GenericResults(
                                    username, uri, method
                                    ).something_broke(name, 'adding schedule', e)
                                )

                elif jobby_job['operation'] == 'reboot':
                    try:
                        sched.add_cron_job(
                                scheduled_reboot_operation, year=year,
                                month = custom,day=custom,hour=date.hour,minute=date.minute, 
                                args=[jobby_job, customer_name, username],
                                name=name, jobstore=customer_name
                                )
                        
                        results = (
                            SchedulerResults(
                                username, uri, method
                            ).created(name, job_data)
                        )
                
                    except Exception as e:
                        logger.exception(e)
                        results = (
                                GenericResults(
                                    username, uri, method
                                    ).something_broke(name, 'adding schedule', e)
                                )


def job_scheduler(sched, label, job,
                  date_time, customer_name='default',
                  username='system_user'):
    """
        job_scheduler handles the adding of scheduled jobs
        arguments below...
        job == this contains the operation and related information that the
        schedule will perform. This also contains the start date and time.
        name == The name of the scheduled job
    """
    job_already_exists = job_exists(sched, label,
                                    customer_name=customer_name,
                                    username=username)
    if job_already_exists:
        return(
            {
                'message': 'Job with name %s already exists' % (label),
                'pass': False
            }
        )

    if date_time:
        utc_timestamp = date_time_parser(date_time)
    encoded_job = dumps(job)
    logger.debug('%s - %s is being scheduled for %s' % (
        username, job, str(utc_timestamp))
    )
    job_added = add_once(label, customer_name, username,
                         utc_timestamp, encoded_job, sched)
    return job_added

