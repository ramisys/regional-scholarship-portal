import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { startGlobalLoading, stopGlobalLoading } from '../components/loading';
import { getAccessToken, setAccessToken, clearAccessToken } from './authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type LoadingConfig = InternalAxiosRequestConfig & {
  _skipGlobalLoading?: boolean;
  _deferGlobalLoadingStop?: boolean;
  _retry?: boolean;
};

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const clearAuthStorage = () => {
  clearAccessToken();
  localStorage.removeItem('user');
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

api.interceptors.request.use(
  (config: LoadingConfig) => {
    if (!config._skipGlobalLoading) {
      startGlobalLoading();
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const loadingConfig = response.config as LoadingConfig;
    if (!loadingConfig._skipGlobalLoading && !loadingConfig._deferGlobalLoadingStop) {
      stopGlobalLoading();
    }
    return response;
  },
  async (error: AxiosError) => {
    const loadingConfig = (error.config || {}) as LoadingConfig;
    const status = error.response?.status;

    if (status === 401 && !loadingConfig._retry) {
      loadingConfig._retry = true;

      // Attempt refresh via httpOnly cookie first
      loadingConfig._deferGlobalLoadingStop = true;

      try {
        startGlobalLoading();
        const refreshResponse = await authClient.post('/auth/refresh');
        const refreshData = refreshResponse.data?.data ?? refreshResponse.data;
        const newAccessToken = refreshData?.access;

        if (newAccessToken) {
          setAccessToken(newAccessToken);
        }

        const retryResponse = await api.request({
          ...loadingConfig,
          headers: {
            ...loadingConfig.headers,
            Authorization: `Bearer ${newAccessToken || getAccessToken() || ''}`,
          },
          _skipGlobalLoading: true,
          _deferGlobalLoadingStop: true,
        });

        return retryResponse;
      } catch (err) {
        // fallback to legacy refreshToken in storage
        try {
          startGlobalLoading();
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            clearAuthStorage();
            redirectToLogin();
            return Promise.reject(error);
          }

          const refreshResponse = await authClient.post('/auth/refresh', { refresh: refreshToken });
          const refreshData = refreshResponse.data?.data ?? refreshResponse.data;
          const newAccessToken = refreshData?.access;
          const newRefreshToken = refreshData?.refresh ?? refreshToken;

          if (newAccessToken) {
            setAccessToken(newAccessToken);
            localStorage.setItem('accessToken', newAccessToken);
          }

          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          const retryResponse = await api.request({
            ...loadingConfig,
            headers: {
              ...loadingConfig.headers,
              Authorization: `Bearer ${newAccessToken || localStorage.getItem('token') || ''}`,
            },
            _skipGlobalLoading: true,
            _deferGlobalLoadingStop: true,
          });

          return retryResponse;
        } catch (refreshError) {
          clearAuthStorage();
          redirectToLogin();
          return Promise.reject(refreshError);
        } finally {
          stopGlobalLoading();
          if (!loadingConfig._skipGlobalLoading) {
            stopGlobalLoading();
          }
        }
      } finally {
        stopGlobalLoading();
      }
    }

    if (!loadingConfig._skipGlobalLoading && !loadingConfig._deferGlobalLoadingStop) {
      stopGlobalLoading();
    }

    if (status === 401) {
      clearAuthStorage();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};
