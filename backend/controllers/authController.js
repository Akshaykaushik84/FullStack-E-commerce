const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET || "secretkey"

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

const isValidEmail = (value) =>
    /^(?!.*\.\.)[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(String(value || "").trim())
const isStrongEnoughPassword = (value) => String(value || "").length >= 6
const isValidPhone = (value) => !String(value || "").trim() || /^[6-9]\d{9}$/.test(String(value).trim())
const isValidUrl = (value) => {
    const rawValue = String(value || "").trim()
    if (!rawValue) return true

    try {
        const parsed = new URL(rawValue)
        return ["http:", "https:"].includes(parsed.protocol)
    } catch (_err) {
        return false
    }
}

const isValidProfileImageValue = (value) => {
    const rawValue = String(value || "").trim()
    if (!rawValue) return true

    if (/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(rawValue)) {
        return rawValue.length <= 3 * 1024 * 1024
    }

    return isValidUrl(rawValue)
}

const buildProfileImageDataUrl = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`

const getPlaceNameFromCoordinates = async (latitude, longitude) => {
    if (typeof fetch !== "function") {
        return ""
    }

    const controller = typeof AbortController === "function" ? new AbortController() : null
    const timeout = controller ? setTimeout(() => controller.abort(), 3500) : null

    try {
        const url = new URL("https://nominatim.openstreetmap.org/reverse")
        url.searchParams.set("format", "jsonv2")
        url.searchParams.set("lat", String(latitude))
        url.searchParams.set("lon", String(longitude))
        url.searchParams.set("zoom", "12")
        url.searchParams.set("addressdetails", "1")

        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
                "User-Agent": "CartSphere ecommerce location feature"
            },
            signal: controller?.signal
        })

        if (!response.ok) {
            return ""
        }

        const data = await response.json()
        const address = data.address || {}
        const city = address.city || address.town || address.village || address.suburb || address.county
        const region = address.state || address.country

        return [city, region].filter(Boolean).join(", ") || String(data.display_name || "").split(",").slice(0, 2).join(", ").trim()
    } catch (_err) {
        return ""
    } finally {
        if (timeout) clearTimeout(timeout)
    }
}

const buildLocationPayload = async (location = {}, currentLocation = {}) => {
    const latitude = Number(location.latitude)
    const longitude = Number(location.longitude)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null
    }

    const providedPlaceName = String(location.placeName || "").trim()
    const sameCoordinates =
        Number(currentLocation?.latitude) === latitude &&
        Number(currentLocation?.longitude) === longitude
    const placeName = providedPlaceName || (sameCoordinates ? currentLocation?.placeName : "") || await getPlaceNameFromCoordinates(latitude, longitude)

    return {
        latitude,
        longitude,
        mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        placeName: placeName || "Saved location",
        accuracy: Number.isFinite(Number(location.accuracy)) ? Number(location.accuracy) : null,
        updatedAt: new Date()
    }
}

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
        location: user.location || {},
        role: user.role,
        createdAt: user.createdAt
    }
})

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body
        const normalizedEmail = normalizeTextValue(email)

        const trimmedName = String(name || "").trim()

        if (trimmedName.length < 2) {
            return res.status(400).json({ message: "Name must be at least 2 characters" })
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address" })
        }

        if (!isStrongEnoughPassword(password)) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const existingUser = await User.findOne({ email: normalizedEmail })
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name: trimmedName,
            email: normalizedEmail,
            password: hashedPassword,
            ...profileDefaults
        })

        await markSessionActive(user)

        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: "1d"
        })

        res.status(201).json({
            token,
            ...buildAuthResponse(user)
        })
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const normalizedEmail = normalizeTextValue(email)

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address" })
        }

        if (!password) {
            return res.status(400).json({ message: "Password is required" })
        }

        const user = await User.findOne({ email: normalizedEmail })
        if (!user) return res.status(400).json({ message: "User not found" })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: "Invalid password" })

        await normalizeProfileFields(user)
        await markSessionActive(user)

        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: "1d"
        })

        res.json({
            token,
            ...buildAuthResponse(user)
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
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
        res.status(500).json({ message: err.message })
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

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address" })
        }

        if (!isStrongEnoughPassword(newPassword)) {
            return res.status(400).json({ message: "New password must be at least 6 characters" })
        }

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
        res.status(500).json({ message: err.message })
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
        res.status(500).json({ message: err.message })
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
            location,
            currentPassword,
            newEmail,
            newPassword
        } = req.body

        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const updates = {}

        if (typeof name === "string") {
            const trimmedName = name.trim()
            if (trimmedName.length < 2) {
                return res.status(400).json({ message: "Name must be at least 2 characters" })
            }
            updates.name = trimmedName
        }
        if (typeof dob === "string") updates.dob = normalizeDateValue(dob)
        if (typeof phone === "string") {
            if (!isValidPhone(phone)) {
                return res.status(400).json({ message: "Please enter a valid 10 digit Indian phone number" })
            }
            updates.phone = phone.trim()
        }
        if (typeof profileImage === "string") {
            if (!isValidProfileImageValue(profileImage)) {
                return res.status(400).json({ message: "Please upload a valid profile image" })
            }
            updates.profileImage = profileImage.trim() || DEFAULT_PROFILE_IMAGE
        }
        if (typeof address === "string") updates.address = address.trim()
        if (typeof permanentAddress === "string") {
            updates.permanentAddress = permanentAddress.trim()
        }
        if (location && typeof location === "object") {
            const nextLocation = await buildLocationPayload(location, user.location)

            if (!nextLocation) {
                return res.status(400).json({ message: "Please provide a valid location" })
            }

            updates.location = nextLocation
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
            if (!isValidEmail(normalizedNewEmail)) {
                return res.status(400).json({ message: "Please enter a valid email address" })
            }

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
            if (!isStrongEnoughPassword(newPassword)) {
                return res.status(400).json({ message: "Password must be at least 6 characters" })
            }
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
        res.status(500).json({ message: err.message })
    }
}

exports.updateLocation = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const nextLocation = await buildLocationPayload(req.body || {}, user.location)

        if (!nextLocation) {
            return res.status(400).json({ message: "Please provide a valid location" })
        }

        user.location = nextLocation
        user.lastSeenAt = new Date()
        await user.save()

        res.json({
            message: "Location updated successfully",
            user: buildAuthResponse(user).user
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.uploadProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (!req.file?.buffer) {
            return res.status(400).json({ message: "Please select an image to upload" })
        }

        const imageUrl = buildProfileImageDataUrl(req.file)

        user.profileImage = imageUrl
        await user.save()

        res.json({
            message: "Profile image uploaded successfully",
            imageUrl,
            user: buildAuthResponse(user).user
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}
