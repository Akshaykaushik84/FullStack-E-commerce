const express = require("express")
const router = express.Router()
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const {
    register,
    login,
    forgotPassword,
    logout,
    getProfile,
    updateProfile,
    uploadProfileImage
} = require("../controllers/authController")
const authMiddleware = require("../middleware/authMiddleware")

const uploadDirectory = path.join(__dirname, "..", "uploads")

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || ".png")
        cb(null, `profile-${Date.now()}${extension}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }
})

router.post("/register", register)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.post("/logout", authMiddleware, logout)
router.get("/profile", authMiddleware, getProfile)
router.put("/profile", authMiddleware, updateProfile)
router.post("/profile-image", authMiddleware, upload.single("profileImage"), uploadProfileImage)

module.exports = router
