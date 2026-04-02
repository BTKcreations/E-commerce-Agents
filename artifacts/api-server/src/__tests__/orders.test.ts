import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { db, ordersTable, cartItemsTable, productsTable } from '@workspace/db';

describe('Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('should list orders for the authenticated user', async () => {
      const mockOrders = [
        { id: 1, userId: 1, total: '50.00', status: 'confirmed' },
      ];

      // Mock database select for orders
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce(mockOrders),
      } as any);

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].total).toBe(50);
    });
  });

  describe('POST /api/orders', () => {
    it('should create an order successfully', async () => {
      const mockCartItems = [{ id: 1, sessionId: 'session_123', productId: 1, quantity: 1 }];
      const mockProduct = { id: 1, name: 'Product 1', price: '10.00', stock: 10 };

      // Mock fetching cart items
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce(mockCartItems),
      } as any);

      // Mock fetching product for each cart item
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([mockProduct]),
      } as any);

      // Mock database insert for the order
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([{ id: 1, total: '10.00' }]),
      } as any);

      // Mock stock deduction update
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ id: 1 }]),
      } as any);

      // Mock clearing the cart
      vi.mocked(db.delete).mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce({}),
      } as any);

      const response = await request(app)
        .post('/api/orders')
        .send({
          sessionId: 'session_123',
          shippingAddress: '123 Test St',
        });

      expect(response.status).toBe(201);
      expect(response.body.total).toBe(10);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should fail if cart is empty', async () => {
      // Mock empty cart
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      } as any);

      const response = await request(app)
        .post('/api/orders')
        .send({
          sessionId: 'session_123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cart is empty');
    });
  });
});
