import json
import logging
import logging.config

from server.handlers import BaseHandler
#from server.hierarchy.manager import get_current_customer_name
from server.hierarchy import api
from server.hierarchy.decorators import authenticated_request, permission_check

from server.hierarchy.permissions import Permission

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

ROOT_GROUP = 'default'


class GetGroupApi(BaseHandler):

    @authenticated_request
    def get(self):

        self.set_header('Content-Type', 'application/json')

        user = self.get_current_user()
        name = self.get_argument('name', None)
        _id = self.get_argument('id', None)
        customer_context = self.get_argument('customer_context', None)

        if name:

            result = api.Group.get({'name': name}, user)

        elif _id:

            result = api.Group.get({'id': _id}, user)

        else:

            result = api.Group.get_groups(customer_context, user)

        self.write(json.dumps(result, indent=4))


class AddGroupApi(BaseHandler):

    @authenticated_request
    @permission_check(permission=Permission.Admin)
    def post(self):

        self.set_header('Content-Type', 'application/json')

        user = self.get_current_user()
        name = self.get_argument('name', None)
        customer_context = self.get_argument('customer_context', None)

        result = api.Group.create(name, user, customer_context)

        self.write(json.dumps(result, indent=4))


class ModifyGroupApi(BaseHandler):

    @authenticated_request
    @permission_check(permission=Permission.Admin)
    def post(self):

        self.set_header('Content-Type', 'application/json')
        user = self.get_current_user()
        data = {}

        data['customer_context'] = self.get_argument('customer_context', None)

        data['user_name'] = user
        data['name'] = self.get_argument('name', None)
        data['id'] = self.get_argument('id', None)

        # This customer is if the group "moved" from one cusomter to another?!
        data['customer'] = self.get_argument('customer', None)
        data['users'] = self.get_arguments('user', None)
        data['permissions'] = self.get_arguments('permission', None)

        result = api.Group.edit(**data)

        self.write(json.dumps(result, indent=4))


class DeleteGroupApi(BaseHandler):

    @authenticated_request
    @permission_check(permission=Permission.Admin)
    def post(self):

        self.set_header('Content-Type', 'application/json')

        group_id = self.get_argument('id', None)
        group_name = self.get_argument('name', None)

        user_name = self.get_current_user()
        customer_context = self.get_argument('customer_context', None)

        result = api.Group.delete(
            group_id,
            group_name,
            user_name
        )

        self.write(json.dumps(result, indent=4))
