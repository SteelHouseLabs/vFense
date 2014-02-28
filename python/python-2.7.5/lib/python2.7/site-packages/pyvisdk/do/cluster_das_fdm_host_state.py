
import logging
from pyvisdk.exceptions import InvalidArgumentError

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

def ClusterDasFdmHostState(vim, *args, **kwargs):
    '''The ClusterDasFdmHostState data object describes the availability state of each
    active host in a vSphere HA enabled cluster.In a vSphere HA cluster, the active
    hosts form a fault domain. A host is inactive if it is in standby or
    maintenance mode, or it has been disconnected from vCenter Server. A vSphere HA
    agent, called the Fault Domain Manager (FDM), runs on each host in the fault
    domain.One FDM serves as the master and the remaining FDMs as its slaves. The
    master is responsible for monitoring the availability of the hosts and VMs in
    the cluster, and restarting any VMs that fail due to a host failure or non-
    user-initiated power offs. The master is also responsible for reporting fault-
    domain state to vCenter Server.The master FDM is determined through election by
    the FDMs that are alive at the time. An election occurs in the following
    circumstances:The slaves are responsible for reporting state updates to the
    master and restarting VMs as required. All FDMs provide the VM/Application
    Health Monitoring Service.'''

    obj = vim.client.factory.create('{urn:vim25}ClusterDasFdmHostState')

    # do some validation checking...
    if (len(args) + len(kwargs)) < 1:
        raise IndexError('Expected at least 2 arguments got: %d' % len(args))

    required = [ 'state' ]
    optional = [ 'stateReporter', 'dynamicProperty', 'dynamicType' ]

    for name, arg in zip(required+optional, args):
        setattr(obj, name, arg)

    for name, value in kwargs.items():
        if name in required + optional:
            setattr(obj, name, value)
        else:
            raise InvalidArgumentError("Invalid argument: %s.  Expected one of %s" % (name, ", ".join(required + optional)))

    return obj
