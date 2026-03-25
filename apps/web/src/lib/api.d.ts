declare class ApiClient {
    private client;
    constructor();
    private setupInterceptors;
    register(data: {
        email: string;
        password: string;
        org_name: string;
        user_name: string;
    }): Promise<import("axios").AxiosResponse<any, any, {}>>;
    login(email: string, password: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    refresh(): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getProjects(): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getProject(id: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    createProject(data: {
        name: string;
        description?: string;
        team_id?: string;
    }): Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateProject(id: string, data: {
        name?: string;
        description?: string;
        team_id?: string;
    }): Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteProject(id: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    uploadSignals(data: FormData): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getSignals(projectId: string, params?: {
        page?: number;
        limit?: number;
        source_type?: string;
        account_name?: string;
        from?: string;
        to?: string;
    }): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getSignal(id: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteSignal(id: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAnalysis(projectId: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAnalysisHistory(projectId: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAnalysisById(id: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteAnalysis(id: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getTrace(analysisThemeId: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    startSynthesis(projectId: string, options?: {
        signal_limit?: number;
    }): Promise<import("axios").AxiosResponse<any, any, {}>>;
    getSynthesisStatus(jobId: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
}
export declare const api: ApiClient;
export {};
//# sourceMappingURL=api.d.ts.map