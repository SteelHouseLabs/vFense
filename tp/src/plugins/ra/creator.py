import threading
import time
import logging
import logging.config

from settings import Default
from tunnels import TunnelKey, reverse_tunnel_params

from plugins import ra
from plugins.ra.raoperation import store_in_agent_queue, save_operation
from plugins.ra.raoperation import RaOperation
from plugins.ra.novnc import stop_novnc


logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


def new_rd_session(
    agent_id=None,
    user=Default.User,
    customer=Default.Customer
):

    if not agent_id:
        return {
            'pass': False,
            'message': 'No agent id was provided.'
        }

    res, session = ra.session_exist(agent_id)
    if res:

        status, web_port = session

        if status == ra.Status.Waiting:
            return {
                'pass': False,
                'message': (
                    'Session exist for this agent. Waiting for response.'
                ),
                ra.RaKey.Status: status
            }

        host = ra.get_hostname()
        uri = ra.create_vnc_uri(host, web_port)

        if status == ra.Status.Ready:
            return {
                'pass': False,
                'message': (
                    'Session exist for this agent. Using session.'
                ),
                ra.RaKey.Status: status,
                ra.RaKey.WebPort: web_port,
                ra.RaKey.Hostname: host,
                ra.RaKey.Uri: uri
            }

        if status == ra.Status.Timeout:

            ra.db.edit_connection(
                agent_id=agent_id,
                status=ra.Status.Ready
            )

            return {
                'pass': False,
                'message': (
                    'Session exist for this agent. Reusing.'
                ),
                ra.RaKey.Status: status,
                ra.RaKey.WebPort: web_port,
                ra.RaKey.Hostname: host,
                ra.RaKey.Uri: uri
            }

        if status == ra.Status.Closing:

            return {
                'pass': False,
                'message': (
                    'Session exist but is being closed.'
                    'Please try again in a few seconds.'
                ),
                ra.RaKey.Status: status,
            }

    operation = RaOperation(
        ra.RaValue.RemoteDesktop,
        agent_id,
        username=user,
        customer=customer,
        uri=ra.RaUri.StartRemoteDesktop % agent_id,
        method='POST'
    )

    port = None
    tunnel_needed = True

    if tunnel_needed:

        params = None
        port_range = list(ra.PortRange)
        for p in ra.PortRange:

            params = reverse_tunnel_params(port_range)
            if ra.db.port_available(
                port=params[TunnelKey.HostPort]
            ):
                break

            port_range.remove(p)
            params = None

        if params:

            port = params[TunnelKey.HostPort]
            ssh_port = params[TunnelKey.SSHPort]
            operation.set_tunnel(host_port=port, ssh_port=ssh_port)

        else:

            return {
                'pass': False,
                'message': "Could not resolve host port for tunnel."
            }

    operation_id = save_operation(operation)
    if operation_id:

        result, msg = ra.db.save_connection(
            agent_id=agent_id,
            host_port=port,
            status=ra.Status.Waiting
        )

        if result:

            operation.operation_id = operation_id
            ra.add_feedback(agent_id, ra.Status.Waiting)
            store_in_agent_queue(operation)

            return {
                'pass': True,
                'message': 'Remote desktop created. Waiting...'
            }

        else:

            return {
                'pass': False,
                'message': msg
            }

    else:

        return {
            'pass': False,
            'message': "Unable to save operation. Invalid operation ID."
        }


def terminate_rd_session(
    agent_id=None,
    user=Default.User,
    customer=Default.Customer
):

    if not agent_id:
        return {
            'pass': False,
            'message': 'No agent id was provided.'
        }

    res, session = ra.session_exist(agent_id)
    if res:

        status, web_port = session

        if status == ra.Status.Waiting:
            return {
                'pass': False,
                'message': (
                    'Session still waiting for agent to respond.'
                ),
                ra.RaKey.Status: status
            }

        if status == ra.Status.Timeout:
            return {
                'pass': False,
                'message': (
                    'Session already in the process to be closed.'
                ),
                ra.RaKey.Status: status,
            }

        return set_session_to_timeout(agent_id, user)

    else:

        message = "Could not find session for agent %s." % agent_id
        logger.error(message)

        return {
            'pass': False,
            'message': message,
            'error': "Session not found."
        }


def grace_close_timeout(agent_id, user, timeout=120):

    try:

        time.sleep(timeout)
        res, session = ra.session_exist(agent_id)

        if res:

            status = session[0]
            if status == ra.Status.Timeout:

                ra.db.edit_connection(
                    agent_id=agent_id,
                    status=ra.Status.Closing
                )

                remove_session(agent_id, user)

            else:

                logger.info('Session found for agent %s' % agent_id)
                logger.info("No longer under 'timeout' status. Nothing to do.")

        else:

            logger.info('No session found for agent %s' % agent_id)
            logger.info('Nothing to do.')

    except Exception as e:

        logger.error('Unable to close session from timeout thread.')
        logger.exception(e)


def set_session_to_timeout(agent_id, user, timeout=120):
    """Flags an open sessions to be closed.

    Args:

        - agent_id: Agent for which the session should be closed.

        - timeout: Number of seconds to wait to actually close the session.
            Helps when a session is closed by mistake. 0 minutes to close the
            session immediately.
    """

    if timeout == 0:

        return remove_session(agent_id, user)

    else:

        if ra.db.edit_connection(
            agent_id=agent_id,
            status=ra.Status.Timeout
        ):

            threading.Thread(
                target=grace_close_timeout,
                args=(agent_id, user, timeout)
            ).start()

            return {
                'pass': True,
                'message': 'Closing status set.'
            }

    return {
        'pass': False,
        'message': 'Unable to to stop session.'
    }


def remove_session(
    agent_id=None,
    user=Default.User,
    customer=Default.Customer
):

    pid = ra.db.get_rd_pid(agent_id=agent_id)
    pid_msg = ''
    if pid:

        if stop_novnc(agent_id, pid):

            logger.info('Stopped NoVNC process for %s.' % agent_id)

        else:

            pid_msg = 'Unable to stop NoVNC for agent %s. ' % agent_id
            logger.error(pid_msg)

    session_closed, session_msg = ra.db.remove_connection(
        agent_id=agent_id
    )
    if session_msg:
        logger.info(session_msg)

    operation = RaOperation(
        ra.RaValue.StopRemoteDesktop,
        agent_id,
        username=user,
        customer=customer
    )

    operation_id = save_operation(operation)
    _id_msg = ''
    if operation_id:

        operation.operation_id = operation_id
        store_in_agent_queue(operation)
        logger.info('Added operation to queue for %s.' % agent_id)

    else:

        _id_msg = (
            'Unable to send stop operation to agent %s.'
            ' Agent side will most likely stay open... ' % agent_id
        )

        logger.error(_id_msg)

    ra.add_feedback(agent_id, ra.Status.Closing)

    result = (pid and operation_id and session_closed)
    message = pid_msg + _id_msg + session_msg

    return {
        'pass': result,
        'message': message
    }
