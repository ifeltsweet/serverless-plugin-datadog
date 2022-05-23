import { AxiosError } from "axios";
/** ApiKeyValidator is an helper interface to interpret Datadog error responses and possibly check the
 * validity of the api key.
 */
export interface ApiKeyValidator {
    verifyApiKey(error: AxiosError): Promise<void>;
}
export interface ApiKeyValidatorParams {
    apiKey: string;
    datadogSite: string;
}
export declare const newApiKeyValidator: (params: ApiKeyValidatorParams) => ApiKeyValidator;
//# sourceMappingURL=apikey.d.ts.map