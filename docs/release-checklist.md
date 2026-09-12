# Release checklist

Publishing is intentionally manual. The repository prepares and verifies the artifact;
the maintainer chooses the version, tag, and publish time.

The registry currently exposes `@classytic/stage@0.2.0`; keep Labs' Stage peer range
installable until Stage 0.3 has been published and verified. Release Stage first before
raising Labs' minimum peer version.

## Required checks

1. Run `npm run verify:release` from a clean checkout.
2. Run `npm run experience:check` with Chrome available. This checks representative
   SVG, Canvas, circuit, language, biology, and math activities at 320 CSS px and
   200% zoom, verifies 44px controls, and emulates reduced motion.
3. Run `npm pack --dry-run --json` and confirm only `dist`, `styles.css`, license,
   package metadata, and documentation are included.
4. Install the resulting tarball in a clean React 19 / Next.js application. Do not use
   a copied workspace `dist` for this check.
5. Import one lightweight engine subpath, one visual domain, and one lazy authoring
   surface. Confirm the server build and Turbopack development build both succeed.
6. Inspect the consumer build output: importing an algorithm engine must not include
   React UI; importing one domain must not eagerly include other domains or authoring.
7. Exercise keyboard interaction, visible focus, reduced motion, mobile layout, and
   an SSR refresh for representative SVG, CanvasLayer, guided, and editor labs.
8. At 320 CSS px and 200% zoom, confirm shared instructional/status text remains
   readable, essential controls remain at least 44px, and the activity transport
   stays reachable without horizontal page scrolling.
   Meaningful status must wrap rather than become an undisclosed horizontal scroller;
   sticky transport must not cover the final question, feedback, or focused control.
9. For language labs, test one RTL deck and one IME composition flow. Confirm
   authored objectives render, language tags reach the DOM, and invalid authored
   decks fail visibly instead of falling back to demo content.

Suggested smoke imports:

```ts
import { dijkstra } from '@classytic/labs/algorithms/graph';
import { DerivativeExplorer } from '@classytic/labs/math/derivative-explorer';
import { loadLabBlocks } from '@classytic/labs/blocks/domains';
```

## Runtime composition

`Activity` is the sole shell contract. Shared fields, readouts, progress, and control
policy remain composable primitives; they do not introduce a second layout system.
The release audit must report zero legacy shell symbols in source and generated types.

## Package guarantees

- Every `package.json#exports` target exists and is SSR-importable.
- CSS is budgeted per independently loadable layer by `scripts/package-check.mjs`.
  The aggregate convenience stylesheet is not the default loading recommendation;
  consumers should import core plus only the domain layers they render.
- Heavy engines remain optional and runtime-local.
- Runtime and editor subpaths stay separated for circuit and logic packages.
- Generated manifests remain the only catalog and block registry.
- WebMCP and browser built-in AI are optional host adapters, not Stage/Labs core
  dependencies or release requirements. Never expose raw editor mutation to agents.
- Temporal is used only for lessons that model civil time, time zones, calendars,
  or recurring dates. Simulation clocks and pedagogical playback remain numeric,
  deterministic, injectable, and scrubbable; they must not depend on wall-clock time.
