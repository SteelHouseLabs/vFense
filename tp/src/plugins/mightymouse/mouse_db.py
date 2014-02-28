import logging
import logging.config

from datetime import datetime
from db.client import db_create_close, r, db_connect
from errorz.error_messages import GenericResults, MightyMouseResults
from errorz.status_codes import MightyMouseCodes

from plugins.mightymouse import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

def mouse_exists(mouse_name):

    conn = db_connect()
    try:
        exist = (
            r
            .table(RelayServersCollection)
            .get(mouse_name)
            .run(conn)
        )

    except Exception as e:
        logger.exception(e)
        exist = False

    conn.close()

    return(exist)

def get_mouse_addresses(customer_name):

    conn = db_connect()
    try:
        exist = list(
            r
            .table(RelayServersCollection)
            .pluck(RelayServers.Address)
            .run(conn)
        )

    except Exception as e:
        logger.exception(e)
        exist = False

    conn.close()

    return(exist)


def add_mouse(customer_names, mouse_name, address,
              username, uri, method):
    conn = db_connect()
    data = {
        RelayServers.RelayName: mouse_name,
        RelayServers.Customers: customer_names,
        RelayServers.Address: address,
    }
    try:
        (
            r
            .table(RelayServersCollection)
            .insert(data)
            .run(conn)
        )
        status = (
            MightyMouseResults(
                username, uri, method
            ).created(mouse_name, data)
        )

    except Exception as e:
        status = (
            MightyMouseResults(
                username, uri, method
            ).failed_to_create(mouse_name, e)
        )

        logger.exception(status)

    conn.close()

    return(status)

def update_mouse(exist, mouse_name, customer_names, address,
                 username, uri, method):
    conn = db_connect()
    if not address:
        address = exist[RelayServers.Address]

    data = {
        RelayServers.Customers: customer_names,
        RelayServers.Address: address,
    }
    try:
        a = (
            r
            .table(RelayServersCollection)
            .get(mouse_name)
            .update(data)
            .run(conn)
        )
        status = (
            MightyMouseResults(
                username, uri, method
            ).updated(mouse_name, data)
        )

    except Exception as e:
        status = (
            MightyMouseResults(
                username, uri, method
            ).failed_to_update(mouse_name, e)
        )
        logger.exception(status)

    conn.close()

    return(status)

def delete_mouse(mouse_name, username, uri, method):

    conn = db_connect()
    try:
        (
            r
            .table(RelayServersCollection)
            .get(mouse_name)
            .delete()
            .run(conn)
        )

        status = (
            MightyMouseResults(
                username, uri, method
            ).remove(mouse_name)
        )

    except Exception as e:
        status = (
            MightyMouseResults(
                username, uri, method
            ).failed_to_remove(mouse_name, e)
        )
        logger.exception(status)

    conn.close()

    return(status)

def get_all_mouseys(username, uri, method, customer_name=None):

    conn = db_connect()
    try:
        if not customer_name:
            data = list(
                r
                .table(RelayServersCollection)
                .run(conn)
            )
        else:
            data = list(
                r
                .table(RelayServersCollection)
                .filter(
                    lambda x: x[RelayServers.Customers].contains(customer_name)
                )
                .run(conn)
            )

        status = (
            GenericResults(
                username, uri, method
            ).information_retrieved(data, len(data))
        )

    except Exception as e:
        status = (
            GenericResults(
                username, uri, method
            ).something_broke('retreiving Relay Servers', 'RelayServers', e)
        )

    conn.close()

    return(status)

