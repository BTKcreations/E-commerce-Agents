import { Router, type IRouter } from "express";
import { db, productsTable, negotiationsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const MAX_ROUNDS = 3;

router.post("/start", async (req, res) => {
  try {
    const { productId, sessionId, offerPrice } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const originalPrice = Number(product.price);

    const systemPrompt = `You are a negotiation AI for ShopSmart AI (Indian e-commerce).
You represent the seller. Be reasonable but protect profit margins. The minimum acceptable price is ${(originalPrice * 0.8).toFixed(0)} (20% discount max).
The buyer has made an initial offer. Respond ONLY with JSON:
{
  "status": "accepted"|"rejected"|"countered",
  "counterOffer": number (if countered),
  "message": "friendly negotiation message in Indian English"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 256,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Product: ${product.name}, Original price: ₹${originalPrice}, Buyer's offer: ₹${offerPrice}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let parsed: { status?: string; counterOffer?: number; message?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        status: "countered",
        counterOffer: originalPrice * 0.9,
        message: "I can offer a 10% discount. How does that sound?",
      };
    }

    const [negotiation] = await db
      .insert(negotiationsTable)
      .values({
        sessionId,
        productId,
        originalPrice: String(originalPrice),
        currentOffer: String(offerPrice),
        status: parsed.status || "active",
        rounds: 1,
      })
      .returning();

    res.json({
      sessionId,
      productId,
      originalPrice,
      currentOffer: parsed.counterOffer || offerPrice,
      status: parsed.status || "countered",
      message: parsed.message || "Let's negotiate!",
      roundsLeft: MAX_ROUNDS - 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start negotiation" });
  }
});

router.post("/offer", async (req, res) => {
  try {
    const { sessionId, productId, offerPrice, previousOffer } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const originalPrice = Number(product.price);
    const minPrice = originalPrice * 0.75;
    const roundsLeft = MAX_ROUNDS - 1;

    const systemPrompt = `You are a negotiation AI for ShopSmart AI (Indian e-commerce).
You represent the seller. Minimum acceptable price: ₹${minPrice.toFixed(0)}.
This is round ${MAX_ROUNDS - roundsLeft} of max ${MAX_ROUNDS} rounds.
${roundsLeft <= 1 ? "This is the final round — either accept or reject." : ""}
Respond ONLY with JSON:
{
  "status": "accepted"|"rejected"|"countered",
  "counterOffer": number (required if countered),
  "finalPrice": number (required if accepted),
  "message": "friendly message in Indian English"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 256,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Product: ${product.name}, Original: ₹${originalPrice}, Seller's last offer: ₹${previousOffer}, Buyer's new offer: ₹${offerPrice}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let parsed: { status?: string; counterOffer?: number; finalPrice?: number; message?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        status: offerPrice >= minPrice ? "accepted" : "rejected",
        finalPrice: offerPrice,
        message: offerPrice >= minPrice ? "Deal! Great price for you." : "Sorry, this is too low.",
      };
    }

    res.json({
      status: parsed.status || "rejected",
      counterOffer: parsed.counterOffer,
      finalPrice: parsed.finalPrice,
      message: parsed.message || "Thank you for your offer.",
      roundsLeft: Math.max(0, roundsLeft - 1),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process offer" });
  }
});

export default router;
