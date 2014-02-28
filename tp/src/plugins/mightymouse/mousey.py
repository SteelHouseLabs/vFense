import logging
import logging.config
from time import mktime
from datetime import datetime
from db.client import db_create_close, r, db_connect
from errorz.error_messages import GenericResults, MightyMouseResults
from errorz.status_codes import MightyMouseCodes
from plugins.mightymouse.mouse_db import mouse_exists, \
    add_mouse, update_mouse, delete_mouse

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class MightyMouse(object):
    def __init__(self, username, customer_name=None,
                 uri=None, method=None):

        self.username = username
        self.customer_name = customer_name
        self.uri = uri
        self.method = method

    def add(self, mouse_name, address, customer_names=[]):

        exists = mouse_exists(mouse_name)
        if exists:
            return(
                MightyMouseResults(
                    self.username, self.uri, self.method
                ).exist(mouse_name)
            )
        else:
            status = (
                add_mouse(
                    customer_names, mouse_name, address,
                    self.username, self.uri, self.method
                )
            )
            return(status)

    def update(self, mouse_name, customer_names=[], address=None):

        exists = mouse_exists(mouse_name)
        if exists:
            status = (
                update_mouse(
                    exists, mouse_name, customer_names,
                    address, self.username, self.uri, self.method
                )
            )
        else:
            status = (
                add_mouse(
                    customer_names, mouse_name, address,
                    self.username, self.uri, self.method
                )
            )

        return(status)

    def remove(self, mouse_name):
        status = delete_mouse(mouse_name, self.username, self.uri, self.method)
        return(status)
