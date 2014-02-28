import functools
from .functors import Identity
from .python_compat import get_underlying_function
from .python_compat import create_bound_method
import platform

class MethodMap(object):
    def __init__(self, decorator=Identity):
        super(MethodMap, self).__init__()
        self._map = {}
        self._decorate = decorator
    def registering(self, key):
        return functools.partial(self.register, key)
    def register(self, key, value):
        self._map[key] = self._decorate(value)
        return value
    def __get__(self, instance, owner):
        return Binder(self._map, instance)

_NOTHING = object()

class Binder(object):
    def __init__(self, map, instance):
        super(Binder, self).__init__()
        self._map = map
        self._instance = instance
    def get(self, key, default=None):
        if key not in self._map:
            return default
        function = self._map[key]
        if isinstance(function, staticmethod):
            return get_underlying_function(function)
        if isinstance(function, classmethod):
            returned_self = self._instance
            function = get_underlying_function(function)
        else:
            returned_self = self._instance.__class__
        return create_bound_method(
            function,
            returned_self,
            )
        return self._map[key]
    def __getitem__(self, key):
        returned = self.get(key, _NOTHING)
        if returned is _NOTHING:
            raise LookupError(key)
        return returned

