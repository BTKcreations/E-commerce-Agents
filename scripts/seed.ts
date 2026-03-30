import { db } from "../lib/db/src/index";
import { productsTable } from "../lib/db/src/schema/products";

async function main() {
  console.log("Seeding products...");
  
  const products = [
    {
      name: "NeoVibe Noise Cancelling Headphones",
      description: "Next-gen AI-powered noise cancellation with 60-hour battery life.",
      price: "299.99",
      category: "Electronics",
      brand: "NeoVibe",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000",
      stock: 50,
      rating: 4.8,
      reviewCount: 124,
      demandScore: 0.9,
      specs: { battery: "60h", noise_cancelling: "Active AI", connectivity: "Bluetooth 5.3" }
    },
    {
      name: "Quantum Ultra Watch",
      description: "Sophisticated smartwatch with holographic display and health tracking.",
      price: "399.00",
      category: "Wearables",
      brand: "Quantum",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000",
      stock: 30,
      rating: 4.9,
      reviewCount: 89,
      demandScore: 0.95,
      specs: { display: "Holographic AMOLED", battery: "10 days", water_resistance: "50m" }
    },
    {
      name: "Lumina Smart Lamp",
      description: "Ambient lighting that syncs with your mood and music.",
      price: "79.50",
      category: "Home Decor",
      brand: "Lumina",
      imageUrl: "https://images.unsplash.com/photo-1507473884658-6697ec36a1ab?q=80&w=1000",
      stock: 100,
      rating: 4.5,
      reviewCount: 210,
      demandScore: 0.7,
      specs: { brightness: "800 lumens", connectivity: "Wi-Fi, Zigbee", colors: "16M colors" }
    },
    {
      name: "Apex Precision Gaming Mouse",
      description: "Zero-latency wireless gaming mouse with 30k DPI sensor.",
      price: "129.99",
      category: "Electronics",
      brand: "Apex",
      imageUrl: "https://images.unsplash.com/photo-1527698266440-12104a498b76?q=80&w=1000",
      stock: 75,
      rating: 4.7,
      reviewCount: 56,
      demandScore: 0.85,
      specs: { dpi: "30000", weight: "63g", switches: "Optical" }
    }
  ];

  for (const product of products) {
    await db.insert(productsTable).values(product as any);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
