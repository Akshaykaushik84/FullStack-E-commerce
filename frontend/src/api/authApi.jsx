import { apiClient, getAuthHeaders } from "./apiClient.jsx";
import { getStoredToken } from "../utils/authStorage.js";

const getAuthConfig = () => ({
  headers: getAuthHeaders(getStoredToken()),
});

const getMultipartConfig = () => ({
  headers: {
    ...getAuthHeaders(getStoredToken()),
    "Content-Type": "multipart/form-data",
  },
});

export const registerUser = (userData) => apiClient.post("/auth/register", userData);

export const loginUser = (userData) => apiClient.post("/auth/login", userData);

export const forgotPassword = (userData) => apiClient.post("/auth/forgot-password", userData);

export const logoutUser = () => apiClient.post("/auth/logout", {}, getAuthConfig());

export const getProfile = () => apiClient.get("/auth/profile", getAuthConfig());

export const updateProfile = (userData) => apiClient.put("/auth/profile", userData, getAuthConfig());

export const updateLocation = (locationData) => apiClient.patch("/auth/location", locationData, getAuthConfig());

export const uploadProfileImage = (formData) =>
  apiClient.post("/auth/profile-image", formData, getMultipartConfig());
