#!/usr/bin/env python
import logging
from db.client import db_create_close, r
from time import mktime
from datetime import datetime, timedelta
from tagging import *
from agent import *
from plugins.patching import *
from plugins.patching.rv_db_calls import get_all_app_stats_by_customer
from errorz.error_messages import GenericResults
logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


def app_stats_by_os(stats):
    try:
        for i in xrange(len(stats)):
            stats[i] = (
                {
                    'os': stats[i]['group'][AgentKey.OsString],
                    'count': stats[i]['reduction']
                }
            )

    except Exception as e:
        logger.exception(e)

    return(stats)

@db_create_close
def customer_stats_by_os(username, customer_name,
                         uri, method, count=3, conn=None):
    try:
        stats = (
            r
            .table(AppsPerAgentCollection, use_outdated=True)
            .get_all(
                [AVAILABLE, customer_name],
                index=AppsPerAgentIndexes.StatusAndCustomer
            )
            .eq_join(AgentKey.AgentId, r.table(AgentsCollection))
            .map(
                {
                    AppsKey.AppId: r.row['left'][AppsKey.AppId],
                    AgentKey.OsString: r.row['right'][AgentKey.OsString]
                }
            )
            .pluck(AppsKey.AppId, AgentKey.OsString)
            .distinct()
            .group_by(AgentKey.OsString, r.count)
            .order_by(r.desc('reduction'))
            .limit(count)
            .run(conn)
        )

        data = []
        if stats:
            data = app_stats_by_os(stats)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, count)
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('widget stats', 'widget', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def tag_stats_by_os(username, customer_name,
                    uri, method, tag_id,
                    count=3, conn=None):
    try:
        stats = (
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
            .zip()
            .eq_join(AgentKey.AgentId, r.table(AgentsCollection))
            .zip()
            .pluck(APP_ID, AgentKey.OsString)
            .distinct()
            .group_by(AgentKey.OsString, r.count)
            .order_by(r.desc('reduction'))
            .limit(count)
            .run(conn)
        )

        data = []
        if stats:
            data = app_stats_by_os(stats)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, count)
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('tag widget stats', 'widget', e)
        )
        logger.exception(results)

    return(results)

