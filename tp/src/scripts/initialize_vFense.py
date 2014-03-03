import os
import sys
import re
import pwd
import argparse
import shutil
import signal
import subprocess
from time import sleep
import logging, logging.config

import create_indexes as ci
import nginx_config_creator as ncc
from utils.security import generate_pass
from utils.common import pick_valid_ip_address
from db.client import db_connect, r

from server import hierarchy
from server.hierarchy import *
from server.hierarchy import db as hierarchy_db
from server.hierarchy.manager import Hierarchy
from server.hierarchy.permissions import Permission

from plugins import monit
from plugins import cve
from plugins.cve.cve_parser import load_up_all_xml_into_db
from plugins.cve.bulletin_parser import parse_bulletin_and_updatedb
from plugins.cve.get_all_ubuntu_usns import begin_usn_home_page_processing

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')
RETHINK_PATH = '/opt/TopPatch/rethinkdb/current'
RETHINK_INSTANCES_PATH = '/opt/TopPatch/var/rethinkdb/instances.d'
RETHINK_CONF = '/opt/TopPatch/conf/rethinkdb.conf'
RETHINK_WEB = '/opt/TopPatch/rethinkdb/current/web'
PYTHON_PATH = '/opt/TopPatch/python/current'
REDIS_START = '/opt/TopPatch/tp/src/daemon/redis_init'
REDIS_PID_FILE = '/opt/TopPatch/var/tmp/redis-6379.pid'
RETHINK_PID_FILE = '/opt/TopPatch/var/tmp/rethinkdb.pid'
TOPPATCH_HOME = '/opt/TopPatch/'


if os.getuid() != 0:
    print 'MUST BE ROOT IN ORDER TO RUN'
    sys.exit(1)

parser = argparse.ArgumentParser(description='Initialize vFense Options')
parser.add_argument(
    '--dnsname', dest='dns_name', default=None,
    help='Pass the DNS Name of the patching Server'
)
parser.add_argument(
    '--ipaddress', dest='ip_address', default=pick_valid_ip_address(),
    help='Pass the IP Address of the patching Server'
)
parser.add_argument(
    '--password', dest='admin_password', default=generate_pass(),
    help='Pass the password to use for the admin User. Default is a random generated password'
)
parser.add_argument(
    '--listener_count', dest='listener_count', default=10,
    help='The number of vFense_listener daemons to run at once, cannot surpass 40'
)
parser.add_argument(
    '--web_count', dest='web_count', default=1,
    help='The number of vFense_web daemons to run at once, cannot surpass 40'
)
parser.add_argument(
    '--server_cert', dest='server_cert', default='server.crt',
    help='ssl certificate to use, default is to use server.crt'
)
parser.add_argument(
    '--server_key', dest='server_key', default='server.key',
    help='ssl certificate to use, default is to use server.key'
)
parser.add_argument(
    '--cve-data', dest='cve_data', action='store_true',
    help='Initialize CVE data. This is the default.'
)
parser.add_argument(
    '--no-cve-data', dest='cve_data', action='store_false',
    help='Not to initialize CVE data. This is for testing purposes.'
)
parser.set_defaults(cve_data=True)

args = parser.parse_args()

if args.dns_name:
    url = 'https://%s/packages/' % (args.dns_name)
    nginx_server_name = args.dns_name
else:
    url = 'https://%s/packages/' % (args.ip_address)
    nginx_server_name = args.ip_address

ncc.nginx_config_builder(
    nginx_server_name,
    args.server_cert,
    args.server_key,
    rvlistener_count=int(args.listener_count),
    rvweb_count=int(args.web_count)
)

