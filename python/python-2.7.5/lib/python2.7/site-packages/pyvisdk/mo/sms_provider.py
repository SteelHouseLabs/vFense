
from pyvisdk.base.managed_object_types import ManagedObjectTypes

from pyvisdk.base.base_entity import BaseEntity

import logging

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

class SmsProvider(BaseEntity):
    '''Provider interface for Storage Monitoring Service (SMS).'''

    def __init__(self, core, name=None, ref=None, type=ManagedObjectTypes.SmsProvider):
        super(SmsProvider, self).__init__(core, name=name, ref=ref, type=type)

    

    
    
    def QueryProviderInfo(self):
        '''Get provider information.
        
        '''
        return self.delegate("QueryProviderInfo")()