# @classytic/labs — domain labs on @classytic/stage

## Harness: flagship visual-learning proofs

**Goal:** Evolve representative Labs activities into scene-first, authorable learning instruments and feed demonstrated needs back into one canonical runtime.

**Trigger:** For flagship visual-learning migrations, follow-up fixes, or proof-cohort audits, use `.claude/skills/labs-proof-orchestrator/SKILL.md`.

**Change history:**

| Date | Change | Target | Reason |
| --- | --- | --- | --- |
| 2026-09-06 | Initial specialist harness | Four proof labs | Validate the scene-first runtime across unlike domains |
| 2026-09-07 | Electronics specialists and system skill | Circuits and PCB progression | Connect device physics, logic, circuits, and physical boards without parallel engines |

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

## Lab structure & workflow (canonical manifest model)
Every production lab is ONE folder `src/domains/<domain>/<lab-id>/` (folder name MUST equal the
lab id):
- **`manifest.ts`** — `defineLab({ id, domain, group, title, description, tag?, schema, taxonomy,
  loadRuntime, loadAuthoring?, omit? })`. Pure: a real zod `schema` + the factory, NEVER the runtime.
  Formulas/algorithms live OUTSIDE React (a `core/` file or a shared engine), not here.
- **`runtime.tsx`** (or `runtime/index.tsx` when large) — the learner-facing render, its own lazy
  chunk (`loadRuntime: () => import('./runtime.js')`). Engine-backed labs re-export the component
  from its **leaf** module (`export { XLab as default } from '../../../physics/x/index.js'`) —
  never from a domain barrel (`../../../physics/index.js`); `labs:check` enforces this.
- **`authoring.tsx`** (optional) — a custom editor chunk when the schema can't express the UI
  (nested/discriminated docs, canvas builders). Otherwise the schema auto-renders via `LabConfig`
  (use `omit: [...]` to hide internal/complex fields). No more `z.any()` escape hatches — model
  authored documents as discriminated unions (see business-lesson / circuit-builder / geometry-board).
- Tests live OUTSIDE src: `tests/domains/<domain>/<lab-id>/…`, importing from `../../../../src/…`.

**Authoring CLI (never hand-edit the generated registry/render-map):**
- `npm run lab:create -- --domain <d> --id <kebab> [--component X --from ../leaf.js]` — scaffolds
  manifest + runtime + test, refuses to overwrite.
- `npm run labs:generate` — regenerates `src/domains/manifests.ts` (registry) + `render-map.ts`
  (pure per-lab loader map, no zod) from the folders. Source-based, no build needed.
- `npm run labs:check` — CI drift guard: stale generated output, duplicate tags, missing runtimes,
  folder≠id, barrel imports, and heavy-engine placement. Wired into `npm run verify`.

The learner render path (`@classytic/labs/blocks/render` → `domains/render.tsx`) pulls ZERO
schemas (it uses `render-map.ts` loaders); the CMS authoring registry (`blocks/lazy`) is where
schemas load. Keep it that way.

## Heavy engines (3D / ML / LLM) — optional peer, runtime-only
A heavy engine (`three`, `@react-three/*`, `@tensorflow/tfjs`, `@xenova/transformers`,
`onnxruntime-web`, `pixi.js`, …) MUST be an **optional** `peerDependency` (add to
`peerDependenciesMeta`) and imported ONLY inside a single lab's `runtime`/`core` files — so its
code downloads only when that one lab renders. Never import it in a `manifest.ts`, `authoring.tsx`,
a shared module, `blocks/`, `kit/`, or a domain barrel. `labs:check` fails the build if you do; add
new engines to `HEAVY_PACKAGES` in `scripts/labs-check.mjs`.

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
- **UI/layout review → `ui-ux-pro-max` skill** (`.claude/skills/ui-ux-pro-max/`, project-local).
  A searchable UX/layout/spacing/type rule DB + pre-delivery checklist. Query it before
  reworking chrome: `python .claude/skills/ui-ux-pro-max/scripts/search.py "<q>" --domain ux`.
  Use for "cheap-looking" / composition / button-placement complaints. Emoji as a STRUCTURAL
  control (not content) is a tell → use an inline SVG (see `language/ui.tsx` `SpeakerGlyph`).
- **Any lab that "looks dirty / bloated / messy" → `lab-design` skill FIRST**
  (`.claude/skills/lab-design/`). The labs-specific rulebook: figure-first sizing, one
  container (no card-in-card), say-it-once (status / evidence / OBSERVE never repeat a
  sentence), the on-screen type floor for SVG scene text, contrast floors, and the 3D
  scene standard. It ends with the audit checklist to run before calling a lab done.
- **3D scenes (`src/three/*`) → `react-three-fiber` skill** (`.claude/skills/react-three-fiber/`)
  for R3F idioms (materials, lights, instancing, `useFrame`, drei-free patterns). Our scene
  primitives live in `src/three/primitives.tsx` + `cell-world.tsx` (`TranslucentShell`).
- **Hand-drawn SVG figures → `creating-svg-illustrations` skill** for viewBox / text /
  accessibility hygiene of static illustrations (relativity scenes, word-problem pictures).
- **Component architecture → `vercel-composition-patterns` skill** (at
  `D:/projects/ecom/commerce/skills/vercel-composition-patterns`). Avoid boolean-prop
  proliferation → compound components + context; explicit variants; children/slots over
  render-props; lift shared state to a provider; React 19 (no forwardRef, `use()`). Applied:
  LabFrame gained a composed `progress?` slot (a `<Progress>` node, not a done/total prop pair);
  see `kit/frame.tsx`.

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
- `npm run verify` (= `labs:check` + `typecheck` + `test`) must pass. Equivalent longhand:
  `npm run labs:check && npm run typecheck && npm run build && npx vitest run`.
- **Validate visually** with `@qa-next-devtools` at `/stage-preview` (FE :4001):
  `get_errors` clean, 0 console errors, no hydration warnings, glyphs read correctly.
- Dev-sync to Mentora: `node scripts/sync-sci-viz.mjs D:/projects/brihot/apps/web`
  (→ `node_modules/@classytic/labs`). **No npm publish**; cms-ui/cms are dev-synced too.
- A stage change → rebuild stage, sync into labs, rebuild labs, sync into Mentora, re-verify.
- NEVER read `@classytic/*` from `node_modules` — resolve to the source repo.
