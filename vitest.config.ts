import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,tsx}',
      'm0f/**/*.{test,spec}.{js,mjs,cjs,ts,tsx}',
    ],
    exclude: ['tests/e2e/**', 'tests/e2e-m0f/**', 'node_modules/**', 'dist/**'],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/{model,geometry,solver,planner,verify,referenceVerifier}/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.{test,spec}.{js,mjs,cjs,ts,tsx}'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    benchmark: {
      include: [
        'tests/perf/**/*.{bench,benchmark}.{ts,tsx}',
        'm0f/**/*.{bench,benchmark}.{ts,tsx}',
      ],
    },
  },
});
