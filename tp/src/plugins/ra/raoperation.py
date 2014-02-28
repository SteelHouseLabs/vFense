import logging
import logging.config

from receiver.rqueuemanager import QueueWorker
from settings import Default
from operations.operation_manager import Operation

from errorz.error_messages import OperationCodes

from plugins import ra
from plugins.ra import DesktopProtocol

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('raapi')


def save_operation(operation):

    _oper = (
        Operation(
            operation.username, operation.customer,
            operation.uri, operation.method
        )
    )

    oper_results = (
        _oper.create_operation(
            operation.operation_type,
            ra.PluginName,
            [operation.agent_id],  # Expecting a list of agent IDs.
            None  # No tag IDs.
        )
    )

    if oper_results['http_status'] == 200:
        operation_id = oper_results['data']['operation_id']

        _oper.add_agent_to_operation(
            operation.agent_id,
            operation_id
        )

        logger.info(
            '%s - %s operation created by user %s' %
            (
                operation.username,
                operation.operation_type,
                operation.username
            )
        )

        return operation_id

    return None


def save_result(
    agent_id,
    operation_id,
    error,
    data,
    uri,
    method,
    operation_type
):
    try:
        operation = Operation(
            Default.User,
            None,
            uri,
            method
        )

        if not error:

            results = operation.update_operation_results(
                operation_id,
                agent_id,
                OperationCodes.ResultsReceived,
                operation_type,
                error
            )

        else:

            results = operation.update_operation_results(
                operation_id,
                agent_id,
                OperationCodes.ResultsReceivedWithErrors,
                operation_type,
                error
            )

        return results

    except Exception as e:

        print e

    return None


def store_in_agent_queue(operation):

    rqueue = QueueWorker(operation.to_dict(), operation.username)
    rqueue.rpush_object_in_queue(message=operation.data)


class RaOperation():

    def __init__(
        self,
        operation_type,
        agent_id,
        username=None,
        customer='default',
        password='',
        uri=None,
        method=None
    ):
        """Creates a RaOperation for the ra plugin.

        Args:

            - operation_type: Specific operation to be performed.

            - agent_id: The ID of the agent to communicate with.

            - username: User performing the operation.

            - customer: Customer for which user is performing the operation.
        """

        self.agent_id = agent_id
        self.username = username
        self.customer = customer
        self.operation_type = operation_type
        self.password = password
        self.uri = uri
        self.method = method
        self.operation_id = ''
        self.plugin = ra.PluginName
        self.data = {}

        self.tunnel_needed = False
        self.host_port = ''
        self.ssh_port = ''

    def set_tunnel(self, host_port, ssh_port):

            self.tunnel_needed = True
            self.host_port = host_port
            self.ssh_port = ssh_port

    def to_dict(self):

        data = {}
        data['protocol'] = DesktopProtocol.Vnc

        if self.password:
            data['password'] = self.password

        if self.tunnel_needed:
            data['tunnel_needed'] = self.tunnel_needed

        if self.host_port:
            data['host_port'] = self.host_port

        if self.ssh_port:
            data['ssh_port'] = self.ssh_port

        d = {
            'operation': self.operation_type,
            'operation_id': self.operation_id,
            'username': self.username,
            'plugin': self.plugin,
            'agent_id': self.agent_id,
            'data': data
        }

        return d
