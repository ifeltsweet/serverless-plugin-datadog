"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFunctionDefinitionHandler = exports.pushLayerARN = exports.applyJavaTracingLayer = exports.applyDotnetTracingLayer = exports.applyExtensionLayer = exports.applyLambdaLibraryLayers = exports.findHandlers = exports.armRuntimeKeys = exports.runtimeLookup = exports.DEFAULT_ARCHITECTURE = exports.ARM64_ARCHITECTURE = exports.X86_64_ARCHITECTURE = exports.RuntimeType = void 0;
var RuntimeType;
(function (RuntimeType) {
    RuntimeType[RuntimeType["NODE"] = 0] = "NODE";
    RuntimeType[RuntimeType["PYTHON"] = 1] = "PYTHON";
    RuntimeType[RuntimeType["DOTNET"] = 2] = "DOTNET";
    RuntimeType[RuntimeType["CUSTOM"] = 3] = "CUSTOM";
    RuntimeType[RuntimeType["JAVA"] = 4] = "JAVA";
    RuntimeType[RuntimeType["RUBY"] = 5] = "RUBY";
    RuntimeType[RuntimeType["GO"] = 6] = "GO";
    RuntimeType[RuntimeType["UNSUPPORTED"] = 7] = "UNSUPPORTED";
})(RuntimeType = exports.RuntimeType || (exports.RuntimeType = {}));
exports.X86_64_ARCHITECTURE = "x86_64";
exports.ARM64_ARCHITECTURE = "arm64";
exports.DEFAULT_ARCHITECTURE = exports.X86_64_ARCHITECTURE;
exports.runtimeLookup = {
    "nodejs12.x": RuntimeType.NODE,
    "nodejs14.x": RuntimeType.NODE,
    "nodejs16.x": RuntimeType.NODE,
    "python3.6": RuntimeType.PYTHON,
    "python3.7": RuntimeType.PYTHON,
    "python3.8": RuntimeType.PYTHON,
    "python3.9": RuntimeType.PYTHON,
    "dotnetcore3.1": RuntimeType.DOTNET,
    dotnet6: RuntimeType.DOTNET,
    java11: RuntimeType.JAVA,
    "java8.al2": RuntimeType.JAVA,
    java8: RuntimeType.JAVA,
    "provided.al2": RuntimeType.CUSTOM,
    provided: RuntimeType.CUSTOM,
    "ruby2.7": RuntimeType.RUBY,
    "go1.x": RuntimeType.GO,
};
exports.armRuntimeKeys = {
    "python3.8": "python3.8-arm",
    "python3.9": "python3.9-arm",
    extension: "extension-arm",
};
const dotnetTraceLayerKey = "dotnet";
const javaTraceLayerKey = "java";
function findHandlers(service, exclude, defaultRuntime) {
    return Object.entries(service.functions)
        .map(([name, handler]) => {
        let { runtime } = handler;
        if (runtime === undefined) {
            runtime = defaultRuntime;
        }
        if (runtime !== undefined && runtime in exports.runtimeLookup) {
            return { type: exports.runtimeLookup[runtime], runtime, name, handler };
        }
        return { type: RuntimeType.UNSUPPORTED, runtime, name, handler };
    })
        .filter((result) => result !== undefined)
        .filter((result) => exclude === undefined || (exclude !== undefined && !exclude.includes(result.name)));
}
exports.findHandlers = findHandlers;
function applyLambdaLibraryLayers(service, handlers, layers) {
    var _a, _b;
    const { region } = service.provider;
    const regionRuntimes = layers.regions[region];
    if (regionRuntimes === undefined) {
        return;
    }
    for (const handler of handlers) {
        if (handler.type === RuntimeType.UNSUPPORTED) {
            continue;
        }
        const { runtime } = handler;
        const architecture = (_b = (_a = handler.handler.architecture) !== null && _a !== void 0 ? _a : service.provider.architecture) !== null && _b !== void 0 ? _b : exports.DEFAULT_ARCHITECTURE;
        let runtimeKey = runtime;
        if (architecture === exports.ARM64_ARCHITECTURE && runtime && runtime in exports.armRuntimeKeys) {
            runtimeKey = exports.armRuntimeKeys[runtime];
            removePreviousLayer(service, handler, regionRuntimes[runtime]);
        }
        const lambdaLayerARN = runtimeKey !== undefined ? regionRuntimes[runtimeKey] : undefined;
        if (lambdaLayerARN) {
            addLayer(service, handler, lambdaLayerARN);
        }
    }
}
exports.applyLambdaLibraryLayers = applyLambdaLibraryLayers;
function applyExtensionLayer(service, handlers, layers) {
    var _a, _b;
    const { region } = service.provider;
    const regionRuntimes = layers.regions[region];
    if (regionRuntimes === undefined) {
        return;
    }
    for (const handler of handlers) {
        if (handler.type === RuntimeType.UNSUPPORTED) {
            continue;
        }
        const architecture = (_b = (_a = handler.handler.architecture) !== null && _a !== void 0 ? _a : service.provider.architecture) !== null && _b !== void 0 ? _b : exports.DEFAULT_ARCHITECTURE;
        let extensionLayerARN;
        let extensionLayerKey = "extension";
        if (architecture === exports.ARM64_ARCHITECTURE) {
            removePreviousLayer(service, handler, regionRuntimes[extensionLayerKey]);
            extensionLayerKey = exports.armRuntimeKeys[extensionLayerKey];
        }
        extensionLayerARN = regionRuntimes[extensionLayerKey];
        if (extensionLayerARN) {
            addLayer(service, handler, extensionLayerARN);
        }
    }
}
exports.applyExtensionLayer = applyExtensionLayer;
function applyDotnetTracingLayer(service, handler, layers) {
    const { region } = service.provider;
    const regionRuntimes = layers.regions[region];
    if (regionRuntimes === undefined) {
        return;
    }
    const traceLayerARN = regionRuntimes[dotnetTraceLayerKey];
    if (traceLayerARN) {
        addLayer(service, handler, traceLayerARN);
    }
}
exports.applyDotnetTracingLayer = applyDotnetTracingLayer;
function applyJavaTracingLayer(service, handler, layers) {
    const { region } = service.provider;
    const regionRuntimes = layers.regions[region];
    if (regionRuntimes === undefined) {
        return;
    }
    const traceLayerARN = regionRuntimes[javaTraceLayerKey];
    if (traceLayerARN) {
        addLayer(service, handler, traceLayerARN);
    }
}
exports.applyJavaTracingLayer = applyJavaTracingLayer;
function pushLayerARN(layerARN, currentLayers) {
    const layerSet = new Set(currentLayers);
    layerSet.add(layerARN);
    return Array.from(layerSet);
}
exports.pushLayerARN = pushLayerARN;
function isFunctionDefinitionHandler(funcDef) {
    return typeof funcDef.handler === "string";
}
exports.isFunctionDefinitionHandler = isFunctionDefinitionHandler;
function addLayer(service, handler, layerArn) {
    setLayers(handler, pushLayerARN(layerArn, getLayers(service, handler)));
}
function getLayers(service, handler) {
    const functionLayersList = handler.handler.layers || [];
    const serviceLayersList = service.provider.layers || [];
    // Function-level layers override service-level layers
    // Append to the function-level layers if other function-level layers are present
    // If service-level layers are present
    // Set them at the function level, as our layers are runtime-dependent and could vary
    // between functions in the same project
    if (functionLayersList.length > 0 || serviceLayersList.length === 0) {
        return functionLayersList;
    }
    else {
        return serviceLayersList;
    }
}
function removePreviousLayer(service, handler, previousLayer) {
    let layersList = getLayers(service, handler);
    if (new Set(layersList).has(previousLayer)) {
        layersList = layersList === null || layersList === void 0 ? void 0 : layersList.filter((layer) => layer !== previousLayer);
    }
    setLayers(handler, layersList);
}
function setLayers(handler, layers) {
    handler.handler.layers = layers;
}
//# sourceMappingURL=layer.js.map