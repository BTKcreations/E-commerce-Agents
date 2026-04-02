import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { db, productsTable } from '@workspace/db';

const createMockChain = (data: any) => {
  const mockChain = {
    from: vi.fn(() => mockChain),
    where: vi.fn(() => mockChain),
    orderBy: vi.fn(() => mockChain),
    groupBy: vi.fn(() => mockChain),
    limit: vi.fn(() => mockChain),
    offset: vi.fn(() => mockChain),
    then: (onFulfilled: any) => Promise.resolve(data).then(onFulfilled),
  };
  return mockChain;
};

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should list products successfully', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '10.00', category: 'electronics' },
        { id: 2, name: 'Product 2', price: '20.00', category: 'books' },
      ];

      vi.mocked(db.select).mockReturnValue(createMockChain(mockProducts) as any);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].price).toBe(10);
    });

    it('should filter by category', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '10.00', category: 'electronics' },
      ];

      vi.mocked(db.select).mockReturnValue(createMockChain(mockProducts) as any);

      const response = await request(app).get('/api/products?category=electronics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].category).toBe('electronics');
    });
  });

  describe('GET /api/products/metadata', () => {
    it('should return metadata', async () => {
      // 1. categoryCounts
      vi.mocked(db.select).mockReturnValueOnce(createMockChain([{ category: 'electronics', count: 1 }]) as any);
      // 2. brandCounts
      vi.mocked(db.select).mockReturnValueOnce(createMockChain([{ brand: 'Apple', count: 1 }]) as any);
      // 3. priceStats
      vi.mocked(db.select).mockReturnValueOnce(createMockChain([{ minPrice: '10', maxPrice: '100' }]) as any);

      const response = await request(app).get('/api/products/metadata');

      expect(response.status).toBe(200);
      expect(response.body.categories).toBeDefined();
      expect(response.body.brands).toBeDefined();
      expect(response.body.priceRange).toEqual({ min: 10, max: 100 });
    });
  });
});
