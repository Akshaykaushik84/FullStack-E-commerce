const express = require("express")
const router = express.Router()

const {
    createProduct,
    getProducts,
    getSingleProduct,
    createProductReview,
    updateProduct,
    deleteProduct
} = require("../controllers/productController")

const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const { upload } = require("../middleware/uploadMiddleware")

router.get("/", getProducts)
router.get("/:id", getSingleProduct)
router.post("/:id/reviews", authMiddleware, (req, _res, next) => {
    req.uploadPrefix = "review"
    next()
}, upload.single("reviewImage"), createProductReview)
router.post("/", authMiddleware, adminMiddleware, createProduct)
router.put("/:id", authMiddleware, adminMiddleware, updateProduct)
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct)

module.exports = router
