import logging
import logging.config
from hashlib import sha256
from time import mktime
from datetime import datetime
import urllib
from db.client import db_create_close, r, db_connect
from plugins.patching import *
from plugins.mightymouse import *
from plugins.cve import *
from plugins.cve.cve_db  import get_windows_bulletinid_and_cveids, \
    get_vulnerability_categories
from plugins.mightymouse.mouse_db import get_mouse_addresses
from errorz.error_messages import GenericResults, PackageResults, \
        MightyMouseResults
from errorz.status_codes import PackageCodes, MightyMouseCodes
from agent import *
from operations import *
from tagging.tagManager import *

from server.hierarchy import CoreProperty
from server.hierarchy.manager import Hierarchy

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


def build_app_id(app):
    app_id = '%s%s' % (app[AppsKey.Name], app[AppsKey.Version])
    app_id = app_id.encode('utf-8')

    return (sha256(app_id).hexdigest())


def build_agent_app_id(agent_id, appid):
    agent_app_id = agent_id.encode('utf8') + appid.encode('utf8')

    return (sha256(agent_app_id).hexdigest())

@db_create_close
def get_all_file_data(conn=None):
    file_data = []
    try:
        file_data = list(
            r
            .table(FilesCollection)
            .pluck(FilesKey.FileHash, FilesKey.FileSize, FilesKey.FileUri)
            .run(conn)
        )

    except Exception as e:
        logger.exception(e)

    return(file_data)


def get_file_data(app_id, agent_id=None):
    conn = db_connect()
    try:
        if agent_id:
            file_data = list(
                r
                .table(FilesCollection)
                .filter(
                    lambda x: (
                        x[FilesKey.AppIds].contains(app_id)
                        &
                        x[FilesKey.AgentIds].contains(agent_id)
                    )
                )
                .without(FilesKey.AppIds, FilesKey.AgentIds,)
                .run(conn)
            )
        else:
            file_data = list(
                r
                .table(FilesCollection)
                .filter(
                    lambda x: (
                        x[FilesKey.AppIds].contains(app_id)
                    )
                )
                .without(FilesKey.AppIds, FilesKey.AgentIds,)
                .run(conn)
            )

    except Exception as e:
        file_data = []
        logger.exception(e)

    conn.close()
    return(file_data)

@db_create_close
def get_app_data(app_id, table=AppsCollection, app_key=AppsKey.AppId,
                 filterbykey=None, filterbyval=None,
                 fields_to_pluck=None, conn=None):
    apps = None
    if fields_to_pluck and not filterbykey and not filterbyval:
        apps = (
            r
            .table(table)
            .get(app_id)
            .pluck(fields_to_pluck)
            .run(conn)
        )

    elif fields_to_pluck and filterbykey and filterbyval:
        apps = list(
            r
            .table(table)
            .filter(
                {
                    filterbykey: filterbyval,
                    app_key: app_id
                }
            )
            .pluck(fields_to_pluck)
            .run(conn)
        )

    elif not fields_to_pluck and filterbykey and filterbyval:
        apps = list(
            r
            .table(table)
            .filter(
                {
                    filterbykey: filterbyval,
                    app_key: app_id
                }
            )
            .run(conn)
        )

    else:
        apps = (
            r
            .table(table)
            .get(app_id)
            .run(conn)
        )

    return(apps)


@db_create_close
def get_apps_data(customer_name=None, table=CustomAppsCollection,
                  fields_to_pluck=None, os_code=None, conn=None):
    apps = None
    base = r.table(table)
    if fields_to_pluck and os_code:
        apps = list(
            base
            .get_all(customer_name, index=CustomAppsIndexes.Customers)
            .filter(
                {
                    'os_code': os_code
                }
            )
            .pluck(fields_to_pluck)
            .run(conn)
        )

    elif fields_to_pluck and not os_code and customer_name:
        apps = list(
            base
            .get_all(customer_name, index=CustomAppsIndexes.Customers)
            .pluck(fields_to_pluck)
            .run(conn)
        )

    elif not fields_to_pluck and os_code and customer_name:
        apps = list(
            base
            .get_all(customer_name, index=CustomAppsIndexes.Customers)
            .filter(
                {
                    'os_code': os_code
                }
            )
            .run(conn)
        )

    elif customer_name and not fields_to_pluck and not os_code:
        apps = list(
            base
            .get_all(customer_name, index=CustomAppsIndexes.Customers)
            .run(conn)
        )

    elif not customer_name and not fields_to_pluck and os_code:
        apps = list(
            base
            .filter(
                {
                    'os_code': os_code
                }
            )
            .run(conn)
        )

    elif not customer_name and not fields_to_pluck and not os_code:
        apps = list(
            base
            .run(conn)
        )

    elif not customer_name and fields_to_pluck and os_code:
        apps = list(
            base
            .filter(
                {
                    'os_code': os_code
                }
            )
            .pluck(fields_to_pluck)
            .run(conn)
        )

    elif not customer_name and fields_to_pluck and not os_code:
        apps = list(
            base
            .pluck(fields_to_pluck)
            .run(conn)
        )

    return(apps)


