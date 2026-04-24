const Order = require("../models/Order")
const Cart = require("../models/Cart")
const Coupon = require("../models/Coupon")
const { computeCouponDiscount, normalizeCouponCode } = require("./couponController")
const { syncOrderStatus, syncOrderStatuses } = require("../utils/orderStatus")

const getAvailableStock = (product) => {
    const parsedStock = Number(product?.countInStock)
    return Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : 25
}

const calculatePricing = (itemsPrice, discountAmount = 0) => {
    const discountedSubtotal = Math.max(itemsPrice - discountAmount, 0)
    const shippingFee = discountedSubtotal >= 999 ? 0 : 79
    const taxPrice = Number((discountedSubtotal * 0.08).toFixed(2))
    const totalPrice = Number((discountedSubtotal + shippingFee + taxPrice).toFixed(2))

    return { shippingFee, taxPrice, totalPrice }
}

const placeOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, couponCode } = req.body
        const userId = req.user.id

        const cart = await Cart.findOne({ user: userId }).populate("products.product")

        if (!cart || !cart.products.length) {
            return res.status(400).json({ message: "Your cart is empty" })
        }

        const normalizedProducts = []

        for (const item of cart.products) {
            const product = item.product

            if (!product || !product.isActive) {
                return res.status(400).json({ message: "One of the cart items is no longer available" })
            }

            if (getAvailableStock(product) < item.quantity) {
                return res.status(400).json({ message: `${product.name} does not have enough stock` })
            }

            normalizedProducts.push({
                product: product._id,
                quantity: item.quantity,
                unitPrice: product.price,
                name: product.name,
                image: product.image
            })
        }

        const itemsPrice = normalizedProducts.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        )

        let coupon = null
        let discountAmount = 0
        const normalizedCouponCode = normalizeCouponCode(couponCode)

        if (normalizedCouponCode) {
            coupon = await Coupon.findOne({ code: normalizedCouponCode, isActive: true })

            if (!coupon) {
                return res.status(404).json({ message: "Coupon not found or inactive" })
            }

            if (itemsPrice < coupon.minimumOrderAmount) {
                return res.status(400).json({
                    message: `Minimum order amount for this coupon is Rs ${coupon.minimumOrderAmount}`
                })
            }

            discountAmount = computeCouponDiscount(coupon, itemsPrice)
        }

        const { shippingFee, taxPrice, totalPrice } = calculatePricing(itemsPrice, discountAmount)
        const paymentStatus = paymentMethod === "Cash on Delivery" ? "Pending" : "Paid"

        const order = await Order.create({
            user: userId,
            products: normalizedProducts,
            shippingAddress,
            paymentMethod,
            paymentStatus,
            couponCode: normalizedCouponCode,
            discountAmount,
            itemsPrice,
            shippingFee,
            taxPrice,
            totalPrice,
            status: "Pending"
        })

        for (const item of cart.products) {
            const availableStock = getAvailableStock(item.product)
            item.product.countInStock = Math.max(availableStock - item.quantity, 0)
            await item.product.save()
        }

        cart.products = []
        await cart.save()

        const savedOrder = await Order.findById(order._id)
            .populate("products.product")
            .populate("user", "name email")

        res.status(201).json(savedOrder)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getUserOrders = async (req, res) => {
    try {
        const query = req.user.role === "admin" ? {} : { user: req.user.id }
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate("products.product")
            .populate("user", "name email")

        await syncOrderStatuses(orders)

        res.status(200).json(orders)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body
        const allowedStatuses = ["Pending", "Approved", "Shipped", "Delivered", "Cancelled"]

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status" })
        }

        const order = await Order.findById(req.params.id)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        order.status = status
        await order.save()

        res.status(200).json(order)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("products.product")
            .populate("user", "name email")

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        if (req.user.role !== "admin" && order.user._id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied" })
        }

        await syncOrderStatus(order)

        res.status(200).json(order)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = { placeOrder, getUserOrders, updateOrderStatus, getSingleOrder }
