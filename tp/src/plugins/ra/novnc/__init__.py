import os
import subprocess
import time
import signal

import logging
import logging.config

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

websockify_path = os.path.join(os.path.dirname(__file__), 'websockify')

# Directory where vnc.html is located in.
web_dir = '/opt/TopPatch/tp/wwwstatic/js/libs/vnc'

_open_processes = {}


def _add_process(process, agent_id):

    if agent_id not in _open_processes:

        _open_processes[agent_id] = process
        return True

    return False


def stop_novnc(agent_id, pid=None):
    """Stop a currently running novnc instance.

    Args:

        - agent_id: The agent for which the vnc instance should be stopped.
        - pid: Process ID to stop.

    Returns:

        - True is stopped successfully, False otherwise.

    """

    try:

        if pid:

            os.kill(pid, signal.SIGKILL)
            return True

    except Exception as e:

        logger.error(
            'Unable to stop the NoVNC process for agent %s' % agent_id
        )
        logger.error('Exception: %s' % str(e))

    return False


def launch_novnc(agent_id=None, web_port=None, host_port=None):
    """Launch a novnc/websockify instance.

    Websockify does most of the magic converting TCP connections to websockets
    which is then used by JS.

    *Does not check for port usage. If either port is in use, it will fail
    silently.*

    Args:

        - agent_id: Agent for which to lauch vnc for.

        - web_port: Port used to connect to through the web
            broswer (web sockets).

        - host_port: Port which has a VNC server connected to.

    Returns:

        True and the process ID if launched successfully. False otherwise.


    """

    if (
        not agent_id
        or not web_port
        or not host_port
    ):
        return False, None


    result = False
    process_id = None

    cmd = [
        websockify_path,
        '--web',
        web_dir,
        #${CERT:+--cert ${CERT}},
        str(web_port),  # ${PORT}
        'localhost:%s' % host_port,  # ${VNC_DEST}
    ]

    try:

        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(1)

        if process.pid:
            process_id = process.pid
            result = True

    except Exception as e:

        logger.error(
            'Unable to start the NoVNC process for agent %s' % agent_id
        )
        logger.error('Exception: %s' % str(e))

    return result, process_id
