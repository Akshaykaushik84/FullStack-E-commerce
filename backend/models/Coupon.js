const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        discountType: {
            type: String,
            enum: ["percentage", "flat"],
            default: "percentage"
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        minimumOrderAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model("Coupon", couponSchema)
