const mongoose = require("mongoose")
const dotenv = require("dotenv")
const dns = require("dns")
const Product = require("./models/Product")

dotenv.config({ path: "./.env" })

dns.setServers((process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean))

const colorVariants = [
    "Black",
    "White",
    "Blue",
    "Green",
    "Brown",
    "Silver"
]

const buildUniqueProductImage = (category, templateName, tags, productIndex) => {
    const label = encodeURIComponent(templateName)

    return `https://placehold.co/1200x900/f8fafc/0f172a/png?text=${label}`
}

const categoryBlueprints = [
    {
        category: "Mobiles",
        templates: [
            { name: "Smartphone", brand: "NovaTech", price: 24999, tags: ["5G", "amoled", "camera"] },
            { name: "Android Phone", brand: "PixelCore", price: 41999, tags: ["android", "premium", "battery"] },
            { name: "Slim Phone", brand: "Zen", price: 18999, tags: ["slim", "fast-charge", "display"] },
            { name: "Gaming Phone", brand: "Orbit", price: 32999, tags: ["performance", "gaming", "dual-sim"] }
        ]
    },
    {
        category: "Laptops",
        templates: [
            { name: "Laptop", brand: "Aero", price: 68999, tags: ["creator", "ssd", "lightweight"] },
            { name: "Gaming Laptop", brand: "Volt", price: 94999, tags: ["gaming", "rtx", "144hz"] },
            { name: "Notebook", brand: "WorkMate", price: 55999, tags: ["office", "portable", "battery"] },
            { name: "Studio Laptop", brand: "Prime", price: 104999, tags: ["pro", "display", "performance"] }
        ]
    },
    {
        category: "Audio",
        templates: [
            { name: "Earbuds", brand: "Pulse", price: 3499, tags: ["tws", "noise-cancel", "daily-use"] },
            { name: "Speaker", brand: "Echo", price: 5999, tags: ["speaker", "portable", "bass"] },
            { name: "Headphones", brand: "StudioSound", price: 7999, tags: ["headphones", "over-ear", "music"] },
            { name: "Soundbar", brand: "Wave", price: 12999, tags: ["tv", "soundbar", "home"] }
        ]
    },
    {
        category: "Wearables",
        templates: [
            { name: "Smart Watch", brand: "Stride", price: 4999, tags: ["watch", "fitness", "health"] },
            { name: "Fitness Band", brand: "Active", price: 2499, tags: ["band", "steps", "sleep"] },
            { name: "GPS Watch", brand: "Core", price: 8999, tags: ["gps", "sports", "training"] },
            { name: "Health Tracker", brand: "Aura", price: 6999, tags: ["tracker", "wellness", "smart"] }
        ]
    },
    {
        category: "Gaming",
        templates: [
            { name: "Game Console", brand: "Phantom", price: 49999, tags: ["console", "4k", "exclusive"] },
            { name: "Keyboard", brand: "Turbo", price: 3999, tags: ["keyboard", "rgb", "esports"] },
            { name: "Mouse", brand: "Reactor", price: 2499, tags: ["mouse", "dpi", "gaming"] },
            { name: "Monitor", brand: "BattleView", price: 18999, tags: ["monitor", "165hz", "gaming"] }
        ]
    },
    {
        category: "Home",
        templates: [
            { name: "Floor Lamp", brand: "Luma", price: 4599, tags: ["home", "decor", "lighting"] },
            { name: "Chair", brand: "Comfort", price: 10999, tags: ["furniture", "chair", "living-room"] },
            { name: "Table", brand: "Nordic", price: 3799, tags: ["table", "minimal", "wood"] },
            { name: "Bedding Set", brand: "SoftNest", price: 2999, tags: ["bedding", "bedroom", "cotton"] }
        ]
    },
    {
        category: "Kitchen",
        templates: [
            { name: "Air Fryer", brand: "ChefMate", price: 6999, tags: ["air-fryer", "healthy", "cooking"] },
            { name: "Coffee Maker", brand: "BrewCraft", price: 5499, tags: ["coffee", "appliance", "kitchen"] },
            { name: "Mixer", brand: "FreshBlend", price: 4299, tags: ["mixer", "smoothies", "appliance"] },
            { name: "Knife Set", brand: "ProCook", price: 2399, tags: ["knife", "chef", "prep"] }
        ]
    },
    {
        category: "Fashion",
        templates: [
            { name: "Jacket", brand: "Urban", price: 3499, tags: ["jacket", "casual", "denim"] },
            { name: "Sneakers", brand: "Classic", price: 2999, tags: ["shoes", "streetwear", "comfort"] },
            { name: "Hoodie", brand: "Daily", price: 1999, tags: ["hoodie", "winter", "soft"] },
            { name: "Tote Bag", brand: "Signature", price: 2299, tags: ["bag", "women", "style"] }
        ]
    },
    {
        category: "Beauty",
        templates: [
            { name: "Skin Kit", brand: "GlowCare", price: 1799, tags: ["skincare", "glow", "routine"] },
            { name: "Lip Set", brand: "Velvet", price: 1299, tags: ["makeup", "lipstick", "beauty"] },
            { name: "Face Serum", brand: "PureMist", price: 1599, tags: ["serum", "hydration", "care"] },
            { name: "Hair Dryer", brand: "SalonDry", price: 2899, tags: ["hair", "dryer", "styling"] }
        ]
    },
    {
        category: "Fitness",
        templates: [
            { name: "Yoga Mat", brand: "PowerFlex", price: 1499, tags: ["yoga", "mat", "training"] },
            { name: "Dumbbell Set", brand: "IronCore", price: 4999, tags: ["weights", "gym", "strength"] },
            { name: "Training Shoes", brand: "RunPro", price: 3999, tags: ["running", "fitness", "shoes"] },
            { name: "Water Bottle", brand: "Hydra", price: 699, tags: ["bottle", "gym", "hydration"] }
        ]
    },
    {
        category: "Office",
        templates: [
            { name: "Office Chair", brand: "ErgoDesk", price: 8999, tags: ["office", "chair", "ergonomic"] },
            { name: "Desk Lamp", brand: "Focus", price: 1999, tags: ["lamp", "study", "office"] },
            { name: "Planner Set", brand: "NoteFlow", price: 899, tags: ["stationery", "planner", "desk"] },
            { name: "Desk Organizer", brand: "DeskHub", price: 1299, tags: ["organizer", "workspace", "office"] }
        ]
    },
    {
        category: "Accessories",
        templates: [
            { name: "Phone Case", brand: "Shield", price: 899, tags: ["case", "mobile", "protection"] },
            { name: "Power Bank", brand: "ChargeMax", price: 1999, tags: ["powerbank", "charging", "travel"] },
            { name: "Sunglasses", brand: "Vision", price: 1499, tags: ["sunglasses", "fashion", "uv"] },
            { name: "Wallet", brand: "LeatherCo", price: 1199, tags: ["wallet", "daily-use", "premium"] }
        ]
    },
    {
        category: "Cameras",
        templates: [
            { name: "Camera", brand: "FrameShot", price: 64999, tags: ["camera", "mirrorless", "creator"] },
            { name: "Action Camera", brand: "ViewPro", price: 14999, tags: ["action-camera", "travel", "video"] },
            { name: "Camera Lens", brand: "Portrait", price: 18999, tags: ["lens", "photography", "prime"] },
            { name: "Tripod", brand: "TripodX", price: 2999, tags: ["tripod", "camera", "gear"] }
        ]
    },
    {
        category: "Furniture",
        templates: [
            { name: "Bookshelf", brand: "OakCraft", price: 6999, tags: ["bookshelf", "wood", "storage"] },
            { name: "Sofa", brand: "LoungeNest", price: 22999, tags: ["sofa", "living-room", "comfort"] },
            { name: "Bed Frame", brand: "SleepWell", price: 18999, tags: ["bed", "bedroom", "furniture"] },
            { name: "Dining Table", brand: "Compact", price: 16999, tags: ["dining", "table", "chairs"] }
        ]
    }
]

