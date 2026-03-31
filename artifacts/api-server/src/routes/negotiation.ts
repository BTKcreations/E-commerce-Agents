import { Router, type IRouter } from "express";
import { db, productsTable, negotiationsTable, ordersTable } from "@workspace/db";
import { openai, AI_MODEL } from "@workspace/integrations-openai-ai-server";
import { eq, and, count } from "drizzle-orm";

const router: IRouter = Router();

const MAX_ROUNDS = 3;

async function getNegotiationContext(sessionId: string) {
  const [orderResult] = await db
    .select({ value: count() })
    .from(ordersTable)
    .where(eq(ordersTable.sessionId, sessionId));
  
  const [negotiationResult] = await db
    .select({ value: count() })
    .from(negotiationsTable)
    .where(and(eq(negotiationsTable.sessionId, sessionId), eq(negotiationsTable.status, "accepted")));

  const orderCount = Number(orderResult?.value || 0);
  const successfulNegotiations = Number(negotiationResult?.value || 0);

  // Dynamic discount logic: 
  // Base 10%
  // +2% for every past order (max +10%)
  // +1% for every past successful negotiation (max +5%)
  const loyaltyBonus = Math.min(0.10, orderCount * 0.02);
  const negotiationBonus = Math.min(0.05, successfulNegotiations * 0.01);
  const maxDiscount = 0.10 + loyaltyBonus + negotiationBonus;

  return {
    orderCount,
    successfulNegotiations,
    maxDiscount,
    isLoyal: orderCount > 0,
  };
}

router.post("/start", async (req, res): Promise<any> => {
  try {
    const { productId, sessionId, message } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const context = await getNegotiationContext(sessionId);
    const originalPrice = Number(product.price);
    const minPrice = originalPrice * (1 - context.maxDiscount);

    console.log(`[Negotiation] Start - Session: ${sessionId}, Message: "${message}", Min Price: ₹${minPrice.toFixed(2)}`);

    const systemPrompt = `You are a professional human sales manager at ShopSmart, a premium Indian e-commerce store.
A customer is interested in the "${product.name}" (Original Price: ₹${originalPrice}).
Your goal is to close the sale at the best possible price while keeping the customer happy.

STRATEGY:
- Be polite, professional, and use natural Indian English.
- NEVER mention that you are an AI, a bot, or that there are "programmed limits". Act as a real person.
- If the customer is loyal (Orders: ${context.orderCount}), acknowledge their past support warmly.
- Your absolute bottom price is ₹${minPrice.toFixed(0)}. NEVER go below this.
- Extract any numeric offer from the user's message. If they didn't offer a price, steer them towards one.

EXTREMELY IMPORTANT: Respond ONLY with a JSON object. No other text.
{
  "status": "accepted"|"rejected"|"countered",
  "counterOffer": number (your offer to them),
  "userOffer": number (extracted from their message, or 0 if none),
  "message": "your human-like response to the customer"
}`;

    let content = "{}";
    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        max_completion_tokens: 256,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      });
      content = completion.choices[0]?.message?.content || "{}";
    } catch (aiError: any) {
      console.warn("AI Negotiation Start failed", aiError.message);
      content = JSON.stringify({
        status: "countered",
        counterOffer: Math.round(originalPrice * 0.95),
        userOffer: 0,
        message: "Our AI agent is currently offline. I can offer you a 5% discount.",
      });
    }
    let parsed: { status?: string; counterOffer?: number; userOffer?: number; message?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        status: "countered",
        counterOffer: Math.round(originalPrice * 0.95),
        userOffer: 0,
        message: "I appreciate your interest! I can offer you a small discount to start. How does that sound?",
      };
    }

    const initialHistory = [
      { role: "user", content: message },
      { role: "assistant", content: parsed.message || "Let's talk about the price." }
    ];

    const [negotiation] = await db
      .insert(negotiationsTable)
      .values({
        sessionId,
        productId,
        originalPrice: String(originalPrice),
        currentOffer: String(parsed.counterOffer || originalPrice),
        status: parsed.status || "active",
        rounds: 1,
        messageHistory: initialHistory,
      })
      .returning();

    res.json({
      id: negotiation.id,
      sessionId,
      productId,
      originalPrice,
      currentOffer: parsed.counterOffer || originalPrice,
      status: parsed.status || "countered",
      message: parsed.message,
      messageHistory: initialHistory,
      roundsLeft: MAX_ROUNDS - 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start negotiation" });
  }
});

