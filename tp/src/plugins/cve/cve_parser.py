import os
import sys
import gc
import re
import logging
import logging.config
from lxml import etree
from re import sub
from plugins.cve import *
from plugins.cve.cve_constants import *
from plugins.cve.cve_db import insert_into_cve_collection, update_cve_categories
from plugins.cve.downloader import start_nvd_xml_download
from utils.common import date_parser, timestamp_verifier
from db.client import r

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('cve')

class NvdParser(object):
    def get_entry_info(self, entry):
        data = {}
        attrib = entry.attrib
        data[CveKey.CveId] = attrib.get(CVE_ID)
        data[CveKey.CveName] = attrib.get(CVE_NAME)
        data[CveKey.CveSev] = attrib.get(CVE_SEVERITY)
        data[CveKey.CvePublishedDate] = (
            r.epoch_time(
                timestamp_verifier(
                    date_parser(
                        attrib.get(CVE_PUBLISHED_DATE)
                    )
                )
            )
        )
        data[CveKey.CveModifiedDate] = (
            r.epoch_time(
                timestamp_verifier(
                    date_parser(
                        attrib.get(CVE_MODIFIED_DATE)
                    )
                )
            )
        )
        data[CveKey.CvssScore] = attrib.get(CVSS_SCORE)
        data[CveKey.CvssBaseScore] = attrib.get(CVSS_BASE_SCORE)
        data[CveKey.CvssImpactSubScore] = attrib.get(CVSS_IMPACT_SUBSCORE)
        data[CveKey.CvssExploitSubScore] = attrib.get(CVSS_EXPLOIT_SUBSCORE)
        data[CveKey.CvssVector] = self._parse_vectors(attrib.get(CVSS_VECTOR))
        data[CveKey.CvssVersion] = attrib.get(CVSS_VERSION)
        #if data[CveKey.CveId]:
        #    print '\nFOOBAR\n'
        #    print entry.tag
        #    print type(entry.tag)
        #    print data
        return(data)

    def get_descriptions(self, entry):
        list_of_descriptions = []
        for descript in entry:
            list_of_descriptions.append(
                {
                    DESCRIPTION: descript.text,
                    DESCRIPTION_SOURCE: descript.attrib.get(DESCRIPTION_SOURCE)
                }
            )
        #if list_of_descriptions:
        #    print entry.tag
        #    print list_of_descriptions, 'descriptions'
        return(list_of_descriptions)

    def get_refs(self, entry):
        list_of_refs = []
        for reference in entry:
            list_of_refs.append(
                {
                    REF_ID: reference.text,
                    REF_URL: reference.attrib.get(REF_URL),
                    REF_SOURCE: reference.attrib.get(REF_SOURCE),
                }
            )
        #if list_of_refs:
        #    print entry.tag
        #    print list_of_refs, 'refs'
        return(list_of_refs)

    def get_vulns_soft(self, entry):
        vuln_soft_list = []
        for vulns_soft in entry:
            vuln_soft_dict = {}
            vuln_soft_dict[VENDOR_VERSIONS] = []
            vulns = vulns_soft.getchildren()
            for vuln in vulns:
                vuln_soft_dict[VENDOR] = vuln.attrib.get(VENDOR)
                vuln_soft_dict[VENDOR_NAME] = vuln.attrib.get(VENDOR_NAME)
                vulns_versions = vuln.getchildren()
                for version in vulns_versions:
                    version_dict = {}
                    for key in version.keys():
                        version_dict[key] = version.attrib[key]
                    vuln_soft_dict[VENDOR_VERSIONS].append(version_dict)
            vuln_soft_list.append(vuln_soft_dict)
        #if vuln_soft_list:
        #    print entry.tag
        #    print vuln_soft_list, 'soft'
        return(vuln_soft_list)

    def _parse_vectors(self, unformatted_vector):
        translated_metric = None
        translated_value = None
        formatted_vectors = []
        if unformatted_vector:
            vectors = sub('\(|\)', '', unformatted_vector).split('/')
            for vector in vectors:
                metric, value = vector.split(':')
                translated_metric, translated_value = (
                    self._verify_vector(metric, value)
                )
                formatted_vectors.append(
                    {
                        METRIC: translated_metric,
                        VALUE: translated_value
                    }
                )

        return(formatted_vectors)

    def _verify_vector(self, metric, value):
        translated_metric = None
        translated_value = None
        if CVSS_BASE_VECTORS.has_key(metric):
            translated_metric = CVSS_BASE_VECTORS[metric]

            if metric == BASE_VECTOR_METRIC_AV:
                translated_value = CVSS_BASE_VECTOR_AV_VALUES[value]

            elif metric == BASE_VECTOR_METRIC_AC:
                translated_value = CVSS_BASE_VECTOR_AC_VALUES[value]

            elif metric == BASE_VECTOR_METRIC_Au:
                translated_value = CVSS_BASE_VECTOR_AU_VALUES[value]

            elif metric == BASE_VECTOR_METRIC_C:
                translated_value = CVSS_BASE_VECTOR_C_VALUES[value]

            elif metric == BASE_VECTOR_METRIC_I:
                translated_value = CVSS_BASE_VECTOR_I_VALUES[value]

            elif metric == BASE_VECTOR_METRIC_A:
                translated_value = CVSS_BASE_VECTOR_A_VALUES[value]

        elif CVSS_TEMPORAL_VECTORS.has_key(metric):
            translated_metric = CVSS_TEMPORAL_VECTORS[metric]

            if metric == TEMPORAL_VECTOR_METRIC_E:
                translated_value = CVSS_TEMPORAL_VECTOR_E_VALUES[value]

            elif metric == TEMPORAL_VECTOR_METRIC_RL:
                translated_value = CVSS_TEMPORAL_VECTOR_RL_VALUES[value]

            elif metric == TEMPORAL_VECTOR_METRIC_RC:
                translated_value = CVSS_TEMPORAL_VECTOR_RC_VALUES[value]


        elif CVSS_ENVIRONMENTAL_VECTORS.has_key(metric):
            translated_metric = CVSS_ENVIRONMENTAL_VECTORS[metric]

            if metric == ENVIRONMENTAL_VECTOR_METRIC_CDP:
                translated_value = CVSS_BASE_VECTOR_CDP_VALUES[value]

            elif metric == ENVIRONMENTAL_VECTOR_METRIC_TD:
                translated_value = CVSS_ENVIRONMENTAL_VECTOR_TD_VALUES[value]

            elif metric == ENVIRONMENTAL_VECTOR_METRIC_CR:
                translated_value = CVSS_ENVIRONMENTAL_VECTOR_CR_VALUES[value]

            elif metric == ENVIRONMENTAL_VECTOR_METRIC_IR:
                translated_value = CVSS_ENVIRONMENTAL_VECTOR_IR_VALUES[value]

            elif metric == ENVIRONMENTAL_VECTOR_METRIC_AR:
                translated_value = CVSS_ENVIRONMENTAL_VECTOR_AR_VALUES[value]

        return(translated_metric, translated_value)

