class Permission():

    #WakeOnLan = 'wakeOnLan'
    Reboot = 'reboot'
    TagCreation = 'tagCreation'
    TagRemoval = 'tagRemoval'
    #SnapshotCreation = 'snapshotCreation'
    #SnapshotRemoval = 'snapshotRemoval'
    #SnapshotRevert = 'snapshotRevert'
    Install = 'install'
    Uninstall = 'uninstall'
    Admin = 'admin'
    Schedule = 'schedule'
    RemoteAssistance = 'remoteAssistance'

    @staticmethod
    def get_permissions():

        # In an order that makes 'grouping' sense.
        return [
            Permission.Admin,
            Permission.Install, Permission.Uninstall,
            Permission.Reboot, Permission.Schedule,
            #Permission.SnapshotCreation, Permission.SnapshotRemoval,
            #Permission.SnapshotRevert,
            Permission.TagCreation,
            Permission.TagRemoval,
            #Permission.WakeOnLan,
            Permission.RemoteAssistance
        ]

