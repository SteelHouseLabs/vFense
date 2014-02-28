import json
import logging
import logging.config

from agent.agents import get_all_agent_ids
from agent.agent_handler import AgentManager

from server.hierarchy import api
from server.hierarchy.permissions import Permission
from server.hierarchy.decorators import authenticated_request, permission_check
from server.handlers import BaseHandler

from apscheduler.jobstores.redis_store import RedisJobStore

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

ROOT_CUSTOMER = 'default'


class GetCustomerHandler(BaseHandler):

    @authenticated_request
    def get(self):

        self.set_header('Content-Type', 'application/json')

        customer_name = self.get_argument('name', None)
        user = self.get_current_user()

        if customer_name:

            result = api.Customer.get(customer_name, user)

        else:

            result = api.Customer.get(user_name=user)

        self.write(json.dumps(result, indent=4))


class AddCustomerHandler(BaseHandler):

    @authenticated_request
    @permission_check(permission=Permission.Admin)
    def post(self):

        self.set_header('Content-Type', 'application/json')
        self.sched = self.application.scheduler

        name = self.get_argument('name')
        username = self.get_current_user()

        result = api.Customer.create(name, username)
        self.sched.add_jobstore(RedisJobStore(db=10), name)

        self.write(json.dumps(result, indent=4))


class ModifyCustomerHandler(BaseHandler):

    @authenticated_request
    @permission_check(permission=Permission.Admin)
    def post(self):

        self.set_header('Content-Type', 'application/json')

        data = {}
        current_user = self.get_current_user()

        data['customer_name'] = self.get_argument('name', None)
        data['user_name'] = current_user

        data['users'] = self.get_arguments('user', None)

        data['cpu_throttle'] = self.get_argument('cpu_throttle', None)
        data['net_throttle'] = self.get_argument('net_throttle', None)

        data['group_names'] = self.get_arguments('group_name', None)
        data['group_ids'] = self.get_arguments('group_id', None)

        result = api.Customer.edit(**data)

        self.write(json.dumps(result, indent=4))


class DeleteCustomerHandler(BaseHandler):

    @authenticated_request
    @permission_check(permission=Permission.Admin)
    def post(self):

        self.set_header('Content-Type', 'application/json')
        uri = self.request.uri
        method = self.request.method

        name = self.get_argument('name', None)
        user_name = self.get_current_user()
        result = api.Customer.delete(name, user_name)
        if result['pass']:
            # delete all agents of this customer
            all_agents = get_all_agent_ids(customer_name=name)
            for agent_id in all_agents:
                agent = AgentManager(
                    agent_id, customer_name=name
                )
                # TODO: real uri, real method
                agent.delete_agent(uri, method)

        self.write(json.dumps(result, indent=4))
