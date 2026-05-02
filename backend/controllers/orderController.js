const Order = require("../models/Order")
const Cart = require("../models/Cart")
const Coupon = require("../models/Coupon")
const Product = require("../models/Product")
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

const buildInvoiceNumber = (orderId) => `INV-${String(orderId).slice(-8).toUpperCase()}`

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`

const canUserCancel = (order) => ["Pending", "Approved"].includes(order.status)
const canUserReturn = (order) => order.status === "Delivered"

const restockOrderItems = async (order) => {
    const updates = (order.products || []).map(async (item) => {
        if (!item.product) {
            return
        }

        const product = await Product.findById(item.product)

        if (!product) {
            return
        }

        product.countInStock = Number(product.countInStock || 0) + Number(item.quantity || 0)
        await product.save()
    })

    await Promise.all(updates)
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

        const itemsPrice = normalizedProducts.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

        let discountAmount = 0
        const normalizedCouponCode = normalizeCouponCode(couponCode)

        if (normalizedCouponCode) {
            const coupon = await Coupon.findOne({ code: normalizedCouponCode, isActive: true })

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
            invoiceNumber: buildInvoiceNumber(new Date().getTime().toString(16)),
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

        savedOrder.invoiceNumber = buildInvoiceNumber(savedOrder._id)
        await savedOrder.save()

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
        const allowedStatuses = ["Pending", "Approved", "Shipped", "Delivered", "Cancelled", "Return Requested", "Returned"]

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status" })
        }

        const order = await Order.findById(req.params.id)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        if ((status === "Cancelled" || status === "Returned") && !["Cancelled", "Returned"].includes(order.status)) {
            await restockOrderItems(order)
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

const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied" })
        }

        await syncOrderStatus(order)

        if (!canUserCancel(order)) {
            return res.status(400).json({ message: "This order can no longer be cancelled" })
        }

        order.status = "Cancelled"
        order.cancelReason = String(req.body.reason || "").trim()
        await restockOrderItems(order)
        await order.save()

        res.json({ message: "Order cancelled successfully", order })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const requestReturn = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied" })
        }

        await syncOrderStatus(order)

        if (!canUserReturn(order)) {
            return res.status(400).json({ message: "Return is available only for delivered orders" })
        }

        order.status = "Return Requested"
        order.returnReason = String(req.body.reason || "").trim()
        await order.save()

        res.json({ message: "Return request submitted successfully", order })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const downloadInvoice = async (req, res) => {
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

        const itemsHtml = (order.products || []).map((item) => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${item.name || item.product?.name || "Product"}</td>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${formatCurrency(item.unitPrice)}</td>
                <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${formatCurrency(item.unitPrice * item.quantity)}</td>
            </tr>
        `).join("")

        const html = `
            <!doctype html>
            <html>
            <head>
              <meta charset="utf-8" />
              <title>${order.invoiceNumber || buildInvoiceNumber(order._id)}</title>
            </head>
            <body style="font-family:Segoe UI,Arial,sans-serif;padding:32px;color:#0f172a;">
              <h1 style="margin-bottom:8px;">CartSphere Invoice</h1>
              <p style="margin-top:0;color:#475569;">Invoice ${order.invoiceNumber || buildInvoiceNumber(order._id)}</p>
              <p><strong>Customer:</strong> ${order.user?.name || "Customer"} (${order.user?.email || "No email"})</p>
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              <h2 style="margin-top:28px;">Items</h2>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#eff6ff;">
                    <th style="padding:10px;text-align:left;">Product</th>
                    <th style="padding:10px;text-align:left;">Qty</th>
                    <th style="padding:10px;text-align:left;">Unit Price</th>
                    <th style="padding:10px;text-align:left;">Line Total</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
              <div style="margin-top:24px;">
                <p><strong>Items:</strong> ${formatCurrency(order.itemsPrice)}</p>
                <p><strong>Discount:</strong> ${formatCurrency(order.discountAmount)}</p>
                <p><strong>Shipping:</strong> ${formatCurrency(order.shippingFee)}</p>
                <p><strong>Tax:</strong> ${formatCurrency(order.taxPrice)}</p>
                <p style="font-size:20px;"><strong>Total:</strong> ${formatCurrency(order.totalPrice)}</p>
              </div>
            </body>
            </html>
        `

        res.setHeader("Content-Type", "text/html; charset=utf-8")
        res.setHeader("Content-Disposition", `attachment; filename="${order.invoiceNumber || buildInvoiceNumber(order._id)}.html"`)
        res.send(html)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = {
    placeOrder,
    getUserOrders,
    updateOrderStatus,
    getSingleOrder,
    cancelOrder,
    requestReturn,
    downloadInvoice
}
