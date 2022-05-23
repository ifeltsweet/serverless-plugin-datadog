"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMonitors = exports.handleMonitorsApiResponse = exports.buildMonitorParams = void 0;
const serverless_monitors_1 = require("./serverless_monitors");
const monitor_api_requests_1 = require("./monitor-api-requests");
/**
 * Adds the appropriate tags and required parameters that will be passed as part of the request body for creating and updating monitors
 * @param monitor - the Monitor object that is defined in the serverless.yml file
 * @param cloudFormationStackId - the Cloud Formation Stack ID
 * @param service - the Service
 * @param env  - the Environment
 * @returns valid monitor parameters
 */
function buildMonitorParams(monitor, cloudFormationStackId, service, env) {
    const serverlessMonitorId = Object.keys(monitor)[0];
    if (!monitor[serverlessMonitorId]) {
        monitor[serverlessMonitorId] = {};
    }
    const monitorParams = Object.assign({}, monitor[serverlessMonitorId]);
    if (!monitorParams.tags) {
        monitorParams.tags = [];
    }
    if (!monitorParams.options) {
        monitorParams.options = {};
    }
    if (monitorParams.type === undefined) {
        monitorParams.type = "metric alert";
    }
    monitorParams.tags = [
        ...monitorParams.tags,
        "serverless_monitor_type:single_function",
        `serverless_monitor_id:${serverlessMonitorId}`,
        `aws_cloudformation_stack-id:${cloudFormationStackId}`,
        "created_by:dd_sls_plugin",
        `env:${env}`,
        `service:${service}`,
    ];
    if (checkIfRecommendedMonitor(serverlessMonitorId)) {
        let criticalThreshold = serverless_monitors_1.SERVERLESS_MONITORS[serverlessMonitorId].threshold;
        if (monitorParams.options) {
            if (monitorParams.options.thresholds) {
                if (monitorParams.options.thresholds.critical) {
                    criticalThreshold = monitorParams.options.thresholds.critical;
                }
            }
        }
        monitorParams.query = serverless_monitors_1.SERVERLESS_MONITORS[serverlessMonitorId].query(cloudFormationStackId, criticalThreshold);
        if (!monitorParams.message) {
            monitorParams.message = serverless_monitors_1.SERVERLESS_MONITORS[serverlessMonitorId].message;
        }
        if (!monitorParams.name) {
            monitorParams.name = serverless_monitors_1.SERVERLESS_MONITORS[serverlessMonitorId].name;
        }
    }
    return monitorParams;
}
exports.buildMonitorParams = buildMonitorParams;
/**
 * Checks to see if the given monitor is a serverless recommended monitor
 * @param serverlessMonitorId - Unique ID string defined for each monitor
 * @returns true if a given monitor is a serverless recommended monitor
 */
function checkIfRecommendedMonitor(serverlessMonitorId) {
    return Object.keys(serverless_monitors_1.SERVERLESS_MONITORS).includes(serverlessMonitorId);
}
/**
 * Checks to see if the monitor already exists
 * @param serverlessMonitorId - Unique ID string defined for each serverless monitor
 * @param existingMonitors - Monitors that have already been created
 * @returns true if given monitor already exists
 */
function doesMonitorExist(serverlessMonitorId, existingMonitors) {
    return Object.keys(existingMonitors).includes(serverlessMonitorId);
}
/**
 * Deletes the monitors that have been removed from the plugin
 * @param pluginMonitors Monitors that are currently defined in the plugin
 * @param existingMonitors Monitors that have already been created
 * @param monitorsApiKey API Key
 * @param monitorsAppKey Application Key
 * @returns an array of successfully deleted monitors
 */
