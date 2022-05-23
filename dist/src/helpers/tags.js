"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTags = exports.SPAN_TYPE = exports.GIT_TAG = exports.GIT_SHA = exports.GIT_COMMIT_MESSAGE = exports.GIT_COMMIT_COMMITTER_NAME = exports.GIT_COMMIT_COMMITTER_EMAIL = exports.GIT_COMMIT_COMMITTER_DATE = exports.GIT_COMMIT_AUTHOR_NAME = exports.GIT_COMMIT_AUTHOR_EMAIL = exports.GIT_COMMIT_AUTHOR_DATE = exports.GIT_BRANCH = exports.CI_BUILD_LEVEL = exports.CI_LEVEL = exports.CI_STAGE_NAME = exports.CI_JOB_NAME = exports.CI_JOB_URL = exports.GIT_REPOSITORY_URL = exports.CI_WORKSPACE_PATH = exports.CI_PIPELINE_NUMBER = exports.CI_PIPELINE_NAME = exports.CI_PIPELINE_ID = exports.CI_PROVIDER_NAME = exports.CI_PIPELINE_URL = void 0;
// Build
exports.CI_PIPELINE_URL = "ci.pipeline.url";
exports.CI_PROVIDER_NAME = "ci.provider.name";
exports.CI_PIPELINE_ID = "ci.pipeline.id";
exports.CI_PIPELINE_NAME = "ci.pipeline.name";
exports.CI_PIPELINE_NUMBER = "ci.pipeline.number";
exports.CI_WORKSPACE_PATH = "ci.workspace_path";
exports.GIT_REPOSITORY_URL = "git.repository_url";
exports.CI_JOB_URL = "ci.job.url";
exports.CI_JOB_NAME = "ci.job.name";
exports.CI_STAGE_NAME = "ci.stage.name";
exports.CI_LEVEL = "_dd.ci.level";
// @deprecated TODO: remove this once backend is updated
exports.CI_BUILD_LEVEL = "_dd.ci.build_level";
// Git
exports.GIT_BRANCH = "git.branch";
exports.GIT_COMMIT_AUTHOR_DATE = "git.commit.author.date";
exports.GIT_COMMIT_AUTHOR_EMAIL = "git.commit.author.email";
exports.GIT_COMMIT_AUTHOR_NAME = "git.commit.author.name";
exports.GIT_COMMIT_COMMITTER_DATE = "git.commit.committer.date";
exports.GIT_COMMIT_COMMITTER_EMAIL = "git.commit.committer.email";
exports.GIT_COMMIT_COMMITTER_NAME = "git.commit.committer.name";
exports.GIT_COMMIT_MESSAGE = "git.commit.message";
exports.GIT_SHA = "git.commit.sha";
exports.GIT_TAG = "git.tag";
// General
exports.SPAN_TYPE = "span.type";
/**
 * Receives an array of the form ['key:value', 'key2:value2']
 * and returns an object of the form {key: 'value', key2: 'value2'}
 */
const parseTags = (tags) => {
    try {
        return tags.reduce((acc, keyValuePair) => {
            if (!keyValuePair.includes(":")) {
                return acc;
            }
            const [key, value] = keyValuePair.split(":");
            return Object.assign(Object.assign({}, acc), { [key]: value });
        }, {});
    }
    catch (e) {
        return {};
    }
};
exports.parseTags = parseTags;
//# sourceMappingURL=tags.js.map