# -*- coding: utf-8 -*-

from __future__ import division, print_function, unicode_literals
import argparse
import daemon
import json
import lockfile
import logging
import logging.config
import notifier
import os
import re
import redis
import signal
import sys
from tornado.template import Loader

DEFAULT_WORKING_DIRECTORY = '/opt/TopPatch'
DEFAULT_UMASK = 0
RELATIVE_PIDFILE = 'var/run/notifier.pid'
ABSOLUTE_PIDFILE = os.path.join(DEFAULT_WORKING_DIRECTORY, RELATIVE_PIDFILE)
DEFAULT_SMTP_HOST = 'localhost:25'
RELATIVE_LOGGING_CONFIG = 'conf/logging.config'
ABSOLUTE_LOGGING_CONFIG = os.path.join(DEFAULT_WORKING_DIRECTORY, RELATIVE_LOGGING_CONFIG)
DEFAULT_CHANNEL = 'test'
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')
TEXT_TEMPLATE = 'alert.txt'
HTML_TEMPLATE = 'alert.html'
INVALID_NAME_REGEX = r'[^\w.-_]'

# this needs to be global in order to clean up the smtp connection
# after receiving a SIGTERM
email_connection = None

logging.config.fileConfig(ABSOLUTE_LOGGING_CONFIG)
logger = logging.getLogger('rvnotifier')


def parse_arguments():
    parser = argparse.ArgumentParser(description='Daemon to send email alerts.')

    parser.add_argument('-f', '--from', dest='from_address', required=True,
                        help='The email address from which the alert will be sent.')
    parser.add_argument('-p', '--password', dest='password',
                        help='Your SMTP password.')
    parser.add_argument('-s', '--host', dest='hostname', default='localhost:25',
                        help='The SMTP server hostname.')
    #parser.add_argument('-t', '--to', dest='to_addresses', required=True, nargs='*',
                        #help='The list of addresses to send email notifications to.')
    parser.add_argument('-u', '--username', dest='username',
                        help='Your SMTP username.')
    parser.add_argument('--use-tls', action='store_true', dest='use_tls',
                        help='Use `STARTTLS` encryption.')
    parser.add_argument('--use-ssl', action='store_true', dest='use_ssl',
                        help='Use SSL encryption.')
    parser.add_argument('-l', '--log-file', dest='logfile',
                        help='The logfile to use.')
    parser.add_argument('-d', '--debug', dest='debug', action='store_true',
                        help='Start in debug mode.')

    return parser.parse_args()


def cleanup():
    global email_connection

    if email_connection and email_connection.is_connected:
        email_connection.quit()


def watch_redis(channel, from_address):
    global email_connection

    redis_pool = redis.ConnectionPool()
    conn = redis.StrictRedis(connection_pool=redis_pool)
    pubsub = conn.pubsub()
    pubsub.subscribe(channel)

    for message in pubsub.listen():
        notifier.logger.info(message['data'])
        try:
            message_items = json.loads(message['data'])
        except ValueError:
            notifier.logger.warn('Not a JSON object.')
            continue
        except Exception as e:
            notifier.logger.error(str(e))
            continue

        template_name = message_items.get('template_name', 'default')
        if re.search(INVALID_NAME_REGEX, template_name):
            notifier.logger.error('Invalid template name.')
            continue

        subject = message_items.get('subject', 'TopPatch Alert!')
        to_addresses = message_items.get('to_addresses', [])
        message_keys = message_items.get('message_keys', [])

        # use templates for both text and HTML
        loader = Loader(TEMPLATE_DIR)
        text_body = (loader
                     .load(template_name + '.txt')
                     .generate(message_items=message_keys))
        html_body = (loader
                     .load(template_name + '.html')
                     .generate(message_items=message_keys))

        email_connection.send(from_address, to_addresses, subject,
                              text_body, html_body)


def mainloop():
    while True:
        try:
            pass
        except Exception as e:
            notifier.logger.error(str(e))


def daemonize(
    channel,
    from_address,
    hostname='localhost',
    port=25,
    username=None,
    password=None,
    use_tls=False,
    use_ssl=False,
    working_directory=DEFAULT_WORKING_DIRECTORY,
    umask=DEFAULT_UMASK,
    pidfile=ABSOLUTE_PIDFILE
):
    # create the working directory if it doesn't exist
    if not os.path.isdir(working_directory):
        os.makedirs(working_directory, 0o755)

    if not os.path.isdir(os.path.dirname(pidfile)):
        os.makedirs(os.path.dirname(pidfile))

    context = daemon.DaemonContext(
        working_directory=working_directory,
        umask=umask,
        pidfile=lockfile.FileLock(pidfile),
        files_preserve=[notifier.logger.handlers[0].stream.fileno()]
    )

    context.signal_map = {
        signal.SIGTERM: cleanup,
        signal.SIGHUP: 'terminate',
    }

    with context:
        global email_connection

        #logging.config.fileConfig(ABSOLUTE_LOGGING_CONFIG)
        #notifier.logger = logging.getLogger('rvapi')
        #notifier.logger.debug('Notifier process forked successfully.')

        email_connection = notifier.EmailConnection(
            hostname=hostname,
            port=port,
            username=username,
            password=password,
            use_tls=use_tls,
            use_ssl=use_ssl
        )

        watch_redis(
            channel=channel,
            from_address=from_address
        )


def main():
    arguments = parse_arguments()

    #if arguments.logfile:
        #logging.config.fileConfig(arguments.logfile)
        #notifier.logger = logging.getLogger('rvapi')
    #elif arguments.debug:
        #logging.basicConfig(level='DEBUG')
        #notifier.logger = logging.getLogger()
        #notifier.logger.addHandler(logging.StreamHandler(sys.stdout))
    #else:
        #logging.config.fileConfig(ABSOLUTE_LOGGING_CONFIG)
        #notifier.logger = logging.getLogger('rvapi')

    if arguments.use_tls and arguments.use_ssl:
        notifier.logger.error('You cannot use both TLS and SSL.')
        sys.exit(1)

    host_info = arguments.hostname
    if ':' in host_info:
        hostname, port = host_info.split(':')
        port = int(port)
    else:
        hostname, port = host_info, 25

    return daemonize(
        channel=DEFAULT_CHANNEL,
        from_address=arguments.from_address,
        hostname=hostname,
        port=port,
        username=arguments.username,
        password=arguments.password,
        use_tls=arguments.use_tls,
        use_ssl=arguments.use_ssl
    )

if __name__ == '__main__':
    sys.exit(main())