function deleteRemovedMonitors(site, pluginMonitors, existingMonitors, monitorsApiKey, monitorsAppKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const successfullyDeletedMonitors = [];
        const currentMonitorIds = [];
        pluginMonitors.forEach((currentMonitor) => currentMonitorIds.push(Object.keys(currentMonitor)[0]));
        for (const pluginMonitorId of Object.keys(existingMonitors)) {
            if (!currentMonitorIds.includes(pluginMonitorId)) {
                const response = yield (0, monitor_api_requests_1.deleteMonitor)(site, existingMonitors[pluginMonitorId], monitorsApiKey, monitorsAppKey);
                const successfullyDeleted = handleMonitorsApiResponse(response, pluginMonitorId);
                if (successfullyDeleted) {
                    successfullyDeletedMonitors.push(` ${pluginMonitorId}`);
                }
            }
        }
        return successfullyDeletedMonitors;
    });
}
/**
 * Handles the Monitor API response and logs the appropriate error
 * @param response Monitor API Response
 * @param serverlessMonitorId Serverless Monitor ID
 */
function handleMonitorsApiResponse(response, serverlessMonitorId) {
    if (response.status === 200) {
        return true;
    }
    else if (response.status === 400) {
        throw new Error(`400 Bad Request: This could be due to incorrect syntax for ${serverlessMonitorId}`);
    }
    else {
        throw new Error(`${response.status} ${response.statusText}`);
    }
}
exports.handleMonitorsApiResponse = handleMonitorsApiResponse;
/**
 * Creates, updates, and deletes the appropriate monitor configurations as defined in the serverless.yml file
 * @param monitors - Monitors defined in the serverless.yml file
 * @param monitorsApiKey - the API Key
 * @param monitorsAppKey - the Application Key
 * @param cloudFormationStackId - the Cloud Formation Stack ID
 * @param service - the Service
 * @param env - the Environment
 * @returns monitors that have been successfully created, updated, and deleted according to the configuration defined in the plugin
 */
function setMonitors(site, monitors, monitorsApiKey, monitorsAppKey, cloudFormationStackId, service, env) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverlessMonitorIdByMonitorId = yield (0, monitor_api_requests_1.getExistingMonitors)(site, cloudFormationStackId, monitorsApiKey, monitorsAppKey);
        const successfullyUpdatedMonitors = [];
        const successfullyCreatedMonitors = [];
        for (const monitor of monitors) {
            const serverlessMonitorId = Object.keys(monitor)[0];
            const monitorIdNumber = serverlessMonitorIdByMonitorId[serverlessMonitorId];
            const monitorParams = buildMonitorParams(monitor, cloudFormationStackId, service, env);
            const monitorExists = yield doesMonitorExist(serverlessMonitorId, serverlessMonitorIdByMonitorId);
            if (monitorExists) {
                const response = yield (0, monitor_api_requests_1.updateMonitor)(site, monitorIdNumber, monitorParams, monitorsApiKey, monitorsAppKey);
                const successfullyCreated = handleMonitorsApiResponse(response, serverlessMonitorId);
                if (successfullyCreated) {
                    successfullyUpdatedMonitors.push(` ${serverlessMonitorId}`);
                }
            }
            else {
                const response = yield (0, monitor_api_requests_1.createMonitor)(site, monitorParams, monitorsApiKey, monitorsAppKey);
                const successfullyUpdated = handleMonitorsApiResponse(response, serverlessMonitorId);
                if (successfullyUpdated) {
                    successfullyCreatedMonitors.push(` ${serverlessMonitorId}`);
                }
            }
        }
        const successfullyDeletedMonitors = yield deleteRemovedMonitors(site, monitors, serverlessMonitorIdByMonitorId, monitorsApiKey, monitorsAppKey);
        const logStatements = [];
        if (successfullyUpdatedMonitors.length > 0) {
            logStatements.push(`Successfully updated${successfullyUpdatedMonitors}`);
        }
        if (successfullyCreatedMonitors.length > 0) {
            logStatements.push(`Successfully created${successfullyCreatedMonitors}`);
        }
        if (successfullyDeletedMonitors.length > 0) {
            logStatements.push(`Successfully deleted${successfullyDeletedMonitors}`);
        }
        return logStatements;
    });
}
exports.setMonitors = setMonitors;
//# sourceMappingURL=monitors.js.map