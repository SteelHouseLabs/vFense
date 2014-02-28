import json

import tornado.httpserver
import tornado.web
import tornado.websocket
import tornado.ioloop
import tornado.gen

import tornadoredis

from plugins import ra
from plugins.ra import creator


class RDStatusQueue(tornado.websocket.WebSocketHandler):

    def __init__(self, *args, **kwargs):

        super(RDStatusQueue, self).__init__(*args, **kwargs)

        self.agent_id = self.get_argument('agent_id', None)

        if self.agent_id:

            self.channel = ra.get_feedback_channel(self.agent_id)
            self._listen()

        else:

            result = {
                'pass': False,
                'message': "No agent ID provided."

            }

            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(result, indent=4))

    @tornado.gen.engine
    def _listen(self):

        self.client = tornadoredis.Client()
        self.client.connect()
        yield tornado.gen.Task(self.client.subscribe, self.channel)
        self.client.listen(self.on_message)

    def open(self):
        pass

    def on_message(self, message):

        if message.kind == 'message':
            self.write_message(str(message.body))

        if message.kind == 'disconnect':

            self.close()

    def on_close(self):

        creator.terminate_rd_session(self.agent_id)

        if self.client.subscribed:
            self.client.unsubscribe(self.channel)
            self.client.disconnect()
