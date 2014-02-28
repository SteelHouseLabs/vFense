from server.hierarchy import *
from server.hierarchy.manager import *


class User():

    @staticmethod
    def get(
        active_user=None,
        user_info=None,
        customer_context=None,
        all_users=False
    ):

        if not active_user:

            return {
                'pass': False,
                'message': 'No user name provided.'
            }

        active_user = Hierarchy.get_user(active_user)
        if not active_user:
            return {
                'pass': False,
                'message': 'Invalid active user'
            }

        if user_info:

            info_user = Hierarchy.get_user(user_info)
            user = User._user_presentation_hack(
                info_user,
                active_user.current_customer
            )

            return {
                'pass': True,
                'message': '',
                'data': user
            }

        elif all_users:

            if not customer_context:
                customer_context = active_user.current_customer

            _users = Hierarchy.get_users_of_customer(
                customer_context
            )

            users = []

            for u in _users:

                users.append(
                    User._user_presentation_hack(
                        u,
                        customer_context
                    )
                )

            return {
                'pass': True,
                'message': '',
                'data': users
            }

        else:

            user = User._user_presentation_hack(active_user)

            return {
                'pass': True,
                'message': '',
                'data': user
            }

        return {
            'pass': False,
            'message': 'No users found'
        }

    @staticmethod
    def _user_presentation_hack(user, active_customer=None):
        # The word hack is in the method's name.
        # Prepare for the worst!

        user_dict = user.dict()

        customers_list = Hierarchy.get_customers_of_user(user.user_name)

        if not active_customer:
            active_customer = user.current_customer

        customers = []
        for c in customers_list:
            is_admin = False

            gpu = Hierarchy.get_groups_of_user(
                user.user_name,
                c.customer_name
            )

            for g in gpu:
                if g.group_name == AdminGroup:
                    is_admin = True
                    break

            customers.append(
                {
                    'name': c.customer_name,
                    'admin': is_admin
                }
            )

        current_customer = {
            'name': user.current_customer
        }
        default_customer = {
            'name': user.default_customer
        }

        gpu = Hierarchy.get_groups_of_user(
            user.user_name,
            active_customer
        )

        groups = []
        permissions = []
        for g in gpu:

            groups.append(
                {
                    'name': g.group_name,
                    'id': g.id
                }
            )

            permissions.extend(g.permissions)

        permissions = list(set(permissions))

        user_dict[UserKey.Customers] = customers
        user_dict[UserKey.Permissions] = permissions
        user_dict[UserKey.CurrentCustomer] = current_customer
        user_dict[UserKey.DefaultCustomer] = default_customer
        user_dict[UserKey.Groups] = groups
        user_dict['username'] = user.user_name

        return user_dict

    @staticmethod
    def edit(**kwargs):

        data = {}

        username = kwargs.get('username')

        data[UserKey.Password] = kwargs.get('password', None)
        data[UserKey.FullName] = kwargs.get('fullname', None)
        data[UserKey.Email] = kwargs.get('email', None)

        data[UserKey.Customers] = kwargs.get('customer_ids', None)
        data['customer_context'] = kwargs.get('customer_context', None)

        data[UserKey.DefaultCustomer] = kwargs.get(
            'default_customer_id', None)
        data[UserKey.CurrentCustomer] = kwargs.get(
            'current_customer_id', None)

        group_names = kwargs.get('group_names', None)
        group_ids = kwargs.get('group_ids', None)
        groups = []

        if group_names:

            for name in group_names:

                groups.append({GroupKey.Name: name})

        if group_ids:

            for _id in group_ids:

                groups.append({GroupKey.Id: _id})

        data[UserKey.Groups] = groups

        result = Hierarchy.edit_user(username, data)

        if result:

            return {
                'pass': True,
                'message': 'User {} was updated.'.format(username)
            }

        return {
            'pass': False,
            'message': 'User {} could not be updated.'.format(username)
        }

    @staticmethod
    def delete(name=None):

        if not name:

            return {
                'pass': False,
                'message': 'No username was given.'
            }

        if name == 'admin':
            return {
                'pass': False,
                'message': 'Admin account cannot be deleted.'
            }

        deleted = Hierarchy.delete_user(name)

        if deleted:

            return {
                'pass': True,
                'message': 'User {} was deleted.'.format(name)
            }

        return {
            'pass': False,
            'message': 'User {} could not be deleted.'.format(name)
        }

    @staticmethod
    def create(**kwargs):

        parameters = {}

        parameters['user_name'] = kwargs.get('username')
        parameters['password'] = kwargs.get('password')
        parameters['full_name'] = kwargs.get('fullname', None)
        parameters['email'] = kwargs.get('email', None)

        if (
            not parameters['user_name']
            or not parameters['password']
        ):
            return {
                'pass': False,
                'message': 'Please provide a username and/or password.'
            }

        parameters['customers'] = kwargs.get('customer_ids', None)
        parameters['default_customer'] = kwargs.get(
            'default_customer_id',
            None
        )

        groups = []
        group_names = kwargs.get('group_names', None)
        group_ids = kwargs.get('group_ids', None)

        if group_names:
            groups.extend(group_names)

        if group_ids:

            for group_id in group_ids:

                g = Hierarchy.get_group_by_id(group_id)
                if g:
                    groups.append(g.group_name)

        parameters['groups'] = groups

        user, msg = Hierarchy.create_user(**parameters)

        if user:

            return {
                'pass': True,
                'message': 'User `%s` created' % user.user_name,
                'data': ''
            }

        return {
            'pass': False,
            'message': (
                'User `%s` could not be created. %s'
                % (parameters['user_name'], msg)
            ),
            'data': ''
        }


