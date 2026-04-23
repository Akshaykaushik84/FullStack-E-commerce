import axios from "axios";

const BASE_URL = "http://localhost:5000/api/wishlist";

const getConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getWishlist = (token) => axios.get(BASE_URL, getConfig(token));

export const toggleWishlist = (productId, token) =>
  axios.post(`${BASE_URL}/toggle`, { productId }, getConfig(token));
