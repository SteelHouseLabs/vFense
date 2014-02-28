import logging
import logging.config

from db.client import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class Collection():
    AuthorizedKeys = 'authorized_keys'


class CollectionKeys():

    AgentId = 'agent_id'
    SshKey = 'ssh_key'


@db_create_close
def tunnels_initialization(conn=None):

    try:

        r.db('toppatch_server').table_create(
            Collection.AuthorizedKeys,
            primary_key=CollectionKeys.AgentId,
        ).run(conn)

    except Exception as e:

        logger.error('Unable to create tunnel tables')
        logger.error(str(e))


@db_create_close
def get_existing_key(agent_id=None, conn=None):
    """Checks if there is an existing key for the agent.

    Args:

        - agent_id: Agent the key belongs to.

    Returns:

        - The agent's key. None otherwise.

    """
    if not agent_id:
        return False

    try:

        result = (
            r.table(Collection.AuthorizedKeys)
            .get(agent_id)
            .run(conn)
        )

        if result:

            return result[CollectionKeys.SshKey]

    except Exception as e:

        logger.error('Unable to verify if key exist.')
        logger.error(str(e))

    return False


@db_create_close
def register_authorized_key(
    agent_id=None,
    key=None,
    force=False,
    conn=None
):
    """Saves the authorized key for agent.

    Args:

        - agent_id: Agent the key belongs to.

        - key: Ssh key to save.

        - force: Force to override an existing key if present.

    Returns:

        - True if the key is saved successfully. False otherwise.

    """

    if(
        not agent_id
        or not key
    ):
        return False

    try:

        upsert = False

        if force:
            upsert = True

        current_key = get_existing_key(agent_id=agent_id)
        logger.error(current_key)
        if current_key == key:
            return False

        elif current_key:
            upsert = True

        data = {
            CollectionKeys.AgentId: agent_id,
            CollectionKeys.SshKey: key
        }

        result = r.table(
            Collection.AuthorizedKeys
        ).insert(data, upsert=upsert).run(conn)

        if(
            result.get('inserted', 0) > 0
            or result.get('replaced', 0) > 0
        ):

            return True

    except Exception as e:

        logger.error('Unable to add authorized key.')
        logger.error(str(e))

    return False
