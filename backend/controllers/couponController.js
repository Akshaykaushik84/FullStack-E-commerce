const Coupon = require("../models/Coupon")

const normalizeCouponCode = (code) => String(code || "").trim().toUpperCase()
const parseBoolean = (value, defaultValue = true) => {
    if (typeof value === "boolean") return value
    if (typeof value === "string") {
        if (value.toLowerCase() === "true") return true
        if (value.toLowerCase() === "false") return false
    }
    if (value === undefined || value === null) return defaultValue
    return Boolean(value)
}

const computeCouponDiscount = (coupon, subtotal) => {
    if (!coupon) {
        return 0
    }

    if (subtotal < coupon.minimumOrderAmount) {
        return 0
    }

    if (coupon.discountType === "flat") {
        return Math.min(coupon.discountValue, subtotal)
    }

    return Number(((subtotal * coupon.discountValue) / 100).toFixed(2))
}

const buildCouponPayload = (body = {}) => ({
    code: normalizeCouponCode(body.code),
    description: String(body.description || "").trim(),
    discountType: body.discountType === "flat" ? "flat" : "percentage",
    discountValue: Number(body.discountValue || 0),
    minimumOrderAmount: Number(body.minimumOrderAmount || 0),
    isActive: parseBoolean(body.isActive, true)
})

const validateCouponPayload = (payload) => {
    if (!/^[A-Z0-9]{3,20}$/.test(payload.code)) {
        return "Coupon code must be 3-20 letters or numbers"
    }

    if (!Number.isFinite(payload.discountValue) || payload.discountValue <= 0) {
        return "Discount value must be greater than 0"
    }

    if (payload.discountType === "percentage" && payload.discountValue > 95) {
        return "Percentage discount must be between 1 and 95"
    }

    if (!Number.isFinite(payload.minimumOrderAmount) || payload.minimumOrderAmount < 0) {
        return "Minimum order amount must be 0 or more"
    }

    if (payload.description && payload.description.length > 160) {
        return "Coupon description must be 160 characters or less"
    }

    return ""
}

const validateCoupon = async (req, res) => {
    try {
        const code = normalizeCouponCode(req.query.code)
        const subtotal = Number(req.query.subtotal || 0)

        if (!code) {
            return res.status(400).json({ message: "Coupon code is required" })
        }

        const coupon = await Coupon.findOne({ code, isActive: true })

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found or inactive" })
        }

        if (subtotal < coupon.minimumOrderAmount) {
            return res.status(400).json({
                message: `Minimum order amount for this coupon is Rs ${coupon.minimumOrderAmount}`
            })
        }

        const discountAmount = computeCouponDiscount(coupon, subtotal)

        res.json({
            code: coupon.code,
            description: coupon.description,
            discountAmount,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minimumOrderAmount: coupon.minimumOrderAmount
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getCoupons = async (_req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 })
        res.json(coupons)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const createCoupon = async (req, res) => {
    try {
        const payload = buildCouponPayload(req.body)

        const validationError = validateCouponPayload(payload)
        if (validationError) {
            return res.status(400).json({ message: validationError })
        }

        const existingCoupon = await Coupon.findOne({ code: payload.code })

        if (existingCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" })
        }

        const coupon = await Coupon.create(payload)
        res.status(201).json(coupon)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

const updateCoupon = async (req, res) => {
    try {
        const payload = buildCouponPayload(req.body)
        const validationError = validateCouponPayload(payload)

        if (validationError) {
            return res.status(400).json({ message: validationError })
        }

        const existing = await Coupon.findOne({ code: payload.code, _id: { $ne: req.params.id } })

        if (existing) {
            return res.status(400).json({ message: "Coupon code already exists" })
        }

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            payload,
            { returnDocument: "after", runValidators: true }
        )

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" })
        }

        res.json(coupon)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id)

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" })
        }

        res.json({ message: "Coupon deleted successfully" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const seedDefaultCoupons = async () => {
    const coupons = [
        {
            code: "WELCOME10",
            description: "10% off on orders above Rs 999",
            discountType: "percentage",
            discountValue: 10,
            minimumOrderAmount: 999,
            isActive: true
        },
        {
            code: "SAVE150",
            description: "Flat Rs 150 off on orders above Rs 1499",
            discountType: "flat",
            discountValue: 150,
            minimumOrderAmount: 1499,
            isActive: true
        }
    ]

    for (const coupon of coupons) {
        await Coupon.findOneAndUpdate(
            { code: coupon.code },
            coupon,
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        )
    }
}

module.exports = {
    validateCoupon,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    seedDefaultCoupons,
    computeCouponDiscount,
    normalizeCouponCode
}
