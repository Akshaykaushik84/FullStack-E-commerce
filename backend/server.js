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

const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error("Not allowed by CORS"))
    }
}))

app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

mongoose.connect(process.env.MONGO_URL)
    .then(async () => {
        await seedHardcodedAdmin()
        console.log("MongoDB Connected")
        console.log("Hardcoded admin ensured: admin@gmail.com / 123456")
    })
    .catch((err) => console.log(err))

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime()
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
