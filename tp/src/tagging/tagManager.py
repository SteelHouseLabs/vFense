#!/usr/bin/env python
import logging
import logging.config

from tagging import *
from agent import *
from plugins.patching import *

from db.client import db_create_close, r, db_connect
from errorz.error_messages import GenericResults, TagResults

import redis
from rq import Connection, Queue

rq_host = 'localhost'
rq_port = 6379
rq_db = 0

rq_pool = redis.StrictRedis(host=rq_host, port=rq_port, db=rq_db)

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

@db_create_close
def tag_exists(tag_id, conn=None):
    tag_info = None

    try:
        tag_info = (
            r
            .table(TagsCollection)
            .get(tag_id)
            .pluck(TagsKey.TagId, TagsKey.TagName)
            .run(conn)
        )

    except Exception as e:
        logger.exception(e)

    return(tag_info)

@db_create_close
def get_tags_by_agent_id(agent_id=None, conn=None):
    tag_info = []
    if agent_id:
        tag_info = list(
            r
            .table(TagsPerAgentCollection)
            .get_all(agent_id, index=TagsPerAgentKey.AgentId)
            .eq_join(TagsPerAgentKey.TagId, r.table(TagsCollection))
            .zip()
            .map(
                {
                    TagsPerAgentKey.TagId: r.row[TagsPerAgentKey.TagId],
                    TagsPerAgentKey.TagName: r.row[TagsKey.TagName]
                }
            )
            .distinct()
            .run(conn)
        )

    return(tag_info)

@db_create_close
def get_tag_ids_by_agent_id(agent_id=None, conn=None):
    tag_ids = []
    if agent_id:
        tag_ids = (
            r
            .table(TagsPerAgentCollection)
            .get_all(agent_id, index=TagsPerAgentIndexes.AgentId)
            .pluck(TagsPerAgentKey.TagId)
            .distinct()
            .map(lambda x: x[TagsPerAgentKey.TagId])
            .run(conn)
        )

    return(tag_ids)


@db_create_close
def get_agent_ids_from_tag(tag_id=None, conn=None):
    agent_ids = []
    if tag_id:
        agent_ids = (
            r
            .table(TagsPerAgentCollection)
            .get_all(tag_id, index=TagsPerAgentIndexes.TagId)
            .map(lambda x: x[TagsPerAgentKey.AgentId])
            .distinct()
            .run(conn)
        )

    return(agent_ids)


@db_create_close
def get_tags_info(customer_name=None,
                  keys_to_pluck=None, conn=None):

    if keys_to_pluck and not customer_name:
        tags = list(
            r
            .table(TagsCollection)
            .pluck(keys_to_pluck)
            .run(conn)
        )

    elif keys_to_pluck and customer_name:
        tags = list(
            r
            .table(TagsCollection)
            .get_all(customer_name, index=TagsIndexes.CustomerName)
            .pluck(keys_to_pluck)
            .run(conn)
        )

    else:
        tags = list(
            r
            .table(TagsCollection)
            .run(conn)
        )

    return(tags)


@db_create_close
def delete_agent_from_all_tags(agent_id, conn=None):
    deleted = True
    try:
        (
            r
            .table(TagsPerAgentCollection)
            .get_all(agent_id, index=TagsPerAgentIndexes.AgentId)
            .delete()
            .run(conn)
        )

    except Exception as e:
        logger.exception(e)
        deleted = False

    return(deleted)


@db_create_close
def get_tags_info_from_tag_ids(tag_ids, keys_to_pluck=None, conn=None):

    if not keys_to_pluck:
        tags = list(
            r
            .expr(tag_ids)
            .map(
                lambda tag_id:
                r
                .table(TagsCollection)
                .get(tag_id)
            )
            .run(conn)
        )

    else:
        tags = list(
            r
            .expr(tag_ids)
            .map(
                lambda tag_id:
                r
                .table(TagsCollection)
                .get(tag_id)
                .pluck(keys_to_pluck)
            )
            .run(conn)
        )

    return(tags)


