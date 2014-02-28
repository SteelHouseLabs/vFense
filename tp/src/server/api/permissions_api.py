import json
from server.handlers import BaseHandler
from server.hierarchy.decorators import authenticated_request
from server.hierarchy.permissions import Permission


class GetPermissionsApi(BaseHandler):

    @authenticated_request
    def get(self):

        self.set_header('Content-Type', 'application/json')

        d = {}

        d['pass'] = True

        ## In an order that makes 'grouping' sense.
        #permissions = [
        #    Permission.Admin,
        #    Permission.Install, Permission.Uninstall,
        #    Permission.Reboot, Permission.Schedule,
        #    #Permission.SnapshotCreation, Permission.SnapshotRemoval,
        #    #Permission.SnapshotRevert,
        #    Permission.TagCreation,
        #    Permission.TagRemoval,
        #    #Permission.WakeOnLan
        #]

        d['data'] = Permission.get_permissions()
        d['message'] = 'Permissions available.'

        self.write(json.dumps(d, indent=4))
