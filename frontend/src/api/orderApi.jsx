import axios from "axios";

const BASE_URL = "http://localhost:5000/api/orders";

const getConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const placeOrder = (orderData, token) =>
  axios.post(BASE_URL, orderData, getConfig(token));

export const getUserOrders = (token) =>
  axios.get(BASE_URL, getConfig(token));

export const updateOrderStatus = (orderId, status, token) =>
  axios.put(`${BASE_URL}/${orderId}`, { status }, getConfig(token));

export const getSingleOrder = (orderId, token) =>
  axios.get(`${BASE_URL}/${orderId}`, getConfig(token));
