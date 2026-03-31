import { Router, type Response } from "express";
import { db, ordersTable, cartItemsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth";

const router: Router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId));
    return res.json(orders.map((o) => ({ ...o, total: Number(o.total) })));
  } catch (err) {
    return res.status(500).json({ error: "Failed to list orders" });
  }
});


router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { sessionId, shippingAddress, paymentMethod } = req.body;
    const userId = req.user?.id;
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

    // 1. Validation: Check for sufficient stock
    for (const item of itemsWithProducts) {
      if (!item.product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.product.name}`, 
          available: item.product.stock,
          requested: item.quantity
        });
      }
    }

    const total = itemsWithProducts.reduce((sum, item) => {
      const price = item.negotiatedPrice ? Number(item.negotiatedPrice) : Number(item.product?.price || 0);
      return sum + price * item.quantity;
    }, 0);

    // 2. Wrap order creation and stock deduction in an implicit transaction-like sequence
    const [order] = await db
      .insert(ordersTable)
      .values({
        sessionId,
        userId: userId || null,
        status: "confirmed",
        items: itemsWithProducts,
        total: String(total),
        shippingAddress: shippingAddress || "Manual Pickup",
      })
      .returning();

    // 3. Deduct stock for each item
    for (const item of itemsWithProducts) {
      await db
        .update(productsTable)
        .set({
          stock: (item.product?.stock || 0) - item.quantity
        })
        .where(eq(productsTable.id, item.productId));
    }

    console.log(`Order ${order.id} placed. Stock updated for ${itemsWithProducts.length} items.`);

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
