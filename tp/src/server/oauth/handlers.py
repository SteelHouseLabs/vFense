from datetime import datetime

try: import simplejson as json
except ImportError: import json

from tornado.web import RequestHandler

from models.oauth.token import AccessToken

class AuthorizeHandler(RequestHandler):
    def get(self):
        self.client_id = self.get_argument("client_id")
        self.write("the client id is %s" % self.client_id)

        response_type = self.get_argument("response_type")	#Required. Must be set to code
        client_id = self.get_argument("client_id")          #Required. The client identifier as assigned by the authorization server, when the client was registered.
        redirect_uri = self.get_argument("redirect_uri")	#Optional. The redirect URI registered by the client.
        #scope	Optional. The possible scope of the request.
        #state  Optional (recommended). Any client state that needs to be passed on to the client request URI.




    def post(self):
        pass

class AccessTokenHandler(RequestHandler):
    """ Provides an access token to the caller.

    the token endpoint MUST use POST.
    http://tools.ietf.org/html/draft-ietf-oauth-v2-30#section-3.2
    """

    def post(self):

        # Checks the grant_type to what authorization path to follow.
        grant_type = self.get_argument("grant_type")


        token_type = "Bearer"   # TODO Get MAC token types working
        expires_in = 300 # seconds (5 minutes)

        if grant_type == "password":
            # Resource Owner Password Credentials
            # http://tools.ietf.org/html/draft-ietf-oauth-v2-30#section-4.3

            username = str(self.get_argument("username"))
            password = str(self.get_argument("password"))
            #scope = self.get_argument("scope")  # Optional

            if self.application.account_manager.authenticate_account(username, password):
                access_token = self.application.tokens.generate_token()

                self.set_status(200)
                self.set_header("Cache-Control", "no-store")
                self.set_header("Pragma", "no-cache")
                self.set_header("Content-type", "application/json")

                response_values = {}

                response_values["access_token"] = access_token
                response_values["token_type"] = token_type
                response_values["expires_in"] = expires_in

                user_id = self.application.account_manager.get_account(username).id
                self.save_token(access_token, token_type, expires_in, user_id)

                self.write(json.dumps(response_values))


        elif grant_type == "code":
            pass

    def save_token(self, token, type, expires, user_id, dev_id=None, refresh_token=None):
        time_stamp = datetime.now()

        self.application.tokens.save_access_token(AccessToken(token, type, expires, user_id, time_stamp,
            dev_id, refresh_token))
