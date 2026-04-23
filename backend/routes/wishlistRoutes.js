const express = require("express")
const router = express.Router()
const authMiddleware = require("../middleware/authMiddleware")
const { getWishlist, toggleWishlist } = require("../controllers/wishlistController")

router.get("/", authMiddleware, getWishlist)
router.post("/toggle", authMiddleware, toggleWishlist)

module.exports = router
