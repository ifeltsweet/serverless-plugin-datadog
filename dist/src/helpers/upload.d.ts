/// <reference types="node" />
import FormData from "form-data";
import { ReadStream } from "fs";
import { ApiKeyValidator } from "./apikey";
import { RequestBuilder } from "./interfaces";
/** Multipart payload destined to be sent to Datadog's API
 */
export interface MultipartPayload {
    content: Map<string, MultipartValue>;
}
export interface MultipartValue {
    options?: FormData.AppendOptions | string;
    value: string | ReadStream;
}
export interface UploadOptions {
    /** ApiKeyValidator (optional) throws an InvalidConfigurationException when upload fails because
     * of an invalid API key. Callers should most likely catch this exception and display it as a
     * nice error message.
     */
    apiKeyValidator?: ApiKeyValidator;
    /** Retries is the amount of upload retries before giving up. Some requests are never retried
     * (400, 413).
     */
    retries: number;
    /** Callback when upload fails (retries are not considered as failure)
     */
    onError(error: Error): void;
    /** Callback to execute before retries
     */
    onRetry(error: Error, attempts: number): void;
    /** Callback to execute before upload.
     */
    onUpload(): void;
}
export declare enum UploadStatus {
    Success = 0,
    Failure = 1,
    Skipped = 2
}
/** Upload a MultipartPayload to Datadog's API using the provided RequestBuilder.
 * This handles retries as well as logging information about upload if a logger is provided in
 * the options
 */
export declare const upload: (requestBuilder: RequestBuilder) => (payload: MultipartPayload, opts: UploadOptions) => Promise<UploadStatus>;
//# sourceMappingURL=upload.d.ts.map