from time import mktime
from datetime import datetime
import logging
import logging.config
from agent import *
from tagging import *
from db.client import db_create_close, r
from errorz.error_messages import GenericResults, NotificationResults
from operations import *
from notifications import *
from rv_exceptions.broken import *


logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class AlertSearcher(object):
    def __init__(self, username, customer_name, uri, method):
        self.username = username
        self.customer_name = customer_name
        self.uri = uri
        self.method = method
        self.map_list = (
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


    @db_create_close
    def get_notification(self, notification_id, conn=None):
        try:
            data = (
                r
                .table(NotificationCollections.Notifications)
                .get_all(notification_id)
                .map(self.map_list)
                .run(conn)
            )
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(data[0], len(data[0]))
            )
        except Exception as e:
            logger.exception(e)
            results = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(
                    notification_id,
                    'failed to get notifcation', e
                )
            )

        return(results)
