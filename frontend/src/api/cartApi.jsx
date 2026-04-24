import { apiClient, getAuthHeaders } from "./apiClient.jsx";

const getConfig = (token) => ({
  headers: getAuthHeaders(token),
});

export const getCart = (token) => apiClient.get("/cart", getConfig(token));

export const addToCart = (productId, token, quantity = 1) =>
  apiClient.post("/cart", { productId, quantity }, getConfig(token));

export const updateCartQuantity = (productId, quantity, token) =>
  apiClient.put("/cart", { productId, quantity }, getConfig(token));

export const removeFromCart = (productId, token) =>
  apiClient.delete(`/cart/${productId}`, getConfig(token));
