import { Router, type IRouter } from "express";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/conversations", async (req, res) => {
  try {
    const convos = await db.select().from(conversationsTable);
    res.json(convos);
  } catch (err) {
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const { title } = req.body;
    const [convo] = await db.insert(conversationsTable).values({ title }).returning();
    res.status(201).json(convo);
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id));
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body;

    const history = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id));

    await db.insert(messagesTable).values({ conversationId: id, role: "user", content });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: "You are a helpful AI assistant for ShopSmart AI, an Indian e-commerce platform. Help users with shopping, product queries, and general questions.",
      },
      ...history.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content },
    ];

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({ conversationId: id, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
    res.end();
  }
});

export default router;
