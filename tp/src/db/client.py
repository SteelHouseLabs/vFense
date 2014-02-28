import os
import logging
import logging.config
import ConfigParser
import types
import rethinkdb as r
import redis

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
db_config='/opt/TopPatch/conf/database.conf'
Config = ConfigParser.ConfigParser()
Config.read(db_config)

def db_connect(new_db_config=None):
    conn = None
    if new_db_config:
        if os.path.exists(new_db_config):
            Config.read(new_db_config)
        else:
            logger.error('Config File does not exists: %s' % (new_db_config))
    try:
        host = Config.get('Database', 'host')
        port = int(Config.get('Database', 'driver-port'))
        db = Config.get('Database', 'db-name')
        conn = r.connect(host, port, db)

    except Exception as e:
        logger.error(e)

    return conn


def db_create_close(fn):

    def db_wrapper(*args, **kwargs):

        output = None
        conn = db_connect()
        if len(kwargs) >= 0 and isinstance(kwargs, dict) and\
                len(args) >= 1:

            if isinstance(args[0], types.InstanceType) or\
                    isinstance(args[0], types.MethodType):
                kwargs['conn'] = conn
                fake_self = args[0]

                if args > 1:
                    args = list(args[1:])

                else:
                    args = []

                output = fn(fake_self, *args, **kwargs)
                conn.close()

            else:
                kwargs['conn'] = conn
                output = fn(*args, **kwargs)
                conn.close()

        elif len(kwargs) >= 0 and isinstance(kwargs, dict) and len(args) >= 0:
            kwargs['conn'] = conn
            output = fn(*args, **kwargs)
            conn.close()

        elif len(args) > 0 and isinstance(args, list):
            args.insert(conn)
            output = fn(*args)
            conn.close()

        elif len(args) > 0 and isinstance(args, tuple) and len(kwargs) == 0:

            args = list(args)
            self = args.pop(0)

            if len(args) > 0:

                output = fn(self, conn, args[0])
                conn.close()

            else:

                output = fn(self, conn)
                conn.close()
        else:

            output = fn(conn)
            conn.close()

        return output

    return db_wrapper
