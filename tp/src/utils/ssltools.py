import os
import socket
import logging, logging.config
from datetime import datetime
from OpenSSL import crypto

from db.update_table import *
from db.query_table import *

FILE_TYPE_PEM = crypto.FILETYPE_PEM
DUMP_PKEY = crypto.dump_privatekey
DUMP_CERT = crypto.dump_certificate
DUMP_CERT_REQUEST = crypto.dump_certificate_request
LOAD_PKEY = crypto.load_privatekey
LOAD_CERT = crypto.load_certificate
LOAD_CERT_REQUEST = crypto.load_certificate_request
CLIENT_CSR_DIR = '/opt/TopPatch/var/lib/ssl/client/csr'
CLIENT_KEY_DIR = '/opt/TopPatch/var/lib/ssl/client/keys'
SERVER_KEY_DIR = '/opt/TopPatch/var/lib/ssl/server/keys'
SERVER_CERT = SERVER_KEY_DIR+'/server.cert'
SERVER_PKEY = SERVER_KEY_DIR+'/server.key'
CA_CERT = SERVER_KEY_DIR+'/CA.cert'
CA_PKEY = SERVER_KEY_DIR+'/CA.key'
EXPIRATION = (0, 60*60*24*365*10)
TYPE_CSR = 1
TYPE_CERT = 2
TYPE_PKEY = 3
EXTENSION = {
            1 : '.csr',
            2 : '.cert',
            3 : '.key'
            }


logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

def load_private_key(privkey=CA_PKEY):
    pkey = LOAD_PKEY(FILE_TYPE_PEM, open(privkey, 'rb').read())
    return pkey


def load_cert(cert=CA_CERT):
    signed_cert = LOAD_CERT(FILE_TYPE_PEM, open(cert, 'rb').read())
    return signed_cert


def dump_pkey(pkey):
    pem_key = DUMP_PKEY(FILE_TYPE_PEM, pkey)
    return pem_key


def dump_cert(cert):
    pem_cert = DUMP_CERT(FILE_TYPE_PEM, cert)
    return pem_cert


def load_cert_request(csr):
    cert_request = LOAD_CERT_REQUEST(FILE_TYPE_PEM, csr)
    return cert_request


def generate_private_key(type, bits):
    pkey = crypto.PKey()
    pkey.generate_key(type, bits)
    return pkey


def save_key(location, key, key_type, name=socket.gethostname()):
    extension = EXTENSION[key_type]
    name = name + extension
    path_to_key = os.path.join(location, name)
    status = False
    if type(key) == crypto.PKeyType:
        DUMP_KEY = DUMP_PKEY
    elif type(key) == crypto.X509Type:
        DUMP_KEY = DUMP_CERT
    elif type(key) == crypto.X509ReqType:
        DUMP_KEY = DUMP_CERT_REQUEST
    try:
        os.stat(location)
    except OSError as e:
        if e.errno == 2:
            logger.error('%s - ssl directory %s does not exists' %\
                    ('system_user', location)
                    )
        elif e.errno == 13:
            logger.error('%s - Do not have permission to write to %s' %\
                    ('system_user', location)
                    )
    try:
        file_exists = os.stat(path_to_key)
        if file_exists:
            logger.warn('%s - File %s already exists' %\
                    ('system_user', path_to_key))
    except OSError as e:
        if e.errno == 2:
            open(path_to_key, 'w').write(\
                    DUMP_KEY(FILE_TYPE_PEM, key)
                    )
            status = True
            logger.error('%s - Writing ssl cert to %s ' %\
                    ('system_user', location)
                    )
        elif e.errno == 13:
            logger.error('%s - Do not have permission to write to %s' %\
                    ('system_user', location)
                    )
    return(path_to_key, name, status)


def create_cert_request(pkey, (CN, O, OU, C, ST, L), digest="sha512"):
    csr = crypto.X509Req()
    csr.set_version(3)
    subj = csr.get_subject()
    subj.CN=CN
    subj.O=O
    subj.OU=OU
    subj.C=C
    subj.ST=ST
    subj.L=L
    csr.set_pubkey(pkey)
    csr.sign(pkey, digest)
    return csr


