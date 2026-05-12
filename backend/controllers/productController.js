const path = require("path")
const Product = require("../models/Product")

const getActiveProductQuery = () => ({
    $or: [
        { isActive: true },
        { isActive: { $exists: false } }
    ]
})

const parseBoolean = (value, defaultValue = false) => {
    if (typeof value === "boolean") return value
    if (typeof value === "string") return value.toLowerCase() === "true"
    if (value === undefined || value === null) return defaultValue
    return Boolean(value)
}

const isValidUrl = (value) => {
    const rawValue = String(value || "").trim()
    if (!rawValue) return true

    try {
        const parsed = new URL(rawValue)
        return ["http:", "https:"].includes(parsed.protocol)
    } catch (_err) {
        return false
    }
}

const buildProductPayload = (body = {}) => ({
    name: String(body.name || "").trim(),
    price: Number(body.price || 0),
    description: String(body.description || "").trim(),
    category: String(body.category || "").trim(),
    brand: String(body.brand || "").trim(),
    image: String(body.image || "").trim(),
    countInStock: Number(body.countInStock || 0),
    discountPercentage: Number(body.discountPercentage || 0),
    rating: Number(body.rating || 4.2),
    featured: parseBoolean(body.featured),
    tags: Array.isArray(body.tags)
        ? body.tags.filter(Boolean)
        : String(body.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
    isActive: parseBoolean(body.isActive, true)
})

const getUploadedImageUrl = (req) => (
    req.file ? `${req.protocol}://${req.get("host")}/uploads/${path.basename(req.file.path)}` : ""
)

const validateProductPayload = (payload) => {
    if (!payload.name || payload.name.length < 2) return "Product name must be at least 2 characters"
    if (!payload.category || payload.category.length < 2) return "Product category is required"
    if (!payload.description || payload.description.length < 8) return "Product description is required"
    if (!Number.isFinite(payload.price) || payload.price <= 0) return "Product price must be greater than 0"
    if (!Number.isInteger(payload.countInStock) || payload.countInStock < 0) return "Product stock must be a valid whole number"
    if (!Number.isFinite(payload.discountPercentage) || payload.discountPercentage < 0 || payload.discountPercentage > 95) {
        return "Discount must be between 0 and 95"
    }
    if (!payload.image) return "Product image is required"
    if (!isValidUrl(payload.image)) return "Product image URL must be valid"
    return ""
}

const recalculateRatings = (product) => {
    if (!product.reviews.length) {
        product.rating = 0
        product.numReviews = 0
        return
    }

    product.numReviews = product.reviews.length
    product.rating = Number(
        (product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
    )
}

exports.createProduct = async (req, res) => {
    try {
        const payload = buildProductPayload(req.body)
        const uploadedImage = getUploadedImageUrl(req)

        if (uploadedImage) {
            payload.image = uploadedImage
        }

        const validationError = validateProductPayload(payload)
        if (validationError) {
            return res.status(400).json({ message: validationError })
        }

        const product = await Product.create(payload)
        res.status(201).json(product)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

exports.getProducts = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page || 1), 1)
        const limit = Math.min(Math.max(Number(req.query.limit || 8), 1), 24)
        const skip = (page - 1) * limit
        const search = String(req.query.search || "").trim()
        const category = String(req.query.category || "").trim()
        const featured = req.query.featured
        const sort = String(req.query.sort || "latest").trim()

        const query = getActiveProductQuery()

        if (search) {
            query.$and = [
                {
                    $or: [
                        { name: { $regex: search, $options: "i" } },
                        { description: { $regex: search, $options: "i" } },
                        { brand: { $regex: search, $options: "i" } },
                        { tags: { $in: [new RegExp(search, "i")] } }
                    ]
                }
            ]
        }

        if (category && category !== "All") {
            query.category = category
        }

        if (featured === "true") {
            query.featured = true
        }

        const sortMap = {
            latest: { createdAt: -1 },
            priceAsc: { price: 1 },
            priceDesc: { price: -1 },
            rating: { rating: -1 },
            name: { name: 1 }
        }

        const [products, totalProducts, categories] = await Promise.all([
            Product.find(query).sort(sortMap[sort] || sortMap.latest).skip(skip).limit(limit),
            Product.countDocuments(query),
            Product.distinct("category", getActiveProductQuery())
        ])

        res.json({
            items: products,
            pagination: {
                page,
                limit,
                totalProducts,
                totalPages: Math.max(Math.ceil(totalProducts / limit), 1),
                hasNextPage: skip + products.length < totalProducts,
                hasPrevPage: page > 1
            },
            filters: {
                categories: ["All", ...categories.filter(Boolean).sort()]
            }
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("reviews.user", "name profileImage email")

        if (!product || product.isActive === false) {
            return res.status(404).json({ message: "Product not found" })
        }

        res.json(product)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.createProductReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if (!product || product.isActive === false) {
            return res.status(404).json({ message: "Product not found" })
        }

        const alreadyReviewed = product.reviews.find(
            (review) => review.user.toString() === req.user.id
        )

        if (alreadyReviewed) {
            return res.status(400).json({ message: "You have already reviewed this product" })
        }

        const fallbackReviewImage = String(req.body.image || "").trim()

        if (!isValidUrl(fallbackReviewImage)) {
            return res.status(400).json({ message: "Review image URL must be valid" })
        }

        const reviewImage = req.file
            ? `${req.protocol}://${req.get("host")}/uploads/${path.basename(req.file.path)}`
            : fallbackReviewImage

        const review = {
            user: req.user.id,
            name: req.user.name || req.body.name || "Customer",
            email: req.user.email || req.body.email || "customer@example.com",
            rating: Number(req.body.rating),
            comment: String(req.body.comment || "").trim(),
            image: reviewImage
        }

        if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" })
        }

        if (!review.comment || review.comment.length < 5) {
            return res.status(400).json({ message: "Rating and comment are required" })
        }

        if (review.comment.length > 400) {
            return res.status(400).json({ message: "Review must be 400 characters or less" })
        }

        product.reviews.unshift(review)
        recalculateRatings(product)
        await product.save()

        const savedProduct = await Product.findById(product._id).populate("reviews.user", "name profileImage email")
        res.status(201).json(savedProduct)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.updateProduct = async (req, res) => {
    try {
        const payload = buildProductPayload(req.body)
        const uploadedImage = getUploadedImageUrl(req)

        if (uploadedImage) {
            payload.image = uploadedImage
        }

        const validationError = validateProductPayload(payload)
        if (validationError) {
            return res.status(400).json({ message: validationError })
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            payload,
            { returnDocument: "after", runValidators: true }
        )

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        res.json(product)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id)

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        res.json({ message: "Product deleted successfully" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
