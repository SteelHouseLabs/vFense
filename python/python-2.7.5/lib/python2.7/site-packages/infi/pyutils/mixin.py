"""
===============
Mixin utilities
===============

The concept here is to add functionality by inheritence in *runtime* (vs. when coding).

For example, let's say you have a ``HttpRequest`` object. Now let's say that you have some additional functionality
such as authentication/authorization that exists only if some HTTP headers exist in *this* request. One way to do it is
to create an ``UserAuthHttpRequest`` class that extends the ``HttpRequest`` with the new functionality. But here's the
catch - you only know that this functionality can be added *after* you created the object. Even if you could deduce it
beforehand, there are still scenarios where there are several different functionality "modules" you may want to add and
writing the entire matrix beforehand is pretty annoying, not to mention that testing all these combinations is
exhausting.

Enter mixins. Mixins are classes that add functionality to an existing class. A mixin relies on the existance of methods
or attributes on the object, and may use them to add more functionality. So in our case, we'll want to have a
``UserAuth`` mixin that assumes that there's *self.get_header(name)* method::

class HttpRequest(object):
    def get_header(self, name):
        ...
class UserAuth(object):
    def is_authenticated(self):
        auth_header = self.get_header("Authorization")
        ...

Now, to add the mixin to the object we'll do::

request = HttpRequest(...)

# Find out that there's a need for authentication
...

install_mixin(request, UserAuth)
"""
from .lazy import cached_function

__all__ = [ "install_mixin", "install_mixin_if" ]

def install_mixin_if(obj, mixin, condition):
    """
    Same as install_mixin, but installs the mixin only if *condition* evaluates to truth.
    """
    if not condition:
        return
    install_mixin(obj, mixin)

def install_mixin(obj, mixin):
    obj.__class__ = _replace_class(type(obj), mixin)

@cached_function
def _replace_class(cls, mixin):
    if hasattr(cls, '__mixins__'):
        # This is already a shadow class.
        if mixin in cls.__mixins__:
            # We already added this mixin.
            return cls
        real_cls = cls.__real_class__
        mixins = [ mixin ] + cls.__mixins__
    else:
        real_cls = cls
        mixins = [ mixin ]
        
    name = "%s[%s]" % (real_cls.__name__, ", ".join([ m.__name__  for m in mixins ]))
    bases = mixins + [ real_cls ]
    result_cls = type(name, tuple(bases), dict(__real_class__=real_cls, __mixins__=mixins))
    result_cls.__module__ = real_cls.__module__
    return result_cls
