import axios from "axios";

const BASE_URL = "http://localhost:5000/api/products";

export const getProducts = (params = {}) => axios.get(BASE_URL, { params });

export const getSingleProduct = (id) => axios.get(`${BASE_URL}/${id}`);

export const createProductReview = (id, reviewData, token) =>
  axios.post(`${BASE_URL}/${id}/reviews`, reviewData, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createProduct = (productData, token) =>
  axios.post(BASE_URL, productData, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateProduct = (id, productData, token) =>
  axios.put(`${BASE_URL}/${id}`, productData, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteProduct = (id, token) =>
  axios.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