@db_create_close
def get_app_data_by_appids(
        appids, table=AppsCollection,
        fields_to_pluck=None, conn=None):

    if fields_to_pluck and appids:
        apps = list(
            r
            .expr(appids)
            .map(
                lambda app_id:
                r
                .table(table)
                .get(app_id)
                .pluck(fields_to_pluck)
            )
            .run(conn)
        )

    elif not fields_to_pluck and appids:
        apps = list(
            r
            .expr(appids)
            .map(
                lambda app_id:
                r
                .table(table)
                .get(app_id)
            )
            .run(conn)
        )

    return(apps)


@db_create_close
def get_appids_by_agentid_and_status(
        agent_id, status,
        sev=None,
        table=AppsPerAgentCollection,
        conn=None):

    if table == AppsPerAgentCollection:
        CurrentAppsCollection = AppsCollection
        CurrentAppsPerAgentKey = AppsPerAgentKey
        CurrentAppsPerAgentIndexes = AppsPerAgentIndexes
        CurrentAppsIndexes = AppsIndexes

    elif table == CustomAppsPerAgentCollection:
        CurrentAppsCollection = CustomAppsCollection
        CurrentAppsPerAgentKey = CustomAppsPerAgentKey
        CurrentAppsPerAgentIndexes = CustomAppsPerAgentIndexes
        CurrentAppsIndexes = CustomAppsIndexes

    elif table == SupportedAppsPerAgentCollection:
        CurrentAppsCollection = SupportedAppsCollection
        CurrentAppsPerAgentKey = SupportedAppsPerAgentKey
        CurrentAppsPerAgentIndexes = SupportedAppsPerAgentIndexes
        CurrentAppsIndexes = SupportedAppsIndexes

    elif table == AgentAppsPerAgentCollection:
        CurrentAppsCollection = AgentAppsCollection
        CurrentAppsPerAgentKey = AgentAppsPerAgentKey
        CurrentAppsPerAgentIndexes = AgentAppsPerAgentIndexes
        CurrentAppsIndexes = AgentAppsIndexes

    if sev:
        appids = list(
            r
            .table(table)
            .get_all(
                [
                    status, agent_id
                ],
                index=CurrentAppsPerAgentIndexes.StatusAndAgentId
            )
            .eq_join(
                lambda x:
                [
                    x[CurrentAppsPerAgentKey.AppId],
                    sev
                ],
                r.table(CurrentAppsCollection),
                index=CurrentAppsIndexes.AppIdAndRvSeverity
            )
            .map(
                lambda y: y['right'][CurrentAppsPerAgentKey.AppId]
            )
            .run(conn)
        )

    else:
        appids = list(
            r
            .table(table)
            .get_all(
                [
                    status, agent_id
                ],
                index=CurrentAppsPerAgentIndexes.StatusAndAgentId
            )
            .map(
                lambda y: y[CurrentAppsPerAgentKey.AppId]
            )
            .run(conn)
        )

    return(appids)


@db_create_close
def apps_to_insert_per_agent(username, uri, method,
                             data, table=CustomAppsPerAgentCollection,
                             conn=None):
    completed = True
    try:
        (
            r
            .table(table)
            .insert(data, upsert=True)
            .run(conn)
        )

        results = (
            GenericResults(
                username, uri, method
            ).object_created(data['app_id'], table, data)
        )

        logger.info(results)

    except Exception as e:
        completed = False
        results = (
            GenericResults(
                username, uri, method
            ).something_broke(data['app_id'], table, data)
        )

        logger.exception(e)

    return(completed)


def apps_to_insert_per_tag(username, uri, method, data):
    return(
        apps_to_insert_per_agent(
            username, uri, method, data, CustomAppsPerTagCollection
        )
    )


@db_create_close
def insert_data_into_table(data, table, conn=None):

    completed = True
    try:
        (
            r
            .table(table)
            .insert(data, upsert=True)
            .run(conn)
        )

    except Exception as e:
        completed = False
        logger.exception(e)

    return(completed)


@db_create_close
def delete_all_in_table(table=LatestDownloadedSupportedCollection, conn=None):
    deleted = True
    try:
        (
            r
            .table(table)
            .delete()
            .run(conn)
        )
    except Exception as e:
        deleted = False
        logger.exception(
            'Failed to delete all for collection %s: %s' %
            (table, e)
        )

    return(deleted)


@db_create_close
def delete_app_data(agentid, table=AppsPerAgentCollection, conn=None):
    deleted = True
    try:
        (
            r
            .table(table)
            .get_all(agentid, index='agent_id')
            .delete()
            .run(conn)
        )
    except Exception as e:
        deleted = False
        logger.exception(
            'Failed to delete app_data for agent_id %s: %s' %
            (agentid, e)
        )

    return(deleted)


def delete_all_app_data_for_agent(agent_id):
    try:
        delete_app_data(agent_id)
        delete_app_data(agent_id, table=CustomAppsPerAgentCollection)
        delete_app_data(agent_id, table=SupportedAppsPerAgentCollection)
        delete_app_data(agent_id, table=AgentAppsPerAgentCollection)
    except Exception as e:
        logger.exception(e)