class Customer():

    @staticmethod
    def get(name=None, user_name=None):

        if name:
            customer = Hierarchy.get_customer(name)

            if customer:

                return {
                    'pass': True,
                    'message': 'Customer found.',
                    'data': customer.dict()
                }

        elif user_name:

            if Hierarchy.is_admin(user_name):

                _customers = get_all_customers()
                customers = []
                for c in _customers:

                    customers.append(
                        {'name': c.customer_name}
                    )

                return {
                    'pass': True,
                    'message': 'Customers found.',
                    'data': customers
                }

            user = Hierarchy.get_user(user_name)
            if user:

                _customers = Hierarchy.get_customers_of_user(user_name)
                customers = []
                for c in _customers:
                    customers.append(c.dict())

                return {
                    'pass': True,
                    'message': 'Customers found.',
                    'data': customers
                }

        return {
            'pass': False,
            'message': 'Customers were not found for user {}.'.format(
                user_name
            )
        }

    @staticmethod
    def edit(**kwargs):

        data = {}
        customer_name = kwargs.get('customer_name')
        user_name = kwargs.get('user_name')
        users = kwargs.get('users')

        if not customer_name:

            return {
                'pass': False,
                'message': 'Customer name was not provided.'
            }

        if AdminUser in users:
            return {
                'pass': False,
                'message': (
                    '`%s` account has no editable properties.'
                    % AdminUser
                )
            }

        customer = Hierarchy.get_customer(customer_name)
        if not customer:

            return {
                'pass': False,
                'message': 'Customer `%s` was not found' % customer_name
            }

