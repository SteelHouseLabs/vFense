import itertools
from .python_compat import (
    basestring,
    itervalues,
    OrderedDict,
    )


class Value(object):
    """
    An Enum value that supports aliases
    """
    def __init__(self, name, aliases = ()):
        super(Value, self).__init__()
        self._name = name
        self._aliases = set(aliases)
    def __repr__(self):
        return self._name.upper()
    def __eq__(self, other):
        if isinstance(other, basestring):
            other = other.lower()
        for possible_name in itertools.chain([self._name], self._aliases):
            if possible_name.lower() == other:
                return True
        return False
    def __ne__(self, other):
        return not (self == other)

class Enum(object):
    """
    An Enum class for python.

    >>> x = Enum("TRUE",Value("FALSE", aliases=["NOT"]))
    >>> x.true
    TRUE
    >>> "TRUE" in x
    True
    >>> x.false
    FALSE
    >>> x.false == "NOT"
    True
    >>> "NOT" in x
    True
    >>> "FALSE" in x
    True
    """
    def __init__(self, *states):
        super(Enum, self).__init__()
        self._states = OrderedDict()
        for state in states:
            if not isinstance(state, Value):
                state = Value(state)
            self._states[state._name.lower()] = state
    def __getattr__(self, attr):
        state = self._states.get(attr, None)
        if state is None:
            raise AttributeError(attr)
        return state
    def __iter__(self):
        return itervalues(self._states)
    def get(self, attr):
        for state in self._states.values():
            if state == attr:
                return state
        raise AttributeError(attr)