def customer_apps_by_type_count(username, customer_name,
                                uri, method):
    try:
        results = (
            get_all_app_stats_by_customer(
                username, customer_name,
                uri, method
            )
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('widget stats', 'widget', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def bar_chart_for_appid_by_status(app_id=None, customer_name='default',
                                 conn=None):
    statuses = ['installed', 'available'] 
    try:
        status = (
            r
            .table(AppsPerAgentCollection, use_outdated=True)
            .get_all([app_id, customer_name], index=AppsPerAgentIndexes.AppIdAndCustomer)
            .group_by('status', r.count)
            .run(conn)
        )

    except Exception as e:
        msg = (
            'Couldnt get bar chart stats for appid %s for customer %s: %s' %
            (customer_name, e)
        )
        logger.error(msg)

    new_status = {}
    for stat in status:
        new_status[stat['group']['status']] = stat['reduction']
    for s in statuses:
        if not s in new_status:
            new_status[s] = 0.0

    return(
        {
            'pass': True,
            'message': '',
            'data': [new_status]
        }
    )

def app_stats_by_severity(sevs):
    try:
        new_sevs = []
        for i in xrange(len(sevs)):
            sevs[i] = (
                {
                    'severity': sevs[i]['group'][AppsKey.RvSeverity],
                    'count': sevs[i]['reduction']
                }
            )
        sevs_in_sevs = map(lambda x: x['severity'], sevs)
        difference = list(set(ValidRvSeverities).difference(sevs_in_sevs))

        if difference:
            for sev in difference:
                sevs.append(
                    {
                        'severity': sev,
                        'count': 0
                    }
                )

        for sev in sevs:
            if sev['severity'] == CRITICAL:
                crit = sev

            elif sev['severity'] == OPTIONAL:
                opt = sev

            elif sev['severity'] == RECOMMENDED:
                rec = sev

        new_sevs.append(opt)
        new_sevs.append(crit)
        new_sevs.append(rec)

    except Exception as e:
        logger.exception(e)

    return(new_sevs)

@db_create_close
def get_severity_bar_chart_stats_for_customer(username, customer_name,
                                              uri, method, conn=None):
    try:
        sevs = (
            r
            .table(AppsPerAgentCollection, use_outdated=True)
            .get_all(
                [AVAILABLE, customer_name],
                index=AppsPerAgentIndexes.StatusAndCustomer
            )
            .pluck(AppsKey.AppId)
            .distinct()
            .eq_join(AppsKey.AppId, r.table(AppsCollection))
            .map(
                {
                    AppsKey.AppId: r.row['right'][AppsKey.AppId],
                    AppsKey.RvSeverity: r.row['right'][AppsKey.RvSeverity]
                }
            )
            .group_by(AppsKey.RvSeverity, r.count)
            .order_by(r.asc('group'))
            .run(conn)
        )
        data = app_stats_by_severity(sevs)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(ValidRvSeverities))
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('widget severity stats', 'widget', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def get_severity_bar_chart_stats_for_agent(username, customer_name,
                                           uri, method, agent_id, conn=None):
    try:
        sevs = (
            r
            .table(AppsPerAgentCollection, use_outdated=True)
            .get_all(
                [AVAILABLE, agent_id],
                index=AppsPerAgentIndexes.StatusAndAgentId
            )
            .eq_join(AppsKey.AppId, r.table(AppsCollection))
            .map(
                {
                    AppsKey.AppId: r.row['right'][AppsKey.AppId],
                    AppsKey.RvSeverity: r.row['right'][AppsKey.RvSeverity]
                }
            )
            .group_by(AppsKey.RvSeverity, r.count)
            .order_by(r.desc('reduction'))
            .run(conn)
        )
        data = app_stats_by_severity(sevs)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(ValidRvSeverities))
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('widget severity stats', 'widget', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def get_severity_bar_chart_stats_for_tag(username, customer_name,
                                         uri, method, tag_id, conn=None):
    try:
        sevs = (
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
            .map(
                {
                    AppsKey.AppId: r.row['right'][AppsKey.AppId],
                }
            )
            .eq_join(AppsKey.AppId, r.table(AppsCollection))
            .map(
                {
                    AppsKey.AppId: r.row['right'][AppsKey.AppId],
                    AppsKey.RvSeverity: r.row['right'][AppsKey.RvSeverity]
                }
            )
            .group_by(AppsKey.RvSeverity, r.count)
            .order_by(r.desc('reduction'))
            .run(conn)
        )
        data = app_stats_by_severity(sevs)

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(ValidRvSeverities))
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('widget severity stats', 'widget', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def top_packages_needed(username, customer_name,
                        uri, method, count=5, conn=None):
    
    apps_needed=[]
    
    try:
        appid_needed = (
            r
            .table(AppsPerAgentCollection)
            .get_all(
                [AVAILABLE, customer_name],
                index=AppsPerAgentIndexes.StatusAndCustomer
            )
            .group_by(AppsPerAgentKey.AppId, r.count)
            .order_by(r.desc('reduction'))
            .run(conn)
        )

        for i in xrange(len(appid_needed)):
            app_info = (
                r
                .table(AppsCollection)
                .get_all(
                    appid_needed[i]['group'][AppsPerAgentKey.AppId],
                    index=AppsIndexes.AppId)
                .pluck(
                    AppsKey.Name, AppsKey.AppId,
                    AppsKey.RvSeverity, AppsKey.ReleaseDate,
                    AppsKey.Hidden,
                )
                .map(
                    {
                        AppsKey.Name: r.row[AppsKey.Name],
                        AppsKey.AppId: r.row[AppsKey.AppId],
                        AppsKey.Hidden: r.row[AppsKey.Hidden],
                        AppsKey.RvSeverity: r.row[AppsKey.RvSeverity],
                        AppsKey.ReleaseDate: r.row[AppsKey.ReleaseDate].to_epoch_time(),
                        'count': appid_needed[i]['reduction']
                    }
                )
                .run(conn)[0]
            )

            if app_info[AppsKey.Hidden] == 'no':
                apps_needed.append(app_info)

            if len(apps_needed) == count:
                break;

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(apps_needed, count)
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('top os apps needed', 'widget', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def recently_released_packages(username, customer_name,
                               uri, method, count=5, conn=None):

    app_needed=[]

    try:
        data = list(
            r
            .table(AppsPerAgentCollection, use_outdated=True)
            .get_all(
                [
                    AVAILABLE, customer_name
                ],
                index=AppsPerAgentIndexes.StatusAndCustomer
            )
            .eq_join(AppsKey.AppId, r.table(AppsCollection))
            .map(
                {
                    AppsKey.Name: r.row['right'][AppsKey.Name],
                    AppsKey.AppId: r.row['right'][AppsKey.AppId],
                    AppsKey.RvSeverity: r.row['right'][AppsKey.RvSeverity],
                    AppsKey.Hidden: r.row['right'][AppsKey.Hidden],
                    AppsKey.ReleaseDate: r.row['right'][AppsKey.ReleaseDate].to_epoch_time(),
                    'count': (
                        r
                        .table(AppsPerAgentCollection)
                        .get_all(
                            [r.row['right'][AppsKey.AppId], AVAILABLE],
                            index=AppsPerAgentIndexes.AppIdAndStatus
                        )
                        .count()
                    )
                }
            )
            .pluck(
                AppsKey.Name, AppsKey.AppId,AppsKey.Hidden,
                AppsKey.RvSeverity, AppsKey.ReleaseDate, 'count'
            )
            .order_by(r.desc(AppsKey.ReleaseDate))
            .run(conn)
        )

        for i in xrange(len(data)):
            if data[i][AppsKey.Hidden] == 'no':
                app_needed.append(data[i])
            if len(app_needed) == count:
                break;
                
        
        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(app_needed, count)
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('recently released os apps', 'widget', e)
        )
        logger.exception(results)

    return(results)


@db_create_close
def get_os_apps_history(username, customer_name, uri, method, status,
                        start_date=None, end_date=None, conn=None):

    try:
        if not start_date and not end_date:
            start_date = mktime((datetime.now() - timedelta(days=1*365)).timetuple())
            end_date = mktime(datetime.now().timetuple())

        elif start_date and not end_date:
            end_date = mktime(datetime.now().timetuple())

        elif not start_date and end_date:
            start_date = 0.0
        data = (
            r
            .table(AppsPerAgentCollection)
            .get_all(
                [AVAILABLE, customer_name],
                index=AppsPerAgentIndexes.StatusAndCustomer
            )
            .eq_join(AppsKey.AppId, r.table(AppsCollection))
            .zip()
            .filter(
                r.row[AppsKey.ReleaseDate].during(
                    r.epoch_time(start_date), r.epoch_time(end_date)
                )
            )
            .pluck(
                AppsKey.AppId, AppsKey.Name, AppsKey.Version,
                AppsKey.RvSeverity, AppsKey.ReleaseDate
            )
            .grouped_map_reduce(
                lambda x: x[AppsKey.ReleaseDate].to_epoch_time(),
                lambda x:
                    {
                        'details':
                            [
                                {
                                    AppsKey.AppId: x[AppsKey.AppId],
                                    AppsKey.Name: x[AppsKey.Name],
                                    AppsKey.Version: x[AppsKey.Version],
                                    AppsKey.RvSeverity: x[AppsKey.RvSeverity]
                                }
                            ],
                        COUNT: 1,
                    },
                lambda x, y: {
                    "count": x["count"] + y["count"],
                    "details": x["details"] + y["details"],
                }
            )
            .map(
                {
                    'timestamp': r.row['group'],
                    'total_count': r.row['reduction']['count'],
                    'details': (
                        r.row['reduction']['details'].grouped_map_reduce(
                            lambda a: a['rv_severity'],
                            lambda a:
                                {
                                    'apps':
                                        [
                                            {
                                                AppsKey.AppId: a[AppsKey.AppId],
                                                AppsKey.Name: a[AppsKey.Name],
                                                AppsKey.Version: a[AppsKey.Version],
                                            }
                                        ],
                                    COUNT: 1
                                },
                            lambda a, b: {
                                "count": a["count"] + b["count"],
                                "apps": a["apps"] + b["apps"],
                            }
                        )
                    )
                }
            )
            .run(conn)
        )

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('available apps over time graph', 'graph', e)
        )
        logger.exception(results)

    return(results)

@db_create_close
def get_os_apps_history_for_agent(username, customer_name, uri, method,
                                  agent_id, status, start_date=None,
                                  end_date=None, conn=None):

    try:
        if not start_date and not end_date:
            start_date = mktime((datetime.now() - timedelta(days=1*365)).timetuple())
            end_date = mktime(datetime.now().timetuple())

        elif start_date and not end_date:
            end_date = mktime(datetime.now().timetuple())

        elif not start_date and end_date:
            start_date = 0.0
        data = (
            r
            .table(AppsPerAgentCollection)
            .get_all(
                [status, agent_id],
                index=AppsPerAgentIndexes.StatusAndAgentId
            )
            .eq_join(AppsKey.AppId, r.table(AppsCollection))
            .zip()
            .filter(
                r.row[AppsKey.ReleaseDate].during(
                    r.epoch_time(start_date), r.epoch_time(end_date)
                )
            )
            .pluck(
                AppsKey.AppId, AppsKey.Name, AppsKey.Version,
                AppsKey.RvSeverity, AppsKey.ReleaseDate
            )
             .grouped_map_reduce(
                lambda x: x[AppsKey.ReleaseDate].to_epoch_time(),
                lambda x:
                    {
                        'details':
                            [
                                {
                                    AppsKey.AppId: x[AppsKey.AppId],
                                    AppsKey.Name: x[AppsKey.Name],
                                    AppsKey.Version: x[AppsKey.Version],
                                    AppsKey.RvSeverity: x[AppsKey.RvSeverity]
                                }
                            ],
                        COUNT: 1,
                    },
                lambda x, y: {
                    "count": x["count"] + y["count"],
                    "details": x["details"] + y["details"],
                }
            )
            .map(
                {
                    'timestamp': r.row['group'],
                    'total_count': r.row['reduction']['count'],
                    'details': (
                        r.row['reduction']['details'].grouped_map_reduce(
                            lambda a: a['rv_severity'],
                            lambda a:
                                {
                                    'apps':
                                        [
                                            {
                                                AppsKey.AppId: a[AppsKey.AppId],
                                                AppsKey.Name: a[AppsKey.Name],
                                                AppsKey.Version: a[AppsKey.Version],
                                            }
                                        ],
                                    COUNT: 1
                                },
                            lambda a, b: {
                                "count": a["count"] + b["count"],
                                "apps": a["apps"] + b["apps"],
                            }
                        )
                    )
                }
            )
            .run(conn)
        )

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('available apps over time graph', 'graph', e)
        )
        logger.exception(results)

    return(results)

