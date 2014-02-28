import tornado.httpserver
import tornado.web

import simplejson as json

import logging
import logging.config
import os
from server.handlers import BaseHandler, LoginHandler
from db.client import *
from utils.common import *
from emailer.mailer import *

from server.hierarchy.manager import get_current_customer_name
from server.hierarchy.decorators import authenticated_request
from jsonpickle import encode

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class GetEmailConfigHandler(BaseHandler):
    @authenticated_request
    def get(self):
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        mail = MailClient(customer_name)
        result = {
            'host': mail.server,
            'username': mail.username,
            'port': mail.port,
            'from_email': mail.from_email,
            'to_email': mail.to_email,
            'is_tls': mail.is_tls,
            'is_ssl': mail.is_ssl
            }
     
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))


class CreateEmailConfigHandler(BaseHandler):
    @authenticated_request
    def post(self):
        passed = False
        logged_in = False
        username = self.get_current_user()
        customer_name = get_current_customer_name(username)
        mail_host = self.get_argument('host', None)
        mail_user = self.get_argument('user', None)
        mail_password = self.get_argument('password', None)
        mail_port = self.get_argument('port', 25)
        from_email = self.get_argument('from_email', None)
        to_email = self.get_arguments('to_email')
        is_tls = self.get_argument('is_tls', False)
        is_ssl = self.get_argument('is_ssl', False)
        if is_tls:
            is_tls = return_bool(is_tls)
        if is_ssl:
            is_ssl = return_bool(is_ssl)
        if mail_host and mail_user and mail_password and \
                mail_port and from_email and len(to_email) >0:
            create_or_modify_mail_config(
                modifying_username=username, customer_name=customer_name,
                server=mail_host, username=mail_user,
                password=mail_password, port=mail_port,
                is_tls=is_tls, is_ssl=is_ssl,
                from_email=from_email, to_email=to_email
            )
            mail = MailClient(customer_name)
            mail.connect()
            if mail.logged_in:
                message = '%s - Valid Mail Settings' % (username)
                logger.info(message)
                result = {
                        'pass': True,
                        'message': 'Valid Mail Settings'
                        }
            elif not mail.logged_in:
                message = '%s - Incorrect Authentication Settings' % (username)
                logger.error(message)
                result = {
                        'pass': False,
                        'message': 'Incorrect Authentication Settings'
                        }
            elif not mail.connnected:
                message = '%s - Invalid Connection Settings' % (username)
                logger.error(message)
                result = {
                        'pass': False,
                        'message': 'Invalid Connection Settings'
                        }
        else:
            message = '%s - Incorrect Parameters Passed' % (username)
            logger.error(message)
            result = {
                'pass': False,
                'message': 'Incorrect Parameters Passed'
                }
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))



