# -*- coding: utf-8 -*-
from functools import partial
from itertools import izip
from collections import namedtuple
import logging
import weakref
import datetime
import time as mod_time

from tornado.ioloop import IOLoop
from tornado import gen

from .exceptions import RequestError, ConnectionError, ResponseError
from .connection import Connection


log = logging.getLogger('tornadoredis.client')


Message = namedtuple('Message', ('kind', 'channel', 'body', 'pattern'))


class CmdLine(object):
    def __init__(self, cmd, *args, **kwargs):
        self.cmd = cmd
        self.args = args
        self.kwargs = kwargs

    def __repr__(self):
        return self.cmd + '(' + str(self.args) + ',' + str(self.kwargs) + ')'


def string_keys_to_dict(key_string, callback):
    return dict([(key, callback) for key in key_string.split()])


def dict_merge(*dicts):
    merged = {}
    for d in dicts:
        merged.update(d)
    return merged


def reply_to_bool(r, *args, **kwargs):
    return bool(r)


def make_reply_assert_msg(msg):
    def reply_assert_msg(r, *args, **kwargs):
        return r == msg
    return reply_assert_msg


def reply_set(r, *args, **kwargs):
    return set(r)


def reply_dict_from_pairs(r, *args, **kwargs):
    return dict(izip(r[::2], r[1::2]))


def reply_str(r, *args, **kwargs):
    return r or ''


def reply_int(r, *args, **kwargs):
    return int(r) if r is not None else None


def reply_number(r, *args, **kwargs):
    if r is not None:
        num = float(r)
        if not num.is_integer():
            return num
        else:
            return int(num)
    return None


def reply_datetime(r, *args, **kwargs):
    return datetime.datetime.fromtimestamp(int(r))


def reply_pubsub_message(r, *args, **kwargs):
    '''
    Handles a Pub/Sub message and packs its data into a Message object.
    '''
    if len(r) == 3:
        (kind, channel, body) = r
        pattern = channel
    elif len(r) == 4:
        (kind, pattern, channel, body) = r
    elif len(r) == 1:
        kind = r[0]
        channel = body = pattern = None
    else:
        raise ValueError('Invalid number of arguments')
    return Message(kind, channel, body, pattern)


def reply_zset(r, *args, **kwargs):
    if (not r) or (not 'WITHSCORES' in args):
        return r
    return zip(r[::2], map(reply_number, r[1::2]))


def reply_hmget(r, key, *fields, **kwargs):
    return dict(zip(fields, r))


def reply_info(response, *args):
    info = {}

    def get_value(value):
        # Does this string contain subvalues?
        if (',' not in value) or ('=' not in value):
            return value
        sub_dict = {}
        for item in value.split(','):
            k, v = item.split('=')
            try:
                sub_dict[k] = int(v)
            except ValueError:
                sub_dict[k] = v
        return sub_dict
    for line in response.splitlines():
        line = line.strip()
        if line and not line.startswith('#'):
            key, value = line.split(':')
            try:
                info[key] = int(value)
            except ValueError:
                info[key] = get_value(value)
    return info


def reply_ttl(r, *args, **kwargs):
    return r != -1 and r or None


def to_list(source):
    if isinstance(source, basestring):
        return [source]
    else:
        return list(source)


PUB_SUB_COMMANDS = set([
    'SUBSCRIBE',
    'PSUBSCRIBE',
    'UNSUBSCRIBE',
    'PUNSUBSCRIBE',
    # Not a command at all
    'LISTEN',
])


REPLY_MAP = dict_merge(
    string_keys_to_dict('AUTH BGREWRITEAOF BGSAVE DEL EXISTS '
                        'EXPIRE HDEL HEXISTS '
                        'HMSET MOVE PERSIST RENAMENX SISMEMBER SMOVE '
                        'SETEX SAVE SETNX MSET',
                        reply_to_bool),
    string_keys_to_dict('BITCOUNT DECRBY GETBIT HLEN INCRBY LINSERT '
                        'LPUSHX RPUSHX SADD SCARD SDIFFSTORE SETBIT SETRANGE '
                        'SINTERSTORE STRLEN SUNIONSTORE SETRANGE',
                        reply_int),
    string_keys_to_dict('FLUSHALL FLUSHDB SELECT SET SETEX '
                        'SHUTDOWN RENAME RENAMENX WATCH UNWATCH',
                        make_reply_assert_msg('OK')),
    string_keys_to_dict('SMEMBERS SINTER SUNION SDIFF',
                        reply_set),
    string_keys_to_dict('HGETALL BRPOP BLPOP',
                        reply_dict_from_pairs),
    string_keys_to_dict('HGET',
                        reply_str),
    string_keys_to_dict('SUBSCRIBE UNSUBSCRIBE LISTEN '
                        'PSUBSCRIBE UNSUBSCRIBE',
                        reply_pubsub_message),
    string_keys_to_dict('ZRANK ZREVRANK',
                        reply_int),
    string_keys_to_dict('ZCOUNT ZCARD',
                        reply_int),
    string_keys_to_dict('ZRANGE ZRANGEBYSCORE ZREVRANGE '
                        'ZREVRANGEBYSCORE',
                        reply_zset),
    string_keys_to_dict('ZSCORE ZINCRBY',
                        reply_number),
    {'HMGET': reply_hmget,
     'PING': make_reply_assert_msg('PONG'),
     'LASTSAVE': reply_datetime,
     'TTL': reply_ttl,
     'INFO': reply_info,
     'MULTI_PART': make_reply_assert_msg('QUEUED'),
     'TIME': lambda x: (int(x[0]), int(x[1]))}
)


