import { Router, type IRouter } from "express";
import { db, productsTable, reviewsTable } from "@workspace/db";
import { openai, AI_MODEL } from "@workspace/integrations-openai-ai-server";
import { eq, like, and, gte, lte } from "drizzle-orm";

const router: IRouter = Router();

router.post("/ask", async (req, res) => {
  try {
    const { productId, question } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, productId));

    const systemPrompt = `You are a knowledgeable product specialist for ShopSmart (Indian e-commerce).
Answer customer questions about products in a helpful, human-like way.
Respond ONLY with JSON:
{
  "answer": "detailed answer",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "confidence": 0.0-1.0
}`;

    const productContext = `Product: ${product.name}
Category: ${product.category}
Brand: ${product.brand || "Unknown"}
Price: ₹${Number(product.price)}
Description: ${product.description || "No description"}
Specs: ${JSON.stringify(product.specs || {})}
Rating: ${product.rating}/5 (${product.reviewCount} reviews)
Reviews: ${reviews.slice(0, 5).map((r) => `[${r.rating}/5] ${r.body}`).join("\n")}`;

    let content = "{}";
    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        max_completion_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${productContext}\n\nCustomer question: ${question}` },
        ],
      });
      content = completion.choices[0]?.message?.content || "{}";
    } catch (aiError: any) {
      console.warn("AI QA failed, falling back gracefully.", aiError.message);
      content = JSON.stringify({
        answer: "The AI assistant is currently unavailable, but this product is highly rated.",
        pros: ["Great quality"],
        cons: [],
        confidence: 0.5
      });
    }
    let parsed: { answer?: string; pros?: string[]; cons?: string[]; confidence?: number } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        answer: "I couldn't analyze this product fully. Please check the specs for details.",
        pros: ["Good value for money", "Well-reviewed by customers"],
        cons: ["Limited information available"],
        confidence: 0.5,
      };
    }

    res.json({
      answer: parsed.answer || "",
      pros: parsed.pros || [],
      cons: parsed.cons || [],
      confidence: parsed.confidence || 0.7,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;

    const allProducts = await db.select().from(productsTable);

    const systemPrompt = `You are a natural language search specialist for ShopSmart (Indian e-commerce).
Parse the user's query and find matching products. The prices are in Indian Rupees (₹).
Respond ONLY with JSON:
{
  "interpretation": "what the user is looking for",
  "filters": { "category": "optional", "maxPrice": optional_number, "keywords": ["keyword1"] },
  "productIds": [array of matching product IDs from the catalog]
}`;

    const catalogSummary = allProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.price),
      tags: p.tags,
    }));

    let content = "{}";
    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        max_completion_tokens: 512,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `User query: "${query}"\nAvailable products: ${JSON.stringify(catalogSummary)}`,
          },
        ],
      });
      content = completion.choices[0]?.message?.content || "{}";
    } catch (aiError: any) {
      console.warn("AI Search failed, falling back to basic search.", aiError.message);
      // Let the code fall through to the basic string search below
    }
    let parsed: { interpretation?: string; filters?: Record<string, unknown>; productIds?: number[] } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { interpretation: query, filters: {}, productIds: [] };
    }

    const matchedIds = parsed.productIds || [];
    let matchedProducts = allProducts.filter((p) => matchedIds.includes(p.id));

    if (matchedProducts.length === 0) {
      matchedProducts = allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      );
    }

    res.json({
      products: matchedProducts.map((p) => ({
        ...p,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        specs: p.specs || {},
        tags: (p.tags as string[]) || [],
      })),
      interpretation: parsed.interpretation || query,
      filters: parsed.filters || {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search" });
  }
});

export default router;
