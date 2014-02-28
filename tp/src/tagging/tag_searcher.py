import logging
import logging.config
from hashlib import sha256
from datetime import datetime

from tagging import *
from agent import *

from utils.common import *
from db.client import db_create_close, r
from plugins.patching import *
from plugins.patching.rv_db_calls import get_all_avail_stats_by_tagid, \
    get_all_app_stats_by_tagid
from errorz.error_messages import GenericResults, TagResults

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class TagSearcher():
    def __init__(self, username, customer_name,
                 uri=None, method=None, count=30,
                 offset=0, sort='asc',
                 sort_key=TagsKey.TagName):

        self.qcount = count
        self.qoffset = offset
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method
        self.list_of_valid_keys = [
            TagsKey.TagName, TagsKey.ProductionLevel,
        ]

        if sort_key in self.list_of_valid_keys:
            self.sort_key = sort_key
        else:
            self.sort_key = TagsKey.TagName

        if sort == 'asc':
            self.sort = r.asc
        else:
            self.sort = r.desc

    @db_create_close
    def search_by_name(self, query, conn=None):
        try:
            data = list(
                r
                .table(TagsCollection)
                .get_all(self.customer_name,
                    index=TagsIndexes.CustomerName)
                .filter(lambda x: x[self.sort_key].match(query))
                .order_by(self.sort(self.sort_key))
                .run(conn)
                )
            if data:
                for tag in xrange(len(data)):
                    data[tag][BASIC_RV_STATS] = (
                        get_all_avail_stats_by_tagid(
                            self.username, self.customer_name,
                            self.uri, self.method, data[tag][TagsKey.TagId]
                        )['data']
                    )

                    agents_in_tag = list(
                        r
                        .table(TagsPerAgentCollection)
                        .get_all(
                            data[tag][TagsPerAgentKey.TagId],
                            index=TagsPerAgentIndexes.TagId
                        )
                        .eq_join(TagsPerAgentKey.AgentId, r.table(AgentsCollection))
                        .zip()
                        .pluck(
                            TagsPerAgentKey.AgentId, AgentKey.ComputerName,
                            AgentKey.DisplayName
                        )
                        .run(conn)
                    )
                    data[tag]['agents'] = agents_in_tag

            count = len(data)

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
                ).something_broke('search_by_tags', 'tags', e)
            )

            logger.exception(status['message'])

        return(status)


    @db_create_close
    def filter_by(self, fkey, fval, conn=None):
        try:
            if fkey in self.list_of_valid_keys:
                count = (
                    r
                    .table(TagsCollection)
                    .filter(
                        {
                            fkey: fval,
                            TagsKey.CustomerName: self.customer_name
                        }
                    )
                    .count()
                    .run(conn)
                )
                data = list(
                    r
                    .table(TagsCollection)
                    .filter(
                        {
                            fkey: fval,
                            TagsKey.CustomerName: self.customer_name
                        }
                    )
                    .order_by(self.sort(self.sort_key))
                    .skip(self.qoffset)
                    .limit(self.qcount)
                    .run(conn)
                )
                if data:
                    for tag in xrange(len(data)):
                        data[tag][BASIC_RV_STATS] = (
                            get_all_avail_stats_by_tagid(
                                self.username, self.customer_name,
                                self.uri, self.method, tag[TagsKey.TagId]
                            )['data']
                        )

                        agents_in_tag = list(
                            r
                            .table(TagsPerAgentCollection)
                            .get_all(data[tag][TagsPerAgentKey.Id],
                                     index=TagsPerAgentIndexes.TagId)
                            .eq_join(TagsPerAgentKey.AgentId, r.table(AgentsCollection))
                            .zip()
                            .pluck(
                                TagsPerAgentKey.AgentId, AgentKey.ComputerName,
                                AgentKey.DisplayName)
                            .run(conn)
                        )
                        data[tag]['agents'] = agents_in_tag

                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).information_retrieved(data, count)
                )

                logger.info(status['message'])

            else:
                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).incorrect_arguments(data, count)
                )

                logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke('search_tags_by_filter', 'tags', e)
            )

            logger.exception(status['message'])

        return(status)

    @db_create_close
    def get_all(self, conn=None):
        try:
            count = (
                r
                .table(TagsCollection)
                .get_all(self.customer_name, index=TagsIndexes.CustomerName)
                .count()
                .run(conn)
            )
            data = list(
                r
                .table(TagsCollection)
                .get_all(self.customer_name, index=TagsIndexes.CustomerName)
                .order_by(self.sort(self.sort_key))
                .skip(self.qoffset)
                .limit(self.qcount)
                .run(conn)
            )

            if data:
                for tag in xrange(len(data)):
                    data[tag][BASIC_RV_STATS] = (
                        get_all_avail_stats_by_tagid(
                            self.username, self.customer_name,
                            self.uri, self.method, data[tag][TagsKey.TagId]
                        )['data']
                    )

                    agents_in_tag = list(
                        r
                        .table(TagsPerAgentCollection)
                        .get_all(data[tag][TagsPerAgentKey.TagId],
                                 index=TagsPerAgentIndexes.TagId)
                        .eq_join(TagsPerAgentKey.AgentId, r.table(AgentsCollection))
                        .zip()
                        .pluck(
                            TagsPerAgentKey.AgentId, AgentKey.ComputerName,
                            AgentKey.DisplayName)
                        .run(conn)
                    )
                    data[tag]['agents'] = agents_in_tag

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
                ).something_broke('get_all_tags', 'tags', e)
            )

            logger.exception(status['message'])

        return(status)

    @db_create_close
    def get_tag(self, tag_id, conn=None):
        try:
            tag_info = (
                r
                .table(TagsCollection)
                .get(tag_id)
                .run(conn)
            )

            if tag_info:
                agents_in_tag = list(
                    r
                    .table(TagsPerAgentCollection)
                    .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
                    .eq_join(TagsPerAgentKey.AgentId, r.table(AgentsCollection))
                    .zip()
                    .pluck(
                        TagsPerAgentKey.AgentId, AgentKey.ComputerName,
                        AgentKey.DisplayName)
                    .run(conn)
                )

                tag_info[BASIC_RV_STATS] = (
                    get_all_app_stats_by_tagid(
                        self.username, self.customer_name,
                        self.uri, self.method, tag_id
                    )['data']
                )

                tag_info['agents'] = agents_in_tag

                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).information_retrieved(tag_info, 1)
                )

                logger.info(status['message'])

            else:
                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).invalid_id(tag_id, 'tag_id')
                )

                logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri, self.method
                ).something_broke(tag_id, 'tags', e)
            )

            logger.exception(status['message'])

        return(status)
