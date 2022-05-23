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
exports.removeEmptyValues = exports.buildPath = exports.getApiHostForSite = exports.getProxyAgent = exports.getRequestBuilder = exports.getProxyUrl = exports.getConfig = exports.pick = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const proxy_agent_1 = __importDefault(require("proxy-agent"));
const util_1 = require("util");
const pick = (base, keys) => {
    const definedKeys = keys.filter((key) => !!base[key]);
    const pickedObject = {};
    for (const key of definedKeys) {
        pickedObject[key] = base[key];
    }
    return pickedObject;
};
exports.pick = pick;
const getConfig = (configPath) => __awaiter(void 0, void 0, void 0, function* () {
    const configFile = yield (0, util_1.promisify)(fs_1.default.readFile)(configPath, "utf-8");
    return JSON.parse(configFile);
});
exports.getConfig = getConfig;
const getProxyUrl = (options) => {
    if (!options) {
        return "";
    }
    const { auth, host, port, protocol } = options;
    if (!host || !port) {
        return "";
    }
    const authFragment = auth ? `${auth.username}:${auth.password}@` : "";
    return `${protocol}://${authFragment}${host}:${port}`;
};
exports.getProxyUrl = getProxyUrl;
const getRequestBuilder = (options) => {
    const { apiKey, appKey, baseUrl, overrideUrl, proxyOpts } = options;
    const overrideArgs = (args) => {
        const newArguments = Object.assign(Object.assign({}, args), { headers: Object.assign(Object.assign({ "DD-API-KEY": apiKey }, (appKey ? { "DD-APPLICATION-KEY": appKey } : {})), args.headers) });
        if (overrideUrl !== undefined) {
            newArguments.url = overrideUrl;
        }
        const proxyAgent = (0, exports.getProxyAgent)(proxyOpts);
        if (proxyAgent) {
            newArguments.httpAgent = proxyAgent;
            newArguments.httpsAgent = proxyAgent;
        }
        if (options.headers !== undefined) {
            options.headers.forEach((value, key) => {
                newArguments.headers[key] = value;
            });
        }
        return newArguments;
    };
    const baseConfiguration = {
        baseURL: baseUrl,
        // Disabling proxy in Axios config as it's not working properly
        // the passed httpAgent/httpsAgent are handling the proxy instead.
        proxy: false,
    };
    return (args) => axios_1.default.create(baseConfiguration)(overrideArgs(args));
};
exports.getRequestBuilder = getRequestBuilder;
const getProxyAgent = (proxyOpts) => {
    const proxyUrlFromConfiguration = (0, exports.getProxyUrl)(proxyOpts);
    return new proxy_agent_1.default(proxyUrlFromConfiguration);
};
exports.getProxyAgent = getProxyAgent;
const getApiHostForSite = (site) => {
    switch (site) {
        case "datad0g.com":
            return `app.${site}`;
        case "datadoghq.com":
        case "datadoghq.eu":
        default:
            return `api.${site}`;
    }
};
exports.getApiHostForSite = getApiHostForSite;
// The buildPath function is used to concatenate several paths. The goal is to have a function working for both unix
// paths and URL whereas standard path.join does not work with both.
const buildPath = (...args) => args
    .map((part, i) => {
    if (i === 0) {
        // For the first part, drop all / at the end of the path
        return part.trim().replace(/[\/]*$/g, "");
    }
    else {
        // For the following parts, remove all / at the beginning and at the end
        return part.trim().replace(/(^[\/]*|[\/]*$)/g, "");
    }
})
    // Filter out emtpy parts
    .filter((x) => x.length)
    // Join all these parts with /
    .join("/");
exports.buildPath = buildPath;
const removeEmptyValues = (tags) => Object.keys(tags).reduce((filteredTags, tag) => {
    if (!tags[tag]) {
        return filteredTags;
    }
    return Object.assign(Object.assign({}, filteredTags), { [tag]: tags[tag] });
}, {});
exports.removeEmptyValues = removeEmptyValues;
//# sourceMappingURL=utils.js.map