import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const resolveApiBaseUrl = (value) => {
  const fallbackBaseUrl = "/api";

  if (typeof window === "undefined") {
    return value || fallbackBaseUrl;
  }

  const currentHost = window.location.hostname;
  const isLocalApp = currentHost === "localhost" || currentHost === "127.0.0.1";

  try {
    const parsedUrl = new URL(value, window.location.origin);
    const pointsToLocalhost = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";

    if (pointsToLocalhost && !isLocalApp) {
      return fallbackBaseUrl;
    }
  } catch {
    return fallbackBaseUrl;
  }

  return value || fallbackBaseUrl;
};

const resolvedBaseUrl = resolveApiBaseUrl(rawBaseUrl);
const API_BASE_URL = resolvedBaseUrl.endsWith("/") ? resolvedBaseUrl.slice(0, -1) : resolvedBaseUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const getAuthHeaders = (token) => ({
  Authorization: token?.startsWith("Bearer ") ? token : `Bearer ${token}`,
});
