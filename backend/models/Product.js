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
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email address"]
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
            trim: true,
            minlength: 5,
            maxlength: 400
        },
        image: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
)

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 8,
            maxlength: 500
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
