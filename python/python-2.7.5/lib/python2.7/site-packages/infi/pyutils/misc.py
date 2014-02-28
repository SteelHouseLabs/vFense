_NOTHING = object()

def recursive_getattr(obj, attr, default=_NOTHING):
    for subattr in attr.split("."):
        obj = getattr(obj, subattr, _NOTHING)
        if obj is _NOTHING:
            if default is not _NOTHING:
                return default
            raise AttributeError(attr)
    return obj

class Reprify(object):
    def __init__(self, original, str=None, repr=None):
        super(Reprify, self).__init__()
        self._strify__original = original
        if repr is None:
            repr = str
        if str is None:
            str = repr
        self._strify__str = str
        self._strify__repr = repr
    def __getattribute__(self, attr):
        if attr.startswith('_strify__'):
            return super(Reprify, self).__getattribute__(attr)
        return getattr(self._strify__original, attr)
    def __repr__(self):
        if self._strify__repr is not None:
            return self._strify__repr
        return repr(self._strify__original)
    def __str__(self):
        if self._strify__str is not None:
            return self._strify__str
        return str(self._strify__originalx)
