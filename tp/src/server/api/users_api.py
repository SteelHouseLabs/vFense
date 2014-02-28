import json
import logging
import logging.config

from utils.security import check_password
from server.handlers import BaseHandler
from server.hierarchy.manager import Hierarchy
from server.hierarchy import api
from server.hierarchy.permissions import Permission
from server.hierarchy.decorators import authenticated_request, permission_check

from logger.rvlogger import RvLogger

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class GetUserApi(BaseHandler):

    @authenticated_request
    def get(self):

        self.set_header('Content-Type', 'application/json')

        active_user = self.get_current_user()
        name = self.get_argument('username', None)

        result = api.User.get(active_user, name)

        self.write(json.dumps(result, indent=4))

class GetUsersApi(BaseHandler):

    @authenticated_request
    def get(self):

        self.set_header('Content-Type', 'application/json')

        active_user = self.get_current_user()
        customer_context = self.get_argument('customer_context', None)

        result = api.User.get(
            active_user,
            customer_context=customer_context,
            all_users=True
        )

        self.write(json.dumps(result, indent=4))


class CreateUserApi(BaseHandler):

    @authenticated_request
    @permission_check(permission=Permission.Admin)
    def post(self):

        self.set_header('Content-Type', 'application/json')

        parameters = dict()

        parameters['username'] = self.get_argument('username')
        parameters['password'] = self.get_argument('password')
        parameters['fullname'] = self.get_argument('fullname', None)
        parameters['email'] = self.get_argument('email', None)

        parameters['current_customer_id'] = self.get_argument(
            'current_customer_id', None)
        parameters['customer_ids'] = self.get_arguments('customer_id', None)
        parameters['default_customer_id'] = self.get_argument(
            'default_customer_id', None
        )

        parameters['group_names'] = self.get_arguments('group_name', None)
        parameters['group_ids'] = self.get_arguments('group_id', None)
        complexity_passed, complexity = check_password(parameters['password'])
        if complexity_passed:
            result = api.User.create(**parameters)
        else:
            result = (
                {
                    'pass': complexity_passed,
                    'message': 'Password must be 8 characters in length and contain lower and upper case characters: Strength = %s' % complexity,
                    'data': ''
                }
            )

        self.write(json.dumps(result, indent=4))


class ModifyUserApi(BaseHandler):

    @authenticated_request
    def post(self):

        self.set_header('Content-Type', 'application/json')
        parameters = dict()

        username = self.get_current_user()
        password = self.get_argument('password', None)

        parameters['customer_context'] = self.get_argument('customer_context', None)

        parameters['password'] = self.get_argument('new_password', None)
        if parameters['password']:
            complexity_passed, complexity = check_password(parameters['password'])
            if not complexity_passed:
                result = {}
                result['pass'] = False
                result['message'] = 'Password must be 8 characters in length and contain lower and upper case characters: Strength = %s' % complexity,
                self.write(json.dumps(result, indent=4))
                return
            if password:

                if not Hierarchy.authenticate_account(username, password):

                    result = {}
                    result['pass'] = False
                    result['message'] = 'Incorrect username or password.'

                    self.write(json.dumps(result, indent=4))
                    return
            else:

                result = {}
                result['pass'] = False
                result['message'] = 'Current password not provided.'

                self.write(json.dumps(result, indent=4))
                return

        parameters['username'] = username

        parameters['fullname'] = self.get_argument('fullname', None)
        parameters['email'] = self.get_argument('email', None)

        parameters['current_customer_id'] = self.get_argument(
            'current_customer_id', None)

        parameters['customer_ids'] = None

        parameters['default_customer_id'] = self.get_argument(
            'default_customer_id', None
        )

        parameters['group_names'] = self.get_arguments('group_name', None)
        parameters['group_ids'] = self.get_arguments('group_id', None)

        result = api.User.edit(**parameters)

        self.write(json.dumps(result, indent=4))


class DeleteUserApi(BaseHandler):

    @authenticated_request
    @permission_check(permission=Permission.Admin)
    def post(self):

        self.set_header('Content-Type', 'application/json')

        name = self.get_argument('username', None)

        result = api.User.delete(name)

        self.write(json.dumps(result, indent=4))
