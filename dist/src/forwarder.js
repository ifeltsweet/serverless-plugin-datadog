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
exports.isLogsConfig = exports.describeSubscriptionFilters = exports.canSubscribeLogGroup = exports.addCloudWatchForwarderSubscriptions = exports.addExecutionLogGroupsAndSubscriptions = void 0;
const logGroupKey = "AWS::Logs::LogGroup";
const logGroupSubscriptionKey = "AWS::Logs::SubscriptionFilter";
const maxAllowableLogGroupSubscriptions = 2;
class DatadogForwarderNotFoundError extends Error {
    constructor(message) {
        super(...message);
        this.name = "DatadogForwarderNotFoundError";
        this.message = message;
    }
}
const REST_EXECUTION_LOG_GROUP_KEY = "RestExecutionLogGroup";
const REST_EXECUTION_SUBSCRIPTION_KEY = "RestExecutionLogGroupSubscription";
const WEBSOCKETS_EXECUTION_LOG_GROUP_KEY = "WebsocketsExecutionLogGroup";
const WEBSOCKETS_EXECUTION_SUBCRIPTION_KEY = "WebsocketsExecutionLogGroupSubscription";
function isLogGroup(value) {
    return value.Type === logGroupKey;
}
/**
 * Validates whether Lambda forwarder exists in the account
 * @param aws Serverless framework provided AWS client
 * @param functionArn The forwarder ARN to be validated
 */
