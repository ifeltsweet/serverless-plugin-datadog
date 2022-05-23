"use strict";
/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasWebpackPlugin = exports.forceExcludeDepsFromWebpack = exports.getConfig = exports.setEnvConfiguration = exports.defaultConfiguration = exports.ddTagsEnvVar = exports.ddVersionEnvVar = exports.ddEnvEnvVar = exports.ddServiceEnvVar = void 0;
const layer_1 = require("./layer");
const webpackPluginName = "serverless-webpack";
const apiKeyEnvVar = "DD_API_KEY";
const apiKeyKMSEnvVar = "DD_KMS_API_KEY";
const apiKeySecretArnEnvVar = "DD_API_KEY_SECRET_ARN";
const siteURLEnvVar = "DD_SITE";
const logLevelEnvVar = "DD_LOG_LEVEL";
const logForwardingEnvVar = "DD_FLUSH_TO_LOG";
const ddTracingEnabledEnvVar = "DD_TRACE_ENABLED";
const ddMergeXrayTracesEnvVar = "DD_MERGE_XRAY_TRACES";
const logInjectionEnvVar = "DD_LOGS_INJECTION";
const ddLogsEnabledEnvVar = "DD_SERVERLESS_LOGS_ENABLED";
const ddCaptureLambdaPayloadEnvVar = "DD_CAPTURE_LAMBDA_PAYLOAD";
exports.ddServiceEnvVar = "DD_SERVICE";
exports.ddEnvEnvVar = "DD_ENV";
exports.ddVersionEnvVar = "DD_VERSION";
exports.ddTagsEnvVar = "DD_TAGS";
// .NET tracer env variables
const ENABLE_PROFILING_ENV_VAR = "CORECLR_ENABLE_PROFILING";
const PROFILER_ENV_VAR = "CORECLR_PROFILER";
const PROFILER_PATH_ENV_VAR = "CORECLR_PROFILER_PATH";
const DOTNET_TRACER_HOME_ENV_VAR = "DD_DOTNET_TRACER_HOME";
const CORECLR_ENABLE_PROFILING = "1";
const CORECLR_PROFILER = "{846F5F1C-F9AE-4B07-969E-05C26BC060D8}";
const CORECLR_PROFILER_PATH = "/opt/datadog/Datadog.Trace.ClrProfiler.Native.so";
const DD_DOTNET_TRACER_HOME = "/opt/datadog";
// Java tracer env variables
const JAVA_TOOL_OPTIONS_VAR = "JAVA_TOOL_OPTIONS";
const JAVA_TOOL_OPTIONS = '-javaagent:"/opt/java/lib/dd-java-agent.jar" -XX:+TieredCompilation -XX:TieredStopAtLevel=1';
const JAVA_JMXFETCH_ENABLED_VAR = "DD_JMXFETCH_ENABLED";
const JAVA_JMXFETCH_ENABLED = false;
exports.defaultConfiguration = {
    addLayers: true,
    flushMetricsToLogs: true,
    logLevel: undefined,
    site: "datadoghq.com",
    enableXrayTracing: false,
    enableDDTracing: true,
    addExtension: true,
    enableTags: true,
    injectLogContext: true,
    enableSourceCodeIntegration: true,
    exclude: [],
    integrationTesting: false,
    subscribeToAccessLogs: true,
    subscribeToExecutionLogs: false,
    enableDDLogs: true,
    captureLambdaPayload: false,
    failOnError: false,
};
function setEnvConfiguration(config, handlers) {
    handlers.forEach(({ handler, type }) => {
        var _a, _b;
        (_a = handler.environment) !== null && _a !== void 0 ? _a : (handler.environment = {});
        const environment = handler.environment;
        const functionName = (_b = handler.name) !== null && _b !== void 0 ? _b : "";
        if (process.env.DATADOG_API_KEY !== undefined &&
            environment[apiKeyEnvVar] === undefined &&
            // Only set this from the environment if all other methods of authentication
            // are not in use. This will set DATADOG_API_KEY on the lambda from the environment
            // variable directly if they haven't set one of the below three options
            // in the configuration.
            config.apiKMSKey === undefined &&
            config.apiKey === undefined &&
            config.apiKeySecretArn === undefined) {
            environment[apiKeyEnvVar] = process.env.DATADOG_API_KEY;
        }
        if (config.apiKey !== undefined && environment[apiKeyEnvVar] === undefined) {
            environment[apiKeyEnvVar] = config.apiKey;
        }
        if (config.apiKMSKey !== undefined && environment[apiKeyKMSEnvVar] === undefined) {
            environment[apiKeyKMSEnvVar] = config.apiKMSKey;
        }
        if (config.apiKeySecretArn !== undefined && environment[apiKeySecretArnEnvVar] === undefined) {
            const isNode = layer_1.runtimeLookup[handler.runtime] === layer_1.RuntimeType.NODE;
            const isSendingSynchronousMetrics = !config.addExtension && !config.flushMetricsToLogs;
            if (isSendingSynchronousMetrics && isNode) {
                throw new Error("`apiKeySecretArn` is not supported for Node runtimes when using Synchronous Metrics. Set DATADOG_API_KEY in your environment, or use `apiKmsKey` in the configuration.");
            }
            environment[apiKeySecretArnEnvVar] = config.apiKeySecretArn;
        }
        if (environment[siteURLEnvVar] === undefined) {
            environment[siteURLEnvVar] = config.site;
        }
        if (environment[logLevelEnvVar] === undefined) {
            environment[logLevelEnvVar] = config.logLevel;
        }
        if (environment[logForwardingEnvVar] === undefined && config.addExtension === false) {
            environment[logForwardingEnvVar] = config.flushMetricsToLogs;
        }
        if (config.enableDDTracing !== undefined && environment[ddTracingEnabledEnvVar] === undefined) {
            environment[ddTracingEnabledEnvVar] = config.enableDDTracing;
        }
        if (config.enableXrayTracing !== undefined && environment[ddMergeXrayTracesEnvVar] === undefined) {
            environment[ddMergeXrayTracesEnvVar] = config.enableXrayTracing;
        }
        if (config.injectLogContext !== undefined && environment[logInjectionEnvVar] === undefined) {
            environment[logInjectionEnvVar] = config.injectLogContext;
        }
        if (config.enableDDLogs !== undefined && environment[ddLogsEnabledEnvVar] === undefined) {
            environment[ddLogsEnabledEnvVar] = config.enableDDLogs;
        }
        if (environment[ddCaptureLambdaPayloadEnvVar] === undefined) {
            environment[ddCaptureLambdaPayloadEnvVar] = config.captureLambdaPayload;
        }
        if (type === layer_1.RuntimeType.DOTNET) {
            if (environment[ENABLE_PROFILING_ENV_VAR] === undefined) {
                environment[ENABLE_PROFILING_ENV_VAR] = CORECLR_ENABLE_PROFILING;
            }
            else if (environment[ENABLE_PROFILING_ENV_VAR] !== CORECLR_ENABLE_PROFILING) {
                throwEnvVariableError("CORECLR_ENABLE_PROFILING", CORECLR_ENABLE_PROFILING, functionName);
            }
            if (environment[PROFILER_ENV_VAR] === undefined) {
                environment[PROFILER_ENV_VAR] = CORECLR_PROFILER;
            }
            else if (environment[PROFILER_ENV_VAR] !== CORECLR_PROFILER) {
                throwEnvVariableError("CORECLR_PROFILER", CORECLR_PROFILER, functionName);
            }
            if (environment[PROFILER_PATH_ENV_VAR] === undefined) {
                environment[PROFILER_PATH_ENV_VAR] = CORECLR_PROFILER_PATH;
            }
            else if (environment[PROFILER_PATH_ENV_VAR] !== CORECLR_PROFILER_PATH) {
                throwEnvVariableError("CORECLR_PROFILER_PATH", CORECLR_PROFILER_PATH, functionName);
            }
            if (environment[DOTNET_TRACER_HOME_ENV_VAR] === undefined) {
                environment[DOTNET_TRACER_HOME_ENV_VAR] = DD_DOTNET_TRACER_HOME;
            }
            else if (environment[DOTNET_TRACER_HOME_ENV_VAR] !== DD_DOTNET_TRACER_HOME) {
                throwEnvVariableError("DD_DOTNET_TRACER_HOME", DD_DOTNET_TRACER_HOME, functionName);
            }
        }
        if (type === layer_1.RuntimeType.JAVA) {
            if (environment[JAVA_TOOL_OPTIONS_VAR] === undefined) {
                environment[JAVA_TOOL_OPTIONS_VAR] = JAVA_TOOL_OPTIONS;
            }
            else if (environment[JAVA_TOOL_OPTIONS_VAR] !== JAVA_TOOL_OPTIONS) {
                throwEnvVariableError("JAVA_TOOL_OPTIONS", JAVA_TOOL_OPTIONS, functionName);
            }
            if (environment[JAVA_JMXFETCH_ENABLED_VAR] === undefined) {
                environment[JAVA_JMXFETCH_ENABLED_VAR] = JAVA_JMXFETCH_ENABLED;
            }
            else if (environment[JAVA_JMXFETCH_ENABLED_VAR] !== JAVA_JMXFETCH_ENABLED) {
                throwEnvVariableError("DD_JMXFETCH_ENABLED", `${JAVA_JMXFETCH_ENABLED}`, functionName);
            }
        }
    });
}
exports.setEnvConfiguration = setEnvConfiguration;
function throwEnvVariableError(variable, value, functionName) {
    throw new Error(`Environment variable ${variable} should be set to ${value} for function ${functionName}`);
}
function getConfig(service) {
    var _a, _b, _c, _d, _e, _f;
    let custom = service.custom;
    if (custom === undefined) {
        custom = {};
    }
    let datadog = custom.datadog;
    if (datadog === undefined) {
        datadog = {};
    }
    // These values are deprecated but will supersede everything if set
    if ((_a = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _a === void 0 ? void 0 : _a.monitorsApiKey) {
        datadog.apiKey = (_c = (_b = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _b === void 0 ? void 0 : _b.monitorsApiKey) !== null && _c !== void 0 ? _c : datadog.apiKey;
    }
    if ((_d = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _d === void 0 ? void 0 : _d.monitorsAppKey) {
        datadog.appKey = (_f = (_e = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _e === void 0 ? void 0 : _e.monitorsAppKey) !== null && _f !== void 0 ? _f : datadog.appKey;
    }
    const config = Object.assign(Object.assign({}, exports.defaultConfiguration), datadog);
    return config;
}
exports.getConfig = getConfig;
function forceExcludeDepsFromWebpack(service) {
    const includeModules = getPropertyFromPath(service, ["custom", "webpack", "includeModules"]);
    if (includeModules === undefined) {
        return;
    }
    let forceExclude = includeModules.forceExclude;
    if (forceExclude === undefined) {
        forceExclude = [];
        includeModules.forceExclude = forceExclude;
    }
    if (!forceExclude.includes("datadog-lambda-js")) {
        forceExclude.push("datadog-lambda-js");
    }
    if (!forceExclude.includes("dd-trace")) {
        forceExclude.push("dd-trace");
    }
}
exports.forceExcludeDepsFromWebpack = forceExcludeDepsFromWebpack;
function getPropertyFromPath(obj, path) {
    for (const part of path) {
        let prop = obj[part];
        if (prop === undefined || prop === true) {
            prop = {};
            obj[part] = prop;
        }
        if (prop === false) {
            return;
        }
        obj = prop;
    }
    return obj;
}
function hasWebpackPlugin(service) {
    const plugins = service.plugins;
    if (plugins === undefined) {
        return false;
    }
    if (Array.isArray(plugins)) {
        // We have a normal plugin array
        return plugins.find((plugin) => plugin === webpackPluginName) !== undefined;
    }
    // We have an enhanced plugins object
    const modules = service.plugins.modules;
    if (modules === undefined) {
        return false;
    }
    return modules.find((plugin) => plugin === webpackPluginName) !== undefined;
}
exports.hasWebpackPlugin = hasWebpackPlugin;
//# sourceMappingURL=env.js.map