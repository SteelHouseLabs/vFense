import re
from operations import *

VALID_NOTIFICATION_PLUGINS = (RV_PLUGIN, MONITORING_PLUGIN)
INSTALL = 'install'
UNINSTALL = 'uninstall'
REBOOT = 'reboot'
SHUTDOWN = 'shutdown'
PASS = 'pass'
FAIL = 'fail'
CPU = 'cpu'
MEM = 'mem'
FS = 'filesystem'

VALID_RV_NOTIFICATIONS = (INSTALL, UNINSTALL, REBOOT, SHUTDOWN)
VALID_MONITORING_NOTIFICATIONS = (CPU, MEM, FS)
VALID_NOTIFICATIONS = VALID_RV_NOTIFICATIONS + VALID_MONITORING_NOTIFICATIONS
VALID_STATUSES_TO_ALERT_ON = (PASS, FAIL)


class NotificationCollections():
    Notifications = 'notifications'
    NotificationsHistory = 'notifications_history'
    NotificationPlugins = 'notification_plugins'


class NotificationKeys():
    NotificationId = 'notification_id'
    NotificationType = 'notification_type'
    RuleName = 'rule_name'
    RuleDescription = 'rule_description'
    CreatedBy = 'created_by'
    CreatedTime = 'created_time'
    ModifiedBy = 'modified_by'
    ModifiedTime = 'modified_time'
    Plugin = 'plugin'
    User = 'user'
    Group = 'group'
    AllAgents = 'all_agents'
    Agents = 'agents'
    Tags = 'tags'
    CustomerName = 'customer_name'
    AppThreshold = 'app_threshold'
    RebootThreshold = 'reboot_threshold'
    ShutdownThreshold = 'shutdown_threshold'
    CpuThreshold = 'cpu_threshold'
    MemThreshold = 'mem_threshold'
    FileSystemThreshold = 'filesystem_threshold'
    FileSystem = 'filesystem'


class NotificationIndexes():
    CustomerName = 'customer_name'
    RuleNameAndCustomer = 'rule_name_and_customer'
    NotificationTypeAndCustomer = 'notification_type_and_customer'
    AppThresholdAndCustomer = 'app_threshold_and_customer'
    RebootThresholdAndCustomer = 'reboot_threshold_and_customer'
    ShutdownThresholdAndCustomer = 'shutdown_threshold_and_customer'
    MemThresholdAndCustomer = 'mem_threshold_and_customer'
    CpuThresholdAndCustomer = 'cpu_threshold_and_customer'
    FileSystemThresholdAndFileSystemAndCustomer = (
        'fs_threshold_and_fs_and_customer'
    )


class NotificationHistoryKeys():
    Id = 'id'
    NotificationId = 'notification_id'
    AlertSent = 'alert_sent'
    AlertSentTime = 'alert_sent_time'


class NotificationHistoryIndexes():
    NotificationId = 'notification_id'


class NotificationPluginKeys():
    Id = 'id'
    CustomerName = 'customer_name'
    PluginName = 'plugin_name'
    CreatedTime = 'created_time'
    ModifiedTime = 'modified_time'
    CreatedBy = 'created_by'
    ModifiedBy = 'modified_by'
    UserName = 'username'
    Password = 'password'
    Server = 'server'
    Port = 'port'
    IsTls = 'is_tls'
    IsSsl = 'is_ssl'
    FromEmail = 'from_email'
    ToEmail = 'to_email'


class NotificationPluginIndexes():
    CustomerName = 'customer_name'


def return_notif_type_from_operation(oper_type):
    if re.search(r'^install', oper_type):
            oper_type = INSTALL

    elif re.search(r'^uninstall', oper_type):
        oper_type = UNINSTALL

    elif oper_type == REBOOT:
        oper_type = REBOOT

    elif oper_type == SHUTDOWN:
        oper_type = SHUTDOWN

    return(oper_type)

