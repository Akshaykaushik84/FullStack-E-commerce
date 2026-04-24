import { apiClient, getAuthHeaders } from "./apiClient.jsx";

export const getProducts = (params = {}) => apiClient.get("/products", { params });

export const getSingleProduct = (id) => apiClient.get(`/products/${id}`);

export const createProductReview = (id, reviewData, token) =>
  apiClient.post(`/products/${id}/reviews`, reviewData, {
    headers: getAuthHeaders(token),
  });

export const createProduct = (productData, token) =>
  apiClient.post("/products", productData, {
    headers: getAuthHeaders(token),
  });

export const updateProduct = (id, productData, token) =>
  apiClient.put(`/products/${id}`, productData, {
    headers: getAuthHeaders(token),
  });

export const deleteProduct = (id, token) =>
  apiClient.delete(`/products/${id}`, {
    headers: getAuthHeaders(token),
  });
