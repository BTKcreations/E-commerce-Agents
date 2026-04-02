import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ecommerce_test',
      JWT_SECRET: 'test_secret',
      PORT: '5000',
      AI_INTEGRATIONS_OPENAI_BASE_URL: 'http://localhost:11434/v1',
      AI_INTEGRATIONS_OPENAI_API_KEY: 'test_key',
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
