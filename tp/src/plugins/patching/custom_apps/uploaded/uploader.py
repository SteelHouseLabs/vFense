from uuid import uuid4
import logging
import os
import shutil
from db.client import db_create_close, r
from errorz.error_messages import GenericResults
from errorz.status_codes import PackageCodes
from utils.common import date_parser, timestamp_verifier
from plugins.patching import *
from plugins.patching.custom_apps.custom_apps import add_custom_app_to_agents


logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

TMP_DIR = '/opt/TopPatch/var/packages/tmp/'

if not os.path.exists(TMP_DIR):
    os.mkdir(TMP_DIR)


def gen_uuid():
    return(str(uuid4()))


@db_create_close
def move_packages(username, customer_name, uri, method,
                  name=None, path=None, size=None, md5=None,
                  uuid=None, conn=None):

    files_stored = list()
    PKG_DIR = None
    FILE_PATH = None

    if name and uuid and path and size and md5:
        PKG_DIR = TMP_DIR + uuid + '/'
        FILE_PATH = PKG_DIR + name

        if not os.path.exists(PKG_DIR):
            try:
                os.mkdir(PKG_DIR)
            except Exception as e:
                logger.error(e)
        try:
            shutil.move(path, FILE_PATH)
            files_stored.append(
                {
                    'uuid': uuid,
                    'name': name,
                    'size': int(size),
                    'md5': md5,
                    'file_path': FILE_PATH
                }
            )

            results = (
                GenericResults(
                    username, uri, method
                ).file_uploaded(name, files_stored)
            )

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).file_failed_to_upload(name, e)
            )
            logger.error(e)

    return(results)


@db_create_close
def store_package_info_in_db(
        username, customer_name, uri, method,
        size, md5, operating_system,
        uuid, name, severity, arch, major_version,
        minor_version, release_date=0.0,
        vendor_name=None, description=None,
        cli_options=None, support_url=None,
        kb=None, conn=None):

    PKG_FILE = TMP_DIR + uuid + '/' + name
    URL_PATH = 'https://localhost/packages/tmp/' + uuid + '/'
    url = URL_PATH + name

    if os.path.exists(PKG_FILE):
        if (isinstance(release_date, str) or
            isinstance(release_date, unicode)):

            orig_release_date = release_date
            if (len(release_date.split('-')) == 3 or len(release_date.split('/')) == 3):
                release_date = (
                    r
                    .epoch_time(date_parser(release_date))
                )

            else:
                release_date = (
                    r
                    .epoch_time(
                        timestamp_verifier(release_date)
                    )
                )

        data_to_store = {
            CustomAppsKey.Name: name,
            CustomAppsPerAgentKey.Dependencies: [],
            CustomAppsKey.RvSeverity: severity,
            CustomAppsKey.VendorSeverity: severity,
            CustomAppsKey.ReleaseDate: release_date,
            CustomAppsKey.VendorName: vendor_name,
            CustomAppsKey.Description: description,
            CustomAppsKey.MajorVersion: major_version,
            CustomAppsKey.MinorVersion: minor_version,
            CustomAppsKey.Version: major_version + '.' + minor_version,
            CustomAppsKey.OsCode: operating_system,
            CustomAppsKey.Kb: kb,
            CustomAppsKey.Hidden: 'no',
            CustomAppsKey.CliOptions: cli_options,
            CustomAppsKey.Arch: arch,
            CustomAppsKey.RebootRequired: 'possible',
            CustomAppsKey.SupportUrl: support_url,
            CustomAppsKey.Customers: [customer_name],
            CustomAppsPerAgentKey.Update: PackageCodes.ThisIsNotAnUpdate,
            CustomAppsKey.FilesDownloadStatus: PackageCodes.FileCompletedDownload,
            CustomAppsKey.AppId: uuid
        }
        file_data = (
            [
                {
                    FilesKey.FileUri: url,
                    FilesKey.FileSize: int(size),
                    FilesKey.FileHash: md5,
                    FilesKey.FileName: name
                }
            ]
        )
        try:
            updated = (
                r
                .table(CustomAppsCollection)
                .insert(data_to_store, upsert=True)
                .run(conn)
            )

            add_custom_app_to_agents(
                username, customer_name,
                uri, method, file_data,
                app_id=uuid
            )

            data_to_store['release_date'] = orig_release_date
            results = (
                GenericResults(
                    username, uri, method
                ).object_created(uuid, 'custom_app', data_to_store)
            )
            logger.info(results)

        except Exception as e:
            results = (
                GenericResults(
                    username, uri, method
                ).something_broke(uuid, 'custom_app', e)
            )
            logger.exception(e)
    else:
        results = (
            GenericResults(
                username, uri, method
            ).file_doesnt_exist(name, e)
        )
        logger.info(results)

    return(results)