function validateForwarderArn(aws, functionArn) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield aws.request("Lambda", "getFunction", { FunctionName: functionArn });
        }
        catch (err) {
            throw new DatadogForwarderNotFoundError(`Could not perform GetFunction on ${functionArn}.`);
        }
    });
}
function addExecutionLogGroupsAndSubscriptions(service, aws, functionArn) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const extendedProvider = (_a = service.provider) === null || _a === void 0 ? void 0 : _a.logs;
        if (!isLogsConfig(extendedProvider)) {
            return;
        }
        const resources = (_b = service.provider.compiledCloudFormationTemplate) === null || _b === void 0 ? void 0 : _b.Resources;
        if (restExecutionLoggingIsEnabled(extendedProvider)) {
            // create log group
            const logGroupName = yield createRestExecutionLogGroupName(aws);
            const executionLogGroupName = addExecutionLogGroup(logGroupName);
            resources[REST_EXECUTION_LOG_GROUP_KEY] = executionLogGroupName;
            // add subscription
            const executionSubscription = subscribeToExecutionLogGroup(functionArn, REST_EXECUTION_LOG_GROUP_KEY);
            resources[REST_EXECUTION_SUBSCRIPTION_KEY] = executionSubscription;
        }
        if (websocketExecutionLoggingIsEnabled(extendedProvider)) {
            // create log group
            const logGroupName = yield createWebsocketExecutionLogGroupName(aws);
            const executionLogGroupName = addExecutionLogGroup(logGroupName);
            // add subscription
            resources[WEBSOCKETS_EXECUTION_LOG_GROUP_KEY] = executionLogGroupName;
            const executionSubscription = subscribeToExecutionLogGroup(functionArn, WEBSOCKETS_EXECUTION_LOG_GROUP_KEY);
            resources[WEBSOCKETS_EXECUTION_SUBCRIPTION_KEY] = executionSubscription;
        }
    });
}
exports.addExecutionLogGroupsAndSubscriptions = addExecutionLogGroupsAndSubscriptions;
function addCloudWatchForwarderSubscriptions(service, aws, functionArn, forwarderConfigs, handlers) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const resources = (_a = service.provider.compiledCloudFormationTemplate) === null || _a === void 0 ? void 0 : _a.Resources;
        if (resources === undefined) {
            return ["No cloudformation stack available. Skipping subscribing Datadog forwarder."];
        }
        const errors = [];
        if (typeof functionArn !== "string") {
            errors.push("Skipping forwarder ARN validation because forwarder string defined with CloudFormation function.");
        }
        else if (forwarderConfigs.IntegrationTesting === true) {
            errors.push("Skipping forwarder ARN validation because 'integrationTesting' is set to true");
        }
        else {
            yield validateForwarderArn(aws, functionArn);
        }
        for (const [name, resource] of Object.entries(resources)) {
            if (!shouldSubscribe(name, resource, forwarderConfigs, handlers, service)) {
                continue;
            }
            const logGroupName = resource.Properties.LogGroupName;
            const scopedSubName = `${name}Subscription`;
            let expectedSubName = `${service.getServiceName()}-${aws.getStage()}-${scopedSubName}-`;
            const stackName = aws.naming.getStackName();
            if (stackName) {
                expectedSubName = `${stackName}-${scopedSubName}-`;
            }
            const canSub = yield canSubscribeLogGroup(aws, logGroupName, expectedSubName);
            if (!canSub) {
                errors.push(`Could not subscribe Datadog Forwarder due to too many existing subscription filter(s) for ${logGroupName}.`);
                continue;
            }
            // Create subscriptions for each log group
            const subscription = subscribeToLogGroup(functionArn, name);
            resources[scopedSubName] = subscription;
        }
        return errors;
    });
}
exports.addCloudWatchForwarderSubscriptions = addCloudWatchForwarderSubscriptions;
function canSubscribeLogGroup(aws, logGroupName, expectedSubName) {
    return __awaiter(this, void 0, void 0, function* () {
        const subscriptionFilters = yield describeSubscriptionFilters(aws, logGroupName);
        const numberOfActiveSubscriptionFilters = subscriptionFilters.length;
        let foundDatadogSubscriptionFilter = false;
        for (const subscription of subscriptionFilters) {
            const filterName = subscription.filterName;
            if (filterName.startsWith(expectedSubName)) {
                foundDatadogSubscriptionFilter = true;
            }
        }
        if (!foundDatadogSubscriptionFilter && numberOfActiveSubscriptionFilters >= maxAllowableLogGroupSubscriptions) {
            return false;
        }
        else {
            return true;
        }
    });
}
exports.canSubscribeLogGroup = canSubscribeLogGroup;
function describeSubscriptionFilters(aws, logGroupName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield aws.request("CloudWatchLogs", "describeSubscriptionFilters", {
                logGroupName,
            });
            return result.subscriptionFilters;
        }
        catch (err) {
            // An error will occur if the log group doesn't exist, so we swallow this and return an empty list.
            return [];
        }
    });
}
exports.describeSubscriptionFilters = describeSubscriptionFilters;
// Helper functions to validate we have a particular log group and if we should subscribe to it
function validateRestApiSubscription(resource, subscribe, extendedProvider) {
    return (restAccessLoggingIsEnabled(extendedProvider) &&
        resource.Properties.LogGroupName.startsWith("/aws/api-gateway/") &&
        subscribe);
}
function validateHttpApiSubscription(resource, subscribe, extendedProvider) {
    return (httpAccessLoggingIsEnabled(extendedProvider) &&
        resource.Properties.LogGroupName.startsWith("/aws/http-api/") &&
        subscribe);
}
function validateWebsocketSubscription(resource, subscribe, extendedProvider) {
    return (websocketAccessLoggingIsEnabled(extendedProvider) &&
        resource.Properties.LogGroupName.startsWith("/aws/websocket/") &&
        subscribe);
}
function shouldSubscribe(resourceName, resource, forwarderConfigs, handlers, service) {
    var _a;
    const extendedProvider = (_a = service.provider) === null || _a === void 0 ? void 0 : _a.logs;
    if (!isLogGroup(resource)) {
        return false;
    }
    // we don't want to run the shouldSubscribe validation on execution log groups since we manually add those.
    if (typeof resource.Properties.LogGroupName !== "string") {
        return false;
    }
    // if the extension is enabled, we don't want to subscribe to lambda log groups
    if (forwarderConfigs.AddExtension &&
        !(validateRestApiSubscription(resource, forwarderConfigs.SubToAccessLogGroups, extendedProvider) ||
            validateHttpApiSubscription(resource, forwarderConfigs.SubToAccessLogGroups, extendedProvider) ||
            validateWebsocketSubscription(resource, forwarderConfigs.SubToAccessLogGroups, extendedProvider))) {
        return false;
    }
    // if the extension is disabled, we should subscribe to lambda log groups
    if (!(resource.Properties.LogGroupName.startsWith("/aws/lambda/") ||
        validateRestApiSubscription(resource, forwarderConfigs.SubToAccessLogGroups, extendedProvider) ||
        validateHttpApiSubscription(resource, forwarderConfigs.SubToAccessLogGroups, extendedProvider) ||
        validateWebsocketSubscription(resource, forwarderConfigs.SubToAccessLogGroups, extendedProvider))) {
        return false;
    }
    // If the log group does not belong to our list of handlers, we don't want to subscribe to it
    if (resource.Properties.LogGroupName.startsWith("/aws/lambda/") &&
        !handlers.some(({ name }) => getLogGroupLogicalId(name) === resourceName)) {
        return false;
    }
    return true;
}
function subscribeToLogGroup(functionArn, name) {
    const subscription = {
        Type: logGroupSubscriptionKey,
        Properties: {
            DestinationArn: functionArn,
            FilterPattern: "",
            LogGroupName: { Ref: name },
        },
    };
    return subscription;
}
function createRestExecutionLogGroupName(aws) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            "Fn::Join": ["", ["API-Gateway-Execution-Logs_", { Ref: "ApiGatewayRestApi" }, "/", aws.getStage()]],
        };
    });
}
function createWebsocketExecutionLogGroupName(aws) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            "Fn::Join": ["", ["/aws/apigateway/", { Ref: "WebsocketsApi" }, "/", aws.getStage()]],
        };
    });
}
function addExecutionLogGroup(logGroupName) {
    // Create the Execution log group for API Gateway REST logging manually
    const executionLogGroup = {
        Type: "AWS::Logs::LogGroup",
        Properties: {
            LogGroupName: logGroupName,
        },
    };
    return executionLogGroup;
}
function subscribeToExecutionLogGroup(functionArn, executionLogGroupKey) {
    const executionSubscription = {
        Type: logGroupSubscriptionKey,
        Properties: {
            DestinationArn: functionArn,
            FilterPattern: "",
            LogGroupName: { Ref: executionLogGroupKey },
        },
    };
    return executionSubscription;
}
function isLogsConfig(obj) {
    if (typeof obj !== "object") {
        return false;
    }
    if (obj.hasOwnProperty("restApi")) {
        if (!isSubLogsConfig(obj.restApi)) {
            return false;
        }
    }
    if (obj.hasOwnProperty("httpApi")) {
        if (!isSubLogsConfig(obj.httpApi)) {
            return false;
        }
    }
    if (obj.hasOwnProperty("websocket")) {
        if (!isSubLogsConfig(obj.websocket)) {
            return false;
        }
    }
    return true;
}
exports.isLogsConfig = isLogsConfig;
function isSubLogsConfig(obj) {
    if (typeof obj === "boolean") {
        return true;
    }
    if (typeof obj !== "object") {
        return false;
    }
    if (obj.hasOwnProperty("accessLogging")) {
        if (typeof obj.accessLogging !== "boolean" && typeof obj.accessLogging !== undefined) {
            return false;
        }
    }
    if (obj.hasOwnProperty("executionLogging")) {
        if (typeof obj.executionLogging !== "boolean" && typeof obj.executionLogging !== undefined) {
            return false;
        }
    }
    return true;
}
function restAccessLoggingIsEnabled(obj) {
    var _a;
    if ((obj === null || obj === void 0 ? void 0 : obj.restApi) === false) {
        return false;
    }
    return (obj === null || obj === void 0 ? void 0 : obj.restApi) === true || ((_a = obj === null || obj === void 0 ? void 0 : obj.restApi) === null || _a === void 0 ? void 0 : _a.accessLogging) === true;
}
function restExecutionLoggingIsEnabled(obj) {
    var _a;
    if ((obj === null || obj === void 0 ? void 0 : obj.restApi) === false) {
        return false;
    }
    return (obj === null || obj === void 0 ? void 0 : obj.restApi) === true || ((_a = obj === null || obj === void 0 ? void 0 : obj.restApi) === null || _a === void 0 ? void 0 : _a.executionLogging) === true;
}
function httpAccessLoggingIsEnabled(obj) {
    var _a;
    if ((obj === null || obj === void 0 ? void 0 : obj.httpApi) === false) {
        return false;
    }
    return (obj === null || obj === void 0 ? void 0 : obj.httpApi) === true || ((_a = obj === null || obj === void 0 ? void 0 : obj.httpApi) === null || _a === void 0 ? void 0 : _a.accessLogging) === true;
}
function websocketAccessLoggingIsEnabled(obj) {
    var _a;
    if ((obj === null || obj === void 0 ? void 0 : obj.websocket) === false) {
        return false;
    }
    return (obj === null || obj === void 0 ? void 0 : obj.websocket) === true || ((_a = obj === null || obj === void 0 ? void 0 : obj.websocket) === null || _a === void 0 ? void 0 : _a.accessLogging) === true;
}
function websocketExecutionLoggingIsEnabled(obj) {
    var _a;
    if ((obj === null || obj === void 0 ? void 0 : obj.websocket) === false) {
        return false;
    }
    return (obj === null || obj === void 0 ? void 0 : obj.websocket) === true || ((_a = obj === null || obj === void 0 ? void 0 : obj.websocket) === null || _a === void 0 ? void 0 : _a.executionLogging) === true;
}
// Created from https://github.com/serverless/serverless/blob/master/lib/plugins/aws/lib/naming.js#L125-L127
// Skipped lodash because Lambda Function Names can't include unicode chars or symbols
function getLogGroupLogicalId(functionName) {
    if (!functionName) {
        return "";
    }
    const uppercasedFirst = functionName[0].toUpperCase();
    const rest = functionName.slice(1);
    const upperCasedFunctionName = uppercasedFirst + rest;
    const normalizedFunctionName = upperCasedFunctionName.replace(/-/g, "Dash").replace(/_/g, "Underscore");
    return `${normalizedFunctionName}LogGroup`;
}
//# sourceMappingURL=forwarder.js.map