@db_create_close
def update_app_per_agent_data(
        agentid,
        data,
        table=AppsPerAgentCollection,
        conn=None):

    updated = True
    try:
        (
            r
            .table(table)
            .get_all(agentid, index='agent_id')
            .update(data)
            .run(conn)
        )
    except Exception as e:
        updated = False
        logger.exception(
            'Failed to updated app_data for agent_id %s with data %s: %s' %
            (agentid, data, e)
        )

    return(updated)


def update_all_app_data_for_agent(agent_id, data):
    try:
        update_app_per_agent_data(agent_id, data)
        update_app_per_agent_data(
            agent_id, data,
            table=CustomAppsPerAgentCollection
        )
        update_app_per_agent_data(
            agent_id, data,
            table=SupportedAppsPerAgentCollection
        )
        update_app_per_agent_data(
            agent_id, data,
            table=AgentAppsPerAgentCollection
        )
    except Exception as e:
        logger.exception(e)


def get_base_url(customer_name):

    return Hierarchy.get_customer_property(
        customer_name,
        CoreProperty.PackageUrl
    )


#@db_create_close
def get_download_urls(customer_name, app_id, file_data,
                      oper_type=INSTALL_OS_APPS):
    uris = []
    url_base = get_base_url(customer_name)
    file_uris_base = None
    logger.info(url_base)
    if oper_type == INSTALL_CUSTOM_APPS:
        url_base = url_base + 'tmp/' + app_id + '/'
        file_uris_base = 'packages/tmp/' + app_id + '/'

    else:
        url_base = url_base + app_id + '/'
        file_uris_base = 'packages/' + app_id + '/'

    for pkg in file_data:
        file_servers = get_mouse_addresses(customer_name)
        file_uris = []
        if file_servers:
            for mm in file_servers:
                file_uris.append(
                    'http://%s/%s%s' %
                    (mm[RelayServers.Address], file_uris_base, pkg[PKG_NAME])
                )
        file_uris.append(url_base + pkg[PKG_NAME])
        uris.append(
            {
                PKG_NAME: pkg[PKG_NAME],
                PKG_URI: url_base + pkg[PKG_NAME],
                FILE_URIS: file_uris,
                PKG_SIZE: pkg[PKG_SIZE],
                PKG_HASH: pkg[PKG_HASH]
            }
        )

    return(uris)


@db_create_close
def get_apps_by_agentid_and_appid(agent_id, app_id, conn):
    apps = (
        r
        .table(AppsPerAgentCollection)
        .get_all(
            [agent_id, app_id], index='by_agentid_and_appid')
        .run(conn)
    )
    return(apps)


@db_create_close
def get_severities(conn=None):
    rv_severities = ['Critical', 'Recommended', 'Optional']
    all_severities = []
    try:
        vendor_severities = (
            r
            .table(AppsCollection, use_outdated=True)
            .map(lambda x: x['vendor_severity'])
            .distinct()
            .run(conn)
        )

        all_severities = list(
            set(rv_severities)
            .union(vendor_severities)
        )

    except Exception as e:
        logger.error(e)

    return(all_severities)


#def hide_apps(appids, username, customer_name,
#              uri=None, method=None, conn=None):


def get_remote_file_size(uri=None):
    remote_size = None

    if uri:
        try:
            remote_size = (
                urllib
                .urlopen(uri)
                .info()
                .getheaders("Content-Length")[0]
            )

        except Exception as e:
            logger.error('OHHHHS NOOO: %s' % (e))

    return(str(remote_size))


def unique_uris(uris=None, orig_uris=None):
    new_uris = list()

    if uris and orig_uris:
        combined_data = uris + orig_uris

        for i in xrange(len(combined_data)):

            if len(new_uris) > 0:

                if (not combined_data[i][PKG_URI].split('/')[-1]
                        in map(
                            lambda x: x[PKG_URI]
                            .split('/')[-1],
                            new_uris)):

                    new_uris.append(combined_data[i])
            else:
                new_uris.append(combined_data[i])

    if uris:
        if not new_uris:
            new_uris = uris
        for i in range(len(new_uris)):
            if not PKG_SIZE in new_uris[i]:
                size = (
                    get_remote_file_size(
                        uri=new_uris[i][PKG_URI]
                    )
                )

                if size:
                    if size > '0':
                        new_uris[i][PKG_SIZE] = size

    return(new_uris)


