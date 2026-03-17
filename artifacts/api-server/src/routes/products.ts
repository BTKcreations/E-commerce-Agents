import { Router, type IRouter } from "express";
import { db, productsTable, reviewsTable } from "@workspace/db";
import { eq, like, gte, lte, and, desc, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy } = req.query as Record<string, string>;

    let query = db.select().from(productsTable);
    const conditions = [];

    if (category) conditions.push(eq(productsTable.category, category));
    if (search) conditions.push(like(productsTable.name, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, minPrice));
    if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));

    let results;
    if (conditions.length > 0) {
      // @ts-ignore
      results = await db.select().from(productsTable).where(and(...conditions));
    } else {
      results = await db.select().from(productsTable);
    }

    const products = results.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      specs: p.specs || {},
      tags: (p.tags as string[]) || [],
    }));

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list products" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const [product] = await db
      .insert(productsTable)
      .values({
        name: body.name,
        description: body.description,
        price: String(body.price),
        category: body.category,
        brand: body.brand,
        imageUrl: body.imageUrl,
        stock: body.stock,
        specs: body.specs || {},
        tags: body.tags || [],
      })
      .returning();
    res.status(201).json({ ...product, price: Number(product.price) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      specs: product.specs || {},
      tags: (product.tags as string[]) || [],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get product" });
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, id));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to get reviews" });
  }
});

router.post("/:id/reviews", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { author, rating, title, body } = req.body;

    const [review] = await db
      .insert(reviewsTable)
      .values({ productId, author, rating, title, body })
      .returning();

    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, productId));
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await db
      .update(productsTable)
      .set({ rating: avgRating, reviewCount: reviews.length })
      .where(eq(productsTable.id, productId));

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: "Failed to add review" });
  }
});

export default router;
