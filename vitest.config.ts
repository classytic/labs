import { defineConfig } from 'vitest/config';

export default defineConfig({
  // JSX is transformed via tsconfig's `jsx: react-jsx` (Vitest's oxc transform).
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    testTimeout: 10_000,
  },
});
