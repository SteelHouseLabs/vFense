import logging
import logging.config
import ast

from db.client import *

from receiver.corehandler import process_queue_data

from json import dumps
import redis

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


def get_agent_queue(agent_id):

    if agent_id is None:
        return dumps([])

    rqueue = QueueWorker({'agent_id': agent_id})
    agent_queue = process_queue_data(
        rqueue,
        rqueue.exists()
    )

    return agent_queue


class QueueWorker():

    def __init__(self, data, username):
        self.username = username
        self.redis = redis.StrictRedis(connection_pool=pool)
        self.data = data
        if 'agent_id' in self.data:
            self.agent_id = self.data['agent_id']
        elif 'id' in self.data:
            self.agent_id = self.data['id']

        self.redis_connected = self.redis.ping()

    def exists(self):
        self.queue_exists = self.redis.exists(self.agent_id)
        return self.queue_exists

    def lget_object_in_queue(self):
        queue = self.redis.lpop(self.agent_id)
        queue = ast.literal_eval(queue)
        return queue

    def rget_object_in_queue(self):
        queue = self.redis.rpop(self.agent_id)
        queue = ast.literal_eval(queue)
        return queue

    def get_all_objects_in_queue(self):
        queue = self.redis.lrange(self.agent_id, 0, -1)
        for i in range(len(queue)):
            queue[i] = ast.literal_eval(queue[i])
        self.redis.delete(self.agent_id)
        return queue

    def lpush_object_in_queue(self, message=None):
        if not message:
            message = self.data
        pushed = self.redis.lpush(self.agent_id, message)
        if pushed > 0:
            msg = '%s - %s added to the beginning of the redis queue %s' % \
                  (self.username, dumps(message), self.agent_id)
            logger.info(msg)
        else:
            msg = ('%s - %s failed to add into the \
                    begining of the redis queue %s' %
                  (self.username, dumps(message), self.agent_id))
            logger.error(msg)

    def rpush_object_in_queue(self, message=None):
        if not message:
            message = self.data
        pushed = self.redis.rpush(self.agent_id, message)
        if pushed > 0:
            msg = '%s - %s added to the tail of the redis queue %s' % \
                  (self.username, dumps(message), self.agent_id)
            logger.info(msg)
        else:
            msg = ('%s - %s failed to add into the tail \
                    of the redis queue %s' %
                   (self.username, dumps(message), self.agent_id))
            logger.error(msg)
