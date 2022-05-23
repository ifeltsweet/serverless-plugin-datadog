"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitInfo = void 0;
class CommitInfo {
    constructor(hash, remote, trackedFiles) {
        this.repositoryPayload = () => JSON.stringify({
            data: [
                {
                    files: this.trackedFiles,
                    hash: this.hash,
                    repository_url: this.remote,
                },
            ],
            // Make sure to update the version if the format of the JSON payloads changes in any way.
            version: 1,
        });
        this.hash = hash;
        this.remote = remote;
        this.trackedFiles = trackedFiles;
    }
    asMultipartPayload(cliVersion) {
        return {
            content: new Map([
                ["cli_version", { value: cliVersion }],
                ["type", { value: "repository" }],
                [
                    "repository",
                    {
                        options: {
                            contentType: "application/json",
                            filename: "repository",
                        },
                        value: this.repositoryPayload(),
                    },
                ],
                ["git_repository_url", { value: this.remote }],
                ["git_commit_sha", { value: this.hash }],
            ]),
        };
    }
}
exports.CommitInfo = CommitInfo;
//# sourceMappingURL=interfaces.js.map