const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            match: [/^[A-Z0-9]{3,20}$/, "Coupon code must be 3-20 letters or numbers"]
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
            min: 1,
            validate: {
                validator(value) {
                    return this.discountType === "flat" || value <= 95
                },
                message: "Percentage discount must be between 1 and 95"
            }
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
