"use strict";
/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const package_json_1 = require("../package.json");
const env_1 = require("./env");
const forwarder_1 = require("./forwarder");
const git_1 = require("./git");
const layer_1 = require("./layer");
const govLayers = __importStar(require("./layers-gov.json"));
const layers = __importStar(require("./layers.json"));
const monitor_api_requests_1 = require("./monitor-api-requests");
const monitors_1 = require("./monitors");
const output_1 = require("./output");
const source_code_integration_1 = require("./source-code-integration");
const tracing_1 = require("./tracing");
const wrapper_1 = require("./wrapper");
var TagKeys;
(function (TagKeys) {
    TagKeys["Service"] = "service";
    TagKeys["Env"] = "env";
    TagKeys["Version"] = "version";
    TagKeys["Plugin"] = "dd_sls_plugin";
})(TagKeys || (TagKeys = {}));
module.exports = class ServerlessPlugin {
    constructor(serverless, _) {
        this.serverless = serverless;
        this.hooks = {
            "after:datadog:clean:init": this.afterPackageFunction.bind(this),
            "after:datadog:generate:init": this.beforePackageFunction.bind(this),
            "after:deploy:function:packageFunction": this.afterPackageFunction.bind(this),
            "after:package:createDeploymentArtifacts": this.afterPackageFunction.bind(this),
            "after:package:initialize": this.beforePackageFunction.bind(this),
            "before:deploy:function:packageFunction": this.beforePackageFunction.bind(this),
            "before:offline:start:init": this.beforePackageFunction.bind(this),
            "before:step-functions-offline:start": this.beforePackageFunction.bind(this),
            "after:deploy:deploy": this.afterDeploy.bind(this),
            "before:package:finalize": this.afterPackageFunction.bind(this),
        };
        this.commands = {
            datadog: {
                commands: {
                    clean: {
                        lifecycleEvents: ["init"],
                        usage: "Cleans up wrapper handler functions for DataDog, not necessary in most cases",
                    },
                    generate: {
                        lifecycleEvents: ["init"],
                        usage: "Generates wrapper handler functions for DataDog, not necessary in most cases",
                    },
                },
                lifecycleEvents: ["clean", "generate"],
                usage: "Automatically instruments your lambdas with DataDog",
            },
        };
    }
    beforePackageFunction() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = (0, env_1.getConfig)(this.serverless.service);
            if (config.enabled === false)
                return;
            this.serverless.cli.log("Auto instrumenting functions with Datadog");
            configHasOldProperties(config);
            if (config.monitorsApiKey !== undefined || config.monitorsAppKey !== undefined) {
                this.serverless.cli.log("Warning: `monitorsApiKey` and `monitorsAppKey` have been deprecated. Please set DATADOG_API_KEY and DATADOG_APP_KEY in your environment instead.");
            }
            validateConfiguration(config);
            const defaultRuntime = this.serverless.service.provider.runtime;
            const handlers = (0, layer_1.findHandlers)(this.serverless.service, config.exclude, defaultRuntime);
            (0, env_1.setEnvConfiguration)(config, handlers);
            const allLayers = { regions: Object.assign(Object.assign({}, layers.regions), govLayers.regions) };
            if (config.addLayers) {
                this.serverless.cli.log("Adding Lambda Library Layers to functions");
                this.debugLogHandlers(handlers);
                (0, layer_1.applyLambdaLibraryLayers)(this.serverless.service, handlers, allLayers);
                if ((0, env_1.hasWebpackPlugin)(this.serverless.service)) {
                    (0, env_1.forceExcludeDepsFromWebpack)(this.serverless.service);
                }
            }
            else {
                this.serverless.cli.log("Skipping adding Lambda Library Layers, make sure you are packaging them yourself");
            }
            if (config.addExtension) {
                this.serverless.cli.log("Adding Datadog Lambda Extension Layer to functions");
                this.debugLogHandlers(handlers);
                (0, layer_1.applyExtensionLayer)(this.serverless.service, handlers, allLayers);
                handlers.forEach((functionInfo) => {
                    if (functionInfo.type === layer_1.RuntimeType.DOTNET) {
                        this.serverless.cli.log("Adding .NET Tracing Layer to functions");
                        this.debugLogHandlers(handlers);
                        (0, layer_1.applyDotnetTracingLayer)(this.serverless.service, functionInfo, allLayers);
                    }
                    else if (functionInfo.type === layer_1.RuntimeType.JAVA) {
                        this.serverless.cli.log("Adding Java Tracing Layer to functions");
                        this.debugLogHandlers(handlers);
                        (0, layer_1.applyJavaTracingLayer)(this.serverless.service, functionInfo, allLayers);
                    }
                });
            }
            else {
                this.serverless.cli.log("Skipping adding Lambda Extension Layer");
            }
            if (config.addExtension) {
                this.serverless.cli.log("Adding Datadog Env Vars");
                this.addDDEnvVars(handlers);
            }
            else {
                this.addDDTags(handlers);
            }
            let tracingMode = tracing_1.TracingMode.NONE;
            if (config.enableXrayTracing && config.enableDDTracing) {
                tracingMode = tracing_1.TracingMode.HYBRID;
            }
            else if (config.enableDDTracing) {
                tracingMode = tracing_1.TracingMode.DD_TRACE;
            }
            else if (config.enableXrayTracing) {
                tracingMode = tracing_1.TracingMode.XRAY;
            }
            (0, tracing_1.enableTracing)(this.serverless.service, tracingMode, handlers);
        });
    }
    afterPackageFunction() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const config = (0, env_1.getConfig)(this.serverless.service);
            if (config.enabled === false)
                return;
            // Create an object that contains some of our booleans for the forwarder
            const forwarderConfigs = {
                AddExtension: config.addExtension,
                IntegrationTesting: config.integrationTesting,
                SubToAccessLogGroups: config.subscribeToAccessLogs,
                SubToExecutionLogGroups: config.subscribeToExecutionLogs,
            };
            const defaultRuntime = this.serverless.service.provider.runtime;
            const handlers = (0, layer_1.findHandlers)(this.serverless.service, config.exclude, defaultRuntime);
            let datadogForwarderArn;
            datadogForwarderArn = this.setDatadogForwarder(config);
            if (datadogForwarderArn) {
                const aws = this.serverless.getProvider("aws");
                const errors = yield (0, forwarder_1.addCloudWatchForwarderSubscriptions)(this.serverless.service, aws, datadogForwarderArn, forwarderConfigs, handlers);
                if (config.subscribeToExecutionLogs) {
                    yield (0, forwarder_1.addExecutionLogGroupsAndSubscriptions)(this.serverless.service, aws, datadogForwarderArn);
                }
                for (const error of errors) {
                    this.serverless.cli.log(error);
                }
            }
            if (datadogForwarderArn && config.addExtension) {
                this.serverless.cli.log("Warning: Datadog Lambda Extension and forwarder are both enabled. Only APIGateway log groups will be subscribed to the forwarder.");
            }
            this.addTags(handlers, config.addExtension !== true);
            const simpleGit = yield (0, git_1.newSimpleGit)();
            if (((_a = process.env.DATADOG_API_KEY) !== null && _a !== void 0 ? _a : config.apiKey) === undefined) {
                this.serverless.cli.log("Skipping installing GitHub integration because Datadog credentials were not found. Please set either DATADOG_API_KEY in your environment, or set the apiKey parameter in Serverless.");
            }
            else {
                if (config.enableSourceCodeIntegration && simpleGit !== undefined && (yield simpleGit.checkIsRepo())) {
                    try {
                        yield this.addSourceCodeIntegration(handlers, simpleGit, ((_b = process.env.DATADOG_API_KEY) !== null && _b !== void 0 ? _b : config.apiKey), config.site);
                    }
                    catch (err) {
                        this.serverless.cli.log(`Error occurred when adding source code integration: ${err}`);
                        return;
                    }
                }
            }
            (0, wrapper_1.redirectHandlers)(handlers, config.addLayers, config.customHandler);
            if (config.integrationTesting === false) {
                yield (0, output_1.addOutputLinks)(this.serverless, config.site, handlers);
            }
            else {
                this.serverless.cli.log("Skipped adding output links because 'integrationTesting' is set true");
            }
        });
    }
    afterDeploy() {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const config = (0, env_1.getConfig)(this.serverless.service);
            const service = this.serverless.service.getServiceName();
            const env = this.serverless.getProvider("aws").getStage();
            if (config.enabled === false)
                return;
            if (config.monitors &&
                ((_a = config.apiKey) !== null && _a !== void 0 ? _a : process.env.DATADOG_API_KEY) &&
                ((_b = config.appKey) !== null && _b !== void 0 ? _b : process.env.DATADOG_APP_KEY)) {
                const cloudFormationStackId = yield (0, monitor_api_requests_1.getCloudFormationStackId)(this.serverless);
                try {
                    const logStatements = yield (0, monitors_1.setMonitors)(config.site, config.monitors, ((_c = config.apiKey) !== null && _c !== void 0 ? _c : process.env.DATADOG_API_KEY), ((_d = config.appKey) !== null && _d !== void 0 ? _d : process.env.DATADOG_APP_KEY), cloudFormationStackId, service, env);
                    for (const logStatement of logStatements) {
                        this.serverless.cli.log(logStatement);
                    }
                }
                catch (err) {
                    if (err instanceof Error) {
                        this.serverless.cli.log(`Error occurred when configuring monitors: ${err.message}`);
                        if (config.failOnError) {
                            throw err;
                        }
                    }
                }
            }
            return (0, output_1.printOutputs)(this.serverless, config.site);
        });
    }
    debugLogHandlers(handlers) {
        for (const handler of handlers) {
            if (handler.type === layer_1.RuntimeType.UNSUPPORTED) {
                if (handler.runtime === undefined) {
                    this.serverless.cli.log(`Unable to determine runtime for function ${handler.name}`);
                }
                else {
                    this.serverless.cli.log(`Unable to add Lambda Layers to function ${handler.name} with runtime ${handler.runtime}`);
                }
            }
        }
    }
    /**
     * Check for service, env, version, and additional tags at the custom level.
     * If these don't already exsist on the function level as env vars, adds them as DD_XXX env vars
     */
    addDDEnvVars(handlers) {
        const provider = this.serverless.service.provider;
        const service = this.serverless.service;
        let custom = service.custom;
        if (custom === undefined) {
            custom = {};
        }
        handlers.forEach(({ handler }) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            (_a = handler.environment) !== null && _a !== void 0 ? _a : (handler.environment = {});
            const environment = handler.environment;
            (_b = provider.environment) !== null && _b !== void 0 ? _b : (provider.environment = {});
            const providerEnvironment = provider.environment;
            if ((_c = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _c === void 0 ? void 0 : _c.service) {
                (_d = environment[env_1.ddServiceEnvVar]) !== null && _d !== void 0 ? _d : (environment[env_1.ddServiceEnvVar] = (_e = providerEnvironment[env_1.ddServiceEnvVar]) !== null && _e !== void 0 ? _e : custom.datadog.service);
            }
            if ((_f = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _f === void 0 ? void 0 : _f.env) {
                (_g = environment[env_1.ddEnvEnvVar]) !== null && _g !== void 0 ? _g : (environment[env_1.ddEnvEnvVar] = (_h = providerEnvironment[env_1.ddEnvEnvVar]) !== null && _h !== void 0 ? _h : custom.datadog.env);
            }
            if ((_j = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _j === void 0 ? void 0 : _j.version) {
                (_k = environment[env_1.ddVersionEnvVar]) !== null && _k !== void 0 ? _k : (environment[env_1.ddVersionEnvVar] = (_l = providerEnvironment[env_1.ddVersionEnvVar]) !== null && _l !== void 0 ? _l : custom.datadog.version);
            }
            if ((_m = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _m === void 0 ? void 0 : _m.tags) {
                (_o = environment[env_1.ddTagsEnvVar]) !== null && _o !== void 0 ? _o : (environment[env_1.ddTagsEnvVar] = (_p = providerEnvironment[env_1.ddTagsEnvVar]) !== null && _p !== void 0 ? _p : custom.datadog.tags);
            }
            // default to service and stage if env vars aren't set
            (_q = environment[env_1.ddServiceEnvVar]) !== null && _q !== void 0 ? _q : (environment[env_1.ddServiceEnvVar] = service.getServiceName());
            (_r = environment[env_1.ddEnvEnvVar]) !== null && _r !== void 0 ? _r : (environment[env_1.ddEnvEnvVar] = this.serverless.getProvider("aws").getStage());
        });
    }
    /**
     * Check for service, env, version, and additional tags at the custom level.
     * If these tags don't already exsist on the function level, adds them as tags
     */
    addDDTags(handlers) {
        const service = this.serverless.service;
        let custom = service.custom;
        if (custom === undefined) {
            custom = {};
        }
        handlers.forEach(({ handler }) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            var _j, _k, _l;
            (_a = handler.tags) !== null && _a !== void 0 ? _a : (handler.tags = {});
            const tags = handler.tags;
            if ((_b = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _b === void 0 ? void 0 : _b.service) {
                (_c = tags[_j = TagKeys.Service]) !== null && _c !== void 0 ? _c : (tags[_j] = custom.datadog.service);
            }
            if ((_d = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _d === void 0 ? void 0 : _d.env) {
                (_e = tags[_k = TagKeys.Env]) !== null && _e !== void 0 ? _e : (tags[_k] = custom.datadog.env);
            }
            if ((_f = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _f === void 0 ? void 0 : _f.version) {
                (_g = tags[_l = TagKeys.Version]) !== null && _g !== void 0 ? _g : (tags[_l] = custom.datadog.version);
            }
            if ((_h = custom === null || custom === void 0 ? void 0 : custom.datadog) === null || _h === void 0 ? void 0 : _h.tags) {
                const tagsArray = custom.datadog.tags.split(",");
                tagsArray.forEach((tag) => {
                    var _a;
                    const [key, value] = tag.split(":");
                    if (key && value) {
                        (_a = tags[key]) !== null && _a !== void 0 ? _a : (tags[key] = value);
                    }
                });
            }
        });
    }
    /**
     * Check for service and env tags on provider level (under tags and stackTags),
     * as well as function level. Automatically create tags for service and env with
     * properties from deployment configurations if needed; does not override any existing values.
     */
    addTags(handlers, shouldAddTags) {
        const provider = this.serverless.service.provider;
        this.serverless.cli.log(`Adding Plugin Version ${package_json_1.version} tag`);
        if (shouldAddTags) {
            this.serverless.cli.log(`Adding service and environment tags`);
        }
        handlers.forEach(({ handler }) => {
            var _a, _b, _c, _d, _e, _f, _g;
            var _h, _j, _k, _l;
            (_a = handler.tags) !== null && _a !== void 0 ? _a : (handler.tags = {});
            handler.tags[TagKeys.Plugin] = `v${package_json_1.version}`;
            if (shouldAddTags) {
                if (!((_b = provider.tags) === null || _b === void 0 ? void 0 : _b[TagKeys.Service]) && !((_c = provider.stackTags) === null || _c === void 0 ? void 0 : _c[TagKeys.Service])) {
                    (_d = (_h = handler.tags)[_j = TagKeys.Service]) !== null && _d !== void 0 ? _d : (_h[_j] = this.serverless.service.getServiceName());
                }
                if (!((_e = provider.tags) === null || _e === void 0 ? void 0 : _e[TagKeys.Env]) && !((_f = provider.stackTags) === null || _f === void 0 ? void 0 : _f[TagKeys.Env])) {
                    (_g = (_k = handler.tags)[_l = TagKeys.Env]) !== null && _g !== void 0 ? _g : (_k[_l] = this.serverless.getProvider("aws").getStage());
                }
            }
        });
    }
    /**
     * Uploads git metadata for the current directory to Datadog and goes through
     * each function defined in serverless and attaches the git.commit.sha to DD_TAGS.
     */
    addSourceCodeIntegration(handlers, simpleGit, apiKey, datadogSite) {
        return __awaiter(this, void 0, void 0, function* () {
            const sourceCodeIntegration = new source_code_integration_1.SourceCodeIntegration(apiKey, datadogSite, simpleGit);
            const gitCommitHash = yield sourceCodeIntegration.uploadGitMetadata();
            this.serverless.cli.log(`Adding GitHub integration with git commit hash ${gitCommitHash}`);
            handlers.forEach(({ handler }) => {
                var _a;
                (_a = handler.environment) !== null && _a !== void 0 ? _a : (handler.environment = {});
                handler.environment[env_1.ddTagsEnvVar] = "git.commit.sha:" + gitCommitHash;
            });
        });
    }
    setDatadogForwarder(config) {
        const forwarderArn = config.forwarderArn;
        const forwarder = config.forwarder;
        if (forwarderArn && forwarder) {
            throw new Error("Both 'forwarderArn' and 'forwarder' parameters are set. Please only use the 'forwarderArn' parameter.");
        }
        else if (forwarderArn !== undefined && forwarder === undefined) {
            this.serverless.cli.log("Setting Datadog Forwarder");
            return forwarderArn;
        }
        else if (forwarder !== undefined && forwarderArn === undefined) {
            this.serverless.cli.log("Setting Datadog Forwarder");
            return forwarder;
        }
    }
};
function configHasOldProperties(obj) {
    let hasOldProperties = false;
    let message = "The following configuration options have been removed:";
    if (obj.subscribeToApiGatewayLogs) {
        message += " subscribeToApiGatewayLogs";
        hasOldProperties = true;
    }
    if (obj.subscribeToHttpApiLogs) {
        message += " subscribeToHttpApiLogs";
        hasOldProperties = true;
    }
    if (obj.subscribeToWebsocketLogs) {
        message += " subscribeToWebsocketLogs";
        hasOldProperties = true;
    }
    if (hasOldProperties) {
        throw new Error(message + ". Please use the subscribeToAccessLogs or subscribeToExecutionLogs options instead.");
    }
}
function validateConfiguration(config) {
    checkForMultipleApiKeys(config);
    const siteList = [
        "datadoghq.com",
        "datadoghq.eu",
        "us3.datadoghq.com",
        "us5.datadoghq.com",
        "ddog-gov.com",
    ];
    if (config.site !== undefined && !siteList.includes(config.site.toLowerCase())) {
        throw new Error("Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, us5.datadoghq.com, or ddog-gov.com.");
    }
    if (config.addExtension) {
        if (config.apiKey === undefined &&
            process.env.DATADOG_API_KEY === undefined &&
            config.apiKMSKey === undefined &&
            config.apiKeySecretArn === undefined) {
            throw new Error("When `addExtension` is true, the environment variable `DATADOG_API_KEY` or configuration variable `apiKMSKey` or `apiKeySecretArn` must be set.");
        }
    }
    if (config.monitors) {
        if ((process.env.DATADOG_API_KEY === undefined || process.env.DATADOG_APP_KEY === undefined) &&
            // Support deprecated monitorsApiKey and monitorsAppKey
            (config.apiKey === undefined || config.appKey === undefined)) {
            throw new Error("When `monitors` is enabled, `DATADOG_API_KEY` and `DATADOG_APP_KEY` environment variables must be set.");
        }
    }
}
function checkForMultipleApiKeys(config) {
    let multipleApiKeysMessage;
    if (config.apiKey !== undefined && config.apiKMSKey !== undefined && config.apiKeySecretArn !== undefined) {
        multipleApiKeysMessage = "`apiKey`, `apiKMSKey`, and `apiKeySecretArn`";
    }
    else if (config.apiKey !== undefined && config.apiKMSKey !== undefined) {
        multipleApiKeysMessage = "`apiKey` and `apiKMSKey`";
    }
    else if (config.apiKey !== undefined && config.apiKeySecretArn !== undefined) {
        multipleApiKeysMessage = "`apiKey` and `apiKeySecretArn`";
    }
    else if (config.apiKMSKey !== undefined && config.apiKeySecretArn !== undefined) {
        multipleApiKeysMessage = "`apiKMSKey` and `apiKeySecretArn`";
    }
    if (multipleApiKeysMessage) {
        throw new Error(`${multipleApiKeysMessage} should not be set at the same time.`);
    }
}
//# sourceMappingURL=index.js.map