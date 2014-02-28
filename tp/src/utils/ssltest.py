import re
import sys
import gevent
from gevent import ssl, socket, select

class SslConnect():
    """
    Connect to the remote agent, using the openssl
    library backed by Gevent.
    """
    def __init__(self, host, msg):
        self.host = host
        self.msg = msg
        self.port = 9000
        self.connection_count = 0
        self.write_count = 0
        self.retry = 1
        self.error = None
        self.read_data = None
        self.key = "/opt/TopPatch/var/lib/ssl/server/keys/server.key"
        self.cert = "/opt/TopPatch/var/lib/ssl/server/keys/server.cert"
        self.ca = "/opt/TopPatch/var/lib/ssl/server/keys/server.cert"
        self.ssl, self.ssl_socket = self.ssl_init()
        self._connect()

    def ssl_init(self):
        new_ssl_socket =  socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        new_ssl_wrapper = ssl.SSLSocket(new_ssl_socket,
                    keyfile=self.key, certfile=self.cert, ca_certs=self.ca,
                    cert_reqs=ssl.CERT_REQUIRED)
        #new_ssl_wrapper.timeout = 60
        return(new_ssl_socket, new_ssl_wrapper)

    def _connect(self):
        connected = None
        try:
            self.ssl_socket.connect((self.host, self.port))
            connected = True
        except Exception as e:
            if e.errno == 111 and \
                    self.connection_count < 1 or \
                    re.search(r'operation timed out', e.message) and \
                    self.connection_count < 1:
                self.connection_count += 1
                self.ssl, self.ssl_socket = self.ssl_init()
                self._connect()
            else:
                return(self._error_handler(e))
        if connected:
            return self._write()

    def _error_handler(self, e):
        if e.strerror:
            self.error = e.strerror
        else:
            self.error = e.message
        return self.error

    def _write(self):
        a = select.select([self.ssl_socket], [self.ssl_socket], [self.ssl_socket],10)
        print "I can write to the socket if I choose to", a
        try:
            self.ssl_socket.sendall(self.msg)
        except Exception as e:
            if e.message == None and e.errno == 32 and \
                    self.write_count < 1:
                self.write_count += 1
                self._write()
            else:
                self.error = self._error_handler(e)
        return self._read()

    def _read(self):
        a = select.select([self.ssl_socket], [self.ssl_socket], [self.ssl_socket],10)
        print "I can read from the socket if I choose to", a
        try:
            self.read_data = self.ssl_socket.recv(1024)
        except Exception as e:
            self.error = self._error_handler(e)


    def _close(self):
        ssl_socket.shutdown(socket.SHUT_RDWR)
        ssl_socket.close()

