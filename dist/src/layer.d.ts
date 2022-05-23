import { FunctionDefinition, FunctionDefinitionHandler } from "serverless";
import Service from "serverless/classes/Service";
export declare enum RuntimeType {
    NODE = 0,
    PYTHON = 1,
    DOTNET = 2,
    CUSTOM = 3,
    JAVA = 4,
    RUBY = 5,
    GO = 6,
    UNSUPPORTED = 7
}
export interface FunctionInfo {
    name: string;
    type: RuntimeType;
    handler: ExtendedFunctionDefinition;
    runtime?: string;
}
export declare const X86_64_ARCHITECTURE = "x86_64";
export declare const ARM64_ARCHITECTURE = "arm64";
export declare const DEFAULT_ARCHITECTURE = "x86_64";
export interface ExtendedFunctionDefinition extends FunctionDefinition {
    architecture?: string;
}
export interface LayerJSON {
    regions: {
        [region: string]: {
            [runtime: string]: string | undefined;
        } | undefined;
    };
}
export declare const runtimeLookup: {
    [key: string]: RuntimeType;
};
export declare const armRuntimeKeys: {
    [key: string]: string;
};
export declare function findHandlers(service: Service, exclude: string[], defaultRuntime?: string): FunctionInfo[];
export declare function applyLambdaLibraryLayers(service: Service, handlers: FunctionInfo[], layers: LayerJSON): void;
export declare function applyExtensionLayer(service: Service, handlers: FunctionInfo[], layers: LayerJSON): void;
export declare function applyDotnetTracingLayer(service: Service, handler: FunctionInfo, layers: LayerJSON): void;
export declare function applyJavaTracingLayer(service: Service, handler: FunctionInfo, layers: LayerJSON): void;
export declare function pushLayerARN(layerARN: string, currentLayers: string[]): string[];
export declare function isFunctionDefinitionHandler(funcDef: FunctionDefinition): funcDef is FunctionDefinitionHandler;
//# sourceMappingURL=layer.d.ts.map