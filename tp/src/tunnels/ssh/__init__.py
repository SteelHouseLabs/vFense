import os

import tunnels

#home = expanduser('~')
#_known_host = home + '/.ssh/known_hosts'
#_authorized_keys = home + '/.ssh/authorized_keys'
_known_host = '/home/toppatch/.ssh/known_hosts'
_authorized_keys = '/home/toppatch/.ssh/authorized_keys'


def add_authorized_key(agent_id, key):

    if tunnels.db.register_authorized_key(
        agent_id=agent_id,
        key=key,
        force=False
    ):

        with open(_authorized_keys, 'a') as hosts:

            hosts.write(key)


def remove_authorized_key(key):

    with open(_authorized_keys, 'r') as hosts:

        keys = hosts.read()
        saved_keys = []

        for k in keys.splitlines():

            if k == key:
                continue

            saved_keys.append(k)

    with open(_known_host, 'w') as hosts:

        for k in saved_keys:
            hosts.write(key)


def create_ssh_dir():

    if not os.path.exists(_known_host):
        os.makedirs(_known_host)


def is_sshd_running():
    """Checks to see if the ssh server (sshd) is running.

    Returns:

        - True if running, False otherwise.

    """
    pass


def start_sshd():
    """Starts the ssh server (sshd).

    Returns:

        - True if started successfully, False otherwise.

    """

    pass


def stop_sshd():
    """Stops the ssh server (sshd).

    Returns:

        - True if stopped successfully, False otherwise.

    """

    pass
