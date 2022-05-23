import { MultipartPayload } from "../helpers/upload";
export declare class CommitInfo {
    hash: string;
    remote: string;
    trackedFiles: string[];
    constructor(hash: string, remote: string, trackedFiles: string[]);
    asMultipartPayload(cliVersion: string): MultipartPayload;
    private repositoryPayload;
}
//# sourceMappingURL=interfaces.d.ts.map