class Client(object):
#    __slots__ = ('_io_loop', '_connection_pool', 'connection', 'subscribed',
#                 'password', 'selected_db', '_pipeline', '_weak')

    def __init__(self, host='localhost', port=6379, unix_socket_path=None,
                 password=None, selected_db=None, io_loop=None,
                 connection_pool=None):
        self._io_loop = io_loop or IOLoop.instance()
        self._connection_pool = connection_pool
        self._weak = weakref.proxy(self)
        if connection_pool:
            connection = (connection_pool
                          .get_connection(event_handler_proxy=self._weak))
        else:
            connection = Connection(host=host, port=port,
                                    unix_socket_path=unix_socket_path,
                                    weak_event_handler=self._weak,
                                    io_loop=self._io_loop)
        self.connection = connection
        self.subscribed = False
        self.password = password
        self.selected_db = selected_db
        self._pipeline = None

    def __del__(self):
        try:
            connection = self.connection
            pool = self._connection_pool
        except AttributeError:
            connection = None
            pool = None
        if connection:
            if pool:
                pool.release(connection)
                connection.wait_until_ready()
            else:
                connection.disconnect()

    def __repr__(self):
        return 'tornadoredis.Client (db=%s)' % (self.selected_db)

    def __enter__(self):
        return self

    def __exit__(self, *args, **kwargs):
        pass

    def __getattribute__(self, item):
        """
        Bind methods to the weak proxy to avoid memory leaks
        when bound method is passed as argument to the gen.Task
        constructor.
        """
        a = super(Client, self).__getattribute__(item)
        try:
            if callable(a) and a.__self__:
                try:
                    a = self.__class__.__dict__[item]
                except KeyError:
                    a = Client.__dict__[item]
                a = partial(a, self._weak)
        except AttributeError:
            pass
        return a

    def pipeline(self, transactional=False):
        """
        Creates the 'Pipeline' to send multiple redis commands
        in a single request.

        Usage:
            pipe = self.client.pipeline()
            pipe.hset('foo', 'bar', 1)
            pipe.expire('foo', 60)

            yield gen.Task(pipe.execute)

        or:

            with self.client.pipeline() as pipe:
                pipe.hset('foo', 'bar', 1)
                pipe.expire('foo', 60)

                yield gen.Task(pipe.execute)
        """
        if not self._pipeline:
            self._pipeline = Pipeline(
                transactional=transactional,
                selected_db=self.selected_db,
                password=self.password,
                io_loop=self._io_loop,
            )
            self._pipeline.connection = self.connection
        return self._pipeline

    def on_disconnect(self):
        if self.subscribed:
            self.subscribed = False
        raise ConnectionError("Socket closed on remote end")

    #### connection
    def connect(self):
        if not self.connection.connected():
            pool = self._connection_pool
            if pool:
                old_conn = self.connection
                self.connection = pool.get_connection(event_handler_proxy=self)
                self.connection.ready_callbacks = old_conn.ready_callbacks
            else:
                self.connection.connect()

    @gen.engine
    def disconnect(self, callback=None):
        """
        Disconnects from the Redis server.
        """
        connection = self.connection
        if connection:
            pool = self._connection_pool
            if pool:
                pool.release(connection)
                yield gen.Task(connection.wait_until_ready)
                proxy = pool.make_proxy(client_proxy=self._weak,
                                        connected=False)
                self.connection = proxy
            else:
                self.connection.disconnect()
        if callback:
            callback(False)

    #### formatting
    def encode(self, value):
        if isinstance(value, str):
            return value
        elif isinstance(value, unicode):
            return value.encode('utf-8')
        return str(value)

    def format_command(self, *tokens, **kwargs):
        cmds = []
        for t in tokens:
            e_t = self.encode(t)
            cmds.append('$%s\r\n%s\r\n' % (len(e_t), e_t))
        return '*%s\r\n%s' % (len(tokens), ''.join(cmds))

    def format_reply(self, cmd_line, data):
        if cmd_line.cmd not in REPLY_MAP:
            return data
        try:
            res = REPLY_MAP[cmd_line.cmd](data,
                                          *cmd_line.args,
                                          **cmd_line.kwargs)
        except Exception, e:
            raise ResponseError(
                'failed to format reply to %s, raw data: %s; err message: %s'
                % (cmd_line, data, e), cmd_line
            )
        return res
    ####

    @gen.engine
    def execute_command(self, cmd, *args, **kwargs):
        result = None

        callback = kwargs.get('callback', None)
        del kwargs['callback']
        cmd_line = CmdLine(cmd, *args, **kwargs)
        if self.subscribed and cmd not in PUB_SUB_COMMANDS:
            callback(RequestError(
                'Calling not pub/sub command during subscribed state',
                cmd_line))
            return

        n_tries = 2
        while n_tries > 0:
            n_tries -= 1
            if not self.connection.connected():
                self.connection.connect()

            if not self.connection.ready():
                yield gen.Task(self.connection.wait_until_ready)

            if not self.subscribed and cmd not in ('AUTH', 'SELECT'):
                if (self.password and
                    self.connection.info.get('pass', None) != self.password):
                    yield gen.Task(self.auth, self.password)
                if (self.selected_db and
                    self.connection.info.get('db', None) != self.selected_db):
                    yield gen.Task(self.select, self.selected_db)

            command = self.format_command(cmd, *args, **kwargs)
            try:
                yield gen.Task(self.connection.write, command)
            except Exception, e:
                self.connection.disconnect()
                if not n_tries:
                    raise e
                else:
                    continue

            if ((cmd in PUB_SUB_COMMANDS) or
                (self.subscribed and cmd == 'PUBLISH')):
                result = True
                break
            else:
                result = None
                data = yield gen.Task(self.connection.readline)
                if not data:
                    if not n_tries:
                        raise ConnectionError('no data received')
                else:
                    resp = self.process_data(data, cmd_line)
                    if isinstance(resp, partial):
                        resp = yield gen.Task(resp)
                    result = self.format_reply(cmd_line, resp)
                    break

        if cmd not in ('AUTH', 'SELECT'):
            self.connection.execute_pending_command()

        if callback:
            callback(result)

    @gen.engine
    def _consume_bulk(self, tail, callback=None):
        response = yield gen.Task(self.connection.read, int(tail) + 2)
        if isinstance(response, Exception):
            raise response
        if not response:
            raise ResponseError('EmptyResponse')
        else:
            response = response[:-2]
        callback(response)

    def process_data(self, data, cmd_line):
        data = data[:-2]  # strip \r\n

        if data == '$-1':
            response = None
        elif data == '*0' or data == '*-1':
            response = []
        else:
            head, tail = data[0], data[1:]

            if head == '*':
                return partial(self.consume_multibulk, int(tail), cmd_line)
            elif head == '$':
                return partial(self._consume_bulk, tail)
            elif head == '+':
                response = tail
            elif head == ':':
                response = int(tail)
            elif head == '-':
                if tail.startswith('ERR'):
                    tail = tail[4:]
                response = ResponseError(tail, cmd_line)
            else:
                raise ResponseError('Unknown response type %s' % head,
                                    cmd_line)
        return response

    @gen.engine
    def consume_multibulk(self, length, cmd_line, callback=None):
        tokens = []
        while len(tokens) < length:
            data = yield gen.Task(self.connection.readline)
            if not data:
                raise ResponseError(
                    'Not enough data in response to %s, accumulated tokens: %s'
                    % (cmd_line, tokens),
                    cmd_line)
            token = self.process_data(data, cmd_line)
            if isinstance(token, partial):
                token = yield gen.Task(token)
            tokens.append(token)

        callback(tokens)

    ### MAINTENANCE
    def bgrewriteaof(self, callback=None):
        self.execute_command('BGREWRITEAOF', callback=callback)

    def dbsize(self, callback=None):
        self.execute_command('DBSIZE', callback=callback)

    def flushall(self, callback=None):
        self.execute_command('FLUSHALL', callback=callback)

    def flushdb(self, callback=None):
        self.execute_command('FLUSHDB', callback=callback)

    def ping(self, callback=None):
        self.execute_command('PING', callback=callback)

    def object(self, infotype, key, callback=None):
        self.execute_command('OBJECT', infotype, key, callback=callback)

    def info(self, section_name=None, callback=None):
        args = ('INFO', )
        if section_name:
            args += (section_name, )
        self.execute_command(*args, callback=callback)

    def echo(self, value, callback=None):
        self.execute_command('ECHO', value, callback=callback)

    def time(self, callback=None):
        """
        Returns the server time as a 2-item tuple of ints:
        (seconds since epoch, microseconds into this second).
        """
        self.execute_command('TIME', callback=callback)

    def select(self, db, callback=None):
        self.selected_db = db
        if self.connection.info.get('db', None) != db:
            self.connection.info['db'] = db
            self.execute_command('SELECT', db, callback=callback)
        elif callback:
            callback(True)

    def shutdown(self, callback=None):
        self.execute_command('SHUTDOWN', callback=callback)

    def save(self, callback=None):
        self.execute_command('SAVE', callback=callback)

    def bgsave(self, callback=None):
        self.execute_command('BGSAVE', callback=callback)

    def lastsave(self, callback=None):
        self.execute_command('LASTSAVE', callback=callback)

    def keys(self, pattern='*', callback=None):
        self.execute_command('KEYS', pattern, callback=callback)

    def auth(self, password, callback=None):
        self.password = password
        if self.connection.info.get('pass', None) != password:
            self.connection.info['pass'] = password
            self.execute_command('AUTH', password, callback=callback)
        elif callback:
            callback(True)

    ### BASIC KEY COMMANDS
    def append(self, key, value, callback=None):
        self.execute_command('APPEND', key, value, callback=callback)

    def getrange(self, key, start, end, callback=None):
        """
        Returns the substring of the string value stored at ``key``,
        determined by the offsets ``start`` and ``end`` (both are inclusive)
        """
        self.execute_command('GETRANGE', key, start, end, callback=callback)

    def expire(self, key, ttl, callback=None):
        self.execute_command('EXPIRE', key, ttl, callback=callback)

    def expireat(self, key, when, callback=None):
        """
        Sets an expire flag on ``key``. ``when`` can be represented
        as an integer indicating unix time or a Python datetime.datetime object.
        """
        if isinstance(when, datetime.datetime):
            when = int(mod_time.mktime(when.timetuple()))
        self.execute_command('EXPIREAT', key, when, callback=callback)

    def ttl(self, key, callback=None):
        self.execute_command('TTL', key, callback=callback)

    def type(self, key, callback=None):
        self.execute_command('TYPE', key, callback=callback)

    def randomkey(self, callback=None):
        self.execute_command('RANDOMKEY', callback=callback)

    def rename(self, src, dst, callback=None):
        self.execute_command('RENAME', src, dst, callback=callback)

    def renamenx(self, src, dst, callback=None):
        self.execute_command('RENAMENX', src, dst, callback=callback)

    def move(self, key, db, callback=None):
        self.execute_command('MOVE', key, db, callback=callback)

    def persist(self, key, callback=None):
        self.execute_command('PERSIST', key, callback=callback)

    def pexpire(self, key, time, callback=None):
        """
        Set an expire flag on key ``key`` for ``time`` milliseconds.
        ``time`` can be represented by an integer or a Python timedelta
        object.
        """
        if isinstance(time, datetime.timedelta):
            ms = int(time.microseconds / 1000)
            time = time.seconds + time.days * 24 * 3600 * 1000 + ms
        self.execute_command('PEXPIRE', key, time, callback=callback)

    def pexpireat(self, key, when, callback=None):
        """
        Set an expire flag on key ``key``. ``when`` can be represented
        as an integer representing unix time in milliseconds (unix time * 1000)
        or a Python datetime.datetime object.
        """
        if isinstance(when, datetime.datetime):
            ms = int(when.microsecond / 1000)
            when = int(mod_time.mktime(when.timetuple())) * 1000 + ms
        self.execute_command('PEXPIREAT', key, when, callback=callback)

    def pttl(self, key, callback=None):
        "Returns the number of milliseconds until the key will expire"
        self.execute_command('PTTL', key, callback=callback)

    def substr(self, key, start, end, callback=None):
        self.execute_command('SUBSTR', key, start, end, callback=callback)

    def delete(self, *keys, **kwargs):
        self.execute_command('DEL', *keys, callback=kwargs.get('callback'))

    def set(self, key, value, callback=None):
        self.execute_command('SET', key, value, callback=callback)

    def setex(self, key, ttl, value, callback=None):
        self.execute_command('SETEX', key, ttl, value, callback=callback)

    def setnx(self, key, value, callback=None):
        self.execute_command('SETNX', key, value, callback=callback)

    def setrange(self, key, offset, value, callback=None):
        self.execute_command('SETRANGE', key, offset, value, callback=callback)

    def strlen(self, key, callback=None):
        self.execute_command('STRLEN', key, callback=callback)

    def mset(self, mapping, callback=None):
        items = []
        for pair in mapping.iteritems():
            items.extend(pair)
        self.execute_command('MSET', *items, callback=callback)

    def msetnx(self, mapping, callback=None):
        items = []
        [items.extend(pair) for pair in mapping.iteritems()]
        self.execute_command('MSETNX', *items, callback=callback)

    def get(self, key, callback=None):
        self.execute_command('GET', key, callback=callback)

    def mget(self, keys, callback=None):
        self.execute_command('MGET', *keys, callback=callback)

    def getset(self, key, value, callback=None):
        self.execute_command('GETSET', key, value, callback=callback)

    def exists(self, key, callback=None):
        self.execute_command('EXISTS', key, callback=callback)

    def sort(self, key, start=None, num=None, by=None, get=None, desc=False,
             alpha=False, store=None, callback=None):
        if (start is not None and num is None) \
        or (num is not None and start is None):
            raise ValueError("``start`` and ``num`` must both be specified")

        tokens = [key]
        if by is not None:
            tokens.append('BY')
            tokens.append(by)
        if start is not None and num is not None:
            tokens.append('LIMIT')
            tokens.append(start)
            tokens.append(num)
        if get is not None:
            tokens.append('GET')
            tokens.append(get)
        if desc:
            tokens.append('DESC')
        if alpha:
            tokens.append('ALPHA')
        if store is not None:
            tokens.append('STORE')
            tokens.append(store)
        self.execute_command('SORT', *tokens, callback=callback)

    def getbit(self, key, offset, callback=None):
        self.execute_command('GETBIT', key, offset, callback=callback)

    def setbit(self, key, offset, value, callback=None):
        self.execute_command('SETBIT', key, offset, value, callback=callback)

    def bitcount(self, key, start=None, end=None, callback=None):
        args = [a for a in (key, start, end) if a is not None]
        kwargs = {'callback': callback}
        self.execute_command('BITCOUNT', *args, **kwargs)

    def bitop(self, operation, dest, *keys, **kwargs):
        """
        Perform a bitwise operation using ``operation`` between ``keys`` and
        store the result in ``dest``.
        """
        kwargs = {'callback': kwargs.get('callback', None)}
        self.execute_command('BITOP', operation, dest, *keys, **kwargs)

    ### COUNTERS COMMANDS
    def incr(self, key, callback=None):
        self.execute_command('INCR', key, callback=callback)

    def decr(self, key, callback=None):
        self.execute_command('DECR', key, callback=callback)

    def incrby(self, key, amount, callback=None):
        self.execute_command('INCRBY', key, amount, callback=callback)

    def incrbyfloat(self, key, amount=1.0, callback=None):
        self.execute_command('INCRBYFLOAT', key, amount, callback=callback)

    def decrby(self, key, amount, callback=None):
        self.execute_command('DECRBY', key, amount, callback=callback)

    ### LIST COMMANDS
    def blpop(self, keys, timeout=0, callback=None):
        tokens = to_list(keys)
        tokens.append(timeout)
        self.execute_command('BLPOP', *tokens, callback=callback)

    def brpop(self, keys, timeout=0, callback=None):
        tokens = to_list(keys)
        tokens.append(timeout)
        self.execute_command('BRPOP', *tokens, callback=callback)

    def brpoplpush(self, src, dst, timeout=1, callback=None):
        tokens = [src, dst, timeout]
        self.execute_command('BRPOPLPUSH', *tokens, callback=callback)

    def lindex(self, key, index, callback=None):
        self.execute_command('LINDEX', key, index, callback=callback)

    def llen(self, key, callback=None):
        self.execute_command('LLEN', key, callback=callback)

    def lrange(self, key, start, end, callback=None):
        self.execute_command('LRANGE', key, start, end, callback=callback)

    def lrem(self, key, value, num=0, callback=None):
        self.execute_command('LREM', key, num, value, callback=callback)

    def lset(self, key, index, value, callback=None):
        self.execute_command('LSET', key, index, value, callback=callback)

    def ltrim(self, key, start, end, callback=None):
        self.execute_command('LTRIM', key, start, end, callback=callback)

    def lpush(self, key, *values, **kwargs):
        callback = kwargs.get('callback', None)
        self.execute_command('LPUSH', key, *values, callback=callback)

    def lpushx(self, key, value, callback=None):
        self.execute_command('LPUSHX', key, value, callback=callback)

    def linsert(self, key, where, refvalue, value, callback=None):
        self.execute_command('LINSERT', key, where, refvalue, value,
                             callback=callback)

    def rpush(self, key, *values, **kwargs):
        callback = kwargs.get('callback', None)
        self.execute_command('RPUSH', key, *values, callback=callback)

    def rpushx(self, key, value, **kwargs):
        "Push ``value`` onto the tail of the list ``name`` if ``name`` exists"
        callback = kwargs.get('callback', None)
        self.execute_command('RPUSHX', key, value, callback=callback)

    def lpop(self, key, callback=None):
        self.execute_command('LPOP', key, callback=callback)

    def rpop(self, key, callback=None):
        self.execute_command('RPOP', key, callback=callback)

    def rpoplpush(self, src, dst, callback=None):
        self.execute_command('RPOPLPUSH', src, dst, callback=callback)

    ### SET COMMANDS
    def sadd(self, key, *values, **kwargs):
        callback = kwargs.get('callback', None)
        self.execute_command('SADD', key, *values, callback=callback)

    def srem(self, key, *values, **kwargs):
        callback = kwargs.get('callback', None)
        self.execute_command('SREM', key, *values, callback=callback)

    def scard(self, key, callback=None):
        self.execute_command('SCARD', key, callback=callback)

    def spop(self, key, callback=None):
        self.execute_command('SPOP', key, callback=callback)

    def smove(self, src, dst, value, callback=None):
        self.execute_command('SMOVE', src, dst, value, callback=callback)

    def sismember(self, key, value, callback=None):
        self.execute_command('SISMEMBER', key, value, callback=callback)

    def smembers(self, key, callback=None):
        self.execute_command('SMEMBERS', key, callback=callback)

    def srandmember(self, key, number=None, callback=None):
        if number:
            self.execute_command('SRANDMEMBER', key, number, callback=callback)
        else:
            self.execute_command('SRANDMEMBER', key, callback=callback)

    def sinter(self, keys, callback=None):
        self.execute_command('SINTER', *keys, callback=callback)

    def sdiff(self, keys, callback=None):
        self.execute_command('SDIFF', *keys, callback=callback)

    def sunion(self, keys, callback=None):
        self.execute_command('SUNION', *keys, callback=callback)

    def sinterstore(self, keys, dst, callback=None):
        self.execute_command('SINTERSTORE', dst, *keys, callback=callback)

    def sunionstore(self, keys, dst, callback=None):
        self.execute_command('SUNIONSTORE', dst, *keys, callback=callback)

    def sdiffstore(self, keys, dst, callback=None):
        self.execute_command('SDIFFSTORE', dst, *keys, callback=callback)

    ### SORTED SET COMMANDS
    def zadd(self, key, *score_value, **kwargs):
        callback = kwargs.get('callback', None)
        self.execute_command('ZADD', key, *score_value, callback=callback)

    def zcard(self, key, callback=None):
        self.execute_command('ZCARD', key, callback=callback)

    def zincrby(self, key, value, amount, callback=None):
        self.execute_command('ZINCRBY', key, amount, value, callback=callback)

    def zrank(self, key, value, callback=None):
        self.execute_command('ZRANK', key, value, callback=callback)

    def zrevrank(self, key, value, callback=None):
        self.execute_command('ZREVRANK', key, value, callback=callback)

    def zrem(self, key, *values, **kwargs):
        callback = kwargs.get('callback', None)
        self.execute_command('ZREM', key, *values, callback=callback)

    def zcount(self, key, start, end, callback=None):
        self.execute_command('ZCOUNT', key, start, end, callback=callback)

    def zscore(self, key, value, callback=None):
        self.execute_command('ZSCORE', key, value, callback=callback)

    def zrange(self, key, start, num, with_scores=True, callback=None):
        tokens = [key, start, num]
        if with_scores:
            tokens.append('WITHSCORES')
        self.execute_command('ZRANGE', *tokens, callback=callback)

    def zrevrange(self, key, start, num, with_scores, callback=None):
        tokens = [key, start, num]
        if with_scores:
            tokens.append('WITHSCORES')
        self.execute_command('ZREVRANGE', *tokens, callback=callback)

    def zrangebyscore(self, key, start, end, offset=None, limit=None,
                      with_scores=False, callback=None):
        tokens = [key, start, end]
        if offset is not None:
            tokens.append('LIMIT')
            tokens.append(offset)
            tokens.append(limit)
        if with_scores:
            tokens.append('WITHSCORES')
        self.execute_command('ZRANGEBYSCORE', *tokens, callback=callback)

    def zrevrangebyscore(self, key, end, start, offset=None, limit=None,
                         with_scores=False, callback=None):
        tokens = [key, end, start]
        if offset is not None:
            tokens.append('LIMIT')
            tokens.append(offset)
            tokens.append(limit)
        if with_scores:
            tokens.append('WITHSCORES')
        self.execute_command('ZREVRANGEBYSCORE', *tokens, callback=callback)

    def zremrangebyrank(self, key, start, end, callback=None):
        self.execute_command('ZREMRANGEBYRANK', key, start, end,
                             callback=callback)

    def zremrangebyscore(self, key, start, end, callback=None):
        self.execute_command('ZREMRANGEBYSCORE', key, start, end,
                             callback=callback)

    def zinterstore(self, dest, keys, aggregate=None, callback=None):
        return self._zaggregate('ZINTERSTORE', dest, keys, aggregate, callback)

    def zunionstore(self, dest, keys, aggregate=None, callback=None):
        return self._zaggregate('ZUNIONSTORE', dest, keys, aggregate, callback)

    def _zaggregate(self, command, dest, keys, aggregate, callback):
        tokens = [dest, len(keys)]
        if isinstance(keys, dict):
            items = keys.items()
            keys = [i[0] for i in items]
            weights = [i[1] for i in items]
        else:
            weights = None
        tokens.extend(keys)
        if weights:
            tokens.append('WEIGHTS')
            tokens.extend(weights)
        if aggregate:
            tokens.append('AGGREGATE')
            tokens.append(aggregate)
        self.execute_command(command, *tokens, callback=callback)

    ### HASH COMMANDS
    def hgetall(self, key, callback=None):
        self.execute_command('HGETALL', key, callback=callback)

    def hmset(self, key, mapping, callback=None):
        items = []
        map(items.extend, mapping.iteritems())
        self.execute_command('HMSET', key, *items, callback=callback)

    def hset(self, key, field, value, callback=None):
        self.execute_command('HSET', key, field, value, callback=callback)

    def hsetnx(self, key, field, value, callback=None):
        self.execute_command('HSETNX', key, field, value, callback=callback)

    def hget(self, key, field, callback=None):
        self.execute_command('HGET', key, field, callback=callback)

    def hdel(self, key, *fields, **kwargs):
        callback = kwargs.get('callback')
        self.execute_command('HDEL', key, *fields, callback=callback)

    def hlen(self, key, callback=None):
        self.execute_command('HLEN', key, callback=callback)

    def hexists(self, key, field, callback=None):
        self.execute_command('HEXISTS', key, field, callback=callback)

    def hincrby(self, key, field, amount=1, callback=None):
        self.execute_command('HINCRBY', key, field, amount, callback=callback)

    def hincrbyfloat(self, key, field, amount=1.0, callback=None):
        self.execute_command('HINCRBYFLOAT', key, field, amount,
                             callback=callback)

    def hkeys(self, key, callback=None):
        self.execute_command('HKEYS', key, callback=callback)

    def hmget(self, key, fields, callback=None):
        self.execute_command('HMGET', key, *fields, callback=callback)

    def hvals(self, key, callback=None):
        self.execute_command('HVALS', key, callback=callback)

    ### PUBSUB
    def subscribe(self, channels, callback=None):
        self._subscribe('SUBSCRIBE', channels, callback=callback)

    def psubscribe(self, channels, callback=None):
        self._subscribe('PSUBSCRIBE', channels, callback=callback)

    def _subscribe(self, cmd, channels, callback=None):
        if isinstance(channels, basestring):
            channels = [channels]
        if not self.subscribed:
            original_callback = callback

            def _cb(*args, **kwargs):
                self.on_subscribed(*args, **kwargs)
                original_callback(*args, **kwargs)

            callback = _cb if original_callback else self.on_subscribed
        self.execute_command(cmd, *channels, callback=callback)

    def on_subscribed(self, result):
        self.subscribed = True

    def unsubscribe(self, channels, callback=None):
        self._unsubscribe('UNSUBSCRIBE', channels, callback=callback)

    def punsubscribe(self, channels, callback=None):
        self._unsubscribe('PUNSUBSCRIBE', channels, callback=callback)

    def _unsubscribe(self, cmd, channels, callback=None):
        if isinstance(channels, basestring):
            channels = [channels]
        self.execute_command(cmd, *channels, callback=callback)

    def on_unsubscribed(self, *args, **kwargs):
        self.subscribed = False

    def publish(self, channel, message, callback=None):
        self.execute_command('PUBLISH', channel, message, callback=callback)

    @gen.engine
    def listen(self, callback=None):
        """
        Starts a Pub/Sub channel listening loop.
        Use the unsubscribe or punsubscribe methods to exit it.

        Each received message triggers the callback function.

        Callback function receives a Message object instance as argument.

        Here is an example of handling a channel subscription::

            def handle_message(msg):
                if msg.kind == 'message':
                    print msg.body
                elif msg.kind == 'disconnect':
                    # Disconnected from the redis server
                    pass

            yield client.subscribe('channel_name')
            client.listen(handle_message)
        """
        if callback:
            def error_wrapper(e):
                if isinstance(e, GeneratorExit):
                    return ConnectionError('Connection lost')
                else:
                    return e

            cmd_listen = CmdLine('LISTEN')
            while self.subscribed:
                data = yield gen.Task(self.connection.readline)
                if isinstance(data, Exception):
                    raise data

                if data is None:
                    # Disconnected from a server
                    self.subscribed = False
                    # Notify a calling
                    callback(reply_pubsub_message(('disconnect', )))
                    return

                response = self.process_data(data, cmd_listen)
                if isinstance(response, partial):
                    response = yield gen.Task(response)
                if isinstance(response, Exception):
                    raise response

                result = self.format_reply(cmd_listen, response)

                callback(result)
                if result.kind in ['unsubscribe', 'punsubscribe'] \
                and result.body == 0:
                    self.on_unsubscribed()

    ### CAS
    def watch(self, *key_names, **kwargs):
        callback = kwargs.get('callback', None)
        self.execute_command('WATCH', *key_names, callback=callback)

    def unwatch(self, callback=None):
        self.execute_command('UNWATCH', callback=callback)

    ### SCRIPTING COMMANDS
    def eval(self, script, keys=None, args=None, callback=None):
        if keys is None:
            keys = []
        if args is None:
            args = []
        num_keys = len(keys)
        keys.extend(args)
        self.execute_command('EVAL', script, num_keys,
                             *keys, callback=callback)

    def evalsha(self, shahash, keys=None, args=None, callback=None):
        if keys is None:
            keys = []
        if args is None:
            args = []
        num_keys = len(keys)
        keys.extend(args)
        self.execute_command('EVALSHA', shahash, num_keys,
                             *keys, callback=callback)

    def script_exists(self, shahashes, callback=None):
        # not yet implemented in the redis protocol
        self.execute_command('SCRIPT EXISTS', *shahashes, callback=callback)

    def script_flush(self, callback=None):
        # not yet implemented in the redis protocol
        self.execute_command('SCRIPT FLUSH', callback=callback, verbose=True)

    def script_kill(self, callback=None):
        # not yet implemented in the redis protocol
        self.execute_command('SCRIPT KILL', callback=callback)

    def script_load(self, script, callback=None):
        # not yet implemented in the redis protocol
        self.execute_command('SCRIPT LOAD', script, callback=callback)


