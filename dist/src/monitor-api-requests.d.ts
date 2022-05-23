import { Response } from "node-fetch";
import * as Serverless from "serverless";
import { MonitorParams } from "./monitors";
export declare class InvalidAuthenticationError extends Error {
    constructor(message: string);
}
interface QueriedMonitor {
    query: string;
    id: number;
    name: string;
    tags: string[];
}
export declare function createMonitor(site: string, monitorParams: MonitorParams, monitorsApiKey: string, monitorsAppKey: string): Promise<Response>;
export declare function updateMonitor(site: string, monitorId: number, monitorParams: MonitorParams, monitorsApiKey: string, monitorsAppKey: string): Promise<Response>;
export declare function deleteMonitor(site: string, monitorId: number, monitorsApiKey: string, monitorsAppKey: string): Promise<Response>;
export declare function searchMonitors(site: string, queryTag: string, monitorsApiKey: string, monitorsAppKey: string): Promise<QueriedMonitor[]>;
export declare function getCloudFormationStackId(serverless: Serverless): Promise<string>;
export declare function getExistingMonitors(site: string, cloudFormationStackId: string, monitorsApiKey: string, monitorsAppKey: string): Promise<{
    [key: string]: number;
}>;
export {};
//# sourceMappingURL=monitor-api-requests.d.ts.map