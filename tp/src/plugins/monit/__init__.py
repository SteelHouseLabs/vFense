import datetime
import time

from db.client import *

import _db
from _db import Collection, Master, monit_initialization

AgentStatsKey = 'monit_stats'
AgentCollection = 'agents'


class MonitorKey():

    Memory = u'memory'
    FileSystem = u'file_system'
    Cpu = u'cpu'
    Timestamp = u'timestamp'


class Monitor():
    """
    Main monitoring class to manage data.
    """

    @staticmethod
    def save_memory_data(agent=None, data=None):
        """Saves memory data.

        Args:

            agent: The agent id the data belongs to.

            data: Basic data type (str, int, list, dict, etc) to save as is.

            data:
        """

        if not data or not agent:

            return None

        data = Monitor._totalfy(data)

        result = _db._save_data_point(agent=agent, collection=Collection.Memory,
                                      data=data)

        return result

    @staticmethod
    def save_cpu_data(agent=None, data=None):
        """Saves cpu data.

        Args:

            agent: The agent id the data belongs to.

            data: Basic data type (str, int, list, dict, etc) to save as is.
        """

        if not data or not agent:

            return None

        result = _db._save_data_point(agent=agent, collection=Collection.Cpu,
                                      data=data)

        return result


    @staticmethod
    def save_file_system_data(agent=None, data=None):
        """Saves file system data.
        """

        if not data or not agent:

            return None

        new_data = []
        for fs in data:

            new_data.append(Monitor._totalfy(fs))

        result = _db._save_data_point(agent=agent,
                                      collection=Collection.FileSystem,
                                      data=new_data)

        return result

    @staticmethod
    def get_memory_data_since(agent=None, date_time=None):
        """Gets all the memory data.

        Args:

            agent: The agent id the data belongs to.

            date_time: A datetime to get all data since.

        Returns:

            A list of data points. None otherwise.
        """

        if (
            not agent
            or not date_time
            or not isinstance(date_time, datetime.datetime)
        ):

            return None

        timestamp = date_time.strftime('%s')

        return _db._get_data_points_since(agent=agent,
                                          collection=Collection.Memory,
                                          timestamp=timestamp)

    @staticmethod
    def get_cpu_data_since(agent=None, date_time=None):
        """Gets all the cpu data.

        Args:

            agent: The agent id the data belongs to.

            date_time: A datetime to get all data since.

        Returns:

            A list of data points. None otherwise.
        """

        if (
            not agent
            or not date_time
            or not isinstance(date_time, datetime.datetime)
        ):

            return None

        timestamp = date_time.strftime('%s')

        return _db._get_data_points_since(agent=agent,
                                          collection=Collection.Cpu,
                                          timestamp=timestamp)

    @staticmethod
    def get_file_system_data_since(agent=None, date_time=None):
        """Gets all the file system data.

        Args:

            agent: The agent id the data belongs to.

            date_time: A datetime to get all data since.

        Returns:

            A list of data points. None otherwise.
        """

        if (
            not agent
            or not date_time
            or not isinstance(date_time, datetime.datetime)
        ):

            return None

        timestamp = date_time.strftime('%s')

        return _db._get_data_points_since(agent=agent,
                                          collection=Collection.FileSystem,
                                          timestamp=timestamp)

    @staticmethod
    def _totalfy(data):

        try:

            data['total'] = int(data['free']) + int(data['used'])

        except Exception as e:

            data['total'] = 0

        return data

    @staticmethod
    @db_create_close
    def get_agent_memory_stats(agent=None, conn=None):
        """Gets memory stats directly from the agents collection.

        Args:

            agent: Agent id to retrieve stats from.
        """

        if not agent:

            return None

        try:

            stats = (
                r.table(AgentCollection).get(agent).pluck(AgentStatsKey)
                .run(conn)
            )

            stats = stats[AgentStatsKey]

            if stats:

                memory = stats[MonitorKey.Memory]
                memory[MonitorKey.Timestamp] = stats[MonitorKey.Timestamp]

                return memory
        except Exception as e:

            # log here
            pass

        return None

    @staticmethod
    @db_create_close
    def get_agent_cpu_stats(agent=None, conn=None):
        """Gets cpu stats directly from the agents collection.

        Args:

            agent: Agent id to retrieve stats from.
        """

        if not agent:

            return None

        try:


            stats = (
                r.table(AgentCollection).get(agent).pluck(AgentStatsKey)
                .run(conn)
            )

            stats = stats[AgentStatsKey]

            if stats:

                cpu = stats[MonitorKey.Cpu]
                cpu[MonitorKey.Timestamp] = stats[MonitorKey.Timestamp]

                return cpu

        except Exception as e:

            # log here!!
            pass

        return None

    @staticmethod
    @db_create_close
    def get_agent_file_system_stats(agent=None, conn=None):
        """Gets file_system stats directly from the agents collection.

        Args:

            agent: Agent id to retrieve stats from.
        """

        if not agent:

            return None

        try:

            stats = (
                r.table(AgentCollection).get(agent).pluck(AgentStatsKey)
                .run(conn)
            )

            stats = stats[AgentStatsKey]

            if stats:

                fs = []
                for _fs in stats[MonitorKey.FileSystem]:

                    _fs[MonitorKey.Timestamp] = stats[MonitorKey.Timestamp]
                    fs.append(_fs)

                return fs
        except Exception as e:

            # log here
            pass

        return None


