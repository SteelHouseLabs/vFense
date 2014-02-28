
import logging
from pyvisdk.exceptions import InvalidArgumentError

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

def StorageLun(vim, *args, **kwargs):
    '''This data object represents the storage lun.'''

    obj = vim.client.factory.create('{urn:sms}StorageLun')

    # do some validation checking...
    if (len(args) + len(kwargs)) < 8:
        raise IndexError('Expected at least 9 arguments got: %d' % len(args))

    required = [ 'capacityInMB', 'drsManagementPermitted', 'lunThinProvisioned',
        'thinProvisioningStatus', 'usedSpaceInMB', 'uuid', 'vendorDisplayName',
        'vSphereLunIdentifier' ]
    optional = [ 'alternateIdentifier', 'dynamicProperty', 'dynamicType' ]

    for name, arg in zip(required+optional, args):
        setattr(obj, name, arg)

    for name, value in kwargs.items():
        if name in required + optional:
            setattr(obj, name, value)
        else:
            raise InvalidArgumentError("Invalid argument: %s.  Expected one of %s" % (name, ", ".join(required + optional)))

    return obj
