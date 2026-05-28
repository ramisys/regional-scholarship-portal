import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const authClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
});

export const register = async (payload) => {
  const { data } = await authClient.post("/register", payload);
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await authClient.post("/login", { email, password });
  if (data?.success && data?.data?.access) {
    localStorage.setItem("accessToken", data.data.access);
    localStorage.setItem("refreshToken", data.data.refresh);
    localStorage.setItem("userRole", data.data.user.role);
  }
  return data;
};

export const logout = async () => {
  const refresh = localStorage.getItem("refreshToken");
  const token = localStorage.getItem("accessToken");
  const { data } = await authClient.post(
    "/logout",
    { refresh },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  return data;
};

export const refreshToken = async () => {
  const refresh = localStorage.getItem("refreshToken");
  const { data } = await authClient.post("/refresh", { refresh });
  if (data?.success && data?.data?.access) {
    localStorage.setItem("accessToken", data.data.access);
  }
  return data;
};

export const getAuthHeader = () => {
  const access = localStorage.getItem("accessToken");
  return access ? { Authorization: `Bearer ${access}` } : {};
};
