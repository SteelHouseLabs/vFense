
import logging
from pyvisdk.exceptions import InvalidArgumentError

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

def VAppEntityConfigInfo(vim, *args, **kwargs):
    '''This object type describes the behavior of an entity (virtual machine or sub-
    vApp container) in a vApp container.The auto-start/auto-stop configurations
    control the behavior of the start/stop vApp operations.An virtual machine
    entity can be configured to wait for a period of time before starting or to
    wait to receive a successful heartbeat from a virtual machine before starting
    the next virtual machine in the sequence.If startAction and stopAction for an
    entity are both set to none, that entity does not participate in the
    sequence.The start/stop delay and waitingForGuest is not used if the entity is
    a vApp container. For a vApp the only value values for startAction is none or
    powerOn, and the valid values for stopAction is none or powerOff.'''

    obj = vim.client.factory.create('{urn:vim25}VAppEntityConfigInfo')

    # do some validation checking...
    if (len(args) + len(kwargs)) < 0:
        raise IndexError('Expected at least 1 arguments got: %d' % len(args))

    required = [  ]
    optional = [ 'destroyWithParent', 'key', 'startAction', 'startDelay', 'startOrder',
        'stopAction', 'stopDelay', 'tag', 'waitingForGuest', 'dynamicProperty',
        'dynamicType' ]

    for name, arg in zip(required+optional, args):
        setattr(obj, name, arg)

    for name, value in kwargs.items():
        if name in required + optional:
            setattr(obj, name, value)
        else:
            raise InvalidArgumentError("Invalid argument: %s.  Expected one of %s" % (name, ", ".join(required + optional)))

    return obj
