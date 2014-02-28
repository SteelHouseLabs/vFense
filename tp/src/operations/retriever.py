#!/usr/bin/env python

import logging
import logging.config
from db.client import db_create_close, r
from operations import *
from agent import *
from errorz.error_messages import GenericResults, OperationResults, OperationCodes
from plugins.patching import *
from plugins.patching.rv_db_calls import *
from utils.common import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

@db_create_close
def oper_exists(oper_id, conn=None):
    try:
        oper_exists = (
            r
            .table(OperationsCollection)
            .get(oper_id)
            .run(conn)
        )
    except Exception as e:
        logger.exception(e)
        oper_exists = None

    return(oper_exists)


class OperationRetriever(object):
    def __init__(self, username, customer_name,
                 uri, method, count=30,
                 offset=0, sort='desc',
                 sort_key=OperationKey.CreatedTime):
        self.username = username
        self.customer_name = customer_name
        self.uri = uri
        self.method = method
        self.offset = offset
        self.count = count
        self.pluck_list = (
            [
                OperationKey.OperationId,
                OperationKey.TagId,
                OperationKey.Operation,
                OperationKey.CreatedTime,
                OperationKey.UpdatedTime,
                OperationKey.CompletedTime,
                OperationKey.OperationStatus,
                OperationKey.CreatedBy,
                #OperationKey.UpdatedTime,
                OperationKey.CustomerName,
                OperationKey.AgentsTotalCount,
                OperationKey.AgentsPendingResultsCount,
                OperationKey.AgentsPendingPickUpCount,
                OperationKey.AgentsFailedCount,
                OperationKey.AgentsCompletedCount,
                OperationKey.AgentsCompletedWithErrorsCount,

            ]
        )
        self.map_hash = (
            {
                OperationKey.OperationId: r.row[OperationKey.OperationId],
                OperationKey.OperationStatus: r.row[OperationKey.OperationStatus],
                OperationKey.TagId: r.row[OperationKey.TagId],
                OperationKey.Operation: r.row[OperationKey.Operation],
                OperationKey.CreatedTime: r.row[OperationKey.CreatedTime].to_epoch_time(),
                OperationKey.UpdatedTime: r.row[OperationKey.UpdatedTime].to_epoch_time(),
                OperationKey.CompletedTime: r.row[OperationKey.CompletedTime].to_epoch_time(),
                OperationKey.CreatedBy: r.row[OperationKey.CreatedBy],
                OperationKey.CustomerName: r.row[OperationKey.CustomerName],
                OperationKey.AgentsTotalCount: r.row[OperationKey.AgentsTotalCount],
                OperationKey.AgentsPendingResultsCount: r.row[OperationKey.AgentsPendingResultsCount],
                OperationKey.AgentsPendingPickUpCount: r.row[OperationKey.AgentsPendingPickUpCount],
                OperationKey.AgentsFailedCount: r.row[OperationKey.AgentsFailedCount],
                OperationKey.AgentsCompletedCount: r.row[OperationKey.AgentsCompletedCount],
                OperationKey.AgentsCompletedWithErrorsCount: r.row[OperationKey.AgentsCompletedWithErrorsCount],

            }
        )
        order_by_list = (
            [
                OperationKey.Operation,
                OperationKey.OperationStatus,
                OperationKey.CreatedTime,
                OperationKey.UpdatedTime,
                OperationKey.CompletedTime,
                OperationKey.CreatedBy,
                OperationKey.CustomerName,
            ]
        )
        if sort_key in order_by_list:
            self.sort_key = sort_key
        else:
            self.sort_key = OperationKey.CreatedTime

        if sort == 'asc':
            self.sort = r.asc
        else:
            self.sort = r.desc

    @db_create_close
    def get_all_operations(self, conn=None):
        try:
            count = (
                r
                .table(OperationsCollection)
                .get_all(
                    self.customer_name,
                    index=OperationIndexes.CustomerName
                )
                .count()
                .run(conn)
            )
            operations = list(
                r
                .table(OperationsCollection)
                .get_all(
                    self.customer_name,
                    index=OperationIndexes.CustomerName
                )
                .pluck(self.pluck_list)
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .map(self.map_hash)
                .run(conn)
            )
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(operations, count)
            )
            logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('Operations Query', 'Operations', e)
            )
            logger.exception(results)

        return(results)

    @db_create_close
    def get_all_operations_by_agentid(self, agent_id, conn=None):
        try:
            count = (
                r
                .table(OperationsPerAgentCollection)
                .get_all(
                    [agent_id, self.customer_name],
                    index=OperationPerAgentIndexes.AgentIdAndCustomer
                )
                .count()
                .run(conn)
            )

            operations = list(
                r
                .table(OperationsPerAgentCollection)
                .get_all(
                    [agent_id, self.customer_name],
                    index=OperationPerAgentIndexes.AgentIdAndCustomer
                )
                .eq_join(
                    OperationKey.OperationId,
                    r.table(OperationsCollection)
                )
                .zip()
                .pluck(self.pluck_list)
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .map(self.map_hash)
                .run(conn)
            )

            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(operations, count)
            )
            logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('Operations Query', 'Operations', e)
            )
            logger.exception(results)

        return(results)


    @db_create_close
    def get_all_operations_by_tagid(self, tag_id, conn=None):
        try:
            count = (
                r
                .table(OperationsCollection)
                .get_all(tag_id, index=OperationKey.TagId)
                .count()
                .run(conn)
            )

            operations = list(
                r
                .table(OperationsCollection)
                .get_all(tag_id, index=OperationKey.TagId)
                .pluck(self.pluck_list)
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .map(self.map_hash)
                .run(conn)
            )

            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(operations, count)
            )
            logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('Operations Query', 'Operations', e)
            )
            logger.exception(results)

        return(results)


    @db_create_close
    def get_all_operations_by_type(self, oper_type, conn=None):
        try:
            if oper_type in VALID_OPERATIONS:
                count = (
                    r
                    .table(OperationsCollection)
                    .get_all(
                        [oper_type, self.customer_name],
                        index=OperationIndexes.OperationAndCustomer
                    )
                    .count()
                    .run(conn)
                )

                operations = list(
                    r
                    .table(OperationsCollection)
                    .get_all(
                        [oper_type, self.customer_name],
                        index=OperationIndexes.OperationAndCustomer
                    )
                    .pluck(self.pluck_list)
                    .order_by(self.sort(self.sort_key))
                    .skip(self.offset)
                    .limit(self.count)
                    .map(self.map_hash)
                    .run(conn)
                )

                results = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).information_retrieved(operations, count)
                )
                logger.info(results)

            else:
                results = (
                    OperationResults(
                        self.username, self.uri, self.method
                    ).invalid_operation_type(oper_type)
                )
                logger.warn(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('Operations Query', 'Operations', e)
            )
            logger.exception(results)

        return(results)


    @db_create_close
    def get_install_operation_by_id(self, oper_id, conn=None):
        pluck_list = (
            [
                OperationKey.OperationId,
                OperationKey.Operation,
                OperationKey.OperationStatus,
                OperationKey.CreatedTime,
                OperationKey.CreatedBy,
                OperationKey.UpdatedTime,
                OperationKey.CompletedTime,
                OperationKey.CustomerName,
                OperationKey.AgentsTotalCount,
                OperationKey.AgentsPendingResultsCount,
                OperationKey.AgentsPendingPickUpCount,
                OperationKey.AgentsFailedCount,
                OperationKey.AgentsCompletedCount,
                OperationKey.AgentsCompletedWithErrorsCount,
                OperationPerAgentKey.PickedUpTime,
                OperationPerAgentKey.CompletedTime,
                OperationPerAgentKey.AppsTotalCount,
                OperationPerAgentKey.AppsPendingCount,
                OperationPerAgentKey.AppsFailedCount,
                OperationPerAgentKey.AppsCompletedCount,
                OperationPerAgentKey.Errors,
                OperationPerAgentKey.Status,
                OperationPerAgentKey.AgentId,
                AgentKey.ComputerName,
                AgentKey.DisplayName,
                OperationPerAppKey.AppId,
                OperationPerAppKey.AppName,
                OperationPerAppKey.Results,
                OperationPerAppKey.ResultsReceivedTime,
            ]
        )
        map_list = (
            {
                OperationKey.OperationId: r.row[OperationKey.OperationId],
                OperationKey.Operation: r.row[OperationKey.Operation],
                OperationKey.OperationStatus: r.row[OperationKey.OperationStatus],
                OperationKey.CreatedTime: r.row[OperationKey.CreatedTime].to_epoch_time(),
                OperationKey.CreatedBy: r.row[OperationKey.CreatedBy],
                OperationKey.UpdatedTime: r.row[OperationKey.UpdatedTime].to_epoch_time(),
                OperationKey.CompletedTime: r.row[OperationKey.CompletedTime].to_epoch_time(),
                OperationKey.CustomerName: r.row[OperationKey.CustomerName],
                OperationKey.AgentsTotalCount: r.row[OperationKey.AgentsTotalCount],
                OperationKey.AgentsPendingResultsCount: r.row[OperationKey.AgentsPendingResultsCount],
                OperationKey.AgentsPendingPickUpCount: r.row[OperationKey.AgentsPendingPickUpCount],
                OperationKey.AgentsFailedCount: r.row[OperationKey.AgentsFailedCount],
                OperationKey.AgentsCompletedCount: r.row[OperationKey.AgentsCompletedCount],
                OperationKey.AgentsCompletedWithErrorsCount: r.row[OperationKey.AgentsCompletedWithErrorsCount],
                "agents": (
                    r
                    .table(OperationsPerAgentCollection)
                    .get_all(
                        r.row[OperationKey.OperationId],
                        index=OperationPerAgentIndexes.OperationId
                    )
                    .coerce_to('array')
                    .eq_join(OperationPerAgentKey.AgentId, r.table(AgentsCollection))
                    .zip()
                    .map(lambda x:
                        {
                            OperationPerAgentKey.PickedUpTime: x[OperationPerAgentKey.PickedUpTime].to_epoch_time(),
                            OperationPerAgentKey.CompletedTime: x[OperationPerAgentKey.CompletedTime].to_epoch_time(),
                            OperationPerAgentKey.AppsTotalCount: x[OperationPerAgentKey.AppsTotalCount],
                            OperationPerAgentKey.AppsPendingCount: x[OperationPerAgentKey.AppsPendingCount],
                            OperationPerAgentKey.AppsFailedCount: x[OperationPerAgentKey.AppsFailedCount],
                            OperationPerAgentKey.AppsCompletedCount: x[OperationPerAgentKey.AppsCompletedCount],
                            OperationPerAgentKey.Errors: x[OperationPerAgentKey.Errors],
                            OperationPerAgentKey.Status: x[OperationPerAgentKey.Status],
                            OperationPerAgentKey.AgentId: x[OperationPerAgentKey.AgentId],
                            AgentKey.ComputerName: x[AgentKey.ComputerName],
                            AgentKey.DisplayName: x[AgentKey.DisplayName],
                            "applications": (
                                r
                                .table(OperationsPerAppCollection)
                                .get_all(
                                    [
                                        x[OperationKey.OperationId],
                                        x[OperationPerAgentKey.AgentId]
                                    ],
                                    index=OperationPerAppIndexes.OperationIdAndAgentId
                                )
                                .coerce_to('array')
                                .map(lambda y:
                                    {
                                        OperationPerAppKey.AppId: y[OperationPerAppKey.AppId],
                                        OperationPerAppKey.AppName: y[OperationPerAppKey.AppName],
                                        OperationPerAppKey.Results: y[OperationPerAppKey.Results],
                                        OperationPerAppKey.Errors: y[OperationPerAppKey.Errors],
                                        OperationPerAppKey.ResultsReceivedTime: y[OperationPerAppKey.ResultsReceivedTime].to_epoch_time()
                                    }
                                )
                            )
                        }
                    )
                )
            }
        )
        try:
            operations = list(
                r
                .table(OperationsCollection)
                .get_all(
                    oper_id,
                    index=OperationIndexes.OperationId
                )
                .pluck(pluck_list)
                .map(map_list)
                .run(conn)
            )
            if operations:
                operations = operations[0]

            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(operations, 1)
            )
            logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('Operations Query', 'Operations', e)
            )
            logger.exception(results)

        return(results)

    @db_create_close
    def get_operation_by_id(self, oper_id, conn=None):
        pluck_list = (
            [
                OperationKey.OperationId,
                OperationKey.Operation,
                OperationKey.OperationStatus,
                OperationKey.CreatedTime,
                OperationKey.CreatedBy,
                OperationKey.UpdatedTime,
                OperationKey.CompletedTime,
                OperationKey.CustomerName,
                OperationKey.AgentsTotalCount,
                OperationKey.AgentsPendingResultsCount,
                OperationKey.AgentsPendingPickUpCount,
                OperationKey.AgentsFailedCount,
                OperationKey.AgentsCompletedCount,
                OperationKey.AgentsCompletedWithErrorsCount,
                OperationPerAgentKey.PickedUpTime,
                OperationPerAgentKey.CompletedTime,
                OperationPerAgentKey.Errors,
                OperationPerAgentKey.Status,
                OperationPerAgentKey.AgentId,
                AgentKey.ComputerName,
                AgentKey.DisplayName,
            ]
        )
        map_list = (
            {
                OperationKey.OperationId: r.row[OperationKey.OperationId],
                OperationKey.Operation: r.row[OperationKey.Operation],
                OperationKey.OperationStatus: r.row[OperationKey.OperationStatus],
                OperationKey.CreatedTime: r.row[OperationKey.CreatedTime].to_epoch_time(),
                OperationKey.CreatedBy: r.row[OperationKey.CreatedBy],
                OperationKey.UpdatedTime: r.row[OperationKey.UpdatedTime].to_epoch_time(),
                OperationKey.CompletedTime: r.row[OperationKey.CompletedTime].to_epoch_time(),
                OperationKey.CustomerName: r.row[OperationKey.CustomerName],
                OperationKey.AgentsTotalCount: r.row[OperationKey.AgentsTotalCount],
                OperationKey.AgentsPendingResultsCount: r.row[OperationKey.AgentsPendingResultsCount],
                OperationKey.AgentsPendingPickUpCount: r.row[OperationKey.AgentsPendingPickUpCount],
                OperationKey.AgentsFailedCount: r.row[OperationKey.AgentsFailedCount],
                OperationKey.AgentsCompletedCount: r.row[OperationKey.AgentsCompletedCount],
                OperationKey.AgentsCompletedWithErrorsCount: r.row[OperationKey.AgentsCompletedWithErrorsCount],
                "agents": (
                    r
                    .table(OperationsPerAgentCollection)
                    .get_all(
                        r.row[OperationKey.OperationId],
                        index=OperationPerAgentIndexes.OperationId
                    )
                    .coerce_to('array')
                    .eq_join(OperationPerAgentKey.AgentId, r.table(AgentsCollection))
                    .zip()
                    .map(lambda x:
                        {
                            OperationPerAgentKey.PickedUpTime: x[OperationPerAgentKey.PickedUpTime].to_epoch_time(),
                            OperationPerAgentKey.CompletedTime: x[OperationPerAgentKey.CompletedTime].to_epoch_time(),
                            OperationPerAgentKey.Errors: x[OperationPerAgentKey.Errors],
                            OperationPerAgentKey.Status: x[OperationPerAgentKey.Status],
                            OperationPerAgentKey.AgentId: x[OperationPerAgentKey.AgentId],
                            AgentKey.ComputerName: x[AgentKey.ComputerName],
                            AgentKey.DisplayName: x[AgentKey.DisplayName],
                        }
                    )
                )
            }
        )

        try:
            operations = list(
                r
                .table(OperationsCollection)
                .get_all(
                    oper_id,
                    index=OperationIndexes.OperationId
                )
                .pluck(pluck_list)
                .map(map_list)
                .run(conn)
            )
            if operations:
                operations = operations[0]

            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(operations, 1)
            )
            logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('Operations Query', 'Operations', e)
            )
            logger.exception(results)

        return(results)


    @db_create_close
    def get_install_operation_for_email_alert(self, oper_id, conn=None):
        pluck_list = (
            [
                OperationKey.OperationId,
                OperationKey.OperationStatus,
                OperationKey.CreatedTime,
                OperationKey.CreatedBy,
                OperationKey.UpdatedTime,
                OperationKey.CompletedTime,
                OperationKey.CustomerName,
                OperationPerAgentKey.PickedUpTime,
                OperationPerAgentKey.CompletedTime,
                OperationPerAgentKey.Errors,
                OperationPerAgentKey.AgentId,
                AgentKey.ComputerName,
                AgentKey.DisplayName,
                OperationPerAppKey.AppName,
                OperationPerAppKey.Results,
                OperationPerAppKey.ResultsReceivedTime,
            ]
        )
        map_list = (
            {
                OperationKey.OperationStatus: r.row[OperationKey.OperationStatus],
                OperationKey.CreatedTime: r.row[OperationKey.CreatedTime].to_iso8601(),
                OperationKey.CreatedBy: r.row[OperationKey.CreatedBy],
                OperationKey.UpdatedTime: r.row[OperationKey.UpdatedTime].to_iso8601(),
                OperationKey.CompletedTime: r.row[OperationKey.CompletedTime].to_iso8601(),
                OperationKey.CustomerName: r.row[OperationKey.CustomerName],
                "agents": (
                    r
                    .table(OperationsPerAgentCollection)
                    .get_all(
                        r.row[OperationKey.OperationId],
                        index=OperationPerAgentIndexes.OperationId
                    )
                    .coerce_to('array')
                    .eq_join(OperationPerAgentKey.AgentId, r.table(AgentsCollection))
                    .zip()
                    .map(lambda x:
                        {
                            OperationPerAgentKey.PickedUpTime: x[OperationPerAgentKey.PickedUpTime].to_iso8601(),
                            OperationPerAgentKey.CompletedTime: x[OperationPerAgentKey.CompletedTime].to_iso8601(),
                            OperationPerAgentKey.Errors: x[OperationPerAgentKey.Errors],
                            OperationPerAgentKey.AgentId: x[OperationPerAgentKey.AgentId],
                            AgentKey.ComputerName: x[AgentKey.ComputerName],
                            AgentKey.DisplayName: x[AgentKey.DisplayName],
                            "applications_failed": (
                                r
                                .table(OperationsPerAppCollection)
                                .get_all(
                                    [
                                        x[OperationKey.OperationId],
                                        x[OperationPerAgentKey.AgentId]
                                    ],
                                    index=OperationPerAppIndexes.OperationIdAndAgentId
                                )
                                .filter(lambda y: y[OperationPerAppKey.Results] == OperationCodes.ResultsReceivedWithErrors)
                                .coerce_to('array')
                                .map(lambda y:
                                    {
                                        OperationPerAppKey.AppName: y[OperationPerAppKey.AppName],
                                        OperationPerAppKey.Errors: y[OperationPerAppKey.Errors],
                                        OperationPerAppKey.ResultsReceivedTime: y[OperationPerAppKey.ResultsReceivedTime].to_iso8601()
                                    }
                                )
                            ),
                            "applications_passed": (
                                r
                                .table(OperationsPerAppCollection)
                                .get_all(
                                    [
                                        x[OperationKey.OperationId],
                                        x[OperationPerAgentKey.AgentId]
                                    ],
                                    index=OperationPerAppIndexes.OperationIdAndAgentId
                                )
                                .filter(lambda y: y[OperationPerAppKey.Results] == OperationCodes.ResultsReceived)
                                .coerce_to('array')
                                .map(lambda y:
                                    {
                                        OperationPerAppKey.AppName: y[OperationPerAppKey.AppName],
                                        OperationPerAppKey.Errors: y[OperationPerAppKey.Errors],
                                        OperationPerAppKey.ResultsReceivedTime: y[OperationPerAppKey.ResultsReceivedTime].to_iso8601()
                                    }
                                )
                            )
                        }
                    )
                )
            }
        )
        try:
            operations = list(
                r
                .table(OperationsCollection)
                .get_all(
                    oper_id,
                    index=OperationIndexes.OperationId
                )
                .pluck(pluck_list)
                .map(map_list)
                .run(conn)
            )
            if operations:
                operations = operations[0]

        except Exception as e:
            logger.exception(e)
            operations = None

        return(operations)


    @db_create_close
    def get_base_operation_for_email_alert(self, oper_id, conn=None):
        pluck_list = (
            [
                OperationKey.OperationId,
                OperationKey.Operation,
                OperationKey.OperationStatus,
                OperationKey.CreatedTime,
                OperationKey.CreatedBy,
                OperationKey.CompletedTime,
                OperationKey.CustomerName,
                OperationKey.AgentsTotalCount,
                OperationKey.AgentsFailedCount,
                OperationKey.AgentsCompletedCount,
                OperationKey.AgentsCompletedWithErrorsCount,
                OperationPerAgentKey.PickedUpTime,
                OperationPerAgentKey.CompletedTime,
                OperationPerAgentKey.Errors,
                OperationPerAgentKey.Status,
                OperationPerAgentKey.AgentId,
                AgentKey.ComputerName,
                AgentKey.DisplayName,
            ]
        )
        map_list = (
            {
                OperationKey.OperationId: r.row[OperationKey.OperationId],
                OperationKey.Operation: r.row[OperationKey.Operation],
                OperationKey.OperationStatus: r.row[OperationKey.OperationStatus],
                OperationKey.CreatedTime: r.row[OperationKey.CreatedTime].to_epoch_time(),
                OperationKey.CreatedBy: r.row[OperationKey.CreatedBy],
                OperationKey.CompletedTime: r.row[OperationKey.CompletedTime].to_epoch_time(),
                OperationKey.CustomerName: r.row[OperationKey.CustomerName],
                OperationKey.AgentsTotalCount: r.row[OperationKey.AgentsTotalCount],
                OperationKey.AgentsFailedCount: r.row[OperationKey.AgentsFailedCount],
                OperationKey.AgentsCompletedCount: r.row[OperationKey.AgentsCompletedCount],
                OperationKey.AgentsCompletedWithErrorsCount: r.row[OperationKey.AgentsCompletedWithErrorsCount],
                "agents": (
                    r
                    .table(OperationsPerAgentCollection)
                    .get_all(
                        r.row[OperationKey.OperationId],
                        index=OperationPerAgentIndexes.OperationId
                    )
                    .coerce_to('array')
                    .eq_join(OperationPerAgentKey.AgentId, r.table(AgentsCollection))
                    .zip()
                    .map(lambda x:
                        {
                            OperationPerAgentKey.PickedUpTime: x[OperationPerAgentKey.PickedUpTime].to_epoch_time(),
                            OperationPerAgentKey.CompletedTime: x[OperationPerAgentKey.CompletedTime].to_epoch_time(),
                            OperationPerAgentKey.Errors: x[OperationPerAgentKey.Errors],
                            OperationPerAgentKey.Status: x[OperationPerAgentKey.Status],
                            AgentKey.ComputerName: x[AgentKey.ComputerName],
                            AgentKey.DisplayName: x[AgentKey.DisplayName],
                        }
                    )
                )
            }
        )

        try:
            operations = list(
                r
                .table(OperationsCollection)
                .get_all(
                    oper_id,
                    index=OperationIndexes.OperationId
                )
                .pluck(pluck_list)
                .map(map_list)
                .run(conn)
            )
            if operations:
                operations = operations[0]

            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(operations, 1)
            )
            logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('Operations Query', 'Operations', e)
            )
            logger.exception(results)

        return(results)


