import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Dashboard API
export const dashboardApi = {
  getMetrics: () => api.get('/dashboard/metrics'),
  getTrends: (days = 30) => api.get(`/dashboard/trends?days=${days}`),
  getHealth: () => api.get('/dashboard/health'),
};

// Test Results API
export const testResultsApi = {
  getRecent: (days = 7) => api.get(`/test-results/recent?days=${days}`),
  getByDateRange: (start, end) => api.get(`/test-results/date-range?start=${start}&end=${end}`),
  getByType: (testType, start, end) => api.get(`/test-results/by-type?testType=${testType}&start=${start}&end=${end}`),
  getMetrics: (days = 7) => api.get(`/test-results/metrics?days=${days}`),
  sync: (days = 7) => api.post(`/test-results/sync?days=${days}`),
};

// Bugs API
export const bugsApi = {
  getProjects: () => api.get('/bugs/projects'),
  getRecent: (days = 7, project = null) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (project && project !== 'ALL') {
      params.append('project', project);
    }
    return api.get(`/bugs/recent?${params.toString()}`);
  },
  getByStatus: () => api.get('/bugs/by-status'),
  getByProject: (projectKey) => api.get(`/bugs/by-project?projectKey=${projectKey}`),
  getMetrics: (days = 30, project = null) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (project && project !== 'ALL') {
      params.append('project', project);
    }
    return api.get(`/bugs/metrics?${params.toString()}`);
  },
  sync: (days = 7) => api.post(`/bugs/sync?days=${days}`),
};

// Services API
export const servicesApi = {
  getAll: () => api.get('/services'),
  getWithTestCoverage: () => api.get('/services/test-coverage'),
  getMetrics: () => api.get('/services/metrics'),
  sync: () => api.post('/services/sync'),
};

// Repositories API
export const repositoriesApi = {
  getAll: () => api.get('/repositories'),
  getMetrics: () => api.get('/repositories/metrics'),
  getRecentCommits: (days = 14) => api.get(`/repositories/recent-commits?days=${days}`),
  sync: () => api.post('/repositories/sync'),
};

export default api;