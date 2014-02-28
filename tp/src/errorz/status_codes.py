class GenericCodes(object):
    InformationRetrieved = 1001
    CouldNotRetrieveInformation = 1002
    IncorrectArguments = 1003
    DoesNotExists = 1004
    CouldNotBeDeleted = 1005
    InvalidId = 1006
    InvalidFilter = 1007
    ObjectUpdated = 1008
    UpdateFailed = 1009
    ObjectCreated = 1010
    ObjectExists = 1011
    ObjectDeleted = 1012
    SomethingBroke = 1013
    FileUploaded = 1014
    FileFailedToUpload = 1015
    FileDoesntExist = 1016


class DbCodes(object):
    Down = 2000


class AgentCodes(object):
    NewAgent = 3001
    NewAgentFailed = 3002
    CheckIn = 3003
    CheckInFailed = 3004
    Startup = 3005
    StartupFailed = 3006
    InstallUpdateResults = 3007
    InstallSupportedAppResults = 3008
    InstallCustomAppResults = 3009
    InstallAgentAppResults = 3010


class TagCodes(object):
    TagCreatedAndAgentAdded = 4000
    RemovedAgentIdFromTag = 4001
    RemovedTagFromAgentId = 4002
    RemovedAllAgentsFromTag = 4003
    FailedToRemoveAllAgentsFromTag = 4004
    FailedToRemoveTag = 4005
    TagExistsAndAgentAdded = 4006


class PackageCodes(object):
    InvalidStatus = 5000
    InvalidPackageId = 5001
    InvalidFilter = 5002
    InvalidSeverity = 5003
    FileCompletedDownload = 5004
    FileIsDownloading = 5005
    FileNotRequired = 5006
    FilePendingDownload = 5007
    FileFailedDownload = 5008
    MissingUri = 5009
    InvalidUri = 5010
    HashNotVerified = 5011
    FileSizeMisMatch = 5012
    ThisIsNotAnUpdate = 5013
    ThisIsAnUpdate = 5014
    ToggleHiddenSuccessful = 5015
    AgentWillDownloadFromVendor = 5016
    PackageDeleted = 517
    PackagesDeletionFailed = 518


class OperationCodes(object):
    Created = 6000
    Updated = 6001
    #Apps Results Codes For Operations
    ResultsReceived = 6002
    ResultsReceivedWithErrors = 6003
    ResultsPending = 6004
    InvalidOperationType = 6005
    #Results Codes For Operations
    ResultsCompleted = 6006
    ResultsCompletedWithErrors = 6007
    ResultsCompletedFailed = 6008
    ResultsIncomplete = 6009


class UpdatesApplications(object):
    UpdatesApplications = 7000
    UpdatesApplicationsFailed = 7001


class NotificationCodes(object):
    InvalidNotificationType = 8000
    InvalidNotificationPlugin = 8001
    InvalidNotificationThreshold = 8002
    NotificationDataValidated = 8003


class SchedulerCodes(object):
    ScheduleCreated = 9000
    ScheduleUpdated = 9001
    FailedToCreateSchedule = 9002
    InvalidTimeStamp = 9003
    InvalidScheduleType = 9004
    ScheduleRemoved = 9005
    ScheduleRemovedFailed = 9006
    InvalidScheduleName = 9007
    ScheduleExists = 9008


class MightyMouseCodes(object):
    MouseCreated = 10000
    MouseUpdated = 10001
    MouseRemoved = 10002
    FailedToAddMouse = 10003
    FailedToUpdateMouse = 10004
    FailedToRemoveMouse = 10005
    MouseExist = 10006
