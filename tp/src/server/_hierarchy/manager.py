import logging
import logging.config

import server.hierarchy._db as _db
from server.hierarchy.groups import *
from server.hierarchy.users import *
from server.hierarchy.customers import *

from server.hierarchy import *
from server.hierarchy.permissions import Permission
from utils.security import Crypto

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class Hierarchy():

    @staticmethod
    def get_user(name=None, customer=None):
        """Gets a User instance.

        Args:

            name: Name of the user.

            customer: Customer instance to check user against.

        Returns:

            A User instance if found, None otherwise.
        """

        if not name:

            return None

        valid_user = None

        if customer:

            users = customer.get_users()

            for user in users:

                if user.name == name:

                    valid_user = _db.get_user(name)

        else:

            valid_user = _db.get_user(name)

        return valid_user

    @staticmethod
    def get_users(customer=None):
        """Gets all of the user's belonging to a Customer.

        Args:

            customer: Customer instance to check users against.

        Returns:

            A list of users.
        """

        if not customer:

            return None

        customer_users = customer.get_users()
        users = []

        for user in customer_users:

            u = _db.get_user(user.name)

            if u:

                users.append(u)
        return users

    @staticmethod
    def get_group(group=None):
        """Gets a Group instance.

        Args:

            group: A dict consisting of either an id key or name key
                describing the group.

        Returns:

            A Group instance if found, None otherwise.
        """

        if(
            not group
            or not isinstance(group, dict)
            or not (
                group.get(GroupKey.Id) or group.get(GroupKey.Name)
            )
        ):
            return None

        if group.get('id'):

            g = _db.get_group(_id=group[GroupKey.Id])

        else:

            g = _db.get_group(name=group[GroupKey.Name])

        return g

    @staticmethod
    def get_groups(name=None):
        """Gets a list of Group instances.

        Args:

            name: Name of the groups wanted.

        Returns:

            A list of Group instances if found, empty list otherwise.
        """

        if not name:
            return []

        g = _db.get_group(name=name, all_groups=True)

        return g

    @staticmethod
    def get_customer(name=None):
        """Gets a Customer instance.

        Args:

            name: Name of the customer.

        Returns:

            A Customer instance if found, None otherwise.
        """

        if not name:

            return None

        customer = _db.get_customer(name)

        return customer

    @staticmethod
    def create_user(name=None, full_name=None, email=None, password=None,
                    groups=None, customers=None, default_customer=None):
        """Create a new User and save it.

        All parameters are required *except* groups and customers.

        Args:

            name: Name of the user.

            full_name: Full name of the user (ie First and last name).

            email: User's email address.

            password: User's plain text password.

            groups: A list of dicts consisting of either an id key or name key
                describing the group.

            customers: Customers this user should be added to. List of customer
                names.

            default_customer: The default customer for this user. Will be the
                first data available to the user.

        Returns:

            The newly created User if added successfully, None otherwise.
        """
        if (
            not name
            or not password
        ):
            return False

        # Get the Group instances that will be added to this user.
        if groups:

            groups_list = []

            for group in groups:

                g = Hierarchy.get_group(group)

                if g:

                    groups_list.append(g)

            groups = groups_list

        else:

            groups = []

            g = Hierarchy.get_group({GroupKey.Name: 'Read Only'})

            if g:

                groups.append(g)

        # Get the Customer instances that will be added to this user.
        if customers:

            customers_list = []

            for customer in customers:

                c = Hierarchy.get_customer(customer)

                if c:

                    customers_list.append(c)

            if customers_list:
                customers = customers_list

            else:
                customers = [Hierarchy.get_customer(DefaultCustomer)]

        else:

            customers = [Hierarchy.get_customer(DefaultCustomer)]

        if default_customer:

            default_customer = Hierarchy.get_customer(default_customer)

        else:

            default_customer = customers[0]

        name = name.strip()
        full_name = full_name.strip()

        password = Crypto.hash_bcrypt(password)

        user = User(name, full_name, email, password, groups, customers,
                    default_customer=default_customer,
                    current_customer=default_customer)

        _id = _db.save_user(user)

        if _id == '':

            user.id = user.name

            for g in groups:

                _, mod_group = Hierarchy.toggle_user_from_group(user, g)

                _db.save_group(mod_group)

            for c in customers:

                _, mod_customer = Hierarchy.toggle_user_from_customer(user, c)
                _db.save_customer(mod_customer)

            return user

        return None

    @staticmethod
    def create_group(
        name=None,
        permissions=None,
        customer=None
    ):
        """Create a new Group and save it.

        Args:

            name: Name of the group.

            permissions: List of permissions.Permission constants.

        Returns:

            The newly created Group if added successfully, None otherwise.
        """

        if not name:

            return False

        name = name.strip()

        if not permissions:

            permissions = []

        group = Group(name, permissions)

        _id = _db.save_group(group)

        if _id:

            group.id = _id

            if not customer:
                customer = DefaultCustomer

            default_customer = Hierarchy.get_customer(customer)
            if default_customer:

                group, default_customer = Hierarchy.toggle_group_from_customer(
                    group,
                    default_customer,
                    both=True
                )

                Hierarchy.save_customer(default_customer)
                Hierarchy.save_group(group)

            return group

        return None

    @staticmethod
    def default_groups(customer=None):
        Hierarchy.create_group('Administrator', [Permission.Admin], customer)
        Hierarchy.create_group('Read Only', customer=customer)
        Hierarchy.create_group('Install Only', [Permission.Install], customer)

    @staticmethod
    def create_customer(name=None):
        """Create a new Customer and save it.

        Args:

            name: Name of the customer.

        Returns:

            The newly created Customer if added successfully, None otherwise.
        """

        if not name:

            return False

        name = name.strip()

        customer = Customer(name)

        _id = _db.save_customer(customer)

        if _id == '':

            customer.id = customer.name
            return customer

        return None

    @staticmethod
    def edit_user(user=None, mod_data=None):
        """Edit user properties.

        Args:

            user: Name of the user.

            mod_data: A dic of UserKeys as the key with the new values.

        Returns:

            True if successful, False otherwise.
        """

        if not user and not mod_data:

            return False

        user = Hierarchy.get_user(user)

        password = mod_data.get(UserKey.Password)
        if password:

            user.password = Crypto.hash_bcrypt(password)

        full_name = mod_data.get(UserKey.FullName)
        if full_name:

            user.full_name = full_name

        email = mod_data.get(UserKey.Email)
        if email:

            user.email = email

        current_customer = mod_data.get(UserKey.CurrentCustomer)
        if current_customer:

            customer = Hierarchy.get_customer(current_customer)

            if customer:

                customer_name = ''
                current_customer = user.get_current_customer()
                if current_customer:
                    customer_name = current_customer.name

                if not customer.name == customer_name:
                    user.set_current_customer(customer)

        default_customer = mod_data.get(UserKey.DefaultCustomer)
        if default_customer:

            customer = Hierarchy.get_customer(default_customer)

            if customer:

                user.set_current_customer(customer)

        customers = mod_data.get(UserKey.Customers)
        if customers:

            for customer in customers:

                c = Hierarchy.get_customer(customer)

                if c:

                    user, c = Hierarchy.toggle_user_from_customer(
                        user,
                        c,
                        both=True
                    )

                    _db.save_customer(c)

        groups = mod_data.get(UserKey.Groups)

        if groups:

            for group in groups:

                g = Hierarchy.get_group(group)

                if g:

                    user, g = Hierarchy.toggle_user_from_group(user, g,
                                                               both=True)

                    _db.save_group(g)

        if _db.save_user(user):

            return True

        return False

    @staticmethod
    def edit_customer(name, mod_data=None):
        """Edit customer properties.

        Args:

            name: Name of the customer.

            mod_data: A dic of GroupKeys as the key with the new values.

        Returns:

            True if successful, False otherwise.
        """

        if not name and not mod_data:

            return False

        customer = Hierarchy.get_customer(name)

        net_throttle = mod_data.get(CustomerKey.NetThrottle)
        if net_throttle:

            customer.net_throttle = net_throttle

        cpu_throttle = mod_data.get(CustomerKey.CpuThrottle)
        if cpu_throttle:

            customer.cpu_throttle = cpu_throttle

        groups = mod_data.get(CustomerKey.Groups)
        if groups:

            for group in groups:

                g = Hierarchy.get_group(group)

                if g:

                    g, customer = Hierarchy.toggle_group_from_customer(
                        g,
                        customer, both=True)

                    _db.save_group(g)

        users = mod_data.get(CustomerKey.Users)
        if users:

            for user in users:

                u = Hierarchy.get_user(user)

                if u:

                    u, customer = Hierarchy.toggle_user_from_customer(
                        u,
                        customer, both=True
                    )

                    _db.save_user(u)

        return _db.save_customer(customer)

    @staticmethod
    def edit_group(group=None, mod_data=None):
        """Edit group's properties.

        Args:

            group: the Group instance to edit.

            mod_data: A dic of GroupKeys as the key with the new values.

        Returns:

            True if successful, False otherwise.
        """

        if not group and not mod_data:

            return False

        customer = mod_data.get(GroupKey.Customer)
        if customer:

            c = Hierarchy.get_customer(customer)

            if c:

                group.set_customer(c)

        permissions = mod_data.get(GroupKey.Permissions)
        group_permissions = group.get_permissions()
        if permissions:

            for perm in permissions:

                if perm in group_permissions:

                    group.remove_permission(perm)

                else:

                    group.add_permission(perm)

        users = mod_data.get(GroupKey.Users)
        if users:

            new_users = []
            for user in users:

                u = Hierarchy.get_user(user)
                if u:

                    new_users.append(u)

            for user in new_users:

                user, group = Hierarchy.toggle_user_from_group(user,
                                                               group,
                                                               both=True)

                Hierarchy.save_user(user)

        return Hierarchy.save_group(group)

    # Famous toggle functions!!
    @staticmethod
    def toggle_user_from_group(user=None, group=None, both=False):
        """Toggles the user for the group.

         If the user is part of group then it's removed. If the user is not
         part of the group then it's added. Changes are not saved to the DB.

         Args:

            user: A User instance.

            group: A Group instance.

            both: Whether to toggle both User and Group instances or
                just group.

        Returns:

            True if successfully toggled, False otherwise.
        """

        users_in_group = group.get_users()
        user_found = False

        for uig in users_in_group:

            if user.name == uig.name:

                user_found = True
                break

        if user_found:

            if both:
                user.remove_group(group)

            group.remove_user(user)

        else:

            if both:
                user.add_group(group)

            group.add_user(user)

        return user, group

    @staticmethod
    def toggle_user_from_customer(user=None, customer=None, both=False):
        """Toggles the user for the customer.

         If the user is part of customer then it's removed. If the user is not
         part of the customer then it's added. Changes are not saved to the DB.

         Args:

            user: A User instance.

            customer: A Customer instance.

            both: Whether to toggle both User and Customer instances or
                just customer.

        Returns:

            True if successfully toggled, False otherwise.
        """

        users_in_customer = customer.get_users()

        user_found = False

        for uic in users_in_customer:

            if user.name == uic.name:

                user_found = True
                break

        if user_found:

            if both:
                user.remove_customer(customer)

            customer.remove_user(user)

        else:

            if both:
                user.add_customer(customer)

            customer.add_user(user)

        return user, customer

    @staticmethod
    def toggle_group_from_customer(group=None, customer=None, both=False):
        """Toggles the group for the customer.

         If the group is part of customer then it's removed. If the group is
         not part of the customer then it's added. Changes are not saved
         to the DB.

         Args:

            group: A Group instance.

            customer: A Customer instance.

            both: Whether to toggle both Group and Customer instances or just
                customer.

        Returns:

            True if successfully toggled, False otherwise.
        """

        group_in_customer = customer.get_groups()
        group_found = False

        for gic in group_in_customer:

            if group.id == gic.id:

                group_found = True
                break

        if group_found:

            if both:
                group.clear_customer()

            customer.remove_group(group)

        else:

            if both:
                group.set_customer(customer)

            customer.add_group(group)

        return group, customer

    @staticmethod
    def delete_user(name=None, current_customer=None):
        """Delete a User for good.

         Args:

            name: Name of the user to delete.

        Returns:

            True if user was deleted, False otherwise.
        """

        if name == 'admin':
            return False

        user = Hierarchy.get_user(name)

        if not name:

            return False

        # Build users and groups list before deleting user.
        user_groups = user.get_groups()
        found_groups = []

        for group in user_groups:

            g = Hierarchy.get_group({GroupKey.Id: group.id})

            if g:

                found_groups.append(g)

        user_customers = user.get_customers()
        found_customers = []

        for customer in user_customers:

            c = Hierarchy.get_customer(customer.name)

            if c:

                found_customers.append(c)

        deleted = _db._db_delete(collection_name=UserCollection, _id=name)

        if deleted:

            for group in found_groups:

                __, group = Hierarchy.toggle_user_from_group(user, group)

                _db.save_group(group)

            for customer in found_customers:

                __, customer = Hierarchy.toggle_user_from_customer(user,
                                                                   customer)

                _db.save_customer(customer)

        return deleted

    @staticmethod
    def delete_group(group=None):
        """Delete a Group for good.

         Args:

            group: Group instance to delete.

        Returns:

            True if group was deleted, False otherwise.
        """

        if not group:

            return False

        if group.name == 'Administrator':

            return False

        # Build users and customer list before deleting group.
        group_users = group.get_users()
        found_users = []

        for user in group_users:

            u = Hierarchy.get_user(user.name)

            if u:

                found_users.append(u)

        customer = group.get_customer()
        customer = Hierarchy.get_customer(customer.name)

        deleted = _db._db_delete(collection_name=GroupCollection, _id=group.id)

        if deleted:

            for user in found_users:

                user, __ = Hierarchy.toggle_user_from_group(user, group)

                Hierarchy.save_user(user)

            if customer:

                __, customer = Hierarchy.toggle_group_from_customer(
                    group,
                    customer
                )

                Hierarchy.save_customer(customer)

        return deleted

    @staticmethod
    def delete_customer(name=None):
        """Delete a Customer for good.

         Args:

            name: Name of the customer to delete.

        Returns:

            True if customer was deleted, False otherwise.
        """

        if(
            not name
            or name == 'default'
        ):
            return False

        customer = Hierarchy.get_customer(name)

        # Build users and groups list before deleting customer.
        customer_groups = customer.get_groups()
        found_groups = []

        for group in customer_groups:

            g = Hierarchy.get_group({GroupKey.Id: group.id})

            if g:

                found_groups.append(g)

        customer_users = customer.get_users()
        found_users = []

        for user in customer_users:

            u = Hierarchy.get_user(user.name)

            if u:

                found_users.append(u)

        deleted = _db._db_delete(collection_name=CustomerCollection,
                                 _id=customer.name)

        if deleted:

            for group in found_groups:

                group, __ = Hierarchy.toggle_group_from_customer(
                    group,
                    customer,
                    both=True
                )

                _db.save_group(group)

            for user in found_users:

                user, __ = Hierarchy.toggle_user_from_customer(
                    user,
                    customer,
                    both=True
                )

                _db.save_user(user)

        return deleted

    @staticmethod
    def save_user(user=None):

        if user:

            return _db.save_user(user)

    @staticmethod
    def save_customer(customer=None):

        if customer:

            return _db.save_customer(customer)

    @staticmethod
    def save_group(group=None):

        if group:

            return _db.save_group(group)

    @staticmethod
    def authenticate_account(name=None, password=''):

        if name:

            user = Hierarchy.get_user(name)

            if user:

                hash_password = user.password.encode('utf-8')

                if Crypto.verify_bcrypt_hash(password, hash_password):

                    return True

        return False


def get_current_customer_name(user):
    """Gets the current customer name for a user.

     Args:

        name: Name of the user.

    Returns:

        The name of the current customer if it's found. Default customer
            otherwise.
    """

    user = Hierarchy.get_user(user)

    if user:

        customer = user.get_current_customer()

        if customer:

            return customer.name

    return DefaultCustomer


def get_all_customers():

    return _db.get_all_customers()
