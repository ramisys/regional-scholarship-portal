import axios from "axios";
import { getAuthHeader } from "./authService";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, '') + '/';
const client = axios.create({ baseURL: `${API_BASE_URL}applications/` });

export const getApplications = async () => {
  const { data } = await client.get("", { headers: getAuthHeader() });
  return data;
};

export const createApplication = async (payload) => {
  const { data } = await client.post("", payload, { headers: getAuthHeader() });
  return data;
};

export const getApplicationById = async (id) => {
  const { data } = await client.get(`${id}/`, { headers: getAuthHeader() });
  return data;
};

export const updateApplication = async (id, payload) => {
  const { data } = await client.put(`${id}/`, payload, { headers: getAuthHeader() });
  return data;
};

export const deleteApplication = async (id) => {
  const { data } = await client.delete(`${id}/`, { headers: getAuthHeader() });
  return data;
};

export const submitApplication = async (id) => {
  const { data } = await client.post(`${id}/submit/`, {}, { headers: getAuthHeader() });
  return data;
};
