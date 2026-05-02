const multer = require("multer")
const fs = require("fs")
const path = require("path")

const uploadDirectory = path.join(__dirname, "..", "uploads")

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname || ".png")
        const prefix = String(req.uploadPrefix || "file").replace(/[^a-z0-9-]/gi, "").toLowerCase() || "file"
        cb(null, `${prefix}-${Date.now()}${extension}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 4 * 1024 * 1024 }
})

module.exports = {
    upload,
    uploadDirectory
}
