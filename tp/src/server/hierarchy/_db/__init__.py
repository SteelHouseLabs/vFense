import logging
import logging.config
from db.client import *

from server.hierarchy import *
#from server.hierarchy.group import *
#from server.hierarchy.user import *
#from server.hierarchy.customer import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')

_main_db = 'toppatch_server'


@db_create_close
def initialization(conn=None):

    _create_tables(conn)
    _create_indices(conn)


def _create_tables(conn):

    tables = r.db(_main_db).table_list().run(conn)

    if Collection.Users not in tables:
        _create_users_table(conn)

    if Collection.Groups not in tables:
        _create_groups_table(conn)

    if Collection.Customers not in tables:
        _create_customers_table(conn)

#    if Collection.GroupsPerCustomer not in tables:
#        _create_GPC_table(conn)

    if Collection.GroupsPerUser not in tables:
        _create_GPU_table(conn)

    if Collection.UsersPerCustomer not in tables:
        _create_UPC_table(conn)


def _create_indices(conn):

    _create_groups_indices(conn)
    # _create_GPC_indices(conn)
    _create_GPU_indices(conn)
    _create_UPC_indices(conn)

def _create_UPC_table(conn=None):

    try:

        r.db(_main_db).table_create(
            Collection.UsersPerCustomer
        ).run(conn)

    except Exception as e:

        logger.error(
            "Unable to create %s table." % Collection.UsersPerCustomer
        )
        logger.exception(e)

def _create_UPC_indices(conn):

    try:

        indices = r.table(Collection.UsersPerCustomer).index_list().run(conn)

        if UsersPerCustomerKey.UserId not in indices:
            r.table(
                Collection.UsersPerCustomer
            ).index_create(UsersPerCustomerKey.UserId).run(conn)

        if UsersPerCustomerKey.CustomerId not in indices:
            r.table(
                Collection.UsersPerCustomer
            ).index_create(UsersPerCustomerKey.CustomerId).run(conn)

        if UsersPerCustomerKey.UserAndCustomerId not in indices:
            r.table(
                Collection.UsersPerCustomer
            ).index_create(
                UsersPerCustomerKey.UserAndCustomerId,
                lambda row:
                [
                    row[UsersPerCustomerKey.UserId],
                    row[UsersPerCustomerKey.CustomerId]
                ]
            ).run(conn)

    except Exception as e:

        logger.error(
            "Unable to create indices for %s table." % Collection.UsersPerCustomer
        )
        logger.exception(e)


def _create_GPU_table(conn=None):

    try:

        r.db(_main_db).table_create(
            Collection.GroupsPerUser
        ).run(conn)

    except Exception as e:

        logger.error(
            "Unable to create %s table." % Collection.GroupsPerUser
        )
        logger.exception(e)


def _create_GPU_indices(conn=None):

    try:

        indices = r.table(Collection.GroupsPerUser).index_list().run(conn)

        if GroupsPerUserKey.UserId not in indices:
            r.table(
                Collection.GroupsPerUser
            ).index_create(GroupsPerUserKey.UserId).run(conn)

        if GroupsPerUserKey.GroupIdAndCustomerId not in indices:
            r.table(
                Collection.GroupsPerUser
            ).index_create(
                GroupsPerUserKey.GroupIdAndCustomerId,
                lambda row:
                [
                    row[GroupsPerUserKey.GroupId],
                    row[GroupsPerUserKey.CustomerId]
                ]
            ).run(conn)

        if GroupsPerUserKey.UserIdAndCustomerId not in indices:
            r.table(
                Collection.GroupsPerUser
            ).index_create(
                GroupsPerUserKey.UserIdAndCustomerId,
                lambda row:
                [
                    row[GroupsPerUserKey.UserId],
                    row[GroupsPerUserKey.CustomerId]
                ]
            ).run(conn)

        if GroupsPerUserKey.GroupUserAndCustomerId not in indices:
            r.table(
                Collection.GroupsPerUser
            ).index_create(
                GroupsPerUserKey.GroupUserAndCustomerId,
                lambda row:
                [
                    row[GroupsPerUserKey.GroupId],
                    row[GroupsPerUserKey.UserId],
                    row[GroupsPerUserKey.CustomerId]
                ]
            ).run(conn)

    except Exception as e:

        logger.error(
            "Unable to create indices for %s table." % Collection.GroupsPerUser
        )
        logger.exception(e)

def _create_GPC_table(conn=None):

    try:

        r.db(_main_db).table_create(
            Collection.GroupsPerCustomer
        ).run(conn)

    except Exception as e:

        logger.error(
            "Unable to create %s table." % Collection.GroupsPerCustomer
        )
        logger.exception(e)


def _create_GPC_indices(conn=None):

    try:

        indices = r.table(Collection.GroupsPerCustomer).index_list().run(conn)

        if GroupsPerCustomerKey.GroupId not in indices:
            r.table(
                Collection.GroupsPerCustomer
            ).index_create(GroupsPerCustomerKey.GroupId).run(conn)

        if GroupsPerCustomerKey.CustomerId not in indices:
            r.table(
                Collection.GroupsPerCustomer
            ).index_create(GroupsPerCustomerKey.CustomerId).run(conn)

        if GroupsPerCustomerKey.GroupAndCustomerId not in indices:
            r.table(
                Collection.GroupsPerCustomer
            ).index_create(
                GroupsPerCustomerKey.GroupAndCustomerId,
                lambda row:
                [
                    row[GroupsPerCustomerKey.GroupId],
                    row[GroupsPerCustomerKey.CustomerId]
                ]
            ).run(conn)

    except Exception as e:

        logger.error(
            "Unable to create indices for table  %s." % Collection.GroupsPerCustomer
        )
        logger.exception(e)

def _create_groups_table(conn=None):

    try:

        r.db(_main_db).table_create(Collection.Groups).run(conn)

    except Exception as e:

        logger.error("Unable to create %s table." % Collection.Groups)
        logger.exception(e)


def _create_groups_indices(conn=None):

    try:

        indices = r.table(Collection.Groups).index_list().run(conn)

        if GroupKey.GroupName not in indices:
            r.table(
                Collection.Groups
            ).index_create(GroupKey.GroupName).run(conn)

        if GroupKey.CustomerId not in indices:
            r.table(
                Collection.Groups
            ).index_create(GroupKey.CustomerId).run(conn)

        if GroupKey.GroupNameAndCustomerId not in indices:
            r.table(
                Collection.Groups
            ).index_create(
                GroupKey.GroupNameAndCustomerId,
                lambda row:
                [
                    row[GroupKey.GroupName],
                    row[GroupKey.CustomerId]
                ]
            ).run(conn)

    except Exception as e:

        logger.error("Unable to create indices for table %s." % Collection.Groups)
        logger.exception(e)

def _create_customers_table(conn=None):

    try:

        r.db(_main_db).table_create(
            Collection.Customers,
            primary_key=CustomerKey.CustomerName
        ).run(conn)

    except Exception as e:

        logger.error("Unable to create %s table." % Collection.Customers)
        logger.exception(e)


def _create_users_table(conn=None):

    try:
        r.db(_main_db).table_create(
            Collection.Users,
            primary_key=UserKey.UserName
        ).run(conn)

    except Exception as e:

        logger.error("Unable to create %s table." % Collection.Users)
        logger.exception(e)
