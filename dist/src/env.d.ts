import Service from "serverless/classes/Service";
import { FunctionInfo } from "./layer";
export interface Configuration {
    enabled?: boolean;
    addLayers: boolean;
    apiKey?: string;
    appKey?: string;
    monitorsApiKey?: string;
    monitorsAppKey?: string;
    apiKeySecretArn?: string;
    apiKMSKey?: string;
    captureLambdaPayload?: boolean;
    site: string;
    logLevel: string | undefined;
    flushMetricsToLogs: boolean;
    enableXrayTracing: boolean;
    enableDDTracing: boolean;
    enableDDLogs: boolean;
    addExtension: boolean;
    forwarderArn?: string;
    forwarder?: string;
    integrationTesting?: boolean;
    enableTags: boolean;
    injectLogContext: boolean;
    enableSourceCodeIntegration: boolean;
    exclude: string[];
    monitors?: {
        [id: string]: {
            [key: string]: any;
        };
    }[];
    failOnError: boolean;
    subscribeToAccessLogs: boolean;
    subscribeToExecutionLogs: boolean;
    customHandler?: string;
}
export declare const ddServiceEnvVar = "DD_SERVICE";
export declare const ddEnvEnvVar = "DD_ENV";
export declare const ddVersionEnvVar = "DD_VERSION";
export declare const ddTagsEnvVar = "DD_TAGS";
export declare const defaultConfiguration: Configuration;
export declare function setEnvConfiguration(config: Configuration, handlers: FunctionInfo[]): void;
export declare function getConfig(service: Service): Configuration;
export declare function forceExcludeDepsFromWebpack(service: Service): void;
export declare function hasWebpackPlugin(service: Service): boolean;
//# sourceMappingURL=env.d.ts.map