from tunnels import ssh
from plugins import ra


def startup(agent_id, json_operation):

    if ra.RaKey.PublicKey in json_operation:

        ssh.create_ssh_dir()
        ssh.add_authorized_key(agent_id, json_operation[ra.RaKey.PublicKey])


def new_agent(agent_id, json_operation):

    if ra.RaKey.PublicKey in json_operation:

        ssh.create_ssh_dir()
        ssh.add_authorized_key(agent_id, json_operation[ra.RaKey.PublicKey])
