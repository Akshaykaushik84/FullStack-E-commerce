const Cart = require("../models/Cart")
const Product = require("../models/Product")

const getAvailableStock = (product) => {
    const parsedStock = Number(product?.countInStock)
    return Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : 25
}

const formatCart = (cart) => {
    const safeProducts = (cart?.products || []).filter((item) => item.product)
    const items = safeProducts.map((item) => ({
        _id: item._id,
        product: item.product,
        quantity: item.quantity,
        lineTotal: (item.product.price || 0) * item.quantity
    }))

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

    return {
        _id: cart?._id || null,
        user: cart?.user || null,
        items,
        totalItems,
        subtotal
    }
}

const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ user: userId })

    if (!cart) {
        cart = await Cart.create({ user: userId, products: [] })
    }

    return cart
}

const addToCart = async (req, res) => {
    try {
        const { productId } = req.body
        const quantity = Math.max(Number(req.body.quantity || 1), 1)
        const userId = req.user.id

        const product = await Product.findById(productId)

        if (!product || !product.isActive) {
            return res.status(404).json({ message: "Product not found" })
        }

        const availableStock = getAvailableStock(product)

        if (availableStock < quantity) {
            return res.status(400).json({ message: "Not enough stock available" })
        }

        const cart = await getOrCreateCart(userId)
        const index = cart.products.findIndex((item) => item.product.toString() === productId)

        if (index > -1) {
            const nextQuantity = cart.products[index].quantity + quantity

            if (nextQuantity > availableStock) {
                return res.status(400).json({ message: "Requested quantity exceeds stock" })
            }

            cart.products[index].quantity = nextQuantity
        } else {
            cart.products.push({ product: productId, quantity })
        }

        await cart.save()
        const populatedCart = await Cart.findById(cart._id).populate("products.product")
        res.status(200).json(formatCart(populatedCart))
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id)
        const populatedCart = await Cart.findById(cart._id).populate("products.product")
        res.status(200).json(formatCart(populatedCart))
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const updateCart = async (req, res) => {
    try {
        const { productId } = req.body
        const quantity = Number(req.body.quantity)
        const cart = await Cart.findOne({ user: req.user.id })

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" })
        }

        const index = cart.products.findIndex((item) => item.product.toString() === productId)

        if (index < 0) {
            return res.status(404).json({ message: "Product not in cart" })
        }

        if (quantity <= 0) {
            cart.products.splice(index, 1)
        } else {
            const product = await Product.findById(productId)

            if (!product || !product.isActive) {
                return res.status(404).json({ message: "Product not found" })
            }

            if (quantity > getAvailableStock(product)) {
                return res.status(400).json({ message: "Requested quantity exceeds stock" })
            }

            cart.products[index].quantity = quantity
        }

        await cart.save()
        const populatedCart = await Cart.findById(cart._id).populate("products.product")
        res.status(200).json(formatCart(populatedCart))
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id
        const productId = req.params.productId || req.body.productId

        const cart = await Cart.findOne({ user: userId })

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" })
        }

        cart.products = cart.products.filter((item) => item.product.toString() !== productId)
        await cart.save()

        const populatedCart = await Cart.findById(cart._id).populate("products.product")
        res.status(200).json(formatCart(populatedCart))
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = { addToCart, getCart, updateCart, removeFromCart }
