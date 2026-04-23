const Coupon = require("../models/Coupon")

const normalizeCouponCode = (code) => String(code || "").trim().toUpperCase()

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
    seedDefaultCoupons,
    computeCouponDiscount,
    normalizeCouponCode
}
