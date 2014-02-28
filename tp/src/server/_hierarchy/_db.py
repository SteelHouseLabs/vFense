# This is the backend for hierarchy package. _db should not be used directly.
# Safer to use hierarchy and its User, Group, Customer class.

import logging
import logging.config
from copy import deepcopy
from db.client import *

from groups import *
from users import *
from customers import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


@db_create_close
def _db_document_exist(_id=None, collection_name=None, conn=None):
    """Checks if a document exist for given id.

     Args:

        _id: Used to check for a document.

        collection_name: Name of collection to be searched.

    Returns:

        True if a document exist, False otherwise.
    """

    if not _id and not collection_name:

        return False

    doc = r.table(collection_name).get(_id).run(conn)

    if doc:

        return True

    return False


class _RawModels():
    """Wrapper class to help with converting models to a basic raw dict.
    """

    @staticmethod
    def _db_raw_group(group):
        """Creates a raw dict with Group properties.

        Args:

            group: A Group instance.

        Returns:

            A dict with group properties.
        """

        _raw = {}

        if not group:

            return _raw

        _raw[GroupKey.Name] = group.name
        _raw[GroupKey.Id] = group.id
        _raw[GroupKey.Permissions] = group.get_permissions()
        _raw[GroupKey.Customer] = group.get_customer(raw=True)
        _raw[GroupKey.Users] = group.get_users(raw=True)

        return _raw

    @staticmethod
    def _db_raw_user(user):
        """Creates a raw dict with User properties.

        Args:

            user: A User instance.

        Returns:

            A dict with user properties.
        """

        _raw = {}

        if not user:

            return _raw

        _raw[UserKey.Name] = user.name
        _raw[UserKey.Id] = user.id
        _raw[UserKey.FullName] = user.full_name
        _raw[UserKey.Email] = user.email
        _raw[UserKey.Password] = user.hash_password
        _raw[UserKey.Enabled] = user.enabled

        _raw[UserKey.CurrentCustomer] = user.get_current_customer(raw=True)
        _raw[UserKey.DefaultCustomer] = user.get_default_customer(raw=True)

        _raw[UserKey.Customers] = user.get_customers(raw=True)
        _raw[UserKey.Groups] = user.get_groups(raw=True)

        return _raw

    @staticmethod
    def _db_raw_customer(customer):
        """Creates a raw dict with Customer properties.

        Args:

            customer: A Customer instance.

        Returns:

            A dict with customer properties.
        """

        _raw = {}

        if not customer:

            return _raw

        _raw[CustomerKey.Name] = customer.name
        _raw[CustomerKey.Id] = customer.id
        _raw[CustomerKey.NetThrottle] = customer.net_throttle

        _raw[CustomerKey.Groups] = customer.get_groups(raw=True)
        _raw[CustomerKey.Users] = customer.get_users(raw=True)

        return _raw


@db_create_close
def get_all_customers(conn=None):

    customers = list(
        r.table("customers")
        .pluck(CustomerKey.Name)
        .run(conn)
    )

    return customers


def _db_build_customer(data_doc):
    """ Builds a Customer instance.

    Based on the data document passed, a Customer object is built.

    Args:
        data_doc: A dict with data representing a Customer.

    Returns:
        A Customer instance.
    """

    if not data_doc:

        return None

    customer = Customer()
    customer.name = data_doc.get(CustomerKey.Name)

    customer.id = data_doc.get(CustomerKey.Name)
    customer.cpu_throttle = data_doc.get(CustomerKey.CpuThrottle)
    customer.net_throttle = data_doc.get(CustomerKey.NetThrottle)

    if data_doc.get(CustomerKey.Users):

        for doc in data_doc[CustomerKey.Users]:

            u = _db_document_exist(_id=doc[UserKey.Name],
                                   collection_name=UserCollection)

            if u:

                u = User(doc[CustomerKey.Name])

                customer.add_user(u)

    if data_doc.get(CustomerKey.Groups):

        for doc in data_doc[CustomerKey.Groups]:

            g = _db_document_exist(_id=doc[GroupKey.Id],
                                   collection_name=GroupCollection)

            if g:

                g = Group(doc[GroupKey.Name])
                g.id = doc[GroupKey.Id]

                customer.add_group(g)

    return customer


