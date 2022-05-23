"use strict";
/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectHandlers = exports.jsHandler = exports.jsHandlerWithLayers = exports.pythonHandler = exports.datadogHandlerEnvVar = void 0;
const layer_1 = require("./layer");
exports.datadogHandlerEnvVar = "DD_LAMBDA_HANDLER";
exports.pythonHandler = "datadog_lambda.handler.handler";
exports.jsHandlerWithLayers = "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler";
exports.jsHandler = "node_modules/datadog-lambda-js/dist/handler.handler";
/**
 * For each lambda function, redirects handler to the Datadog handler for the given runtime,
 * and sets Datadog environment variable `DD_LAMBDA_HANDLER` to the original handler.
 */
function redirectHandlers(funcs, addLayers, customHandler) {
    funcs.forEach((func) => {
        const handler = getDDHandler(func.type, addLayers, customHandler);
        if (handler === undefined) {
            return;
        }
        const funcDef = func.handler;
        if (!(0, layer_1.isFunctionDefinitionHandler)(funcDef)) {
            return;
        }
        setEnvDatadogHandler(funcDef);
        funcDef.handler = handler;
        if (func.handler.package === undefined) {
            func.handler.package = {
                exclude: [],
                include: [],
            };
        }
        if (func.handler.package.include === undefined) {
            func.handler.package.include = [];
        }
    });
}
exports.redirectHandlers = redirectHandlers;
function getDDHandler(lambdaRuntime, addLayers, customHandler) {
    if (lambdaRuntime === undefined) {
        return;
    }
    if (customHandler) {
        return customHandler;
    }
    switch (lambdaRuntime) {
        case layer_1.RuntimeType.NODE:
            return addLayers ? exports.jsHandlerWithLayers : exports.jsHandler;
        case layer_1.RuntimeType.PYTHON:
            return exports.pythonHandler;
    }
}
function setEnvDatadogHandler(func) {
    var _a;
    const originalHandler = func.handler;
    const environment = (_a = func.environment) !== null && _a !== void 0 ? _a : {};
    environment[exports.datadogHandlerEnvVar] = originalHandler;
    func.environment = environment;
}
//# sourceMappingURL=wrapper.js.map