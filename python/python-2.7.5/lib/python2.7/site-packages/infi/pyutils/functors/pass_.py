from .functor import Functor

class _PASS(Functor):
    def __call__(self, *_, **__):
        pass
    __enter__ = __exit__ = __call__
    def __repr__(self):
        return '<PASS>'
PASS = _PASS()