def create_certificate(cert, (issuerCert, issuerKey), serial,\
        (notBefore, notAfter), digest="sha512"):
    cert = crypto.X509()
    cert.set_version(3)
    cert.set_serial_number(serial)
    cert.gmtime_adj_notBefore(notBefore)
    cert.gmtime_adj_notAfter(notAfter)
    cert.set_issuer(issuerCert.get_subject())
    cert.set_subject(csr.get_subject())
    cert.set_pubkey(csr.get_pubkey())
    cert.sign(issuerKey, digest)
    return cert


def create_signed_certificate(csr, (issuerCert, issuerKey), serial,\
        (notBefore, notAfter), digest="sha512"):
    cert = crypto.X509()
    cert.set_version(3)
    cert.set_serial_number(serial)
    cert.gmtime_adj_notBefore(notBefore)
    cert.gmtime_adj_notAfter(notAfter)
    cert.set_issuer(issuerCert.get_subject())
    cert.set_subject(csr.get_subject())
    cert.set_pubkey(csr.get_pubkey())
    cert.sign(issuerKey, digest)
    return cert


def create_signing_certificate_authority(pkey, serial,\
        (CN, O, OU, C, ST, L),
        (notBefore, notAfter),
        digest="sha512"):
    ca = crypto.X509()
    ca.set_version(3)
    subj = ca.get_subject()
    subj.CN=CN
    subj.O=O
    subj.OU=OU
    subj.C=C
    subj.ST=ST
    subj.L=L
    ca.set_serial_number(serial)
    ca.gmtime_adj_notBefore(notBefore)
    ca.gmtime_adj_notAfter(notAfter)
    ca.set_issuer(ca.get_subject())
    ca.set_pubkey(pkey)
    ca.add_extensions([
        crypto.X509Extension("basicConstraints", True,"CA:TRUE, pathlen:0"),
        crypto.X509Extension("keyUsage", True,"keyCertSign, cRLSign"),
        crypto.X509Extension("subjectKeyIdentifier", False, "hash",subject=ca),
        ])
    ca.sign(pkey, digest)
    return ca


def verify_valid_format(data, ssl_type):
    verified = True
    error = None
    if ssl_type == TYPE_CSR:
        try:
            LOAD_CERT_REQUEST(FILE_TYPE_PEM, data)
        except Exception as e:
            error =  'INVALID CSR'
            verified = False
    if ssl_type == TYPE_CERT:
        try:
            LOAD_CERT(FILE_TYPE_PEM, data)
        except Exception as e:
            error =  'INVALID CERT'
            verified = False
    if ssl_type == TYPE_PKEY:
        try:
            LOAD_PKEY(FILE_TYPE_PEM, data)
        except Exception as e:
            error =  'INVALID PKEY'
            verified = False
    return(verified, error)


def store_csr(session, ip, pem):
    csr = load_cert_request(pem)
    csr_path, csr_name, csr_error = \
        save_key(CLIENT_CSR_DIR, csr, TYPE_CSR, name=ip)
    csr_row = add_csr(session, ip, csr_path, csr_name)
    return(csr, csr_path, csr_name, csr_row)


def sign_cert(session, csr):
    ca_cert = load_cert()
    ca_pkey = load_private_key()
    client_cert = create_signed_certificate(csr,
        (ca_cert, ca_pkey), 1, EXPIRATION)
    return(client_cert)


def store_cert(session, ip, cert):
    expiration = get_expire_from_cert(cert.get_notAfter())
    csr = csr_exists(session, ip)
    cert_path, cert_name, cert_error = \
        save_key(CLIENT_KEY_DIR, cert, TYPE_CERT, name=ip)
    node = add_node(session, client_ip=ip)
    cert_row = add_cert(session, node.id, csr.id,
        cert_name, cert_path, expiration)
    csr.is_csr_signed = True
    csr.csr_signed_date = datetime.now()
    session.commit()
    return(node, cert_path)


