import logging
import logging.config
import os
import re
from time import time, mktime
from datetime import datetime
import urllib
from db.client import db_create_close, r, db_connect
from plugins.patching import *
from plugins.patching.rv_db_calls import update_os_app,\
    update_supported_app, update_agent_app
from errorz.error_messages import GenericResults
from errorz.status_codes import PackageCodes
from agent import *
from urlgrabber import urlgrab
from utils.common import hash_verifier

packages_directory = '/opt/TopPatch/var/packages/'
dependencies_directory = '/opt/TopPatch/var/packages/dependencies/'

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


def download_all_files_in_app(
        app_id, os_code, os_string=None,
        file_data=None, throttle=0,
        collection='os_apps'):

    REDHAT = 'Red Hat Enterprise Linux Server'
    app_path = packages_directory + str(app_id)
    if not os.path.exists(packages_directory):
        os.mkdir(packages_directory)
    if not os.path.exists(dependencies_directory):
        os.mkdir(dependencies_directory)
    if not os.path.exists(app_path):
        os.mkdir(app_path)

    if not file_data and re.search(REDHAT, os_string, re.IGNORECASE):
            download_status = (
                {
                    AppsKey.FilesDownloadStatus: PackageCodes.AgentWillDownloadFromVendor
                }
            )
            update_os_app(app_id, download_status)
    
    elif len(file_data) > 0:
        num_of_files_to_download = len(file_data)
        num_of_files_downloaded = 0
        num_of_files_mismatch = 0
        num_of_files_failed = 0
        num_of_files_invalid_uri = 0
        new_status = (
            {
                AppsKey.FilesDownloadStatus: PackageCodes.FileIsDownloading
            }
        )
        update_os_app(app_id, new_status)
        for file_info in file_data:
            uri = str(file_info[PKG_URI])
            lhash = str(file_info[PKG_HASH])
            fname = str(file_info[PKG_NAME])
            fsize = file_info[PKG_SIZE]
            if os_code == 'linux':
                file_path = dependencies_directory + fname

            else:
                file_path = app_path + '/' + fname

            if throttle != 0:
                throttle *= 1024

            symlink_path = app_path + '/' + fname 
            cmd = 'ln -s %s %s' % (file_path, symlink_path)

            try:
                if uri and not os.path.exists(file_path):
                    urlgrab(uri, filename=file_path, throttle=throttle)
                    if os.path.exists(file_path):
                        if lhash:
                            hash_match = (
                                hash_verifier(
                                    orig_hash=lhash,
                                    file_path=file_path
                                )
                            )
                            if hash_match['pass']:
                                num_of_files_downloaded += 1
                                if os_code == 'linux':
                                    if not os.path.islink(file_path):
                                        os.system(cmd)
                            else:
                                num_of_files_mismatch += 1

                        elif fsize and not lhash:
                            if os.path.getsize(file_path) == fsize:
                                num_of_files_downloaded += 1
                            else:
                                num_of_files_mismatch += 1
                    else:
                        num_of_files_failed += 1

                elif os.path.exists(file_path) and os_code == 'linux':

                    if not os.path.islink(symlink_path):
                        os.system(cmd)

                    num_of_files_downloaded += 1

                elif os.path.exists(file_path) and os_code != 'linux':
                    num_of_files_downloaded += 1

                elif uri:
                    num_of_files_invalid_uri += 1

            except Exception as e:
                logger.exception(e)

        if num_of_files_downloaded == num_of_files_to_download:
            new_status[AppsKey.FilesDownloadStatus] = (
                PackageCodes.FileCompletedDownload
            )

        elif num_of_files_mismatch > 0:
            new_status[AppsKey.FilesDownloadStatus] = (
                PackageCodes.FileSizeMisMatch
            )

        elif num_of_files_failed > 0:
            new_status[AppsKey.FilesDownloadStatus] = (
                PackageCodes.FileFailedDownload
            )

        elif num_of_files_invalid_uri > 0:
            new_status[AppsKey.FilesDownloadStatus] = (
                PackageCodes.InvalidUri
            )

        if collection == 'os_apps':
            update_os_app(app_id, new_status)

        elif collection == 'supported_apps':
            update_supported_app(app_id, new_status)

        elif collection == 'agent_apps':
            update_agent_app(app_id, new_status)

        logger.info('%s, %s, %s' % (collection, app_id, str(new_status)))
