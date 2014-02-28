# -*- coding: utf-8 -*-

from __future__ import division, print_function, unicode_literals
import itertools
import logging
import logging.config
import os
import six
import smtplib
import socket
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# TODO: we need some sort of SMTPConnection Lock here

DEFAULT_WORKING_DIRECTORY = '/opt/TopPatch'
RELATIVE_LOGGING_CONFIG = 'conf/logging.config'
ABSOLUTE_LOGGING_CONFIG = os.path.join(DEFAULT_WORKING_DIRECTORY,
                                       RELATIVE_LOGGING_CONFIG)

#logger = None
logging.config.fileConfig(ABSOLUTE_LOGGING_CONFIG)
logger = logging.getLogger('rvnotifier')


class SMSConnection(object):
    def __init__(self, *args, **kwargs):
        raise NotImplementedError


# TODO: there might be a better base exception class here
class ConnectionError(Exception):
    pass


class EmailConnectionError(ConnectionError):
    pass


# TODO: there might be a better base exception class here
class SendError(Exception):
    pass


class EmailSendError(SendError):
    pass


class EmailConnection(object):
    def __init__(self, hostname, port, username=None, password=None,
                 use_tls=True, use_ssl=False, timeout=5):
        global logger

        # Basic connection info
        if use_tls and use_ssl:
            logger.error('You cannot use both SSL and STARTTLS.')
            raise ConnectionError
        self.hostname = hostname
        self.port = port

        # SMTP authentication info
        self.username = username
        self.password = password
        if self.username:
            self.use_authentication = True
        else:
            self.use_authentication = False
        self._is_authenticated = False

        # SMTP SSL/TLS info
        self.use_ssl = use_ssl
        self._is_ssl = False
        self.use_tls = use_tls
        self._is_tls = False

        # Other
        self.timeout = timeout
        self._is_connected = False

        # Start the SMTP connection.
        self.connect()

        if not self._is_connected:
            raise EmailConnectionError

    #def __enter__(self):
        #self.connect()

    #def __exit__(self):
        #self.quit()

    def _starttls(self):
        # TODO: this method should grab a Lock
        global logger

        if not self._is_connected:
            logger.error('STARTTLS attempted without a valid connection.')
            return False

        else:
            self._connection.ehlo()

            try:
                self._connection.starttls()
            except smtplib.SMTPException:
                logger.error('STARTTLS not supported by remote SMTP server.')
                return False

            self._connection.ehlo()
            self._is_tls = True

            logger.info('SMTP STARTTLS invoked.')

            return True

    def _authenticate(self):
        global logger

        # TODO: this method should grab a Lock
        if not self._is_connected:
            logger.error('No SMTP connection available to authenticate.')

        if not self.username:
            logger.error('No SMTP authentication credentials given.')
            return False

        if not self._is_tls and not self._is_ssl:
            logger.error('SMTP authentication should only occur over SSL/TLS.')
            return False

        try:
            self._connection.login(self.username, self.password)
        except smtplib.SMTPAuthenticationError:
            logger.error('SMTP authentication failed. Invalid credentials.')
            return False

        self._is_authenticated = True
        return True

    def _basic_connect(self):
        global logger

        # TODO: this method should grab a Lock
        if self._is_connected:
            self.quit()

        try:
            if self.use_ssl:
                self._connection = smtplib.SMTP_SSL(host=self.hostname,
                                                    port=self.port,
                                                    timeout=self.timeout)
                self._is_ssl = True
            else:
                self._connection = smtplib.SMTP(host=self.hostname, port=self.port,
                                                timeout=self.timeout)
        except smtplib.SMTPConnectError:
            logger.error('SMTP connection failed. Invalid hostname?')
            return False
        except socket.timeout:
            logger.error('SMTP connection timed out. Do you have the right address?')
            return False
        except smtplib.SMTPServerDisconnected:
            logger.error('SMTP connection unexpectedly timed out.')
            return False

        self._is_connected = True
        logger.info('Basic SMTP connection created.')
        return True

    @property
    def is_connected(self):
        return self._is_connected

    def connect(self):
        global logger

        if not self._basic_connect():
            logger.error('SMTP basic connect failed.')
            return False

        if self.use_tls and not self._starttls():
            logger.error('SMTP STARTTLS failed.')
            self.quit()
            return False

        if self.username and not self._authenticate():
            logger.error('SMTP login failed.')
            self.quit()
            return False

        self._is_connected = True
        logger.info('SMTP connection created with options.')
        return True

    def send(self, from_address, to_addresses, subject, text_body, html_body):
        global logger

        if not self._is_connected:
            logger.error('No SMTP connection available to send message.')
            raise EmailSendError

        def valid_address(address):
            return isinstance(address, six.string_types)

        # check the validity of the email addresses
        if not all(valid_address(address)
                   for address in itertools.chain([from_address], to_addresses)):
            logger.error('Invalid Email addresses.')
            raise EmailSendError

        msg = MIMEMultipart('alternative')
        msg['From'] = from_address
        msg['To'] = ','.join(list(to_addresses))
        msg['Subject'] = subject

        part1 = MIMEText(text_body, 'text')
        part2 = MIMEText(html_body, 'html')

        msg.attach(part1)
        msg.attach(part2)

        try:
            self._connection.sendmail(from_addr=from_address,
                                      to_addrs=list(to_addresses),
                                      msg=msg.as_string())
        except (smtplib.SMTPRecipientsRefused,
                smtplib.SMTPSenderRefused,
                smtplib.SMTPDataError,
                smtplib.SMTPServerDisconnected) as e:
            logger.error(str(e))

            raise EmailSendError

        except Exception as e:
            logger.error('%s' % str(e))

        logger.info('Message sent.')

    def quit(self):
        global logger

        # TODO: this method should grab a Lock
        if self._is_connected:
            self._connection.quit()
            self._is_connected = False
            logger.info('SMTP connection closed.')
            return True
        else:
            logger.error('SMTP "quit" called when not connected.')
            return False

PROVIDERS = {
    'sms': SMSConnection,
    'email': EmailConnection,
}


def notify(from_address, to_addresses, subject, body,
           hostname='localhost', port=25, username=None,
           password=None, use_tls=True, use_ssl=False,
           provider='email',log=None):

    global logger

    if not log:
        logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
        logger = logging.getLogger('rvapi')
    else:
        logging.basicConfig(level='DEBUG')
        logger = logging.getLogger()
        logger.addHandler(logging.StreamHandler(sys.stdout))

    try:
        connection = PROVIDERS[provider](hostname=hostname, port=port,
                                         username=username, password=password,
                                         use_tls=use_tls, use_ssl=use_ssl)
    except KeyError:
        logger.error('Invalid provider!')
        return False

    except ConnectionError:
        logger.error('Connection error!')
        return False

    try:
        connection.send(from_address=from_address,
                        to_addresses=to_addresses,
                        subject=subject,
                        text_body=body,
                        html_body="dfdfdfd")
    except SendError:
        logger.error('Error sending message!')
        return False
    else:
        connection.quit()

    return True
