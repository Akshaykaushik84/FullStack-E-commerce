const express = require("express")
const router = express.Router()
const adminMiddleware = require("../middleware/adminMiddleware")
const authMiddleware = require("../middleware/authMiddleware")
const {
    getDashboardStats,
    getUsers,
    deleteUser,
    getAllCarts,
    getUserCartById
} = require("../controllers/adminController")

router.use(authMiddleware, adminMiddleware)

router.get("/stats", getDashboardStats)
router.get("/users", getUsers)
router.delete("/users/:id", deleteUser)
router.get("/carts", getAllCarts)
router.get("/carts/:userId", getUserCartById)

module.exports = router
