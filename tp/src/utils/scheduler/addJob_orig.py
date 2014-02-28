#!/usr/bin/env python

from datetime import datetime
import logging
from apscheduler.scheduler import Scheduler
from apscheduler.jobstores.sqlalchemy_store import SQLAlchemyJobStore

from utils.agentoperation import AgentOperation
from utils.common import *

class JobScheduler():
    def __init__(self, session, job, sched, name=None):
        self.name = name
        self.log = logging.basicConfig()
        self.converted_timestamp = None
        self.schedule = None
        self.session = session
        self.sched = sched
        self.job = job
        json_valid, self.job_object = verifyJsonIsValid(self.job[0])

        if not name:
            self.name = self.job_object['operation']
        if 'time' in self.job_object:
            self.converted_timestamp = returnDatetime(self.job_object['time'])
        if 'schedule' in self.job_object:
            self.schedule = self.job_object['schedule']
        if 'once' in self.job_object['schedule']:
            self.addOnce()

    def callAgentOperation(self):
        operation_runner = AgentOperation(self.session, self.job)
        operation_runner.run()

    def addOnce(self):
        self.sched.add_date_job(self.callAgentOperation,
                        self.converted_timestamp, name=self.name,
                        jobstore="toppatch"
                        )
        print self.sched.print_jobs()

