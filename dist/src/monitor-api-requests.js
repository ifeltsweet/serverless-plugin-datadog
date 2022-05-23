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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExistingMonitors = exports.getCloudFormationStackId = exports.searchMonitors = exports.deleteMonitor = exports.updateMonitor = exports.createMonitor = exports.InvalidAuthenticationError = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class InvalidAuthenticationError extends Error {
    constructor(message) {
        super(...message);
        this.name = "Invalid Authentication Error";
        this.message = message;
    }
}
exports.InvalidAuthenticationError = InvalidAuthenticationError;
function createMonitor(site, monitorParams, monitorsApiKey, monitorsAppKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, node_fetch_1.default)(`https://api.${site}/api/v1/monitor`, {
            method: "POST",
            headers: {
                "DD-API-KEY": monitorsApiKey,
                "DD-APPLICATION-KEY": monitorsAppKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(monitorParams),
        });
        return response;
    });
}
exports.createMonitor = createMonitor;
function updateMonitor(site, monitorId, monitorParams, monitorsApiKey, monitorsAppKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, node_fetch_1.default)(`https://api.${site}/api/v1/monitor/${monitorId}`, {
            method: "PUT",
            headers: {
                "DD-API-KEY": monitorsApiKey,
                "DD-APPLICATION-KEY": monitorsAppKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(monitorParams),
        });
        return response;
    });
}
exports.updateMonitor = updateMonitor;
function deleteMonitor(site, monitorId, monitorsApiKey, monitorsAppKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, node_fetch_1.default)(`https://api.${site}/api/v1/monitor/${monitorId}`, {
            method: "DELETE",
            headers: {
                "DD-API-KEY": monitorsApiKey,
                "DD-APPLICATION-KEY": monitorsAppKey,
                "Content-Type": "application/json",
            },
        });
        return response;
    });
}
exports.deleteMonitor = deleteMonitor;
function searchMonitors(site, queryTag, monitorsApiKey, monitorsAppKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `tag:"${queryTag}"`;
        const response = yield (0, node_fetch_1.default)(`https://api.${site}/api/v1/monitor/search?query=${query}`, {
            method: "GET",
            headers: {
                "DD-API-KEY": monitorsApiKey,
                "DD-APPLICATION-KEY": monitorsAppKey,
                "Content-Type": "application/json",
            },
        });
        if (response.status !== 200) {
            throw new Error(`Can't fetch monitors. Status code: ${response.status}. Message: ${response.statusText}`);
        }
        const json = yield response.json();
        const monitors = json.monitors;
        return monitors;
    });
}
exports.searchMonitors = searchMonitors;
function getCloudFormationStackId(serverless) {
    return __awaiter(this, void 0, void 0, function* () {
        const stackName = serverless.getProvider("aws").naming.getStackName();
        const describeStackOutput = yield serverless
            .getProvider("aws")
            .request("CloudFormation", "describeStacks", { StackName: stackName }, { region: serverless.getProvider("aws").getRegion() })
            .catch(() => {
            // Ignore any request exceptions, fail silently and skip output logging
        });
        const cloudFormationStackId = describeStackOutput ? describeStackOutput.Stacks[0].StackId : "";
        return cloudFormationStackId;
    });
}
exports.getCloudFormationStackId = getCloudFormationStackId;
function getExistingMonitors(site, cloudFormationStackId, monitorsApiKey, monitorsAppKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingMonitors = yield searchMonitors(site, `aws_cloudformation_stack-id:${cloudFormationStackId}`, monitorsApiKey, monitorsAppKey);
        const serverlessMonitorIdByMonitorId = {};
        for (const existingMonitor of existingMonitors) {
            for (const tag of existingMonitor.tags) {
                if (tag.startsWith("serverless_monitor_id:")) {
                    const serverlessMonitorId = tag.substring(tag.indexOf(":") + 1);
                    serverlessMonitorIdByMonitorId[serverlessMonitorId] = existingMonitor.id;
                }
            }
        }
        return serverlessMonitorIdByMonitorId;
    });
}
exports.getExistingMonitors = getExistingMonitors;
//# sourceMappingURL=monitor-api-requests.js.map