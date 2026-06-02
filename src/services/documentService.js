import axios from "axios";
import { getAuthHeader } from "./authService";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, '') + '/';
const client = axios.create({ baseURL: `${API_BASE_URL}documents/` });

export const uploadDocument = async ({ application, document_type, file }) => {
  const formData = new FormData();
  formData.append("application", application);
  formData.append("document_type", document_type);
  formData.append("file", file);

  const { data } = await client.post("upload/", formData, {
    headers: {
      ...getAuthHeader(),
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const getDocumentById = async (id) => {
  const { data } = await client.get(`${id}/`, { headers: getAuthHeader() });
  return data;
};
