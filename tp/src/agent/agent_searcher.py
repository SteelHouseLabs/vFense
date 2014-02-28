import logging
import logging.config
from agent import *

from utils.common import *
from db.client import db_create_close, r
from plugins.patching import *
from plugins.patching.rv_db_calls import get_all_app_stats_by_agentid
from errorz.error_messages import GenericResults

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class AgentSearcher():
    def __init__(self, username, customer_name,
                 uri=None, method=None, count=30,
                 offset=0, sort='asc',
                 sort_key=AgentKey.ComputerName):

        self.count = count
        self.offset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.list_of_valid_keys = [
            AgentKey.ComputerName, AgentKey.HostName,
            AgentKey.DisplayName, AgentKey.OsCode,
            AgentKey.OsString, AgentKey.AgentId, AgentKey.AgentStatus,
            AgentKey.NeedsReboot, AgentKey.BasicStats,
            AgentKey.ProductionLevel
        ]
        self.keys_to_pluck = [
            AgentKey.ComputerName, AgentKey.HostName,
            AgentKey.DisplayName, AgentKey.OsCode,
            AgentKey.OsString, AgentKey.AgentId, AgentKey.AgentStatus,
            AgentKey.NeedsReboot, AgentKey.BasicStats,
            AgentKey.ProductionLevel
        ]

        self.valid_keys_to_filter_by = (
            [
                AgentKey.OsCode,
                AgentKey.OsString,
                AgentKey.AgentStatus,
                AgentKey.ProductionLevel
            ]
        )

        valid_keys_to_sort_by = (
            [
                AgentKey.ComputerName,
                AgentKey.HostName,
                AgentKey.DisplayName,
                AgentKey.OsCode,
                AgentKey.OsString,
                AgentKey.AgentStatus,
                AgentKey.ProductionLevel
            ]
        )
        if sort_key in valid_keys_to_sort_by:
            self.sort_key = sort_key
        else:
            self.sort_key = AgentKey.ComputerName

        if sort == 'asc':
            self.sort = r.asc
        else:
            self.sort = r.desc

    @db_create_close
    def query_agents_by_name(self, query, conn=None):
        try:
            count = (
                r
                .table(AgentsCollection)
                .get_all(self.customer_name, index=AgentKey.CustomerName)
                .filter(
                    (r.row[AgentKey.ComputerName].match("(?i)"+query))
                    |
                    (r.row[AgentKey.DisplayName].match("(?i)"+query))
                )
                .count()
                .run(conn)
            )

            data = list(
                r
                .table(AgentsCollection)
                .filter(
                    (r.row[AgentKey.ComputerName].match("(?i)"+query))
                    |
                    (r.row[AgentKey.DisplayName].match("(?i)"+query))
                )
                .pluck(self.keys_to_pluck)
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .run(conn)
            )

            if data:
                for agent in data:
                    agent[BASIC_RV_STATS] = (
                        get_all_app_stats_by_agentid(
                            self.username, self.customer_name,
                            self.uri, self.method, agent[AgentKey.AgentId]
                        )['data']
                    )

            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).information_retrieved(data, count)
            )

            logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).something_broke('agent_query', 'agent', e)
            )
            logger.exception(status['message'])

        return(status)

    @db_create_close
    def get_all_agents(self, conn=None):
        try:
            count = (
                r
                .table(AgentsCollection)
                .get_all(self.customer_name, index=AgentKey.CustomerName)
                .count()
                .run(conn)
            )

            data = list(
                r
                .table(AgentsCollection)
                .get_all(self.customer_name, index=AgentKey.CustomerName)
                .order_by(AgentKey.ComputerName)
                .pluck(self.keys_to_pluck)
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .run(conn)
            )

            if data:
                for agent in data:
                    agent[BASIC_RV_STATS] = (
                        get_all_app_stats_by_agentid(
                            self.username, self.customer_name,
                            self.uri, self.method, agent[AgentKey.AgentId]
                        )['data']
                    )

            status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).information_retrieved(data, count)
            )

            logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('get_all_agents', 'agent', e)
            )

        return(status)

    @db_create_close
    def filter_by(self, fkey, fval, conn=None):
        try:
            if fkey in self.valid_keys_to_filter_by:
                count = (
                    r
                    .table(AgentsCollection)
                    .get_all(self.customer_name, index=AgentKey.CustomerName)
                    .filter({fkey: fval})
                    .count()
                    .run(conn)
                )

                data = list(
                    r
                    .table(AgentsCollection)
                    .get_all(self.customer_name, index=AgentKey.CustomerName)
                    .filter({fkey: fval})
                    .pluck(self.keys_to_pluck)
                    .order_by(self.sort(self.sort_key))
                    .skip(self.offset)
                    .limit(self.count)
                    .run(conn)
                )

                if data:
                    for agent in data:
                        agent[BASIC_RV_STATS] = (
                            get_all_app_stats_by_agentid(
                                self.username, self.customer_name,
                                self.uri, self.method, agent[AgentKey.AgentId]
                            )['data']
                        )

                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).information_retrieved(data, count)
                )

            else:
                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_filter(fkey)
                )


        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('filter', 'agent', e)
            )

        return(status)

    @db_create_close
    def filter_by_and_query(self, fkey, fval, query, conn=None):
        try:
            if fkey in self.valid_keys_to_filter_by:
                count = (
                    r
                    .table(AgentsCollection)
                    .get_all(self.customer_name, index=AgentKey.CustomerName)
                    .filter({fkey: fval})
                    .filter(
                        (r.row[AgentKey.ComputerName].match("(?i)"+query))
                        |
                        (r.row[AgentKey.DisplayName].match("(?i)"+query))
                    )
                    .count()
                    .run(conn)
                )

                data = list(
                    r
                    .table(AgentsCollection)
                    .get_all(self.customer_name, index=AgentKey.CustomerName)
                    .filter({fkey: fval})
                    .filter(
                        (r.row[AgentKey.ComputerName].match("(?i)"+query))
                        |
                        (r.row[AgentKey.DisplayName].match("(?i)"+query))
                    )
                    .pluck(self.keys_to_pluck)
                    .order_by(self.sort(self.sort_key))
                    .skip(self.offset)
                    .limit(self.count)
                    .run(conn)
                )

                if data:
                    for agent in data:
                        agent[BASIC_RV_STATS] = (
                            get_all_app_stats_by_agentid(
                                self.username, self.customer_name,
                                self.uri, self.method, agent[AgentKey.AgentId]
                            )['data']
                        )

                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).information_retrieved(data, count)
                )

            else:
                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_filter(fkey)
                )


        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('filter', 'agent', e)
            )

        return(status)



    @db_create_close
    def query_agents_by_ip(self, query, conn=None):
        try:
            count = (
                r
                .table(HardwarePerAgentCollection)
                .get_all(
                    HardwarePerAgentKey.Nic,
                    index=HardwarePerAgentIndexes.Type
                )
                .filter(r.row[HardwarePerAgentKey.IpAddress].match("(?i)"+query))
                .pluck(self.keys_to_pluck)
                .distinct()
                .count()
                .run(conn)
            )

            data = list(
                r
                .table(HardwarePerAgentCollection)
                .get_all(
                    HardwarePerAgentKey.Nic,
                    index=HardwarePerAgentIndexes.Type
                )
                .eq_join(HardwarePerAgentKey.AgentId, r.table(AgentsCollection))
                .zip()
                .filter(r.row[HardwarePerAgentKey.IpAddress].match("(?i)"+query))
                .pluck(self.keys_to_pluck)
                .distinct()
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .run(conn)
            )

            if data:
                for agent in data:
                    agent[BASIC_RV_STATS] = (
                        get_all_app_stats_by_agentid(
                            self.username, self.customer_name,
                            self.uri, self.method, agent[AgentKey.AgentId]
                        )['data']
                    )

            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).information_retrieved(data, count)
            )

            logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).something_broke('agent_query', 'agent', e)
            )
            logger.exception(status['message'])

        return(status)

    @db_create_close
    def query_agents_by_ip_and_filter(self, query, fkey, fval, conn=None):
        try:
            count = (
                r
                .table(HardwarePerAgentCollection)
                .get_all(
                    HardwarePerAgentKey.Nic,
                    index=HardwarePerAgentIndexes.Type
                )
                .filter({fkey: fval})
                .filter(r.row[HardwarePerAgentKey.IpAddress].match("(?i)"+query))
                .pluck(self.keys_to_pluck)
                .distinct()
                .count()
                .run(conn)
            )

            data = list(
                r
                .table(HardwarePerAgentCollection)
                .get_all(
                    HardwarePerAgentKey.Nic,
                    index=HardwarePerAgentIndexes.Type
                )
                .eq_join(HardwarePerAgentKey.AgentId, r.table(AgentsCollection))
                .zip()
                .filter({fkey: fval})
                .filter(r.row[HardwarePerAgentKey.IpAddress].match("(?i)"+query))
                .pluck(self.keys_to_pluck)
                .distinct()
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .run(conn)
            )

            if data:
                for agent in data:
                    agent[BASIC_RV_STATS] = (
                        get_all_app_stats_by_agentid(
                            self.username, self.customer_name,
                            self.uri, self.method, agent[AgentKey.AgentId]
                        )['data']
                    )

            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).information_retrieved(data, count)
            )

            logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).something_broke('agent_query', 'agent', e)
            )
            logger.exception(status['message'])

        return(status)


    @db_create_close
    def query_agents_by_mac(self, query, conn=None):
        try:
            count = (
                r
                .table(HardwarePerAgentCollection)
                .get_all(
                    HardwarePerAgentKey.Nic,
                    index=HardwarePerAgentIndexes.Type
                )
                .filter(r.row[HardwarePerAgentKey.Mac].match("(?i)"+query))
                .pluck(self.keys_to_pluck)
                .distinct()
                .count()
                .run(conn)
            )

            data = list(
                r
                .table(HardwarePerAgentCollection)
                .get_all(
                    HardwarePerAgentKey.Nic,
                    index=HardwarePerAgentIndexes.Type
                )
                .eq_join(HardwarePerAgentKey.AgentId, r.table(AgentsCollection))
                .zip()
                .filter(r.row[HardwarePerAgentKey.Mac].match("(?i)"+query))
                .pluck(self.keys_to_pluck)
                .distinct()
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .run(conn)
            )

            if data:
                for agent in data:
                    agent[BASIC_RV_STATS] = (
                        get_all_app_stats_by_agentid(
                            self.username, self.customer_name,
                            self.uri, self.method, agent[AgentKey.AgentId]
                        )['data']
                    )

            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).information_retrieved(data, count)
            )

            logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).something_broke('agent_query', 'agent', e)
            )
            logger.exception(status['message'])

        return(status)


    @db_create_close
    def query_agents_by_mac_and_filter(self, query, fkey, fval, conn=None):
        try:
            count = (
                r
                .table(HardwarePerAgentCollection)
                .get_all(
                    HardwarePerAgentKey.Nic,
                    index=HardwarePerAgentIndexes.Type
                )
                .filter({fkey: fval})
                .filter(r.row[HardwarePerAgentKey.Mac].match("(?i)"+query))
                .pluck(self.keys_to_pluck)
                .distinct()
                .count()
                .run(conn)
            )

            data = list(
                r
                .table(HardwarePerAgentCollection)
                .get_all(
                    HardwarePerAgentKey.Nic,
                    index=HardwarePerAgentIndexes.Type
                )
                .eq_join(HardwarePerAgentKey.AgentId, r.table(AgentsCollection))
                .zip()
                .filter({fkey: fval})
                .filter(r.row[HardwarePerAgentKey.Mac].match("(?i)"+query))
                .pluck(self.keys_to_pluck)
                .distinct()
                .order_by(self.sort(self.sort_key))
                .skip(self.offset)
                .limit(self.count)
                .run(conn)
            )

            if data:
                for agent in data:
                    agent[BASIC_RV_STATS] = (
                        get_all_app_stats_by_agentid(
                            self.username, self.customer_name,
                            self.uri, self.method, agent[AgentKey.AgentId]
                        )['data']
                    )

            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).information_retrieved(data, count)
            )

            logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username,
                    self.uri, self.method
                ).something_broke('agent_query', 'agent', e)
            )
            logger.exception(status['message'])

        return(status)

