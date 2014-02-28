import tornado.httpserver
import tornado.web

try: import simplejson as json
except ImportError: import json

import logging
import logging.config
from models.application import *
from server.decorators import authenticated_request
from server.handlers import BaseHandler, LoginHandler
from models.base import Base
from models.packages import *
from models.node import *
from models.ssl import *
from models.scheduler import *
from db.client import *
from scheduler.jobManager import job_lister, remove_job
from scheduler.timeBlocker import *
from tagging.tagManager import *
from search.search import *
from utils.common import *
from packages.pkgManager import *
from node.nodeManager import *
from transactions.transactions_manager import *
from logger.rvlogger import RvLogger
from wol.wol import *
from sqlalchemy import distinct, func
from sqlalchemy.orm import sessionmaker, class_mapper

from jsonpickle import encode

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class ModifyDisplayNameHandler(BaseHandler):
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        self.session = self.application.session
        self.session = validate_session(self.session)
        nodeid = self.get_argument('nodeid', None)
        displayname = self.get_argument('displayname', None)
        if nodeid and displayname:
            result = change_display_name(self.session, nodeid=nodeid,
                displayname=displayname, username=username)
        else:
            result = {
                    "pass" : False,
                    "message" : "Insufficient arguments"
                    }
        self.session.close()
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))


class ModifyHostNameHandler(BaseHandler):
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        self.session = self.application.session
        self.session = validate_session(self.session)
        nodeid = self.get_argument('nodeid', None)
        hostname = self.get_argument('hostname', None)
        if nodeid and hostname:
            result = change_host_name(self.session, nodeid=nodeid,
                hostname=hostname, username=username)
        else:
            result = {
                    "pass" : False,
                    "message" : "Insufficient arguments"
                    }
        self.session.close()
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))


class NodeCleanerHandler(BaseHandler):
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        self.session = self.application.session
        self.session = validate_session(self.session)
        nodeid = self.get_argument('nodeid', None)
        if nodeid:
            result = node_remover(self.session, node_id=nodeid,
                    certs=False, just_clean_and_not_delete=True
                    )
        else:
            result = {
                'pass': False,
                'message': 'Incorrect argument passed. %s' %
                    ('Arguments needed are: nodeid')
                }
        self.session.close()
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))


class NodeRemoverHandler(BaseHandler):
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        self.session = self.application.session
        self.session = validate_session(self.session)
        nodeid = self.get_argument('nodeid', None)
        if nodeid:
            result = node_remover(self.session, node_id=nodeid,
                    certs=True, just_clean_and_not_delete=False
                    )
        else:
            result = {
                'pass': False,
                'message': 'Incorrect argument passed. %s' %
                    ('Arguments needed are: nodeid')
                }
        self.session.close()
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))


class NodeTogglerHandler(BaseHandler):
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        self.session = self.application.session
        self.session = validate_session(self.session)
        userlist = self.session.query(User).all()
        nodeid = self.get_argument('nodeid', None)
        toggle = self.get_argument('toggle', None)
        if toggle and nodeid:
            toggle = return_bool(toggle)
            result = node_toggler(self.session, nodeid=nodeid,
                    toggle=toggle, username=username)
        else:
            return({
                'pass': False,
                'message': 'Incorrect Parameters passed. %s %s' %
                        ('Correct Parameters are:',
                         'nodeid and toggle'
                         )
                })
        self.session.close()
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))


