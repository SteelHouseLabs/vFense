#!/usr/bin/env python

import logging
import logging.config
from datetime import datetime
from time import mktime
from db.client import db_create_close, r, db_connect
from operations import *
from errorz.error_messages import GenericResults, OperationResults
from errorz.status_codes import OperationCodes

from plugins import ra

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


@db_create_close
def get_oper_info(operid, conn=None):
    oper_info = (
        r
        .table(OperationsCollection)
        .get(operid)
        .run(conn)
    )

    return(oper_info)


def oper_with_agentid_exists(oper_id, agent_id):
    conn = db_connect()
    exists = None
    try:
        exists = (
            r
            .table(OperationsPerAgentCollection)
            .get_all(
                [oper_id, agent_id],
                index=OperationPerAgentIndexes.OperationIdAndAgentId
            )
            .pluck(OperationPerAppKey.AgentId)
            .run(conn)
        )
        conn.close()
    except Exception as e:
        logger.exception(e)

    return(exists)


def oper_with_appid_exists(oper_id, agent_id, app_id):
    conn = db_connect()
    exists = None
    try:
        exists = (
            r
            .table(OperationsPerAppCollection)
            .get_all(
                [oper_id, agent_id, app_id],
                index=OperationPerAppIndexes.OperationIdAndAgentIdAndAppId
            )
            .pluck(OperationPerAppKey.AppId)
            .run(conn)
        )
        conn.close()
    except Exception as e:
        logger.exception(e)

    return(exists)


