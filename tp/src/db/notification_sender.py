import logging
import logging.config
from db.client import db_create_close, r
from db.notificationhandler import RvNotificationHandler, \
    notification_rule_exists, translate_opercodes_to_notif_threshold
from operations import *
from operations.operation_manager import get_oper_info
from operations.retriever import OperationRetriever
from notifications import *
from errorz.error_messages import OperationCodes, GenericResults
from emailer.mailer import MailClient

from tornado.template import Loader

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvnotifications')
TEMPLATE_DIR = ('/opt/TopPatch/tp/src/emailer/templates')

def send_data(customer_name, subject, msg_body, sender_addresses, html=True):
    try:
        if html:
            mail_content_type = 'html'
        else:
            mail_content_type = 'txt'
        mailer = MailClient(customer_name)
        mailer.connect()
        if mailer.connected:
            mailer.send(
                subject, msg_body,
                sender_addresses, mail_content_type
            )

        mailer.disconnect()

    except Exception as e:
        logger.exception(e)


def parse_install_operation_data(oper_data, oper_type, oper_plugin, threshold):
    try:
        loader = Loader(TEMPLATE_DIR)
        subject = 'TopPatch Alert'
        if oper_plugin == RV_PLUGIN:
            if oper_type == INSTALL or oper_type == UNINSTALL:
                if threshold == 'fail':
                    message = 'Operation %s Failed' % (oper_type.capitalize())
                    msg_body = (
                        loader.load('apps_install.html')
                        .generate(message_items=oper_data, message=message)
                    )

                elif threshold == 'pass':
                    message = 'Operation %s Passed' % (oper_type.capitalize())
                    msg_body = (
                        loader.load('apps_install.html')
                        .generate(message_items=oper_data, message=message)
                    )


        elif oper_plugin == CORE_PLUGIN:
            if oper_type == REBOOT or oper_type == SHUTDOWN:
                if threshold == 'fail':
                    message = 'Operation %s Failed' % (oper_type.capitalize())
                    msg_body = (
                        loader.load('agent_base.html')
                        .generate(message_items=oper_data, message=message)
                    )

                elif threshold == 'pass':
                    message = 'Operation %s Passed' % (oper_type.capitalize())
                    msg_body = (
                        loader.load('agent_base.html')
                        .generate(message_items=oper_data, message=message)
                    )


        return(subject, msg_body)

    except Exception as e:
        logger.exception(e)

def send_notifications(username, customer_name, operation_id, agent_id):
    try:
        notif_handler = RvNotificationHandler(customer_name, operation_id, agent_id)
        oper_info = get_oper_info(operation_id)
        oper_plugin = oper_info[OperationKey.Plugin]
        oper_status = oper_info[OperationKey.OperationStatus]
        threshold = translate_opercodes_to_notif_threshold(oper_status)
        oper_type = return_notif_type_from_operation(oper_info[OperationKey.Operation])
        notif_rules = (
            notification_rule_exists(
                notif_handler, oper_plugin, oper_type, threshold
            )
        )

        if notif_rules:
            if oper_plugin == RV_PLUGIN or oper_plugin == CORE_PLUGIN:
                sender_addresses = (
                    notif_handler.get_sending_emails(notif_rules)
                )
                oper = OperationRetriever(username, customer_name, None, None)
                oper_data = oper.get_install_operation_for_email_alert(operation_id)

                if sender_addresses:
                    subject, msg_body  = (
                        parse_install_operation_data(
                            oper_data, oper_type,
                            oper_plugin, threshold
                        )
                    )

                    send_data(
                        customer_name, subject,
                        msg_body, sender_addresses
                    )

    except Exception as e:
        logger.exception(e)
