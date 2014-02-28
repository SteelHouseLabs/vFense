
import tornado.httpserver
import tornado.web

import simplejson as json

import logging
import logging.config
from server.handlers import BaseHandler
from db.client import *
from errorz.error_messages import GenericResults
from errorz.status_codes import GenericCodes
from agent.agent_handler import AgentManager
from tagging import *
from tagging.tagManager import *
from tagging.tag_searcher import TagSearcher
from utils.common import *
from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments
from server.hierarchy.decorators import authenticated_request, permission_check

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class TagsHandler(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        query = self.get_argument('query', None)
        count = int(self.get_argument('count', 30))
        offset = int(self.get_argument('offset', 0))
        uri = self.request.uri
        method = self.request.method
        sort = self.get_argument('sort', 'asc')
        sort_by = self.get_argument('sort_by', TagsKey.TagName)
        tag = (
            TagSearcher(
                username, customer_name, uri, method,
                count, offset, sort, sort_by
            )
        )
        if not query:
            results = tag.get_all()
        else:
            results = tag.search_by_name(query)

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))

    @convert_json_to_arguments
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        tag_name = self.arguments.get('name', None)
        uri = self.request.uri
        method = self.request.method
        if tag_name:
            tag = TagsManager(username, customer_name, uri, method)
            results = tag.create_tag(tag_name)

        else:
            results = (
                GenericResults(
                    username, uri, method
                ).incorrect_arguments()
            )

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))

    @convert_json_to_arguments
    @authenticated_request
    def delete(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            tag_id = self.arguments.get('id', None)
            if tag_id:
                tag = TagsManager(username, customer_name, uri, method)
                results = tag.remove_tag(tag_id)

            else:
                results = (
                    GenericResults(
                        username, uri, method
                    ).incorrect_arguments()
                )

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke('agentids and tag_id', 'delete agents_in_tagid', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


class TagHandler(BaseHandler):
    @authenticated_request
    def get(self, tag_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        tag = TagSearcher(username, customer_name, uri, method)
        results = tag.get_tag(tag_id)
        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))


    @authenticated_request
    @convert_json_to_arguments
    def post(self, tag_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        uri = self.request.uri
        method = self.request.method
        try:
            reboot = self.arguments.get('reboot', None)
            shutdown = self.arguments.get('shutdown', None)
            apps_refresh = self.arguments.get('apps_refresh', None)
            operation = (
                    StoreOperation(
                        username, customer_name, uri, method
                    )
            )
            if reboot:
                results = (
                    operation.reboot(tag_id)
                )
            elif shutdown:
                results = (
                    operation.shutdown(tag_id)
                )
            elif apps_refresh:
                results = (
                    operation.apps_refresh(tag_id)
                )
            else:
                results = (
                    GenericResults(
                        username, uri, method
                    ).incorrect_arguments()
                )

            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(tag_id, '', e)
            )
            logger.exception(e)
            self.set_status(results['http_status'])
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(results, indent=4))


    @convert_json_to_arguments
    @authenticated_request
    def put(self, tag_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        agent_id = self.arguments.get('agent_id', None)
        uri = self.request.uri
        method = self.request.method
        tag = (
            TagsManager(
                username, customer_name,
                uri, method
            )
        )
        if agent_id:
            results = tag.add_agents_to_tag(agent_id, tag_id)

        else:
            results = (
                GenericResults(
                    username, uri, method
                ).incorrect_arguments()
            )

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))

    @convert_json_to_arguments
    @authenticated_request
    def delete(self, tag_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        agent_id = self.arguments.get('agent_id', None)
        uri = self.request.uri
        method = self.request.method
        tag = (
            TagsManager(
                username, customer_name, uri, method
            )
        )
        if agent_id:
            results = tag.remove_tag_from_agent(tag_id, agent_id)

        else:
            results = (
                GenericResults(
                    username, uri, method
                ).incorrect_arguments()
            )

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))


class TagsAgentHandler(BaseHandler):
    @authenticated_request
    def get(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        name = self.get_argument('query', None)
        uri = self.request.uri
        method = self.request.method
        if name:
            tag = TagSearcher(username, customer_name, uri, method)
            results = tag.search_by_name(name)
        else:
            tag = AgentManager(agent_id, customer_name, username)
            results = tag.get_tags(uri, method)

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))


    @convert_json_to_arguments
    @authenticated_request
    def put(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        tag_name = self.arguments.get('tag_name', None)
        tag_id = self.arguments.get('tag_id', None)
        uri = self.request.uri
        method = self.request.method
        tag = (
            TagsManager(
                username, customer_name,
                uri, method
            )
        )
        if tag_name and not tag_id:
            tag_created = tag.create_tag(tag_name)
            if tag_created['http_status'] == 200:
                agent_added = (
                    tag.add_agents_to_tag(
                        agent_id, tag_created['data']['tag_id']
                    )
                )
                if agent_added['http_status'] == 200:
                    if tag_created['rv_status_code'] == GenericCodes.ObjectExists:
                        results = (
                            TagResults(
                                username, uri, method
                            ).tag_exists_and_agent_added(
                                tag_created['data']['tag_id'],
                                agent_id, agent_added['data']
                            )
                        )

                    else:
                        results = (
                            TagResults(
                                username, uri, method
                            ).tag_created_and_agent_added(
                                tag_name, agent_id, agent_added['data']
                            )
                        )

                else:
                    results = agent_added

        elif tag_id and not tag_name:
            agent_added = tag.add_agents_to_tag(agent_id, tag_id)
            if agent_added['http_status'] == 200:
                results = (
                    TagResults(
                        username, uri, method
                    ).tag_created_and_agent_added(
                        tag_name, agent_id, agent_added['data']
                    )
                )
            else:
                results = agent_added

        else:
            results = (
                GenericResults(
                    username, uri, method
                ).incorrect_arguments()
            )

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))

    @convert_json_to_arguments
    @authenticated_request
    def delete(self, agent_id):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        tag_id = self.arguments.get('tag_id', None)
        uri = self.request.uri
        method = self.request.method
        tag = (
            TagsManager(
                username, customer_name,
                uri, method
            )
        )
        if tag_id:
            results = tag.remove_tag_from_agent(tag_id, agent_id)

        else:
            results = (
                GenericResults(
                    username, uri, method
                ).incorrect_arguments()
            )

        self.set_status(results['http_status'])
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))
