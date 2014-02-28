from settings import Default
from db.client import *

from plugins.ra.raoperation import RaOperation
from plugins.ra.raoperation import store_in_agent_queue, save_operation
from plugins import ra


@db_create_close
def save_rd_password(
    password=None,
    user=Default.User,
    customer=Default.Customer,
    conn=None
):

    if not password:
        return {
            'pass': False,
            'message': 'No password was provided.'
        }

    all_agents = list(
        r.table("agents")
        .filter({"customer_name": customer})
        .run(conn)
    )

    result = False
    msg = ''
    missed_count = 0
    for agent in all_agents:
        agent_id = agent['agent_id']

        operation = RaOperation(
            ra.RaValue.SetRdPassword,
            agent_id,
            username=user,
            password=password,
            customer=customer,
            uri=ra.RaUri.Password,
            method='POST'
        )

        result = False
        msg = ''
        _id = save_operation(operation)
        if _id:

            operation.operation_id = _id
            store_in_agent_queue(operation)

        else:

            msg = (
                'Unable to process password operation for agent %s.' % agent_id
            )

            missed_count += 1
            logger.error(msg)

    if missed_count == 0:
        result = True
        msg = ''

    else:

        result = False
        msg = (
            'Server was unable to process the password request for: '
            '%s agent(s).'
            'Please check the server logs for more details.' % missed_count
        )

    return {
        'pass': result,
        'message': msg
    }