@db_create_close
def get_all_tag_ids(customer_name=None, conn=None):
    if customer_name:
        tag_ids = list(
            r
            .table(TagsCollection)
            .get_all(customer_name, index=TagsIndexes.CustomerName)
            .map(lambda x: x[TagsKey.TagId])
            .run(conn)
        )

    else:
        tag_ids = list(
            r
            .table(TagsCollection)
            .map(lambda x: x[TagKey.AgentId])
            .run(conn)
        )

    return(tag_ids)


@db_create_close
def tag_lister(customer_name='default', query=None, conn=None):
    """
        return a list of tags in json
    """
    if query:
        tags = list(
            r
            .table(TagsCollection)
            .get_all(customer_name, index=TagsIndexes.CustomerName)
            .filter(lambda x: x[TagsKey.TagName].match(query))
            .run(conn)
        )

    else:
        tags = list(
            r
            .table(TagsCollection)
            .get_all(customer_name, index=TagsIndexes.CustomerName)
            .order_by(TagsKey.TagName)
            .run(conn)
        )

    if tags:
        for tag in xrange(len(tags)):
            agents_in_tag = list(
                r
                .table(TagsPerAgentCollection)
                .get_all(tags[tag]['id'], index=TagsPerAgentIndexes.TagId)
                .eq_join(TagsPerAgentKey.AgentId, r.table(TagsCollection))
                .zip()
                .pluck(
                    TagsPerAgentKey.AgentId, AgentKey.ComputerName,
                    AgentKey.DisplayName
                )
                .run(conn)
            )
            tags[tag][AgentsCollection] = agents_in_tag

    return(
        {
            'pass': True,
            'message': '',
            'data': tags
        }
    )


