import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const GROUPS = [
  { 
    name: "Electronics", 
    subcategories: [
      { name: "MOBILES", query: "category/smartphones" },
      { name: "TABS", query: "category/tablets" },
      { name: "LAPTOPS", query: "category/laptops" },
      { name: "CAMERAS", query: "search?q=camera" }
    ]
  },
  { 
    name: "Wearables", 
    subcategories: [
      { name: "WATCHES", query: "category/mens-watches" },
      { name: "RINGS", query: "search?q=ring" },
      { name: "SUNGLASSES", query: "category/sunglasses" }
    ]
  },
  { 
    name: "Audio", 
    subcategories: [
      { name: "SPEAKERS", query: "search?q=speaker" },
      { name: "EARPHONES", query: "search?q=earphones" }
    ]
  },
  { 
    name: "Fashion", 
    subcategories: [
      { name: "SHIRTS", query: "category/mens-shirts" },
      { name: "T SHIRTS", query: "search?q=t-shirt" },
      { name: "JEANS", query: "search?q=jeans" },
      { name: "DRESSES", query: "category/womens-dresses" },
      { name: "FOOTWEAR", query: "category/mens-shoes" }
    ]
  },
  { 
    name: "Appliances", 
    subcategories: [
      { name: "TV", query: "search?q=television" },
      { name: "AC", query: "search?q=air+conditioner" },
      { name: "REFRIGERATOR", query: "search?q=refrigerator" },
      { name: "WASHING MACHINE", query: "search?q=washing+machine" }
    ]
  },
];

async function seedDatabase() {
  console.log("🚀 Starting database reset & dummyjson seeding...");

  try {
    // 1. Wipe existing critical tables
    console.log("🧹 Truncating existing products and related user data (cascading)...");
    await db.execute(sql`TRUNCATE TABLE products CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE orders CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE reviews CASCADE;`);

    // 2. Fetch products per group
    console.log("🌍 Fetching 5 items per group from DummyJSON...");
    
    let totalInserted = 0;

    for (const group of GROUPS) {
      console.log(`   -> Processing Group [${group.name}]...`);
      
      for (const sub of group.subcategories) {
        const separator = sub.query.includes("?") ? "&" : "?";
        const url = `https://dummyjson.com/products/${sub.query}${separator}limit=6`;
        const res = await fetch(url);
        if (!res.ok) continue;

        const data = (await res.json()) as { products: any[] };
        if (data.products && data.products.length > 0) {
          const insertPayloads = data.products.map((p: any) => {
            const basePriceInRs = Math.round(p.price * 80);
            const origPriceInRs = Math.round(basePriceInRs * 1.25);
            
            return {
              name: p.title,
              description: p.description,
              price: basePriceInRs.toString(),
              originalPrice: origPriceInRs.toString(),
              category: group.name,
              subcategory: sub.name,
              brand: p.brand || "Generic",
              imageUrl: p.thumbnail || (p.images && p.images[0]) || "",
              images: p.images || [],
              stock: p.stock || 50,
              rating: p.rating || 4.5,
              reviewCount: Math.floor(Math.random() * 100) + 5,
              demandScore: Math.random(),
              specs: {
                brand: p.brand,
                sku: p.sku,
                weight: p.weight ? `${p.weight}g` : "N/A",
                dimensions: p.dimensions ? `${p.dimensions.width}x${p.dimensions.height}x${p.dimensions.depth} cm` : "Standard",
                warranty: p.warrantyInformation,
                shipping: p.shippingInformation,
                availability: p.availabilityStatus,
                returnPolicy: p.returnPolicy,
                minOrder: p.minimumOrderQuantity
              }
            };
          });

          await db.insert(productsTable).values(insertPayloads);
          totalInserted += insertPayloads.length;
          console.log(`      ✅ Added ${insertPayloads.length} products to [${group.name} > ${sub.name}]`);
        }
      }
    }

    console.log(`\n✨ Success! Seeded exactly ${totalInserted} items from DummyJSON across 5 groups.`);
    setTimeout(() => process.exit(0), 1000);

  } catch (error) {
    console.error("❌ Fatal Error during seeding:", error);
    process.exit(1);
  }
}

seedDatabase();
