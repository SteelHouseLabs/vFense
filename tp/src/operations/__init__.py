OperationsCollection = 'operations'
OperationsPerAgentCollection = 'operation_per_agent'
OperationsPerAppCollection = 'operation_per_app'

CHECKIN = 'checkin'
PICKEDUP = 'picked_up'
PENDINGPICKUP = 'pending_pick_up'
FAILED = 'completed_with_errors'
SUCCESS = 'completed_successfully'
DATA = "data"
AGENT = 'Agent'
TAG = 'Tag'

INSTALL_OS_APPS = 'install_os_apps'
INSTALL_CUSTOM_APPS = 'install_custom_apps'
INSTALL_SUPPORTED_APPS = 'install_supported_apps'
INSTALL_AGENT_UPDATE = 'install_agent_update'
INSTALL_AGENT_APPS = 'install_agent_update'
UNINSTALL = 'uninstall'
UNINSTALL_AGENT = 'uninstall_agent'
UPDATES_APPLICATIONS = 'updatesapplications'
REBOOT = 'reboot'
SHUTDOWN = 'shutdown'

RV_PLUGIN = 'rv'
CORE_PLUGIN = 'core'
RA_PLUGIN = 'ra'
MONITORING_PLUGIN = 'monitoring'

VALID_PLUGINS = (RV_PLUGIN, CORE_PLUGIN, RA_PLUGIN, MONITORING_PLUGIN)

VALID_OPERATIONS = (
    INSTALL_OS_APPS,
    INSTALL_CUSTOM_APPS,
    INSTALL_SUPPORTED_APPS,
    UNINSTALL,
    UNINSTALL_AGENT,
    REBOOT, SHUTDOWN,
    UPDATES_APPLICATIONS
)

class OperationKey():
    OperationId = 'operation_id'
    Operation = 'operation'
    OperationStatus = 'operation_status'
    CreatedTime = 'created_time'
    UpdatedTime = 'updated_time'
    CompletedTime = 'completed_time'
    CreatedBy = 'created_by'
    CustomerName = 'customer_name'
    AgentsTotalCount = 'agents_total_count'
    AgentsPendingResultsCount = 'agents_pending_results_count'
    AgentsPendingPickUpCount = 'agents_pending_pickup_count'
    AgentsFailedCount = 'agents_failed_count'
    AgentsCompletedCount = 'agents_completed_count'
    AgentsCompletedWithErrorsCount = 'agents_completed_with_errors_count'
    Applications = 'applications'
    Agents = 'agents'
    Restart = 'restart'
    TagId = 'tag_id'
    Plugin = 'plugin'
    CpuThrottle = 'cpu_throttle'
    NetThrottle = 'net_throttle'


class OperationIndexes():
    TagId = 'tag_id'
    CustomerName = 'customer_name'
    Operation = 'operation'
    OperationId = 'operation_id'
    OperationAndCustomer = 'operation_and_customer'
    PluginAndCustomer = 'plugin_and_customer'
    CreatedByAndCustomer = 'createdby_and_customer'


class OperationPerAgentKey():
    Id = 'id'
    AgentId = 'agent_id'
    TagId = 'tag_id'
    OperationId = 'operation_id'
    CustomerName = 'customer_name'
    Status = 'status'
    PickedUpTime = 'picked_up_time'
    CompletedTime = 'completed_time'
    AppsTotalCount = 'apps_total_count'
    AppsPendingCount = 'apps_pending_count'
    AppsFailedCount = 'apps_failed_count'
    AppsCompletedCount = 'apps_completed_count'
    Errors = 'errors'


class OperationPerAgentIndexes():
    OperationId = 'operation_id'
    AgentIdAndCustomer = 'agentid_and_customer'
    OperationIdAndAgentId = 'operationid_and_agentid'
    TagIdAndCustomer = 'tagid_and_customer'
    StatusAndCustomer = 'status_and_customer'


class OperationPerAppKey():
    Id = 'id'
    AgentId = 'agent_id'
    AppId = 'app_id'
    AppName = 'app_name'
    OperationId = 'operation_id'
    CustomerName = 'customer_name'
    Results = 'results'
    ResultsReceivedTime = 'results_received_time'
    Errors = 'errors'


class OperationPerAppIndexes():
    OperationId = 'operation_id'
    OperationIdAndAgentId = 'operationid_and_agentid'
    OperationIdAndAgentIdAndAppId = 'operationid_and_agentid_and_appid'