def insert_file_data(app_id, file_data):
    conn = db_connect()
    try:
        if len(file_data) > 0:
            for uri in file_data:
                exists = (
                    r
                    .table(FilesCollection)
                    .get(uri[FilesKey.FileName])
                    .run(conn)
                )
                if exists:
                    (
                        r
                        .table(FilesCollection)
                        .get(uri[FilesKey.FileName])
                        .update(
                            {
                                FilesKey.AppIds: (
                                    r.row[FilesKey.AppIds]
                                    .set_insert(app_id)
                                ),
                            }
                        )
                        .run(conn)
                    )

                else:
                    (
                        r
                        .table(FilesCollection)
                        .insert(
                            {
                                FilesKey.AppIds: [app_id],
                                FilesKey.AgentIds: [],
                                FilesKey.FileName: uri[FilesKey.FileName],
                                FilesKey.FileSize: uri[FilesKey.FileSize],
                                FilesKey.FileUri: uri[FilesKey.FileUri],
                                FilesKey.FileHash: uri[FilesKey.FileHash],
                            },
                        )
                        .run(conn, no_reply=True)
                    )

    except Exception as e:
        logger.exception(e)

    conn.close()


def update_file_data(app_id, agent_id, file_data):
    conn = db_connect()
    try:
        if len(file_data) > 0:
            for uri in file_data:
                exists = (
                    r
                    .table(FilesCollection)
                    .get(uri[FilesKey.FileName])
                    .run(conn)
                )
                if exists:
                    (
                        r
                        .table(FilesCollection)
                        .get(uri[FilesKey.FileName])
                        .update(
                            {
                                FilesKey.AppIds: (
                                    r.row[FilesKey.AppIds]
                                    .set_insert(app_id)
                                ),
                                FilesKey.AgentIds: (
                                    r.row[FilesKey.AgentIds]
                                    .set_insert(agent_id)
                                )
                            }
                        )
                        .run(conn)
                    )

                else:
                    (
                        r
                        .table(FilesCollection)
                        .insert(
                            {
                                FilesKey.AppIds: [app_id],
                                FilesKey.AgentIds: [agent_id],
                                FilesKey.FileName: uri[FilesKey.FileName],
                                FilesKey.FileSize: uri[FilesKey.FileSize],
                                FilesKey.FileUri: uri[FilesKey.FileUri],
                                FilesKey.FileHash: uri[FilesKey.FileHash],
                            },
                        )
                        .run(conn, no_reply=True)
                    )

    except Exception as e:
        logger.exception(e)

    conn.close()


def update_customers_in_app(customer_name, app_id, table=AppsCollection):
    conn = db_connect()
    if table == AppsCollection:
        CurrentAppsKey = AppsKey

    elif table == CustomAppsCollection:
        CurrentAppsKey = CustomAppsKey

    elif table == SupportedAppsCollection:
        CurrentAppsKey = SupportedAppsKey

    elif table == AgentAppsCollection:
        CurrentAppsKey = AgentAppsKey

    try:
        exists = (
            r
            .table(table)
            .get(app_id)
            .run(conn)
        )
        if exists:
            (
                r
                .table(table)
                .get(app_id)
                .update(
                    {
                        CurrentAppsKey.Customers: (
                            r.row[CurrentAppsKey.Customers]
                            .set_insert(customer_name)
                        ),
                    }
                )
                .run(conn)
            )

    except Exception as e:
        logger.exception(e)

    conn.close()

@db_create_close
def update_os_app(app_id, data, table=AppsCollection, conn=None):
    app_updated = None
    try:
        exists = (
            r
            .table(table)
            .get(app_id)
            .run(conn)
        )
        if exists:
            app_updated = (
                r
                .table(table)
                .get(app_id)
                .update(data)
                .run(conn)
            )

    except Exception as e:
        logger.exception(e)

    return(app_updated)


def update_custom_app(app_id, data, table=CustomAppsCollection):
    return(update_os_app(app_id, data, table))


def update_supported_app(app_id, data, table=SupportedAppsCollection):
    return(update_os_app(app_id, data, table))


def update_agent_app(app_id, data, table=AgentAppsCollection):
    return(update_os_app(app_id, data, table))



def update_vulnerability_info_app(app_id, app, exists, table=AppsCollection):
    if not app.has_key(AppsKey.CveIds):
        if app.has_key(AppsKey.AppId):
            app.pop(AppsKey.AppId)
        app[AppsKey.CveIds] = []
        app[AppsKey.VulnerabilityId] = ""
        app[AppsKey.VulnerabilityCategories] = []

        if app[AppsKey.Kb] != "":
            vuln_info = get_windows_bulletinid_and_cveids(app[AppsKey.Kb])

            if vuln_info:
                app[AppsKey.CveIds] = vuln_info[WindowsSecurityBulletinKey.CveIds]
                for cve_id in app[AppsKey.CveIds]:
                    cve_id = cve_id.replace('CVE-', '')
                    app[AppsKey.VulnerabilityCategories] += get_vulnerability_categories(cve_id)

                app[AppsKey.VulnerabilityCategories] = list(set(app[AppsKey.VulnerabilityCategories]))

                app[AppsKey.VulnerabilityId] = vuln_info[WindowsSecurityBulletinKey.BulletinId]

        if exists:
            update_os_app(app_id, app, table)

        app[AppsKey.AppId] = app_id

    return(app)


