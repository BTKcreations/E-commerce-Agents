import { Router, type IRouter } from "express";
import { db, productsTable, reviewsTable } from "@workspace/db";
import { eq, like, gte, lte, and, desc, asc, sql, inArray, gt } from "drizzle-orm";
import { authenticate, authorizeAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { category, subcategory, search, minPrice, maxPrice, sortBy, brands, minRating, inStock } = req.query as Record<string, string>;

    let query = db.select().from(productsTable);
    const conditions = [];

    if (category) conditions.push(eq(productsTable.category, category));
    if (subcategory) conditions.push(eq(productsTable.subcategory, subcategory));
    if (search) conditions.push(like(productsTable.name, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, minPrice));
    if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));
    
    if (brands && brands.trim() !== "") {
      const brandList = brands.split(",").map(b => b.trim()).filter(b => b !== "");
      if (brandList.length > 0) {
        conditions.push(inArray(productsTable.brand, brandList));
      }
    }
    
    if (minRating) {
      conditions.push(gte(productsTable.rating, Number(minRating)));
    }
    
    if (inStock === "true") {
      conditions.push(gt(productsTable.stock, 0));
    }

    let results;
    let baseQuery: any = db.select().from(productsTable);
    
    if (conditions.length > 0) {
      // @ts-ignore
      baseQuery = baseQuery.where(and(...conditions));
    }

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case "price_asc":
          baseQuery = baseQuery.orderBy(asc(productsTable.price));
          break;
        case "price_desc":
          baseQuery = baseQuery.orderBy(desc(productsTable.price));
          break;
        case "rating":
          baseQuery = baseQuery.orderBy(desc(productsTable.rating));
          break;
        case "newest":
          baseQuery = baseQuery.orderBy(desc(productsTable.createdAt));
          break;
      }
    }

    results = await baseQuery;

    const products = results.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      specs: p.specs || {},
      images: (p.images as string[]) || [],
      tags: (p.tags as string[]) || [],
    }));

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list products" });
  }
});

router.get("/metadata", async (req, res) => {
  try {
    const { category, subcategory, search, minPrice, maxPrice, brands, minRating } = req.query as Record<string, string>;
    const conditions = [];

    if (category) conditions.push(eq(productsTable.category, category));
    if (subcategory) conditions.push(eq(productsTable.subcategory, subcategory));
    if (search) conditions.push(like(productsTable.name, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, minPrice));
    if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));
    
    if (brands) {
      const brandList = brands.split(",");
      conditions.push(inArray(productsTable.brand, brandList));
    }

    if (minRating) {
      conditions.push(gte(productsTable.rating, Number(minRating)));
    }

    // 1. Fetch category counts: Filtered only by search
    let catSubConditions = [];
    if (search) catSubConditions.push(like(productsTable.name, `%${search}%`));
    
    let categoryQuery = db
      .select({
        category: productsTable.category,
        count: sql<string>`count(*)`,
      })
      .from(productsTable);
    
    if (catSubConditions.length > 0) {
        // @ts-ignore
        categoryQuery = categoryQuery.where(and(...catSubConditions));
    }
    
    const categoryCounts = await categoryQuery.groupBy(productsTable.category);

    // 2. Fetch subcategory counts: Filtered by Category + Search
    let subcategoryCounts: any[] = [];
    if (category) {
        let scConditions = [eq(productsTable.category, category)];
        if (search) scConditions.push(like(productsTable.name, `%${search}%`));
        
        subcategoryCounts = await db
            .select({
                subcategory: productsTable.subcategory,
                count: sql<string>`count(*)`,
            })
            .from(productsTable)
            .where(and(...scConditions))
            .groupBy(productsTable.subcategory);
    }

    // 3. Fetch brand counts: Filtered by Cat + Sub + Search (Ignoring Brands Filter)
    let brandConditions = [];
    if (category) brandConditions.push(eq(productsTable.category, category));
    if (subcategory) brandConditions.push(eq(productsTable.subcategory, subcategory));
    if (search) brandConditions.push(like(productsTable.name, `%${search}%`));
    
    let brandQuery = db
      .select({
        brand: productsTable.brand,
        count: sql<string>`count(*)`,
      })
      .from(productsTable);
    
    if (brandConditions.length > 0) {
        // @ts-ignore
        brandQuery = brandQuery.where(and(...brandConditions));
    }
    
    const brandCounts = await brandQuery.groupBy(productsTable.brand).orderBy(desc(sql`count(*)`)).limit(20);

    // 4. Fetch price stats: Filtered by all except current Price Selection
    let globalStatsConditions = [];
    if (category) globalStatsConditions.push(eq(productsTable.category, category));
    if (subcategory) globalStatsConditions.push(eq(productsTable.subcategory, subcategory));
    if (search) globalStatsConditions.push(like(productsTable.name, `%${search}%`));
    if (brands && brands.trim() !== "") {
        const brandList = brands.split(",").map(b => b.trim()).filter(b => b !== "");
        if (brandList.length > 0) globalStatsConditions.push(inArray(productsTable.brand, brandList));
    }
    
    let statsQuery = db
      .select({
        minPrice: sql<string>`min(${productsTable.price})`,
        maxPrice: sql<string>`max(${productsTable.price})`,
        totalCount: sql<string>`count(*)`,
      })
      .from(productsTable);
    
    if (globalStatsConditions.length > 0) {
        // @ts-ignore
        statsQuery = statsQuery.where(and(...globalStatsConditions));
    }

    const [priceStats] = await statsQuery;

    res.json({
      categories: categoryCounts.map(c => ({ name: c.category, count: Number(c.count) })),
      subcategories: subcategoryCounts
        .filter(s => s.subcategory !== null)
        .map(s => ({ name: s.subcategory, count: Number(s.count) })),
      brands: brandCounts
        .filter(b => b.brand !== null)
        .map(b => ({ name: b.brand, count: Number(b.count) })),
      priceRange: {
        min: Number(priceStats?.minPrice || 0),
        max: Number(priceStats?.maxPrice || 100000), // Default high if no products
      },
      totalCount: Number(priceStats?.totalCount || 0)
    });
  } catch (err) {
    console.error("Metadata failure:", err);
    res.status(500).json({ error: "Failed to get filter metadata" });
  }
});

router.post("/", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const body = req.body;
    const [product] = await db
      .insert(productsTable)
      .values({
        name: body.name,
        description: body.description,
        price: String(body.price),
        category: body.category,
        subcategory: body.subcategory,
        brand: body.brand,
        imageUrl: body.imageUrl,
        images: body.images || [],
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
    const id = parseInt(req.params.id as string);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      specs: product.specs || {},
      images: (product.images as string[]) || [],
      tags: (product.tags as string[]) || [],
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to get product" });
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

router.patch("/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const body = req.body;
    const [updated] = await db
      .update(productsTable)
      .set({
        ...body,
        price: body.price ? String(body.price) : undefined,
      })
      .where(eq(productsTable.id, id))
      .returning();
    
    if (!updated) return res.status(404).json({ error: "Product not found" });
    return res.json({ ...updated, price: Number(updated.price) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
