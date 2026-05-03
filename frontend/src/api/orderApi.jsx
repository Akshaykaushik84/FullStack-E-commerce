import { apiClient, getAuthHeaders } from "./apiClient.jsx";

const getConfig = (token) => ({
  headers: getAuthHeaders(token),
});

export const placeOrder = (orderData, token) =>
  apiClient.post("/orders", orderData, getConfig(token));

export const getUserOrders = (token) => apiClient.get("/orders", getConfig(token));

export const updateOrderStatus = (orderId, status, token) =>
  apiClient.put(`/orders/${orderId}`, { status }, getConfig(token));

export const getSingleOrder = (orderId, token) =>
  apiClient.get(`/orders/${orderId}`, getConfig(token));

export const cancelOrder = (orderId, reason, token) =>
  apiClient.post(`/orders/${orderId}/cancel`, { reason }, getConfig(token));

export const requestReturn = (orderId, reason, token) =>
  apiClient.post(`/orders/${orderId}/return`, { reason }, getConfig(token));

export const downloadInvoice = (orderId, token) =>
  apiClient.get(`/orders/${orderId}/invoice`, {
    ...getConfig(token),
    responseType: "blob",
  });
