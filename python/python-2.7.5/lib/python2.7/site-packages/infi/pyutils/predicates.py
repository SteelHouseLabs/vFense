import operator
import functools
from .functors.functor import Functor
from .functors.always import Always
from .python_compat import iteritems

class Predicate(Functor):
    def __init__(self, func=None):
        super(Predicate, self).__init__()
        self._func = func
    def __call__(self, *args, **kwargs):
        return self._func(*args, **kwargs)
    def __repr__(self):
        return "<Predicate {0!r}>".format(self._func or "?")

AlwaysTrue = Predicate(Always(True))
AlwaysFalse = Predicate(Always(False))

class Aggregate(Predicate):
    def __init__(self, *preds):
        super(Aggregate, self).__init__()
        self._preds = preds
    def __call__(self, *args, **kwargs):
        return self._aggregate(p(*args, **kwargs) for p in self._preds)
    def __repr__(self):
        return "{0}({1})".format(type(self).__name__, ", ".join(map(repr, self._preds)))

class And(Aggregate):
    _aggregate = all
class Or(Aggregate):
    _aggregate = any

class Not(Predicate):
    def __init__(self, pred):
        super(Not, self).__init__()
        self._pred = pred
    def __call__(self, *args, **kwargs):
        return not self._pred(*args, **kwargs)
    def __repr__(self):
        return "<not {0!r}>".format(self._pred)

class Identity(Predicate):
    def __init__(self, obj):
        super(Identity, self).__init__(functools.partial(operator.is_, obj))
        self._obj = obj
    def __repr__(self):
        return "<is {0!r}>".format(self._obj)

class Equality(Predicate):
    def __init__(self, obj):
        super(Equality, self).__init__(functools.partial(operator.eq, obj))
        self._obj = obj
    def __repr__(self):
        return "< == {0!r}>".format(self._obj)

class _MISSING(object):
    pass

class ObjectAttributes(Predicate):
    def __init__(self, **attributes):
        super(ObjectAttributes, self).__init__()
        self._attributes = attributes
    def __call__(self, obj):
        return all(getattr(obj, attr, _MISSING) == value for attr, value in iteritems(self._attributes))
    def __repr__(self):
        return "<{0}>".format(
            ", ".join(
                ".{0}=={1!r}".format(attr, value) for attr, value in iteritems(self._attributes)
                )
            )

class DictionaryItems(Predicate):
    def __init__(self, **items):
        super(DictionaryItems, self).__init__()
        self._items = items
    def __call__(self, obj):
        for (attr, value) in iteritems(self._items):
            try:
                if obj[attr] != value:
                    return False
            except LookupError:
                return False
        return True
    def __repr__(self):
        return "<{0}>".format(
            ", ".join(
                '[{0!r}]=={1!r}'.format(key, value) for key, value in iteritems(self._items)
                )
            )
