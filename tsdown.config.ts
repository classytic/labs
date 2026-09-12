/**
 * tsdown — multi-entry ESM build, unbundle mode (Fluid / cms-ui pattern).
 *
 * Each subpath entry below fixes the OUTPUT filename for its `package.json`
 * export; every transitively-imported source file is also emitted preserving
 * `src/` structure, so per-file `'use client'` directives survive and consumer
 * bundlers tree-shake at the file boundary.
 *
 * `neverBundle` keeps every peer external (bare-specifier imports in the
 * output). Generic UI is supplied by the host's shadcn installation through
 * `@/components/ui/*`; Labs ships only learning and visualization composition.
 */

import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'physics/index': 'src/physics/index.ts',
    'physics/linear-pursuit/index': 'src/physics/linear-pursuit/index.ts',
    'physics/modern/index': 'src/physics/modern/index.ts',
    'math/index': 'src/math/index.ts',
    // Public engine aliases are explicit entries because they are intentionally
    // not pulled through the React domain barrel.
    'math/calculus/index': 'src/math/calculus/index.ts',
    'math/optimization/index': 'src/math/optimization/index.ts',
    'math/root-finding/index': 'src/math/root-finding/index.ts',
    'math/taylor/index': 'src/math/taylor/index.ts',
    'math/derivative-explorer/index': 'src/math/derivative-explorer/index.ts',
    'math/integral-explorer/index': 'src/math/integral-explorer/index.ts',
    'math/fundamental-theorem/index': 'src/math/fundamental-theorem/index.ts',
    'math/newton-method/index': 'src/math/newton-method/index.ts',
    'math/taylor-series/index': 'src/math/taylor-series/index.ts',
    'math/limit-explorer/index': 'src/math/limit-explorer/index.ts',
    'math/ode/index': 'src/math/ode/index.ts',
    'math/differential-equation/index': 'src/math/differential-equation/index.ts',
    'math/phase-portrait/index': 'src/math/phase-portrait/index.ts',
    'chem/index': 'src/chem/index.ts',
    'circuits/index': 'src/circuits/index.ts',
    'geometry/index': 'src/geometry/index.ts',
    'language/index': 'src/language/index.ts',
    'ict/index': 'src/ict/index.ts',
    'commerce/index': 'src/commerce/index.ts',
    'exam/index': 'src/exam/index.ts',
    'biology/index': 'src/biology/index.ts',
    'geography/index': 'src/geography/index.ts',
    'discrete/index': 'src/discrete/index.ts',
    'statistics/index': 'src/statistics/index.ts',
    'ml/index': 'src/ml/index.ts',
    'networking/index': 'src/networking/index.ts',
    'algorithms/index': 'src/algorithms/index.ts',
    'algorithms/core/index': 'src/algorithms/core/index.ts',
    'algorithms/graph/index': 'src/algorithms/graph/index.ts',
    'algorithms/dp/index': 'src/algorithms/dp/index.ts',
    'algorithms/heap/index': 'src/algorithms/heap/index.ts',
    'algorithms/tree/index': 'src/algorithms/tree/index.ts',
    'algorithms/react/index': 'src/algorithms/react/index.ts',
    'catalog/index': 'src/catalog/index.ts',
    'pathways/index': 'src/pathways/index.ts',
    'kit/index': 'src/kit/index.ts',
    'build/index': 'src/build/index.ts',
    'build/runtime/index': 'src/build/runtime/index.ts',
    'build/editor/index': 'src/build/editor/index.ts',
    'logic/index': 'src/logic/index.ts',
    'logic/sequential': 'src/logic/sequential.ts',
    'logic/runtime/index': 'src/logic/runtime/index.ts',
    'logic/editor/index': 'src/logic/editor/index.ts',
    'blocks/index': 'src/blocks/index.tsx',
    // zero-dep attribute parser, imported by hosts that repair stored MDX block nodes
    'lab-def/attrs': 'src/lab-def/attrs.ts',
    // Light authoring surface: metadata catalog + lazy gallery/block set (no eager labs).
    'blocks/catalog': 'src/blocks/catalog.ts',
    'blocks/domains': 'src/blocks/domains.ts',
    'blocks/gallery': 'src/blocks/gallery.ts',
    'blocks/lazy': 'src/blocks/lazy.tsx',
    'domains/render': 'src/domains/render.tsx',
    // Release/authoring diagnostics only. Its imports remain lazy and never enter learner catalogs.
    'domains/activity-map': 'src/domains/activity-map.ts',
    'blocks/lesson': 'src/blocks/lesson.tsx',
    'schemas/index': 'src/schemas/index.ts',
    'authoring/index': 'src/authoring/index.ts',
    // Opt-in WebGL renderers. Kept out of every regular domain entry so hosts
    // that do not install Three.js never resolve or download it.
    'three/index': 'src/three/index.ts',
    'three/chemistry/index': 'src/three/chemistry/index.ts',
    'three/physics/index': 'src/three/physics/index.ts',
    'three/biology/index': 'src/three/biology/index.ts',
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
      /^@\/components\/ui\//,
    ],
  },
});
