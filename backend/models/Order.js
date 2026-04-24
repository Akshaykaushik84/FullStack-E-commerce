const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        products: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                quantity: { type: Number, default: 1, min: 1 },
                unitPrice: { type: Number, required: true, min: 0 },
                name: { type: String, required: true },
                image: { type: String, default: "" }
            }
        ],
        shippingAddress: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            addressLine: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, default: "India" }
        },
        paymentMethod: {
            type: String,
            enum: ["Cash on Delivery", "UPI", "Card", "Mock Gateway"],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending"
        },
        couponCode: {
            type: String,
            default: ""
        },
        discountAmount: { type: Number, required: true, min: 0, default: 0 },
        itemsPrice: { type: Number, required: true, min: 0 },
        shippingFee: { type: Number, required: true, min: 0 },
        taxPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Shipped", "Delivered", "Cancelled"],
            default: "Pending"
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model("Order", orderSchema)
