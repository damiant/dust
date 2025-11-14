import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
  },
  resolve: {
    alias: {
      'src': resolve(__dirname, './src'),
    },
  },
});
