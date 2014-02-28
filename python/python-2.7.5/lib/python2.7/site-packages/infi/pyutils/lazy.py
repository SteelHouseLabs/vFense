# Adapted from http://wiki.python.org/moin/PythonDecoratorLibrary#Cached_Properties
import itertools
from .decorators import wraps
from .python_compat import iteritems
from logging import getLogger
from types import MethodType, FunctionType

logger = getLogger(__name__)

class cached_property(object):
    """Decorator for read-only properties evaluated only once.

    It can be used to created a cached property like this::

        import random

        # the class containing the property must be a new-style class
        class MyClass(object):
            # create property whose value is cached for ten minutes
            @cached_method
            def randint(self):
                # will only be evaluated every 10 min. at maximum.
                return random.randint(0, 100)

    The value is cached  in the '_cache' attribute of the object inst that
    has the property getter method wrapped by this decorator. The '_cache'
    attribute value is a dictionary which has a key for every property of the
    object which is wrapped by this decorator. Each entry in the cache is
    created only when the property is accessed for the first time and is a
    two-element tuple with the last computed property value and the last time
    it was updated in seconds since the epoch.

    To expire a cached property value manually just do::

        del inst._cache[<property name>]
    """
    def __init__(self, fget, doc=None):
        super(cached_property, self).__init__()
        self.fget = fget
        self.__doc__ = doc or fget.__doc__
        self.__name__ = fget.__name__
        self.__module__ = fget.__module__

    def __get__(self, inst, owner):
        try:
            value = inst._cache[self.__name__]
        except (KeyError, AttributeError):
            value = self.fget(inst)
            try:
                cache = inst._cache
            except AttributeError:
                cache = inst._cache = {}
            cache[self.__name__] = value
        return value

_cached_method_id_allocator = itertools.count()

def _get_instancemethod_cache_entry(method_id, *args, **kwargs):
    if len(args) + len(kwargs) == 0:
        return method_id
    try:
        kwargs_keys = list(kwargs.keys())
        kwargs_keys.sort()
        key = (method_id,) + args + tuple([kwargs[key] for key in kwargs_keys])
        _ = {key: None}
        return key
    except TypeError:
        return None

def cached_method(func):
    """Decorator that caches a method's return value each time it is called.
    If called later with the same arguments, the cached value is returned, and
    not re-evaluated.
    """
    method_id = next(_cached_method_id_allocator)
    @wraps(func)
    def callee(inst, *args, **kwargs):
        key = _get_instancemethod_cache_entry(method_id, *args, **kwargs)
        if key is None:
            logger.debug("Passed arguments to {0} are mutable, so the returned value will not be cached".format(func.__name__))
            return func(inst, *args, **kwargs)
        try:
            value = inst._cache[key]
        except (KeyError, AttributeError):
            value = func(inst, *args, **kwargs)
            try:
                inst._cache[key] = value
            except AttributeError:
                inst._cache = {}
                inst._cache[key] = value
        return value

    callee.__cached_method__ = True
    callee.__method_id__ = method_id
    return callee

def _get_function_cache_entry(args, kwargs):
    return (tuple(args), frozenset(iteritems(kwargs)))

def cached_function(func):
    """Decorator that caches a function's return value each time it is called.
    If called later with the same arguments, the cached value is returned, and
    not re-evaluated.
    """
    @wraps(func)
    def callee(*args, **kwargs):
        key = _get_function_cache_entry(args, kwargs)
        try:
            value = func._cache[key]
        except (KeyError, AttributeError):
            value = func(*args, **kwargs)
            if not hasattr(func, '_cache'):
                setattr(func, '_cache', {})
            func._cache[key] = value
        return value

    callee._cache = func._cache = dict()
    callee.__cached_method__ = True
    return callee

def clear_cache(self):
    if hasattr(self, '_cache'):
        getattr(self, '_cache').clear()

def clear_cached_entry(self, *args, **kwargs):
    if isinstance(self, MethodType) and getattr(self, '__cached_method__', False):
        method = self
        self = getattr(method, 'im_self', getattr(method, '__self__', None))
        if self is None:
            return
        key = _get_instancemethod_cache_entry(method.__method_id__, *args, **kwargs)
    elif isinstance(self, FunctionType) and getattr(self, '__cached_method__', False):
        key = _get_function_cache_entry(args, kwargs)
    else:
        return
    _ = getattr(self, '_cache', {}).pop(key, None)

def populate_cache(self, attributes_to_skip=[]):
    """this method attempts to get all the lazy cached properties and methods
    There are two special cases:

    - Some attributes may not be available and raises exceptions.
      If you wish to skip these, pass them in the attributes_to_skip list
    - The calling of cached methods is done without any arguments, and catches TypeError exceptions
      for the case a cached method requires arguments. The exception is logged."""
    from inspect import getmembers
    for key, value in getmembers(self):
        if key in attributes_to_skip:
            continue
        if hasattr(value, "__cached_method__"):
            logger.debug("getting attribute %s from %s", repr(key), repr(self))
            try:
                _ = value()
            except TypeError as e:
                logger.exception(e)

class LazyImmutableDict(object):
    """ Use this object when you have a list of keys but fetching the values is expensive,
    and you want to do it in a lazy fasion"""
    def __init__(self, dict):
        self._dict = dict

    def __getitem__(self, key):
        value = self._dict[key]
        if value is None:
            value = self._dict[key] = self._create_value(key)
        return value

    def keys(self):
        return self._dict.keys()

    def __contains__(self, key):
        return self._dict.__contains__(key)

    def has_key(self, key):
        return self._dict.has_key(key)

    def __len__(self):
        return len(self._dict)

    def _create_value(self, key):
        raise NotImplementedError()