def save_monitor_data(agent=None, **kwargs):
    """A catch all function to save monitoring data.

    Parameters are basic data type (str, int, list, dict, etc) to save as is.

    Args:

        agent: The agent id the data belongs to.

        kwargs: Keys corresponding to monitor.MonitorKey

    Returns:

        True if data was saved, False otherwise.
    """

    if not agent:

        return None

    memory = kwargs.get(MonitorKey.Memory)
    fs = kwargs.get(MonitorKey.FileSystem)

    cpu = kwargs.get(MonitorKey.Cpu)

    _mem = None
    _cpu = None
    _fs = None

    if (
        not memory
        and not cpu
        and not fs
    ):
        return None

    result = {}

    if memory:

        _mem = Monitor.save_memory_data(agent, memory)
        result[MonitorKey.Memory] = _mem

    if cpu:

        _cpu = Monitor.save_cpu_data(agent, cpu)
        result[MonitorKey.Cpu] = _cpu

    if fs:

        _fs = Monitor.save_file_system_data(agent, fs)
        result[MonitorKey.FileSystem] = _fs

    return result


def get_monitor_data_since(agent=None, timestamp=None):
    """A catch all function to get all monitoring data.

    Gets the monitoring data since the arguments provided. If all are None,
    then the default of 5 hours is used.

    Args:

        agent: The agent id the data belongs to.

        timestamp: Unix timestamp to get data since.

    Returns:

        A dict with monitor.MonitorKey key. It's possible for values to be None.
    """

    _mem = Monitor.get_memory_data_since()
    _cpu = Monitor.get_cpu_data_since()
    _fs = Monitor.get_file_system_data_since()

    data = {}

    data[MonitorKey.Memory] = _mem
    data[MonitorKey.Cpu] = _cpu
    data[MonitorKey.FileSystem] = _fs

    return data

@db_create_close
def update_agent_monit_stats(agent=None, **kwargs):

    memory = kwargs.get(MonitorKey.Memory)
    cpu = kwargs.get(MonitorKey.Cpu)
    fs = kwargs.get(MonitorKey.FileSystem)

    conn = kwargs.get('conn')

    agent_stats = {}
    stats = {}

    stats['memory'] = Monitor._totalfy(memory)
    stats['cpu'] = cpu

    stats['timestamp'] = int(time.time())

    fs_list = []

    for _fs in fs:

        fs_list.append(Monitor._totalfy(_fs))

    stats['file_system'] = fs_list

    agent_stats[AgentStatsKey] = stats

    r.table(AgentCollection).get(agent).update(agent_stats).run(conn, no_reply=True)


# Monitoring initialization.
#_db.monit_initialization()
