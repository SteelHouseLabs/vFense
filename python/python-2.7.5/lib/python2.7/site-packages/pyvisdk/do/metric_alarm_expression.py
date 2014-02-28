
import logging
from pyvisdk.exceptions import InvalidArgumentError

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

def MetricAlarmExpression(vim, *args, **kwargs):
    '''An alarm expression that uses a metric as the condition that triggers an alarm.
    Base type.There are two alarm operands: yellow and red. At least one of them
    must be set. The value of the alarm expression is determined as follows:'''

    obj = vim.client.factory.create('{urn:vim25}MetricAlarmExpression')

    # do some validation checking...
    if (len(args) + len(kwargs)) < 3:
        raise IndexError('Expected at least 4 arguments got: %d' % len(args))

    required = [ 'metric', 'operator', 'type' ]
    optional = [ 'red', 'redInterval', 'yellow', 'yellowInterval', 'dynamicProperty',
        'dynamicType' ]

    for name, arg in zip(required+optional, args):
        setattr(obj, name, arg)

    for name, value in kwargs.items():
        if name in required + optional:
            setattr(obj, name, value)
        else:
            raise InvalidArgumentError("Invalid argument: %s.  Expected one of %s" % (name, ", ".join(required + optional)))

    return obj
