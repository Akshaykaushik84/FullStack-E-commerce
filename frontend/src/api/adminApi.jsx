import axios from "axios";

const BASE_URL = "http://localhost:5000/api/admin";

const token = localStorage.getItem("token");

console.log(token); 

const getAdminConfig = (token, params = {}) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
  params,
});

export const getAdminStats = (token) =>
  axios.get(`${BASE_URL}/stats`, getAdminConfig(token));

export const getAdminUsers = (token, params = {}) =>
  axios.get(`${BASE_URL}/users`, getAdminConfig(token, params));

export const deleteAdminUser = (userId, token) =>
  axios.delete(`${BASE_URL}/users/${userId}`, getAdminConfig(token));

export const getAdminCarts = (token) =>
  axios.get(`${BASE_URL}/carts`, getAdminConfig(token));

export const getAdminUserCart = (userId, token) =>
  axios.get(`${BASE_URL}/carts/${userId}`, getAdminConfig(token));
