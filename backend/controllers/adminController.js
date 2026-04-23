const bcrypt = require("bcryptjs")
const Cart = require("../models/Cart")
const Order = require("../models/Order")
const Product = require("../models/Product")
const User = require("../models/User")
const { seedDefaultCoupons } = require("./couponController")

const getDashboardStats = async (req, res) => {
    try {
        const [productsCount, usersCount, activeSessions, orders, lowStockProducts] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            User.countDocuments({ role: "user" }),
            User.countDocuments({ isSessionActive: true }),
            Order.find().populate("products.product"),
            Product.countDocuments({ isActive: true, countInStock: { $lte: 5 } })
        ])

        const revenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)

        const orderStatusChart = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => ({
            label: status,
            value: orders.filter((order) => order.status === status).length
        }))

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
                }))
            }
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getUsers = async (req, res) => {
    try {
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
    getUsers,
    deleteUser,
    getAllCarts,
    getUserCartById,
    seedHardcodedAdmin
}
