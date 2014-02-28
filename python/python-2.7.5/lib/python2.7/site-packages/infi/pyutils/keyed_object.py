class EqualByKey(object):
    def _get_key(self):
        raise NotImplementedError() # pragma: no cover
    def __eq__(self, other):
        return isinstance(other, type(self)) and self._get_key() == other._get_key()
    def __ne__(self, other):
        return not (self == other)
    def __hash__(self):
        raise TypeError("{0} objects not hashable".format(type(self)))

class ComparableByKey(EqualByKey):
    def __gt__(self, other):
        return isinstance(other, type(self))  and self._get_key() > other._get_key()
    def __ge__(self, other):
        return self > other or self == other
    def __lt__(self, other):
        return not (self >= other)
    def __le__(self, other):
        return not (self > other)

class HashableByKey(ComparableByKey):
    def __hash__(self):
        return hash(self._get_key())
