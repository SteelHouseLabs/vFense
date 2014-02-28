from agent import *
import logging
from datetime import datetime
from time import mktime
from json import dumps
from db.client import db_create_close, r, db_connect
from db.hardware import Hardware
from errorz.error_messages import AgentResults, GenericResults
from plugins.patching import *
from server.hierarchy import Collection, api
import redis
from rq import Queue

rq_host = 'localhost'
rq_port = 6379
rq_db = 0
rq_pool = redis.StrictRedis(host=rq_host, port=rq_port, db=rq_db)
logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


@db_create_close
def get_production_levels(conn=None):
    data = []
    try:
        data = (
            r
            .table(AgentsCollection)
            .pluck(AgentKey.ProductionLevel)
            .distinct()
            .map(lambda x: x[AgentKey.ProductionLevel])
            .run(conn)
        )
    except Exception as e:
        logger.exception(e)

    return(data)


def get_supported_os_codes():
    oses = ['windows', 'linux', 'darwin']
    return(oses)


@db_create_close
def get_supported_os_strings(conn=None):
    data = []
    try:
        data = (
            r
            .table(AgentsCollection)
            .pluck(AgentKey.OsString)
            .distinct()
            .map(lambda x: x[AgentKey.OsString])
            .run(conn)
        )
    except Exception as e:
        logger.exception(e)

    return(data)


@db_create_close
def get_agents_info(customer_name=None, agent_os=None,
                    keys_to_pluck=None, conn=None):

    if agent_os and not keys_to_pluck and not customer_name:
        agents = list(
            r
            .table(AgentsCollection)
            .filter({AgentKey.OsCode: agent_os})
            .run(conn)
        )

    elif agent_os and keys_to_pluck and not customer_name:
        agents = list(
            r
            .table(AgentsCollection)
            .filter({AgentKey.OsCode: agent_os})
            .pluck(keys_to_pluck)
            .run(conn)
        )

    elif not agent_os and keys_to_pluck and not customer_name:
        agents = list(
            r
            .table(AgentsCollection)
            .pluck(keys_to_pluck)
            .run(conn)
        )
    elif agent_os and not keys_to_pluck and customer_name:
        agents = list(
            r
            .table(AgentsCollection)
            .get_all(customer_name, index=AgentIndexes.CustomerName)
            .filter({AgentKey.OsCode: agent_os})
            .map(lambda x: x[AgentKey.AgentId])
            .run(conn)
        )

    elif agent_os and keys_to_pluck and not customer_name:
        agents = list(
            r
            .table(AgentsCollection)
            .filter({AgentKey.OsCode: agent_os})
            .pluck(keys_to_pluck)
            .run(conn)
        )

    elif not agent_os and keys_to_pluck and not customer_name:
        agents = list(
            r
            .table(AgentsCollection)
            .pluck(keys_to_pluck)
            .run(conn)
        )

    return(agents)


@db_create_close
def get_agent_info(agentid, keys_to_pluck=None, conn=None):
    if not keys_to_pluck:
        agent_info = (
            r
            .table(AgentsCollection)
            .get(agentid)
            .run(conn)
        )

    else:
        agent_info = (
            r
            .table(AgentsCollection)
            .get(agentid)
            .pluck(keys_to_pluck)
            .run(conn)
        )

    return(agent_info)


@db_create_close
def get_all_agent_ids(customer_name=None, agent_os=None, conn=None):
    if not customer_name and agent_os:
        agent_ids = list(
            r
            .table(AgentsCollection)
            .filter({AgentKey.OsCode: agent_os})
            .map(lambda x: x[AgentKey.AgentId])
            .run(conn)
        )

    elif customer_name and agent_os:
        agent_ids = list(
            r
            .table(AgentsCollection)
            .get_all(customer_name, index=AgentIndexes.CustomerName)
            .filter({AgentKey.OsCode: agent_os})
            .map(lambda x: x[AgentKey.AgentId])
            .run(conn)
        )

    elif customer_name and not agent_os:
        agent_ids = list(
            r
            .table(AgentsCollection)
            .get_all(customer_name, index=AgentIndexes.CustomerName)
            .map(lambda x: x[AgentKey.AgentId])
            .run(conn)
        )

    else:
        agent_ids = list(
            r
            .table(AgentsCollection)
            .map(lambda x: x[AgentKey.AgentId])
            .run(conn)
        )

    return(agent_ids)


@db_create_close
def update_agent_field(agentid, field, value, username,
                       uri=None, method=None, conn=None):
    try:
        agent_info = get_agent_info(agentid)
        if agent_info:
            (
                r
                .table(AgentsCollection)
                .get(agentid)
                .update(
                    {
                        field: value
                    }
                )
                .run(conn)
            )
            status = (
                GenericResults(
                    username, uri, method
                ).object_updated(agentid, 'agent', {field: value})
            )

        else:
            status = (
                GenericResults(
                    username, uri, method
                ).invalid_id(agentid, 'agent')
            )

    except Exception as e:
        status = (
            GenericResults(
                username, uri, method
            ).something_broke(agentid, 'agent', e)
        )

        logger.exception(status)

    return(status)