def _db_build_group(data_doc):
    """ Builds a Group instance.

    Based on the data document passed, a Group object is built.

    Args:
        data_doc: A dict with data representing a group.

    Returns:
        A Group instance.
    """

    if not data_doc:

        return None

    group = Group()
    group.name = data_doc.get(GroupKey.Name)
    group.id = data_doc.get(GroupKey.Id)

    if data_doc.get(GroupKey.Permissions):

        for perm in data_doc.get(GroupKey.Permissions):

            group.add_permission(perm)

    if data_doc.get(GroupKey.Customer):

        c = _db_document_exist(
            _id=data_doc[GroupKey.Customer][CustomerKey.Name],
            collection_name=CustomerCollection
        )

        if c:

            c = Customer(data_doc[GroupKey.Customer][CustomerKey.Name])

            group.set_customer(c)

    if data_doc.get(GroupKey.Users):

        for doc in data_doc[GroupKey.Users]:

            u = _db_document_exist(_id=doc[UserKey.Name],
                                   collection_name=UserCollection)

            if u:

                u = User(doc[UserKey.Name])

                group.add_user(u)

    return group


def _db_build_user(data_doc):
    """ Builds a User instance.

    Based on the data document passed, a User object is built.

    Args:
        data_doc: A dict with data representing a User.

    Returns:
        A User instance.
    """

    if not data_doc:

        return None

    user = User()
    user.name = data_doc.get(UserKey.Name)
    user.id = user.name

    user.full_name = data_doc.get(UserKey.FullName)
    user.password = data_doc.get(UserKey.Password)
    user.email = data_doc.get(UserKey.Email)
    user.enabled = data_doc.get(UserKey.Enabled)

    if data_doc.get(UserKey.Groups):

        for doc in data_doc[UserKey.Groups]:

            g = _db_document_exist(_id=doc[GroupKey.Id],
                                   collection_name=GroupCollection)

            if g:

                g = Group(doc[GroupKey.Name])
                g.id = doc[GroupKey.Id]

                user.add_group(g)

    if data_doc.get(UserKey.Customers):

        for doc in data_doc[UserKey.Customers]:

            c = _db_document_exist(_id=doc[CustomerKey.Name],
                                   collection_name=CustomerCollection)

            if c:

                c = Customer(doc[CustomerKey.Name])

                user.add_customer(c)

    if data_doc.get(UserKey.CurrentCustomer):

        current_customer = data_doc[UserKey.CurrentCustomer]

        c = _db_document_exist(_id=current_customer[CustomerKey.Name],
                               collection_name=CustomerCollection)

        if c:

            c = Customer(current_customer[CustomerKey.Name])

            user.set_current_customer(c)

    if data_doc.get(UserKey.DefaultCustomer):

        default_customer = data_doc[UserKey.DefaultCustomer]

        c = _db_document_exist(_id=default_customer[CustomerKey.Name],
                               collection_name=CustomerCollection)

        if c:

            c = Customer(default_customer[CustomerKey.Name])

            user.set_default_customer(c)

    return user

@db_create_close
def _db_save(_id=None, collection_name=None, data=None, conn=None):
    """Attempts to save data to the DB.

    If an document ID is provided, then the document gets updated. Otherwise
    a new document is inserted.

    Args:

        _id: Id representing a document if it has one.

        collection_name: Name of the collection to be used.

        data: Data to be inserted or replaced.

    Returns:

        A DB generated ID is returned (empty string if no ID is available)
            on successful insert, False otherwise.
        A boolean True if updating was successful, False otherwise.

    """

    success = False

    if _id:

        result = (
            r.table(collection_name)
            .get(_id)
            .update(data)
            .run(conn)
        )

        if result.get('replaced') and result.get('replaced') > 0:

            success = True

    else:

        result = r.table(collection_name).insert(data).run(conn)

        if result.get('inserted') and result.get('inserted') > 0:

            if 'generated_keys' in result:

                success = result['generated_keys'][0]

            else:

                success = ''

    return success

@db_create_close
def _db_get(collection_name=None, _id=None, _filter=None, conn=None):
    """Attempts to get data from the DB.

    Tries to get a document based on the id. If a filter is used, then a list
    of documents is returned that match said filter.

    Args:

        collection_name: Name of the collection to be used.

        _id: Id (primary key) representing a document.

        _filter: A dict type that contains key(s)/value(s) of the
            document to get.

    Returns:

        If the document id is provided, then that document is returned.
        If a filter is used, then a list of documents is returned.

    """

    document = None

    if _id:

        document = r.table(collection_name).get(_id).run(conn)

    else:

        document = list(r.table(collection_name).filter(_filter).run(conn))

    return document

