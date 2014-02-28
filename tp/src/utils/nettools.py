#!/usr/bin/env python

import re

from netifaces import interfaces, ifaddresses
import ipaddr


def convert_netmask_to_cidr(netmask):
    """
    Converts a netmask (255.255.255.0) to CIDR notation 24
    """
    count = 0
    for octect in netmask.split('.'):
        octect = int(octect)
        while octect != 0:
            if octect % 2 == 1:
                count = count + 1
            octect = octect / 2
    return count


def get_networks_to_scan():
    """
    This will get every interface on the node that this is running on
    and report back the ip address, netmask, and CIDR in a dictionary
    """
    valid_interfaces = interfaces()[1:]
    network = []
    for interface in valid_interfaces:
        iface = ifaddresses(interface)[2][0]
        addr = iface['addr']
        netmask = iface['netmask']
        cidr = convert_netmask_to_cidr(netmask)
        network.append((addr + '/' + cidr))
    return tuple(network)


def verify_networks(network):
    """
    This method will verify that the ip address or ip and netmask
    is valid as well as check that the ip is not a multicast,
    reserved, local link, or loopback addresses. If this is a valid
    IP or IP/CIDR or IP/NETMASK, this method will return True,
    else False
    """
    network = re.split(r',', re.sub(r',\s+|\s+', ',', network))
    verified = []
    false_count = 0
    is_valid = False
    for net in network:
        try:
            addr = ipaddr.IPv4Network(net)
            if not addr.is_reserved and not addr.is_multicast \
                and not addr.is_loopback and not addr.is_link_local:
                verified.append((net, True))
            else:
                verified.append((net, False))
                false_count = false_count + 1
        except Exception:
            verified.append((net, False))
            false_count = false_count + 1

    if false_count > 0:
        return(verified, is_valid)
    else:
        is_valid = True
        return(verified, is_valid)
