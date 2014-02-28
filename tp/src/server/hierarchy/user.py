from server.hierarchy import UserKey, DefaultCustomer


class User():

    def __init__(
        self, user_name, password, full_name, email,
        current_customer=DefaultCustomer, default_customer=DefaultCustomer,
        enabled=True
    ):

        self.user_name = user_name
        self.password = password
        self.full_name = full_name
        self.email = email
        self.enabled = enabled

        self.current_customer = current_customer
        self.default_customer = default_customer

    def dict(self):

        return {
            UserKey.UserName: self.user_name,
            UserKey.FullName: self.full_name,
            UserKey.Email: self.email,
            UserKey.Enabled: self.enabled,
            UserKey.CurrentCustomer: self.current_customer,
            UserKey.DefaultCustomer: self.default_customer
        }

    @staticmethod
    def from_dict(user):

        u = User(
            user.get(UserKey.UserName),
            user.get(UserKey.Password),
            user.get(UserKey.FullName),
            user.get(UserKey.Email),
            user.get(UserKey.CurrentCustomer),
            user.get(UserKey.DefaultCustomer),
            user.get(UserKey.Enabled)
        )

        return u

    def __repr__(self):

        return (
            "User(name=%r, fullname=%r, email=%r)"
            % (self.user_name, self.full_name, self.email)
        )
