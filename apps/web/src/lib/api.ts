import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
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
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    org_name: string;
    user_name: string;
  }) {
    return this.client.post('/auth/register', data);
  }

  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async refresh() {
    return this.client.post('/auth/refresh');
  }

  // Projects
  async getProjects() {
    return this.client.get('/projects');
  }

  async getProject(id: string) {
    return this.client.get(`/projects/${id}`);
  }

  async createProject(data: { name: string; description?: string; team_id?: string }) {
    return this.client.post('/projects', data);
  }

  async updateProject(id: string, data: { name?: string; description?: string; team_id?: string }) {
    return this.client.patch(`/projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.client.delete(`/projects/${id}`);
  }

  // Signals
  async uploadSignals(data: FormData) {
    return this.client.post('/signals/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getSignals(projectId: string, params?: { page?: number; limit?: number; source_type?: string; account_name?: string; from?: string; to?: string }) {
    return this.client.get(`/signals/${projectId}`, { params });
  }

  async getSignal(id: string) {
    return this.client.get(`/signals/${id}`);
  }

  async deleteSignal(id: string) {
    return this.client.delete(`/signals/${id}`);
  }

  // Analysis
  async getAnalysis(projectId: string) {
    return this.client.get(`/analysis/${projectId}`);
  }

  async getAnalysisHistory(projectId: string) {
    return this.client.get(`/analysis/history/${projectId}`);
  }

  async getAnalysisById(id: string) {
    return this.client.get(`/analysis/${id}`);
  }

  async deleteAnalysis(id: string) {
    return this.client.delete(`/analysis/${id}`);
  }

  async getTrace(analysisThemeId: string) {
    return this.client.get(`/trace/${analysisThemeId}`);
  }

  // Synthesis
  async startSynthesis(projectId: string, options?: { signal_limit?: number }) {
    return this.client.post('/synthesize', { project_id: projectId, options });
  }

  async getSynthesisStatus(jobId: string) {
    return this.client.get(`/synthesize/${jobId}`);
  }
}

export const api = new ApiClient();
