#!/usr/bin/env python
from copy import deepcopy
from time import mktime
from datetime import datetime
import logging
from agent import *
from tagging import *
from datetime import datetime
from db.client import db_create_close, r
from errorz.error_messages import GenericResults, NotificationResults
from operations import *
from notifications import *
from rv_exceptions.broken import *

from server.hierarchy import Collection, GroupKey, UserKey, CustomerKey

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


@db_create_close
def notification_rule_exists(rule_id, conn=None):
    try:
        rule_exists = (
            r
            .table(NotificationCollections.Notifications)
            .get(rule_id)
            .run(conn)
        )

    except Exception as e:
        rule_exists = None
        logger.error(e)

    return(rule_exists)


@db_create_close
def get_all_notifications(username, customer_name,
                          uri, method, conn=None):
    map_list = (
        {
            NotificationKeys.NotificationId: r.row[NotificationKeys.NotificationId],
            NotificationKeys.NotificationType: r.row[NotificationKeys.NotificationType],
            NotificationKeys.RuleName: r.row[NotificationKeys.RuleName],
            NotificationKeys.RuleDescription: r.row[NotificationKeys.RuleDescription],
            NotificationKeys.CreatedBy: r.row[NotificationKeys.CreatedBy],
            NotificationKeys.CreatedTime: r.row[NotificationKeys.CreatedTime].to_epoch_time(),
            NotificationKeys.ModifiedBy: r.row[NotificationKeys.ModifiedBy],
            NotificationKeys.ModifiedTime: r.row[NotificationKeys.ModifiedTime].to_epoch_time(),
            NotificationKeys.Plugin: r.row[NotificationKeys.Plugin],
            NotificationKeys.User: r.row[NotificationKeys.User],
            NotificationKeys.Group: r.row[NotificationKeys.Group],
            NotificationKeys.AllAgents: r.row[NotificationKeys.AllAgents],
            NotificationKeys.Agents: r.row[NotificationKeys.Agents],
            NotificationKeys.Tags: r.row[NotificationKeys.Tags],
            NotificationKeys.CustomerName: r.row[NotificationKeys.CustomerName],
            NotificationKeys.AppThreshold: r.row[NotificationKeys.AppThreshold],
            NotificationKeys.RebootThreshold: r.row[NotificationKeys.RebootThreshold],
            NotificationKeys.ShutdownThreshold: r.row[NotificationKeys.ShutdownThreshold],
            NotificationKeys.CpuThreshold: r.row[NotificationKeys.CpuThreshold],
            NotificationKeys.MemThreshold: r.row[NotificationKeys.MemThreshold],
            NotificationKeys.FileSystemThreshold: r.row[NotificationKeys.FileSystemThreshold],
            NotificationKeys.FileSystem: r.row[NotificationKeys.FileSystem],
        }
    )
    try:
        data = list(
            r
            .table(NotificationCollections.Notifications)
            .get_all(customer_name, index=NotificationIndexes.CustomerName)
            .map(map_list)
            .run(conn)
        )
        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

    except Exception as e:
        logger.exception(e)
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('notifications', 'retrieve notification', e)
        )

    return(results)


@db_create_close
def get_valid_fields(username, customer_name,
                     uri, method, conn=None):
    try:
        agents = list(
            r
            .table(AgentsCollection)
            .get_all(customer_name, index=AgentKey.CustomerName)
            .pluck(AgentKey.AgentId, AgentKey.ComputerName)
            .run(conn)
        )
        tags = list(
            r
            .table(TagsCollection)
            .get_all(customer_name, index=TagsIndexes.CustomerName)
            .pluck(TagsKey.TagId, TagsKey.TagName)
            .run(conn)
        )
        users = list(
            r
            .table(Collection.Users)
            .pluck(UserKey.UserName)
            .run(conn)
        )
        groups = list(
            r
            .table(Collection.Groups)
            .get_all(customer_name, index=GroupKey.CustomerId)
            .pluck(GroupKey.GroupName)
            .run(conn)
        )
        customers = list(
            r
            .table(Collection.Customers)
            .pluck(CustomerKey.CustomerName)
            .run(conn)
        )
        data = {
            'tags': tags,
            'agents': agents,
            'users': users,
            'groups': groups,
            'customers': customers,
            'plugins': VALID_NOTIFICATION_PLUGINS,
            'rv_operation_types': VALID_RV_NOTIFICATIONS,
            'rv_thresholds': VALID_STATUSES_TO_ALERT_ON,
            'monitoring_operation_types': VALID_MONITORING_NOTIFICATIONS,
        }

        results = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, 1)
        )

    except Exception as e:
        logger.exception(e)
        results = (
            GenericResults(
                username, uri, method
            ).something_broke('Get Notification Fields', 'Notifications', e)
        )

    return(results)


