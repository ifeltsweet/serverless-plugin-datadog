import * as Serverless from "serverless";
import { FunctionInfo } from "./layer";
/**
 * Builds the CloudFormation Outputs containing the alphanumeric key, description,
 * and value (URL) to the function in Datadog
 */
export declare function addOutputLinks(serverless: Serverless, site: string, handlers: FunctionInfo[]): Promise<void>;
export declare function printOutputs(serverless: Serverless, site: string): Promise<void>;
//# sourceMappingURL=output.d.ts.map