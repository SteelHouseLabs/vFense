import time

from db.client import *
# import rethinkdb as r
#
#
# def db_connect(host='127.0.0.1', port='9010', db='toppatch_server'):
#     conn = None
#     try:
#         conn = r.connect(host, port, db)
#     except Exception as e:
#         # logger.error(e)
#         pass
#     return conn


class Collection():

    Memory = 'monit_mem'
    Cpu = 'monit_cpu'
    FileSystem = 'monit_fs'


class CollectionKeys():

    Id = 'id'
    Data = 'd'
    Timestamp = 'ts'
    AgentId = 'aid'


class Master():

    MasterDoc = 'master'
    MaxEntriesKey = 'max_entries'
    MaxEntriesValue = '2880'  # Two days worth of data at 1 minutes steps.


@db_create_close
def _get_data_point(agent=None, collection=None, timestamp=None, conn=None):
    """Gets a data point at specified time.

    Args:

        agent: The agent id the data belongs to.

        collection: A monit.Collection type of the data wanted.

        timestamp: The unix timestamp at which to get data at.

    Returns:

        The data point asked for, None otherwise.
    """
    pass


@db_create_close
def _get_data_points_since(agent=None, collection=None, timestamp=None,
                           conn=None):
    """Gets all data points since specified time.

    Args:

        agent: The agent id the data belongs to.

        collection: A monit.Collection type of the data wanted.

        timestamp: The unix timestamp at which to get data at.

    Returns:

        The data points asked for, None otherwise.
    """

    result = list(
        r.table(collection)
        .filter(
            r.js(
                '(function (row) { return row.{} == {} '
                '&& row.{} > {}; })'.format(
                    CollectionKeys.AgentId,
                    agent,
                    CollectionKeys.Timestamp,
                    timestamp
                ))
        )
        .run(conn)
    )

    return result


@db_create_close
def _save_data_point(agent=None, collection=None, data=None, conn=None):
    """Save a data point.

     Args:

        agent: The agent id the data belongs to.

        collection: A monit.Collection type of the data to save.

        data: Basic data type (str, int, list, dict, etc) to save as is.

    Returns:

        True if saved successfully, False otherwise.
    """

    if (
        not agent
        or not collection
        or not data
    ):
        return None

    timestamp = long(time.time())

    point = {}
    point[CollectionKeys.AgentId] = agent
    point[CollectionKeys.Timestamp] = timestamp
    point[CollectionKeys.Data] = data

    result = r.table(collection).insert(point).run(conn)

    if result.get('inserted') and result.get('inserted') > 0:

        return True

    return False


@db_create_close
def monit_initialization(conn=None):

    try:

        r.db('toppatch_server').table_create(Collection.Memory).run(conn)
        master = {
            CollectionKeys.Id: Master.MasterDoc,
            Master.MaxEntriesKey: Master.MaxEntriesValue
        }
        r.table(Collection.Memory).insert(master).run(conn)

    except Exception as e:
        pass

    try:

        r.db('toppatch_server').table_create(Collection.Cpu).run(conn)
        master = {
            CollectionKeys.Id: Master.MasterDoc,
            Master.MaxEntriesKey: Master.MaxEntriesValue
        }
        r.table(Collection.Cpu).insert(master).run(conn)

    except Exception as e:
        pass

    try:
        r.db('toppatch_server').table_create(Collection.FileSystem).run(conn)
        master = {
            CollectionKeys.Id: Master.MasterDoc,
            Master.MaxEntriesKey: Master.MaxEntriesValue
        }
        r.table(Collection.FileSystem).insert(master).run(conn)

    except Exception as e:
        pass
