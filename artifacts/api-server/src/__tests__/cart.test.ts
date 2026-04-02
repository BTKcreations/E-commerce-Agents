import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { db, cartItemsTable, productsTable } from '@workspace/db';

describe('Cart API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cart', () => {
    it('should return cart items successfully', async () => {
      const mockCartItem = { id: 1, sessionId: 'session_123', productId: 1, quantity: 2 };
      const mockProduct = { id: 1, name: 'Product 1', price: '10.00' };

      // Mock database select for cart items
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockCartItem]),
      } as any);

      // Mock database select for product associated with the cart item
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockProduct]),
      } as any);

      const response = await request(app).get('/api/cart?sessionId=session_123');

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.total).toBe(20);
      expect(response.body.itemCount).toBe(2);
    });

    it('should fail if sessionId is missing', async () => {
      const response = await request(app).get('/api/cart');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('sessionId required');
    });
  });

  describe('POST /api/cart', () => {
    it('should add to cart successfully', async () => {
      const mockProduct = { id: 1, name: 'Product 1', price: '10.00' };

      // Check existing item
      vi.mocked(db.select).mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValueOnce([]), // Not in cart yet
      } as any);

      // Mock database insert
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockResolvedValueOnce([{ id: 1 }]),
      } as any);

      // Re-fetch cart mock
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ id: 1, sessionId: 'session_123', productId: 1, quantity: 1 }]),
      } as any);
      
      // Mock product fetch for cart response
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockProduct]),
      } as any);

      const response = await request(app)
        .post('/api/cart')
        .send({
          sessionId: 'session_123',
          productId: 1,
          quantity: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.itemCount).toBe(1);
    });
  });
});
