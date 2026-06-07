const express = require("express")
const router = express.Router()
const multer = require("multer")
const {
    register,
    login,
    forgotPassword,
    logout,
    getProfile,
    updateProfile,
    updateLocation,
    heartbeat,
    uploadProfileImage
} = require("../controllers/authController")
const authMiddleware = require("../middleware/authMiddleware")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype || "")) {
            cb(null, true)
            return
        }

        cb(new Error("Only image files are allowed"))
    }
})

router.post("/register", register)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.post("/logout", authMiddleware, logout)
router.get("/profile", authMiddleware, getProfile)
router.put("/profile", authMiddleware, updateProfile)
router.patch("/location", authMiddleware, updateLocation)
router.post("/heartbeat", authMiddleware, heartbeat)
router.post("/profile-image", authMiddleware, upload.single("profileImage"), uploadProfileImage)

module.exports = router
