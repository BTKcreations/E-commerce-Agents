import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const SUPPORT_SYSTEM_PROMPT = `You are a friendly and helpful customer support AI for ShopSmart AI, an Indian e-commerce platform.
You help customers with:
- Order tracking and status
- Returns and refunds
- Product queries
- Payment issues
- General FAQs

Be empathetic, professional, and solution-focused. Use Indian English naturally.
Keep responses concise (max 3-4 sentences).

Respond ONLY with JSON:
{
  "response": "your helpful response",
  "intent": "order_tracking"|"return_request"|"product_query"|"payment_issue"|"general_faq"|"complaint",
  "suggestedActions": ["action1", "action2"],
  "escalate": boolean (true only if genuinely complex issue)
}`;

router.post("/chat", async (req, res) => {
  try {
    const { message, sessionId, orderId, conversationHistory = [] } = req.body;

    let orderContext = "";
    if (orderId) {
      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
      if (order) {
        orderContext = `\nOrder context: Order #${order.id}, Status: ${order.status}, Total: ₹${order.total}`;
      }
    }

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SUPPORT_SYSTEM_PROMPT + orderContext },
    ];

    for (const msg of conversationHistory.slice(-6)) {
      messages.push({ role: msg.role as "user" | "assistant", content: msg.content });
    }

    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let parsed: { response?: string; intent?: string; suggestedActions?: string[]; escalate?: boolean } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        response: "I'm here to help! Could you please provide more details about your issue?",
        intent: "general_faq",
        suggestedActions: ["Check order status", "Browse FAQs"],
        escalate: false,
      };
    }

    res.json({
      response: parsed.response || "How can I help you today?",
      intent: parsed.intent || "general_faq",
      suggestedActions: parsed.suggestedActions || [],
      escalate: parsed.escalate || false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process support request" });
  }
});

router.post("/return", async (req, res) => {
  try {
    const { orderId, sessionId, reason, items } = req.body;

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
    if (!order) return res.status(404).json({ error: "Order not found" });

    const returnId = `RET${Date.now().toString(36).toUpperCase()}`;
    const estimatedRefund = Number(order.total) * 0.95;

    res.json({
      returnId,
      status: "initiated",
      message: `Your return request ${returnId} has been initiated successfully.`,
      estimatedRefund,
      instructions: `Please pack the items securely and use the return label that will be emailed to you within 24 hours. Once we receive the items, your refund of ₹${estimatedRefund.toFixed(0)} will be processed within 5-7 business days.`,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to initiate return" });
  }
});

export default router;
