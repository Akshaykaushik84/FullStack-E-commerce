const Product = require("../models/Product")

const getActiveProductQuery = () => ({
    $or: [
        { isActive: true },
        { isActive: { $exists: false } }
    ]
})

const buildProductPayload = (body = {}) => ({
    name: String(body.name || "").trim(),
    price: Number(body.price || 0),
    description: String(body.description || "").trim(),
    category: String(body.category || "General").trim() || "General",
    brand: String(body.brand || "").trim(),
    image: String(body.image || "").trim(),
    countInStock: Number(body.countInStock || 0),
    discountPercentage: Number(body.discountPercentage || 0),
    rating: Number(body.rating || 4.2),
    featured: Boolean(body.featured),
    tags: Array.isArray(body.tags)
        ? body.tags.filter(Boolean)
        : String(body.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
    isActive: body.isActive !== false
})

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
        const product = await Product.create(buildProductPayload(req.body))
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

        const review = {
            user: req.user.id,
            name: req.user.name || req.body.name || "Customer",
            email: req.user.email || req.body.email || "customer@example.com",
            rating: Number(req.body.rating),
            comment: String(req.body.comment || "").trim()
        }

        if (!review.comment || !review.rating) {
            return res.status(400).json({ message: "Rating and comment are required" })
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
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            buildProductPayload(req.body),
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
