import logging
from datetime import datetime
import smtplib

from notifications import *
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from db.client import db_create_close, r


logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


@db_create_close
def email_config_exists(customer_name=None, conn=None):
    mail_exists = False
    try:
        mail_config = list(
            r
            .table(NotificationCollections.NotificationPlugins)
            .get_all(customer_name, index=NotificationPluginIndexes.CustomerName)
            .filter(
                {
                    NotificationPluginKeys.PluginName: 'email'
                }
            )
            .run(conn)
        )
        if mail_config:
            mail_exists = (True, mail_config[0][NotificationPluginKeys.Id])

    except Exception as e:
        msg = 'Failed to get mail config: %s' % (e)
        logger.error(msg)

    return(mail_exists)


@db_create_close
def get_email_config(customer_name=None, conn=None):
    mail_config = None
    config_exists = False
    msg = ''
    try:
        mail_config = list(
            r
            .table(NotificationCollections.NotificationPlugins)
            .get_all(customer_name, index=NotificationPluginIndexes.CustomerName)
            .filter(
                {
                    NotificationPluginKeys.PluginName: 'email'
                }
            )
            .run(conn)
        )
        if not mail_config:
            mail_config = {
                'modified_time': '',
                'username': '',
                'password': '',
                'server': '',
                'port': '',
                'is_tls': '',
                'is_ssl': '',
                'from_email': '',
                'to_email': '',
                'last_modify_user': '',
            }
            msg = 'mail_config does not exist'
        else:
            config_exists = True

    except Exception as e:
        msg = 'Failed to get mail config: %s' % (str(e))
        logger.exception(e)

    return(
        {
            'pass': config_exists,
            'message': msg,
            'data': mail_config
        }
    )


@db_create_close
def delete_email_config(customer_name=None, conn=None):
    deleted = False
    try:
        mail_deleted = (
            r
            .table(NotificationCollections.NotificationPlugins)
            .get_all(customer_name, index=NotificationPluginIndexes.CustomerName)
            .filter(
                {
                    NotificationPluginKeys.PluginName: 'email'
                }
            )
            .delete()
            .run(conn)
        )
        if 'deleted' in mail_deleted:
            if mail_deleted['deleted'] > 0:
                deleted = True

    except Exception as e:
        msg = (
            'Failed to delete mail config for customer %s: %s' %
            (customer_name, e)
        )

        logger.error(msg)

    return(deleted)


@db_create_close
def create_or_modify_mail_config(modifying_username=None, customer_name=None,
                                 server=None, username=None, password=None,
                                 port=25, is_tls=False, is_ssl=False,
                                 from_email=None, to_email=None, conn=None):
    created = False
    msg = ''
    base_config = []
    email_uuid = None
    if (server and username and password and port and customer_name
            and modifying_username and from_email and len(to_email) > 0):

        modified_time = str(datetime.now())
        to_email = ','.join(to_email)
        base_config = {
            NotificationPluginKeys.ModifiedTime: modified_time,
            NotificationPluginKeys.UserName: username,
            NotificationPluginKeys.Password: password,
            NotificationPluginKeys.Server: server,
            NotificationPluginKeys.Port: port,
            NotificationPluginKeys.IsTls: is_tls,
            NotificationPluginKeys.IsSsl: is_ssl,
            NotificationPluginKeys.FromEmail: from_email,
            NotificationPluginKeys.ToEmail: to_email,
            NotificationPluginKeys.PluginName: 'email',
            NotificationPluginKeys.CustomerName: customer_name,
            NotificationPluginKeys.ModifiedBy: modifying_username,
        }

        config_exists = email_config_exists(customer_name=customer_name)
        if config_exists:
            email_uuid = config_exists[1]
            try:
                (
                    r
                    .table(NotificationCollections.NotificationPlugins)
                    .get(config_exists[1])
                    .update(base_config)
                    .run(conn)
                )
                created = True
                msg = (
                    'Email config for customer %s has been updated' %
                    (customer_name)
                )

            except Exception as e:
                msg = 'Failed to update mail config: %s' (e)
                logger.error(msg)
        else:
            try:
                is_created = (
                    r
                    .table(NotificationCollections.NotificationPlugins)
                    .insert(base_config, upsert=True)
                    .run(conn)
                )
                if 'inserted' in is_created:
                    if 'generated_keys' in is_created:
                        if len(is_created['generated_keys']) > 0:
                            email_uuid = is_created['generated_keys'[0]]
                created = True
                msg = (
                    'Email config for customer %s has been created' %
                    (customer_name)
                )

            except Exception as e:
                msg = 'Failed to update mail config: %s' % (e)
                logger.exception(e)

    return(
        {
            'pass': created,
            'message': msg,
            'data': [base_config]
        }
    )


