import logging

from operations.operation_manager import Operation
from operations import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

#process that data!!


def process_queue_data(rqueue, queue_exists, agent_id,
                       username, customer_name, uri, method):
    if queue_exists:
        agent_queue = rqueue.get_all_objects_in_queue()
        for operation in agent_queue:
            if operation.get(OperationKey.OperationId):
                oper = (
                    Operation(username, customer_name, uri, method)
                )
                oper.update_operation_pickup_time(
                    operation[OperationKey.OperationId], agent_id,
                    CHECKIN
                )

        return agent_queue

    else:
        return([])
