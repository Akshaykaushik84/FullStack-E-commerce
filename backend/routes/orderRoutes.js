const express = require("express")
const router = express.Router()
const {
    placeOrder,
    getUserOrders,
    updateOrderStatus,
    getSingleOrder,
    cancelOrder,
    requestReturn,
    downloadInvoice
} = require("../controllers/orderController")

const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")

router.post("/", authMiddleware, placeOrder)
router.get("/", authMiddleware, getUserOrders)
router.put("/:id", authMiddleware, adminMiddleware, updateOrderStatus)
router.get("/:id", authMiddleware, getSingleOrder)
router.post("/:id/cancel", authMiddleware, cancelOrder)
router.post("/:id/return", authMiddleware, requestReturn)
router.get("/:id/invoice", authMiddleware, downloadInvoice)

module.exports = router
