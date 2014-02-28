from copy import deepcopy
import logging
from hashlib import sha256
from db.client import db_create_close, r
from server.hierarchy import api

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class Hardware():

    def _build_hw_id(self, agent_id, hw_name):
        hw_id_to_be_hashed = (
            agent_id.encode('utf-8') + hw_name.encode('utf-8')
        )
        return(sha256(hw_id_to_be_hashed).hexdigest())

    def add(self, agent_id=None, hardware=None,
            created_by='system_user',
            added_by='agent'):

        added = False
        print hardware
        if agent_id and hardware:
            hwlist = []
            if isinstance(hardware, dict):
                for hwtype in hardware.keys():
                    hwinfo = {}
                    hwinfo['agent_id'] = agent_id
                    hwinfo['type'] = hwtype
                    hwinfo['created_by'] = created_by
                    hwinfo['added_by'] = added_by
                    if hwtype != 'memory':
                        for info in hardware[hwtype]:
                            custominfo = deepcopy(hwinfo)
                            for key, val in info.items():
                                custominfo[key] = val
                            hwlist.append(custominfo)

                    else:
                        custominfo = deepcopy(hwinfo)
                        custominfo['total_memory'] = hardware[hwtype]
                        custominfo['name'] = hwtype
                        hwlist.append(custominfo)

                if hwlist:
                    added, msg = (
                        self._insert_into_db(
                            hwinfo=hwlist,
                            added_by=added_by,
                            agent_id=agent_id
                        )
                    )

            else:
                hardware['agent_id'] = agent_id
                hardware['created_by'] = created_by
                hardware['added_by'] = added_by
                hwlist.append(hardware)
                added, msg = (
                    self._insert_into_db(
                        hwinfo=hardware,
                        added_by=added_by,
                        agent_id=agent_id
                    )
                )

        return(
            {
                'pass': added,
                'message': msg,
                'data': []
            }
        )

    @db_create_close
    def _insert_into_db(self, hwinfo=None, added_by='agent',
                        agent_id=None, conn=None):
        table = 'hardware_per_agent'
        added = True
        msg = ''
        logger.info(hwinfo)
        if hwinfo:
            try:
                if added_by == 'agent':
                    (
                        r
                        .table(table)
                        .get_all(agent_id, index='agent_id')
                        .filter({'added_by': added_by})
                        .delete()
                        .run(conn)
                    )

                for hw in hwinfo:

                    (
                        r
                        .table(table)
                        .insert(hw, upsert=True)
                        .run(conn)
                    )
                msg = 'hardware added: %s' % (hwinfo)
                logger.info(msg)

            except Exception as e:
                added = False
                msg = (
                    'Failed to add hardware: %s and %s' %
                    (hwinfo, e)
                )
                logger.exception(msg)

        return(added, msg)

    @db_create_close
    def delete(self, agent_id=None, name=None, conn=None):
        if agent_id and name:
            try:
                (
                    r
                    .table(table)
                    .get_all(hwinfo['agent_id'], index='agent_id')
                    .filter({'name': name})
                    .delete()
                    .run(conn)
                )

                msg = 'hardware deleted: %s' % (hwinfo)
                logger.info(msg)

            except Exception as e:
                added = False
                msg = (
                    'Failed to delete hardware: %s and %s' &
                    (hwinfo, e)
                )
                logger.exception(msg)

        return(added, msg)