@db_create_close
def unique_application_updater(customer_name, app, conn=None):

    table = AppsCollection

    exists = []
    try:
        exists = (
            r
            .table(table)
            .get(app[AppsKey.AppId])
            .run(conn)
        )

    except Exception as e:
        logger.exception(e)

    status = app.pop(AppsPerAgentKey.Status, None)
    agent_id = app.pop(AppsPerAgentKey.AgentId, None)
    app.pop(AppsPerAgentKey.InstallDate, None)
    file_data = app.pop(AppsKey.FileData)
    if exists:
        update_file_data(app[AppsKey.AppId], agent_id, file_data)
        update_customers_in_app(customer_name, app[AppsKey.AppId])
        update_vulnerability_info_app(exists[AppsKey.AppId], exists, True)

    else:
        update_file_data(app[AppsKey.AppId], agent_id, file_data)
        app[AppsKey.Customers] = [customer_name]
        app[AppsKey.Hidden] = 'no'
        if (len(file_data) > 0 and status == AVAILABLE or
                len(file_data) > 0 and status == INSTALLED):
            app[AppsKey.FilesDownloadStatus] = PackageCodes.FilePendingDownload

        elif len(file_data) == 0 and status == AVAILABLE:
            app[AppsKey.FilesDownloadStatus] = PackageCodes.MissingUri

        elif len(file_data) == 0 and status == INSTALLED:
            app[AppsKey.FilesDownloadStatus] = PackageCodes.FileNotRequired

        app = update_vulnerability_info_app(app[AppsKey.AppId], app, False)

        try:
            (
                r
                .table(AppsCollection)
                .insert(app)
                .run(conn, no_reply=True)
            )

        except Exception as e:
            msg = (
                'Failed to insert %s into unique_applications, error: %s' %
                (app[AppsKey.AppId], e)
            )
            logger.exception(msg)

    return(app, file_data)


@db_create_close
def add_or_update_applications(table=AppsPerAgentCollection, pkg_list=[],
                               delete_afterwards=True, conn=None):
    completed = False
    inserted_count = 0
    updated = None
    replaced_count = 0
    deleted_count = 0
    pkg_count = len(pkg_list)
    last_modified_time = mktime(datetime.now().timetuple())
    if table == AppsPerAgentCollection:
        CurrentAppsPerAgentKey = AppsPerAgentKey
        CurrentAppsPerAgentIndexes = AppsPerAgentIndexes

    elif table == CustomAppsPerAgentCollection:
        CurrentAppsPerAgentKey = CustomAppsPerAgentKey
        CurrentAppsPerAgentIndexes = CustomAppsPerAgentIndexes

    elif table == SupportedAppsPerAgentCollection:
        CurrentAppsPerAgentKey = SupportedAppsPerAgentKey
        CurrentAppsPerAgentIndexes = SupportedAppsPerAgentIndexes

    elif table == AgentAppsPerAgentCollection:
        CurrentAppsPerAgentKey = AgentAppsPerAgentKey
        CurrentAppsPerAgentIndexes = AgentAppsPerAgentIndexes

    if pkg_count > 0:
        for pkg in pkg_list:
            pkg['last_modified_time'] = r.epoch_time(last_modified_time)

            try:
                app_exists = (
                    r
                    .table(table)
                    .get(pkg[CurrentAppsPerAgentKey.Id])
                    .run(conn)
                )
                if app_exists:
                    updated = (
                        r
                        .table(table)
                        .get(pkg[CurrentAppsPerAgentKey.Id])
                        .update(pkg)
                        .run(conn)
                    )
                else:
                    updated = (
                        r
                        .table(table)
                        .insert(pkg)
                        .run(conn)
                    )
                inserted_count += updated['inserted']
                replaced_count += updated['replaced']

            except Exception as e:
                logger.exception(e)

        try:
            if delete_afterwards:
                deleted = (
                    r
                    .table(table)
                    .get_all(
                        pkg[CurrentAppsPerAgentKey.AgentId],
                        index=CurrentAppsPerAgentIndexes.AgentId
                    )
                    .filter(
                        r.row['last_modified_time'] < r.epoch_time(
                            last_modified_time)
                    )
                    .delete()
                    .run(conn)
                )
                deleted_count += deleted['deleted']
        except Exception as e:
            logger.exception(e)

    return(
        {
            'pass': completed,
            'inserted': inserted_count,
            'replaced': replaced_count,
            'deleted': deleted_count,
            'pkg_count': pkg_count,
        }
    )


@db_create_close
def update_app_per_objectid_and_appid(object_id, app_id, data,
                                      table=AppsPerAgentCollection,
                                      index_to_use=(
                                          AppsPerAgentIndexes.AgentIdAndAppId
                                      ),
                                      conn=None):
    app_updated = None
    try:
        app_updated = (
            r
            .table(table)
            .get_all([object_id, app_id], index=index_to_use)
            .update(data)
            .run(conn)
        )
    except Exception as e:
        logger.exception(e)

    return(app_updated)


@db_create_close
def update_os_app_per_agent(agent_id, app_id, data,
                            table=AppsPerAgentCollection,
                            index_to_use=AppsPerAgentIndexes.AgentIdAndAppId,
                            conn=None):

    return(
        update_app_per_objectid_and_appid(
            agent_id, app_id, data, table, index_to_use
        )
    )


