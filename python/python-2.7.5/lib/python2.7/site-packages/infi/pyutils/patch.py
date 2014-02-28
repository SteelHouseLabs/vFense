
_PATCHED_NAME_PREFIX = "_infi_patched_"

def monkey_patch(module, name, replacement):
    original_name = _PATCHED_NAME_PREFIX + name
    if getattr(module, original_name, None) is None:
        setattr(module, original_name, getattr(module, name))
        setattr(module, name, replacement)
        
def unmonkey_patch(module, name):
    original_name = _PATCHED_NAME_PREFIX + name
    if getattr(module, original_name, None) is not None:
        setattr(module, name, getattr(module, original_name))
        setattr(module, original_name, None)

class patch(object):
    """ context manager for patching """
    def __init__(self, module, name, replacement):
        self._module = module
        self._name = name
        self._replacement = replacement
        
    def __enter__(self):
        monkey_patch(self._module, self._name, self._replacement)
        
    def __exit__ (self, exc_type, exc_value, exc_tb):
        unmonkey_patch(self._module, self._name)