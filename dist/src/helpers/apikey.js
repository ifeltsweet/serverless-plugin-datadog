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
exports.newApiKeyValidator = void 0;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const errors_1 = require("./errors");
const newApiKeyValidator = (params) => new ApiKeyValidatorImplem(params.apiKey, params.datadogSite);
exports.newApiKeyValidator = newApiKeyValidator;
/** ApiKeyValidator is an helper class to interpret Datadog error responses and possibly check the
 * validity of the api key.
 */
class ApiKeyValidatorImplem {
    constructor(apiKey, datadogSite) {
        this.apiKey = apiKey;
        this.datadogSite = datadogSite;
    }
    /** Check if an API key is valid, based on the Axios error and defaulting to verify the API key
     * through Datadog's API for ambiguous cases.
     * An exception is raised when the API key is invalid.
     * Callers should catch the exception to display it nicely.
     */
    verifyApiKey(error) {
        return __awaiter(this, void 0, void 0, function* () {
            if (error.response === undefined) {
                return;
            }
            if (error.response.status === 403 || (error.response.status === 400 && !(yield this.isApiKeyValid()))) {
                throw new errors_1.InvalidConfigurationError(`${chalk_1.default.red.bold("DATADOG_API_KEY")} does not contain a valid API key for Datadog site ${this.datadogSite}`);
            }
        });
    }
    getApiKeyValidationURL() {
        return `https://api.${this.datadogSite}/api/v1/validate`;
    }
    isApiKeyValid() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isValid === undefined) {
                this.isValid = yield this.validateApiKey();
            }
            return this.isValid;
        });
    }
    validateApiKey() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(this.getApiKeyValidationURL(), {
                    headers: {
                        "DD-API-KEY": this.apiKey,
                    },
                });
                return response.data.valid;
            }
            catch (error) {
                if (error.response && error.response.status === 403) {
                    return false;
                }
                throw error;
            }
        });
    }
}
//# sourceMappingURL=apikey.js.map