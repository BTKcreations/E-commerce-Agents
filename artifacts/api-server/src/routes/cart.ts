import { Router, type IRouter } from "express";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

async function getCartWithProducts(sessionId: string) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, sessionId));

  const itemsWithProducts = await Promise.all(
    items.map(async (item) => {
      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, item.productId));
      return {
        ...item,
        negotiatedPrice: item.negotiatedPrice ? Number(item.negotiatedPrice) : undefined,
        product: product
          ? { ...product, price: Number(product.price), originalPrice: product.originalPrice ? Number(product.originalPrice) : null }
          : null,
      };
    })
  );

  const total = itemsWithProducts.reduce((sum, item) => {
    const price = item.negotiatedPrice ?? (item.product?.price || 0);
    return sum + price * item.quantity;
  }, 0);

  return { items: itemsWithProducts, total, itemCount: itemsWithProducts.reduce((s, i) => s + i.quantity, 0) };
}

router.get("/", async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    const cart = await getCartWithProducts(sessionId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to get cart" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { sessionId, productId, quantity, negotiatedPrice } = req.body;
    if (!sessionId || !productId) return res.status(400).json({ error: "sessionId and productId required" });

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId)));

    if (existing) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      await db.insert(cartItemsTable).values({
        sessionId,
        productId,
        quantity,
        negotiatedPrice: negotiatedPrice ? String(negotiatedPrice) : null,
      });
    }

    const cart = await getCartWithProducts(sessionId);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.delete("/:itemId", async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const sessionId = req.query.sessionId as string;
    await db
      .delete(cartItemsTable)
      .where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.sessionId, sessionId)));
    const cart = await getCartWithProducts(sessionId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

router.patch("/:itemId", async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { sessionId, quantity } = req.body;

    if (quantity <= 0) {
      await db
        .delete(cartItemsTable)
        .where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.sessionId, sessionId)));
    } else {
      await db
        .update(cartItemsTable)
        .set({ quantity })
        .where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.sessionId, sessionId)));
    }

    const cart = await getCartWithProducts(sessionId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to update cart" });
  }
});

export default router;
