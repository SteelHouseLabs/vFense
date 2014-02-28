import os
import logging
import logging.config
import sys
import time
from Queue import Queue, Empty, Full
from urlgrabber import urlgrab
import threading

from utils.common import hash_verifier

packages_directory = '/opt/TopPatch/var/packages/'
dependencies_directory = '/opt/TopPatch/var/packages/dependencies/'

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

# Create packages directory if it doesn't exist.
try:
    os.mkdir(packages_directory)
    os.mkdir(dependencies_directory)

except OSError as e:
    pass

class PackageGrabber():

    def __init__(self):

        self._queue = list()

    def download_file(self, uri, lhash, fsize,
                      local_path=None, throttle=0):
        """Downloads a package from specified uri.

        Args:
            uri (strings): Uri of the file to download.

            local_path (string): Full path where the package is be saved.
                Do not include a file name.

            throttle (int): Number of kilobytes to throttle the bandwidth by.
                If throttle == 0, throttling is disabled.

        Returns:
            True if package downloaded successfully. False otherwise.
        """

        # urlgrab doesn't like unicode.
        uri = str(uri)
        if not lhash:
            lhash = ''

        success = False
        hash_status = 'not verified'
        fsize_match = False
        path = ''

        if throttle != 0:
            throttle *= 1024

        try:

            if local_path and len(uri) > 0:

                name = uri.split('/')[-1]
                if '?' in name:
                    name = name.split('?')[0]

                path = os.path.join(local_path, name)

                urlgrab(uri, filename=path, throttle=throttle)

            elif len(uri) > 0 and not local_path:

                path = urlgrab(uri, throttle=throttle)

        except Exception as e:
            logger.exception(e)

        if os.path.exists(path):
            if len(lhash) > 0:
                hash_match = hash_verifier(orig_hash=lhash, file_path=path)

                if hash_match['pass']:
                    hash_status = 'verified'
                    fsize_match = True
                    success = True

            elif fsize and len(lhash) < 1:
                if os.path.getsize(path) == fsize:
                    hash_status = 'no hash'
                    fsize_match = True
                    success = True

        return(success, hash_status, fsize_match)

    def _batch_download(self, uris, local_path=None, throttle=0):
        """Downloads a package from specified uri. This is a W.I.P!!!

        Args:
            uris (list of strings) - Uris of the package to download.
            local_path (string) - Full path where the package is be saved.
                Do not include a file name.
            throttle (int) - Number of kilobytes to throttle the bandwidth by.
                If throttle == 0, throttling is disabled.

        Returns:
            True if package downloaded successfully. False otherwise.
        """

        success = False

        if throttle != 0:
            throttle *= 1024

        for uri in uris:
            try:

                if local_path:

                    name = uri.split('/')[-1]
                    if '?' in name:
                        name = name.split('?')[0]

                    path = os.path.join(local_path, name)

                else:

                    urlgrab(uri, throttle=throttle)
            except Exception as e:
                logger.exception(e)

    def add(self, uri, lhash=None, fsize=None,  local_path=None,
            throttle=0, callback=None, data=None):
        """Adds package download data to a queue.

        Args:
            uri (strings): Uri of the file to download.

            local_path (string): Full path where the package is be saved.
                Do not include a file name.

            throttle (int): Number of kilobytes to throttle the bandwidth by.
                If throttle == 0, throttling is disabled.

            callback: A method/function, that should take **kwargs, which will
                be called once downloading is completed.

        Returns:
            Nothing
        """

        self._queue.append((uri, lhash, fsize, local_path,
                            throttle, callback, data))

    def download(self):

        for file_data in self._queue:

            try:

                uri, lhash, fsize, path, throttle, callback, data = file_data

                name = uri.split('/')[-1]
                if '?' in name:
                    name = name.split('?')[0]

                downloaded, hash_status, fsize_match = (
                    self.download_file(
                        uri, lhash, fsize, path, throttle
                    )
                )

                callback(
                    filename=name,
                    success=downloaded,
                    data=data,
                    hash_status=hash_status,
                    fsize_match=fsize_match
                )

            except Empty as e:

                time.sleep(10)

            except Exception as e:

                time.sleep(10)
