import { apiClient, getAuthHeaders } from "./apiClient.jsx";

export const validateCoupon = (code, subtotal) =>
  apiClient.get("/coupons/validate", { params: { code, subtotal } });

export const getCoupons = (token) =>
  apiClient.get("/coupons", { headers: getAuthHeaders(token) });

export const createCoupon = (couponData, token) =>
  apiClient.post("/coupons", couponData, { headers: getAuthHeaders(token) });

export const updateCoupon = (couponId, couponData, token) =>
  apiClient.put(`/coupons/${couponId}`, couponData, { headers: getAuthHeaders(token) });

export const deleteCoupon = (couponId, token) =>
  apiClient.delete(`/coupons/${couponId}`, { headers: getAuthHeaders(token) });
