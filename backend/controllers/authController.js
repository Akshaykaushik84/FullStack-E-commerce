const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const path = require("path")

const DEFAULT_PROFILE_IMAGE = "https://www.pngall.com/wp-content/uploads/5/Profile-Transparent.png"

const profileDefaults = {
    dob: "",
    phone: "",
    profileImage: DEFAULT_PROFILE_IMAGE,
    address: "",
    permanentAddress: ""
}

const normalizeDateValue = (value) => {
    if (!value) return ""
    const rawValue = String(value).trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        return rawValue
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(rawValue)) {
        return rawValue.slice(0, 10)
    }

    const ddMmYyyyMatch = rawValue.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/)
    if (ddMmYyyyMatch) {
        const [, day, month, year] = ddMmYyyyMatch
        return `${year}-${month}-${day}`
    }

    const parsed = new Date(rawValue)
    if (Number.isNaN(parsed.getTime())) {
        return rawValue
    }

    return parsed.toISOString().slice(0, 10)
}

const normalizeTextValue = (value) => String(value || "").trim().toLowerCase()

const normalizeProfileFields = async (user) => {
    let hasChanges = false

    Object.entries(profileDefaults).forEach(([key, value]) => {
        if (typeof user[key] !== "string" || !String(user[key]).trim()) {
            user[key] = value
            hasChanges = true
        }
    })

    if (hasChanges) {
        await user.save()
    }

    return user
}

const markSessionActive = async (user) => {
    const now = new Date()
    user.isSessionActive = true
    user.lastLoginAt = now
    user.lastSeenAt = now
    await user.save()
    return user
}

const buildAuthResponse = (user) => ({
    user: {
        id: user._id,
        name: user.name,
        dob: user.dob,
        phone: user.phone,
        profileImage: user.profileImage,
        email: user.email,
        address: user.address,
        permanentAddress: user.permanentAddress,
        role: user.role,
        createdAt: user.createdAt
    }
})

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body
        const normalizedEmail = normalizeTextValue(email)

        const existingUser = await User.findOne({ email: normalizedEmail })
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            ...profileDefaults
        })

        await markSessionActive(user)

        const token = jwt.sign({ id: user._id }, "secretkey", {
            expiresIn: "1d"
        })

        res.status(201).json({
            token,
            ...buildAuthResponse(user)
        })
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const normalizedEmail = normalizeTextValue(email)

        const user = await User.findOne({ email: normalizedEmail })
        if (!user) return res.status(400).json({ message: "User not found" })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: "Invalid password" })

        await normalizeProfileFields(user)
        await markSessionActive(user)

        const token = jwt.sign({ id: user._id }, "secretkey", {
            expiresIn: "1d"
        })

        res.json({
            token,
            ...buildAuthResponse(user)
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (user) {
            user.isSessionActive = false
            await user.save()
        }

        res.json({ message: "Logged out successfully" })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        const { name, email, dob, newPassword } = req.body

        if (!name || !email || !dob || !newPassword) {
            return res.status(400).json({
                message: "Name, email, dob and new password are required"
            })
        }

        const normalizedName = normalizeTextValue(name)
        const normalizedEmail = normalizeTextValue(email)
        const normalizedDob = normalizeDateValue(dob)

        const user = await User.findOne({
            email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
        })

        if (!user) {
            return res.status(400).json({
                message: "Incorrect details. No account was found with this email."
            })
        }

        const storedName = normalizeTextValue(user.name)
        const storedDob = normalizeDateValue(user.dob)

        if (storedName !== normalizedName) {
            return res.status(400).json({
                message: "Incorrect details. Please check your name."
            })
        }

        if (storedDob && storedDob !== normalizedDob) {
            return res.status(400).json({
                message: "Incorrect details. Please check your date of birth."
            })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()

        res.json({ message: "Password reset successful. Please login again." })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        await normalizeProfileFields(user)

        const safeUser = user.toObject()
        delete safeUser.password

        res.json(safeUser)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.updateProfile = async (req, res) => {
    try {
        const {
            name,
            dob,
            phone,
            profileImage,
            address,
            permanentAddress,
            currentPassword,
            newEmail,
            newPassword
        } = req.body

        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const updates = {}

        if (typeof name === "string") updates.name = name
        if (typeof dob === "string") updates.dob = dob
        if (typeof phone === "string") updates.phone = phone
        if (typeof profileImage === "string") updates.profileImage = profileImage
        if (typeof address === "string") updates.address = address
        if (typeof permanentAddress === "string") {
            updates.permanentAddress = permanentAddress
        }

        const normalizedNewEmail = normalizeTextValue(newEmail)
        const wantsCredentialChange = Boolean(
            (typeof newEmail === "string" && normalizedNewEmail && normalizedNewEmail !== user.email) ||
            (typeof newPassword === "string" && newPassword)
        )

        if (wantsCredentialChange) {
            if (!currentPassword) {
                return res.status(400).json({
                    message: "Current password is required to change email or password"
                })
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password)
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" })
            }
        }

        if (
            typeof newEmail === "string" &&
            normalizedNewEmail &&
            normalizedNewEmail !== user.email
        ) {
            const existingUser = await User.findOne({
                email: normalizedNewEmail,
                _id: { $ne: req.user.id }
            })

            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" })
            }

            updates.email = normalizedNewEmail
        }

        if (typeof newPassword === "string" && newPassword) {
            updates.password = await bcrypt.hash(newPassword, 10)
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { returnDocument: "after", runValidators: true }
        ).select("-password")

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.uploadProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (!req.file) {
            return res.status(400).json({ message: "Please select an image to upload" })
        }

        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${path.basename(req.file.path)}`

        user.profileImage = imageUrl
        await user.save()

        res.json({
            message: "Profile image uploaded successfully",
            imageUrl,
            user: buildAuthResponse(user).user
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}
