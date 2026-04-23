const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
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

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

mongoose.connect(process.env.MONGO_URL)
.then(async () => {
    await seedHardcodedAdmin()
    console.log("MongoDB Connected")
    console.log("Hardcoded admin ensured: admin@gmail.com / 123456")
})
.catch(err => console.log(err))

app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/wishlist", wishlistRoutes)

app.get("/", (req, res) => {
    res.send("API running")
})

app.listen(5000, () => {
    console.log("Server running on port 5000")
})