class MailClient():
    def __init__(self, customer_name):
        self.CONFIG = None
        self.validated = False
        self.connected = False
        self.error = None
        data = get_email_config(customer_name=customer_name)
        self.config_exists = False
        if data['pass']:
            config = data['data'][0]
            self.config_exists = data['pass']
        

        if self.config_exists:
            self.server = config['server']
            self.username = config['username']
            self.password = config['password']
            self.port = config['port']
            self.from_email = config['from_email']
            self.to_email = config['to_email'].split(",")
            self.is_tls = config['is_tls']
            self.is_ssl = config['is_ssl']

        else:
            self.server = None
            self.username = None
            self.password = None
            self.port = None
            self.from_email = None
            self.to_email = None
            self.is_tls = None
            self.is_ssl = None

    def server_status(self):
        msg = ''
        try:
            ehlo = self.mail.ehlo()
            if ehlo[0] == 250:
                self.connected = True

            self.server_reply_code = ehlo[0]
            self.server_reply_message = ehlo[1]
            msg = self.server_reply_message
            logger.info(msg)

        except Exception as e:
            msg = (
                'Connection to mail server %s has not been initialized: %s' %
                (self.server, e)
            )
            logger.exception(msg)

        return(msg)

    def connect(self):
        connected = False
        logged_in = False
        msg = None
        mail = None

        try:
            if self.is_ssl:
                mail = smtplib.SMTP_SSL(self.server, int(self.port), timeout=10)

            else:
                mail = smtplib.SMTP(self.server, int(self.port), timeout=10)
            connected = True

        except Exception as e:
            logger.exception(e)
            msg = e

        if connected:
            try:
                if self.is_tls:
                    mail.starttls()
                mail.login(self.username, self.password)
                logged_in = True

            except Exception as e:
                logger.exception(e)
                msg = e

        self.connected = connected
        self.error = msg
        self.logged_in = logged_in
        self.mail = mail

        return(connected, msg, logged_in, mail)

    def disconnect(self):
        msg = ''
        self.disconnected = False
        try:
            loggedout = self.mail.quit()
            msg = (
                'Logged out of Email Server %s: %s' %
                (self.server, loggedout)
            )
            self.disconnected = True
            logger.info(msg)
        except Exception as e:
            msg = (
                'Failed to log out of %s: %s' %
                (self.server, e)
            )
            self.disconnected = True
            logger.exception(e)

        return(self.disconnected, msg)

    def send(self, subject, msg_body, to_addresses=None, body_type='html'):
        completed = True
        from_address = None
        try:
            from_address = self.from_email

        except Exception as e:
            msg = 'From_address has not been set'
            logger.exception(msg)

        if not to_addresses:
            try:
                to_addresses = self.to_email

            except Exception as e:
                msg = 'Pass a valid email address:%s' % (e)
                logger.exception(msg)
                completed = False

        if isinstance(to_addresses, list):
            msg = MIMEMultipart('alternative')
            msg['From'] = from_address
            msg['To'] = ','.join(list(to_addresses))
            msg['Subject'] = subject
            formatted_body = MIMEText(msg_body, body_type)
            msg.attach(formatted_body)
            try:
                self.mail.sendmail(
                    from_address,
                    to_addresses,
                    msg.as_string()
                )
            except Exception as e:
                completed = False
                msg = (
                    'Could not send mail to %s: %s' %
                    (','.join(to_addresses), e)
                )
                logger.exception(msg)


        return(completed)
