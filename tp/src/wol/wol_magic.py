import socket
import struct
import sys
import re

# Broadcast regex.
_broregx = r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}'\
          r'(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'
brorex = re.compile(_broregx)


def _is_hexnumber(number):
    """Evalute the string `number` in case that the type
    is not valid the method returns False otherwise True.
    """
    try:
        return bool(int(number, 16))
    except (ValueError, TypeError):
        return False

    
def _strip_separator_from_mac(mac):
    # if is python2, convert to unicode to have
    # the right length in a character context.
    if sys.version_info[0] == 2:
        mac = mac.decode('utf-8')
    if len(mac) == 12:  # is the full mac, without separators.
        return mac
    elif len(mac) == 12 + 5:  # it has a separator (5 separators)
        separator = mac[2]
        return mac.replace(separator, '')
    else:
        raise ValueError('Invalid MAC %s [len %s]' % (mac, len(mac)))



def is_valid_broadcast_ip(broadcast, rex=brorex):
    return bool(not broadcast.startswith('0.') and \
                rex.match(broadcast))


def retrive_MAC_digits(mac):
    """Receives a string representing `mac` address
    with one or none separator for each two digits
    in the hex number.
       
    Valid:  aa:aa:aa:aa:aa:11
            aa-aa-AA-AA-aa-11
            FF@ff@AA@55@aa@11
            aaaaaaaaaa11
    Invalid:
            11:11:11:11-11-11
            11:11:11:111111
            11::11:11:11:11:11

   Return each two digits in a list.
   Raise ValueError in case that the `mac` does
   not fulfill the requirements to be valid.
   """
    try:
        plain_mac = _strip_separator_from_mac(mac)
    except (AttributeError, TypeError): # not a string
        raise ValueError('Invalid MAC %s (not a string)' % mac)
        
    if _is_hexnumber(plain_mac):
        hexpairs = zip(plain_mac[::2],
                       plain_mac[1::2])
        return [''.join(digit) for digit in hexpairs]
    else:
        raise ValueError('Invalid MAC %s' % mac)

        
def send_magic(mac, broadcast='255.255.255.255', dest=None, port=9):
    """Send  a "magic packet" to the given destination mac to wakeup
    the host, if `dest` is not specified then the packet is broadcasted.
    """
    try:
        if not is_valid_broadcast_ip(broadcast):
            raise ValueError('Invalid broadcast %s' % broadcast)
    except TypeError:
        raise ValueError('Invalid broadcast %r' % broadcast)
    mac_digits = retrive_MAC_digits(mac)
    magic_header = struct.pack('6B', *[0xff] * 6)
    magic_body = \
            struct.pack('96B', *[int(d, 16) for d in mac_digits] * 16)
    magicpkt = magic_header + magic_body
    sok = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sok.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    try:
        if dest is None:
            sok.connect((broadcast, port))
        else:
            sok.connect((dest, port))
        sok.send(magicpkt)
    finally:
        sok.close()
