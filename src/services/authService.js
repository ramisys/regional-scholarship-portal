import { setAccessToken, clearAccessToken } from '../app/utils/authStore';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '') + '/';

export const register = async (payload) => {
  const resp = await fetch(`${API_BASE_URL}auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return resp.json();
};

export const login = async ({ email, password }) => {
  const resp = await fetch(`${API_BASE_URL}auth/login/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  const payload = data?.data ?? data;
  if (payload?.access) {
    setAccessToken(payload.access);
    if (payload.user?.role) {
      localStorage.setItem('userRole', payload.user.role);
    }
  }
  return data;
};

export const logout = async () => {
  try {
    await fetch(`${API_BASE_URL}auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    // ignore
  }
  clearAccessToken();
  localStorage.removeItem('userRole');
  return { success: true };
};

export const refreshToken = async () => {
  const resp = await fetch(`${API_BASE_URL}auth/refresh/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await resp.json();
  const payload = data?.data ?? data;
  if (payload?.access) {
    setAccessToken(payload.access);
  }
  return data;
};

export const getAuthHeader = () => {
  // Prefer in-memory token when available, fallback to stored accessToken
  return {};
};
