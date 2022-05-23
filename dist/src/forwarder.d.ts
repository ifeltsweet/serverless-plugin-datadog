import Service from "serverless/classes/Service";
import { FunctionInfo } from "./layer";
import Aws = require("serverless/plugins/aws/provider/awsProvider");
interface ForwarderConfigs {
    AddExtension: boolean;
    IntegrationTesting: boolean | undefined;
    SubToAccessLogGroups: boolean;
    SubToExecutionLogGroups: boolean;
}
declare type SubLogsConfig = boolean | {
    accessLogging: boolean | undefined;
    executionLogging: boolean | undefined;
} | undefined;
declare type LogsConfig = {
    restApi: SubLogsConfig;
    httpApi: SubLogsConfig;
    websocket: SubLogsConfig;
} | undefined;
export interface CloudFormationObjectArn {
    "Fn::Sub"?: string;
    "arn:aws"?: string;
}
export declare function addExecutionLogGroupsAndSubscriptions(service: Service, aws: Aws, functionArn: CloudFormationObjectArn | string): Promise<void>;
export declare function addCloudWatchForwarderSubscriptions(service: Service, aws: Aws, functionArn: CloudFormationObjectArn | string, forwarderConfigs: ForwarderConfigs, handlers: FunctionInfo[]): Promise<string[]>;
export declare function canSubscribeLogGroup(aws: Aws, logGroupName: string, expectedSubName: string): Promise<boolean>;
export declare function describeSubscriptionFilters(aws: Aws, logGroupName: string): Promise<{
    creationTime: number;
    destinationArn: string;
    distribution: string;
    filterName: string;
    filterPattern: string;
    logGroupName: string;
    roleArn: string;
}[]>;
export declare function isLogsConfig(obj: any): obj is LogsConfig;
export {};
//# sourceMappingURL=forwarder.d.ts.map