class Notifier():

    def __init__(self, username, customer_name, uri, method):

        self.username = username
        self.customer_name = customer_name
        self.uri = uri
        self.method = method
        self.now = mktime(datetime.now().timetuple())

    @db_create_close
    def delete_alerting_rule(self, rule_id, conn=None):

        try:
            (
                r
                .table(NotificationCollections.Notifications)
                .get(rule_id)
                .delete()
                .run(conn)
            )
            (
                r
                .table(NotificationCollections.NotificationsHistory)
                .get_all(
                    rule_id,
                    index=NotificationHistoryIndexes.NotificationId)
                .delete()
                .run(conn)
            )

            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).object_deleted(rule_id, 'notification')
            )
        except Exception as e:
            logger.exception(e)
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(rule_id, 'Notification Deleted', e)
            )

        return(results)

    def create_install_alerting_rule(self, **kwargs):
        rule_data = self.__populate_data(kwargs)
        results = self.create_alerting_rule(rule_data)
        return(results)

    def create_uninstall_alerting_rule(self, **kwargs):
        rule_data = self.__populate_data(kwargs)
        results = self.create_alerting_rule(rule_data)
        return(results)

    def create_reboot_alerting_rule(self, **kwargs):
        rule_data = self.__populate_data(kwargs)
        results = self.create_alerting_rule(rule_data)
        return(results)

    def create_shutdown_alerting_rule(self, **kwargs):
        rule_data = self.__populate_data(kwargs)
        results = self.create_alerting_rule(rule_data)
        return(results)

    def create_cpu_alerting_rule(self, **kwargs):
        rule_data = self.__populate_data(kwargs)
        results = self.create_alerting_rule(rule_data)
        return(results)

    def create_mem_alerting_rule(self, **kwargs):
        rule_data = self.__populate_data(kwargs)
        results = self.create_alerting_rule(rule_data)
        return(results)

    def create_filesystem_alerting_rule(self, **kwargs):
        rule_data = self.__populate_data(kwargs)
        results = self.create_alerting_rule(rule_data)
        return(results)

    @db_create_close
    def create_alerting_rule(self, data, conn=None):
        try:
            data_validated = self.__validate_data(data)
            data_validated['data'].pop(NotificationKeys.NotificationId, None)
            if data_validated['http_status'] == 200:
                added = (
                    r
                    .table(NotificationCollections.Notifications)
                    .insert(data_validated['data'])
                    .run(conn)
                )
                if 'inserted' in added:
                    notification_id = added.get('generated_keys')[0]
                    data_validated['data'][NotificationKeys.CreatedTime] = self.now
                    data_validated['data'][NotificationKeys.ModifiedTime] = self.now
                    data_validated['data'][NotificationKeys.NotificationId] = notification_id
                    results = (
                        NotificationResults(
                            self.username, self.uri, self.method
                        ).notification_created(data_validated['data'])
                    )
            else:
                return(data_validated)

        except Exception as e:
            logger.exception(e)
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    'Failed to create Notification Rule',
                    'Notification', e
                )
            )

        return(results)

    def __validate_data(self, data):
        try:
            if data[NotificationKeys.Agents]:
                is_valid, agent_id = (
                    self.__validate_agent_ids(
                        data[NotificationKeys.Agents]
                        )
                    )

                if not is_valid and agent_id:
                    return(
                        GenericResults(
                            self.username, self.uri, self.method
                        ).invalid_id(agent_id, 'agent_id')
                    )

            if data[NotificationKeys.Tags]:
                is_valid, tag_id = (
                    self.__validate_tag_ids(
                        data[NotificationKeys.Tags]
                        )
                    )

                if not is_valid and tag_id:
                    return(
                        GenericResults(
                            self.username, self.uri, self.method
                        ).invalid_id(tag_id, 'tag_id')
                    )

            if (not data[NotificationKeys.NotificationType] in
                    VALID_NOTIFICATIONS):

                return(
                    NotificationResults(
                        self.username, self.uri, self.method
                    ).invalid_notification_type(
                        data[NotificationKeys.NotificationType]
                    )
                )

            if data[NotificationKeys.AppThreshold]:
                if (not data[NotificationKeys.AppThreshold] in
                        VALID_STATUSES_TO_ALERT_ON):
                    return(
                        NotificationResults(
                            self.username, self.uri, self.method
                        ).invalid_notification_threshold(
                            data[NotificationKeys.AppThreshold]
                        )
                    )
            if data[NotificationKeys.RebootThreshold]:
                if (not data[NotificationKeys.RebootThreshold] in
                        VALID_STATUSES_TO_ALERT_ON):
                    return(
                        NotificationResults(
                            self.username, self.uri, self.method
                        ).invalid_notification_threshold(
                            data[NotificationKeys.RebootThreshold]
                        )
                    )
            if data[NotificationKeys.ShutdownThreshold]:
                if (not data[NotificationKeys.ShutdownThreshold] in
                        VALID_STATUSES_TO_ALERT_ON):
                    return(
                        NotificationResults(
                            self.username, self.uri, self.method
                        ).invalid_notification_threshold(
                            data[NotificationKeys.ShutdownThreshold]
                        )
                    )
            if data[NotificationKeys.CpuThreshold]:
                data[NotificationKeys.CpuThreshold] = (
                    int(data[NotificationKeys.CpuThreshold])
                )

            if data[NotificationKeys.MemThreshold]:
                data[NotificationKeys.MemThreshold] = (
                    int(data[NotificationKeys.MemThreshold])
                )

            if data[NotificationKeys.FileSystemThreshold]:
                data[NotificationKeys.FileSystemThreshold] = (
                    int(data[NotificationKeys.FileSystemThreshold])
                )

            if (not data[NotificationKeys.Plugin] in
                    VALID_NOTIFICATION_PLUGINS):

                return(
                    NotificationResults(
                        self.username, self.uri, self.method
                    ).invalid_notification_plugin(
                        data[NotificationKeys.Plugin]
                    )
                )

        except Exception as e:
            logger.exception(e)
            return(
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    'invalid notification data',
                    'notification', e
                )
            )

        return(
            NotificationResults(
                self.username, self.uri, self.method
            ).notification_data_validated(data)
        )

    @db_create_close
    def modify_alerting_rule(self, conn=None, **kwargs):
        try:
            data = self.__populate_data(kwargs)
            data_validated = self.__validate_data(data)
            rule_exists = (
                notification_rule_exists(
                    data_validated['data'][NotificationKeys.NotificationId]
                )
            )
            if rule_exists and data_validated['http_status'] == 200:
                (
                    r
                    .table(NotificationCollections.Notifications)
                    .replace(data_validated['data'])
                    .run(conn)
                )

                data_validated['data'][NotificationKeys.CreatedTime] = self.now
                data_validated['data'][NotificationKeys.ModifiedTime] = self.now
                results = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).object_updated(
                        data[NotificationKeys.NotificationId],
                        NotificationKeys.NotificationId, data_validated['data']
                    )
                )
            else:
                results = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(
                        data[NotificationKeys.NotificationId],
                        NotificationKeys.NotificationId
                    )
                )

        except Exception as e:
            logger.exception(e)
            return(
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    'Failed to update notification',
                    'notification', e
                )
            )

        return(results)

    @db_create_close
    def __validate_agent_ids(self, agent_ids):
        try:
            for agent_id in agent_ids:
                valid = (
                    r
                    .table(AgentsCollection)
                    .get(x)
                    .pluck(AgentKey.AgentId)
                    .run(conn)
                )
                if not valid:
                    return(False, agent_id)

        except Exception as e:
            logger.exception(e)

        return(True, None)


    @db_create_close
    def __validate_tag_ids(self, tag_ids):
        try:
            for tag_id in tag_ids:
                valid = (
                    r
                    .table(TagsCollection)
                    .get(x)
                    .pluck(TagsKey.TagId)
                    .run(conn)
                )
                if not valid:
                    return(False, tag_id)

        except Exception as e:
            logger.exception(e)

        return(True, None)

    def __populate_data(self, data):
        keys_in_collection = self.__get_all_keys()
        for key, val in keys_in_collection.items():
            if data.get(key, None):
                keys_in_collection[key] = data[key]

        return(keys_in_collection)

    def __get_all_keys(self):
        return(
            {
                NotificationKeys.NotificationId: None,
                NotificationKeys.NotificationType: None,
                NotificationKeys.RuleName: None,
                NotificationKeys.RuleDescription: None,
                NotificationKeys.CreatedBy: None,
                NotificationKeys.CreatedTime: r.epoch_time(self.now),
                NotificationKeys.ModifiedBy: None,
                NotificationKeys.ModifiedTime: r.epoch_time(self.now),
                NotificationKeys.Plugin: None,
                NotificationKeys.User: None,
                NotificationKeys.Group: None,
                NotificationKeys.AllAgents: 'false',
                NotificationKeys.Agents: [],
                NotificationKeys.Tags: [],
                NotificationKeys.CustomerName: None,
                NotificationKeys.AppThreshold: None,
                NotificationKeys.RebootThreshold: None,
                NotificationKeys.ShutdownThreshold: None,
                NotificationKeys.CpuThreshold: None,
                NotificationKeys.MemThreshold: None,
                NotificationKeys.FileSystemThreshold: None,
                NotificationKeys.FileSystem: None,
            }
        )
