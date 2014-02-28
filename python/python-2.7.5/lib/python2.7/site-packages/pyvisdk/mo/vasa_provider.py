
from pyvisdk.base.managed_object_types import ManagedObjectTypes

from pyvisdk.mo.sms_provider import SmsProvider

import logging

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

class VasaProvider(SmsProvider):
    '''VASA(vStorage APIs for Storage Awareness) provider definition.'''

    def __init__(self, core, name=None, ref=None, type=ManagedObjectTypes.VasaProvider):
        super(VasaProvider, self).__init__(core, name=name, ref=ref, type=type)

    

    
    
    def VasaProviderSync_Task(self, arrayId):
        '''Issue a sync for the given Storage Array.
        
        :param arrayId: 
        
        '''
        return self.delegate("VasaProviderSync_Task")(arrayId)