def parse_cve_and_udpatedb(download_latest_nvd=True, nvd_file=NVD_MODIFIED_FILE):
    if download_latest_nvd:
        start_nvd_xml_download()
    parser = NvdParser()
    cve_data_list = []
    cve_data = {}
    for event, entry in etree.iterparse(nvd_file, events=['start', 'end']):
        if entry.tag == NVD_FEEDS_ENTRY and event == 'start':
            cve_data = parser.get_entry_info(entry)

        if entry.tag == NVD_FEEDS_DESC and event == 'start':
            cve_data[CveKey.CveDescriptions] = parser.get_descriptions(entry)

        if entry.tag == NVD_FEEDS_REFS and event == 'start':
            cve_data[CveKey.CveRefs] = parser.get_refs(entry)

        if entry.tag == NVD_FEEDS_VULN_SOFT and event == 'start':
            cve_data[CveKey.CveVulnsSoft] = parser.get_vulns_soft(entry)

        cve_data[CveKey.CveCategories] = []
        if entry.tag == NVD_FEEDS_ENTRY and event == 'end':
            for key in cve_data.keys():
                if (key != CveKey.CveDescriptions and
                        key != CveKey.CveRefs and
                        key != CveKey.CveVulnsSoft and
                        key != CveKey.CvePublishedDate and
                        key != CveKey.CveCategories and
                        key != CveKey.CveModifiedDate):
                    cve_data[key] = unicode(cve_data[key])

            cve_data_list.append(cve_data)

        entry.clear()
        while entry.getprevious() is not None:
            del entry.getparent()[0]
        del entry

    insert_into_cve_collection(cve_data_list)
    del cve_data_list
    del cve_data
    del parser
    gc.collect()


def load_up_all_xml_into_db():
    if not os.path.exists(XML_DIR):
        os.makedirs(XML_DIR)
    xml_exists = os.listdir(XML_DIR)
    if not xml_exists:
        logger.info('downloading nvd/cve xml data files')
        start_nvd_xml_download()
    for directory, subdirectories, files in os.walk(XML_DIR):
        for xml_file in files:
            nvd_file = os.path.join(directory, xml_file)
            parse_cve_and_udpatedb(False, nvd_file)
    update_cve_categories()

#update_cve_categories()
#load_up_all_xml_into_db()
