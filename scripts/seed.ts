import { db } from "../lib/db/src/index";
import { productsTable } from "../lib/db/src/schema/products";

async function main() {
  console.log("Seeding products...");
  
  // We'll skip deleting existing products to avoid breaking foreign key constraints
  // Note: if you want a fresh DB, you may need to drop referenced tables or use TRUNCATE CASCADE.
  console.log("Appending new products to the existing database...");

  const products = [
    {
      name: "Apple iPhone 15 Pro, 256GB",
      description: "Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and a more versatile Pro camera system.",
      price: "1099.00",
      originalPrice: "1199.00",
      category: "Electronics",
      brand: "Apple",
      imageUrl: "https://images.unsplash.com/photo-1695048064971-ceb5c14107bc?q=80&w=1000",
      stock: 120,
      rating: 4.8,
      reviewCount: 3450,
      demandScore: 0.95,
      specs: { screen: "6.1 Super Retina XDR", processor: "A17 Pro", storage: "256GB" },
      tags: ["smartphone", "apple", "iphone"]
    },
    {
      name: "MacBook Pro 14-inch (M3 Pro)",
      description: "Mind-blowing. Head-turning. The new MacBook Pro featuring the M3 Pro chip delivers incredible performance and up to 18 hours of battery life.",
      price: "1999.00",
      originalPrice: "2099.00",
      category: "Computers",
      brand: "Apple",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000",
      stock: 45,
      rating: 4.9,
      reviewCount: 1204,
      demandScore: 0.98,
      specs: { memory: "18GB Unified Array", storage: "512GB SSD", display: "Liquid Retina XDR" },
      tags: ["laptop", "macbook", "apple"]
    },
    {
      name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      description: "Industry-leading noise cancellation with Auto NC Optimizer, Magnificent Sound, and up to 30-hour battery life.",
      price: "348.00",
      originalPrice: "398.00",
      category: "Electronics",
      brand: "Sony",
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000",
      stock: 200,
      rating: 4.7,
      reviewCount: 8940,
      demandScore: 0.90,
      specs: { battery: "30h", connection: "Bluetooth 5.2", weight: "250g" },
      tags: ["headphones", "audio", "sony"]
    },
    {
      name: "Samsung Galaxy S24 Ultra, 512GB",
      description: "Epic, just like that. Unleash new ways to create, connect and more with Galaxy AI. Comes with built-in S Pen.",
      price: "1299.99",
      originalPrice: "1419.99",
      category: "Electronics",
      brand: "Samsung",
      imageUrl: "https://images.unsplash.com/photo-1707253457581-2287a988d447?q=80&w=1000",
      stock: 85,
      rating: 4.8,
      reviewCount: 2130,
      demandScore: 0.94,
      specs: { screen: "6.8 Dynamic AMOLED 2X", processor: "Snapdragon 8 Gen 3", camera: "200MP" },
      tags: ["smartphone", "samsung", "android"]
    },
    {
      name: "LG C3 Series 65-Inch Class OLED evo 4K Smart TV",
      description: "Powered by the a9 AI Processor Gen6, the LG OLED evo C3 experiences a brighter picture with deep blacks.",
      price: "1596.99",
      originalPrice: "1999.99",
      category: "Home Appliances",
      brand: "LG",
      imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=1000",
      stock: 20,
      rating: 4.8,
      reviewCount: 1540,
      demandScore: 0.88,
      specs: { resolution: "4K UHD", refresh_rate: "120Hz", type: "OLED" },
      tags: ["tv", "lg", "oled"]
    },
    {
      name: "Dyson V15 Detect Absolute Cordless Vacuum",
      description: "Dyson's most powerful, intelligent cordless vacuum. Laser reveals microscopic dust.",
      price: "749.00",
      originalPrice: "799.00",
      category: "Home Appliances",
      brand: "Dyson",
      imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1000",
      stock: 60,
      rating: 4.6,
      reviewCount: 830,
      demandScore: 0.82,
      specs: { runtime: "60 mins", bin_volume: "0.2 gal", weight: "6.8 lbs" },
      tags: ["vacuum", "home", "dyson"]
    },
    {
      name: "Philips Hue White and Color Ambiance Starter Kit",
      description: "Limitless possibilities. Add color to any room with a single smart bulb, which offers warm to cool white light as well as 16 million colors.",
      price: "179.00",
      originalPrice: "199.00",
      category: "Home Decor",
      brand: "Philips",
      imageUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1000",
      stock: 150,
      rating: 4.7,
      reviewCount: 4200,
      demandScore: 0.75,
      specs: { type: "A19", lumens: "800", wattage: "9.5W" },
      tags: ["lighting", "smart home", "philips"]
    },
    {
      name: "Nintendo Switch\u2122 \u2013 OLED Model",
      description: "Play at home or on the go with a vibrant OLED screen. Includes a wide, adjustable stand.",
      price: "349.99",
      originalPrice: "349.99",
      category: "Video Games",
      brand: "Nintendo",
      imageUrl: "https://images.unsplash.com/photo-1605901309584-818e25d60b13?q=80&w=1000",
      stock: 80,
      rating: 4.9,
      reviewCount: 15600,
      demandScore: 0.96,
      specs: { screen: "7.0 OLED", storage: "64GB", battery: "4.5-9h" },
      tags: ["gaming", "console", "nintendo"]
    },
    {
      name: "Logitech MX Master 3S Wireless Mouse",
      description: "An iconic mouse remastered. Experience ultimate precision and quiet clicks with an 8000 DPI sensor.",
      price: "99.99",
      originalPrice: "109.99",
      category: "Computers",
      brand: "Logitech",
      imageUrl: "https://images.unsplash.com/photo-1615663245857-ac1eeb536628?q=80&w=1000",
      stock: 110,
      rating: 4.8,
      reviewCount: 6520,
      demandScore: 0.85,
      specs: { sensor: "8000 DPI", buttons: "7", scrolling: "MagSpeed" },
      tags: ["mouse", "logitech", "accessories"]
    },
    {
      name: "Sony Alpha a7 IV Mirrorless Camera",
      description: "True-to-life resolution and remarkable AI-powered autofocus for creators who demand the best.",
      price: "2498.00",
      originalPrice: "2698.00",
      category: "Cameras",
      brand: "Sony",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000",
      stock: 15,
      rating: 4.9,
      reviewCount: 890,
      demandScore: 0.88,
      specs: { sensor: "33MP Full-Frame", video: "4K 60p", autofocus: "Real-time Eye AF" },
      tags: ["camera", "photography", "sony"]
    }
  ];

  for (const product of products) {
    await db.insert(productsTable).values(product as any);
  }

  console.log(`Seeding complete! Added ${products.length} real e-commerce products.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
