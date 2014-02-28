import time
import logging
import logging.config

import settings
from db.client import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class Collection():
    KnownConnections = 'ra_known_connections'


class CollectionKeys():

    HostPort = 'host_port'
    WebPort = 'web_port'
    Status = 'status'
    AgentId = 'agent_id'
    DateTime = 'date_time'
    Customer = 'customer'
    Timestamp = 'saved_timestamp'
    ProcessId = 'rd_process_id'


@db_create_close
def ra_initialization(conn=None):

    try:

        r.db('toppatch_server').table_create(
            Collection.KnownConnections,
            primary_key=CollectionKeys.AgentId,
        ).run(conn)

    except Exception as e:

        logger.error('Unable to create RA tables.')
        logger.error(str(e))


@db_create_close
def connection_exist(
    agent_id=None,
    customer=settings.Default.Customer,
    conn=None
):
    """Checks if there is a currently opened connection with the specified
    agent.

    Args:

        - agent_id: Agent ID this connection applies to.

        - customer: Name of customer this connection belongs to.

    Returns:

        - True if a connection is open. False otherwise.

    """
    if (
        not customer
        or not agent_id
    ):
        return False

    result = None

    try:

        result = (
            r.table(Collection.KnownConnections)
            .get(agent_id)
            .run(conn)
        )

        if result is None:

            return False, None

    except Exception as e:

        logger.error('Unable to verify if connection exist.')
        logger.error(str(e))

    return True, result


@db_create_close
def get_rd_pid(agent_id=None, conn=None):
    """Gets the remote desktop process ID for agent.
    """

    try:

        result = (
            r.table(Collection.KnownConnections)
            .get(agent_id)
            .run(conn)
        )

        if result:

            return result[CollectionKeys.ProcessId]

    except Exception as e:

        logger.error('Unable to verify if connection exist.')
        logger.error(str(e))

    return None


@db_create_close
def save_connection(
    agent_id=None, web_port=None,
    host_port=None, status=None,
    process_id=None, customer=settings.Default.Customer,
    conn=None
):
    """Saves a RA connection.

    Args:


        - agent_id: Agent ID this connection applies to.

        - web_port: Local port used by the RA plugin for the web.

        - host_port: Local port used by the RA plugin for the reverse tunnel.

        - status: Current status (ra.Status type) of this connection.

        - process_id: Process ID this connection is tied to.

        - customer: Name of customer this connection belongs to.

    Returns:

        - True if saved sucessfully, False otherwise.

    """

    if (
        not customer
        or not agent_id
        or not host_port
    ):
        return False, 'Please provide a customer, agent id, and/or host port.'

    if connection_exist(customer=customer, agent_id=agent_id)[0]:
        return False, 'Connection already exist for %s' % agent_id

    timestamp = long(time.time())

    connection = {}

    connection[CollectionKeys.AgentId] = agent_id
    connection[CollectionKeys.Customer] = customer
    connection[CollectionKeys.Timestamp] = timestamp
    connection[CollectionKeys.HostPort] = host_port
    connection[CollectionKeys.WebPort] = web_port
    connection[CollectionKeys.Status] = status
    connection[CollectionKeys.ProcessId] = process_id

    try:

        result = (
            r.table(Collection.KnownConnections)
            .insert(connection)
            .run(conn)
        )

        if result.get('inserted', 0) > 0:

            return True, ''

    except Exception as e:

        logger.error("Unable to save remote desktop connection")
        logger.error(str(e))

    return False, 'Could not save connection.'


@db_create_close
def remove_connection(
    agent_id=None,
    customer=settings.Default.Customer,
    conn=None
):
    """Removes a connection.

    Should be called once done and everything is called. Proper cleanup please.

    Args:

        - customer: Name of customer this connection belongs to.

        - agent_id: Agent ID this connection applies to.

    Returns:

        - True if saved sucessfully, False otherwise.

    """

    message = (
        'Unable to remove connection from db. Port might stay unavailable.')

    try:

        result = (
            r.table(Collection.KnownConnections)
            .get(agent_id)
            .delete().run(conn)
        )

        if 'deleted' in result:

            if result['deleted'] > 0:

                return True, ''

    except Exception as e:

        logger.error(str(e))
        logger.error(message)

    return False, message


@db_create_close
def edit_connection(
    agent_id=None, web_port=None, host_port=None,
    status=None, process_id=None,
    customer=settings.Default.Customer, conn=None
):
    """Edit values of an existing connection.

    Args:

        - agent_id: Agent ID this connection applies to.

        - web_port: Local port used by the RA plugin for the web ui.

        - host_port: Local port used by the RA plugin for the reverse tunnel.

        - status: Current status (ra.Status type) of this connection.

        - process_id: Process ID this connection is tied to.

        - customer: Name of customer this connection belongs to.

    Returns:

        - True if saved sucessfully, False otherwise.

    """

    try:

        new_connection = {}

        if web_port:
            new_connection[CollectionKeys.WebPort] = web_port
        if host_port:
            new_connection[CollectionKeys.HostPort] = host_port
        if status:
            new_connection[CollectionKeys.Status] = status
        if process_id:
            new_connection[CollectionKeys.ProcessId] = process_id

        result = (
            r.table(Collection.KnownConnections)
            .get(agent_id)
            .update(new_connection)
            .run(conn)
        )

        if 'replaced' in result:

            if result['replaced'] > 0:

                return True

    except Exception as e:

        logger.error('Unable to edit an existing connection.')
        logger.error(str(e))

    return False


@db_create_close
def port_available(port=None, conn=None):
    """Checks if a port is available.

    Determines availabilty based on previous connections status and port use.

    Args:
        - port: Port number wanting to check.

    Returns:

        True if available. False otherwise.

    """

    try:


        result = list(
            r.table(Collection.KnownConnections)
            .filter({
                CollectionKeys.WebPort: port,
            })
            .run(conn)
        )

        if len(result) != 0:
            return False

        result = list(
            r.table(Collection.KnownConnections)
            .filter({
                CollectionKeys.HostPort: port,
            })
            .run(conn)
        )

        if len(result) != 0:
            return False

        return True

    except Exception as e:

        logger.error('Unable to verify port.')
        logger.error(str(e))
