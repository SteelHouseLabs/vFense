
import logging
from pyvisdk.exceptions import InvalidArgumentError

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

def VasaProviderInfo(vim, *args, **kwargs):
    '''Information about VASA(vStorage APIs for Storage Awareness) providers.'''

    obj = vim.client.factory.create('{urn:sms}VasaProviderInfo')

    # do some validation checking...
    if (len(args) + len(kwargs)) < 3:
        raise IndexError('Expected at least 4 arguments got: %d' % len(args))

    required = [ 'url', 'name', 'uid' ]
    optional = [ 'certificate', 'lastSyncTime', 'namespace', 'status', 'supportedProfile',
        'supportedVendorModelMapping', 'vasaVersion', 'description', 'version',
        'dynamicProperty', 'dynamicType' ]

    for name, arg in zip(required+optional, args):
        setattr(obj, name, arg)

    for name, value in kwargs.items():
        if name in required + optional:
            setattr(obj, name, value)
        else:
            raise InvalidArgumentError("Invalid argument: %s.  Expected one of %s" % (name, ", ".join(required + optional)))

    return obj
