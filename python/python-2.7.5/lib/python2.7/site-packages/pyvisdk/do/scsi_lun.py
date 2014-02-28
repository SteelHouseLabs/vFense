
import logging
from pyvisdk.exceptions import InvalidArgumentError

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

def ScsiLun(vim, *args, **kwargs):
    '''The ScsiLun data object describes a SCSI logical unit. A SCSI logical unit is a
    host device that an ESX Server or virtual machine can use for I/O operations.An
    ESX Server creates SCSI logical unit objects to represent devices in the host
    configuration. (See the definition of ScsiLunType for a list of the supported
    device types.) The vSphere API uses one of two object types to represent a SCSI
    logical unit, depending on the device type.When the Server creates a
    HostScsiDisk or ScsiLun object, it specifies a valid device name and type:'''

    obj = vim.client.factory.create('{urn:vim25}ScsiLun')

    # do some validation checking...
    if (len(args) + len(kwargs)) < 5:
        raise IndexError('Expected at least 6 arguments got: %d' % len(args))

    required = [ 'lunType', 'operationalState', 'uuid', 'deviceName', 'deviceType' ]
    optional = [ 'alternateName', 'canonicalName', 'capabilities', 'descriptor', 'displayName',
        'durableName', 'key', 'model', 'queueDepth', 'revision', 'scsiLevel',
        'serialNumber', 'standardInquiry', 'vendor', 'vStorageSupport',
        'dynamicProperty', 'dynamicType' ]

    for name, arg in zip(required+optional, args):
        setattr(obj, name, arg)

    for name, value in kwargs.items():
        if name in required + optional:
            setattr(obj, name, value)
        else:
            raise InvalidArgumentError("Invalid argument: %s.  Expected one of %s" % (name, ", ".join(required + optional)))

    return obj
