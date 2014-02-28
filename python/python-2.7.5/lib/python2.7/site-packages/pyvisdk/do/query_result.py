
import logging
from pyvisdk.exceptions import InvalidArgumentError

########################################
# Automatically generated, do not edit.
########################################

log = logging.getLogger(__name__)

def QueryResult(vim, *args, **kwargs):
    '''Comprises the result set of a specific QueryList operation. This data object
    contains metadata and row data. The Metadata object contains information about
    the number of rows in the result set and the column names in the result set.
    Use the propertyName strings to deocde the RowData objects in the result set.
    See for more information and for tables of entity and relationship properties.'''

    obj = vim.client.factory.create('{urn:sms}QueryResult')

    # do some validation checking...
    if (len(args) + len(kwargs)) < 1:
        raise IndexError('Expected at least 2 arguments got: %d' % len(args))

    required = [ 'metadata' ]
    optional = [ 'row', 'dynamicProperty', 'dynamicType' ]

    for name, arg in zip(required+optional, args):
        setattr(obj, name, arg)

    for name, value in kwargs.items():
        if name in required + optional:
            setattr(obj, name, value)
        else:
            raise InvalidArgumentError("Invalid argument: %s.  Expected one of %s" % (name, ", ".join(required + optional)))

    return obj
