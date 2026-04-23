const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
)

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            default: "General",
            trim: true
        },
        brand: {
            type: String,
            default: "",
            trim: true
        },
        image: {
            type: String,
            default: ""
        },
        countInStock: {
            type: Number,
            default: 0,
            min: 0
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 95
        },
        rating: {
            type: Number,
            default: 4.2,
            min: 0,
            max: 5
        },
        numReviews: {
            type: Number,
            default: 0
        },
        reviews: {
            type: [reviewSchema],
            default: []
        },
        featured: {
            type: Boolean,
            default: false
        },
        tags: {
            type: [String],
            default: []
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model("Product", productSchema)
