import { defineConfig } from 'vitest/config';

/**
 * Server tests run in a Node environment against a real Postgres
 * (TEST_DATABASE_URL). Single-threaded on purpose: the suite truncates tables
 * between tests, so parallel files would race each other.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts', 'db/**/*.test.ts'],
    globals: true,
    restoreMocks: true,
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    setupFiles: ['server/testing/setup.ts'],
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});
