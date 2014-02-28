import logging
import logging.config
from utils.common import *
from operations.operation_manager import Operation
from receiver.rqueuemanager import QueueWorker
from operations import *
from agent import *
from plugins.patching.rv_db_calls import *
from plugins.patching import *
from plugins.mightymouse.mouse_db import get_mouse_addresses
from tagging.tagManager import *

logging.config.fileConfig('/opt/TopPatch/conf/logging.config')
logger = logging.getLogger('rvapi')


class StoreOperation(object):
    def __init__(self, username, customer_name, uri, method):
        self.customer_name = customer_name
        self.username = username
        self.uri = uri
        self.method = method

    def _store_in_agent_queue(self, operation):
        rqueue = QueueWorker(operation, self.username)
        rqueue.rpush_object_in_queue(message=operation)

    def generic_operation(self, oper_type, oper_plugin,
                          agentids=None, tag_id=None):

        operation = (
            Operation(
                self.username, self.customer_name,
                self.uri, self.method
            )
        )

        results = (
            operation.create_operation(
                oper_type, oper_plugin, agentids,
                tag_id
            )
        )

        operation_id = results['data'].get('operation_id', None)
        if operation_id:
            for agent_id in agentids:
                operation_data = {
                    OperationKey.Operation: oper_type,
                    OperationKey.OperationId: operation_id,
                    OperationKey.Plugin: oper_plugin,
                    OperationPerAgentKey.AgentId: agent_id,
                }
                self._store_in_agent_queue(operation_data)
                operation.add_agent_to_operation(agent_id, operation_id)

        return(results)

    def reboot(self, agentids=None, tag_id=None):
        if tag_id:
            if not agentids:
                agentids = get_agent_ids_from_tag(tag_id)
            elif agentids:
                agentids += get_agent_ids_from_tag(tag_id)

        results = (
            self.generic_operation(REBOOT, CORE_PLUGIN, agentids, tag_id)
        )

        return(results)

    def shutdown(self, agentids=None, tag_id=None):
        if tag_id:
            if not agentids:
                agentids = get_agent_ids_from_tag(tag_id)
            elif agentids:
                agentids += get_agent_ids_from_tag(tag_id)

        results = (
            self.generic_operation(SHUTDOWN, CORE_PLUGIN, agentids, tag_id)
        )

        return(results)

    def apps_refresh(self, agentids=None, tag_id=None):
        if tag_id:
            if not agentids:
                agentids = get_agent_ids_from_tag(tag_id)
            elif agentids:
                agentids += get_agent_ids_from_tag(tag_id)

        results = (
            self.generic_operation(UPDATES_APPLICATIONS, RV_PLUGIN, agentids, tag_id)
        )

        return(results)

    def uninstall_agent(self, agent_id):
        operation_data = {
            OperationKey.Operation: UNINSTALL_AGENT,
            OperationKey.Plugin: RV_PLUGIN,
            OperationPerAgentKey.AgentId: agent_id,
        }
        self._store_in_agent_queue(operation_data)

    def install_os_apps(self, appids, cpu_throttle='normal',
                        net_throttle=0, restart=None,
                        agentids=None, tag_id=None):

        oper_type = INSTALL_OS_APPS
        oper_plugin = RV_PLUGIN

        return(
            self.install_apps(
                oper_type, oper_plugin, appids,
                cpu_throttle, net_throttle,
                restart, agentids, tag_id
            )
        )

    def install_custom_apps(self, appids, cpu_throttle='normal',
                            net_throttle=0, restart=None,
                            agentids=None, tag_id=None):

        oper_type = INSTALL_CUSTOM_APPS
        oper_plugin = RV_PLUGIN

        return(
            self.install_apps(
                oper_type, oper_plugin, appids,
                cpu_throttle, net_throttle,
                restart, agentids, tag_id
            )
        )


    def install_supported_apps(self, appids, cpu_throttle='normal',
                               net_throttle=0, restart=None,
                               agentids=None, tag_id=None):

        oper_type = INSTALL_SUPPORTED_APPS
        oper_plugin = RV_PLUGIN

        return(
            self.install_apps(
                oper_type, oper_plugin, appids,
                cpu_throttle, net_throttle,
                restart, agentids, tag_id
            )
        )

    def install_agent_apps(self, appids, cpu_throttle='normal',
                            net_throttle=0, restart=None,
                            agentids=None, tag_id=None):

        oper_type = INSTALL_AGENT_APPS
        oper_plugin = RV_PLUGIN

        return(
            self.install_apps(
                oper_type, oper_plugin, appids,
                cpu_throttle, net_throttle,
                restart, agentids, tag_id
            )
        )


    def uninstall_apps(self, appids, cpu_throttle='normal',
                       net_throttle=0, restart=None,
                       agentids=None, tag_id=None):

        oper_type = UNINSTALL
        oper_plugin = RV_PLUGIN

        return(
            self.install_apps(
                oper_type, oper_plugin, appids,
                cpu_throttle, net_throttle,
                restart, agentids, tag_id
            )
        )


    def install_apps(self, oper_type, oper_plugin,
                     appids, cpu_throttle='normal',
                     net_throttle=0, restart=None,
                     agentids=None, tag_id=None):

        if oper_type == INSTALL_OS_APPS or oper_type == UNINSTALL:
            CurrentAppsCollection = AppsCollection
            CurrentAppsKey = AppsKey
            CurrentAppsPerAgentCollection = AppsPerAgentCollection
            CurrentAppsPerAgentKey = AppsPerAgentKey

        elif oper_type == INSTALL_CUSTOM_APPS:
            CurrentAppsCollection = CustomAppsCollection
            CurrentAppsKey = CustomAppsKey
            CurrentAppsPerAgentCollection = CustomAppsPerAgentCollection
            CurrentAppsPerAgentKey = CustomAppsPerAgentKey

        elif oper_type == INSTALL_SUPPORTED_APPS:
            CurrentAppsCollection = SupportedAppsCollection
            CurrentAppsKey = SupportedAppsKey
            CurrentAppsPerAgentCollection = SupportedAppsPerAgentCollection
            CurrentAppsPerAgentKey = SupportedAppsPerAgentKey

        elif oper_type == INSTALL_AGENT_APPS:
            CurrentAppsCollection = AgentAppsCollection
            CurrentAppsKey = AgentAppsKey
            CurrentAppsPerAgentCollection = AgentAppsPerAgentCollection
            CurrentAppsPerAgentKey = AgentAppsPerAgentKey

        if tag_id:
            if not agentids:
                agentids = get_agent_ids_from_tag(tag_id)
            else:
                agentids += get_agent_ids_from_tag(tag_id)

        operation = (
            Operation(
                self.username, self.customer_name,
                self.uri, self.method
            )
        )

        results = (
            operation.create_operation(
                oper_type, oper_plugin, agentids,
                tag_id, cpu_throttle,
                net_throttle, restart
            )
        )
        operation_id = results['data'].get('operation_id', None)
        if operation_id:
            for agent_id in agentids:
                valid_appids = (
                    self._return_valid_app_ids_for_agent(
                        agent_id, appids, table=CurrentAppsPerAgentCollection
                    )
                )

                pkg_data = []
                for app_id in valid_appids:
                    data_to_update = (
                        {
                            CurrentAppsPerAgentKey.Status: PENDING
                        }
                    )
                    if oper_type == INSTALL_OS_APPS or oper_type == UNINSTALL:
                        update_os_app_per_agent(agent_id, app_id, data_to_update)

                    elif oper_type == INSTALL_CUSTOM_APPS:
                        update_custom_app_per_agent(agent_id, app_id, data_to_update)

                    elif oper_type == INSTALL_SUPPORTED_APPS:
                        update_supported_app_per_agent(agent_id, app_id, data_to_update)

                    elif oper_type == INSTALL_AGENT_APPS:
                        update_agent_app_per_agent(agent_id, app_id, data_to_update)

                    pkg_data.append(
                        self._get_apps_data(
                            app_id, agent_id, oper_type,
                            CurrentAppsCollection,
                            CurrentAppsKey.AppId
                        )
                    )

                operation_data = {
                    OperationKey.Operation: oper_type,
                    OperationKey.OperationId: operation_id,
                    OperationKey.Plugin: oper_plugin,
                    OperationKey.Restart: restart,
                    PKG_FILEDATA: pkg_data,
                    OperationPerAgentKey.AgentId: agent_id,
                    OperationKey.CpuThrottle: cpu_throttle,
                    OperationKey.NetThrottle: net_throttle,
                }
                self._store_in_agent_queue(operation_data)
                operation.add_agent_to_install_operation(agent_id, operation_id, pkg_data)

        return(results)

    def _get_apps_data(self, app_id, agent_id, oper_type,
                       table=AppsCollection, app_key=AppsKey.AppId):

        if oper_type == INSTALL_OS_APPS:
            pkg = (
                get_app_data(
                    app_id, table, app_key,
                    fields_to_pluck=[AppsKey.Name]
                )
            )
            pkg[PKG_FILEDATA] = get_file_data(app_id, agent_id)

            if pkg:
                uris = (
                    get_download_urls(
                        self.customer_name, app_id, pkg[PKG_FILEDATA]
                    )
                )

                pkg_data = {
                    APP_NAME: pkg[AppsKey.Name],
                    APP_URIS: uris,
                    APP_ID: app_id
                }

        elif oper_type == UNINSTALL:
            pkg = (
                get_app_data(
                    app_id, table, app_key,
                    fields_to_pluck=[AppsKey.Name]
                )
            )
            pkg_data = (
                {
                    APP_NAME: pkg[AppsKey.Name],
                    APP_ID: app_id
                }
            )

        elif oper_type == INSTALL_CUSTOM_APPS:
            table = CustomAppsCollection
            app_key = CustomAppsKey.AppId
            pkg = (
                get_app_data(
                    app_id, table, app_key,
                    fields_to_pluck=[CustomAppsKey.Name, PKG_CLI_OPTIONS]
                )
            )
            pkg[PKG_FILEDATA] = get_file_data(app_id, agent_id)

            if pkg:
                uris = (
                    get_download_urls(
                        self.customer_name, app_id,
                        pkg[PKG_FILEDATA], INSTALL_CUSTOM_APPS
                    )
                )

                pkg_data = {
                    APP_NAME: pkg[CustomAppsKey.Name],
                    APP_URIS: uris,
                    APP_ID: app_id,
                    PKG_CLI_OPTIONS: pkg[PKG_CLI_OPTIONS]
                }

        elif oper_type == INSTALL_SUPPORTED_APPS:
            table = SupportedAppsCollection
            app_key = SupportedAppsKey.AppId
            pkg = (
                get_app_data(
                    app_id, table, app_key,
                    fields_to_pluck=[SupportedAppsKey.Name, PKG_CLI_OPTIONS]
                )
            )
            pkg[PKG_FILEDATA] = get_file_data(app_id, agent_id)

            if pkg:
                uris = (
                    get_download_urls(
                        self.customer_name, app_id, pkg[PKG_FILEDATA]
                    )
                )

                pkg_data = {
                    APP_NAME: pkg[SupportedAppsKey.Name],
                    APP_URIS: uris,
                    APP_ID: app_id,
                    PKG_CLI_OPTIONS: pkg[PKG_CLI_OPTIONS]
                }

        elif oper_type == INSTALL_AGENT_APPS:
            table = AgentAppsCollection
            app_key = AgentAppsKey.AppId
            pkg = (
                get_app_data(
                    app_id, table, app_key,
                    fields_to_pluck=[AgentAppsKey.Name, PKG_CLI_OPTIONS]
                )
            )
            pkg[PKG_FILEDATA] = get_file_data(app_id, agent_id)

            if pkg:
                uris = (
                    get_download_urls(
                        self.customer_name, app_id, pkg[PKG_FILEDATA]
                    )
                )

                pkg_data = {
                    APP_NAME: pkg[AgentAppsKey.Name],
                    APP_URIS: uris,
                    APP_ID: app_id,
                    PKG_CLI_OPTIONS: pkg[PKG_CLI_OPTIONS]
                }

        return(pkg_data)

    def _return_valid_app_ids_for_agent(self, agent_id, app_ids,
                                        table=AppsPerAgentCollection):
        conn = db_connect()
        if table == AppsPerAgentCollection:
            INDEX = AppsPerAgentIndexes.AgentIdAndAppId
            APPID = AppsKey.AppId
        elif table == CustomAppsPerAgentCollection:
            INDEX = CustomAppsPerAgentIndexes.AgentIdAndAppId
            APPID = CustomAppsKey.AppId
        elif table == SupportedAppsPerAgentCollection:
            INDEX = SupportedAppsPerAgentIndexes.AgentIdAndAppId
            APPID = SupportedAppsKey.AppId
        elif table == AgentAppsPerAgentCollection:
            INDEX = AgentAppsPerAgentIndexes.AgentIdAndAppId
            APPID = AgentAppsKey.AppId

        try:
            valid_appids = (
                r
                .expr(app_ids)
                .map(
                    lambda x: r.table(table)
                    .get_all(
                        [agent_id, x], index=INDEX
                    )
                    .coerce_to('array')
                )
                .concat_map(lambda x: x[APPID])
                .run(conn)
            )
        except Exception as e:
            logger.exception(e)
            valid_appids = []

        conn.close()
        return(valid_appids)
