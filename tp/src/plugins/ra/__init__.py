import subprocess
import json
import redis

from plugins.ra import _db as db

PluginName = "ra"

MaxConnections = 3
CurrentConnections = 0

StartPort = 10000
EndPort = 11000

PortRange = range(StartPort, EndPort)

db.ra_initialization()


def session_exist(agent_id):

    conn, session = db.connection_exist(agent_id=agent_id)
    if conn:

        return True, (session[RaKey.Status], session[RaKey.WebPort])

    else:

        return False, None


def get_feedback_channel(agent_id):

    return "%s_%s" % (Channel.Feedback, agent_id)


def add_feedback(
    agent_id,
    status,
    message='',
    web_port='',
    port='',
    uri='',
    hostname=''
):

    redis_client = redis.Redis()

    fb = {
        RaKey.AgentId: agent_id,
        RaKey.Status: status,
        RaKey.Message: message,
        RaKey.WebPort: web_port,
        RaKey.Uri: uri,
        RaKey.Hostname: hostname
    }

    redis_client.publish(
        get_feedback_channel(agent_id),
        json.dumps(fb)
    )


class RaUri():

    StartRemoteDesktop = '/api/ra/rd/%s/'
    StopRemoteDesktop = '/api/ra/rd/%s/'
    Password = '/api/ra/rd/password/'

    RdResults = '/rvl/ra/rd/results'
    PasswordResults = '/rvl/ra/rd/password'


class Channel():

    Feedback = 'ra_feedback'


class Status():

    Waiting = 'waiting'
    Error = 'error'
    Ready = 'ready'
    Closing = 'closing'
    Closed = 'closed'
    Timeout = 'timeout'


class RaKey():

    ReverseTunnel = 'reverse_tunnel'
    AgentId = 'agent_id'
    Status = 'status'
    Message = 'message'
    WebPort = 'web_port'
    Port = 'port'  # Should be an alias to WebPort
    HostPort = 'host_port'
    PublicKey = 'public_key'
    Uri = 'uri'
    Hostname = 'hostname'


class RaValue():

    RemoteDesktop = 'start_remote_desktop'
    StopRemoteDesktop = 'stop_remote_desktop'
    SetRdPassword = 'set_rd_password'


class DesktopProtocol():

    Vnc = 'vnc'


def get_hostname():

    return '127.0.0.1'
    #process = subprocess.Popen(
    #    ['/bin/hostname'],
    #    stdout=subprocess.PIPE,
    #    stderr=subprocess.PIPE
    #)

    #output, error = process.communicate()
    #split_out = output.splitlines()
    #if len(split_out) >= 1:
    #    return split_out[0]


def create_vnc_uri(host, port):

    uri = "ra/%s/%s/vnc.html" % (host, port)

    return uri
