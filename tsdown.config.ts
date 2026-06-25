/**
 * tsdown — multi-entry ESM build, unbundle mode (Fluid / cms-ui pattern).
 *
 * Each subpath entry below fixes the OUTPUT filename for its `package.json`
 * export; every transitively-imported source file is also emitted preserving
 * `src/` structure, so per-file `'use client'` directives survive and consumer
 * bundlers tree-shake at the file boundary.
 *
 * `neverBundle` keeps every peer external (bare-specifier imports in the
 * output). Unlike fluid/cms-ui, labs does NOT consume the host's
 * `@/components/ui/*` — the control UI is self-contained Tailwind, so the
 * package works in any React app.
 */

import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'physics/index': 'src/physics/index.ts',
    'math/index': 'src/math/index.ts',
    'chem/index': 'src/chem/index.ts',
    'circuits/index': 'src/circuits/index.ts',
    'geometry/index': 'src/geometry/index.ts',
    'language/index': 'src/language/index.ts',
    'ict/index': 'src/ict/index.ts',
    'commerce/index': 'src/commerce/index.ts',
    'biology/index': 'src/biology/index.ts',
    'geography/index': 'src/geography/index.ts',
    'discrete/index': 'src/discrete/index.ts',
    'statistics/index': 'src/statistics/index.ts',
    'ml/index': 'src/ml/index.ts',
    'catalog/index': 'src/catalog/index.ts',
    'kit/index': 'src/kit/index.ts',
    'blocks/index': 'src/blocks/index.tsx',
    'blocks/lesson': 'src/blocks/lesson.tsx',
    'blocks/math': 'src/blocks/math.tsx',
    'blocks/physics': 'src/blocks/physics.tsx',
    'blocks/chem': 'src/blocks/chem.tsx',
    'blocks/circuits': 'src/blocks/circuits.tsx',
    'blocks/geometry': 'src/blocks/geometry.tsx',
    'blocks/ict': 'src/blocks/ict.tsx',
    'blocks/language': 'src/blocks/language.tsx',
    'blocks/accounting': 'src/blocks/accounting.tsx',
    'blocks/economics': 'src/blocks/economics.tsx',
    'blocks/biology': 'src/blocks/biology.tsx',
    'blocks/geography': 'src/blocks/geography.tsx',
    'blocks/ml': 'src/blocks/ml.tsx',
    'blocks/discrete': 'src/blocks/discrete.tsx',
    'blocks/statistics': 'src/blocks/statistics.tsx',
    'schemas/index': 'src/schemas/index.ts',
  },
  format: ['esm'],
  dts: { sourcemap: false },
  unbundle: true,
  hash: false,
  sourcemap: false,
  minify: false,
  clean: true,
  deps: {
    neverBundle: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-dom/client',
      'clsx',
      'tailwind-merge',
      'lucide-react',
      'zod',
      // Optional integration peers (only /blocks touches these).
      /^@classytic\//,
      // Optional, lazy domain peers (added later).
      'katex',
      'react-katex',
      'three',
      /^@react-three\//,
    ],
  },
});
