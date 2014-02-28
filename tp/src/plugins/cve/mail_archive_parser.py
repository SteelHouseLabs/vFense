import os
import re
import sys

import requests
from BeautifulSoup import BeautifulSoup

from plugins.cve import *


def download_file(file_to_write_to, url=REDHAT_ARCHIVE):
    r = requests.get(url)
    compressed_file = open(file_to_write_to, 'wb')
    if r.ok:
        compressed_file.write(r.content)

    compressed_file.close()

    return(r.ok. os.stat(file_to_write_to).st_size)
