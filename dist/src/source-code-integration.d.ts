import { SimpleGit } from "simple-git";
export declare class SourceCodeIntegration {
    repositoryURL?: string;
    private apiKey;
    private datadogSite;
    private simpleGit;
    constructor(apiKey: string, datadogSite: string, simpleGit: SimpleGit, repositoryURL?: string);
    uploadGitMetadata(): Promise<string>;
    private getRequestBuilder;
    private uploadRepository;
}
//# sourceMappingURL=source-code-integration.d.ts.map