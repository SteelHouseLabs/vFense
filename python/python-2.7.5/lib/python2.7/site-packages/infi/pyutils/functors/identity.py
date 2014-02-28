from .functor import Functor

class _Identity(Functor):
    def __call__(self, obj):
        return obj
    def __repr__(self):
        return "<Identity>"
Identity = _Identity()