def update_custom_app_per_agent(agent_id, app_id, data,
                                table=CustomAppsPerAgentCollection,
                                index_to_use=(
                                    CustomAppsPerAgentIndexes.AgentIdAndAppId
                                )):
    return(
        update_app_per_objectid_and_appid(
            agent_id, app_id, data, table, index_to_use
        )
    )


def update_supported_app_per_agent(
        agent_id, app_id, data,
        table=SupportedAppsPerAgentCollection,
        index_to_use=SupportedAppsPerAgentIndexes.AgentIdAndAppId
        ):
    return(
        update_app_per_objectid_and_appid(
            agent_id, app_id, data, table, index_to_use
        )
    )


def update_agent_app_per_agent(
        agent_id, app_id, data,
        table=AgentAppsPerAgentCollection,
        index_to_use=AgentAppsPerAgentIndexes.AgentIdAndAppId
        ):
    return(
        update_app_per_objectid_and_appid(
            agent_id, app_id, data, table, index_to_use
        )
    )



@db_create_close
def delete_app_from_agent(
        app_name, app_version, agent_id,
        table=AppsCollection,
        per_agent_table=AppsPerAgentCollection,
        index_to_use=AppsIndexes.NameAndVersion,
        per_agent_index=AppsPerAgentIndexes.AgentIdAndAppId,
        conn=None
        ):
    try:
        app_agent_id = (
            r
            .table(table)
            .get_all([app_name, app_version], index=index_to_use)
            .eq_join(
                lambda x: [agent_id, x[AppsKey.AppId]],
                r.table(per_agent_table),
                index=per_agent_index
            )
            .zip()
            .map(lambda x: x[Id])
            .run(conn)
        )
        if app_agent_id:
            (
                r
                .table(per_agent_table)
                .get(app_agent_id[0])
                .delete()
                .run(conn)
            )

    except Exception as e:
        logger.exception(e)


def delete_custom_app_from_agent(
        app_name, app_version, agent_id,
        table=CustomAppsCollection,
        per_agent_table=CustomAppsPerAgentCollection,
        index_to_use=CustomAppsIndexes.NameAndVersion,
        per_agent_index=CustomAppsPerAgentIndexes.AgentIdAndAppId,
        ):
    return(
        delete_app_from_agent(
            app_name, app_version, table,
            per_agent_table, index_to_use,
            per_agent_index
        )
    )


def delete_supported_app_from_agent(
        app_name, app_version, agent_id,
        table=SupportedAppsCollection,
        per_agent_table=SupportedAppsPerAgentCollection,
        index_to_use=SupportedAppsIndexes.NameAndVersion,
        per_agent_index=SupportedAppsPerAgentIndexes.AgentIdAndAppId,
        ):
    return(
        delete_app_from_agent(
            app_name, app_version, table,
            per_agent_table, index_to_use,
            per_agent_index
        )
    )


@db_create_close
def get_packages_that_need_to_be_downloaded(conn=None):
    try:
        pkgs = (
            r
            .table(AppsCollection)
            .filter(
                (r.row[AppsKey.FileDownloadStatus] ==
                    PackageCodes.FilePendingDownload)
                |
                (r.row[AppsKey.FileDownloadStatus] ==
                    PackageCodes.FileFailedDownload)
                |
                (r.row[AppsKey.FileDownloadStatus] ==
                    PackageCodes.HashNotVerified)
            )
            .pluck(AppsKey.AppId. AppsKey.FileData, AppsKey.OsCode)
            .run(conn)
        )
    except Exception as e:
        pkgs = []
        logger.exception(e)

    return(pkgs)


@db_create_close
def update_hidden_status(username, customer_name,
                         uri, method, app_ids, hidden='yes',
                         table=AppsCollection, conn=None):
    if table == AppsCollection:
        CurrentAppsKey = AppsKey

    elif table == CustomAppsCollection:
        CurrentAppsKey = CustomAppsKey

    elif table == SupportedAppsCollection:
        CurrentAppsKey = SupportedAppsKey

    elif table == AgentAppsPerAgentCollection:
        CurrentAppsKey = AgentAppsKey

    try:
        if hidden == YES or hidden == NO:
            (
                r
                .expr(app_ids)
                .for_each(
                    lambda app_id:
                    r
                    .table(table)
                    .get(app_id)
                    .update(
                        {
                            CurrentAppsKey.Hidden: hidden
                        }
                    )
                )
                .run(conn)
            )
        elif hidden == 'toggle':
            for app_id in app_ids:
                toggled = (
                    r
                    .table(table)
                    .get(app_id)
                    .update(
                        {
                            CurrentAppsKey.Hidden: (
                                r.branch(
                                    r.row[CurrentAppsKey.Hidden] == YES,
                                    NO,
                                    YES
                                )
                            )
                        }
                    )
                    .run(conn)
                )

        results = (
            PackageResults(
                username, uri, method
            ).toggle_hidden(app_ids, hidden)
        )

    except Exception as e:
        logger.exception(e)
        results = (
            GenericResults(
                username, uri, method
            ).something_broke(app_ids, 'toggle hidden on os_apps', e)
        )

    return(results)


