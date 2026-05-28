import axios from "axios";
import { getAuthHeader } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const client = axios.create({ baseURL: `${API_BASE_URL}/dashboard` });

export const getDashboardApplications = async ({ status, q } = {}) => {
  const params = {};
  if (status) params.status = status;
  if (q) params.q = q;

  const { data } = await client.get("/applications", {
    headers: getAuthHeader(),
    params,
  });
  return data;
};

export const updateDashboardApplicationStatus = async (id, payload) => {
  const { data } = await client.patch(`/applications/${id}/status`, payload, {
    headers: getAuthHeader(),
  });
  return data;
};
