import os
import logging
import shutil

from OpenSSL import SSL, crypto
from utils.ssltools import *

LOG_DIR = '/opt/TopPatch/var/log'
LOG_FILE = 'server_ssl.log'
TYPE_RSA = crypto.TYPE_RSA
TYPE_DSA = crypto.TYPE_DSA
SERVER_KEY_DIR = '/opt/TopPatch/var/lib/ssl/server/keys/'
SERVER_CSR_DIR = '/opt/TopPatch/var/lib/ssl/server/csr/'
CLIENT_KEY_DIR = '/opt/TopPatch/var/lib/ssl/client/keys/'
CLIENT_CSR_DIR = '/opt/TopPatch/var/lib/ssl/client/csr/'
SERVER_PRIVKEY_NAME  = 'server.key'
SERVER_PUBKEY_NAME   = 'server.cert'
CLIENT_PRIVKEY_NAME  = 'client.key'
CLIENT_PUBKEY_NAME   = 'client.cert'
CA_PRIVKEY_NAME  = 'CA.key'
CA_PUBKEY_NAME   = 'CA.cert'
CA_PKEY = SERVER_KEY_DIR + CA_PRIVKEY_NAME
CA_CERT = SERVER_KEY_DIR + CA_PUBKEY_NAME
TOPPATCH_CA = ('TopPatch Certficate Authority', 'TopPatch',
               'Remediation Vault', 'US', 'NY', 'NYC')
TOPPATCH_SERVER = ('TopPatch Server', 'TopPatch',
                   'Remediation Vault', 'US', 'NY', 'NYC')
TOPPATCH_CLIENT = ('TopPatch Client', 'TopPatch',
                   'Remediation Vault', 'US', 'NY', 'NYC')
EXPIRATION = (0, 60*60*24*365*10)

SERVER_PRIVKEY = SERVER_KEY_DIR + SERVER_PRIVKEY_NAME
SERVER_PUBKEY = SERVER_KEY_DIR + SERVER_PUBKEY_NAME
CLIENT_PRIVKEY = CLIENT_KEY_DIR + CLIENT_PRIVKEY_NAME
CLIENT_PUBKEY = CLIENT_KEY_DIR + CLIENT_PUBKEY_NAME
CA_PRIVKEY = SERVER_KEY_DIR + CA_PRIVKEY_NAME
CA_PUBKEY = SERVER_KEY_DIR + CA_PUBKEY_NAME

if not os.path.exists(LOG_DIR):
    logging.warning('directory %s does not exist. Creating the %s directory now' % (LOG_DIR, LOG_DIR))
    shutil.os.makedirs(LOG_DIR, mode=0755)
    if os.path.exists(LOG_DIR):
        logging.warning('%s was created' % (LOG_DIR))
    else:
        logging.warning('Failed to create %s' % (LOG_DIR))

logger = logging.getLogger('SSL Initialization')
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh = logging.FileHandler(LOG_DIR+'/'+LOG_FILE, mode='a', encoding=None, delay=False)
fh.setLevel(logging.INFO)
fh.setFormatter(formatter)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
ch.setFormatter(formatter)
logger.addHandler(ch)
logger.addHandler(fh)
if not os.path.exists(SERVER_KEY_DIR):
    logger.info('directory %s does not exist. Creating the %s directory now' % (SERVER_KEY_DIR, SERVER_KEY_DIR))
    shutil.os.makedirs(SERVER_KEY_DIR, mode=0755)
    if os.path.exists(SERVER_KEY_DIR):
        logger.info('%s was created' % (SERVER_KEY_DIR))
    else:
        logger.info('Failed to create %s' % (SERVER_KEY_DIR))
    shutil.os.makedirs(CLIENT_KEY_DIR, mode=0755)
    if os.path.exists(CLIENT_KEY_DIR):
        logger.info('%s was created' % (CLIENT_KEY_DIR))
    else:
        logger.info('Failed to create %s' % (CLIENT_KEY_DIR))
file_exists = os.path.exists(SERVER_PRIVKEY)

keys_written = []
if not file_exists:
    logger.info('Creating Certificate Authority and Server Keys')
    ca_pkey = load_private_key(CA_PKEY)
    ca_cert = load_cert(CA_CERT)
    server_pkey = generate_private_key(TYPE_RSA, 2048)
    server_csr = create_cert_request(server_pkey, TOPPATCH_SERVER)
    server_cert = create_signed_certificate(server_csr, (ca_cert, ca_pkey), 1, EXPIRATION, digest="sha512")
    client_pkey = generate_private_key(TYPE_RSA, 2048)
    client_csr = create_cert_request(client_pkey, TOPPATCH_CLIENT)
    client_cert = create_signed_certificate(client_csr, (ca_cert, ca_pkey), 1, EXPIRATION, digest="sha512")
    keys_written.append(save_key(SERVER_KEY_DIR, server_pkey, TYPE_PKEY, name='server'))
    keys_written.append(save_key(SERVER_KEY_DIR, server_cert, TYPE_CERT, name='server'))
    keys_written.append(save_key(SERVER_CSR_DIR, server_csr, TYPE_CSR, name='server'))
    keys_written.append(save_key(CLIENT_KEY_DIR, client_pkey, TYPE_PKEY, name='client'))
    keys_written.append(save_key(CLIENT_CSR_DIR, client_csr, TYPE_CSR, name='client'))
    keys_written.append(save_key(CLIENT_KEY_DIR, client_cert, TYPE_CERT, name='client'))

for certs in keys_written:
    logger.info('%s has been created' % (certs[0]))
logger.info('Server and CA certs have been generated')
