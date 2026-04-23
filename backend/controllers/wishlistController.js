const User = require("../models/User")
const Product = require("../models/Product")

const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: "wishlist",
            match: { isActive: true }
        })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json(user.wishlist || [])
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body
        const [user, product] = await Promise.all([
            User.findById(req.user.id),
            Product.findById(productId)
        ])

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (!product || !product.isActive) {
            return res.status(404).json({ message: "Product not found" })
        }

        const existingIndex = user.wishlist.findIndex(
            (item) => item.toString() === productId
        )

        let message = "Added to wishlist"

        if (existingIndex > -1) {
            user.wishlist.splice(existingIndex, 1)
            message = "Removed from wishlist"
        } else {
            user.wishlist.unshift(product._id)
        }

        await user.save()
        await user.populate({ path: "wishlist", match: { isActive: true } })

        res.json({ message, items: user.wishlist || [] })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = {
    getWishlist,
    toggleWishlist
}
