const express = require("express")
const router = express.Router()
const {
    validateCoupon,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon
} = require("../controllers/couponController")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")

router.get("/validate", validateCoupon)

router.get("/", authMiddleware, adminMiddleware, getCoupons)
router.post("/", authMiddleware, adminMiddleware, createCoupon)
router.put("/:id", authMiddleware, adminMiddleware, updateCoupon)
router.delete("/:id", authMiddleware, adminMiddleware, deleteCoupon)

module.exports = router
