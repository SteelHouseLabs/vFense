import logging
import logging.config
from utils.security import generate_pass
from server.hierarchy import *
from server.hierarchy._db import actions
from server.hierarchy.group import Group
from server.hierarchy.user import User
from server.hierarchy.customer import Customer

from server.hierarchy.permissions import Permission
from utils.security import Crypto

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class Hierarchy():

    @staticmethod
    def get_user(user_name=None):
        """Gets a User instance.

        Args:

            name: Name of the user.

        Returns:

            A User instance if found, None otherwise.
        """

        if not user_name:

            return None

        user = None

        try:

            u = actions.get_user(user_name)
            if u:

                user = User(
                    u[UserKey.UserName],
                    u[UserKey.Password],
                    u[UserKey.FullName],
                    u[UserKey.Email],
                    u[UserKey.CurrentCustomer],
                    u[UserKey.DefaultCustomer],
                    u[UserKey.Enabled]
                )

        except Exception as e:
            logger.error('Could not get user %s.' % user_name)
            logger.exception(e)

        return user

    @staticmethod
    def get_customers_of_user(user_name=None):

        if not user_name:
            return None

        customers = []

        try:

            if user_name == AdminUser:

                all_customers = actions.db_get_all(
                    Collection.Customers
                )

            else:

                all_customers = actions.get_customers_of_user(
                    user_name=user_name
                )

            for c in all_customers:
                try:
                    customer = Customer(
                        c[CustomerKey.CustomerName],
                        c[CustomerKey.Properties],
                    )

                    customers.append(customer)

                except Exception as e:
                    logger.error('Skipping customer `%s`' % u)
                    logger.exception(e)

        except Exception as e:

            logger.error(
                'Could not get customers of user `%s` .'
                % user_name
            )
            logger.exception(e)

        return customers

    @staticmethod
    def get_users_of_group(group_name=None, customer_name=None):
        """Gets all of the user's belonging to a group.

        Returns:

            A list of users.
        """

        if (
            not group_name
            and not customer_name
        ):

            return None

        users = []
        try:

            group_users = actions.get_users_of_group(
                group_name=group_name,
                customer_name=customer_name
            )

            for u in group_users:
                try:
                    user = User(
                        u[UserKey.UserName],
                        u[UserKey.Password],
                        u[UserKey.FullName],
                        u[UserKey.Email],
                        u[UserKey.CurrentCustomer],
                        u[UserKey.DefaultCustomer],
                        u[UserKey.Enabled]
                    )

                    users.append(user)

                except Exception as e:
                    logger.error('Skipping user %s' % u)
                    logger.exception(e)

        except Exception as e:

            logger.error(
                'Could not get users of group "%s" .'
                % group_name
            )
            logger.exception(e)

        return users

    @staticmethod
    def get_users_of_customer(customer_name=None):
        """Gets all of the user's belonging to a Customer.

        Args:

            customer: Customer name to check users against.

        Returns:

            A list of users.
        """

        if not customer_name:

            return None

        users = []
        try:

            customer_users = actions.get_users_of_customer(
                customer_name=customer_name
            )

            for u in customer_users:
                try:
                    user = User(
                        u[UserKey.UserName],
                        u[UserKey.Password],
                        u[UserKey.FullName],
                        u[UserKey.Email],
                        u[UserKey.CurrentCustomer],
                        u[UserKey.DefaultCustomer],
                        u[UserKey.Enabled]
                    )

                    users.append(user)

                except Exception as e:
                    logger.error('Skipping user %s' % u)
                    logger.exception(e)

        except Exception as e:

            logger.error(
                'Could not get users of customer "%s" .'
                % customer_name
            )
            logger.exception(e)

        return users

    @staticmethod
    def get_group(group_name=None, customer_name=None):
        """Gets a Group instance.

        Args:


        Returns:

            A Group instance if found, None otherwise.
        """
        if(
            not group_name
            and not customer_name
        ):
            return None

        group = actions.db_get_by_secondary(
            collection=Collection.Groups,
            values=[
                group_name,
                customer_name
            ],
            index=GroupKey.GroupNameAndCustomerId
        )

        if len(group) >= 1:
            for gp in group:
                if gp[GroupKey.CustomerId] == customer_name:
                    g = gp
                    break

            g = group[0]

        else:
            g = None

        if g:

            group = Group(
                g[GroupKey.GroupName],
                g[GroupKey.CustomerId],
                g[GroupKey.Permissions],
                g[GroupKey.Id]
            )

            return group

        return None

    @staticmethod
    def get_group_by_id(group_id=None):
        """Gets a Group instance.

        Args:


        Returns:

            A Group instance if found, None otherwise.
        """
        if not group_id:
            return None

        try:

            g = actions.db_get(
                collection=Collection.Groups,
                primary_id=group_id
            )

            if g:

                group = Group(
                    g[GroupKey.GroupName],
                    g[GroupKey.CustomerId],
                    g[GroupKey.Permissions],
                    g[GroupKey.Id]
                )

                return group

        except Exception as e:

            logger.error('Could not get group by id `%s`' % group_id)
            logger.exception(e)

        return None

    @staticmethod
    def get_groups_of_user(user_name=None, customer_name=None):
        """Gets the groups of a user.

        Args:

            name: Name of the groups wanted.

        Returns:

            A list of Group instances if found, empty list otherwise.
        """

        if(
            not customer_name
            and not user_name
        ):
            return []

        g = []
        try:

