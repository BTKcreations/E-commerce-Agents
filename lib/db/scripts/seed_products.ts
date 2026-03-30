import { db, productsTable } from "../src/index";

const categories = ["Electronics", "Wearables", "Home Decor", "Audio", "Fitness", "Kitchen", "Office"];
const brands = ["NeoVibe", "Quantum", "Lumina", "Apex", "Zenith", "EcoSmart", "Titan"];

const products = [];

for (let i = 1; i <= 50; i++) {
  const category = categories[i % categories.length];
  const brand = brands[i % brands.length];
  const price = Math.round(50 + Math.random() * 1000);
  
  products.push({
    name: `${brand} ${category} Model ${i}`,
    description: `A high-performance ${category.toLowerCase()} device by ${brand}, designed for modern living.`,
    price: String(price),
    originalPrice: String(Math.round(price * 1.2)),
    category,
    brand,
    imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?q=80&w=1000`, // Placeholder
    stock: Math.floor(Math.random() * 100) + 10,
    rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 500),
    specs: { version: "1.0", features: ["Fast Charging", "Wireless"] },
    tags: [category.toLowerCase(), brand.toLowerCase()],
    demandScore: Math.random()
  });
}

async function seed() {
  console.log(`Seeding 50 products...`);
  await db.insert(productsTable).values(products);
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(console.error);
