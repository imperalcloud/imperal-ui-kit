import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    restoreMocks: true,
    coverage: {
      provider: 'v8', reporter: ['text', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'], exclude: ['src/**/*.test.{ts,tsx}', 'src/shims.d.ts'],
      thresholds: { lines: 55, functions: 50, branches: 45, statements: 55 },
    },
  },
});