class Operation(object):
    def __init__(self, username, customer_name, uri, method):
        self.username = username
        self.customer_name = customer_name
        self.uri = uri
        self.method = method
        self.now = mktime(datetime.now().timetuple())
        self.db_time = r.epoch_time(self.now)
        self.INIT_COUNT = 0

    @db_create_close
    def create_operation(self, operation, plugin, agent_ids,
                         tag_id, cpu_throttle=None, net_throttle=None,
                         restart=None, conn=None):
        keys_to_insert = (
            {
                OperationKey.Plugin: plugin,
                OperationKey.Operation: operation,
                OperationKey.OperationStatus: OperationCodes.ResultsIncomplete,
                OperationKey.CustomerName: self.customer_name,
                OperationKey.CreatedBy: self.username,
                OperationKey.TagId: tag_id,
                OperationKey.AgentsTotalCount: len(agent_ids),
                OperationKey.AgentsPendingResultsCount: self.INIT_COUNT,
                OperationKey.AgentsPendingPickUpCount: len(agent_ids),
                OperationKey.AgentsFailedCount: self.INIT_COUNT,
                OperationKey.AgentsCompletedCount: self.INIT_COUNT,
                OperationKey.AgentsCompletedWithErrorsCount: self.INIT_COUNT,
                OperationKey.CreatedTime: self.db_time,
                OperationKey.UpdatedTime: self.db_time,
                OperationKey.CompletedTime: r.epoch_time(0.0),
                OperationKey.Restart: restart,
                OperationKey.CpuThrottle: cpu_throttle,
                OperationKey.NetThrottle: cpu_throttle,
            }
        )
        try:
            added = (
                r
                .table(OperationsCollection)
                .insert(keys_to_insert)
                .run(conn)
            )
            if 'inserted' in added:
                operation_id = added.get('generated_keys')[0]
                keys_to_insert[OperationKey.CreatedTime] = self.now
                keys_to_insert[OperationKey.UpdatedTime] = self.now
                keys_to_insert[OperationKey.CompletedTime] = self.now
                keys_to_insert[OperationKey.OperationId] = operation_id
                results = (
                    OperationResults(
                        self.username, self.uri, self.method
                    ).operation_created(operation_id, operation, keys_to_insert)
                )
                logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, operation, e)
            )
            logger.exception(results)

        return(results)

    @db_create_close
    def add_agent_to_operation(self, agent_id, operation_id, conn=None):
        try:
            (
                r
                .table(OperationsPerAgentCollection)
                .insert(
                    {
                        OperationPerAgentKey.AgentId: agent_id,
                        OperationPerAgentKey.OperationId: operation_id,
                        OperationPerAgentKey.CustomerName: self.customer_name,
                        OperationPerAgentKey.Status: PENDINGPICKUP,
                        OperationPerAgentKey.PickedUpTime: r.epoch_time(0.0),
                        OperationPerAgentKey.CompletedTime: r.epoch_time(0.0),
                        OperationPerAgentKey.Errors: None
                    }
                )
                .run(conn)
            )

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, 'add agent to reboot operation', e)
            )
            logger.exception(results)

    @db_create_close
    def add_agent_to_install_operation(self, agent_id, operation_id,
                                       applications, conn=None):
        try:
            (
                r
                .table(OperationsPerAgentCollection)
                .insert(
                    {
                        OperationPerAgentKey.AgentId: agent_id,
                        OperationPerAgentKey.OperationId: operation_id,
                        OperationPerAgentKey.CustomerName: self.customer_name,
                        OperationPerAgentKey.Status: PENDINGPICKUP,
                        OperationPerAgentKey.PickedUpTime: r.epoch_time(0.0),
                        OperationPerAgentKey.CompletedTime: r.epoch_time(0.0),
                        OperationPerAgentKey.AppsTotalCount: len(applications),
                        OperationPerAgentKey.AppsPendingCount: len(applications),
                        OperationPerAgentKey.AppsFailedCount: self.INIT_COUNT,
                        OperationPerAgentKey.AppsCompletedCount: self.INIT_COUNT,
                        OperationPerAgentKey.Errors: None
                    }
                )
                .run(conn)
            )
            for app in applications:
                (
                    r
                    .table(OperationsPerAppCollection)
                    .insert(
                        {
                            OperationPerAppKey.AgentId: agent_id,
                            OperationPerAppKey.OperationId: operation_id,
                            OperationPerAppKey.CustomerName: self.customer_name,
                            OperationPerAppKey.Results: OperationCodes.ResultsPending,
                            OperationPerAppKey.ResultsReceivedTime: r.epoch_time(0.0),
                            OperationPerAppKey.AppId: app[OperationPerAppKey.AppId],
                            OperationPerAppKey.AppName: app[OperationPerAppKey.AppName],
                            OperationPerAppKey.Errors: None
                        }
                    )
                    .run(conn)
                )

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, 'add agent to install operation', e)
            )
            logger.exception(results)

    @db_create_close
    def create_ra_operation(
        self,
        operation,
        agent_id,
        data,
        conn=None
    ):

        keys_to_insert = (
            {
                OperationKey.Plugin: ra.PluginName,
                OperationKey.Operation: operation,
                OperationKey.OperationStatus: OperationCodes.ResultsIncomplete,
                OperationKey.CustomerName: self.customer_name,
                OperationKey.CreatedBy: self.username,
                OperationKey.CreatedTime: self.db_time,
                #OperationKey.NumberOfAgents: 1,
            }
        )
        try:
            added = (
                r
                .table(OperationsCollection)
                .insert(keys_to_insert)
                .run(conn)
            )
            if 'inserted' in added:
                operation_id = added.get('generated_keys')[0]
                (
                    r
                    .table(OperationsPerAgentCollection)
                    .insert(
                        {
                            OperationPerAgentKey.AgentId: agent_id,
                            OperationPerAgentKey.OperationId: operation_id,
                            OperationPerAgentKey.CustomerName: self.customer_name,
                            OperationPerAgentKey.Status: PENDINGPICKUP
                        }
                    )
                    .run(conn)
                )

                data[OperationKey.OperationId] = operation_id
                results = (
                    OperationResults(
                        self.username, self.uri, self.method
                    ).operation_created(
                        operation_id,
                        operation,
                        data
                    )
                )

                logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, operation, e)
            )
            logger.exception(results)

        return(results)

    @db_create_close
    def update_operation_pickup_time(self, operation_id, agent_id,
                                     operation, conn=None):
        keys_to_update = (
            {
                OperationPerAgentKey.Status: PICKEDUP,
                OperationPerAgentKey.PickedUpTime: self.db_time,
            }
        )
        try:
            (
                r
                .table(OperationsPerAgentCollection)
                .get_all(
                    [operation_id, agent_id],
                    index=OperationPerAgentIndexes.OperationIdAndAgentId
                )
                .update(keys_to_update)
                .run(conn)
            )

            (
                r
                .table(OperationsCollection)
                .get(operation_id)
                .update(
                    {
                        OperationKey.AgentsPendingPickUpCount: (
                            r.branch(
                                r.row[OperationKey.AgentsPendingPickUpCount] > 0,
                                r.row[OperationKey.AgentsPendingPickUpCount] - 1,
                                r.row[OperationKey.AgentsPendingPickUpCount],
                            )
                        ),
                        OperationKey.AgentsPendingResultsCount: (
                            r.branch(
                                r.row[OperationKey.AgentsPendingResultsCount] < r.row[OperationKey.AgentsTotalCount],
                                r.row[OperationKey.AgentsPendingResultsCount] + 1,
                                r.row[OperationKey.AgentsPendingResultsCount]
                            )
                        ),
                        OperationKey.UpdatedTime: self.db_time
                    }
                )
                .run(conn)
            )

            results = (
                OperationResults(
                    self.username, self.uri, self.method
                ).operation_updated(operation_id)
            )

            logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, operation, e)
            )
            logger.exception(results)

        return(results)

    @db_create_close
    def update_operation_results(self, operation_id, agent_id,
                                 status, operation, errors=None,
                                 conn=None):
        keys_to_update = (
            {
                OperationPerAgentKey.Status: status,
                OperationPerAgentKey.CompletedTime: self.db_time,
                OperationPerAgentKey.Errors: errors
            }
        )
        try:
            (
                r
                .table(OperationsPerAgentCollection)
                .get_all(
                    [operation_id, agent_id],
                    index=OperationPerAgentIndexes.OperationIdAndAgentId
                )
                .update(keys_to_update)
                .run(conn)
            )

            self._update_agent_stats(operation_id, agent_id)
            self._update_operation_status_code(operation_id)

            results = (
                OperationResults(
                    self.username, self.uri, self.method
                ).operation_updated(operation_id)
            )

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, operation, e)
            )
            logger.exception(results)

        return(results)

    @db_create_close
    def update_app_results(self, operation_id, agent_id, app_id,
                           results=OperationCodes.ResultsReceived,
                           errors=None, conn=None):
        keys_to_update = (
            {
                OperationPerAppKey.Results: results,
                OperationPerAppKey.ResultsReceivedTime: self.db_time,
                OperationPerAppKey.Errors: errors
            }
        )
        try:
            (
                r
                .table(OperationsPerAppCollection)
                .get_all(
                    [operation_id, agent_id, app_id],
                    index=OperationPerAppIndexes.OperationIdAndAgentIdAndAppId
                )
                .update(keys_to_update)
                .run(conn)
            )

            self._update_app_stats(operation_id, agent_id, app_id, results)

            results = (
                OperationResults(
                    self.username, self.uri, self.method
                ).operation_updated(operation_id)
            )

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, 'update_app_results', e)
            )
            logger.exception(results)

        return(results)

    @db_create_close
    def _update_app_stats(self, operation_id, agent_id,
                          app_id, results, conn=None):
        completed = True
        try:
            pending_count = 0
            completed_count = 0
            failed_count = 0
            app_stats_count = (
                r
                .table(OperationsPerAppCollection)
                .get_all(
                    [operation_id, agent_id],
                    index=OperationPerAppIndexes.OperationIdAndAgentId
                )
                .group_by(OperationPerAppKey.Results, r.count)
                .run(conn)
            )

            for i in app_stats_count:
                if i['group']['results'] == OperationCodes.ResultsPending:
                    pending_count = i['reduction']

                elif i['group']['results'] == OperationCodes.ResultsReceived:
                    completed_count = i['reduction']

                elif i['group']['results'] == OperationCodes.ResultsReceivedWithErrors:
                    failed_count = i['reduction']

            (
                r
                .table(OperationsPerAgentCollection)
                .get_all(
                    [operation_id, agent_id],
                    index=OperationPerAgentIndexes.OperationIdAndAgentId
                )
                .update(
                    {
                        OperationPerAgentKey.AppsCompletedCount: completed_count,
                        OperationPerAgentKey.AppsFailedCount: failed_count,
                        OperationPerAgentKey.AppsPendingCount: pending_count,
                    }
                )
                .run(conn)
            )
            self._update_agent_stats_by_app_stats(
                operation_id, agent_id, completed_count,
                failed_count, pending_count
            )

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, agent_id, e)
            )
            logger.exception(results)
            completed = False

        return(completed)

    @db_create_close
    def _update_agent_stats_by_app_stats(self, operation_id, agent_id,
                                         completed_count, failed_count,
                                         pending_count, conn=None):
        completed = True
        try:
            total_count = completed_count + failed_count + pending_count
            if total_count == completed_count:
                (
                    r
                    .table(OperationsCollection)
                    .get(operation_id)
                    .update(
                        {
                            OperationKey.AgentsCompletedCount: r.branch(
                                r.row[OperationKey.AgentsCompletedCount] < r.row[OperationKey.AgentsTotalCount],
                                r.row[OperationKey.AgentsCompletedCount] + 1,
                                r.row[OperationKey.AgentsCompletedCount]
                            ),
                            OperationKey.AgentsPendingResultsCount: r.branch(
                                r.row[OperationKey.AgentsPendingResultsCount] > 0,
                                r.row[OperationKey.AgentsPendingResultsCount] - 1,
                                r.row[OperationKey.AgentsPendingResultsCount]
                            ),
                            OperationKey.UpdatedTime: self.db_time,
                            OperationKey.CompletedTime: self.db_time
                        }
                    )
                    .run(conn)
                )
                self._update_completed_time_on_agents(operation_id, agent_id)
                self._update_operation_status_code(operation_id)

            elif total_count == failed_count:

                (
                    r
                    .table(OperationsCollection)
                    .get(operation_id)
                    .update(
                        {
                            OperationKey.AgentsFailedCount: r.branch(
                                r.row[OperationKey.AgentsFailedCount] < r.row[OperationKey.AgentsTotalCount],
                                r.row[OperationKey.AgentsFailedCount] + 1,
                                r.row[OperationKey.AgentsFailedCount]
                                ),
                            OperationKey.AgentsPendingResultsCount: r.branch(
                                r.row[OperationKey.AgentsPendingResultsCount] > 0,
                                r.row[OperationKey.AgentsPendingResultsCount] - 1,
                                r.row[OperationKey.AgentsPendingResultsCount]
                                ),
                            OperationKey.UpdatedTime: self.db_time,
                            OperationKey.CompletedTime: self.db_time
                        }
                    )
                    .run(conn)
                )
                self._update_completed_time_on_agents(operation_id, agent_id)
                self._update_operation_status_code(operation_id)

            elif total_count == (failed_count + completed_count):
                (
                    r
                    .table(OperationsCollection)
                    .get(operation_id)
                    .update(
                        {
                            OperationKey.AgentsCompletedWithErrorsCount: r.branch(
                                r.row[OperationKey.AgentsCompletedWithErrorsCount] < r.row[OperationKey.AgentsTotalCount],
                                r.row[OperationKey.AgentsCompletedWithErrorsCount] + 1,
                                r.row[OperationKey.AgentsCompletedWithErrorsCount]
                                ),
                            OperationKey.AgentsPendingResultsCount: r.branch(
                                r.row[OperationKey.AgentsPendingResultsCount] > 0,
                                r.row[OperationKey.AgentsPendingResultsCount] - 1,
                                r.row[OperationKey.AgentsPendingResultsCount]
                                ),
                            OperationKey.UpdatedTime: self.db_time,
                            OperationKey.CompletedTime: self.db_time
                        }
                    )
                    .run(conn)
                )
                self._update_completed_time_on_agents(operation_id, agent_id)
                self._update_operation_status_code(operation_id)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, agent_id, e)
            )
            logger.exception(results)
            completed = False

        return(completed)

    @db_create_close
    def _update_agent_stats(self, operation_id, agent_id, conn=None):
        completed = True
        try:
            agent_operation = (
                r
                .table(OperationsPerAgentCollection)
                .get_all(
                    [operation_id, agent_id],
                    index=OperationPerAgentIndexes.OperationIdAndAgentId
                )
                .run(conn)
            )
            if agent_operation:
                for oper in agent_operation:
                    if (oper[OperationPerAgentKey.Status] ==
                            OperationCodes.ResultsReceived):

                        (
                            r
                            .table(OperationsCollection)
                            .get(operation_id)
                            .update(
                                {
                                    OperationKey.AgentsCompletedCount: r.branch(
                                        r.row[OperationKey.AgentsCompletedCount] < r.row[OperationKey.AgentsTotalCount],
                                        r.row[OperationKey.AgentsCompletedCount] + 1,
                                        r.row[OperationKey.AgentsCompletedCount]
                                        ),

                                    OperationKey.AgentsPendingResultsCount: r.branch(
                                        r.row[OperationKey.AgentsPendingResultsCount] > 0,
                                        r.row[OperationKey.AgentsPendingResultsCount] - 1,
                                        r.row[OperationKey.AgentsPendingResultsCount]
                                        ),
                                    OperationKey.UpdatedTime: self.db_time,
                                    OperationKey.CompletedTime: self.db_time
                                }
                            )
                            .run(conn)
                        )

                    elif (oper[OperationPerAgentKey.Status] ==
                            OperationCodes.ResultsReceivedWithErrors):

                        (
                            r
                            .table(OperationsCollection)
                            .get(operation_id)
                            .update(
                                {
                                    OperationKey.AgentsFailedCount: r.branch(
                                        r.row[OperationKey.AgentsFailedCount] < r.row[OperationKey.AgentsTotalCount],
                                        r.row[OperationKey.AgentsFailedCount] + 1,
                                        r.row[OperationKey.AgentsFailedCount]
                                        ),
                                    OperationKey.AgentsPendingResultsCount: r.branch(
                                        r.row[OperationKey.AgentsPendingResultsCount] > 0,
                                        r.row[OperationKey.AgentsPendingResultsCount] - 1,
                                        r.row[OperationKey.AgentsPendingResultsCount]
                                        ),
                                    OperationKey.UpdatedTime: self.db_time,
                                    OperationKey.CompletedTime: self.db_time
                                }
                            )
                            .run(conn)
                        )

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(operation_id, agent_id, e)
            )
            logger.exception(results)
            completed = False

        return(completed)


    def _update_completed_time_on_agents(self, oper_id, agent_id):
        try:
            conn = db_connect()
            (
                r
                .table(OperationsPerAgentCollection)
                .get_all(
                    [oper_id, agent_id],
                    index=OperationPerAgentIndexes.OperationIdAndAgentId
                )
                .update({OperationPerAgentKey.CompletedTime: self.db_time})
                .run(conn)
            )
            conn.close()
        except Exception as e:
            logger.exception(e)

    def _update_operation_status_code(self, operation_id):
        try:
            conn = db_connect()
            operation = (
                r
                .table(OperationsCollection)
                .get(operation_id)
                .run(conn)
            )
            if (operation[OperationKey.AgentsTotalCount] == 
                    operation[OperationKey.AgentsCompletedCount]):
                (
                    r
                    .table(OperationsCollection)
                    .get(operation_id)
                    .update(
                        {
                            OperationKey.OperationStatus: OperationCodes.ResultsCompleted,
                            OperationKey.CompletedTime: self.db_time
                        }
                    )
                    .run(conn)
                )

            elif (operation[OperationKey.AgentsTotalCount] == 
                    operation[OperationKey.AgentsFailedCount]):
                (
                    r
                    .table(OperationsCollection)
                    .get(operation_id)
                    .update(
                        {
                            OperationKey.OperationStatus: OperationCodes.ResultsCompletedFailed,
                            OperationKey.CompletedTime: self.db_time
                        }
                    )
                    .run(conn)
                )

            elif (operation[OperationKey.AgentsTotalCount] == 
                    (
                        operation[OperationKey.AgentsFailedCount] +
                        operation[OperationKey.AgentsCompletedWithErrorsCount]
                    )):
                (
                    r
                    .table(OperationsCollection)
                    .get(operation_id)
                    .update(
                        {
                            OperationKey.OperationStatus: OperationCodes.ResultsCompletedWithErrors,
                            OperationKey.CompletedTime: self.db_time
                        }
                    )
                    .run(conn)
                )
            else:
                (
                    r
                    .table(OperationsCollection)
                    .get(operation_id)
                    .update(
                        {
                            OperationKey.OperationStatus: OperationCodes.ResultsIncomplete
                        }
                    )
                    .run(conn)
                )
            conn.close()

        except Exception as e:
            logger.exception(e)
