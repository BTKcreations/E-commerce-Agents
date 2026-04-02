import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { openai, AI_MODEL } from "@workspace/integrations-openai-ai-server";
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

const systemPrompt = `You are a dynamic pricing and demand forecasting specialist for ShopSmart (Indian e-commerce).
Analyze the product and generate a forecast. Respond ONLY with JSON:
{
  "suggestedPrice": number,
  "demandLevel": "low"|"medium"|"high"|"surge",
  "demandScore": number (0-1),
  "forecast": "general forecast paragraph",
  "alerts": ["alert1", "alert2"],
  "stockStatus": "healthy"|"low"|"critical",
  "predictions": {
    "oneDay": "1 day forecast string (e.g. Price likely to stabilize)",
    "oneWeek": "1 week forecast string (e.g. Expected to drop by 2% due to low demand)",
    "oneMonth": "1 month trend forecast string"
  }
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

    let content = "{}";
    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        max_completion_tokens: 512,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      });
      content = completion.choices[0]?.message?.content || "{}";
    } catch (aiError: any) {
      const isConnectionError = aiError.message?.toLowerCase().includes("connection") || aiError.message?.toLowerCase().includes("fetch");
      console.warn(`AI Forecast failed (${isConnectionError ? "Check if AI server/Ollama is running at " + (openai as any).baseURL : "AI Error"}), falling back to deterministic algorithms.`, aiError.message);
      // Let it fall to the catch below for JSON parsing
    }

    let forecast: any = {};
    try {
      forecast = JSON.parse(content);
      if (!forecast.predictions) throw new Error("Missing predictions");
    } catch {
      forecast = {
        suggestedPrice: currentPrice,
        demandLevel: demandScore > 0.7 ? "high" : "medium",
        demandScore: demandScore,
        forecast: "Stable demand expected over the coming period.",
        alerts: [],
        stockStatus: stock < 10 ? "low" : "healthy",
        predictions: {
          oneDay: "Price expected to remain stable",
          oneWeek: demandScore > 0.7 ? "High chance of price increase due to demand" : "Slight decrease expected",
          oneMonth: "Seasonal demand increases price by 5-10%"
        }
      };
    }

    // Generate 90 days deterministic history
    const history = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 90);
    let simulatedPrice = currentPrice * 0.9;
    let simulatedDemand = demandScore * 100 * 0.8;
    
    for (let i = 0; i < 90; i++) {
       const isWeekend = (baseDate.getDay() === 0 || baseDate.getDay() === 6);
       // Simple seeded deterministic wobble
       const wobble = Math.sin((productId + i) / 5) * 5; 
       simulatedPrice += wobble + (isWeekend ? 3 : -1);
       simulatedDemand += wobble * 0.5 + (isWeekend ? 10 : -3);
       
       simulatedPrice = Math.max(currentPrice * 0.7, Math.min(currentPrice * 1.3, simulatedPrice));
       simulatedDemand = Math.max(10, Math.min(100, simulatedDemand));
       
       history.push({
         date: baseDate.toISOString().split('T')[0],
         price: Math.round(simulatedPrice),
         demand: Math.round(simulatedDemand)
       });
       baseDate.setDate(baseDate.getDate() + 1);
    }

    res.json({
      productId,
      currentPrice,
      ...forecast,
      history
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to get forecast" });
  }
});

router.post("/adjust", async (req, res) => {
  try {
    const { productId, reason } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const oldPrice = Number(product.price);

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      max_completion_tokens: 256,
      messages: [
        {
          role: "system",
          content: `You are a pricing specialist for an Indian e-commerce platform. Suggest a new price based on the context.
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
      reason: parsed.reason || "Dynamic adjustment",
      changePercent: parsed.changePercent || 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to adjust price" });
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
