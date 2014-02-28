from time import mktime
from datetime import datetime
import logging
import requests
from agent import *
from agent.agents import get_agents_info, get_agent_info
from errorz.status_codes import PackageCodes
from plugins.patching import *
from plugins.patching.rv_db_calls import insert_file_data,\
    build_agent_app_id, update_file_data,\
    get_apps_data, delete_all_in_table, insert_data_into_table
from plugins.patching.downloader.downloader import \
    download_all_files_in_app
from db.client import db_connect, r, db_create_close
from server.hierarchy import Collection, CustomerKey

import redis
from rq import Connection, Queue

rq_host = 'localhost'
rq_port = 6379
rq_db = 0
rq_pkg_pool = redis.StrictRedis(host=rq_host, port=rq_port, db=rq_db)

BASE_URL = 'http://updater2.toppatch.com'
GET_AGENT_UPDATES = '/api/new_updater/rvpkglist'
GET_SUPPORTED_UPDATES = '/api/new_updater/pkglist'

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class IncomingSupportedOrAgentApps(object):
    def __init__(self, table=SupportedAppsCollection):
        self.table = table
        if table == SupportedAppsCollection:
            self.CurrentAppsCollection = SupportedAppsCollection
            self.CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
            self.CurrentAppsKey = SupportedAppsKey
            self.CurrentAppsPerAgentKey = SupportedAppsPerAgentKey
            self.CurrentAppsPerAgentIndexes = SupportedAppsPerAgentIndexes

        elif table == AgentAppsCollection:
            self.CurrentAppsCollection = AgentAppsCollection
            self.CurrentAppsPerAgentCollection = AgentAppsPerAgentCollection
            self.CurrentAppsKey = AgentAppsKey
            self.CurrentAppsPerAgentKey = AgentAppsPerAgentKey
            self.CurrentAppsPerAgentIndexes = AgentAppsPerAgentIndexes

        last_modified_time = mktime(datetime.now().timetuple())
        self.last_modified_time = r.epoch_time(last_modified_time)

    def sync_supported_updates_to_all_agents(self, apps):
        try:
            conn = db_connect()
            deleted_count = 0
            (
                r
                .table(self.CurrentAppsPerAgentCollection)
                .delete()
                .run(conn)
            )
            conn.close()
            self.update_agents_with_supported(apps)

        except Exception as e:
            logger.exception(e)

    def update_agents_with_supported(self, apps, agents=None):
        try:
            conn = db_connect()
            if agents:
                for agent in agents:
                    (
                        r
                        .table(self.CurrentAppsPerAgentCollection)
                        .get_all(
                            agent[self.CurrentAppsPerAgentKey.AgentId],
                            index=self.CurrentAppsPerAgentIndexes.AgentId
                        )
                        .delete()
                        .run(conn)
                    )
            for app in apps:
                if not agents:
                    agents = get_agents_info(agent_os=app[AgentKey.OsCode])

                file_data = app.get(self.CurrentAppsKey.FileData)
                if agents:
                    for agent in agents:
                        if agent[AgentKey.OsCode] == app[AgentKey.OsCode]:
                            agent[self.CurrentAppsPerAgentKey.AppId] = app[self.CurrentAppsPerAgentKey.AppId]
                            update_file_data(
                                agent[self.CurrentAppsPerAgentKey.AppId],
                                agent[self.CurrentAppsPerAgentKey.AgentId],
                                file_data
                            )
                            app_per_agent_props = self._set_app_per_agent_properties(**agent)
                            agent_has_app = self.check_if_agent_has_app(agent)
                            if not agent_has_app:
                                self.insert_app(
                                    app_per_agent_props
                                )
                            elif agent_has_app:
                                app_per_agent_props[self.CurrentAppsPerAgentKey.Status] = INSTALLED
                                self.insert_app(app_per_agent_props)
            conn.close()

        except Exception as e:
            logger.exception(e)

    @db_create_close
    def insert_app(self, app, conn=None):
        try:
            (
                r
                .table(self.CurrentAppsPerAgentCollection)
                .insert(app)
                .run(conn)
            )
        except Exception as e:
            logger.exception(e)

    @db_create_close
    def insert_app_and_delete_old(self, app, lower_apps, conn=None):
        try:
            (
                r
                .table(self.CurrentAppsPerAgentCollection)
                .insert(app)
                .run(conn)
            )
            for lower_app in lower_apps:
                (
                    r
                    .table(AppsPerAgentCollection)
                    .get(lower_app[AppsPerAgentKey.Id])
                    .delete()
                    .run(conn)
                )
        except Exception as e:
            logger.exception(e)

    def _set_app_per_agent_properties(self, **kwargs):
        return(
            {
                self.CurrentAppsPerAgentKey.AgentId:
                kwargs[AgentKey.AgentId],

                self.CurrentAppsPerAgentKey.CustomerName:
                kwargs[AgentKey.CustomerName],

                self.CurrentAppsPerAgentKey.Status: AVAILABLE,

                self.CurrentAppsPerAgentKey.LastModifiedTime:
                self.last_modified_time,

                self.CurrentAppsPerAgentKey.Update:
                PackageCodes.ThisIsAnUpdate,

                self.CurrentAppsPerAgentKey.InstallDate: r.epoch_time(0.0),

                self.CurrentAppsPerAgentKey.AppId:
                kwargs[self.CurrentAppsPerAgentKey.AppId],

                self.CurrentAppsPerAgentKey.Id:
                build_agent_app_id(
                    kwargs[self.CurrentAppsPerAgentKey.AgentId],
                    kwargs[self.CurrentAppsPerAgentKey.AppId]
                )
            }
        )

    @db_create_close
    def app_name_exist(self, app_info,conn=None):
        try:
            app_name_exists= list(
                r
                .table(AppsCollection)
                .get_all(
                    app_info[AppsKey.Name],
                    index=AppsIndexes.Name
                )
                .run(conn)
                .pluck(
                    self.CurrentAppsKey.AppId,
                    self.CurrentAppsKey.Name,
                    self.CurrentAppsKey.Version,
                    self.CurrentAppsPerAgentKey.AgentId
                )
                .run(conn)
            )
        except Exception as e:
            logger.exception(e)
            app_name_exists = None

        return(app_name_exists)

    @db_create_close
    def lower_version_exists_of_app(self, app, app_info,
                                    status=AVAILABLE, conn=None):
        try:
            lower_version_exists = list(
                r
                .table(AppsCollection)
                .get_all(
                    app_info[AppsKey.Name],
                    index=AppsIndexes.Name
                )
                .filter(
                    lambda x: x[AppsKey.Version] < app_info[AppsKey.Version]
                )
                .eq_join(
                    lambda y:
                    [
                        app[AgentKey.AgentId],
                        app[AppsPerAgentKey.AppId],
                    ],
                    r.table(AppsPerAgentCollection),
                    index=AppsPerAgentIndexes.AgentId
                )
                .zip()
                .filter(
                    {
                        AppsPerAgentKey.Status: status
                    }
                )
                .pluck(
                    AppsKey.AppId,
                    AppsPerAgentKey.Id,
                    AppsKey.Name,
                    AppsPerAgentKey.AgentId
                )
                .run(conn)
            )

        except Exception as e:
            logger.exception(e)

        return(lower_version_exists)

    @db_create_close
    def check_if_agent_has_app(self, app, conn=None):
        try:
            agent_has_app = list(
                r
                .table(AppsPerAgentCollection)
                .get_all(
                    [
                        app[AppsPerAgentKey.AgentId],
                        app[AppsPerAgentKey.AppId],
                    ],
                    index=AppsPerAgentIndexes.AgentIdAndAppId
                )
                .run(conn)
            )

        except Exception as e:
            logger.exception(e)

        return(agent_has_app)


