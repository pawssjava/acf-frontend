import axios from 'axios';

export const BASE_URL = 'http://localhost:9002';

export const publicClient = axios.create({ baseURL: BASE_URL });

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function flushQueue(token: string | null, err: unknown) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    const storedRefresh = localStorage.getItem('refresh_token');
    if (!storedRefresh) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await publicClient.post('/api/auth/refresh', { refreshToken: storedRefresh });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      apiClient.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
      flushQueue(data.access_token, null);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(original);
    } catch (refreshErr) {
      flushQueue(null, refreshErr);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
