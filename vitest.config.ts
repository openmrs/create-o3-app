import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Matches the config we scaffold for generated apps, so a test here and a
    // test there start from the same mock state
    clearMocks: true,
    // Only this package's own tests: worktrees under .claude hold checkouts of
    // other branches, whose stale test copies were being discovered too
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
});

