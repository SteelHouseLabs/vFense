from server.hierarchy import *
from permissions import Permission


class Group():
    """Represents a Group.

    Attributes:

        name: Name (string) of the Customer.

        id: String representing the DB id of the Group.

    """

    def __init__(self, name=None, permissions=None):

        self.name = name
        self.id = None

        self._customer = None
        self._raw_customer = {}

        self._users = []
        self._raw_users = []

        self._permissions = (permissions or [])

    def add_user(self, user):
        """Adds a user to the Group.

        Adds the user to the Group's list of user. Doesn't touch the
        Users collection though.

        Args:

            user: A User instance.

        Returns:

            True if group was added successfully, False otherwise.
        """

        u = {GroupKey.Name: user.name}
        ui = UserInfo(user.name)

        self._raw_users.append(u)
        self._users.append(ui)

    def remove_user(self, user):
        """Removes a user from the Group.

        Removes the user to the Group's list of user. Doesn't touch the
        Users collection though.

        Args:

            user: A User instance.

        Returns:

            True if group was added successfully, False otherwise.
        """

        u = {GroupKey.Name: user.name}
        ui = UserInfo(user.name)

        self._raw_users.remove(u)
        self._users.remove(ui)

    def set_customer(self, customer):
        """Sets the customer this Group is part of.

        Args:

            customer: A Customer instance.

        Returns:

            True if user was added successfully, False otherwise.
        """

        c = {GroupKey.Name: customer.name}
        ci = CustomerInfo(customer.name)

        self._raw_customer = c
        self._customer = ci

    def clear_customer(self):
        """Removes the customer this Group is part of.

        Returns:

            True if user was added successfully, False otherwise.
        """
        ci = CustomerInfo('')

        self._raw_customer = {}
        self._customer = ci



    def add_permission(self, permission):
        """Adds a permission to the Group.

        Args:

            permission: An accounts.Permission constant.

        Returns:

            True if group was added successfully, False otherwise.
        """

        self._permissions.append(permission)

    def remove_permission(self, permission):
        """Removes a permission from the Group.

        Args:

            permission: An accounts.Permission constant.

        Returns:

            True if group was added successfully, False otherwise.
        """

        self._permissions.remove(permission)

    def get_permissions(self):
        """Returns the Group's permissions.
        """

        return self._permissions

    def get_customer(self, raw=False):
        """Returns the single customer the Group belongs to.
        """

        if raw:

            return self._raw_customer

        return self._customer

    def get_users(self, raw=False):
        """Returns the Group's users.
        """

        if raw:

            return self._raw_users

        return self._users

    def to_dict(self):
        """
        """

        _group = {}

        _group[GroupKey.Name] = self.name
        _group[GroupKey.Id] = self.id
        _group[GroupKey.Users] = self.get_users(raw=True)
        _group[GroupKey.Customer] = self.get_customer(raw=True)
        _group[GroupKey.Permissions] = self.get_permissions()

        return _group

    def __repr__(self):

        return 'Group(name=%r, id=%r)' % (self.name, self.id)