import axios from "axios";

const BASE_URL = "http://localhost:5000/api/coupons";

export const validateCoupon = (code, subtotal) =>
  axios.get(`${BASE_URL}/validate`, { params: { code, subtotal } });
