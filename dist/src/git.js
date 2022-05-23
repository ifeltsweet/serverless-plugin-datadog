"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getCommitInfo = exports.gitTrackedFiles = exports.stripCredentials = exports.gitRemote = exports.newSimpleGit = void 0;
const simpleGit = __importStar(require("simple-git"));
const url_1 = require("url");
const interfaces_1 = require("./git-metadata/interfaces");
// Returns a configured SimpleGit.
const newSimpleGit = () => __awaiter(void 0, void 0, void 0, function* () {
    const options = {
        baseDir: process.cwd(),
        binary: "git",
        maxConcurrentProcesses: 1,
    };
    try {
        // Attempt to set the baseDir to the root of the repository so the 'git ls-files' command
        // returns the tracked files paths relative to the root of the repository.
        const git = simpleGit.gitP(options);
        const root = yield git.revparse("--show-toplevel");
        options.baseDir = root;
    }
    catch (_a) {
        return undefined;
    }
    return simpleGit.gitP(options);
});
exports.newSimpleGit = newSimpleGit;
// Returns the remote of the current repository.
const gitRemote = (git) => __awaiter(void 0, void 0, void 0, function* () {
    const remotes = yield git.getRemotes(true);
    if (remotes.length === 0) {
        throw new Error("No git remotes available");
    }
    for (const remote of remotes) {
        // We're trying to pick the remote called with the default git name 'origin'.
        if (remote.name === "origin") {
            return (0, exports.stripCredentials)(remote.refs.push);
        }
    }
    // Falling back to picking the first remote in the list if 'origin' is not found.
    return (0, exports.stripCredentials)(remotes[0].refs.push);
});
exports.gitRemote = gitRemote;
// StripCredentials removes credentials from a remote HTTP url.
const stripCredentials = (remote) => {
    try {
        const url = new url_1.URL(remote);
        url.username = "";
        url.password = "";
        return url.toString();
    }
    catch (_a) {
        return remote;
    }
};
exports.stripCredentials = stripCredentials;
// Returns the hash of the current repository.
const gitHash = (git) => __awaiter(void 0, void 0, void 0, function* () { return git.revparse("HEAD"); });
// Returns the tracked files of the current repository.
const gitTrackedFiles = (git) => __awaiter(void 0, void 0, void 0, function* () {
    const files = yield git.raw("ls-files");
    return files.split(/\r\n|\r|\n/).filter((s) => s !== "");
});
exports.gitTrackedFiles = gitTrackedFiles;
// Returns the current hash, remote URL and tracked files paths.
const getCommitInfo = (git, repositoryURL) => __awaiter(void 0, void 0, void 0, function* () {
    // Invoke git commands to retrieve the remote, hash and tracked files.
    // We're using Promise.all instead of Promive.allSettled since we want to fail early if
    // any of the promises fails.
    let remote;
    let hash;
    let trackedFiles;
    try {
        if (repositoryURL) {
            [hash, trackedFiles] = yield Promise.all([gitHash(git), (0, exports.gitTrackedFiles)(git)]);
            remote = repositoryURL;
        }
        else {
            [remote, hash, trackedFiles] = yield Promise.all([(0, exports.gitRemote)(git), gitHash(git), (0, exports.gitTrackedFiles)(git)]);
        }
    }
    catch (e) {
        throw e;
    }
    return new interfaces_1.CommitInfo(hash, remote, trackedFiles);
});
exports.getCommitInfo = getCommitInfo;
//# sourceMappingURL=git.js.map