@db_create_close
def get_os_apps_history_for_tag(username, customer_name, uri, method,
                                tag_id, status, start_date=None,
                                end_date=None, conn=None):

    try:
        if not start_date and not end_date:
            start_date = mktime((datetime.now() - timedelta(days=1*365)).timetuple())
            end_date = mktime(datetime.now().timetuple())

        elif start_date and not end_date:
            end_date = mktime(datetime.now().timetuple())

        elif not start_date and end_date:
            start_date = 0.0
        data = (
            r
            .table(TagsPerAgentCollection, use_outdated=True)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .pluck(TagsPerAgentKey.AgentId)
            .eq_join(
                lambda x: [
                    status,
                    x[AppsPerAgentKey.AgentId]
                ],
                r.table(AppsPerAgentCollection),
                index=AppsPerAgentIndexes.StatusAndAgentId
            )
            .zip()
            .eq_join(AppsKey.AppId, r.table(AppsCollection))
            .zip()
            .filter(
                r.row[AppsKey.ReleaseDate].during(
                    r.epoch_time(start_date), r.epoch_time(end_date)
                )
            )
            .pluck(
                AppsKey.AppId, AppsKey.Name, AppsKey.Version,
                AppsKey.RvSeverity, AppsKey.ReleaseDate
            )
             .grouped_map_reduce(
                lambda x: x[AppsKey.ReleaseDate].to_epoch_time(),
                lambda x:
                    {
                        'details':
                            [
                                {
                                    AppsKey.AppId: x[AppsKey.AppId],
                                    AppsKey.Name: x[AppsKey.Name],
                                    AppsKey.Version: x[AppsKey.Version],
                                    AppsKey.RvSeverity: x[AppsKey.RvSeverity]
                                }
                            ],
                        COUNT: 1,
                    },
                lambda x, y: {
                    "count": x["count"] + y["count"],
                    "details": x["details"] + y["details"],
                }
            )
            .map(
                {
                    'timestamp': r.row['group'],
                    'total_count': r.row['reduction']['count'],
                    'details': (
                        r.row['reduction']['details'].grouped_map_reduce(
                            lambda a: a['rv_severity'],
                            lambda a:
                                {
                                    'apps':
                                        [
                                            {
                                                AppsKey.AppId: a[AppsKey.AppId],
                                                AppsKey.Name: a[AppsKey.Name],
                                                AppsKey.Version: a[AppsKey.Version],
                                            }
                                        ],
                                    COUNT: 1
                                },
                            lambda a, b: {
                                "count": a["count"] + b["count"],
                                "apps": a["apps"] + b["apps"],
                            }
                        )
                    )
                }
            )
            .run(conn)
        )

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

    except Exception as e:
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('available apps over time graph', 'graph', e)
        )
        logger.exception(results)

    return(results)