@db_create_close
def _db_delete(collection_name=None, _id=None, conn=None):
    """Attempts to delete data from the DB.

    Tries to delete a document based on the id or filter provided. If filter is
    used, the first document returned is deleted.

    Args:

        collection_name: Name of the collection to be used.

        _id: Id (primary key) representing a document

    Returns:

        True if document was deleted, False otherwise.

    """

    success = None

    if _id:

        result = r.table(collection_name).get(_id).delete().run(conn)

        if 'deleted' in result and result['deleted'] > 0:

            success = True

    return success


def save_customer(customer):
    """Saves the customer to DB.

    If an id attribute is found, the document representing that id is updated.
    Otherwise we create a new document.

    Args:

        customer: A Customer instance.

    Returns:

        True is customer was saved successfully, False otherwise.

    """

    _customer = {}

    _customer[CustomerKey.Name] = customer.name
    _customer[CustomerKey.NetThrottle] = customer.net_throttle
    _customer[CustomerKey.CpuThrottle] = customer.cpu_throttle

    _customer[CustomerKey.Groups] = customer.get_groups(raw=True)

    _customer[CustomerKey.Users] = customer.get_users(raw=True)

    success = _db_save(_id=customer.id, collection_name=CustomerCollection,
                       data=_customer)

    return success


def save_user(user):
    """Saves the user to DB.

    If an id attribute is found, the document representing that id is updated.
    Otherwise we create a new document.

    Args:

        user: A User instance.

    Returns:

        True is customer was saved successfully, False otherwise.

    """

    _user = {}

    _user[UserKey.Name] = user.name
    _user[UserKey.FullName] = user.full_name
    _user[UserKey.Email] = user.email
    _user[UserKey.Enabled] = user.enabled
    _user[UserKey.Password] = user.password

    _user[UserKey.Groups] = user.get_groups(raw=True)

    _user[UserKey.Customers] = user.get_customers(raw=True)
    _user[UserKey.CurrentCustomer] = user.get_current_customer(raw=True)
    _user[UserKey.DefaultCustomer] = user.get_default_customer(raw=True)

    success = _db_save(_id=user.id, collection_name=UserCollection, data=_user)

    return success


def save_group(group):
    """Saves the group to DB.

    If an id attribute is found, the document representing that id is updated.
    Otherwise we create a new document.

    Args:

        group: A Group instance.

    Returns:

        True is customer was saved successfully, False otherwise.

    """

    _group = {}

    _group[GroupKey.Name] = group.name
    _group[GroupKey.Customer] = group.get_customer(raw=True)
    _group[GroupKey.Permissions] = group.get_permissions()

    _group[GroupKey.Users] = group.get_users(raw=True)

    success = _db_save(_id=group.id, collection_name=GroupCollection,
                       data=_group)

    return success


def get_customer(name=None):
    """Gets the Customer from the DB.

    Based on the id or name given, retrieve said customer.

    Args:

        _id: Id representing the customer to retrieve.

        name: Name representing the customer to retrieve.

    Returns:

        A Customer instance.

    """

    data_doc = None

    if name:

        data_doc = _db_get(collection_name=CustomerCollection, _id=name)

    if data_doc:

        customer = _db_build_customer(data_doc)

    else:

        customer = None

    return customer


def get_user(name=None):
    """Gets the User from the DB.

    Based on the name given, retrieve said user.

    Args:

        name: Name representing the user to retrieve.

    Returns:

        A User instance.

    """
    data_doc = None

    if name:

        data_doc = _db_get(collection_name=UserCollection, _id=name)

    if data_doc:

        user = _db_build_user(data_doc)

    else:

        user = None

    return user


def get_group(_id=None, name=None, all_groups=False):
    """Gets the Group from the DB.

    Based on the id or name given, retrieve said group.

    Args:

        _id: Id representing the group to retrieve.

        name: Name representing the group to retrieve.

        all_groups: True if a list of all groups matching the name is to
            be returned. Does not work with _id.

    Returns:

        A Group instance.

    """

    data_doc = None

    if _id:

        data_doc = _db_get(collection_name=GroupCollection, _id=_id)

    elif name:

        data_doc = _db_get(collection_name=GroupCollection,
                           _filter={GroupKey.Name: name})

        if data_doc:

            if not all_groups:

                data_doc = data_doc[0]

        else:

            data_doc = {}

    if isinstance(data_doc, list):

        groups = []

        for g in data_doc:
            groups.append(_db_build_group(g))

        return groups

    elif data_doc:

        return _db_build_group(data_doc)

    return None
