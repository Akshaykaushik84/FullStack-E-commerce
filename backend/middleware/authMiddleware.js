const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { isSessionExpired, touchUserSession } = require("../utils/sessionStatus")

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"

const authMiddleware = async (req, res, next) => {
    const authHeader = req.header("Authorization")

    if (!authHeader) {
        return res.status(401).json({ message: "No token, access denied" })
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader

    try {
        const verified = jwt.verify(token, JWT_SECRET)
        const user = await User.findById(verified.id).select("role name email isSessionActive lastSeenAt")

        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        if (isSessionExpired(user)) {
            user.isSessionActive = false
            await user.save()
            return res.status(401).json({ message: "Session expired. Please login again." })
        }

        await touchUserSession(user)

        req.user = {
            ...verified,
            name: user.name || "",
            email: user.email || "",
            role: user.role || "user"
        }
        next()
    } catch (err) {
        res.status(400).json({ message: "Invalid token" })
    }
}

module.exports = authMiddleware