const buildProductDescription = (template, category, color) =>
    `${template.name} in ${color} finish for ${category.toLowerCase()} shoppers who want reliable quality, stylish design, and strong day-to-day performance.`

const createCatalog = () => {
    const products = []

    categoryBlueprints.forEach((blueprint, categoryIndex) => {
        blueprint.templates.forEach((template, templateIndex) => {
            colorVariants.forEach((color, colorIndex) => {
                const productIndex = products.length + 1
                const discountPercentage = productIndex % 5 === 0 ? 15 : productIndex % 7 === 0 ? 10 : 0
                const featured = templateIndex === 0 && colorIndex < 2
                const countInStock = 6 + ((categoryIndex + templateIndex + colorIndex) * 7) % 70
                const rating = Number((3.9 + ((templateIndex + colorIndex) % 10) * 0.1).toFixed(1))

                products.push({
                    name: `${template.name} - ${color}`,
                    price: template.price + colorIndex * 750 + templateIndex * 1200,
                    image: buildUniqueProductImage(
                        blueprint.category,
                        template.name,
                        template.tags,
                        productIndex
                    ),
                    description: buildProductDescription(template, blueprint.category, color),
                    category: blueprint.category,
                    brand: template.brand,
                    countInStock,
                    discountPercentage,
                    rating,
                    numReviews: 0,
                    reviews: [],
                    featured,
                    tags: [...template.tags, blueprint.category.toLowerCase(), color.toLowerCase().replace(/\s+/g, "-")],
                    isActive: true
                })
            })
        })
    })

    return products
}

const seedData = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI

        if (!mongoUrl) {
            throw new Error("MongoDB Atlas connection string is missing. Set MONGO_URL, MONGO_URI, or MONGODB_URI.")
        }

        await mongoose.connect(mongoUrl)
        console.log("MongoDB Connected")

        const products = createCatalog()

        await Product.deleteMany({})
        await Product.insertMany(products)

        const featuredCount = products.filter((product) => product.featured).length

        console.log(`Seed complete: ${products.length} products inserted`)
        console.log(`Featured products: ${featuredCount}`)
        console.log(`Categories covered: ${categoryBlueprints.length}`)
        process.exit(0)
    } catch (error) {
        console.error("Seed failed")
        console.error(error)
        process.exit(1)
    }
}

if (require.main === module) {
    seedData()
}

module.exports = {
    createCatalog,
    categoryBlueprints
}


