
from pyvisdk.base.managed_object_types import ManagedObjectTypes

from pyvisdk.base.base_entity import BaseEntity

import logging

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

class SmsStorageManager(BaseEntity):
    '''The SmsStorageManager managed object (SMS) provides methods to retrieve
    information about available storage topology, capabilities, and state. SMS
    establishes and maintains connections with VASA providers. SMS retrieves
    information about storage availability from the providers, and clients can use
    the SMS API to perform the following operations.* Identify VASA providers. *
    Retrieve information about storage arrays. * Identify vSphere inventory
    entities (hosts and datastores) which are associated with external storage
    entities on the storage arrays.'''

    def __init__(self, core, name=None, ref=None, type=ManagedObjectTypes.SmsStorageManager):
        super(SmsStorageManager, self).__init__(core, name=name, ref=ref, type=type)

    

    
    
    def QueryArray(self, providerId):
        '''Get the list of storage arrays managed by all the registered VASA providers.
        
        :param providerId: List of uid for the VASA provider objects.
        
        '''
        return self.delegate("QueryArray")(providerId)
    
    def QueryArrayAssociatedWithLun(self, canonicalName):
        '''Get the StorageArray object that is associated with the ScsiLun.
        
        :param canonicalName: of ScsiLun
        
        '''
        return self.delegate("QueryArrayAssociatedWithLun")(canonicalName)
    
    def QueryDatastoreCapability(self, datastore):
        '''Get the capability for the given datastore.
        
        :param datastore: reference to
        
        '''
        return self.delegate("QueryDatastoreCapability")(datastore)
    
    def QueryDrsMigrationCapabilityForPerformance(self, srcDatastore, dstDatastore):
        '''<b>Deprecated.</b> <i>As of SMS API 3.0, use
        QueryDrsMigrationCapabilityForPerformanceEx</i> Query the provider to figure
        out whether Storage DRS should migrate VMDKs between the two given datastores.
        
        :param srcDatastore: Reference to the source
        
        :param dstDatastore: Reference to the destination
        
        '''
        return self.delegate("QueryDrsMigrationCapabilityForPerformance")(srcDatastore, dstDatastore)
    
    def QueryDrsMigrationCapabilityForPerformanceEx(self, datastore):
        '''Query available VASA providers for I/O performance based migration
        recommendations for all pair combinations of the given set of datastores.
        Datastore pairs for which a recommendation cannot be obtained are not included
        in the result.
        
        :param datastore: Array containing references toobjects.
        
        '''
        return self.delegate("QueryDrsMigrationCapabilityForPerformanceEx")(datastore)
    
    def QueryFileSystemAssociatedWithArray(self, arrayId):
        '''Get the StorageFileSystem data objects for the Array.
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryFileSystemAssociatedWithArray")(arrayId)
    
    def QueryHostAssociatedWithLun(self, scsi3Id, arrayId):
        '''Get HostSystem managed entities that share the StorageLun.
        
        :param scsi3Id: uuid for the StorageLun object.
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryHostAssociatedWithLun")(scsi3Id, arrayId)
    
    def QueryLunAssociatedWithArray(self, arrayId):
        '''Get the list of StorageLun data objects that for the Array.
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryLunAssociatedWithArray")(arrayId)
    
    def QueryLunAssociatedWithPort(self, portId, arrayId):
        '''Get the StorageLun data objects that are associated with StoragePort.
        
        :param portId: uuid for the StoragePort object.
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryLunAssociatedWithPort")(portId, arrayId)
    
    def QueryNfsDatastoreAssociatedWithFileSystem(self, fileSystemId, arrayId):
        '''Get NFS datastore managed entity that are associated with StorageFileSystem.
        
        :param fileSystemId: uuid for the StorageFileSystem object
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryNfsDatastoreAssociatedWithFileSystem")(fileSystemId, arrayId)
    
    def QueryPortAssociatedWithArray(self, arrayId):
        '''Get the StoragePort data objects that are associated with Array.
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryPortAssociatedWithArray")(arrayId)
    
    def QueryPortAssociatedWithLun(self, scsi3Id, arrayId):
        '''Get the StoragePort data object that is associated with LUN.
        
        :param scsi3Id: uuid for the StorageLun object.
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryPortAssociatedWithLun")(scsi3Id, arrayId)
    
    def QueryPortAssociatedWithProcessor(self, processorId, arrayId):
        '''Get the StoragePort data objects that are associated with Processor.
        
        :param processorId: uuid for the StorageProcessor object.
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryPortAssociatedWithProcessor")(processorId, arrayId)
    
    def QueryProcessorAssociatedWithArray(self, arrayId):
        '''Get the StorageProcessor data objects that are associated with Array.
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryProcessorAssociatedWithArray")(arrayId)
    
    def QueryProvider(self):
        '''Get the list of Providers that are currently registered with StorageManager.
        
        '''
        return self.delegate("QueryProvider")()
    
    def QueryVmfsDatastoreAssociatedWithLun(self, scsi3Id, arrayId):
        '''Get VMFS Datastore managed entity that are associated with StorageLun.
        
        :param scsi3Id: uuid for the StorageLun object
        
        :param arrayId: uuid for the StorageArray object.
        
        '''
        return self.delegate("QueryVmfsDatastoreAssociatedWithLun")(scsi3Id, arrayId)
    
    def RegisterProvider_Task(self, providerSpec):
        '''Register the provider and issue a sync operation on it.
        
        :param providerSpec: SmsProviderSpec containing parameters needed to register the provider
        
        '''
        return self.delegate("RegisterProvider_Task")(providerSpec)
    
    def UnregisterProvider_Task(self, providerId):
        '''Unregister the provider.
        
        :param providerId: uid for the provider
        
        '''
        return self.delegate("UnregisterProvider_Task")(providerId)