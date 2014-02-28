"CVE DOWNLOADER FOR TOPPATCH, NVD/CVE XML VERSION 1.2"
import os
import re
from datetime import date
import requests
import logging
import logging.config
from plugins.cve.cve_constants import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('cve')

tmp_path = os.path.join\
        (os.path.dirname(os.path.abspath(__file__)), 'data/xml')

current_year = date.today().year
url_path = 'http://nvd.nist.gov/download/'
nvdcve_modified = 'nvdcve-modified.xml'
nvd_modified_url = url_path + nvdcve_modified
nvd_modified_path = tmp_path + '/' + nvdcve_modified
nvdcve = 'nvdcve-'

def cve_downloader(cve_url, cve_path):
    r = requests.get(cve_url)
    xml = open(cve_path, 'wb')
    if r.ok:
        xml.write(r.content)

    xml.close()
    return(r.ok, os.stat(cve_path).st_size)

def log_status(status, size, url_path, nvd_path):
    if status == True and size > 0:
        msg = '%s Downloaded to %s' % ( url_path, nvd_path )
        logger.info(msg)
    elif status == False:
        msg =  '%s Could not be downloaded' % ( url_path )
        logger.warn(msg)
    else:
        msg = '%s Was downloaded to %s, but the size is %d' \
                % ( url_path, nvd_path, size )
        logger.error(msg)

"""
Getting the daily nvdcve-modified.xml file
"""
def start_nvd_xml_download():
    start_year = 2002
    iter_year = start_year
    if not os.path.exists(tmp_path):
        os.makedirs(tmp_path)
    mod_xml = cve_downloader(nvd_modified_url, nvd_modified_path)
    log_status(mod_xml[0], mod_xml[1], nvd_modified_url, nvd_modified_path)

    """
    If we have not yet downloaded the 2002 until now CVE's,
    please download then now
    """
    while iter_year <= current_year:
        nvd = nvdcve + str(iter_year) + '.xml'
        full_url =  url_path + nvd
        full_nvd = os.path.join(tmp_path, nvd)
        if not os.path.exists(full_nvd):
            xml_status = cve_downloader(full_url, full_nvd)
            log_status(xml_status[0], xml_status[1], full_url, full_nvd)
        else:
            msg = "%s already exists at %s" % ( nvd, full_nvd )
            logger.info(msg)
        iter_year = iter_year + 1

def get_msft_bulletin_url():
    xls_url = None
    xls_file_name = None

    main_url = requests.get(MICRSOFT_BULLETIN_XLS)
    if main_url.status_code == 200:
        xls_url = re.search('http.*.xlsx', main_url.content).group()
        if xls_url:
            xls_file_name = xls_url.split('/')[-1]

    return(xls_url, xls_file_name)


def download_latest_xls_from_msft():
    downloaded = True
    xls_file_location = None
    if not os.path.exists(XLS_DIR):
        os.makedirs(XLS_DIR)
    xls_url, xls_file_name = get_msft_bulletin_url()
    if xls_url:
        xls_file_location = XLS_DIR+'/'+xls_file_name
        xls_data = requests.get(xls_url)
        if xls_data.ok:
            xml_file = open(xls_file_location, 'wb')
            xml_file.write(xls_data.content)
            xml_file.close()
            if (xls_data.headers['content-length'] ==
                    str(os.stat(xls_file_location).st_size)):
                logger.info(
                    '%s downloaded to %s: file_size: %s matches content-length' %
                    (
                        xls_url,xls_file_location,
                        os.stat(xls_file_location).st_size
                    )
                )
            else:
                downloaded = False
                logger.warn(
                    '%s downloaded to %s: file_size: %s does not match the content-length' %
                    (
                        xls_url,xls_file_location,
                        os.stat(xls_file_location).st_size
                    )
                )
    return(downloaded, xls_file_location)

#download_latest_xls_from_msft()
