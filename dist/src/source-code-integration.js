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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceCodeIntegration = void 0;
const package_json_1 = require("../package.json");
const git_1 = require("./git");
const apikey_1 = require("./helpers/apikey");
const errors_1 = require("./helpers/errors");
const upload_1 = require("./helpers/upload");
const utils_1 = require("./helpers/utils");
class SourceCodeIntegration {
    constructor(apiKey, datadogSite, simpleGit, repositoryURL) {
        this.apiKey = apiKey;
        this.datadogSite = datadogSite;
        this.simpleGit = simpleGit;
        this.repositoryURL = repositoryURL;
    }
    uploadGitMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            const apiKeyValidator = (0, apikey_1.newApiKeyValidator)({
                apiKey: this.apiKey,
                datadogSite: this.datadogSite,
            });
            const payload = yield (0, git_1.getCommitInfo)(this.simpleGit, this.repositoryURL);
            if (payload === undefined) {
                throw Error("Couldn't get git commit information.");
            }
            try {
                const requestBuilder = this.getRequestBuilder();
                const status = yield this.uploadRepository(requestBuilder)(payload, {
                    apiKeyValidator,
                    onError: (e) => {
                        throw e;
                    },
                    onRetry: (_) => { },
                    onUpload: () => {
                        return;
                    },
                    retries: 5,
                });
                if (status !== upload_1.UploadStatus.Success) {
                    throw new Error("Error uploading commit information.");
                }
                return payload.hash;
            }
            catch (error) {
                throw error;
            }
        });
    }
    getRequestBuilder() {
        if (!this.apiKey) {
            throw new errors_1.InvalidConfigurationError("Missing DATADOG_API_KEY in your environment.");
        }
        return (0, utils_1.getRequestBuilder)({
            apiKey: this.apiKey,
            baseUrl: "https://sourcemap-intake." + this.datadogSite,
        });
    }
    uploadRepository(requestBuilder) {
        return (commitInfo, opts) => __awaiter(this, void 0, void 0, function* () {
            const payload = commitInfo.asMultipartPayload(`serverless-plugin-datadog-${package_json_1.version}`);
            return (0, upload_1.upload)(requestBuilder)(payload, opts);
        });
    }
}
exports.SourceCodeIntegration = SourceCodeIntegration;
//# sourceMappingURL=source-code-integration.js.map