import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    /**
     * ONE React, whoever pulls it in.
     *
     * `@classytic/stage` is a `file:../stage` link while its 0.3.0 is unpublished, so it resolves to
     * the sibling repo, which has its own node_modules with its own React. Two copies means two
     * dispatchers: every hook in a stage primitive then read `useRef` off a null dispatcher and all
     * 418 component tests failed at once. Deduping pins both packages to this repo's copy, which is
     * what the Next host does for the real app.
     */
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    alias: [
      // The kit imports the HOST's shadcn components (`@/components/ui/*`), which the Next
      // host resolves via transpilePackages. Tests have no host → plain-element shims.
      {
        find: /^@\/components\/ui\/([\w-]+)$/,
        replacement: fileURLToPath(new URL('./tests/host-shims/ui/$1.mjs', import.meta.url)),
      },
    ],
  },
  // JSX is transformed via tsconfig's `jsx: react-jsx` (Vitest's oxc transform).
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    testTimeout: 10_000,
  },
});
