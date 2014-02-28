from server.hierarchy import _db


def init():
    _db.initialization(conn=None)
