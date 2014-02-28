import time
import logging
import logging.config
import redis

import settings

from tunnels import get_available_port

from plugins import ra
from plugins.ra import RaValue
from plugins.ra import novnc
from plugins.ra.raoperation import save_result


logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

rq_pool = redis.StrictRedis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB
)


class Processor():

    def __init__(self):

        # This pass is for Allen. Do not remove!!
        pass

    def handle(self, json_operation):

        if 'operation' in json_operation:

            operation_type = json_operation['operation']

            if operation_type == RaValue.RemoteDesktop:

                _ra_magic(json_operation)

            elif operation_type == RaValue.StopRemoteDesktop:

                _ra_stop_magic(json_operation)

            elif operation_type == RaValue.SetRdPassword:

                _rd_password(json_operation)


def _rd_password(json_operation):

    operation_id = json_operation.get('operation_id')
    agent_id = json_operation.get('agent_id')
    data = json_operation.get('data')
    error = json_operation.get('error')

    save_result(
        agent_id,
        operation_id,
        error,
        data,
        ra.RaUri.Password,
        "POST",
        RaValue.SetRdPassword
    )


def _ra_stop_magic(json_operation):

    operation_id = json_operation.get('operation_id')
    agent_id = json_operation.get('agent_id')
    data = json_operation.get('data')
    error = json_operation.get('error')

    if agent_id:
        ra.add_feedback(
            agent_id,
            ra.Status.Closed,
            message=''
        )

    save_result(
        agent_id,
        operation_id,
        error,
        data,
        ra.RaUri.RdResults,
        "POST",
        RaValue.StopRemoteDesktop
    )


def _ra_magic(json_operation):

    error = ''
    operation_id = json_operation.get('operation_id')
    agent_id = json_operation.get('agent_id')
    data = json_operation.get('data')

    if data:
        success = data.get('success')
        error = data.get('error')
        host_port = data.get('host_port')
    else:
        success = False
        error += 'Agent did not send valid data.'
        host_port = None

    if (
        not agent_id
        and not operation_id
        and not host_port
    ):
        ra.add_feedback(
            agent_id,
            ra.Status.Error,
            message='Agent did not send valid data.'
        )

        logger.error(
            '%s - Unable to create remote desktop for agent: %s. '
            'Agent sent invalid data.' % ('system_user', agent_id)
        )
        return

    if not ra.db.connection_exist(agent_id=agent_id):
        logger.error(
            'Unknown agent (ID# %s) asking for remote desktop connection.'
            'How did this happen?!' % agent_id
        )
        return

    if success:

        try:

            web_port = None
            offset = 0
            while True:

                # Get a port available system level.
                web_port = get_available_port(ra.PortRange, offset)
                # Checks if a port is reserved for a connection.
                if ra.db.port_available(port=web_port):
                    break

                offset += 1

                if offset == 5000:
                    web_port = None
                    break
                time.sleep(0.3)

            if web_port is None:
                raise Exception("No web port available.")

        except Exception as e:

            msg = 'No ports in range available?! How??'
            error += msg

            logger.error(str(e))
            logger.error(
                '%s - Unable to create remote desktop for agent: %s. '
                'Error: %s'
                % ('system_user', agent_id, msg)
            )

            ra.add_feedback(
                agent_id,
                ra.Status.Error,
                'No ports available...?'
            )

            save_result(
                agent_id,
                operation_id,
                error,
                data,
                ra.RaUri.RdResults,
                "POST",
                RaValue.RemoteDesktop
            )

            ra.db.remove_connection(agent_id=agent_id)

            return

        res, pid = novnc.launch_novnc(agent_id, web_port, host_port)
        if res:

            host = ra.get_hostname()
            uri = ra.create_vnc_uri(host, web_port)

            ra.add_feedback(
                agent_id,
                ra.Status.Ready,
                web_port=web_port,
                uri=uri,
                hostname=host
            )

            ra.db.edit_connection(
                agent_id=agent_id,
                web_port=web_port,
                status=ra.Status.Ready,
                process_id=pid
            )
            save_result(
                agent_id,
                operation_id,
                None,
                data,
                ra.RaUri.RdResults,
                "POST",
                RaValue.RemoteDesktop
            )

        else:

            msg = 'Unable to start noVNC. Agent already in use?'

            error += msg

            ra.add_feedback(
                agent_id,
                ra.Status.Error,
                msg
            )

            ra.db.remove_connection(agent_id=agent_id)

            save_result(
                agent_id,
                operation_id,
                error,
                data,
                ra.RaUri.RdResults,
                "POST",
                RaValue.RemoteDesktop
            )

    else:

        ra.add_feedback(
            agent_id,
            ra.Status.Error,
            message='Agent side error: %s' % error
        )

        ra.db.remove_connection(agent_id=agent_id)

        logger.error(
            '%s - Unable to create remote desktop for agent: %s. '
            'Error: %s' % ('system_user', agent_id, error)
        )

        save_result(
            agent_id,
            operation_id,
            error,
            data,
            ra.RaUri.RdResults,
            "POST",
            RaValue.RemoteDesktop
        )
