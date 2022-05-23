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
exports.retryRequest = void 0;
const async_retry_1 = __importDefault(require("async-retry"));
const errorCodesNoRetry = [400, 403, 413];
const retryRequest = (requestPerformer, retryOpts) => __awaiter(void 0, void 0, void 0, function* () {
    // Request function, passed to async-retry
    const doRequest = (bail) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield requestPerformer();
        }
        catch (error) {
            if (error.response && errorCodesNoRetry.includes(error.response.status)) {
                // If it's an axios error with a status code that is excluded from retries, we bail to avoid retrying
                bail(error);
                return;
            }
            // Other cases are retried: other axios HTTP errors as well as
            // non-axios errors such as DNS resolution errors and connection timeouts
            throw error;
        }
    });
    // Do the actual call
    return (0, async_retry_1.default)(doRequest, retryOpts);
});
exports.retryRequest = retryRequest;
//# sourceMappingURL=retry.js.map