const mongoose = require("mongoose")
const DEFAULT_PROFILE_IMAGE = "https://www.pngall.com/wp-content/uploads/5/Profile-Transparent.png"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
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
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^(?!.*\.\.)[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/,
            "Please enter a valid email address"
        ]
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
        required: true,
        minlength: 6
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
