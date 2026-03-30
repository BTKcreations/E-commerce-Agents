import { Router, type IRouter } from "express";
import { db, ordersTable, cartItemsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.sessionId, sessionId));
    return res.json(orders.map((o) => ({ ...o, total: Number(o.total) })));
  } catch (err) {
    return res.status(500).json({ error: "Failed to list orders" });
  }
});


router.post("/", async (req, res) => {
  try {
    const { sessionId, shippingAddress, userId, paymentMethod } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const cartItems = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.sessionId, sessionId));

    if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

    const itemsWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
        return { ...item, product };
      })
    );

    const total = itemsWithProducts.reduce((sum, item) => {
      const price = item.negotiatedPrice ? Number(item.negotiatedPrice) : Number(item.product?.price || 0);
      return sum + price * item.quantity;
    }, 0);

    const [order] = await db
      .insert(ordersTable)
      .values({
        sessionId,
        userId: userId || null,
        status: "confirmed",
        items: itemsWithProducts,
        total: String(total),
        shippingAddress: shippingAddress || "Manual Pickup",
        // paymentMethod is currently not in our DB schema, but we'll log it for now
      })
      .returning();

    console.log(`Order ${order.id} placed with payment method: ${paymentMethod || "standard"}`);

    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

    return res.status(201).json({ ...order, total: Number(order.total) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create order" });
  }
});



router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json({ ...order, total: Number(order.total) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to get order" });
  }
});


export default router;
