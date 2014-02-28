import socket, ssl, pprint

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# require a certificate from the server
ssl_sock = ssl.wrap_socket(s, keyfile="/opt/TopPatch/var/lib/ssl/server/keys/server.key",
                           certfile="/opt/TopPatch/var/lib/ssl/server/keys/server.cert",
                           ca_certs="/opt/TopPatch/var/lib/ssl/server/keys/server.cert",
                           cert_reqs=ssl.CERT_REQUIRED, ssl_version=ssl.PROTOCOL_SSLv23
                           )
#ssl_sock.connect(('10.0.0.18', 9000))
ssl_sock.connect(('10.0.0.7', 8002))

pprint.pprint(ssl_sock.getpeercert())
# note that closing the SSLSocket will also close the underlying socket
ssl_sock.close()
