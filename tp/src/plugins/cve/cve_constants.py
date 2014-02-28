import os
PLUGIN_DIR = os.path.abspath(os.path.dirname(__file__))
XML_DIR = PLUGIN_DIR + '/data/xml'
XLS_DIR = PLUGIN_DIR + '/data/xls'
HTML_DIR_UBUNTU = PLUGIN_DIR + '/data/html/ubuntu/'
NVD_MODIFIED_FILE = XML_DIR + '/nvdcve-modified.xml'
METRIC = 'metric'
VALUE = 'value'
CVSS_VECTOR = 'CVSS_vector'
VENDOR = 'vendor'
VENDOR_NAME = 'name'
VENDOR_VERSIONS = 'versions'
CVE_NAME = 'name'
CVE_ID = 'seq'
CVSS_SCORE = 'CVSS_score'
CVSS_BASE_SCORE = 'CVSS_base_score'
CVSS_EXPLOIT_SUBSCORE = 'CVSS_exploit_subscore'
CVSS_IMPACT_SUBSCORE = 'CVSS_impact_subscore'
CVSS_VERSION = 'CVSS_version'
CVE_MODIFIED_DATE = 'modified'
CVE_PUBLISHED_DATE = 'published'
DESCRIPTION = 'description'
DESCRIPTION_SOURCE = 'source'
REF_URL = 'url'
REF_SOURCE = 'source'
REF_ID = 'id'
NVD_TYPE = 'type'
CVE_SEVERITY = 'severity'
BASE_VECTOR_METRIC_AV = 'AV'
BASE_VECTOR_METRIC_AC = 'AC'
BASE_VECTOR_METRIC_Au = 'Au'
BASE_VECTOR_METRIC_C = 'C'
BASE_VECTOR_METRIC_I = 'I'
BASE_VECTOR_METRIC_A = 'A'
TEMPORAL_VECTOR_METRIC_E = 'E'
TEMPORAL_VECTOR_METRIC_RL = 'RL'
TEMPORAL_VECTOR_METRIC_RC = 'RC'
ENVIRONMENTAL_VECTOR_METRIC_CDP = 'CDP'
ENVIRONMENTAL_VECTOR_METRIC_TD = 'TD'
ENVIRONMENTAL_VECTOR_METRIC_CR = 'CR'
ENVIRONMENTAL_VECTOR_METRIC_IR = 'IR'
ENVIRONMENTAL_VECTOR_METRIC_AR = 'AR'
NVD_FEEDS_ENTRY = '{http://nvd.nist.gov/feeds/cve/1.2}entry'
NVD_FEEDS_DESC = '{http://nvd.nist.gov/feeds/cve/1.2}desc'
NVD_FEEDS_REFS = '{http://nvd.nist.gov/feeds/cve/1.2}refs'
NVD_FEEDS_VULN_SOFT = '{http://nvd.nist.gov/feeds/cve/1.2}vuln_soft'

MICRSOFT_BULLETIN_XLS = 'http://www.microsoft.com/en-us/download/confirmation.aspx?id=36982'

WORKBOOK_SHEET = 'Bulletin Search'

REDHAT= 'redhat'
REDHAT_ARCHIVE = 'https://www.redhat.com/archives/rhsa-announce/'
UBUNTU = 'ubuntu'
UBUNTU_ARCHIVE = 'https://lists.ubuntu.com/archives/ubuntu-security-announce/'

CSRF = 'CSRF'
DDOS = 'Denial Of Service'
CSS = 'Cross-site Scripting'
SQLI = 'SQL Injection'
MEM_CORRUPTION = 'Memory Corruption'
SENSTIVE_INFORMATION = 'Sensitive Information'
CODE_EXECUTION = 'Code Execution'
FILE_INCLUSION = 'File_Inclusion'
HTTP_RESPONSE_SPLITTING_ATTACKS = 'HTTP Response Splitting Attacks'
OVERFLOWS = 'Overflows'
GAIN_PRIVILEGE = 'Gain Privilege'
DIRECTORY_TRAVERSAL = 'Directory Traversal'
BYPASS = 'Bypass'

