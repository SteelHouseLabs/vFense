TagsCollection = 'tags'
TagsPerAgentCollection = 'tag_per_agent'



class TagsKey():
    TagId = 'tag_id'
    TagName = 'tag_name'
    CustomerName = 'customer_name'
    ProductionLevel = 'production_level'

class TagsPerAgentKey():
    Id = 'id'
    TagId = 'tag_id'
    TagName = 'tag_name'
    AgentId = 'agent_id'
    CustomerName = 'customer_name'

class TagsIndexes():
    CustomerName = 'customer_name'
    TagNameAndCustomer = 'by_tagname_and_customer'

class TagsPerAgentIndexes():
    AgentId = 'agent_id'
    TagId = 'tag_id'
    CustomerName = 'customer_name'
    AgentIdAndTagId = 'agent_id_and_tag_id'
