import json

from server.handlers import BaseHandler
from server.hierarchy.manager import get_current_customer_name

from plugins.ra import ra_settings


class SetPassword(BaseHandler):

    def post(self):

        current_user = self.get_current_user()
        current_customer = get_current_customer_name(current_user)
        body = json.loads(self.request.body)
        password = body.get('password')

        results = ra_settings.save_rd_password(
            password=password,
            user=current_user,
            customer=current_customer
        )

        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))
