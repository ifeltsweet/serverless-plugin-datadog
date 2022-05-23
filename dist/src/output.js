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
exports.printOutputs = exports.addOutputLinks = void 0;
const yellowFont = "\x1b[33m";
const underlineFont = "\x1b[4m";
const endFont = "\x1b[0m";
const outputPrefix = "DatadogMonitor";
/**
 * Builds the CloudFormation Outputs containing the alphanumeric key, description,
 * and value (URL) to the function in Datadog
 */
function addOutputLinks(serverless, site, handlers) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const awsAccount = yield serverless.getProvider("aws").getAccountId();
        const region = serverless.service.provider.region;
        const outputs = (_a = serverless.service.provider.compiledCloudFormationTemplate) === null || _a === void 0 ? void 0 : _a.Outputs;
        if (outputs === undefined) {
            return;
        }
        handlers.forEach(({ name, handler }) => {
            const functionName = handler.name;
            const key = `${outputPrefix}${name}`.replace(/[^a-z0-9]/gi, "");
            outputs[key] = {
                Description: `See ${name} in Datadog`,
                Value: `https://app.${site}/functions/${functionName}:${region}:${awsAccount}:aws?source=sls-plugin`,
            };
        });
    });
}
exports.addOutputLinks = addOutputLinks;
function printOutputs(serverless, site) {
    return __awaiter(this, void 0, void 0, function* () {
        const stackName = serverless.getProvider("aws").naming.getStackName();
        const service = serverless.service.getServiceName();
        const env = serverless.getProvider("aws").getStage();
        const describeStackOutput = yield serverless
            .getProvider("aws")
            .request("CloudFormation", "describeStacks", { StackName: stackName }, { region: serverless.getProvider("aws").getRegion() })
            .catch(() => {
            // Ignore any request exceptions, fail silently and skip output logging
        });
        if (describeStackOutput === undefined) {
            return;
        }
        logHeader("Datadog Monitoring", true);
        logHeader("functions");
        for (const output of describeStackOutput.Stacks[0].Outputs) {
            if (output.OutputKey.startsWith(outputPrefix)) {
                const key = output.OutputKey.substring(outputPrefix.length);
                logMessage(`${key}: ${output.OutputValue}`);
            }
        }
        logHeader("View Serverless Monitors", true);
        logMessage(`https://app.${site}/monitors/manage?q=tag%3A%28%22env%3A${env}%22AND%22service%3A${service}%22%29`);
    });
}
exports.printOutputs = printOutputs;
function logHeader(message, underline = false) {
    const startFont = underline ? `${yellowFont}${underlineFont}` : `${yellowFont}`;
    console.log(`${startFont}${message}${endFont}`);
}
function logMessage(message) {
    console.log(`  ${message}`);
}
//# sourceMappingURL=output.js.map