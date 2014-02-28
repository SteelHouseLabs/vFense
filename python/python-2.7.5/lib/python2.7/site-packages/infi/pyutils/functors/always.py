from .functor import Functor

class Always(Functor):
    def __init__(self, value):
        super(Always, self).__init__()
        self._value = value
    def __call__(self, *args, **kwargs):
        return self._value
    def __repr__(self):
        return "<Always {0!r}>".format(self._value)

