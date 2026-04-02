import { vi, beforeAll, beforeEach } from 'vitest';

// Mock the database
vi.mock('@workspace/db', async () => {
  const actual = await vi.importActual('@workspace/db') as any;
  return {
    ...actual,
    db: {
      select: vi.fn(() => {
        const mockChain = {
          from: vi.fn(() => mockChain),
          where: vi.fn(() => mockChain),
          orderBy: vi.fn(() => mockChain),
          groupBy: vi.fn(() => mockChain),
          limit: vi.fn(() => mockChain),
          offset: vi.fn(() => mockChain),
          execute: vi.fn().mockResolvedValue([]),
          then: (onFulfilled: any) => Promise.resolve([]).then(onFulfilled),
          catch: (onRejected: any) => Promise.resolve([]).catch(onRejected),
        };
        return mockChain;
      }),
      insert: vi.fn(() => {
        const mockChain = {
          values: vi.fn(() => mockChain),
          returning: vi.fn().mockResolvedValue([]),
          then: (onFulfilled: any) => Promise.resolve([]).then(onFulfilled),
        };
        return mockChain;
      }),
      update: vi.fn(() => {
        const mockChain = {
          set: vi.fn(() => mockChain),
          where: vi.fn(() => mockChain),
          returning: vi.fn().mockResolvedValue([]),
          then: (onFulfilled: any) => Promise.resolve([]).then(onFulfilled),
        };
        return mockChain;
      }),
      delete: vi.fn(() => {
        const mockChain = {
          where: vi.fn(() => mockChain),
          returning: vi.fn().mockResolvedValue([]),
          then: (onFulfilled: any) => Promise.resolve([]).then(onFulfilled),
        };
        return mockChain;
      }),
    },
  };
});

// Mock authentication middleware
vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
  authorizeAdmin: (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  },
}));

beforeAll(() => {
  // Global setup if needed
});

beforeEach(() => {
  vi.clearAllMocks();
});
