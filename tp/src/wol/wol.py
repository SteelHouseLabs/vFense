from wol_magic import *
from models.node import *
from db.query_table import *


def get_list_of_mac_addresses(session, node_id=None):
    macs = []
    if node_id and session:
        interfaces = session.query(NetworkInterface).\
                filter(NetworkInterface.node_id == node_id).all()
        if len(interfaces) >0:
            for interface in interfaces:
                macs.append(interface.mac_address)
    return macs


def wake_up_node(session, node_list=None):
    if session and len(node_list) > 0:
        for nodes in node_list:
            node = node_exists(session, node_id=nodes)
            if node:
                macs = get_list_of_mac_addresses(session, node_id=node.id)
                for mac in macs:
                    print node.ip_address, node.id, mac
                    send_magic(mac)
        return({
            'pass': True,
            'message': 'WOL Message was sent'
            })
    else:
        return({
            'pass': False,
            'message': 'WOL Message was not sent'
            })

