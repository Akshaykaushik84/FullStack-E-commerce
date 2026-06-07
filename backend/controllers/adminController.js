const bcrypt = require("bcryptjs")
const Cart = require("../models/Cart")
const Order = require("../models/Order")
const Product = require("../models/Product")
const User = require("../models/User")
const { seedDefaultCoupons } = require("./couponController")
const { STATUS_FLOW, syncOrderStatuses } = require("../utils/orderStatus")
const { getSessionCutoffDate, markExpiredSessionsOffline } = require("../utils/sessionStatus")

const getActiveProductQuery = () => ({
    $or: [
        { isActive: true },
        { isActive: { $exists: false } }
    ]
})

const getDashboardStats = async (req, res) => {
    try {
        await markExpiredSessionsOffline(User)

        const activeProductQuery = getActiveProductQuery()
        const [productsCount, usersCount, activeSessions, orders, lowStockProducts] = await Promise.all([
            Product.countDocuments(activeProductQuery),
            User.countDocuments({ role: "user" }),
            User.countDocuments({ role: "user", isSessionActive: true, lastSeenAt: { $gte: getSessionCutoffDate() } }),
            Order.find().populate("products.product"),
            Product.countDocuments({
                ...activeProductQuery,
                countInStock: { $lte: 5 }
            })
        ])

        await syncOrderStatuses(orders)

        const revenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
        const salesTrendMap = new Map()

        orders.forEach((order) => {
            const dateKey = new Date(order.createdAt).toISOString().slice(0, 10)
            const existing = salesTrendMap.get(dateKey) || { label: dateKey, value: 0, revenue: 0 }
            existing.value += 1
            existing.revenue += Number(order.totalPrice || 0)
            salesTrendMap.set(dateKey, existing)
        })

        const productVolumeMap = new Map()

        orders.forEach((order) => {
            ;(order.products || []).forEach((item) => {
                const label = item.name || item.product?.name || "Product"
                const existing = productVolumeMap.get(label) || 0
                productVolumeMap.set(label, existing + Number(item.quantity || 0))
            })
        })

        const orderStatusChart = [...STATUS_FLOW, "Cancelled"].map((status) => ({
            label: status,
            value: orders.filter((order) => order.status === status).length
        }))

        const salesTrend = Array.from(salesTrendMap.values())
            .sort((a, b) => a.label.localeCompare(b.label))
            .slice(-7)
            .map((item) => ({
                label: item.label,
                value: Number(item.revenue.toFixed(2))
            }))

        const topProducts = Array.from(productVolumeMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, value]) => ({ label, value }))

        const recentUsers = await User.find({ role: "user" })
            .sort({ createdAt: -1 })
            .limit(7)
            .select("name email createdAt")

        res.json({
            summary: {
                productsCount,
                usersCount,
                activeSessions,
                ordersCount: orders.length,
                revenue,
                lowStockProducts
            },
            charts: {
                orderStatus: orderStatusChart,
                recentUsers: recentUsers.map((user) => ({
                    label: user.name,
                    value: 1
                })),
                salesTrend,
                topProducts
            }
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getSalesReport = async (_req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate("user", "name email")
            .populate("products.product", "name category")

        await syncOrderStatuses(orders)

        const summary = {
            totalOrders: orders.length,
            totalRevenue: Number(orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0).toFixed(2)),
            totalDiscount: Number(orders.reduce((sum, order) => sum + Number(order.discountAmount || 0), 0).toFixed(2)),
            cancelledOrders: orders.filter((order) => order.status === "Cancelled").length,
            returnedOrders: orders.filter((order) => order.status === "Returned").length,
            returnRequests: orders.filter((order) => order.status === "Return Requested").length
        }

        const rows = orders.map((order) => ({
            orderId: order._id,
            invoiceNumber: order.invoiceNumber || "",
            customerName: order.user?.name || "Customer",
            customerEmail: order.user?.email || "",
            items: (order.products || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            itemsPrice: Number(order.itemsPrice || 0),
            discountAmount: Number(order.discountAmount || 0),
            shippingFee: Number(order.shippingFee || 0),
            taxPrice: Number(order.taxPrice || 0),
            totalPrice: Number(order.totalPrice || 0),
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            status: order.status,
            createdAt: order.createdAt
        }))

        res.json({ summary, rows })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const exportSalesReport = async (_req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate("user", "name email")

        await syncOrderStatuses(orders)

        const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`
        const headers = [
            "Invoice Number",
            "Order ID",
            "Customer Name",
            "Customer Email",
            "Status",
            "Payment Method",
            "Payment Status",
            "Items Price",
            "Discount",
            "Shipping",
            "Tax",
            "Total",
            "Placed At"
        ]

        const lines = [
            headers.join(","),
            ...orders.map((order) => ([
                order.invoiceNumber || "",
                order._id,
                order.user?.name || "Customer",
                order.user?.email || "",
                order.status,
                order.paymentMethod,
                order.paymentStatus,
                Number(order.itemsPrice || 0).toFixed(2),
                Number(order.discountAmount || 0).toFixed(2),
                Number(order.shippingFee || 0).toFixed(2),
                Number(order.taxPrice || 0).toFixed(2),
                Number(order.totalPrice || 0).toFixed(2),
                new Date(order.createdAt).toISOString()
            ]).map(escapeCsv).join(","))
        ]

        res.setHeader("Content-Type", "text/csv; charset=utf-8")
        res.setHeader("Content-Disposition", 'attachment; filename="sales-report.csv"')
        res.send(lines.join("\n"))
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getUsers = async (req, res) => {
    try {
        await markExpiredSessionsOffline(User)

        const page = Math.max(Number(req.query.page || 1), 1)
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50)
        const skip = (page - 1) * limit
        const search = String(req.query.search || "").trim()

        const query = { role: "user" }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        }

        const [users, totalUsers] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("-password"),
            User.countDocuments(query)
        ])

        res.json({
            items: users,
            pagination: {
                page,
                limit,
                totalUsers,
                totalPages: Math.max(Math.ceil(totalUsers / limit), 1)
            }
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getUserDetails = async (req, res) => {
    try {
        await markExpiredSessionsOffline(User)

        const user = await User.findById(req.params.id).select("-password")

        if (!user || user.role === "admin") {
            return res.status(404).json({ message: "User not found" })
        }

        const [cart, orders] = await Promise.all([
            Cart.findOne({ user: user._id }).populate("products.product"),
            Order.find({ user: user._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("products.product", "name image price category")
        ])

        res.json({
            user,
            cart,
            orders,
            stats: {
                cartItems: (cart?.products || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
                ordersCount: orders.length,
                totalSpent: orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0)
            }
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (user.role === "admin") {
            return res.status(400).json({ message: "Admin account cannot be deleted" })
        }

        await Promise.all([
            Cart.deleteMany({ user: user._id }),
            Order.deleteMany({ user: user._id }),
            User.findByIdAndDelete(user._id)
        ])

        res.json({ message: "User deleted successfully" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getAllCarts = async (req, res) => {
    try {
        const carts = await Cart.find()
            .populate("user", "name email")
            .populate("products.product")
            .sort({ updatedAt: -1 })

        res.json(carts)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getUserCartById = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.params.userId })
            .populate("user", "name email")
            .populate("products.product")

        if (!cart) {
            return res.status(404).json({ message: "Cart not found for this user" })
        }

        res.json(cart)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const seedHardcodedAdmin = async () => {
    const email = "admin@gmail.com"
    const password = "123456"
    const hashedPassword = await bcrypt.hash(password, 10)

    await User.findOneAndUpdate(
        { email },
        {
            name: "Store Admin",
            email,
            password: hashedPassword,
            role: "admin",
            isSessionActive: false,
            dob: "",
            phone: "",
            profileImage: "https://www.pngall.com/wp-content/uploads/5/Profile-Transparent.png",
            address: "",
            permanentAddress: "",
            wishlist: []
        },
        {
            upsert: true,
            returnDocument: "after",
            setDefaultsOnInsert: true
        }
    )

    await seedDefaultCoupons()
}

module.exports = {
    getDashboardStats,
    getSalesReport,
    exportSalesReport,
    getUsers,
    getUserDetails,
    deleteUser,
    getAllCarts,
    getUserCartById,
    seedHardcodedAdmin
}