def update_supported_and_agent_apps(json_data, table=SupportedAppsCollection):

    if table == SupportedAppsCollection:
        CurrentAppsKey = SupportedAppsKey
        LatestDownloadedCollection = LatestDownloadedSupportedCollection
        AppType = 'supported_apps'

    elif table == AgentAppsCollection:
        CurrentAppsKey = AgentAppsKey
        LatestDownloadedCollection = LatestDownloadedAgentCollection
        AppType = 'agent_apps'
    try:
        rv_q = Queue('downloader', connection=rq_pkg_pool)
        conn = db_connect()
        inserted_count = 0
        all_customers = (
            list(
                r
                .table(Collection.Customers)
                .map(lambda x: x[CustomerKey.CustomerName])
                .run(conn)
            )
        )
        for i in range(len(json_data)):
            json_data[i][CurrentAppsKey.Customers] = all_customers
            json_data[i][CurrentAppsKey.ReleaseDate] = r.epoch_time(json_data[i][CurrentAppsKey.ReleaseDate])
            json_data[i][CurrentAppsKey.FilesDownloadStatus] = PackageCodes.FilePendingDownload
            json_data[i][CurrentAppsKey.Hidden] = 'no'
            insert_data_into_table(json_data[i], LatestDownloadedCollection)
            file_data = json_data[i].get(CurrentAppsKey.FileData)
            insert_file_data(json_data[i][CurrentAppsKey.AppId], file_data)
            data_to_update = (
                {
                    CurrentAppsKey.Customers: all_customers
                }
            )
            exists = (
                r
                .table(table)
                .get(json_data[i][CurrentAppsKey.AppId])
                .run(conn)
            )
            if exists:
                updated = (
                    r
                    .table(table)
                    .get(json_data[i][CurrentAppsKey.AppId])
                    .update(data_to_update)
                    .run(conn)
                )

            else:
                updated = (
                    r
                    .table(table)
                    .insert(json_data[i])
                    .run(conn)
                )
            
            rv_q.enqueue_call(
                func=download_all_files_in_app,
                args=(
                    json_data[i][CurrentAppsKey.AppId],
                    json_data[i][CurrentAppsKey.OsCode],
                    None,
                    file_data, 0, AppType
                ),
                timeout=86400
            )

            inserted_count += updated['inserted']
        conn.close()
        update_apps = IncomingSupportedOrAgentApps(table=table)
        update_apps.sync_supported_updates_to_all_agents(json_data)

    except Exception as e:
        logger.exception(e)