class TagsManager(object):
    def __init__(self, username, customer_name, uri=None, method=None):
        self.username = username
        self.customer_name = customer_name
        self.uri = uri
        self.method = method

    @db_create_close
    def create_tag(self, tag_name, prod_level='Production', conn=None):
        tag_id = None
        ninsert = {
            TagsKey.TagName: tag_name,
            TagsKey.CustomerName: self.customer_name,
            TagsKey.ProductionLevel: prod_level,
        }
        try:
            tag_exists = list(
                r
                .table(TagsCollection)
                .get_all([self.customer_name, tag_name],
                         index=TagsIndexes.TagNameAndCustomer)
                .pluck(TagsKey.TagId)
                .run(conn)
            )
            if len(tag_exists) == 0:
                inserted = (
                    r
                    .table(TagsCollection)
                    .insert(ninsert)
                    .run(conn)
                )
                if 'inserted' in inserted:
                    tag_id = inserted['generated_keys'][0]
                    data = {
                        TagsKey.TagId: tag_id,
                        TagsKey.TagName: tag_name,
                    }

                    status = (
                        GenericResults(
                            self.username, self.uri,
                            self.method
                        ).object_created(tag_id, tag_name, data)
                    )

                    logger.info(status['message'])

            else:
                status = (
                    GenericResults(
                        self.username, self.uri,
                        self.method
                    ).object_exists(tag_id, tag_name)
                )

                logger.warn(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri,
                    self.method
                ).something_broke(tag_name, 'while creating a tag', e)
            )

            logger.exception(e)

        return(status)

    @db_create_close
    def add_tags_to_agent(self, tag_id, agent_id, conn=None):

        try:
            tag_for_agent_exists = list(
                r
                .table(TagsPerAgentCollection)
                .get_all(
                    [agent_id, tag_id],
                    index=TagsPerAgentIndexes.AgentIdAndTagId
                )
                .run(conn)
            )

            tag_info = r.table(TagsCollection).get(tag_id).run(conn)
            tag_name = tag_info[TagsKey.TagName]

            if not tag_for_agent_exists:
                agent_info = (
                    r
                    .table(AgentsCollection)
                    .get(agent_id)
                    .run(conn)
                )

                if agent_info:
                    tag_agent_info = (
                        {
                            TagsPerAgentKey.AgentId: agent_id,
                            TagsPerAgentKey.TagId: tag_id,
                        }
                    )

                    add_agent_to_tag = (
                        r
                        .table(TagsPerAgentCollection)
                        .insert(tag_agent_info)
                        .run(conn)
                    )

                    if 'inserted' in add_agent_to_tag:
                        status = (
                            GenericResults(
                                self.username, self.uri,
                                self.method
                            ).object_updated(tag_id, 'tag_id', tag_agent_info)
                        )

                        logger.info(status['message'])

            else:
                status = (
                    GenericResults(
                        self.username, self.uri,
                        self.method
                    ).object_exists(tag_id, 'tag')
                )

                logger.warn(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri,
                    self.method
                ).something_broke(tag_id, 'adding tag to agent', e)
            )

            logger.exception(e)

        return(status)

    def add_agents_to_tag(self, agent_id, tag_id):
        return(self.add_tags_to_agent(tag_id, agent_id))

    @db_create_close
    def remove_tag_from_agent(self, tag_id, agent_id, genstats=True, conn=None):
        try:
            remove_agent_from_tag = (
                r
                .table(TagsPerAgentCollection)
                .get_all([agent_id, tag_id],
                         index=TagsPerAgentIndexes.AgentIdAndTagId)
                .delete()
                .run(conn)
            )

            status = (
                TagResults(
                    self.username, self.uri, self.method
                ).removed_tag_from_agent(tag_id, agent_id)
            )

            logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri,
                    self.method
                ).something_broke(tag_id, 'removing tag from agent', e)
            )

            logger.exception(e)

        return(status)

    @db_create_close
    def remove_all_agents_from_tag(self, tag_id, conn=None):
        try:
            agents_deleted = 0
            agent_ids = list(
                r
                .table(TagsPerAgentCollection)
                .get_all(tag_id, index=TagsPerAgentKey.TagId)
                .map(lambda x: x[TagsPerAgentKey.AgentId])
                .run(conn)
            )
            total_agents = len(agent_ids)

            if len(agent_ids) > 0:
                for agent_id in agent_ids:
                    agent_deleted_from_tag = (
                        self.remove_tag_from_agent(
                            tag_id, agent_id, genstats=False
                        )
                    )
                    if agent_deleted_from_tag['http_status'] == 200:
                        agents_deleted += 1

                if total_agents == agents_deleted:
                    status = (
                        TagResults(
                            self.username, self.uri, self.method
                        ).removed_all_agents_from_tag(tag_id)
                    )

                    logger.info(status['message'])

                else:
                    status = (
                        TagResults(
                            self.username, self.uri, self.method
                        ).failed_to_remove_all_agents_from_tag(tag_id)
                    )

                    logger.error(status['message'])


            else:
                status = (
                    TagResults(
                        self.username, self.uri, self.method
                    ).removed_all_agents_from_tag(tag_id)
                )

                logger.info(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri,
                    self.method
                ).something_broke(tag_id, 'removing all agents from tag', e)
            )

            logger.exception(e)

        return(status)

    @db_create_close
    def remove_tag(self, tag_id, conn=None):
        try:
            agents_deleted_status = self.remove_all_agents_from_tag(tag_id)
            if agents_deleted_status['http_status'] == 200:
                tag_deleted = (
                    r
                    .table(TagsCollection)
                    .get(tag_id)
                    .delete()
                    .run(conn)
                )
                status = (
                    GenericResults(
                        self.username, self.uri, self.method
                    ).object_deleted(tag_id, 'tag_id')
                )

                logger.info(status['message'])

            else:
                status = (
                    TagResults(
                        self.username, self.uri, self.method
                    ).failed_to_remove_tag(tag_id)
                )

                logger.error(status['message'])

        except Exception as e:
            status = (
                GenericResults(
                    self.username, self.uri,
                    self.method
                ).something_broke(tag_id, 'tag', e)
            )

            logger.exception(e)

        return(status)
