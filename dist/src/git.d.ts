import * as simpleGit from "simple-git";
import { CommitInfo } from "./git-metadata/interfaces";
export declare const newSimpleGit: () => Promise<simpleGit.SimpleGit | undefined>;
export declare const gitRemote: (git: simpleGit.SimpleGit) => Promise<string>;
export declare const stripCredentials: (remote: string) => string;
export declare const gitTrackedFiles: (git: simpleGit.SimpleGit) => Promise<string[]>;
export declare const getCommitInfo: (git: simpleGit.SimpleGit, repositoryURL?: string | undefined) => Promise<CommitInfo | undefined>;
//# sourceMappingURL=git.d.ts.map