def get_agents_apps():
    delete_all_in_table(table=LatestDownloadedAgentCollection)
    get_updater_data = requests.get(BASE_URL + GET_AGENT_UPDATES)
    if get_updater_data.status_code == 200:
        json_data = get_updater_data.json()
        update_supported_and_agent_apps(json_data, AgentAppsCollection)
    else:
        logger.error(
            'Failed to connect and download packages from TopPatch Updater server'
        )


def get_supported_apps():
    delete_all_in_table()
    get_updater_data = requests.get(BASE_URL + GET_SUPPORTED_UPDATES)
    if get_updater_data.status_code == 200:
        json_data = get_updater_data.json()
        update_supported_and_agent_apps(json_data, SupportedAppsCollection)
    else:
        logger.error(
            'Failed to connect and download packages from TopPatch Updater server'
        )


def get_all_supported_apps_for_agent(agent_id):
    agent = get_agent_info(agent_id)
    apps = (
        get_apps_data(
            table=LatestDownloadedSupportedCollection,
            os_code=agent[AgentKey.OsCode]
        )
    )
    if apps:
        update_apps = (
            IncomingSupportedOrAgentApps(
                table=SupportedAppsCollection
            )
        )
        update_apps.update_agents_with_supported(apps, [agent])


def get_all_agent_apps_for_agent(agent_id):
    agent = get_agent_info(agent_id)
    apps = (
        get_apps_data(
            table=LatestDownloadedAgentCollection,
            os_code=agent[AgentKey.OsCode]
        )
    )

    if apps:
        update_apps = (
            IncomingSupportedOrAgentApps(
                table=AgentAppsCollection
            )
        )
        update_apps.update_agents_with_supported(apps, [agent])
