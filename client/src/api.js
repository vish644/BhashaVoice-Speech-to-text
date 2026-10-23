// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

export const listTranscriptions = (params) =>
  api.get("/api/transcriptions", { params }).then((r) => {
    const d = r.data;
    const items = Array.isArray(d)
      ? d
      : (d.data ?? d.items ?? d.rows ?? d.transcriptions ?? []);
    return {
      items,
      total: d.total ?? d.count ?? items.length,
    };
  });

export const createTranscription = (body) =>
  api.post("/api/transcriptions", body).then((r) => r.data);
export const updateTranscription = (id, body) =>
  api.put(`/api/transcriptions/${id}`, body).then((r) => r.data);
export const deleteTranscription = (id) =>
  api.delete(`/api/transcriptions/${id}`).then((r) => r.data);

export const errMsg = (e) =>
  e.response?.data?.error ||
  e.response?.data?.message ||
  e.message ||
  "Something went wrong";