@db_create_close
def get_all_app_stats_by_agentid(username, customer_name,
                                 uri, method, agent_id, conn=None):
    data = []
    try:
        inventory = (
            r
            .table(AppsPerAgentCollection)
            .get_all(
                [INSTALLED, agent_id],
                index=AppsPerAgentIndexes.StatusAndAgentId
            )
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: inventory,
                STATUS: INSTALLED,
                NAME: SOFTWAREINVENTORY
            }
        )
        os_apps_avail = (
            r
            .table(AppsPerAgentCollection)
            .get_all(
                [AVAILABLE, agent_id],
                index=AppsPerAgentIndexes.StatusAndAgentId
            )
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: os_apps_avail,
                STATUS: AVAILABLE,
                NAME: OS
            }
        )
        custom_apps_avail = (
            r
            .table(CustomAppsPerAgentCollection)
            .get_all(
                [AVAILABLE, agent_id],
                index=CustomAppsPerAgentIndexes.StatusAndAgentId
            )
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: custom_apps_avail,
                STATUS: AVAILABLE,
                NAME: CUSTOM
            }
        )
        supported_apps_avail = (
            r
            .table(SupportedAppsPerAgentCollection)
            .get_all(
                [AVAILABLE, agent_id],
                index=SupportedAppsPerAgentIndexes.StatusAndAgentId
            )
            .count()
            .run(conn)
        )

        data.append(
            {
                COUNT: supported_apps_avail,
                STATUS: AVAILABLE,
                NAME: SUPPORTED
            }
        )

        agent_apps_avail = (
            r
            .table(AgentAppsPerAgentCollection)
            .get_all(
                [AVAILABLE, agent_id],
                index=AgentAppsPerAgentIndexes.StatusAndAgentId
            )
            .count()
            .run(conn)
        )

        data.append(
            {
                COUNT: agent_apps_avail,
                STATUS: AVAILABLE,
                NAME: AGENT_UPDATES
            }
        )

        #all_pending_apps = (
        #   r
        #   .table(AppsPerAgentCollection)
        #   .union(r.table(CustomAppsPerAgentCollection))
        #   .union(r.table(SupportedAppsPerAgentCollection))
        #   .union(r.table(AgentAppsPerAgentCollection))
        #   .filter(
        #       {
        #           AgentKey.AgentId: agent_id,
        #           AppsPerAgentKey.Status: PENDING
        #       }
        #   )
        #   .count()
        #   .run(conn)
        #

        #data.append(
        #   {
        #       COUNT: all_pending_apps,
        #       STATUS: PENDING,
        #       NAME: PENDING.capitalize()
        #   }
        #

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

        logger.info(results)

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('getting_pkg_stats', 'updates', e)
        )
        logger.exception(results)

    return(results)

