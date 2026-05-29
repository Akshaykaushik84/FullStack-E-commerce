const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        products: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                quantity: { type: Number, default: 1, min: 1 },
                unitPrice: { type: Number, required: true, min: 0 },
                name: { type: String, required: true, trim: true },
                image: { type: String, default: "" }
            }
        ],
        shippingAddress: {
            fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
            phone: { type: String, required: true, trim: true, match: [/^[6-9]\d{9}$/, "Please enter a valid phone number"] },
            addressLine: { type: String, required: true, trim: true, minlength: 8, maxlength: 240 },
            city: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
            state: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
            postalCode: { type: String, required: true, trim: true, match: [/^\d{6}$/, "Please enter a valid postal code"] },
            country: { type: String, default: "India" },
            location: {
                latitude: { type: Number, default: null },
                longitude: { type: Number, default: null },
                mapUrl: { type: String, default: "" }
            }
        },
        paymentMethod: {
            type: String,
            enum: [
                "Cash on Delivery",
                "UPI",
                "Debit/Credit Card",
                "Net Banking",
                "Wallet",
                "Card",
                "Mock Gateway"
            ],
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
        invoiceNumber: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Shipped", "Delivered", "Cancelled", "Return Requested", "Returned"],
            default: "Pending"
        },
        statusManuallyUpdated: {
            type: Boolean,
            default: false
        },
        statusUpdatedAt: {
            type: Date,
            default: null
        },
        cancelReason: {
            type: String,
            default: "",
            trim: true,
            maxlength: 250
        },
        returnReason: {
            type: String,
            default: "",
            trim: true,
            maxlength: 250
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model("Order", orderSchema)
