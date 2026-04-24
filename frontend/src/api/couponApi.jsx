import { apiClient } from "./apiClient.jsx";

export const validateCoupon = (code, subtotal) =>
  apiClient.get("/coupons/validate", { params: { code, subtotal } });
