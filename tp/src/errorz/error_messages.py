from errorz.status_codes import *
from agent import *

status = 'http_status'
code = 'rv_status_code'
uri = 'uri'
method = 'http_method'
message = 'message'
data = 'data'
count = 'count'
operation = 'operation'
operation_id = 'operation_id'
agent_id = 'agent_id'
new_agent = 'new_agent_id'
check_in = 'check_in'


class GenericResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def information_retrieved(self, retrieved_data=[], total_count=0):
        return(
            {
                status: 200,
                code: GenericCodes.InformationRetrieved,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - data was retrieved' % (self.username)
                ),
                data: retrieved_data,
                count: total_count,
            }
        )

    def file_uploaded(self, pkg_file, retrieved_data=[]):
        return(
            {
                status: 200,
                code: GenericCodes.FileUploaded,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - file %s was uploaded' % (self.username, pkg_file)
                ),
                data: retrieved_data,
            }
        )

    def file_failed_to_upload(self, pkg_file, error):
        return(
            {
                status: 500,
                code: GenericCodes.FileFailedToUpload,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - file %s failed to upload: %s' % (self.username, pkg_file, error)
                )
            }
        )

    def file_doesnt_exist(self, pkg_file, error):
        return(
            {
                status: 409,
                code: GenericCodes.FileDoesntExist,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - file %s doesnt exists' % (self.username, pkg_file)
                )
            }
        )

    def incorrect_arguments(self):
        return(
            {
                status: 404,
                code: GenericCodes.IncorrectArguments,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Incorrect Arguments Passed' % (self.username)
                ),
            }
        )

    def invalid_filter(self, fkey):
        return(
            {
                status: 404,
                code: GenericCodes.InvaildFilter,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid Filter Passed: %s' % (self.username, fkey)
                ),
            }
        )

    def db_down(self):
        return(
            {
                status: 500,
                code: DbCodes.Down,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - failed to retreive information: DB HAS ISSUES!!!'
                    % (self.username)
                )
            }
        )

    def update_failed(self, object_id, object_type):
        return(
            {
                status: 500,
                code: GenericCodes.UpdateFailed,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s %s failed to update'
                    % (self.username, object_type, object_id)
                )
            }
        )

    def something_broke(self, object_id, object_type, error):
        return(
            {
                status: 500,
                code: GenericCodes.SomethingBroke,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s %s broke: %s'
                    % (self.username, object_type, object_id, error)
                )
            }
        )

    def object_updated(self, object_id, object_type, object_data=[]):
        return(
            {
                status: 200,
                code: GenericCodes.ObjectUpdated,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s %s was updated'
                    % (self.username, object_type, object_id)
                ),
                data: object_data
            }
        )

    def object_created(self, object_id, object_type, object_data):
        return(
            {
                status: 200,
                code: GenericCodes.ObjectUpdated,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s %s was created'
                    % (self.username, object_type, object_id)
                ),
                data: object_data
            }
        )

    def object_deleted(self, object_id, object_type):
        return(
            {
                status: 200,
                code: GenericCodes.ObjectDeleted,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s %s was deleted'
                    % (self.username, object_type, object_id)
                ),
            }
        )

    def object_exists(self, object_id, object_type):
        return(
            {
                status: 200,
                code: GenericCodes.ObjectExists,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s %s already exists'
                    % (self.username, object_type, object_id)
                ),
            }
        )

    def does_not_exists(self, object_id, object_type):
        return(
            {
                status: 409,
                code: GenericCodes.DoesNotExists,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s %s does not exist'
                    % (self.username, object_type, object_id)
                )
            }
        )

    def could_not_be_deleted(self, object_id, object_type):
        return(
            {
                status: 500,
                code: GenericCodes.CouldNotBeDeleted,
                method: self.uri,
                message: (
                    '%s - %s %s could not be deleted, %s'
                    % (
                        self.username, object_type,
                        object_id, self.contact_support
                        )
                    )
            }
        )

    def invalid_id(self, object_id, object_type):
        return(
            {
                status: 404,
                code: GenericCodes.InvalidId,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s %s does not exist'
                    % (self.username, object_type, object_id)
                )
            }
        )



class AgentResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def new_agent(self, agent_id, agent_data):
        return(
            {
                status: 200,
                code: AgentCodes.NewAgent,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - operation new_agent succeeded for agent_id %s '
                    % (self.username, agent_id)
                ),
                data: agent_data
            }
        )

    def new_agent_failed(self):
        return(
            {
                status: 500,
                code: AgentCodes.NewAgentFailed,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - operation new_agent failed'
                    % (self.username)
                ),
            }
        )

    def startup(self, agent_id, agent_data):
        return(
            {
                status: 200,
                code: AgentCodes.Startup,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - operation startup succeeded for agent_id %s '
                    % (self.username, agent_id)
                ),
                data: agent_data
            }
        )

    def startup_failed(self):
        return(
            {
                status: 500,
                code: AgentCodes.StartupFailed,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - operation startup failed'
                    % (self.username)
                ),
            }
        )

    def ra_results(self, agent_id):
        return(
            {
                status: 200,
                code: AgentCodes.CheckIn,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - checkin succeeded for agent_id %s'
                    % (self.username, agent_id)
                ),
                data: []
            }
        )

    def check_in(self, agent_id, queue_data):
        return(
            {
                status: 200,
                code: AgentCodes.CheckIn,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - checkin succeeded for agent_id %s'
                    % (self.username, agent_id)
                ),
                data: queue_data
            }
        )

    def check_in_failed(self, agent_id):
        return(
            {
                status: 500,
                code: AgentCodes.CheckInFailed,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - checkin failed for agent_id %s'
                    % (self.username, agent_id)
                ),
            }
        )


class TagResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def tag_created_and_agent_added(self, tag_name, agent_id, tag_data=None):
        return(
            {
                status: 200,
                code: TagCodes.TagCreatedAndAgentAdded,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - tag %s was created and agent_id %s was added'
                    % (self.username, tag_name, agent_id)
                ),
                data: tag_data
            }
        )

    def tag_exists_and_agent_added(self, tag_id, agent_id, tag_data=None):
        return(
            {
                status: 200,
                code: TagCodes.TagExistsAndAgentAdded,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - tag %s exists and agent_id %s was added'
                    % (self.username, tag_id, agent_id)
                ),
                data: tag_data
            }
        )

    def removed_tag_from_agent(self, tag_id, agent_id):
        return(
            {
                status: 200,
                code: TagCodes.RemovedAgentIdFromTag,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s was removed from tag_id %s'
                    % (self.username, agent_id, tag_id)
                ),
            }
        )

    def removed_agent_from_tag(self, agent_id, tag_id):
        return(
            {
                status: 200,
                code: TagCodes.RemovedTagFromAgentId,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - %s was removed from agent_id %s'
                    % (self.username, tag_id, agent_id)
                ),
            }
        )

    def removed_all_agents_from_tag(self, tag_id):
        return(
            {
                status: 200,
                code: TagCodes.RemovedAllAgentsFromTag,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - all agents were removed from tag_id %s'
                    % (self.username, tag_id)
                ),
            }
        )

    def failed_to_remove_all_agents_from_tag(self, tag_id):
        return(
            {
                status: 409,
                code: TagCodes.FailedToRemoveAllAgentsFromTag,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - failed to remove all of the agents from tag_id %s'
                    % (self.username, tag_id)
                ),
            }
        )

    def failed_to_remove_tag(self, tag_id):
        return(
            {
                status: 409,
                code: TagCodes.FailedToRemoveTag,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - failed to remove all of the agents from tag_id %s'
                    % (self.username, tag_id)
                ),
            }
        )


class PackageResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def invalid_status(self, app_id, status):
        return(
            {
                status: 404,
                code: PackageCodes.InvalidStatus,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid status %s for app_id %s'
                    % (self.username, status, app_id)
                )
            }
        )

    def invalid_global_status(self, status):
        return(
            {
                status: 404,
                code: PackageCodes.InvalidStatus,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid status %s'
                    % (self.username, status)
                )
            }
        )


    def invalid_package_id(self, app_id):
        return(
            {
                status: 404,
                code: PackageCodes.InvalidPackageId,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid app_id %s'
                    % (self.username, app_id)
                )
            }
        )

    def invalid_severity(self, severity):
        return(
            {
                status: 404,
                code: PackageCodes.InvalidSeverity,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid severity %s'
                    % (self.username, severity)
                )
            }
        )

    def toggle_hidden(self, appids_data, toggle):
        return(
            {
                status: 200,
                code: PackageCodes.ToggleHiddenSuccessful,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Toggle Hidden status (%s) on appids %s'
                    % (self.username, toggle, appids_data)
                )
            }
        )

    def package_deleted(self, app_id):
        return(
            {
                status: 200,
                code: PackageCodes.PackageDeleted,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - app_id %s deleted'
                    % (self.username, app_id)
                )
            }
        )

    def packages_deleted(self, app_ids, pass_count, failed_count):
        return(
            {
                status: 200,
                code: PackageCodes.PackageDeleted,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - app_ids %s deleted'
                    % (self.username, app_ids)
                ),
                data: {'succeeded': pass_count, 'failed': failed_count}
            }
        )

    def package_deletion_failed(self, app_id):
        return(
            {
                status: 500,
                code: PackageCodes.PackageDeletionFailed,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - app_id %s failed to be deleted'
                    % (self.username, app_id)
                )
            }
        )


class OperationResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def operation_created(self, oper_id, oper_type, oper_data):
        return(
            {
                status: 200,
                code: OperationCodes.Created,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - operation %s created'
                    % (self.username, oper_type)
                ),
                data: oper_data
            }
        )

    def operation_updated(self, oper_id):
        return(
            {
                status: 200,
                code: OperationCodes.Updated,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - operation %s updated'
                    % (self.username, oper_id)
                ),
                data: []
            }
        )

    def invalid_operation_type(self, oper_type):
        return(
            {
                status: 404,
                code: OperationCodes.InvalidOperationType,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid operation type %s'
                    % (self.username, oper_type)
                ),
                data: []
            }
        )


class UpdateApplicationsResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def applications_updated(self, agent_id, app_data):
        return(
            {
                status: 200,
                code: UpdatesApplications.UpdatesApplications,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - app data received and being processed for %s'
                    % (self.username, agent_id)
                ),
                data: app_data,
            }
        )

    def applications_update_failed(self, agent_id):
        return(
            {
                status: 500,
                code: UpdatesApplications.UpdatesApplicationsFailed,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - failed t receive application data for %s'
                    % (self.username, agent_id)
                ),
            }
        )


class NotificationResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def notification_created(self, notif_data):
        return(
            {
                status: 200,
                code: NotificationCodes.NotificationDataValidated,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Notification created' % (self.username)
                ),
                data: notif_data
            }
        )

    def notification_data_validated(self, notif_data):
        return(
            {
                status: 200,
                code: NotificationCodes.NotificationDataValidated,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Notification Data Validated' % (self.username)
                ),
                data: notif_data
            }
        )

    def invalid_notification_type(self, notif_type):
        return(
            {
                status: 404,
                code: NotificationCodes.InvalidNotificationType,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid Notification Type: %s' %
                    (self.username, notif_type)
                ),
            }
        )

    def invalid_notification_threshold(self, threshold):
        return(
            {
                status: 404,
                code: NotificationCodes.InvalidNotificationThreshold,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid Notification Threshold: %s' %
                    (self.username, threshold)
                ),
            }
        )

    def invalid_notification_plugin(self, plugin):
        return(
            {
                status: 404,
                code: NotificationCodes.InvalidNotificationPlugin,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid Notification Plugin: %s' %
                    (self.username, plugin)
                ),
            }
        )


class SchedulerResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def created(self, job_name, job_data):
        return(
            {
                status: 200,
                code: SchedulerCodes.ScheduleCreated,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Schedule created: %s'
                    % (self.username, job_name)
                ),
                data: job_data,
            }
        )

    def removed(self, job_name):
        return(
            {
                status: 200,
                code: SchedulerCodes.ScheduleRemoved,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Scchedule removed: %s'
                    % (self.username, job_name)
                ),
            }
        )

    def remove_failed(self, job_name):
        return(
            {
                status: 500,
                code: SchedulerCodes.ScheduleRemovedFailed,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Scchedule %s failed to remove'
                    % (self.username, job_name)
                ),
            }
        )

    def invalid_schedule_name(self, job_name):
        return(
            {
                status: 404,
                code: SchedulerCodes.InvalidScheduleName,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Invalid Schedule %s'
                    % (self.username, job_name)
                ),
            }
        )

    def exists(self, job_name):
        return(
            {
                status: 409,
                code: SchedulerCodes.ScheduleExists,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Schedule name %s exists'
                    % (self.username, job_name)
                ),
            }
        )

class MightyMouseResults(object):
    def __init__(self, username, uri, method):
        self.uri = uri
        self.method = method
        self.username = username
        self.contact_support = 'please contact support'

    def created(self, mouse_name, mouse_data):
        return(
            {
                status: 200,
                code: MightyMouseCodes.MouseCreated,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Mouse created: %s'
                    % (self.username, mouse_name)
                ),
                data: mouse_data,
            }
        )

    def failed_to_create(self, mouse_name, msg):
        return(
            {
                status: 500,
                code: MightyMouseCodes.FailedToAddMouse,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - failed to add the RelayServer %s: %s'
                    % (self.username, mouse_name, msg)
                ),
            }
        )

    def updated(self, mouse_name, mouse_data):
        return(
            {
                status: 200,
                code: MightyMouseCodes.MouseUpdated,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Mouse updated: %s'
                    % (self.username, mouse_name)
                ),
                data: mouse_data,
            }
        )

    def failed_to_update(self, mouse_name, msg):
        return(
            {
                status: 500,
                code: MightyMouseCodes.FailedToUpdateMouse,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - failed to update the RelayServer %s: %s'
                    % (self.username, mouse_name, msg)
                ),
            }
        )

    def remove(self, mouse_name):
        return(
            {
                status: 200,
                code: MightyMouseCodes.MouseRemoved,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - RelayServer %s removed'
                    % (self.username, mouse_name)
                ),
            }
        )

    def failed_to_remove(self, mouse_name, msg):
        return(
            {
                status: 500,
                code: MightyMouseCodes.FailedToRemoveMouse,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - failed to remove the RelayServer %s: %s'
                    % (self.username, mouse_name, msg)
                ),
            }
        )

    def exist(self, mouse_name):
        return(
            {
                status: 200,
                code: MightyMouseCodes.MouseExist,
                uri: self.uri,
                method: self.method,
                message: (
                    '%s - Mouse already exist: %s'
                    % (self.username, mouse_name)
                ),
            }
        )
