const mongoose = require("mongoose");
const Product = require("./models/Product");

mongoose.connect("mongodb://localhost:27017/akshayDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const products = [
  // 📱 Mobiles
  {
    name: "iPhone 15 Pro",
    price: 129999,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484a6f6d",
    description: "Apple flagship smartphone with A17 chip.",
    category: "Mobiles",
  },
  {
    name: "Samsung Galaxy S24",
    price: 99999,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf",
    description: "Premium Android phone with AMOLED display.",
    category: "Mobiles",
  },
  {
    name: "OnePlus 12",
    price: 64999,
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505",
    description: "High performance phone with fast charging.",
    category: "Mobiles",
  },

  // 💻 Electronics
  {
    name: "Gaming Laptop RTX",
    price: 89999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    description: "Powerful gaming laptop with RTX graphics.",
    category: "Electronics",
  },
  {
    name: "4K Smart TV",
    price: 55999,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6",
    description: "Ultra HD Smart TV with Dolby Vision.",
    category: "Electronics",
  },
  {
    name: "Bluetooth Speaker",
    price: 3499,
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad",
    description: "Portable speaker with deep bass.",
    category: "Electronics",
  },

  // 👕 Fashion
  {
    name: "Men's Leather Jacket",
    price: 4999,
    image: "https://images.unsplash.com/photo-1520975922284-5c5c4e2d8b07",
    description: "Premium leather winter jacket.",
    category: "Fashion",
  },
  {
    name: "Women's Handbag",
    price: 2999,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
    description: "Stylish handbag for daily use.",
    category: "Fashion",
  },
  {
    name: "Casual Sneakers",
    price: 2999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Comfortable everyday sneakers.",
    category: "Fashion",
  },

  // ⌚ Accessories
  {
    name: "Smart Watch Pro",
    price: 6999,
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b",
    description: "Fitness tracking smartwatch.",
    category: "Accessories",
  },
  {
    name: "Wireless Earbuds",
    price: 2499,
    image: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b",
    description: "True wireless earbuds with noise cancellation.",
    category: "Accessories",
  },
  {
    name: "Men's Sunglasses",
    price: 1499,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
    description: "UV protected stylish sunglasses.",
    category: "Accessories",
  },

  // 🏠 Home
  {
    name: "Coffee Maker",
    price: 3999,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
    description: "Automatic coffee maker for home.",
    category: "Home",
  },
  {
    name: "Office Chair",
    price: 7999,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    description: "Ergonomic comfortable office chair.",
    category: "Home",
  },

  // 🎮 Gaming
  {
    name: "PlayStation 5",
    price: 54999,
    image: "https://images.unsplash.com/photo-1606813909354-3e3d0c7f4c89",
    description: "Next-gen gaming console.",
    category: "Gaming",
  },
  {
    name: "iPhone 15 Pro",
    price: 129999,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484a6f6d",
    description: "Apple flagship smartphone with A17 chip.",
    category: "Mobiles",
  },
  {
    name: "Samsung Galaxy S24",
    price: 99999,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf",
    description: "Premium Android phone with AMOLED display.",
    category: "Mobiles",
  },
  {
    name: "OnePlus 12",
    price: 64999,
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505",
    description: "High performance phone with fast charging.",
    category: "Mobiles",
  },

  // 💻 Electronics
  {
    name: "Gaming Laptop RTX",
    price: 89999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    description: "Powerful gaming laptop with RTX graphics.",
    category: "Electronics",
  },
  {
    name: "4K Smart TV",
    price: 55999,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6",
    description: "Ultra HD Smart TV with Dolby Vision.",
    category: "Electronics",
  },
  {
    name: "Bluetooth Speaker",
    price: 3499,
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad",
    description: "Portable speaker with deep bass.",
    category: "Electronics",
  },

  // 👕 Fashion
  {
    name: "Men's Leather Jacket",
    price: 4999,
    image: "https://images.unsplash.com/photo-1520975922284-5c5c4e2d8b07",
    description: "Premium leather winter jacket.",
    category: "Fashion",
  },
  {
    name: "Women's Handbag",
    price: 2999,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
    description: "Stylish handbag for daily use.",
    category: "Fashion",
  },
  {
    name: "Casual Sneakers",
    price: 2999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Comfortable everyday sneakers.",
    category: "Fashion",
  },

  // ⌚ Accessories
  {
    name: "Smart Watch Pro",
    price: 6999,
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b",
    description: "Fitness tracking smartwatch.",
    category: "Accessories",
  },
  {
    name: "Wireless Earbuds",
    price: 2499,
    image: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b",
    description: "True wireless earbuds with noise cancellation.",
    category: "Accessories",
  },
  {
    name: "Men's Sunglasses",
    price: 1499,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
    description: "UV protected stylish sunglasses.",
    category: "Accessories",
  },

  // 🏠 Home
  {
    name: "Coffee Maker",
    price: 3999,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
    description: "Automatic coffee maker for home.",
    category: "Home",
  },
  {
    name: "Office Chair",
    price: 7999,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    description: "Ergonomic comfortable office chair.",
    category: "Home",
  },

  // 🎮 Gaming
  {
    name: "PlayStation 5",
    price: 54999,
    image: "https://images.unsplash.com/photo-1606813909354-3e3d0c7f4c89",
    description: "Next-gen gaming console.",
    category: "Gaming",
  },
];

const seedData = async () => {
  try {
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log("✅ 15 Products Inserted Successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
