"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.UploadStatus = void 0;
const form_data_1 = __importDefault(require("form-data"));
const retry_1 = require("./retry");
var UploadStatus;
(function (UploadStatus) {
    UploadStatus[UploadStatus["Success"] = 0] = "Success";
    UploadStatus[UploadStatus["Failure"] = 1] = "Failure";
    UploadStatus[UploadStatus["Skipped"] = 2] = "Skipped";
})(UploadStatus = exports.UploadStatus || (exports.UploadStatus = {}));
/** Upload a MultipartPayload to Datadog's API using the provided RequestBuilder.
 * This handles retries as well as logging information about upload if a logger is provided in
 * the options
 */
const upload = (requestBuilder) => (payload, opts) => __awaiter(void 0, void 0, void 0, function* () {
    opts.onUpload();
    try {
        yield (0, retry_1.retryRequest)(() => uploadMultipart(requestBuilder, payload), {
            onRetry: opts.onRetry,
            retries: opts.retries,
        });
        return UploadStatus.Success;
    }
    catch (error) {
        if (opts.apiKeyValidator) {
            // Raise an exception in case of invalid API key
            yield opts.apiKeyValidator.verifyApiKey(error);
        }
        if (error.response && error.response.statusText) {
            // Rewrite error to have formatted error string
            opts.onError(new Error(`${error.message} (${error.response.statusText})`));
        }
        else {
            // Default error handling
            opts.onError(error);
        }
        return UploadStatus.Failure;
    }
});
exports.upload = upload;
// Dependency follows-redirects sets a default maxBodyLength of 10 MB https://github.com/follow-redirects/follow-redirects/blob/b774a77e582b97174813b3eaeb86931becba69db/index.js#L391
// We don't want any hard limit enforced by the CLI, the backend will enforce a max size by returning 413 errors.
const maxBodyLength = Infinity;
const uploadMultipart = (request, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const form = new form_data_1.default();
    payload.content.forEach((value, key) => {
        form.append(key, value.value, value.options);
    });
    return request({
        data: form,
        headers: form.getHeaders(),
        maxBodyLength,
        method: "POST",
        url: "v1/input",
    });
});
//# sourceMappingURL=upload.js.map