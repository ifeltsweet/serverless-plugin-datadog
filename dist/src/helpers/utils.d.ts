import { AxiosRequestConfig } from "axios";
import ProxyAgent from "proxy-agent";
import type { SpanTags } from "./interfaces";
export declare const pick: <T extends object, K extends keyof T>(base: T, keys: K[]) => Partial<T>;
export declare const getConfig: (configPath: string) => Promise<any>;
declare type ProxyType = "http" | "https" | "socks" | "socks4" | "socks4a" | "socks5" | "socks5h" | "pac+data" | "pac+file" | "pac+ftp" | "pac+http" | "pac+https";
export interface ProxyConfiguration {
    auth?: {
        password: string;
        username: string;
    };
    host?: string;
    port?: number;
    protocol: ProxyType;
}
export declare const getProxyUrl: (options?: ProxyConfiguration | undefined) => string;
export interface RequestOptions {
    apiKey: string;
    appKey?: string;
    baseUrl: string;
    headers?: Map<string, string>;
    overrideUrl?: string;
    proxyOpts?: ProxyConfiguration;
}
export declare const getRequestBuilder: (options: RequestOptions) => (args: AxiosRequestConfig) => import("axios").AxiosPromise<any>;
export declare const getProxyAgent: (proxyOpts?: ProxyConfiguration | undefined) => ReturnType<typeof ProxyAgent>;
export declare const getApiHostForSite: (site: string) => string;
export declare const buildPath: (...args: string[]) => string;
export declare const removeEmptyValues: (tags: SpanTags) => {};
export {};
//# sourceMappingURL=utils.d.ts.map