from server.hierarchy import *


class Customer():
    """Represents a Customer.

    Attributes:

        name: Name (string) of the Customer.

        id: For a Customer id == name. Used to determine if it exist in DB.

        net_throttle: An integer that states how much an agent should
            throttle it's bandwidth by.

        cpu_throttle: A string indicating agent cpu resources to be used.
    """

    def __init__(self, name=None, groups=None, users=None):

        self.name = name
        self.id = None

        self._raw_groups = []
        self._raw_users = []

        self._groups = []
        self._users = []

        if groups:
            for g in groups:
                self.add_group(g)

        if users:
            for u in users:
                self.add_user(u)

        # Le hacks
        self.net_throttle = 0
        self.cpu_throttle = 'idle'

    def add_group(self, group):
        """Adds a group to the Customer.

        Args:

            group: A Group instance.

        Returns:

            True if group was added successfully, False otherwise.
        """

        g = {CustomerKey.Name: group.name, CustomerKey.Id: group.id}
        gi = GroupInfo(group.id, group.name)

        self._raw_groups.append(g)
        self._groups.append(gi)

    def remove_group(self, group):
        """Removes a group from the Customer.

        Args:

            group: A Group instance.

        Returns:

            True if group was removed successfully, False otherwise.
        """

        g = {CustomerKey.Name: group.name, CustomerKey.Id: group.id}
        gi = GroupInfo(group.id, group.name)

        self._raw_groups.remove(g)
        self._groups.remove(gi)

    def add_user(self, user):
        """Adds a user to the Customer.

        Args:

            user: A User instance.

        Returns:

            True if user was added successfully, False otherwise.
        """

        u = {CustomerKey.Name: user.name}
        ui = UserInfo(user.name)

        self._raw_users.append(u)
        self._users.append(ui)

    def remove_user(self, user):
        """Removes a user to the Customer.

        Args:

            user: A User instance.

        Returns:

            True if user was removed successfully, False otherwise.
        """

        u = {CustomerKey.Name: user.name}
        ui = UserInfo(user.name)

        self._raw_users.remove(u)
        self._users.remove(ui)

    def get_users(self, raw=False):
        """Returns the Customer's users.
        """

        if raw:

            return self._raw_users

        return self._users

    def get_groups(self, raw=False):
        """Returns the Customer's groups.
        """

        if raw:

            return self._raw_groups

        return self._groups

    def to_dict(self):
        """
        """

        _customer = {}

        _customer[CustomerKey.Name] = self.name
        _customer[CustomerKey.NetThrottle] = self.net_throttle
        _customer[CustomerKey.CpuThrottle] = self.cpu_throttle

        _customer[CustomerKey.Groups] = self.get_groups(raw=True)
        _customer[CustomerKey.Users] = self.get_users(raw=True)

        return _customer

    def __repr__(self):

        return 'Customer(name=%r)' % self.name