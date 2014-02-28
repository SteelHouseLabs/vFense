import time
from datetime import datetime, timedelta

from plugins.monit import Monitor, MonitorKey, get_monitor_data_since


def _default_from_date():

    now = datetime.now()

    from_date = now - timedelta(hours=5)

    return from_date


def _latest_time():

    now = datetime.now()

    latest_time = now - timedelta(minutes=2)


def get_memory_latest(agent=None):

    if not agent:

        return {
            'pass': False,
            'message': 'No agent id provided.'
        }

    memory = Monitor.get_memory_data_since(agent, _latest_time())

    results = {}

    if memory:

        results['data'] = memory
        results['pass'] = True
        results['message'] = 'Memory status found.'

    else:

        results['pass'] = False
        results['message'] = 'No memory stats found.'


def get_file_system_latest(agent=None):

    if not agent:

        return {
            'pass': False,
            'message': 'No agent id provided.'
        }

    fs = Monitor.get_file_system_data_since(agent
    )

    results = {}

    if fs:

        results['data'] = fs
        results['pass'] = True
        results['message'] = 'File system stats found.'

    else:

        results['pass'] = False
        results['message'] = 'No file system stats found.'


def get_cpu_latest(agent=None):

    if not agent:

        return {
            'pass': False,
            'message': 'No agent id provided.'
        }

    cpu = Monitor.get_cpu_data_since(agent
    )

    results = {}

    if cpu:

        results['data'] = cpu
        results['pass'] = True
        results['message'] = 'CPU stats found.'

    else:

        results['pass'] = False
        results['message'] = 'No CPU stats found.'


def get_agent_memory_latest(agent=None, conn=None):

    memory = Monitor.get_agent_memory_stats(agent=agent)

    results = {}

    if memory:

        results['data'] = memory
        results['pass'] = True
        results['message'] = 'Memory stats found.'

    else:

        results['pass'] = False
        results['message'] = 'No memory stats found.'

        return results


def get_agent_cpu_latest(agent=None):

    if not agent:

        return {
            'pass': False,
            'message': 'No agent it provided.'
        }

    cpu = Monitor.get_agent_cpu_stats(agent=agent)

    results = {}

    if cpu:

        # Special cpu data
        if cpu.get('user') and cpu.get('system'):
            percent = float(cpu['user']) + float(cpu['system'])
            cpu['used'] = str(percent)
        else:
            cpu['used'] = ''

        results['data'] = cpu
        results['pass'] = True
        results['message'] = 'Cpu stats found.'

    else:

        results['pass'] = False
        results['message'] = 'No cpu stats found.'

    return results


def get_agent_memory_latest(agent=None):

    if not agent:

        return {
            'pass': False,
            'message': 'No agent it provided.'
        }

    memory = Monitor.get_agent_memory_stats(agent=agent)

    results = {}

    if memory:

        results['data'] = memory
        results['pass'] = True
        results['message'] = 'Memory stats found.'

    else:

        results['pass'] = False
        results['message'] = 'No memory stats found.'

    return results


def get_agent_file_system_latest(agent=None):

    if not agent:

        return {
            'pass': False,
            'message': 'No agent it provided.'
        }

    file_system = Monitor.get_agent_file_system_stats(agent=agent)

    results = {}

    if file_system:

        results['data'] = file_system
        results['pass'] = True
        results['message'] = 'File system stats found.'

    else:

        results['pass'] = False
        results['message'] = 'No file system stats found.'

    return results


def get_agent_latest(agent=None):

    if not agent:

        return {
            'pass': False,
            'message': 'No agent it provided.'
        }

    file_system = Monitor.get_agent_file_system_stats(agent=agent)
    cpu = Monitor.get_agent_cpu_stats(agent=agent)
    memory = Monitor.get_agent_memory_stats(agent=agent)

    data = {}

    if file_system:

        data[MonitorKey.FileSystem] = file_system

    else:

        data[MonitorKey.FileSystem] = []

    if cpu:

        data[MonitorKey.Cpu] = cpu

    else:

        data[MonitorKey.Cpu] = {}

    if memory:

        data[MonitorKey.Memory] = memory

    else:

        data[MonitorKey.Memory] = {}

    results = {}

    if not file_system and not cpu and not memory:

        results['pass'] = False
        results['message'] = 'No agent stats found.'

    else:

        results['data'] = data
        results['pass'] = True
        results['message'] = 'Agent stats found.'

    return results
