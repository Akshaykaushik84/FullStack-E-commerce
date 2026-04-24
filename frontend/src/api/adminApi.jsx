import { apiClient, getAuthHeaders } from "./apiClient.jsx";

const getAdminConfig = (token, params = {}) => ({
  headers: getAuthHeaders(token),
  params,
});

export const getAdminStats = (token) => apiClient.get("/admin/stats", getAdminConfig(token));

export const getAdminUsers = (token, params = {}) =>
  apiClient.get("/admin/users", getAdminConfig(token, params));

export const deleteAdminUser = (userId, token) =>
  apiClient.delete(`/admin/users/${userId}`, getAdminConfig(token));

export const getAdminCarts = (token) => apiClient.get("/admin/carts", getAdminConfig(token));

export const getAdminUserCart = (userId, token) =>
  apiClient.get(`/admin/carts/${userId}`, getAdminConfig(token));
