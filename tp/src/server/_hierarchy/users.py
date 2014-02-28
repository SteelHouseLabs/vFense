from server.hierarchy import *


class User():
    """Represents a User.

    Attributes:

        username: Name (string) of the User.

        full_name: Full name for the User.

        id: For a User id == name. Used to determine if it exist in DB.

        password: User's password.

        email: Email of the user.

        enabled: A boolean indicating if the User is enabled. That is able to
            log in.
    """

    def __init__(self, name=None, full_name=None, email=None, password='',
                 groups=None, customers=None, default_customer=None,
                 current_customer=None, enabled=True):

        self.name = name
        self.full_name = full_name
        self.password = password
        self.email = email
        self.enabled = enabled

        self.id = None

        self._customers = []
        self._raw_customers = []

        self._current_customer = None
        self._raw_current_customer = {}

        self._default_customer = None
        self._raw_default_customer = {}

        self._groups = []
        self._raw_groups = []

        if groups:
            for g in groups:
                self.add_group(g)

        if customers:
            for c in customers:
                self.add_customer(c)

        if default_customer:
            self.set_default_customer(default_customer)

        if current_customer:
            self.set_current_customer(current_customer)

    def add_group(self, group):
        """Adds group to User.

        Adds the group to the User's list of groups. Doesn't touch the
        Groups collection though.

        Args:

            group: A Group instance.

        Returns:

            Nothing
        """

        g = {UserKey.Name: group.name, UserKey.Id: group.id}
        gi = GroupInfo(group.id, group.name)

        self._raw_groups.append(g)
        self._groups.append(gi)

    def remove_group(self, group):
        """Removes a group from the User.

        Removes the group to the User's list of groups. Doesn't touch the
        Groups collection though.

        Args:

            group: A Group instance.

        Returns:

            True if group was removed successfully, False otherwise.
        """

        g = {UserKey.Name: group.name, UserKey.Id: group.id}
        gi = GroupInfo(group.id, group.name)

        self._raw_groups.remove(g)
        self._groups.remove(gi)

    def add_customer(self, customer):
        """Adds a customer to the User.

        Args:

            customer: A Customer instance.

        Returns:

            True if user was added successfully, False otherwise.
        """

        c = {UserKey.Name: customer.name}
        ci = CustomerInfo(customer.name)

        self._raw_customers.append(c)
        self._customers.append(ci)

    def remove_customer(self, customer):
        """Removes a customer from the User.

        Args:

            customer: A Customer instance.

        Returns:

            True if user was removed successfully, False otherwise.
        """

        c = {UserKey.Name: customer.name}
        ci = CustomerInfo(customer.name)

        self._raw_customers.remove(c)
        self._customers.remove(ci)

    def set_current_customer(self, customer):
        """Sets the currently selected customer of the User.

        The customer must be part of the User's list of customers to be the
        'current customer'.

        Args:

            customer: A Customer instance.

        Returns:

            True if user was removed successfully, False otherwise.
        """

        c = {UserKey.Name: customer.name}
        ci = CustomerInfo(customer.name)

        self._raw_current_customer = c
        self._current_customer = ci

    def set_default_customer(self, customer):
        """Sets the default customer of the User.

        The customer must be part of the User's list of customers to be the
        'default customer'.

        Args:

            customer: A Customer instance.

        Returns:

            True if user was removed successfully, False otherwise.
        """

        c = {UserKey.Name: customer.name}
        ci = CustomerInfo(customer.name)

        self._raw_default_customer = c
        self._default_customer = ci

    def get_current_customer(self, raw=False):
        """Returns the current customer the User has access to.
        """

        if raw:

            return self._raw_current_customer

        return self._current_customer

    def get_default_customer(self, raw=False):
        """Returns the default customer the User has access to.
        """

        if raw:

            return self._raw_current_customer

        return self._default_customer

    def get_customers(self, raw=False):
        """Returns the customers the User has access to.
        """

        if raw:

            return self._raw_customers

        return self._customers

    def get_groups(self, raw=False):
        """Returns the groups the User has access to.
        """

        if raw:

            return self._raw_groups

        return self._groups

    def to_safe_dict(self):
        """
        """

        _user = {}

        _user['username'] = self.name
        _user['full_name'] = self.full_name
        _user['email'] = self.email
        _user['current_customer'] = self.get_current_customer(raw=True)
        _user['default_customer'] = self.get_default_customer(raw=True)
        _user['customers'] = self.get_customers(raw=True)
        _user['groups'] = self.get_groups(raw=True)

        return _user

    def __repr__(self):

        return (
            'User(name=%r, groups=%r)' %
            (self.name, self.get_groups(raw=True))
        )

    def __eq__(self, other):

        return self.name == other.name

    def __ne__(self, other):
        return not self.__eq__(other)