CVE_CATEGORIES = (
    [
        CSRF, DDOS, CSS, SQLI, MEM_CORRUPTION,
        SENSTIVE_INFORMATION, CODE_EXECUTION,
        FILE_INCLUSION, HTTP_RESPONSE_SPLITTING_ATTACKS,
        OVERFLOWS, GAIN_PRIVILEGE, DIRECTORY_TRAVERSAL,
        BYPASS
    ]
)

#########CVS_BASE_VECTORS######################################3
CVSS_BASE_VECTORS = (
    {
        'AV': 'Access Vector',
        'AC': 'Access Complexity',
        'Au': 'Authentication',
        'C': 'Confidentiality Impact',
        'I': 'Integrity Impact',
        'A': 'Availability Impact'
    }
)

CVSS_BASE_VECTOR_AV_VALUES = (
    {
        'L': 'Local Access',
        'A': 'Adjacent Network',
        'N': 'Network',
    }
)

CVSS_BASE_VECTOR_AC_VALUES = (
    {
        'L': 'Low',
        'M': 'Medium',
        'H': 'High',
    }
)

CVSS_BASE_VECTOR_AU_VALUES = (
    {
        'N': 'None Required',
        'S': 'Requires single instance',
        'M': 'Requires multiple instances'
    }
)

CVSS_BASE_VECTOR_C_VALUES = (
    {
        'N': 'None',
        'P': 'Partial',
        'C': 'Complete'
    }
)

CVSS_BASE_VECTOR_I_VALUES = (
    {
        'N': 'None',
        'P': 'Partial',
        'C': 'Complete'
    }
)

CVSS_BASE_VECTOR_A_VALUES = (
    {
        'N': 'None',
        'P': 'Partial',
        'C': 'Complete'
    }
)

#########CVS_TEMPORAL_VECTORS######################################3

CVSS_TEMPORAL_VECTORS = (
    {
        'E': 'Exploitability',
        'RL': 'Remediation Level',
        'RC': 'Report Confidence',
    }
)

CVSS_TEMPORAL_VECTOR_E_VALUES = (
    {
        'U': 'Unproven',
        'P': 'Proof Of Concept',
        'F': 'Functional',
        'H': 'High',
        'ND': 'Not Defined',
    }
)

CVSS_TEMPORAL_VECTOR_RL_VALUES = (
    {
        'O': 'Official Fix',
        'T': 'Temporary Fix',
        'W': 'Work Around',
        'U': 'Unavailable',
        'ND': 'Not Defined',
    }
)

CVSS_TEMPORAL_VECTOR_RC_VALUES = (
    {
        'UC': 'Unconfirmed',
        'UR': 'Uncorroborated',
        'C': 'Confirmed',
        'ND': 'Not Defined',
    }
)

#########CVS_ENVIRONMENTAL_VECTORS######################################3

CVSS_ENVIRONMENTAL_VECTORS = (
    {
        'CDP': 'Collateral Damage Potential',
        'TD': 'Target Distribution',
        'CR': 'System Confidentiality Requirement',
        'IR': 'System Integrity Requirement',
        'AR': 'System Availability Requirement'
    }
)

CVSS_ENVIRONMENTAL_CDP_VALUES = (
    {
        'N': 'None',
        'L': 'Low',
        'LM': 'Low-Medium',
        'M': 'Medium',
        'MH': 'Medium-High',
        'H': 'High',
        'ND': 'Not Defined',
    }
)

CVSS_ENVIRONMENTAL_TD_VALUES = (
    {
        'N': 'None (0%)',
        'L': 'Low (1-25%)',
        'M': 'Medium (26-75%)',
        'H': 'High (76-100%)',
        'ND': 'Not Defined',
    }
)

CVSS_ENVIRONMENTAL_CR_VALUES = (
    {
        'L': 'Low',
        'M': 'Medium',
        'H': 'High',
        'ND': 'Not Defined',
    }
)

CVSS_ENVIRONMENTAL_IR_VALUES = (
    {
        'L': 'Low',
        'M': 'Medium',
        'H': 'High',
        'ND': 'Not Defined',
    }
)

CVSS_ENVIRONMENTAL_AR_VALUES = (
    {
        'L': 'Low',
        'M': 'Medium',
        'H': 'High',
        'ND': 'Not Defined',
    }
)