router.post("/offer", async (req, res): Promise<any> => {
  try {
    const { id, sessionId, productId, message } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    let negotiation;
    if (id) {
       [negotiation] = await db.select().from(negotiationsTable).where(eq(negotiationsTable.id, id)).limit(1);
    } else {
       [negotiation] = await db
        .select()
        .from(negotiationsTable)
        .where(and(eq(negotiationsTable.sessionId, sessionId), eq(negotiationsTable.productId, productId)))
        .limit(1);
    }

    if (!negotiation) return res.status(404).json({ error: "Negotiation session not found" });

    console.log(`[Negotiation] Loaded History:`, JSON.stringify(negotiation.messageHistory, null, 2));

    const context = await getNegotiationContext(sessionId);
    const originalPrice = Number(product.price);
    const minPrice = originalPrice * (1 - context.maxDiscount);
    const roundsLeft = MAX_ROUNDS - negotiation.rounds;

    console.log(`[Negotiation Offer] Session: ${sessionId}, Rounds Left: ${roundsLeft}, Message: "${message}"`);

    const systemPrompt = `You are a human sales manager. A customer is bargaining for "${product.name}".
Original Price: ₹${originalPrice}. Your bottom line: ₹${minPrice.toFixed(0)}.
Rounds remaining: ${roundsLeft}.

STRATEGY:
- Be firm but fair. If this is the final round, make your best and final offer or accept/reject.
- Extract any numeric offer from the user's message.
- If they are being unreasonable, stand your ground politely.
- NEVER reveal your bottom line or that you are an AI.

EXTREMELY IMPORTANT: Respond ONLY with JSON.
{
  "status": "accepted"|"rejected"|"countered",
  "counterOffer": number (if countered),
  "userOffer": number (extracted from their message, or 0 if none),
  "finalPrice": number (if accepted),
  "message": "your human-like response"
}`;

    const history = (negotiation.messageHistory || []) as any[];
    const currentMessages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    let content = "{}";
    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        max_completion_tokens: 256,
        messages: currentMessages as any,
      });
      content = completion.choices[0]?.message?.content || "{}";
    } catch (aiError: any) {
      console.warn("AI Negotiation Offer failed", aiError.message);
      content = JSON.stringify({
        status: "countered",
        counterOffer: Number(negotiation.currentOffer),
        message: "Our AI agent is currently offline. I cannot review further offers right now.",
      });
    }
    let parsed: { status?: string; counterOffer?: number; userOffer?: number; finalPrice?: number; message?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        status: "countered",
        counterOffer: Number(negotiation.currentOffer),
        message: "I hear you, but let's stick to our previous discussion for now.",
      };
    }

    const updatedHistory = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: parsed.message || "I see." }
    ];

    await db
      .update(negotiationsTable)
      .set({
        currentOffer: String(parsed.counterOffer || negotiation.currentOffer),
        status: parsed.status || "active",
        rounds: negotiation.rounds + 1,
        messageHistory: updatedHistory,
        finalPrice: parsed.status === "accepted" ? String(parsed.finalPrice || parsed.userOffer || negotiation.currentOffer) : null,
      })
      .where(eq(negotiationsTable.id, negotiation.id));

    res.json({
      status: parsed.status || "countered",
      counterOffer: parsed.counterOffer,
      finalPrice: parsed.finalPrice,
      message: parsed.message,
      messageHistory: updatedHistory,
      roundsLeft: Math.max(0, roundsLeft - 1),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process offer" });
  }
});

export default router;
