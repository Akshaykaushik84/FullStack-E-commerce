const jwt = require("jsonwebtoken")
const User = require("../models/User")

const authMiddleware = async (req, res, next) => {
    const authHeader = req.header("Authorization")

    if (!authHeader) {
        return res.status(401).json({ message: "No token, access denied" })
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader

    try {
        const verified = jwt.verify(token, "secretkey")
        const user = await User.findById(verified.id).select("role name email isSessionActive lastSeenAt")

        if (user) {
            user.isSessionActive = true
            user.lastSeenAt = new Date()
            await user.save()
        }

        req.user = {
            ...verified,
            name: user?.name || "",
            email: user?.email || "",
            role: user?.role || "user"
        }
        next()
    } catch (err) {
        res.status(400).json({ message: "Invalid token" })
    }
}

module.exports = authMiddleware