@db_create_close
def get_all_app_stats_by_tagid(username, customer_name,
                               uri, method, tag_id, conn=None):
    data = []
    try:
        inventory = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    INSTALLED,
                    x[AppsPerAgentKey.AgentId]
                ],
                r.table(AppsPerAgentCollection),
                index=AppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: inventory,
                STATUS: INSTALLED,
                NAME: SOFTWAREINVENTORY
            }
        )
        os_apps_avail = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    AVAILABLE,
                    x[AppsPerAgentKey.AgentId]
                ],
                r.table(AppsPerAgentCollection),
                index=AppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: os_apps_avail,
                STATUS: AVAILABLE,
                NAME: OS
            }
        )
        custom_apps_avail = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    AVAILABLE,
                    x[CustomAppsPerAgentKey.AgentId]
                ],
                r.table(CustomAppsPerAgentCollection),
                index=CustomAppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: custom_apps_avail,
                STATUS: AVAILABLE,
                NAME: CUSTOM
            }
        )
        supported_apps_avail = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    AVAILABLE,
                    x[SupportedAppsPerAgentKey.AgentId]
                ],
                r.table(SupportedAppsPerAgentCollection),
                index=SupportedAppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: supported_apps_avail,
                STATUS: AVAILABLE,
                NAME: SUPPORTED
            }
        )
        agent_apps_avail = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    AVAILABLE,
                    x[AgentAppsPerAgentKey.AgentId]
                ],
                r.table(AgentAppsPerAgentCollection),
                index=AgentAppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: agent_apps_avail,
                STATUS: AVAILABLE,
                NAME: AGENT_UPDATES
            }
        )

       # all_pending_apps = (
       #    r
       #    .table(TagsPerAgentCollection, use_outdated=True)
       #    .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
       #    .pluck(TagsPerAgentKey.AgentId)
       #    .eq_join(
       #        lambda x: [
       #            PENDING,
       #            x[AppsPerAgentKey.AgentId]
       #        ],
       #        r.table(AppsPerAgentCollection),
       #        index=AppsPerAgentIndexes.StatusAndAgentId
       #    )
       #    .pluck({'right': AppsPerAgentKey.AppId})
       #    .distinct()
       #    .count()
       #    .run(conn)
       #)

       #data.append(
       #    {
       #        COUNT: all_pending_apps,
       #        STATUS: PENDING,
       #        NAME: PENDING.capitalize()
       #    }
       #)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

        logger.info(results)

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('getting_pkg_stats', 'updates', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def get_all_avail_stats_by_tagid(username, customer_name,
                                 uri, method, tag_id, conn=None):
    data = []
    try:
        os_apps_avail = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    AVAILABLE,
                    x[AppsPerAgentKey.AgentId]
                ],
                r.table(AppsPerAgentCollection),
                index=AppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: os_apps_avail,
                STATUS: AVAILABLE,
                NAME: OS
            }
        )
        custom_apps_avail = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    AVAILABLE,
                    x[CustomAppsPerAgentKey.AgentId]
                ],
                r.table(CustomAppsPerAgentCollection),
                index=CustomAppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: custom_apps_avail,
                STATUS: AVAILABLE,
                NAME: CUSTOM
            }
        )
        supported_apps_avail = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    AVAILABLE,
                    x[SupportedAppsPerAgentKey.AgentId]
                ],
                r.table(SupportedAppsPerAgentCollection),
                index=SupportedAppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: supported_apps_avail,
                STATUS: AVAILABLE,
                NAME: SUPPORTED
            }
        )
        agent_apps_avail = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    AVAILABLE,
                    x[AgentAppsPerAgentKey.AgentId]
                ],
                r.table(AgentAppsPerAgentCollection),
                index=AgentAppsPerAgentIndexes.StatusAndAgentId
            )
            .pluck({'right': AppsPerAgentKey.AppId})
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: agent_apps_avail,
                STATUS: AVAILABLE,
                NAME: AGENT_UPDATES
            }
        )

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

        logger.info(results)

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('getting_pkg_stats', 'updates', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def get_all_app_stats_by_customer(username, customer_name,
                                  uri, method, conn=None):
    data = []
    try:
        os_apps_avail = (
            r
            .table(AppsPerAgentCollection, use_outdated=True)
            .get_all(
                [
                    AVAILABLE, customer_name
                ],
                index=AppsPerAgentIndexes.StatusAndCustomer
            )
            .pluck(AppsPerAgentKey.AppId)
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: os_apps_avail,
                STATUS: AVAILABLE,
                NAME: OS
            }
        )
        custom_apps_avail = (
            r
            .table(CustomAppsPerAgentCollection, use_outdated=True)
            .get_all(
                [
                    AVAILABLE, customer_name
                ],
                index=CustomAppsPerAgentIndexes.StatusAndCustomer
            )
            .pluck(CustomAppsPerAgentKey.AppId)
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: custom_apps_avail,
                STATUS: AVAILABLE,
                NAME: CUSTOM
            }
        )
        supported_apps_avail = (
            r
            .table(SupportedAppsPerAgentCollection, use_outdated=True)
            .get_all(
                [
                    AVAILABLE, customer_name
                ],
                index=SupportedAppsPerAgentIndexes.StatusAndCustomer
            )
            .pluck(SupportedAppsPerAgentKey.AppId)
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: supported_apps_avail,
                STATUS: AVAILABLE,
                NAME: SUPPORTED
            }
        )
        agent_apps_avail = (
            r
            .table(AgentAppsPerAgentCollection, use_outdated=True)
            .get_all(
                [
                    AVAILABLE, customer_name
                ],
                index=AgentAppsPerAgentIndexes.StatusAndCustomer
            )
            .pluck(AgentAppsPerAgentKey.AppId)
            .distinct()
            .count()
            .run(conn)
        )
        data.append(
            {
                COUNT: agent_apps_avail,
                STATUS: AVAILABLE,
                NAME: AGENT_UPDATES
            }
        )

        all_pending_apps = (
            r
            .table(AppsPerAgentCollection, use_outdated=True)
            .get_all(
                [
                    PENDING, customer_name
                ],
                index=AppsPerAgentIndexes.StatusAndCustomer
            )
            .pluck(APP_ID)
            .distinct()
            .count()
            .run(conn)
        )

        data.append(
            {
                COUNT: all_pending_apps,
                STATUS: PENDING,
                NAME: PENDING.capitalize()
            }
        )

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

        logger.info(results)

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('getting_pkg_stats', 'updates', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def delete_app_from_rv(
        app_id,
        table=AppsCollection,
        per_agent_table=AppsPerAgentCollection,
        conn=None
        ):
    completed = True
    try:
        (
            r
            .table(table)
            .filter({AppsKey.AppId: app_id})
            .delete()
            .run(conn)
        )
        (
            r
            .table(per_agent_table)
            .filter({AppsKey.AppId: app_id})
            .delete()
            .run(conn)
        )
        if table == CustomAppsCollection:
            (
                r
                .table(FilesCollection)
                .filter(lambda x: x[FilesKey.AppIds].contains(app_id))
                .delete()
                .run(conn)
            )

    except Exception as e:
        logger.exception(e)
        completed = False

    return(completed)
