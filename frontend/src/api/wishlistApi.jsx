import { apiClient, getAuthHeaders } from "./apiClient.jsx";

const getConfig = (token) => ({
  headers: getAuthHeaders(token),
});

export const getWishlist = (token) => apiClient.get("/wishlist", getConfig(token));

export const toggleWishlist = (productId, token) =>
  apiClient.post("/wishlist/toggle", { productId }, getConfig(token));
