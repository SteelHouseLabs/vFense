from time import sleep
import logging 

from scheduler.jobManager import start_scheduler, job_exists, remove_job
from plugins.patching.supported_apps.syncer import get_agents_apps, get_supported_apps
from plugins.cve.cve_parser import parse_cve_and_udpatedb
from plugins.cve.bulletin_parser import parse_bulletin_and_updatedb
from plugins.cve.get_all_ubuntu_usns import begin_usn_home_page_processing

from agent.agent_uptime_verifier import all_agent_status

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')
get_supported_apps()
get_agents_apps()

if __name__ == '__main__':
   
    sched = start_scheduler(redis_db=11) 
    jobstore_name = 'patching'
    username='admin'
    list_of_cron_jobs = [
        {
            'name': 'get_supported_apps',
            'job': get_supported_apps,
            'hour': '0,6,12,18',
            'minute': 0,
            'max_instances': 1,
            'coalesce': True
        },
        {
            'name': 'get_agents_apps',
            'jobstore': jobstore_name,
            'job': get_agents_apps,
            'hour': '0,6,12,18',
            'minute': 1,
            'max_instances': 1,
            'coalesce': True
        },
        {
            'name': 'parse_cve_and_udpatedb',
            'jobstore': jobstore_name,
            'job': parse_cve_and_udpatedb,
            'hour': 0,
            'minute': 5,
            'max_instances': 1,
            'coalesce': True
        },
        {
            'name': 'parse_bulletin_and_updatedb',
            'jobstore': jobstore_name,
            'job': parse_bulletin_and_updatedb,
            'hour': 1,
            'minute': 0,
            'max_instances': 1,
            'coalesce': True
        },
        {
            'name': 'begin_usn_home_page_processing',
            'jobstore': jobstore_name,
            'job': begin_usn_home_page_processing,
            'hour': 1,
            'minute': 30,
            'max_instances': 1,
            'coalesce': True
        },
        {
            'name': 'all_agent_status',
            'jobstore': jobstore_name,
            'job': all_agent_status,
            'hour': '*',
            'minute': 5,
            'max_instances': 1,
            'coalesce': True
        },
    ]
    for job in list_of_cron_jobs:
        job_exist = (
            job_exists(
                sched=sched, jobname=job['name'],
                username=username, customer_name=jobstore_name
            )
        )
        if not job_exist:
            sched.add_cron_job(
                job['job'], hour=job['hour'],
                minute=job['minute'], name=job['name'],
                jobstore=jobstore_name,
                max_instances=job['max_instances'],
                coalesce=job['coalesce']
            )
            logger.info('job %s added' % (job['name']))

        else:
            logger.info('job %s exists' % (job['name']))
            logger.info('removing job %s' % (job['name']))
            remove_job(
                sched, job['name'], 
                jobstore_name,
                username
            )
            sched.add_cron_job(
                job['job'], hour=job['hour'],
                minute=job['minute'], name=job['name'],
                jobstore=jobstore_name,
                max_instances=job['max_instances'],
                coalesce=job['coalesce']
            )
            logger.info('job %s added' % (job['name']))

    while True:
        sleep(60)
