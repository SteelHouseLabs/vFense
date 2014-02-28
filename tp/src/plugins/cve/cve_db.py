import sys
import logging
import logging.config
from db.client import db_create_close, r, db_connect
from plugins.cve import *
from plugins.patching import *
from plugins.cve.cve_constants import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('cve')


def get_windows_bulletinid_and_cveids(kb):
    conn = db_connect()
    info = {
        WindowsSecurityBulletinKey.BulletinId: '',
        WindowsSecurityBulletinKey.CveIds: []
    }
    try:
        info = list(
            r
            .table(WindowsSecurityBulletinCollection)
            .get_all(kb, index=WindowsSecurityBulletinIndexes.ComponentKb)
            .pluck(WindowsSecurityBulletinKey.BulletinId, WindowsSecurityBulletinKey.CveIds)
            .run(conn)
        )
        if info:
            if len(info) > 0:
                info = info[0]

        logger.debug('retrieved microsoft bulletin info: %s', info)

    except Exception as e:
        logger.exception(e)

    conn.close()

    return(info)

def get_vulnerability_categories(cve_id):
    conn = db_connect()
    info = []
    try:
        info = (
            r
            .table(CveCollection)
            .get(cve_id)
            .pluck(CveKey.CveCategories)
            .run(conn)
        )
        if info:
            info = info[CveKey.CveCategories]

        logger.debug('retrieved vulnerabilty categories for cve_id: %s', cve_id)

    except Exception as e:
        logger.exception(e)

    conn.close()

    return(info)


def get_ubuntu_cveids(app_name, app_version):
    conn = db_connect()
    info = {
        UbuntuSecurityBulletinKey.BulletinId: '',
        UbuntuSecurityBulletinKey.CveIds: []
    }
    try:
        info = list(
            r
            .table(UbuntuSecurityBulletinCollection)
            .get_all(
                [app_name, app_version],
                index=UbuntuSecurityBulletinIndexes.NameAndVersion
            )
            .pluck(UbuntuSecurityBulletinKey.BulletinId, UbuntuSecurityBulletinKey.CveIds)
            .run(conn)
        )
        if info:
            if len(info) > 1:
                info = info[0]

        logger.debug('retrieved ubuntu bulletin info: %s', info)

    except Exception as e:
        logger.exception(e)

    return(info)


@db_create_close
def insert_into_cve_collection(cve_data, conn=None):
    try:
        inserted = (
            r
            .table(CveCollection)
            .insert(cve_data, upsert=True)
            .run(conn)
        )
        logger.info('cve database updated: %s', inserted)
    except Exception as e:
        logger.exception(e)

@db_create_close
def insert_into_bulletin_collection_for_windows(bulletin_data, conn=None):
    try:
        inserted = (
            r
            .table(WindowsSecurityBulletinCollection)
            .insert(bulletin_data, upsert=True)
            .run(conn)
        )
        logger.info('windows bulletin database updated: %s', inserted)
    except Exception as e:
        logger.exception(e)


@db_create_close
def insert_into_bulletin_collection_for_ubuntu(bulletin_data, conn=None):
    try:
        inserted = (
            r
            .table(UbuntuSecurityBulletinCollection)
            .insert(bulletin_data, upsert=True)
            .run(conn)
        )
        logger.info('ubuntu bulletin database updated: %s', inserted)
    except Exception as e:
        logger.exception(e)



@db_create_close
def update_cve_categories(conn=None):
    try:
        for category in CVE_CATEGORIES:
            updated = (
                r
                .table(CveCollection)
                .filter(
                    lambda x:
                        x[CveKey.CveDescriptions][DESCRIPTION]
                        .contains(lambda x: x.match('(?i)'+category))
                ).update(
                    {
                        CveKey.CveCategories: r.row[CveKey.CveCategories]
                            .set_insert(category)
                    }
                )
                .run(conn)
            )
            logger.info('%s category was added to: %s' % (category, updated))

    except Exception as e:
        logger.exception(e)
