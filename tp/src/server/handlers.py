from __future__ import unicode_literals

try:
    import simplejson as json
except ImportError:
    import json

import re
import tornado
import tornado.gen
import tornado.web
import tornado.websocket
import tornadoredis
from datetime import datetime, timedelta
from db.client import *
from jsonpickle import encode
#from models.node import NodeInfo
#from networking.agentoperation import AgentOperation
#from scheduler.jobManager import job_scheduler, job_lister
from server.hierarchy.decorators import authenticated_request
from server.hierarchy.decorators import convert_json_to_arguments
from server.hierarchy import api
from time import sleep
from tornado import ioloop
#from users.manager import *
#from users.manager import list_user, list_users

from server.hierarchy.manager import Hierarchy

LISTENERS = []


class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        #self.clear_all_cookies()
        return self.get_secure_cookie("user")


class RootHandler(BaseHandler):
    @authenticated_request
    def get(self):
        self.render('../wwwstatic/index.html')


class LoginHandler(BaseHandler):

    def get(self):
        self.render('../wwwstatic/login.html')

    @convert_json_to_arguments
    def post(self):
        self.set_header('Content-Type', 'application/json')
        username = self.arguments.get("username", None)
        password = self.arguments.get("password", None)
        uri = self.arguments.get("uri", None)
        result = {}

        if uri:
            if self.get_current_user():
                self._response_authorized()
            else:
                self._response_unauthorized()

        elif username and password:
            username = username.encode('utf-8')
            password = password.encode('utf-8')
            authenticated = Hierarchy.authenticate_account(username, password)

            if authenticated:
                self.set_secure_cookie("user", username, secure=True)
                self._response_authorized()
            else:
                self._response_unauthorized()

        else:
            if not username:
                result['username'] = ['Username is required.']
            if not password:
                result['password'] = ['Password is required.']
            self.set_status(400)
            self.write(json.dumps(result))

    @convert_json_to_arguments
    def _response_authorized(self):
        username = self.arguments.get("username", self.get_current_user())
        result = api.User.get(username, username)
        self.set_status(200)
        self.write(json.dumps(result))

    def _response_unauthorized(self):
        result = {'error': 'Unauthorized'}
        self.set_status(401)
        self.write(json.dumps(result))


class RvlLoginHandler(BaseHandler):

    @convert_json_to_arguments
    def post(self):

        username = self.arguments.get("name", None)
        password = self.arguments.get("password", None)
        username = username.encode('utf-8')
        password = password.encode('utf-8')

        if username and password:

            authenticated = Hierarchy.authenticate_account(username, password)

            if authenticated:
                self.set_secure_cookie("user", username)
                return
            else:
                self.set_status(403)
                self.write("Invalid username and/or password .")
        else:

            self.set_status(403)
            self.write("Invalid username and/or password .")



class WebSocketHandler(BaseHandler, tornado.websocket.WebSocketHandler):

    def __init__(self, *args, **kwargs):

        super(WebSocketHandler, self).__init__(*args, **kwargs)
        self.listen()

    @tornado.gen.engine
    def listen(self):

        self.client = tornadoredis.Client()
        self.client.connect()

        yield tornado.gen.Task(self.client.subscribe, 'rv')

        self.client.listen(self.on_message)

    def on_message(self, msg):

        if msg.kind == 'message':

            self.write_message(str(msg.body))

    def on_close(self):

        self.client.unsubscribe('rv')

        def check():

            if self.client.connection.in_progress:

                ioloop.IOLoop.instance().add_timeout(timedelta(0.00001), check)

            else:

                self.client.disconnect()

        ioloop.IOLoop.instance().add_timeout(timedelta(0.00001), check)
        self.client.disconnect()


class LogoutHandler(BaseHandler):
    def get(self):
        self.clear_all_cookies()
        self.set_status(204)


class RvlLogoutHandler(BaseHandler):
    def get(self):
        self.clear_all_cookies()
        self.redirect('/rvl/login')
        #self.write("Goodbye!" + '<br><a href="/login">Login</a>')

# class CreateUserHandler(BaseHandler):
#     #@authenticated_request
#     def get(self):
#         self.write('Test.')


class ListUserHandler(BaseHandler):
    #@authenticated_request
    def get(self):
        self.write('Test.')


class DeleteUserHandler(BaseHandler):
    #@authenticated_request
    def get(self):
        self.write('Test.')


class CreateGroupHandler(BaseHandler):
    #@authenticated_request
    def get(self):
        self.write('Test.')


class ListGroupHandler(BaseHandler):
    #@authenticated_request
    def get(self):
        self.write('Test.')


class DeleteGroupHandler(BaseHandler):
    #@authenticated_request
    def get(self):
        self.write('Test.')


class CreateACLHandler(BaseHandler):
    #@authenticated_request
    def get(self):
        self.write('Test.')


class ListACLHandler(BaseHandler):
    #@authenticated_request
    def get(self):
        self.write('Test.')


class DeleteACLHandler(BaseHandler):
    #@authenticated_request
    def get(self):
        self.write('Test.')


class AdminHandler(BaseHandler):

    @authenticated_request
    def post(self):

        oldpassword = self.get_argument('old-password', None)
        password = self.get_argument('password', None)

        result = {'error': True, 'description': '{}'.format(
            'User data is missing. Please provide username, current and new '
            'password.'
        )}

        if password:
            username = self.current_user

            if authenticate_account(username, oldpassword):

                #change_user_password(str(username), str(password))
                result = {'error': False, 'description': 'changed password'}

            else:

                result = {'error': True, 'description': 'invalid password'}

        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result))
