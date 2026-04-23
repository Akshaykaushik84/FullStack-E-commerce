const express = require("express")
const router = express.Router()
const { addToCart, getCart, updateCart, removeFromCart } = require("../controllers/cartController")
const authMiddleware = require("../middleware/authMiddleware")

router.post("/", authMiddleware, addToCart)
router.get("/", authMiddleware, getCart)
router.put("/", authMiddleware, updateCart)
router.delete("/:productId", authMiddleware, removeFromCart)
router.delete("/", authMiddleware, removeFromCart)

module.exports = router