#        user_found = False
#        for user in customer.get_users():
#
#            if user.name == user_name:
#                user_found = True
#                break
#
#        if not user_found:
#
#            return {
#                'pass': False,
#                'message': 'User {} does not belong to Customer "{}"'.format(
#                    user_name,
#                    customer.name
#                )
#            }

        data['users'] = users

        properties = {}
        net_throttle = kwargs.get('net_throttle')
        if net_throttle:
            properties[CoreProperty.NetThrottle] = net_throttle

        cpu_throttle = kwargs.get('cpu_throttle')
        if cpu_throttle:
            properties[CoreProperty.CpuThrottle] = cpu_throttle

        pkg_url = kwargs.get('pkg_url')
        if pkg_url:
            properties[CoreProperty.PackageUrl] = pkg_url

        data[CustomerKey.Properties] = properties

        group_names = kwargs.get('group_names', None)
        group_ids = kwargs.get('group_ids', None)

        groups = []
        if group_names:
            groups.extend(group_names)

        if group_ids:
            for group_id in group_ids:

                g = Hierarchy.get_group_by_id(group_id)
                if g:

                    groups.append(g.group_name)

        data[CustomerKey.Groups] = groups

        result = Hierarchy.edit_customer(customer.customer_name, data)

        if result:

            return {
                'pass': True,
                'message': 'Customer `%s` was updated.' % customer_name
            }

        return {
            'pass': False,
            'message': 'Customer `%s` could not be updated.' % customer_name
        }

    @staticmethod
    def delete(name=None, user_name=None):

        if not name:
            return {
                'pass': False,
                'message': 'Customer name not provided.'
            }

        if name == 'default':
            return {
                'pass': False,
                'message': 'Default customer cannot be deleted.'
            }

        customer = Hierarchy.get_customer(name)
        user = Hierarchy.get_user(user_name)
        if customer:

            # *** Leaving this as reference for Miguel ***
            # customer_users = customer.get_users()

            customer_users = \
                Hierarchy.get_users_of_customer(customer.customer_name)

            #user_found = False
            #for cu in customer_users:

            #    if cu.user_name == user.user_name:
            #        user_found = True
            #        break

            # TODO: result is being defined but not used anywhere else
            # in this method
            result = None
            #if user_found:

                # TODO: returning success and error on this call
                # but nothing is being done with the error
                #result = Hierarchy.delete_customer(customer.customer_name)

            success, error = \
                Hierarchy.delete_customer(customer.customer_name)

            if success:


                return {
                    'pass': True,
                    'message': 'Customers {} deleted.'.format(name)
                }

            else:

                return {
                    'pass': False,
                    'message': 'Customers {} could not deleted.'.format(name)
                }

        return {
            'pass': False,
            'message': 'Customers {} was not found.'.format(name)
        }

    @staticmethod
    def create(name, user_name):

        # Hack to set new customer properites...
        default = Hierarchy.get_customer(DefaultCustomer)
        props = default.properties

        customer, msg = Hierarchy.create_customer(name, props)
        user = Hierarchy.get_user(user_name)

        if customer:

            Hierarchy.toggle_user_from_customer(
                user,
                customer,
            )

            # TODO(urgent): undo hack
            Customer._admin_customer_hack(customer)

            return {
                'pass': True,
                'message': 'Customer `%s` created.' % customer.customer_name,
                'data': customer.customer_name
            }

        return {
            'pass': False,
            'message': 'Customer `%s` could not be created.' % name
        }

    @staticmethod
    def _admin_customer_hack(customer):
        # admin user always needs to be added to every customer
        # with Administrator group.

        admin_user = Hierarchy.get_user('admin')
        admin_group = Hierarchy.get_group(
            'Administrator',
            customer.customer_name
        )

        if admin_user:
            Hierarchy.toggle_user_from_customer(
                admin_user,
                customer,
            )

            Hierarchy.toggle_group_of_user(
                admin_group,
                admin_user,
                customer
            )


