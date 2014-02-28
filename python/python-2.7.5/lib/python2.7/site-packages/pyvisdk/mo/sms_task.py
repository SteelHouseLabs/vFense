
from pyvisdk.base.managed_object_types import ManagedObjectTypes

from pyvisdk.base.base_entity import BaseEntity

import logging

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

class SmsTask(BaseEntity):
    '''A task is used to monitor long running operations.'''

    def __init__(self, core, name=None, ref=None, type=ManagedObjectTypes.SmsTask):
        super(SmsTask, self).__init__(core, name=name, ref=ref, type=type)

    

    
    
    def QuerySmsTaskInfo(self):
        '''Get detailed information about this task.
        
        '''
        return self.delegate("QuerySmsTaskInfo")()
    
    def QuerySmsTaskResult(self):
        '''Get the result of the task.
        
        '''
        return self.delegate("QuerySmsTaskResult")()