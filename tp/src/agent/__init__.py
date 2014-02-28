AgentsCollection = 'agents'
HardwarePerAgentCollection = 'hardware_per_agent'


class AgentKey():
    Id = 'id'
    AgentId = 'agent_id'
    ComputerName = 'computer_name'
    DisplayName = 'display_name'
    HostName = 'host_name'
    OsCode = 'os_code'
    OsString = 'os_string'
    CustomerName = 'customer_name'
    NeedsReboot = 'needs_reboot'
    AgentStatus = 'agent_status'
    BasicStats = 'basic_stats'
    ProductionLevel = 'production_level'
    SystemInfo = 'system_info'
    Hardware = 'hardware'
    Tags = 'tags'
    MachineType = 'machine_type'
    LastAgentUpdate = 'last_agent_update'
    Plugins = 'plugins'
    Core = 'core'
    Rebooted = 'rebooted'


class AgentIndexes():
    CustomerName = 'customer_name'
    OsCode = 'os_code'


class HardwarePerAgentKey():
    Id = 'id'
    AgentId = 'agent_id'
    Name = 'name'
    Type = 'type'
    Nic = 'nic'
    Mac = 'mac'
    IpAddress = 'ip_address'
    CreatedBy = 'created_by'
    AddedBy = 'added_by'
    SpeedMhz = 'speed_mhz'
    BitType = 'bit_type'
    CpuId = 'cpu_id'
    CacheKb = 'cache_kb'
    Cores = 'cores'
    FileSystem = 'file_system'
    SizeKb = 'size_kb'
    FreeSizeKb = 'free_size_kb'
    Core = 'core'
    TotalMemory = 'total_memory'
    RamKb = 'ram_kb'


class HardwarePerAgentIndexes():
    AgentId = 'agent_id'
    Type = 'type'
