import functools
import urllib
import urlparse
import json

from tornado.web import HTTPError

from server.hierarchy.manager import Hierarchy
from server.hierarchy.permissions import Permission


class permission_check(object):

    def __init__(self, **kwargs):
        """
        If there are decorator arguments, the function
        to be decorated is not passed to the constructor!
        """

        self._permission = kwargs.get('permission')

    def __call__(self, f):
        """
        If there are decorator arguments, __call__() is only called
        once, as part of the decoration process! You can only give
        it a single argument, which is the function object.
        """

        def wrapped_f(*args):

            permission_granted = False

            tornado_handler = args[0]

            username = tornado_handler.get_current_user()

            user = Hierarchy.get_user(username)

            user_groups = Hierarchy.get_groups_of_user(
                username,
                user.current_customer
            )

            for group in user_groups:

                if self._permission in group.permissions:

                    permission_granted = True
                    break

                elif Permission.Admin in group.permissions:

                    permission_granted = True
                    break

            if permission_granted:

                f(*args)

            else:

                self._permission_denied(tornado_handler)

        return wrapped_f

    def _permission_denied(self, tornado_handler):

        tornado_handler.set_header('Content-Type', 'application/json')

        denied = {
            'pass': False,
            'message': 'Permission denied.'
        }

        tornado_handler.write(json.dumps(denied, indent=4))


def authenticated_request(method):
    """ Decorator that handles authenticating the request. Uses secure cookies.
    In the spirit of the tornado.web.authenticated decorator.
    """
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):

        # Get the access token argument. If nothing is provided, string will be
        # "Invalid". Chose this way instead of using "try" and catching
        # HttpError 400 which get_argument throws
        #access_token = str(self.get_argument("access_token", default="Invalid"))

        # Check if an access token is legit.
        # if access_token != "Invalid":
        #     return method(self, *args, **kwargs)

        # If the access token is not provided, assumes is the main ui client.
        if not self.current_user:     
            if self.request.method in ("GET", "HEAD", "POST"):
                url = self.get_login_url()
                # if "?" not in url:
                #     if urlparse.urlsplit(url).scheme:
                #         if login url is absolute, make next absolute too
                        # next_url = {'next': self.request.full_url()}
                    # else:
                    #     next_url = {'next': self.request.uri}
                    # url += "?" + urllib.urlencode(next_url)
                self.redirect(url)
                return
            raise HTTPError(403)

        return method(self, *args, **kwargs)

    return wrapper


def agent_authenticated_request(method):
    """ Decorator that handles authenticating the request. Uses secure cookies.
    In the spirit of the tornado.web.authenticated decorator.
    """
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):

        # Get the access token argument. If nothing is provided, string will be
        # "Invalid". Chose this way instead of using "try" and catching
        # HttpError 400 which get_argument throws
        #access_token = str(self.get_argument("access_token", default="Invalid"))

        # Check if an access token is legit.
        # if access_token != "Invalid":
        #     return method(self, *args, **kwargs)

        # If the access token is not provided, assumes is the main ui client.
        if not self.current_user:
            raise HTTPError(403)

        return method(self, *args, **kwargs)

    return wrapper


def convert_json_to_arguments(fn):

    @functools.wraps(fn)
    def wrapper(self, *args, **kwargs):

        content_type = self.request.headers.get("Content-Type", "")

        if content_type.startswith("application/json"):
            self.arguments = json.loads(self.request.body)
            return fn(self, *args, **kwargs)

        else:

            self.set_status(415)
            self.write("Content-type application/json is expected.")

    return wrapper

def convert_json_to_arguments(fn):

    @functools.wraps(fn)
    def wrapper(self, *args, **kwargs):

        content_type = self.request.headers.get("Content-Type", "")

        if content_type.startswith("application/json"):
            self.arguments = json.loads(self.request.body)
            return fn(self, *args, **kwargs)

        else:

            self.set_status(415)
            self.write("Content-type application/json is expected.")

    return wrapper
