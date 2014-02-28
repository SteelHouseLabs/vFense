import os
import logging
import logging.config
from hashlib import sha256

from db.client import db_create_close, r
from errorz.status_codes import PackageCodes
from plugins.patching.rv_db_calls import *
from plugins.patching import *
from plugins.cve import *
from plugins.patching.downloader.downloader import download_all_files_in_app
from utils.common import date_parser, hash_verifier, timestamp_verifier
from datetime import datetime
import re

import redis
from rq import Connection, Queue

rq_host = 'localhost'
rq_port = 6379
rq_db = 0

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

rq_pkg_pool = redis.StrictRedis(host=rq_host, port=rq_port, db=rq_db)


class IncomingApplicationsFromAgent():

    def __init__(self, username, agent_id, customer_name,
                 os_code, os_string):
        self.username = username
        self.agent_id = agent_id
        self.customer_name = customer_name
        self.os_code = os_code
        self.os_string = os_string

    def add_or_update_packages(self, app_list, delete_afterwards=True):
        rv_q = Queue('downloader', connection=rq_pkg_pool)
        index_with_no_name = list()
        good_app_list = list()
        #start_time = datetime.now()
        #print start_time, 'add all apps to app_table'
        for i in range(len(app_list)):
            if not app_list[i][AppsKey.Name]:
                index_with_no_name.append(i)
                continue

            if len(app_list[i][AppsKey.Name]) < 1:
                index_with_no_name.append(i)
                continue

            app_list[i] = self.set_app_per_node_parameters(app_list[i])
            app_list[i][AppsKey.AppId] = self.build_app_id(app_list[i])
            agent_app = self.set_specific_keys_for_app_agent(app_list[i])
            unique_app, file_data = (
                unique_application_updater(
                    self.customer_name, app_list[i]
                )
            )
            if agent_app[AppsPerAgentKey.Status] == 'available':
                rv_q.enqueue_call(
                    func=download_all_files_in_app,
                    args=(
                        app_list[i][AppsKey.AppId],
                        self.os_code, self.os_string,
                        file_data,
                    ),
                    timeout=86400
                )
            good_app_list.append(agent_app)

        updated = add_or_update_applications(
            pkg_list=good_app_list,
            delete_afterwards=delete_afterwards
        )
        #end_time = datetime.now()
        #print end_time, 'finished adding  all apps to app_table'
        #print 'total time took %s' % (str(end_time - start_time))

        msg = (
            '%s - agent_id: %s, repl: %s, del: %s, ins: %s, count: %s' %
            (
                self.username, self.agent_id, str(updated['replaced']),
                str(updated['deleted']), str(updated['inserted']),
                str(updated['pkg_count'])
            )
        )
        logger.info(msg)

    def set_specific_keys_for_app_agent(self, app):
        only_these_keys_are_needed = (
            {
                AppsPerAgentKey.AppId: app[AppsPerAgentKey.AppId],
                AppsPerAgentKey.AgentId: app[AppsPerAgentKey.AgentId],
                AppsPerAgentKey.InstallDate: app.pop(AppsPerAgentKey.InstallDate),
                AppsPerAgentKey.AgentId: self.agent_id,
                AppsPerAgentKey.CustomerName: self.customer_name,
                AppsPerAgentKey.Status: app[AppsPerAgentKey.Status],
                AppsPerAgentKey.Dependencies: app.pop(AppsPerAgentKey.Dependencies),
                AppsPerAgentKey.Update: PackageCodes.ThisIsAnUpdate,
                AppsPerAgentKey.Id: self.build_agent_app_id(
                    app[AppsPerAgentKey.AppId])
            }
        )

        return(only_these_keys_are_needed)

    def set_app_per_node_parameters(self, app):
        app[AppsPerAgentKey.AgentId] = self.agent_id
        app[AppsKey.OsCode] = self.os_code
        app[AppsKey.RvSeverity] = (
            self.sev_generator(
                app[AppsKey.VendorSeverity]
            )
        )

        app[AppsKey.ReleaseDate] = (
            r.epoch_time(app[AppsKey.ReleaseDate])
        )

        app[AppsPerAgentKey.InstallDate] = (
            r.epoch_time(app[AppsPerAgentKey.InstallDate])
        )

        return(app)

    def build_app_id(self, app):
        app_id = '%s%s' % \
            (app['name'], app['version'])
        app_id = app_id.encode('utf-8')

        return (sha256(app_id).hexdigest())

    def build_agent_app_id(self, appid):
        agent_app_id = self.agent_id.encode('utf8') + appid.encode('utf8')

        return (sha256(agent_app_id).hexdigest())

    def sev_generator(self, sev):

        tp_sev = ''
        if re.search(r'Critical|Important|Security', sev, re.IGNORECASE):
            tp_sev = 'Critical'

        elif re.search(r'Moderate|Low|Bugfix', sev, re.IGNORECASE):
            tp_sev = 'Recommended'

        else:
            tp_sev = 'Optional'

        return (tp_sev)


def incoming_packages_from_agent(username, agent_id, customer_name,
                                 os_code, os_string, apps,
                                 delete_afterwards=True):

        app = (
            IncomingApplicationsFromAgent(
                username, agent_id, customer_name, os_code, os_string
            )
        )
        app.add_or_update_packages(apps, delete_afterwards)
