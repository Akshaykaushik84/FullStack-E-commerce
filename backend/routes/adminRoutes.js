const express = require("express")
const router = express.Router()
const adminMiddleware = require("../middleware/adminMiddleware")
const authMiddleware = require("../middleware/authMiddleware")
const {
    getDashboardStats,
    getSalesReport,
    exportSalesReport,
    getUsers,
    getUserDetails,
    deleteUser,
    getAllCarts,
    getUserCartById
} = require("../controllers/adminController")

router.use(authMiddleware, adminMiddleware)

router.get("/stats", getDashboardStats)
router.get("/sales-report", getSalesReport)
router.get("/sales-report/export", exportSalesReport)
router.get("/users", getUsers)
router.get("/users/:id", getUserDetails)
router.delete("/users/:id", deleteUser)
router.get("/carts", getAllCarts)
router.get("/carts/:userId", getUserCartById)

module.exports = router
