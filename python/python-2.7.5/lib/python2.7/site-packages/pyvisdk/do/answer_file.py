
import logging
from pyvisdk.exceptions import InvalidArgumentError

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

def AnswerFile(vim, *args, **kwargs):
    '''The AnswerFile data object contains host-specific information that a host will
    use in combination with a HostProfile for configuration. Answer files are
    stored on the vCenter Server, along with host profiles. An answer file is
    always associated with a particular host.To supply host-specific data:'''

    obj = vim.client.factory.create('{urn:vim25}AnswerFile')

    # do some validation checking...
    if (len(args) + len(kwargs)) < 2:
        raise IndexError('Expected at least 3 arguments got: %d' % len(args))

    required = [ 'createdTime', 'modifiedTime' ]
    optional = [ 'userInput', 'dynamicProperty', 'dynamicType' ]

    for name, arg in zip(required+optional, args):
        setattr(obj, name, arg)

    for name, value in kwargs.items():
        if name in required + optional:
            setattr(obj, name, value)
        else:
            raise InvalidArgumentError("Invalid argument: %s.  Expected one of %s" % (name, ", ".join(required + optional)))

    return obj
