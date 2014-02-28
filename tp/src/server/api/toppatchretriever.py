import json
import logging
import logging.config
#import customers.manager

from logger.rvlogger import RvLogger
#from server.decorators import authenticated_request
from server.handlers import BaseHandler

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

from json import dumps
from db.client import *

conn=db_connect()
k=r.table('unique_applications')
count='default_agents_available_count'

class TopCriticalPatches(BaseHandler):
    def get(self):
        self.set_header('Content-Type', 'application/json')
        l=k.filter({'rv_severity':'Critical'}).filter(r.row['default_agents_available_count'] >0).order_by(r.desc('default_agents_available_count'))
        patchlist=list(l.pluck('name','release_date','default_agents_available_count','rv_severity').limit(10).run(conn))
        patches=[]
        for i in range(len(patchlist)):
            patchlist[i]['count']=patchlist[i].pop(count)
            patches.append(patchlist[i])

        self.write(json.dumps(patches, indent=4))

class TopRecommendedPatches(BaseHandler):
        def get(self):
            self.set_header('Content-Type', 'application/json')
            l=k.filter({'rv_severity':'Recommended'}).filter(r.row['default_agents_available_count'] >0).order_by(r.desc('default_agents_available_count'))
            patchlist=(l.pluck('name','release_date','default_agents_available_count','rv_severity').limit(10).run(conn))
            patches=[]
            for i in range(len(patchlist)):
                patchlist[i]['count']=patchlist[i].pop(count)
                patches.append(patchlist[i])
            self.write(json.dumps(patches, indent=4))

class TopOptionalPatches(BaseHandler):
        def get(self):
            self.set_header('Content-Type', 'application/json')
            l=k.filter({'rv_severity':'Optional'}).filter(r.row['default_agents_available_count'] >0).order_by(r.desc('default_agents_available_count'))
            patchlist=(l.pluck('name','release_date','default_agents_available_count','rv_severity').limit(10).run(conn))
            patches=[]
            for i in range(len(patchlist)):
                patchlist[i]['count']=patchlist[i].pop(count)
                patches.append(patchlist[i])

            self.write(json.dumps(patches, indent=4))

class TopListedPatches(BaseHandler):
    def get(self):
        self.set_header('Content-Type', 'application/json')
        l=k.filter(r.row['default_agents_available_count'] >0).pluck('name','release_date','default_agents_available_count','rv_id').order_by('rv_severity')
        patchlist=(l.limit(10).run(conn))
        patches=[]
        for i in range(len(patchlist)):
            patchlist[i]['count']=patchlist[i].pop(count)
            patches.append(patchlist[i])

        self.write(json.dumps(patches, indent=4))
