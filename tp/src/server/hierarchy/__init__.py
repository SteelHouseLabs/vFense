
DefaultCustomer = 'default'
DefaultUser = 'default'
AdminUser = 'admin'
AdminGroup = 'Administrator'


class Collection():

    Users = 'users'
    Customers = 'customers'
    Groups = 'groups'

    GroupsPerCustomer = 'groups_per_customer'
    GroupsPerUser = 'groups_per_user'

    UsersPerCustomer = 'users_per_customer'


class UserKey():

    UserName = 'user_name'  # Primary key!
    FullName = 'full_name'
    Email = 'email'
    Password = 'password'
    Enabled = 'enabled'
    CurrentCustomer = 'current_customer'
    DefaultCustomer = 'default_customer'

    Customers = 'customers'
    Groups = 'groups'
    Permissions = 'permissions'


class GroupKey():

    Id = 'id'

    GroupName = 'group_name'
    Permissions = 'permissions'
    CustomerId = 'customer_id'
    GroupNameAndCustomerId = 'group_name_and_customer_id'

    Users = 'users'
    Customer = 'customer'


class CustomerKey():

    CustomerName = 'customer_name'  # Primary key!!
    Properties = 'properties'

    Groups = 'groups'
    Users = 'users'


class GroupsPerUserKey():

    Id = 'id'
    GroupId = 'group_id'
    UserId = 'user_id'
    CustomerId = 'customer_id'
    GroupIdAndCustomerId = 'group_id_and_customer_id'
    UserIdAndCustomerId = 'user_id_and_customer_id'
    GroupUserAndCustomerId = 'group_user_and_customer_id'


class GroupsPerCustomerKey():

    Id = 'id'
    GroupId = 'group_id'
    CustomerId = 'customer_id'
    GroupAndCustomerId = 'group_and_customer_id'


class UsersPerCustomerKey():

    Id = 'id'
    UserId = 'user_id'
    CustomerId = 'customer_id'
    UserAndCustomerId = 'user_and_customer_id'


class CoreProperty():
    NetThrottle = 'net_throttle'
    CpuThrottle = 'cpu_throttle'
    PackageUrl = 'package_download_url_base'


class DefaultGroup():
    ReadOnly = 'Read Only'
    InstallOnly = 'Install Only'
    Administrator = AdminGroup

SafeGroups = (
    DefaultGroup.ReadOnly,
    DefaultGroup.InstallOnly,
    DefaultGroup.Administrator
)