@db_create_close
def update_agent_fields(agentid, agent_data, username,
                        uri=None, method=None, conn=None):
    try:
        agent_info = get_agent_info(agentid)
        if agent_info:
            (
                r
                .table(AgentsCollection)
                .get(agentid)
                .update(agent_data)
                .run(conn)
            )
            status = (
                GenericResults(
                    username, uri, method
                ).object_updated(agentid, 'agent', agent_data)
            )
            logger.info(status['message'])

        else:
            status = (
                GenericResults(
                    username, uri, method
                ).invalid_id(agentid, 'agent')
            )
            logger.info(status['message'])

    except Exception as e:
        status = (
            GenericResults(
                username, uri, method
            ).something_broke(agentid, 'agent', e)
        )
        logger.error(status['message'])

    return(status)


def update_agent_status(agentid, username, uri=None, method=None):
    try:
        conn = db_connect()
        update_status = {
            AgentKey.LastAgentUpdate: r.epoch_time(
                mktime(
                    datetime.now()
                    .timetuple()
                )
            ),
            AgentKey.AgentStatus: 'up'
        }
        exists =  (
            r
            .table(AgentsCollection)
            .get(agentid)
            .run(conn)
        )
        if exists:
            (
                r
                .table(AgentsCollection)
                .get(agentid)
                .update(update_status)
                .run(conn)
            )
            status = (
                GenericResults(
                    username, uri, method
                ).object_updated(agentid, 'agent', update_status)
            )
        else:
            status = (
                GenericResults(
                    username, uri, method
                ).does_not_exists(agentid, 'agent')
            )

        logger.info(status['message'])
        conn.close()

    except Exception as e:
        status = (
            GenericResults(
                username, uri, method
            ).something_broke(agentid, 'agent', e)
        )

        logger.exception(e)


@db_create_close
def add_agent(username, customer_name, uri, method,
              system_info, hardware, conn=None):
    """Add a node to the database"""
    try:
        agent_data = {}
        agent_data[AgentKey.AgentStatus] = 'up'
        agent_data[AgentKey.MachineType] = 'physical'
        agent_data[AgentKey.Tags] = []
        agent_data[AgentKey.NeedsReboot] = 'no'
        agent_data[AgentKey.DisplayName] = None
        agent_data[AgentKey.HostName] = None
        agent_data[AgentKey.CustomerName] = customer_name
        agent_data[AgentKey.Hardware] = hardware

        if not AgentKey.ProductionLevel in system_info:
            agent_data[AgentKey.ProductionLevel] = 'Production'

        if customer_name != 'default':
            cexists = (
                r
                .table(Collection.Customers)
                .get(agent_data[AgentKey.CustomerName])
                .run(conn)
            )

            if not cexists and len(customer_name) >= 1:
                api.Customer.create(customer_name, username)

        for key, value in system_info.items():
            agent_data[key] = value

        agent_data[AgentKey.LastAgentUpdate] = (
            r.epoch_time(mktime(datetime.now().timetuple()))
        )

        agent_added = (
            r
            .table(AgentsCollection)
            .insert(agent_data)
            .run(conn)
        )

        if 'inserted' in agent_added:
            if agent_added['inserted'] > 0:
                agent_id = agent_added['generated_keys'][0]
                Hardware().add(agent_id, agent_data[AgentKey.Hardware])
                data = {
                    AgentKey.AgentId: agent_id,
                    AgentKey.CustomerName: agent_data[AgentKey.CustomerName],
                    AgentKey.ComputerName: agent_data[AgentKey.ComputerName],
                    AgentKey.Hardware: agent_data[AgentKey.Hardware],
                    AgentKey.Tags: agent_data[AgentKey.Tags],
                    AgentKey.OsCode: agent_data[AgentKey.OsCode],
                    AgentKey.OsString: agent_data[AgentKey.OsString],
                }

                status = (
                    AgentResults(
                        username, uri, method
                    ).new_agent(agent_id, data)
                )

                logger.info(status['message'])

            else:
                status = (
                    GenericResults(
                        username, uri, method
                    ).something_broke(agentid, 'agent', agent_added)
                )

                logger.info(status['message'])

    except Exception as e:
        status = (
            GenericResults(
                username, uri, method
            ).something_broke('new agent', 'agent', e)
        )

        logger.exception(status['message'])

    return(status)


@db_create_close
def update_agent(username, customer_name, uri, method,
                 agent_id, system_info, hardware,
                 rebooted, conn=None):
    """Add a node to the database"""
    agent_data = {}

    try:
        agent_orig_info = (
            r
            .table(AgentsCollection)
            .get(agent_id)
            .run(conn)
        )
        if agent_orig_info:
            agent_data[AgentKey.Hardware] = hardware

            for key, value in system_info.items():
                agent_data[key] = value

            agent_data[AgentKey.LastAgentUpdate] = (
                r.epoch_time(mktime(datetime.now().timetuple()))
            )
            agent_data[AgentKey.HostName] = (
                agent_orig_info.get(AgentKey.HostName, None)
            )
            agent_data[AgentKey.DisplayName] = (
                agent_orig_info.get(AgentKey.DisplayName, None)
            )

            if rebooted == 'yes':
                agent_data[AgentKey.NeedsReboot] = 'no'

            (
                r
                .table(AgentsCollection)
                .get(agent_id)
                .update(agent_data)
                .run(conn)
            )
            Hardware().add(agent_id, hardware)
            status = (
                AgentResults(
                    username, uri, method
                ).startup(agent_id, agent_data)
            )

            logger.info(status)

        else:
            status = (
                AgentResults(
                    username, uri, method
                ).startup_failed()
            )
            logger.warn(status)

    except Exception as e:
        status = (
            GenericResults(
                username, uri, method
            ).something_broke(agent_id, 'startup', e)
        )

        logger.exception(status)

    return(status)
