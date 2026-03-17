import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ne, eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const { sessionId, productId, category, viewedProducts = [] } = req.body;

    const allProducts = await db.select().from(productsTable);

    const contextProducts = allProducts.slice(0, 20).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.price),
      rating: p.rating,
      tags: p.tags,
    }));

    const systemPrompt = `You are a smart recommendation engine for ShopSmart AI, an Indian e-commerce platform.
Based on the user's context, recommend exactly 4 products from the available catalog.
Respond ONLY with valid JSON: { "productIds": [1,2,3,4], "reasoning": "short explanation" }`;

    const userContext = `User session: ${sessionId}
Current product: ${productId || "none"}
Category interest: ${category || "general"}
Previously viewed product IDs: ${viewedProducts.join(", ") || "none"}
Available products: ${JSON.stringify(contextProducts)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let parsed: { productIds?: number[]; reasoning?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { productIds: [], reasoning: "Based on popular items" };
    }

    const productIds = (parsed.productIds || []).slice(0, 4);
    const recommended = allProducts
      .filter((p) => productIds.includes(p.id))
      .map((p) => ({
        ...p,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        specs: p.specs || {},
        tags: (p.tags as string[]) || [],
      }));

    if (recommended.length < 4) {
      const extras = allProducts
        .filter((p) => !productIds.includes(p.id))
        .slice(0, 4 - recommended.length)
        .map((p) => ({
          ...p,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          specs: p.specs || {},
          tags: (p.tags as string[]) || [],
        }));
      recommended.push(...extras);
    }

    res.json({ products: recommended, reasoning: parsed.reasoning || "Based on your browsing history" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

export default router;