class NodesHandler(BaseHandler):
    @authenticated_request
    def get(self):
        resultjson = []
        username = self.get_current_user()
        self.session = self.application.session
        self.session = validate_session(self.session)
        node_id = self.get_argument('id', None)
        queryCount = self.get_argument('count', 10)
        queryOffset = self.get_argument('offset', 0)
        total_count = self.session.query(NodeInfo).count()
        filter_by_tags = self.get_argument('filterby', None)
        filter_by_os = self.get_argument('by_os', None)
        filter_by_platform = self.get_argument('by_platform', None)
        filter_by_bit_type = self.get_argument('by_bit_type', None)
        is_vm = self.get_argument('is_vm', False)
        query = None
        if filter_by_tags:
            query = self.session.query(NodeInfo, SystemInfo, NodeStats).\
                    join(SystemInfo, NodeStats,TagsPerNode, TagInfo).\
                    filter(TagInfo.tag == filter_by_tags).\
                    limit(queryCount).offset(queryOffset)
        elif filter_by_os:
            query = self.session.query(NodeInfo, SystemInfo, NodeStats).\
                    join(SystemInfo, NodeStats).\
                    filter(SystemInfo.os_string == filter_by_os).\
                    limit(queryCount).offset(queryOffset)
        elif filter_by_platform:
            query = self.session.query(NodeInfo, SystemInfo, NodeStats).\
                    join(SystemInfo, NodeStats).\
                    filter(SystemInfo.os_code == filter_by_platform).\
                    limit(queryCount).offset(queryOffset)
        elif filter_by_bit_type:
            query = self.session.query(NodeInfo, SystemInfo, NodeStats).\
                    join(SystemInfo, NodeStats).\
                    filter(SystemInfo.bit_type == filter_by_bit_type).\
                    limit(queryCount).offset(queryOffset)
        elif is_vm:
            query = self.session.query(NodeInfo, SystemInfo, NodeStats).\
                    join(SystemInfo, NodeStats).\
                    filter(NodeInfo.is_vm == True).\
                    limit(queryCount).offset(queryOffset)
        else:
            query = self.session.query(NodeInfo, SystemInfo, NodeStats).\
                    join(SystemInfo, NodeStats).limit(queryCount).\
                    offset(queryOffset)
        if node_id:
            for node_info in self.session.query(NodeInfo, SystemInfo).\
                    filter(SystemInfo.node_id == node_id).\
                    join(SystemInfo).all():
                installed = []
                failed = []
                pending = []
                available = []
                net = []
                network = self.session.query(NetworkInterface).\
                    filter(NetworkInterface.node_id == node_id).all()
                if len(network) >=1:
                    for net_info in network:
                        net.append({
                                'interface_name': net_info.interface,
                                'mac': net_info.mac_address,
                                'ip': net_info.ip_address
                                })
                for pkg in self.session.query(PackagePerNode, Package).\
                        join(Package).filter(PackagePerNode.node_id \
                        == node_info[1].node_id).all():
                    if pkg[0].installed:
                        installed.append({'name': pkg[1].name,
                            'id': pkg[0].toppatch_id,
                            'severity': pkg[1].severity
                            })
                    elif pkg[0].pending:
                        pending.append({'name': pkg[1].name,
                            'id': pkg[0].toppatch_id,
                            'severity': pkg[1].severity
                            })
                    elif pkg[0].attempts > 0:
                        failed.append({'name': pkg[1].name,
                            'id': pkg[0].toppatch_id,
                            'severity': pkg[1].severity
                            })
                        available.append({'name': pkg[1].name,
                            'id': pkg[0].toppatch_id,
                            'severity': pkg[1].severity
                            })
                    else:
                        available.append({'name': pkg[1].name,
                            'id': pkg[0].toppatch_id,
                            'severity': pkg[1].severity
                            })
                tags = map(lambda x: x[1].tag,
                        self.session.query(TagsPerNode, TagInfo).\
                                join(TagInfo).\
                                filter(TagsPerNode.node_id == \
                                node_info[1].node_id).all()
                                )
                resultjson = {'ip': node_info[0].ip_address,
                              'host/name': node_info[0].host_name,
                              'display/name': node_info[0].display_name,
                              'computer/name': node_info[0].computer_name,
                              'host/status': node_info[0].host_status,
                              'agent/status': node_info[0].agent_status,
                              'is_vm': node_info[0].is_vm,
                              'networking': net,
                              'reboot': node_info[0].reboot,
                              'id': node_info[1].node_id,
                              'tags': tags,
                              'os/name':node_info[1].os_string,
                              'os_code': node_info[1].os_code,
                              'patch/need': available,
                              'patch/done': installed,
                              'patch/fail': failed,
                              'patch/pend': pending
                               }
            if len(resultjson) == 0:
                resultjson = {'error' : 'no data to display'}
        else:
            data = []
            count = 0
            for node_info in query:
                resultnode = {'ip': node_info[0].ip_address,
                              'hostname': node_info[0].host_name,
                              'displayname': node_info[0].display_name,
                              'computer/name': node_info[0].computer_name,
                              'is_vm': node_info[0].is_vm,
                              'host/status': node_info[0].host_status,
                              'agent/status': node_info[0].agent_status,
                              'reboot': node_info[0].reboot,
                              'id': node_info[1].node_id,
                              'os/name':node_info[1].os_string,
                              'patch/need': node_info[2].patches_available,
                              'patch/done': node_info[2].patches_installed,
                              'patch/fail': node_info[2].patches_failed,
                              'patch/pend': node_info[2].patches_pending
                               }
                data.append(resultnode)
            resultjson = {"count": total_count, "nodes": data}
        self.session.close()
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(resultjson, indent=4))



class NodeWolHandler(BaseHandler):
    @authenticated_request
    def post(self):
        username = self.get_current_user()
        session = self.application.session
        session = validate_session(session)
        list_of_nodes = self.get_arguments('nodes')
        if (list_of_nodes) >0:
            result = wake_up_nodes(session,
                    node_list=list_of_nodes
                    )
        else:
            result = {
                'pass': False,
                'message': 'Incorrect argument passed. %s' %
                    ('Arguments needed are: nodeid')
                }
        self.session.close()
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(result, indent=4))

