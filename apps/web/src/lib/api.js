"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
class ApiClient {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        this.client.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        const response = await this.client.post('/auth/refresh', {
                            refresh_token: refreshToken,
                        });
                        const { access_token } = response.data;
                        localStorage.setItem('access_token', access_token);
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                        return this.client(originalRequest);
                    }
                }
                catch (refreshError) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        });
    }
    // Auth
    async register(data) {
        return this.client.post('/auth/register', data);
    }
    async login(email, password) {
        return this.client.post('/auth/login', { email, password });
    }
    async refresh() {
        return this.client.post('/auth/refresh');
    }
    // Projects
    async getProjects() {
        return this.client.get('/projects');
    }
    async getProject(id) {
        return this.client.get(`/projects/${id}`);
    }
    async createProject(data) {
        return this.client.post('/projects', data);
    }
    async updateProject(id, data) {
        return this.client.patch(`/projects/${id}`, data);
    }
    async deleteProject(id) {
        return this.client.delete(`/projects/${id}`);
    }
    // Signals
    async uploadSignals(data) {
        return this.client.post('/signals/upload', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    }
    async getSignals(projectId, params) {
        return this.client.get(`/signals/${projectId}`, { params });
    }
    async getSignal(id) {
        return this.client.get(`/signals/${id}`);
    }
    async deleteSignal(id) {
        return this.client.delete(`/signals/${id}`);
    }
    // Analysis
    async getAnalysis(projectId) {
        return this.client.get(`/analysis/${projectId}`);
    }
    async getAnalysisHistory(projectId) {
        return this.client.get(`/analysis/history/${projectId}`);
    }
    async getAnalysisById(id) {
        return this.client.get(`/analysis/${id}`);
    }
    async deleteAnalysis(id) {
        return this.client.delete(`/analysis/${id}`);
    }
    async getTrace(analysisThemeId) {
        return this.client.get(`/trace/${analysisThemeId}`);
    }
    // Synthesis
    async startSynthesis(projectId, options) {
        return this.client.post('/synthesize', { project_id: projectId, options });
    }
    async getSynthesisStatus(jobId) {
        return this.client.get(`/synthesize/${jobId}`);
    }
}
exports.api = new ApiClient();
//# sourceMappingURL=api.js.map