class Group():

    @staticmethod
    def get(group_name=None, user_name=None, customer_context=None):

        if(
            not group_name
            and not user_name
        ):

            return {
                'pass': False,
                'message': 'No group/user data provided.'
            }


        user = Hierarchy.get_user(user_name)
        if not user:
            return {
                'pass': False,
                'message': 'User `%s` was not found' % user_name
            }

        if not customer_context:
            customer_context = user.current_customer

        if group_name:

            _group = Hierarchy.get_group(group_name, customer_context)
            group = Group._group_presentation_hack(
                _group,
                customer_context
            )
            return {
                'pass': True,
                'message': 'Group found.',
                'data': group
            }

        else:

            try:

                if customer_context:

                    raw_groups = Hierarchy.get_groups_of_user(
                        user.user_name,
                        customer_context
                    )

                    groups = []
                    for _group in raw_groups:
                        group = Group._group_presentation_hack(
                            _group,
                            customer_context
                        )

                        groups.append(group)

                    return {
                        'pass': True,
                        'message': 'Groups found.',
                        'data': groups
                    }

            except Exception as e:

                logger.error('Unable to get group `%s`' % group_name)
                logger.exception(e)

        return {
            'pass': False,
            'message': 'Groups were not found for user {}.'.format(user_name)
        }

    @staticmethod
    def get_groups(customer_context=None, user=None):

        if(
            not customer_context
            and not user
        ):
            return {
                'pass': False,
                'message': 'A customer context neither user was not provided.',
                'data': []
        }

        try:

            if not customer_context:
                user = Hierarchy.get_user(user)
                customer_context = user.current_customer

            _groups = Hierarchy.get_groups_of_customer(customer_context)
            groups = []
            for _group in _groups:
                group = Group._group_presentation_hack(
                    _group,
                    customer_context
                )

                if group:
                    groups.append(group)

            return {
                'pass': True,
                'message': 'Groups found.',
                'data': groups
            }

        except Exception as e:
            return {
                'pass': False,
                'message': 'Groups were not found for customer %s.' % customer_context,
                'data': []
            }

    @staticmethod
    def _group_presentation_hack(group, customer_name):
        group_dict = group.dict()

        customer = {'name': customer_name}

        upg = Hierarchy.get_users_of_group(
            group.group_name,
            customer_name
        )

        users = []
        for u in upg:
            users.append(
                {
                    "name": u.user_name
                }
            )

        group_dict[GroupKey.Users] = users
        group_dict[GroupKey.Customer] = customer
        group_dict['name'] = group.group_name

        return group_dict

    @staticmethod
    def edit(**kwargs):

        data = {}

        group_name = kwargs.get('name', None)
        group_id = kwargs.get('id', None)
        user_name = kwargs.get('user_name', None)

        if (
            not group_name
            and not group_id
        ):

            return {
                'pass': False,
                'message': 'Group name/id was not provided.'
            }

        group = None
        user = Hierarchy.get_user(user_name)

        customer_context = kwargs.get('customer_context', None)
        if not customer_context:
            customer_context = user.current_customer

        if group_id:

            group = Hierarchy.get_group_by_id(group_id)

        elif group_name and user_name:

            if user:
                group = Hierarchy.get_group(
                    group_name,
                    customer_context
                )

        if group:

            data[GroupKey.Customer] = kwargs.get('customer')
            data[GroupKey.Users] = kwargs.get('users')
            data[GroupKey.Permissions] = kwargs.get('permissions')

            if AdminUser in data[GroupKey.Users]:

                    message = 'The admin user has no editable properties.'
                    return {
                        'pass': False,
                        'message': message
                    }

            if (
                group.group_name == AdminGroup
                and data[GroupKey.Permissions]
            ):
                    return {
                        'pass': False,
                        'message': (
                            'Administrator has no editable permissions.'
                        )
                    }

            result = Hierarchy.edit_group(
                group.group_name,
                customer_context,
                data
            )

            if result:

                return {
                    'pass': True,
                    'message': (
                        'Group `%s` has been updated.' % group.group_name
                    )
                }

        return {
            'pass': False,
            'message': (
                'Group `%s` could not be updated.' % (group_name or group_id)
            )
        }

    @staticmethod
    def delete(
        group_id=None,
        group_name=None,
        user_name=None,
        customer_context=None
    ):

        if (
            not group_id
            or (group_name and user_name)
        ):

            return {
                'pass': False,
                'message': 'No group data provided.'
            }

        group = None
        if group_id:
            group = Hierarchy.get_group_by_id(group_id)

        else:
            user = Hierarchy.get_user(user_name)
            if user:

                if not customer_context:
                    customer_context = user.current_customer

                group = Hierarchy.get_group(
                    group_name,
                    customer_context
                )

        if group:

            if group.group_name in SafeGroups:
                return {
                    'pass': False,
                    'message': (
                        'Group `%s` cannot be deleted.' % group.group_name
                    )
                }

            result = Hierarchy.delete_group(
                group.group_name,
                group.customer
            )

            if result:

                return {
                    'pass': True,
                    'message': 'Group `%s` was deleted.' % group.group_name
                }

        return {
            'pass': False,
            'message': (
                'Group `%s` could not be deleted.'
                % (group_id or group_name)
            )
        }

    @staticmethod
    def create(group_name=None, user_name=None, customer_name=None):

        if not group_name:

            return {
                'pass': False,
                'message': 'Name for group not provided.'
            }

        if not customer_name:
            customer_name = get_current_customer_name(user_name)

        if Hierarchy.get_group(group_name, customer_name):
            return {
                'pass': False,
                'message': 'Group with this name and customer already exist.'
            }

        group = Hierarchy.create_group(group_name, customer_name=customer_name)

        if group:

            if user_name:

                user = Hierarchy.get_user(user_name)

                if user:

                    Hierarchy.toggle_group_of_user(
                        user,
                        group,
                    )

            return {
                'pass': True,
                'message': 'Group `%s` created.' % group_name
            }

        return {
            'pass': False,
            'message': 'Group `%s` could not be created.' % group_name
        }
