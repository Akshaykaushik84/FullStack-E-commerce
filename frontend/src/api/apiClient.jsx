import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const API_BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const getAuthHeaders = (token) => ({
  Authorization: token?.startsWith("Bearer ") ? token : `Bearer ${token}`,
});

export const getStoredToken = () => localStorage.getItem("token") || "";