#            if Hierarchy.is_admin(user_name):
#
#                print 'getting all groups'
#
#                groups = Hierarchy.get_groups_of_customer(
#                    customer_name
#                )
#
#                g = groups
#
#            else:

                groups = actions.get_groups_of_user(
                    user_name=user_name,
                    customer_name=customer_name
                )

                for group in groups:
                    try:

                        tmp = Group(
                            group[GroupKey.GroupName],
                            group[GroupKey.CustomerId],
                            group[GroupKey.Permissions],
                            group[GroupKey.Id]
                        )
                        g.append(tmp)

                    except Exception as e:

                        logger.error('Skipping group %s.' % group)
                        logger.exception(e)

        except Exception as e:

            logger.error(
                'Could not get groups of user `%s`.'
                % user_name
            )
            logger.exception(e)

        return g

    @staticmethod
    def get_groups_of_customer(customer_name=None):
        """Gets the groups of a customer.

        Args:

            name: Name of the customer.

        Returns:

            A list of Group instances if found, empty list otherwise.
        """

        if not customer_name:
            return []

        g = []
        try:

            groups = actions.get_groups_of_customer(
                customer_name=customer_name
            )

            for group in groups:
                try:

                    tmp = Group(
                        group[GroupKey.GroupName],
                        group[GroupKey.CustomerId],
                        group[GroupKey.Permissions],
                        group[GroupKey.Id]
                    )
                    g.append(tmp)

                except Exception as e:

                    logger.error('Skipping group %s.' % group)
                    logger.exception(e)

        except Exception as e:

            logger.error(
                'Could not get groups of customer `%s`.'
                % customer_name
            )
            logger.exception(e)

        return g

    @staticmethod
    def get_customer(customer_name=None):
        """Gets a Customer instance.

        Args:

            name: Name of the customer.

        Returns:

            A Customer instance if found, None otherwise.
        """

        if not customer_name:
            return None

        customer = None
        c = actions.get_customer(customer_name=customer_name)

        if c:

            customer = Customer(
                c[CustomerKey.CustomerName],
                c[CustomerKey.Properties]
            )

        return customer

    @staticmethod
    def create_user(
        user_name=None,
        full_name=None,
        email=None,
        password=None,
        groups=None,
        default_customer=None,
        customers=None
    ):
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
            not user_name
        ):
            return False, "Username/password is needed."

        try:

            if Hierarchy.get_user(user_name):
                return False, (
                    "Username `%s` already exist." % user_name
                )

            # Get the Customer(s) that will be added to this user.
            customers_to_add = []
            if customers:

                for customer_name in customers:

                    c = Hierarchy.get_customer(customer_name)

                    if c:

                        customers_to_add.append(c)

            if default_customer:

                defult_cusomter = Hierarchy.get_customer(default_customer)
                add_customer = True

                if default_customer:

                    for c in customer_to_add:
                        if c.customer_name == dc.customer_name:
                            add_customer = False
                            break

                    if add_customer:
                        customers_to_add.append(default_cusotmer)

            else:

                if customers_to_add:

                    default_customer = customers_to_add[0]

                else:

                    default_customer = Hierarchy.get_customer(DefaultCustomer)
                    customers_to_add.append(default_customer)

            #if not customers:
            #    customers = [default_customer]

            #if added_default:
            #    if DefaultCustomer not in customers:
            #        customers.append(DefaultCustomer)

            # Now a Customer type.
            #default_customer = Hierarchy.get_customer(default_customer)

            #if not customers_to_add:
            #    customers_to_add.append(default_customer)

            #############################################################

            # Get the Group(s) that will be added to this user.
            groups_to_add = []
            if groups:

                groups_list = []

                for group_name in groups:

                    g = Hierarchy.get_group(
                        group_name,
                        default_customer.customer_name
                    )

                    if g:

                        groups_list.append(g)

                groups_to_add.extend(groups_list)

            else:

                g = Hierarchy.get_group(
                    DefaultGroup.ReadOnly,
                    default_customer.customer_name
                )

                if g:

                    groups_to_add.append(g)
            #############################################################

            user_name = user_name.strip()
            full_name = full_name.strip()

            if not password:
                password = generate_pass()

            password = Crypto.hash_bcrypt(password.encode('utf-8'))

            user = User(
                user_name,
                password,
                full_name,
                email,
                default_customer.customer_name,
                default_customer.customer_name
            )

            saved = Hierarchy.save_user(user)

            if saved:

                for group in groups_to_add:

                    Hierarchy.toggle_group_of_user(
                        group=group,
                        user=user,
                        customer=default_customer
                    )

                for customer in customers_to_add:

                    Hierarchy.toggle_user_from_customer(
                        user=user,
                        customer=customer
                    )

                return user, ''

        except Exception as e:

            logger.error("Unable to create user `%s`." % user_name)
            logger.exception(e)

        return None

    @staticmethod
    def create_group(
        name=None,
        permissions=None,
        customer_name=None
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

        if not customer_name:
                customer_name = DefaultCustomer

        if Hierarchy.get_group(name, customer_name):
            return False, (
                "Group with name `%s` already exist for customer `%s`"
                % (name, customer_name)
            )

        name = name.strip()

        if not permissions:
            permissions = []

        customer = Hierarchy.get_customer(customer_name)
        if not customer:
            return None, "Customer `%s` does not exist." % customer_name

        group = Group(name, customer_name, permissions)
        saved = Hierarchy.save_group(group)

        if saved:

            # No need to toggle because its added during the save.
            #customer = Hierarchy.get_customer(customer_name)
            #if customer:

            #    toggled = Hierarchy.toggle_group_from_customer(
            #        group,
            #        customer,
            #    )

            group.id = saved
            return group, ""

        return None, "Unable to create group `%s`" % name

    @staticmethod
    def default_groups(customer_name=None):

        try:

            admin = Hierarchy.create_group(
                DefaultGroup.Administrator,
                [Permission.Admin],
                customer_name
            )

            read = Hierarchy.create_group(
                DefaultGroup.ReadOnly,
                customer_name=customer_name
            )

            install = Hierarchy.create_group(
                DefaultGroup.InstallOnly,
                [Permission.Install],
                customer_name
            )

            success = admin[0] and read[0] and install[0]
            msg = admin[1] + read[1] + install[1]

            return (success, msg)

        except Exception as e:

            logger.error("Unable to create default groups.")
            logger.exception(e)

            return None

    @staticmethod
    def create_customer(name=None, properties={}):
        """Create a new Customer and save it.

        Args:

            name: Name of the customer.

        Returns:

            The newly created Customer if added successfully, None otherwise.
        """

        if not name:
            return False, "A customer name is needed."

        if Hierarchy.get_customer(name):
            return False, (
                "Customer with name `%s` already exist." % name
            )

        name = name.strip()

        customer = Customer(name, properties)
        results = Hierarchy.save_customer(customer)

        if results:
            Hierarchy.default_groups(name)
            return customer, ""

        return None, (
            "Unable to create customer `%s`. Customer already exist?" % name
        )

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
        if not user:
            return False

        password = mod_data.get(UserKey.Password)
        if password:
            password = password.encode('utf-8')
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
                user.current_customer = current_customer

        default_customer = mod_data.get(UserKey.DefaultCustomer)
        if default_customer:

            customer = Hierarchy.get_customer(default_customer)

            if customer:
                user.default_customer = default_customer

        customers = mod_data.get(UserKey.Customers)
        if customers:

            for customer in customers:

                c = Hierarchy.get_customer(customer)

                if c:

                    Hierarchy.toggle_user_from_customer(
                        user,
                        c,
                    )

        groups = mod_data.get(UserKey.Groups)
        if groups:

            customer_context = mod_data.get('customer_context')
            if customer_context:

                c = Hierarchy.get_customer(customer_context)

            else:

                c = Hierarchy.get_customer(user.current_customer)

            if c:
                for group in groups:

                    g = Hierarchy.get_group(group)

                    if g:

                        Hierarchy.toggle_group_of_user(
                            user,
                            g,
                            c
                        )

        if Hierarchy.save_user(user):
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

        ### Hacky variables....
        groups_changed = False
        users_changed = False

        try:

            customer = Hierarchy.get_customer(name)
            if not customer:
                return False

            groups = mod_data.get(CustomerKey.Groups)
            if groups:

                for group_names in groups:

                    g = Hierarchy.get_group(
                        group_name,
                        customer.customer_name
                    )

                    if g:

                        Hierarchy.toggle_group_from_customer(
                            g,
                            customer
                        )
                        groups_changed = True

            users = mod_data.get(CustomerKey.Users)
            if users:

                for user in users:

                    u = Hierarchy.get_user(user)

                    if u:

                        Hierarchy.toggle_user_from_customer(
                            u,
                            customer,
                        )
                        users_changed = True

            ### HACK UNTIL API IS SEPARATED!!! #####
            if(
                not groups_changed
                or not users_changed
            ):
                return True

            return Hierarchy.save_customer(customer)

        except Exception as e:

            logger.error("Unable to edit customer `%s`" % name)
            logger.exception(e)

    @staticmethod
    def edit_group(
        group_name=None,
        customer_name=None,
        mod_data=None
    ):
        """Edit group's properties.

        Args:

            group: the Group instance to edit.

            customer_context: Customer which the group belongs to.

            mod_data: A dic of GroupKeys as the key with the new values.

        Returns:

            True if successful, False otherwise.
        """

        if (
            not group_name
            and not customer_name
            and not mod_data
        ):

            return False

        group = Hierarchy.get_group(group_name, customer_name)

        ### Hacky variables....
        customer_changed = False
        perm_changed = False

        # Change group from one customer to another!?
        c = None
        customer = mod_data.get(GroupKey.CustomerId)
        if customer:

            c = Hierarchy.get_customer(customer)

            if c:

                group.set_customer(c.customer_name)
                customer_changed = True

        permissions = mod_data.get(GroupKey.Permissions)
        group_permissions = group.permissions
        if permissions:

            for perm in permissions:

                if perm in group_permissions:

                    group.remove_permission(perm)
                    perm_changed = True

                else:

                    group.add_permission(perm)
                    perm_changed = True

        users = mod_data.get(GroupKey.Users)
        if users:

            new_users = []
            for user in users:

                if user == AdminUser:
                    continue

                u = Hierarchy.get_user(user)
                if u:

                    new_users.append(u)

            for user in new_users:

                c = Hierarchy.get_customer(customer_name)
                if not c:
                    continue

                Hierarchy.toggle_group_of_user(
                    group,
                    user,
                    c
                )

        ### HACK UNTIL API IS SEPARATED!!! #####
        if(
            not customer_changed
            and not perm_changed
        ):
            return True

        return Hierarchy.save_group(group)

    # Famous toggle functions!!
    # Only brave souls shall pass.
    @staticmethod
    def toggle_group_of_user(group=None, user=None, customer=None):
        """Toggles the user for the group for a particular customer.

         If the user is part of group then it's removed. If the user is not
         part of the group then it's added.

         Args:

            user: A User instance.

            group: A Group instance.

            customer: A Customer instance.

        Returns:

            True if successfully toggled, False otherwise.
        """

        result = False

        try:

            if (
                not group
                or not user
                or not customer
            ):
                return result

            result = actions.db_get_by_secondary(
                collection=Collection.GroupsPerUser,
                values=[
                    group.group_name,
                    user.user_name,
                    customer.customer_name
                ],
                index=GroupsPerUserKey.GroupUserAndCustomerId
            )

            if len(result) >= 1:

                result = actions.db_delete_by_secondary(
                    collection=Collection.GroupsPerUser,
                    values=[
                        group.group_name,
                        user.user_name,
                        customer.customer_name
                    ],
                    index=GroupsPerUserKey.GroupUserAndCustomerId
                )

            else:

                res = Hierarchy.save_group_per_user(group, user, customer)
                if res:
                    result = True

            return result

        except Exception as e:

            logger.error(
                "Unable to toggle user `%s` from group `%s`."
                % (user, group)
            )
            logger.exception(e)

        return False

    @staticmethod
    def toggle_user_from_customer(user=None, customer=None):
        """Toggles the user for the customer.

         If the user is part of customer then it's removed. If the user is not
         part of the customer then it's added. Changes are not saved to the DB.

         Args:

            user: A User instance.

            customer: A Customer instance.

        Returns:

            True if successfully toggled, False otherwise.
        """

        result = False
        try:

            if (
                not user
                or not customer
            ):
                return result

            result = actions.db_get_by_secondary(
                collection=Collection.UsersPerCustomer,
                values=[
                    user.user_name,
                    customer.customer_name
                ],
                index=UsersPerCustomerKey.UserAndCustomerId
            )

            if len(result) >= 1:

                result = actions.db_delete_by_secondary(
                    collection=Collection.UsersPerCustomer,
                    values=[
                        user.user_name,
                        customer.customer_name
                    ],
                    index=UsersPerCustomerKey.UserAndCustomerId
                )

                ### SAFETY HACK
                ### Make sure a user has at least one customer.
                customer_count = actions.db_get_by_secondary(
                    collection=Collection.UsersPerCustomer,
                    values=user.user_name,
                    index=UsersPerCustomerKey.UserId
                )

                if len(customer_count) <= 0:
                    def_customer = Hierarchy.get_customer(DefaultCustomer)
                    res = Hierarchy.save_user_per_customer(user, def_customer)
                    if res:
                        result = True

            else:

                res = Hierarchy.save_user_per_customer(user, customer)
                if res:
                    result = True

        except Exception as e:

            logger.error(
                "Uable to toggle user `%s` from customer `%s`"
                % (user, customer)
            )
            logger.exception(e)

        return result

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
        try:

            if (
                not group
                or not customer
            ):
                return result

            result = actions.db_get_by_secondary(
                collection=Collection.Groups,
                values=[
                    group.group_name,
                    customer.customer_name
                ],
                index=GroupKey.GroupNameAndCustomerId
            )

            if len(result) >= 1:

                result = actions.db_delete_by_secondary(
                    collection=Collection.Groups,
                    values=[
                        group.group_name,
                        customer.customer_name
                    ],
                    index=GroupKey.GroupNameAndCustomerId
                )

            else:

                res = Hierarchy.save_group_per_customer(group, customer)
                if res:
                    result = True

        except Exception as e:

            result = False

            logger.error(
                "Uable to toggle group `%s` from customer `%s`"
                % (group, customer)
            )
            logger.exception(e)

        return result

    @staticmethod
    def delete_user(name=None):
        """Delete a User for good.

         Args:

            name: Name of the user to delete.

        Returns:

            True if user was deleted, False otherwise.
        """

        if name == AdminUser:
            return False, 'Cannot delete the %s user.' % AdminUser

        if not name:
            return False, 'Username was not provided.'

        try:

            user = Hierarchy.get_user(name)
            if not user:
                return False, 'Did not find user `%s`' % name

            deleted = actions.db_delete_by_secondary(
                collection=Collection.UsersPerCustomer,
                values=name,
                index=UsersPerCustomerKey.UserId
            )
            if not deleted:
                msg = 'Unable to delete users per customer.'
                logger.error(msg)

            deleted = actions.db_delete_by_secondary(
                collection=Collection.GroupsPerUser,
                values=name,
                index=GroupsPerUserKey.UserId
            )

            if not deleted:
                msg = 'Unable to delete group per user.'
                logger.error(msg)

            deleted = actions.db_delete(
                collection=Collection.Users,
                _id=name
            )

            if not deleted:
                msg = 'Unable to delete user `%s`' % name
                logger.error(msg)
                return False, msg

            return True, ''

        except Exception as e:

            logger.error("Unable to delete user `%s`" % name)
            logger.exception(e)

        return False, "Unable to delete user `%s`" % name

    @staticmethod
    def delete_group(group_name=None, customer_name=None):
        """Delete a Group for good.

        Returns:

            True if group was deleted, False otherwise.
        """

        if (
            not group_name
            and not customer_name
        ):
            return False, "Group and customer name is needed."

        if group_name in SafeGroups:
            return False, "Can not delete the `%s` group." % group_name

        error_msg = (
            "Unable to delete group `%s` from customer `%s`"
            % (group_name, customer_name)
        )

        try:

            if not Hierarchy.get_group(group_name, customer_name):
                return False, (
                    'Did not find group `%s` for customer `%s`'
                    % (group_name, customer_name)
                )

            deleted = actions.db_delete_by_secondary(
                collection=Collection.GroupsPerUser,
                values=[
                    group_name,
                    customer_name
                ],
                index=GroupsPerUserKey.GroupUserAndCustomerId
            )

            if not deleted:
                msg = 'Nothing was deleted from group per user.'
                logger.error(msg)

            deleted = actions.db_delete_by_secondary(
                collection=Collection.Groups,
                values=[
                    group_name,
                    customer_name
                ],
                index=GroupKey.GroupNameAndCustomerId
            )

            if not deleted:
                msg = 'Unable to delete group `%s`' % group_name
                logger.error(msg)
                return False, msg
            else:
                return True, ''

        except Exception as e:

            logger.error(error_msg)
            logger.exception(e)

        logger.error(error_msg)

        return False, error_msg

    @staticmethod
    def delete_customer(name=None):
        """Delete a Customer for good.

         Args:

            name: Name of the customer to delete.

        Returns:

            True if customer was deleted, False otherwise.
        """


        if not name:
            return False, "Customer name was not provided."


        if name == DefaultCustomer:
            return False, (
                "Can not delete the `%s` customer." % DefaultCustomer
            )


        error_msg = "Unable to delete customer `%s`." % name

        try:

            if not Hierarchy.get_customer(name):
                return False, 'Did not find customer `%s`' % name

            deleted = actions.db_delete_by_secondary(
                collection=Collection.Groups,
                values=name,
                index=GroupKey.CustomerId
            )

            if not deleted:
                msg = 'Unable to delete groups from customer.'
                logger.error(msg)

            deleted = actions.db_delete_by_secondary(
                collection=Collection.UsersPerCustomer,
                values=name,
                index=UsersPerCustomerKey.CustomerId
            )

            if not deleted:
                msg = 'Unable to delete users from customer.'
                logger.error(msg)

            deleted = actions.db_delete(
                collection=Collection.Customers,
                _id=name
            )

            if not deleted:
                logger.error(error_msg)
                return False, error_msg

            Hierarchy._users_of_delete_customer(name)

            return True, ''

        except Exception as e:

            logger.error(error_msg)
            logger.exception(e)

        return False, error_msg

    @staticmethod
    def _users_of_delete_customer(customer_name=None):

        if not customer_name:
            return False

        try:

            users = actions.filter(
                collection=Collection.Users,
                filter_value={
                    UserKey.CurrentCustomer: customer_name
                }
            )

            u2 = actions.filter(
                collection=Collection.Users,
                filter_value={
                    UserKey.DefaultCustomer: customer_name
                }
            )

            users.extend(u2)
            for u in users:
                changes = False

                user = User.from_dict(u)

                if user.current_customer == customer_name:
                    user.current_customer = DefaultCustomer
                    changes = True

                if user.default_customer == customer_name:
                    user.default_customer = DefaultCustomer
                    changes = True

                if changes:
                    Hierarchy.save_user(user)

        except Exception as e:

            logger.error('Unable to change users of deleted customer')
            logger.exception(e)

    @staticmethod
    def save_user(user=None):

        try:

            if user:
                _user = {}

                _user[UserKey.UserName] = user.user_name
                _user[UserKey.FullName] = user.full_name
                _user[UserKey.Email] = user.email
                _user[UserKey.Enabled] = user.enabled
                _user[UserKey.Password] = user.password

                _user[UserKey.CurrentCustomer] = user.current_customer
                _user[UserKey.DefaultCustomer] = user.default_customer

                return actions.save_user(_user)

        except Exception as e:

            logger.error("Uable to save user: %s" % user)
            logger.exception(e)

        return None

    @staticmethod
    def save_user_per_customer(user=None, customer=None):

        try:

            if(
                user
                and customer
            ):
                data = {
                    UsersPerCustomerKey.UserId: user.user_name,
                    UsersPerCustomerKey.CustomerId: customer.customer_name
                }

                return actions.save_user_per_customer(data)

        except Exception as e:

            logger.error(
                "Uable to add user `%s` to customer `%s`."
                % (user, customer)
            )
            logger.exception(e)

        return False

    @staticmethod
    def save_customer(customer=None):

        try:

            if customer:

                _customer = {}

                _customer[CustomerKey.CustomerName] = customer.customer_name
                _customer[CustomerKey.Properties] = customer.properties

                return actions.save_customer(_customer)

        except Exception as e:

            logger.error('Unable to save customer: %s' % customer)
            logger.exception(e)

        return None

    @staticmethod
    def save_group(group=None):

        try:

            if group:

                _group = {}

                if group.id:
                    _group[GroupKey.Id] = group.id

                _group[GroupKey.GroupName] = group.group_name
                _group[GroupKey.Permissions] = group.permissions
                _group[GroupKey.CustomerId] = group.customer

                return actions.save_group(_group)

        except Exception as e:

            logger.error('Unable to save group: %s' % group)
            logger.exception(e)

        return None

    @staticmethod
    def save_group_per_user(group=None, user=None, customer=None):

        try:

            if(
                group
                and user
                and customer
            ):

                data = {
                    GroupsPerUserKey.GroupId: group.group_name,
                    GroupsPerUserKey.CustomerId: customer.customer_name,
                    GroupsPerUserKey.UserId: user.user_name
                }

                return actions.save_group_per_user(data)

        except Exception as e:

            logger.error(
                "Uable to add user `%s` to group `%s`."
                % (user, group)
            )
            logger.exception(e)

        return False

    @staticmethod
    def save_group_per_customer(group=None, customer=None):

        try:

            if(
                group
                and customer
            ):
                data = {
                    GroupKey.GroupName: group.group_name,
                    GroupKey.CustomerId: customer.customer_name
                }

                return actions.save_group_per_customer(data)

        except Exception as e:

            logger.error(
                "Uable to add group `%s` to customer `%s`."
                % (group, customer)
            )
            logger.exception(e)

        return False

    @staticmethod
    def authenticate_account(name=None, password=''):

        if name:

            user = Hierarchy.get_user(name)

            if user:

                hash_password = user.password.encode('utf-8')
                password = password.encode('utf-8')

                if Crypto.verify_bcrypt_hash(password, hash_password):

                    return True

        return False

    @staticmethod
    def get_customer_property(customer_name=None, property_name=None):

        if (
            not customer_name
            and not property_name
        ):
            return None

        try:

            properties = actions.db_get(
                collection=Collection.Customers,
                primary_id=customer_name,
                pluck=CustomerKey.Properties
            )

            properties = properties[CustomerKey.Properties]

            return properties.get(property_name)

        except Exception as e:

            logger.error("Unable to retrieve property `%s`." % property_name)
            logger.exception(e)

        return None

    @staticmethod
    def is_admin(user_name=None, customer_name=None):

        if not user_name:
            return False

        try:

            user = Hierarchy.get_user(user_name)
            if not user:
                return False

            if not customer_name:
                customer_name = user.current_customer

            groups = actions.get_groups_of_user(
                user_name=user_name,
                customer_name=customer_name
            )

            admin_perm = False
            for group in groups:

                if Permission.Admin in group[GroupKey.Permissions]:
                    admin_perm = True
                    break

            if (
                user_name == AdminUser
                or admin_perm
            ):
                return True

        except Exception as e:

            logger.error("Unable to verify `%s` as admin" % user_name)
            logger.exception(e)

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

        if user.current_customer:

            return user.current_customer

    return DefaultCustomer


def get_all_customers():

    customers = []
    try:

        cs = actions.db_get_all(
            collection=Collection.Customers,
        )

        for c in cs:

            customers.append(
                Customer(
                    c[CustomerKey.CustomerName],
                    c[CustomerKey.Properties]
                )
            )

    except Exception as e:

        logger.error("Unable to get all customers")
        logger.exception(e)

    return customers
