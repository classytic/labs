# @classytic/labs — domain labs on @classytic/stage

Authorable, domain-organized interactive learning labs built on the
[`@classytic/stage`](../stage) engine. Subpaths by **dependency, not taxonomy**:
`./math ./physics ./chem ./circuits ./geometry ./catalog ./core ./blocks`. Import only
what you use. `labs → stage → host`; never the reverse.

## Product stance (read before adding a "lab")
- Build **GENERAL authorable tools**, not one widget per problem. The creator declares the
  model (a `SceneDoc` / template params); the learner manipulates it. Good = Grapher,
  GeometryBoard, CircuitNetwork, VectorScene. Bad = a hardcoded single-scenario widget.
- "New lab" = register/configure a **template family** (`./catalog`
  `registerLabTemplate` + zod params), not new plumbing.
- **Interactive only when manipulation builds intuition.** Otherwise a figure/video is
  better. No fake "press Play" animations.
- Don't over-engineer. Match the surrounding code's idiom.

## Rendering — all on stage, no legacy canvas
- **SVG `<Stage>` is the default** (accessible, themeable, SceneDoc-portable).
- **`<CanvasLayer>`** (stage, zero-dep Canvas2D) ONLY for genuine high-element labs —
  currently `gradient-descent` (heatmap) + `orbit` (260-pt trail). Don't reach for it otherwise.
- The old `labs/core` canvas engine is **deleted**. `./core` is now a small toolkit only:
  `tex` (lazy KaTeX), `numeric`, `util`, `easing`, `reactive`, `timeline`. Coordinate
  system, clock, control surface, learner seam, resolver, expr → import from `@classytic/stage`.

## Visual quality bar — Brilliant-grade glyphs, never line+dot
A primitive "line + dot" representation is a bug. Build **parametric, token-driven,
coords-aware glyphs** in the asset's `Component`. Reference bar:
`D:/workspace/content/src/lib/components/hardware/CapacitorSymbol.tsx`.
- Examples already at bar: ⊗ bulb + closed-loop circuit; hatched mirror + lamp + bullseye
  (optics); nucleon-cluster nucleus (bohr); electrolyte beakers (battery); barrel+wheel
  cannon (projectile); shared `kit/diagram` (`LabeledVector`, `ResistorBox`).
- **Rich-glyph + draggable pattern:** draw decorative glyphs wrapped in
  `<g style={{pointerEvents:'none'}}>` so the real draggable handles (scene `MovableDot`s,
  rendered underneath) stay grabbable; set the raw scene element's `style.hidden` so the
  asset owns the look (it still resolves → asset receives its value).
- A schematic must read as the real thing (a circuit reads as a closed loop, not a line).
- **Don't** reach for an "SVG icon" skill — `svg-icon-maker` traces raster bitmaps; logo
  skills make one-off files. Our glyphs are parametric React components in the stage system.

## Colors & styles
- Tokens only: `--stage-*` (assets) + host shadcn tokens (`--foreground/--primary/--border/
  --muted/--success/--destructive`) with literal fallbacks (control kit). A color literal
  in a component body is a bug. (Canvas-only exception: `<CanvasLayer>` can't read `var()`,
  so resolve tokens via `getComputedStyle` once; data colormaps may be concrete.)
- Control UI = `kit/controls` (`.lab-*` classes). CSS **ships in `styles.css`** (fluid
  `@source` way), NOT runtime-injected. `<LabStyles/>` is a no-op kept for back-compat.

## Authoring & assessment
- Authored with stage's `SceneBuilder` (authoring mode) → serializable `SceneDoc`;
  agent-drivable via bound free scalars + `useControlSurface`.
- Solve/score events → `useLearner().report` → host xAPI. Pedagogy on
  `SceneDoc.meta.pedagogy` (`LabMeta`: objectives/misconceptions/hints/difficulty).

## Workflow / gates
- `npm run typecheck && npm run build && npx vitest run` must pass.
- **Validate visually** with `@qa-next-devtools` at `/stage-preview` (FE :4001):
  `get_errors` clean, 0 console errors, no hydration warnings, glyphs read correctly.
- Dev-sync to Mentora: `node scripts/sync-sci-viz.mjs D:/projects/brihot/apps/web`
  (→ `node_modules/@classytic/labs`). **No npm publish**; cms-ui/cms are dev-synced too.
- A stage change → rebuild stage, sync into labs, rebuild labs, sync into Mentora, re-verify.
- NEVER read `@classytic/*` from `node_modules` — resolve to the source repo.
