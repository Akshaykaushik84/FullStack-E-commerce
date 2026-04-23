const express = require("express")
const router = express.Router()
const { placeOrder, getUserOrders, updateOrderStatus, getSingleOrder } = require("../controllers/orderController")

const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")





router.post("/", authMiddleware, placeOrder)          // User place order
router.get("/", authMiddleware, getUserOrders)       // User get orders
router.put("/:id", authMiddleware, adminMiddleware, updateOrderStatus) // Admin update status
router.get("/:id", authMiddleware, getSingleOrder)   // User get single order
module.exports = router
