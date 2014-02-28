import json

from server.handlers import BaseHandler

from plugins.ra import creator


class RDSession(BaseHandler):

    def post(self, agent_id=None):

        current_user = self.get_current_user()
        #body = json.loads(self.request.body)
        #agent_id = body.get('agent_id')

        results = creator.new_rd_session(
            agent_id=agent_id,
            user=current_user
        )

        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))

    def delete(self, agent_id=None):

        current_user = self.get_current_user()
        #body = json.loads(self.request.body)
        #agent_id = body.get('agent_id')

        results = creator.terminate_rd_session(
            agent_id=agent_id,
            user=current_user
        )

        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(results, indent=4))