class Pipeline(Client):

    def __init__(self, transactional, *args, **kwargs):
        super(Pipeline, self).__init__(*args, **kwargs)
        self.transactional = transactional
        self.command_stack = []
        self.executing = False

    def __del__(self):
        """
        Do not disconnect on releasing the PipeLine object.
        Thanks to Tomek (https://github.com/thlawiczka)
        """
        pass

    def execute_command(self, cmd, *args, **kwargs):
        if self.executing and cmd in ('AUTH', 'SELECT'):
            super(Pipeline, self).execute_command(cmd, *args, **kwargs)
        elif cmd in PUB_SUB_COMMANDS:
            raise RequestError(
                'Client is not supposed to issue '
                'the %s command in a pipeline' % cmd)
        else:
            self.command_stack.append(CmdLine(cmd, *args, **kwargs))

    def discard(self):
        # actually do nothing with redis-server, just flush the command_stack
        self.command_stack = []

    def format_replies(self, cmd_lines, responses):
        results = []
        for cmd_line, response in zip(cmd_lines, responses):
            try:
                results.append(self.format_reply(cmd_line, response))
            except Exception, e:
                results.append(e)
        return results

    def format_pipeline_request(self, command_stack):
        return ''.join(self.format_command(c.cmd, *c.args, **c.kwargs)
                       for c in command_stack)

    @gen.engine
    def execute(self, callback=None):
        command_stack = self.command_stack
        self.command_stack = []
        self.executing = True
        try:
            if self.transactional:
                command_stack = ([CmdLine('MULTI')] +
                                 command_stack +
                                 [CmdLine('EXEC')])

            request = self.format_pipeline_request(command_stack)

            password_should_be_sent = (
                self.password and
                self.connection.info.get('pass', None) != self.password)
            if password_should_be_sent:
                yield gen.Task(self.auth, self.password)
            db_should_be_selected = (
                self.selected_db and
                self.connection.info.get('db', None) != self.selected_db)
            if db_should_be_selected:
                yield gen.Task(self.select, self.selected_db)

            if not self.connection.connected():
                self.connection.connect()

            if not self.connection.ready():
                yield gen.Task(self.connection.wait_until_ready)

            try:
                self.connection.write(request)
            except IOError:
                self.command_stack = []
                self.connection.disconnect()
                raise ConnectionError("Socket closed on remote end")
            except Exception, e:
                self.command_stack = []
                self.connection.disconnect()
                raise e

            responses = []
            total = len(command_stack)
            cmds = iter(command_stack)

            while len(responses) < total:
                data = yield gen.Task(self.connection.readline)
                if not data:
                    raise ResponseError('Not enough data after EXEC')
                try:
                    cmd_line = cmds.next()
                    if self.transactional and cmd_line.cmd != 'EXEC':
                        response = self.process_data(data,
                                                     CmdLine('MULTI_PART'))
                    else:
                        response = self.process_data(data, cmd_line)
                    if isinstance(response, partial):
                        response = yield gen.Task(response)
                    responses.append(response)
                except Exception, e:
                    responses.append(e)

            if self.transactional:
                command_stack = command_stack[:-1]
                responses = responses[-1]
                results = self.format_replies(command_stack[1:], responses)
            else:
                results = self.format_replies(command_stack, responses)

            self.connection.execute_pending_command()
        finally:
            self.executing = False

        callback(results)
