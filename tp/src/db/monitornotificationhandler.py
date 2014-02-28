import logging
import logging.config
from db.client import db_create_close, r

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvnotifications')

class MonitoringNotificationHandler():
    def __init__(self, agentid=None, plugin='rv',
                 oper_type='install', threshold='both',
                 data=None, error=None, conn=None):

        self.agentid = agentid
        self.plugin = plugin
        self.oper_type = oper_type
        self.threshold = threshold
        self.data = data
        self.rules_exists = self.rule_exist_on_agent()
        self.user_emails = self.get_sending_emails()

    @db_create_close
    def rule_exist_on_agent(self, conn=None):
        rules_exist = None
        if self.agentid and self.plugin and self.oper_type and self.threshold:
            email_sender_list = []

            if not self.filesystem and self.plugin == 'monitoring':
                rules_exist = list(
                    r
                    .table('notification_per_agent')
                    .get_all('agent_id', index='agent_id')
                    .filter(
                        {
                            'monitoring_operation_type': self.oper_type,
                            'plugin_name': self.plugin
                        }
                    )
                    .filter(r.row['monitoring_threshold'] >= self.threshold)
                    .run(conn)
                )

            elif self.filesystem and self.plugin == 'monitoring':
                rules_exist = list(
                    r
                    .table('notification_per_agent')
                    .get_all('agent_id', index='agent_id')
                    .filter(
                        {
                            'monitoring_operation_type': self.oper_type,
                            'plugin_name': self.plugin
                        }
                    )
                    .filter(
                        lambda x: x['file_system'].match(self.filesystem)
                    )
                    .filter(r.row['monitoring_threshold'] >= self.threshold)
                    .run(conn)
                )

    return(rules_exist)