def initialize_db():
    os.umask(0)
    if not os.path.exists('/opt/TopPatch/var/tmp'):
        os.mkdir('/opt/TopPatch/var/tmp')
    if not os.path.exists('/opt/TopPatch/var/log'):
        os.mkdir('/opt/TopPatch/var/log')
    if not os.path.exists('/opt/TopPatch/var/rethinkdb'):
        os.mkdir('/opt/TopPatch/var/rethinkdb')
    if not os.path.exists('/opt/TopPatch/var/scheduler'):
        os.mkdir('/opt/TopPatch/var/scheduler')
    if not os.path.exists('/opt/TopPatch/var/packages'):
        os.mkdir('/opt/TopPatch/var/packages')
    if not os.path.exists('/opt/TopPatch/logs'):
        os.mkdir('/opt/TopPatch/logs')
    if not os.path.exists('/opt/TopPatch/var/packages/tmp'):
        os.mkdir('/opt/TopPatch/var/packages/tmp', 0773)
    if not os.path.exists('/opt/TopPatch/tp/src/plugins/cve/data/xls'):
        os.makedirs('/opt/TopPatch/tp/src/plugins/cve/data/xls', 0773)
    if not os.path.exists('/opt/TopPatch/tp/src/plugins/cve/data/xml'):
        os.mkdir('/opt/TopPatch/tp/src/plugins/cve/data/xml', 0773)
    if not os.path.exists('/opt/TopPatch/tp/src/plugins/cve/data/html/ubuntu'):
        os.makedirs('/opt/TopPatch/tp/src/plugins/cve/data/html/ubuntu', 0773)
    if not os.path.exists('/usr/lib/libpcre.so.1'):
        os.symlink('/opt/TopPatch/lib/libpcre.so.1', '/usr/lib') 
    if not os.path.exists('/etc/init.d/vFense'):
        subprocess.Popen(
            [
                'ln', '-s',
                '/opt/TopPatch/tp/src/daemon/vFense',
                '/etc/init.d/vFense'
            ],
        )
        subprocess.Popen(
            [
                'update-rc.d', 'vFense',
                'defaults'
            ],
        )
    if not os.path.exists('/etc/init.d/nginx'):
        subprocess.Popen(
            [
                'ln', '-s',
                '/opt/TopPatch/tp/src/daemon/nginx',
                '/etc/init.d/nginx'
            ],
        )
        subprocess.Popen(
            [
                'update-rc.d', 'nginx',
                'defaults'
            ],
        )
    try:
        tp_exists = pwd.getpwnam('toppatch')

    except Exception as e:
        subprocess.Popen(
            [
                'adduser', 'toppatch',
            ],
        )

    os.chdir(RETHINK_PATH)
    rethink_init = subprocess.Popen(['./rethinkdb', 'create',
                                     '-d', RETHINK_INSTANCES_PATH],
                                    stdout=subprocess.PIPE)
    rethink_init.poll()
    rethink_init.wait()
    if rethink_init.returncode == 0:
        rethink_start = subprocess.Popen(['./rethinkdb', '--config-file',
                                          RETHINK_CONF,
                                          '--web-static-directory',
                                          RETHINK_WEB])
        rethink_start.poll()
        completed = True
        sleep(2)
        while not db_connect():
            print 'Sleeping until rethink starts'
            sleep(2)
    else:
        completed = False
        msg = 'Failed during Rethink initialization'
        return(completed, msg)
    if completed:
        conn = r.connect(port=9009)
        r.db_create('toppatch_server').run(conn)
        db = r.db('toppatch_server')
        conn.close()
        ci.initialize_indexes_and_create_tables()
        conn = db_connect()

        hierarchy_db.init()
        Hierarchy.create_customer(
            DefaultCustomer,
            {
                CoreProperty.NetThrottle: '0',
                CoreProperty.CpuThrottle: 'idle',
                CoreProperty.PackageUrl: url
            }
        )
        admin_pass = args.admin_password
        Hierarchy.create_user(
            'admin',
            'TopPatch Admin Account',
            'admin@toppatch.com',
            admin_pass,
            groups=[DefaultGroup.Administrator]
        )

        if args.cve_data:
            print "Updating CVE's..."
            load_up_all_xml_into_db()
            print "Done Updating CVE's..."
            print "Updating Microsoft Security Bulletin Ids..."
            parse_bulletin_and_updatedb()
            print "Done Updating Microsoft Security Bulletin Ids..."
            print "Updating Ubuntu Security Bulletin Ids...( This can take a couple of minutes )"
            begin_usn_home_page_processing(full_parse=True)
            print "Done Updating Ubuntu Security Bulletin Ids..."

        print 'Admin user and password = admin:%s' % (admin_pass)
        agent_pass = generate_pass()
        agent = Hierarchy.create_user(
            'agent',
            'TopPatch Agent Communication Account',
            'admin@toppatch.com',
            agent_pass,
            groups=[DefaultGroup.Administrator]
        )
        print 'Agent user and password = agent:%s' % (agent_pass)

        monit.monit_initialization()

        conn.close()
        completed = True

        msg = 'Rethink Initialization and Table creation is now complete'
        pid = open(RETHINK_PID_FILE, 'r').read()
        if re.search(r'[0-9]+', pid):
            try:
                os.kill(int(pid), signal.SIGTERM)
                os.remove(RETHINK_PID_FILE)
            except Exception as e:
                if e.errno == 3:
                    os.remove(RETHINK_PID_FILE)
            rql_msg = 'Rethink stopped successfully\n'
        else:
            rql_msg = 'Rethink could not be stopped\n'
        print rql_msg

        return completed, msg
    else:
        completed = False
        msg = 'Failed during Rethink startup process'
        return completed, msg


def clean_database(connected):
    os.chdir(RETHINK_PATH)
    completed = True
    rql_msg = None
    msg = None
    if connected:
        pid = open(RETHINK_PID_FILE, 'r').read()
        if re.search(r'[0-9]+', pid):
            try:
                os.kill(int(pid), signal.SIGTERM)
                os.remove(RETHINK_PID_FILE)
            except Exception as e:
                if e.errno == 3:
                    os.remove(RETHINK_PID_FILE)
            rql_msg = 'Rethink stopped successfully\n'
        else:
            rql_msg = 'Rethink couldnt be stopped\n'
    try:
        shutil.rmtree(RETHINK_INSTANCES_PATH)
        msg = 'Rethink instances.d directory removed and cleaned'
    except Exception as e:
        msg = 'Rethink instances.d directory could not be removed'
        completed = False
    if rql_msg and msg:
        msg = rql_msg + msg
    elif rql_msg and not msg:
        msg = rql_msg
    return completed, msg


if __name__ == '__main__':
    conn = db_connect()
    if conn:
        connected = True
        rql_msg = 'Rethink is Running'
    else:
        connected = False
        rql_msg = 'Rethink is not Running'
    print rql_msg
    db_clean, db_msg = clean_database(connected)
    print db_msg
    db_initialized, msg = initialize_db()
    initialized = False
    if db_initialized:
        print 'vFense environment has been succesfully initialized\n'
        subprocess.Popen(
            [
                'chown', '-R', 'toppatch.toppatch', '/opt/TopPatch'
            ],
        )
        subprocess.Popen(
            [
                'chown', '-R', 'root.toppatch', '/opt/TopPatch/sbin/nginx'
            ],
        )

    else:
        print 'vFense Failed to initialize, please contact TopPatch support'
