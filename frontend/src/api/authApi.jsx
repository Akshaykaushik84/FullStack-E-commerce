import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const getAuthConfig = () => ({
  headers: {
    Authorization: localStorage.getItem("token"),
  },
});

const getMultipartConfig = () => ({
  headers: {
    Authorization: localStorage.getItem("token"),
    "Content-Type": "multipart/form-data",
  },
});

export const registerUser = (userData) =>
  axios.post(`${BASE_URL}/auth/register`, userData);

export const loginUser = (userData) =>
  axios.post(`${BASE_URL}/auth/login`, userData);

export const forgotPassword = (userData) =>
  axios.post(`${BASE_URL}/auth/forgot-password`, userData);

export const logoutUser = () =>
  axios.post(`${BASE_URL}/auth/logout`, {}, getAuthConfig());

export const getProfile = () =>
  axios.get(`${BASE_URL}/auth/profile`, getAuthConfig());

export const updateProfile = (userData) =>
  axios.put(`${BASE_URL}/auth/profile`, userData, getAuthConfig());

export const uploadProfileImage = (formData) =>
  axios.post(`${BASE_URL}/auth/profile-image`, formData, getMultipartConfig());
