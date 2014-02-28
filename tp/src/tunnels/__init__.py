import subprocess

from tunnels import _db as db

_sshd_config_path = '/etc/ssh/sshd_config'


db.tunnels_initialization()


class TunnelKey:

    HostPort = 'host_port'
    HostIp = 'host_ip'
    SSHPort = 'ssh_port'


def system_ports_used():
    """Gets system ports that are currently in use.

    Returns:

        - A list of ports as ints being listened on.

    """

    ports = []

    try:

        process = subprocess.Popen(
            ['netstat', '-tln'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        output, errors = process.communicate()

        values = []
        lines = output.splitlines()[2:]
        # 'tcp ' (with trailing space) used to check agains tcp6.
        tcp_lines = [tcp for tcp in lines if tcp.startswith('tcp ')]

        for line in tcp_lines:
            values.append([x for x in line.split(' ') if x != ''])

        for entry in values:

            try:

                address = entry[3]

                port = address.partition(':')[2]

                ports.append(int(port))

            except Exception as e:

                print "Skipping %s." % entry
                print e

    except Exception as e:

        print e

    return ports


def get_available_port(port_range=None, offset=0):

    if not port_range:
        return None

    for p in port_range:

        p += offset

        if p in system_ports_used():
            continue

        return str(p)


def reverse_tunnel_params(preferred_ports=None):
    """Creates reverse tunnel parameters used by the agent.

    Args:

        - preferred_ports: A list of ints representing ports to use in the
            reverse tunnel.

    Returns:

        - A dict with applicable keys of how the agent should crate a reverse
            ssh tunnel.
        - None is returned if error.

    """

    params = {}

    try:

        if not preferred_ports:
            preferred_ports = range(10000, 11000)

        port = get_available_port(preferred_ports)

        if port is None:
            raise Exception(
                "No port in range available. How did this happen...?"
            )

        params[TunnelKey.HostPort] = str(port)
        params[TunnelKey.SSHPort] = ssh_port()

    except Exception as e:

        print e
        params = None

    return params


def ssh_port():

    try:

        with open(_sshd_config_path, 'r') as config:
            output = config.read()

        for line in output.splitlines():

            if line.startswith("Port "):
                split = line.partition(" ")
                if len(split) == 3:
                    return split[2]

    except Exception as e:

        print e

    return ""
