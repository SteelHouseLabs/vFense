import logging
import logging.config
from errorz.error_messages import SchedulerResults, GenericResults


logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class JobScheduler(object):
    def __init__(self, username, customer_name, uri, method, sched):
        self.username = username
        self.customer_name = customer_name
        self.uri = uri
        self.method = method
        self.sched

    def add_yearly_recurrent(
            self, name, operation, agent_ids=None, all_agents=None,
            tag_ids=None, all_tags=None, severity=None, pkg_type=None,
            month=None, day=None, hour=None, minute=None, day_of_week=None,
            ):
        return(
            self.add_recurrent(
                name=name, operation=operation, agent_ids=agent_ids,
                all_agents=all_agents, tag_ids=tag_ids, all_tags=all_tags,
                severity=severity, pkg_type=pkg_type,
                month=month, day=day, hour=hour, minute=minute,
                day_of_week=day_of_week
            )
        )

    def add_monthly_recurrent(
            self, name, operation, agent_ids=None, all_agents=None,
            tag_ids=None, all_tags=None, severity=None,
            pkg_type=None, month=None, day=None, hour=None, minute=None,
            day_of_week=None
            ):
        return(
            self.add_recurrent(
                name=name, operation=operation, agent_ids=agent_ids,
                all_agents=all_agents, tag_ids=tag_ids, all_tags=all_tags,
                severity=severity, pkg_type=pkg_type,
                month=month, day=day, hour=hour, minute=minute,
                day_of_week=day_of_week
            )
        )

    def add_weekly_recurrent(
            self, name, operation, agent_ids=None, all_agents=None,
            tag_ids=None, all_tags=None, severity=None,
            pkg_type=None, month=None, day=None, hour=None,
            minute=None, day_of_week=None
            ):
        return(
            self.add_recurrent(
                name=name, operation=operation, agent_ids=agent_ids,
                all_agents=all_agents, tag_ids=tag_ids, all_tags=all_tags,
                severity=severity, pkg_type=pkg_type,
                month=month, day=day, hour=hour, minute=minute,
                day_of_week=day_of_week
            )
        )

    def add_daily_recurrent(
            self, name, operation, agent_ids=None, all_agents=None,
            tag_ids=None, all_tags=None, severity=None,
            pkg_type=None, month=None, day=None, hour=None,
            minute=None, day_of_week=None
            ):
        return(
            self.add_recurrent(
                name=name, operation=operation, agent_ids=agent_ids,
                all_agents=all_agents, tag_ids=tag_ids, all_tags=all_tags,
                severity=severity, pkg_type=pkg_type,
                month=month, day=day, hour=hour, minute=minute,
                day_of_week=day_of_week
            )
        )

    def _add_recurrent(self, **kwargs):
        """
            name
            operation,
            agent_ids,
            all_agents = (true or false)
            tag_ids = (list of tag ids),
            all_tags = (true or false)
            severity = (Optional or Recommended or Critical)
            pkg_type = ( os or custome or supported )
            month = (0 - 12, or 1/2
            day = (1 - 31, or 1/2)
            hour = (0 - 24, 1/3)
            minute = (0 - 60, 1/5),
            day_of_week = (0 - 7, 1/2 )
        """

        try:
            if kwargs['name']:
                job_exist = job_exists(sched=sched, jobname=name)
                if job_exist:
                    results = (
                        SchedulerResults(
                            self.username, self.uri, self.method
                        ).exists(kwargs['name'])
                    )
        
                else:
                    if kwargs['operation'] == 'install':
                        self.sched.add_cron_job(
                            scheduled_install_operation, month=kwargs['month'],
                            day=kwargs['day'], hour=kwargs['hour'],
                            minute=kwargs['minute'],
                            day_of_week=kwargs['day_of_week'],
                            args=[kwargs, self.customer_name, self.username],
                            name=kwargs['name'], jobstore=self.customer_name
                        )
                        results = (
                            SchedulerResults(
                                self.username, self.uri, self.method
                            ).created(kwargs['name'], kwargs)
                        )

                    elif kwargs['operation'] == 'reboot':
                        self.sched.add_cron_job(
                            scheduled_reboot_operation, month=kwargs['month'],
                            hour=kwargs['hour'], minute=kwargs['minute'],
                            args=[kwargs, self.customer_name, self.username],
                            name=kwargs['name'], jobstore=self.customer_name
                        )
                        results = (
                            SchedulerResults(
                                self.username, self.uri, self.method
                            ).created(kwargs['name'], kwargs)
                        )

        except Exception as e:
            logger.exception(e)
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                )
                .something_broke(kwargs['name'], 'adding schedule', e)
            )

        return(results)
