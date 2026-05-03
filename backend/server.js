const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const productRoutes = require("./routes/productRoutes")
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require("./routes/orderRoutes")
const couponRoutes = require("./routes/couponRoutes")
const wishlistRoutes = require("./routes/wishlistRoutes")
const { seedHardcodedAdmin } = require("./controllers/adminController")

const app = express()
const PORT = Number(process.env.PORT || 5000)
const frontendDistPath = path.resolve(__dirname, "../frontend/dist")
const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI

const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

if (process.env.RENDER_EXTERNAL_URL) {
    allowedOrigins.push(process.env.RENDER_EXTERNAL_URL)
}

app.use(cors({
    origin: (origin, callback) => {
        const isRenderPreview = origin && origin.endsWith(".onrender.com")

        if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin) || isRenderPreview) {
            return callback(null, true)
        }

        return callback(new Error("Not allowed by CORS"))
    }
}))

app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

if (mongoUrl) {
    mongoose.connect(mongoUrl)
        .then(async () => {
            await seedHardcodedAdmin()
            console.log("MongoDB Connected")
            console.log("Hardcoded admin ensured: admin@gmail.com / 123456")
        })
        .catch((err) => console.log("MongoDB connection error:", err.message))
} else {
    console.log("MongoDB connection error: MONGO_URL, MONGO_URI, or MONGODB_URI is missing")
}

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    })
})

app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/wishlist", wishlistRoutes)

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath))

    app.get(/^\/(?!api|uploads).*/, (req, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"))
    })
} else {
    app.get("/", (req, res) => {
        res.send("API running")
    })
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
