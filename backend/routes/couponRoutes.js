const express = require("express")
const router = express.Router()
const { validateCoupon } = require("../controllers/couponController")

router.get("/validate", validateCoupon)

module.exports = router
