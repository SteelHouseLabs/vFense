
from pyvisdk.base.managed_object_types import ManagedObjectTypes

from pyvisdk.base.base_entity import BaseEntity

import logging

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

class SmsServiceInstance(BaseEntity):
    '''Service interface for the Storage Monitoring Service.'''

    def __init__(self, core, name=None, ref=None, type=ManagedObjectTypes.SmsServiceInstance):
        super(SmsServiceInstance, self).__init__(core, name=name, ref=ref, type=type)

    

    
    
    def ConfigureSyncInterval(self, interval):
        '''Sets the frequency with which the service cache is automatically synced with
        provider information. The interval is specified in seconds with a minimum value
        of 300 (5 minutes). NOTE: In certain concurrent invocation scenarios, it is
        possible that the sync timer will not be scheduled with the latest configured
        value until one further sync cycle has completed.
        
        :param interval: sync interval in seconds (>= 300).
        
        '''
        return self.delegate("ConfigureSyncInterval")(interval)
    
    def QueryAboutInfo(self):
        '''Retrieves information about the service.
        
        '''
        return self.delegate("QueryAboutInfo")()
    
    def QueryList(self, contextEntity, queryEntityType, querySpec):
        '''Returns a result set (an instance of the QueryResult data object) containing <a
        href="result-entities.html">properties</a> of all entity instances of the
        specified entity type. If the optional contextEntity parameter is supplied, the
        result set is limited to those entities related to the specified entity. See
        this <a href="result-contextEntity_relationships.html">matrix for lists of
        possible relationships.</a> You can apply additional constraints to the results
        by using the QuerySpec input parameter.
        
        :param contextEntity: Limits result set from the query to storage attributes associated with the specified entity.
        
        :param queryEntityType: Type of entities to query.
        
        :param querySpec: Additional constraints (range, filtering, sorting, and so on) to be applied on the result set.
        
        '''
        return self.delegate("QueryList")(contextEntity, queryEntityType, querySpec)
    
    def QueryStorageManager(self):
        '''Retrieves Storage Manager managed object.
        
        '''
        return self.delegate("QueryStorageManager")()
    
    def QueryTopology(self, entity):
        '''<b>Deprecated.</b> <i>As of SMS API 2.0, use sms.ServiceInstance.queryList API
        to obtain storage topology information.</i> Returns the entities that are
        related to the given entity as a list of nodes and edges, which can be used to
        construct a topological map of the relationships. Entities supported by this
        operation: datacenter, cluster, host, datastore and vm.
        
        :param entity: entity for which topology map is required.
        
        '''
        return self.delegate("QueryTopology")(entity)
    
    def Sync(self):
        '''Synchronizes the service cache from provider information (like the
        VirtualCenter database provider).
        
        '''
        return self.delegate("Sync")()
    
    def UpdateVcDbConnectionInfo(self, dbConnectionSpec):
        '''Updates the connection information for the VirtualCenter database. The
        credentials and connection url can be explicitly specified using a
        DbConnectionSpec argument. Alternately, a null argument may be passed to force
        the service to refresh the connection information from the local registry.
        NOTE: The operation re-initializes the service after configuring the database
        information. This is akin to the service being restarted.
        
        :param dbConnectionSpec: database connection information.
        
        '''
        return self.delegate("UpdateVcDbConnectionInfo")(dbConnectionSpec)