REDIS_HOST = 'localhost'
REDIS_PORT = 6379
REDIS_DB = 0

# You can also specify the Redis DB to use
# REDIS_DB = 3
# REDIS_PASSWORD = 'very secret'

# Queues to listen on
QUEUES = [
    'rv',
    'pkgs',
    'stats',
    'updater',
    'post_store_operation',
    'agent_status',
    'create_secondary_indexes',
    'delete_agent',
    'move_agent'
]

# If you're using Sentry to collect your runtime exceptions, you can use this
# to configure RQ for it in a single step
#SENTRY_DSN = 'http://public:secret@example.com/1'
