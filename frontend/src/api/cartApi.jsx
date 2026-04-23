import axios from "axios";

const BASE_URL = "http://localhost:5000/api/cart";

const getConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getCart = (token) => axios.get(BASE_URL, getConfig(token));

export const addToCart = (productId, token, quantity = 1) =>
  axios.post(BASE_URL, { productId, quantity }, getConfig(token));

export const updateCartQuantity = (productId, quantity, token) =>
  axios.put(BASE_URL, { productId, quantity }, getConfig(token));

export const removeFromCart = (productId, token) =>
  axios.delete(`${BASE_URL}/${productId}`, getConfig(token));
