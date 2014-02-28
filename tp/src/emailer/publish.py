import json
import redis
import time

CHANNEL = 'test'
MESSAGE = {
    'template_name': 'alert',
    'subject': 'TopPatch Alert!',
    'to_addresses': [
        'dan.c.jaouen@gmail.com',
        'dcj24@cornell.edu',
        'daniel@toppatch.com'
    ],
    'message_keys': [
        ('host', '192.168.1.1', ),
        ('port', 80, ),
        ('message', 'There is an issue with this host and this port!', ),
    ],
}


def publish_to_redis(host, port, db, password):
    pool = redis.ConnectionPool(host=host, port=port, db=db, password=password)
    conn = redis.StrictRedis(connection_pool=pool)
    while True:
        conn.publish('test', json.dumps(MESSAGE))
        time.sleep(120)


def main():
    publish_to_redis('localhost', 6379, 0, None)

if __name__ == '__main__':
    main()
