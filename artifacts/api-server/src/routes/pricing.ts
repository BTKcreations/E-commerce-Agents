import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/forecast", async (req, res) => {
  try {
    const productId = parseInt(req.query.productId as string);
    if (!productId) return res.status(400).json({ error: "productId required" });

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const currentPrice = Number(product.price);
    const stock = product.stock;
    const demandScore = product.demandScore || 0.5;

    const systemPrompt = `You are a dynamic pricing and demand forecasting AI for ShopSmart AI (Indian e-commerce).
Analyze the product and generate a forecast. Respond ONLY with JSON:
{
  "suggestedPrice": number,
  "demandLevel": "low"|"medium"|"high"|"surge",
  "demandScore": number (0-1),
  "forecast": "2-3 sentence forecast",
  "alerts": ["alert1", "alert2"],
  "stockStatus": "healthy"|"low"|"critical"
}`;

    const today = new Date();
    const month = today.getMonth() + 1;
    const isFestival = (month >= 9 && month <= 11) || month === 1;

    const userMsg = `Product: ${product.name}
Category: ${product.category}
Current price: ₹${currentPrice}
Stock: ${stock} units
Current demand score: ${demandScore}
Current month: ${month}
Festival season: ${isFestival}
Rating: ${product.rating}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let forecast: Record<string, unknown> = {};
    try {
      forecast = JSON.parse(content);
    } catch {
      forecast = {
        suggestedPrice: currentPrice,
        demandLevel: "medium",
        demandScore: 0.5,
        forecast: "Stable demand expected.",
        alerts: [],
        stockStatus: "healthy",
      };
    }

    res.json({
      productId,
      currentPrice,
      ...forecast,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get forecast" });
  }
});

router.post("/adjust", async (req, res) => {
  try {
    const { productId, reason } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const oldPrice = Number(product.price);

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 256,
      messages: [
        {
          role: "system",
          content: `You are a pricing AI for an Indian e-commerce platform. Suggest a new price based on the context.
Respond ONLY with JSON: { "newPrice": number, "reason": "explanation", "changePercent": number }`,
        },
        {
          role: "user",
          content: `Product: ${product.name}, Category: ${product.category}, Current price: ₹${oldPrice}, Stock: ${product.stock}, Reason for adjustment: ${reason || "optimize for demand"}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let parsed: { newPrice?: number; reason?: string; changePercent?: number } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { newPrice: oldPrice, reason: "No change", changePercent: 0 };
    }

    const newPrice = parsed.newPrice || oldPrice;
    await db
      .update(productsTable)
      .set({ price: String(newPrice), originalPrice: String(oldPrice) })
      .where(eq(productsTable.id, productId));

    res.json({
      productId,
      oldPrice,
      newPrice,
      reason: parsed.reason || "AI adjustment",
      changePercent: parsed.changePercent || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to adjust price" });
  }
});

router.get("/alerts", async (req, res) => {
  try {
    const products = await db.select().from(productsTable);
    const alerts = [];

    for (const product of products) {
      if (product.stock <= 5) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          alertType: "reorder_needed",
          message: `Only ${product.stock} units left. Reorder immediately!`,
          severity: product.stock === 0 ? "critical" : "warning",
        });
      }

      const demandScore = product.demandScore || 0;
      if (demandScore > 0.8) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          alertType: "high_demand",
          message: `Demand score ${(demandScore * 100).toFixed(0)}% — consider increasing price for better margins.`,
          severity: "info",
        });
      }
    }

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Failed to get alerts" });
  }
});

export default router;
