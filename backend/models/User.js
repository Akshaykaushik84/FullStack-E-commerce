const mongoose = require("mongoose")
const DEFAULT_PROFILE_IMAGE = "https://www.pngall.com/wp-content/uploads/5/Profile-Transparent.png"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    profileImage: {
        type: String,
        default: DEFAULT_PROFILE_IMAGE
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        default: ""
    },
    permanentAddress: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isSessionActive: {
        type: Boolean,
        default: false
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    lastSeenAt: {
        type: Date,
        default: null
    },
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ]
}, { timestamps: true })

module.exports = mongoose.model("User", userSchema)
