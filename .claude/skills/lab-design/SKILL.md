---
name: lab-design
description: "Design rulebook for @classytic/labs learning labs — figure-first layout, one container (no card-in-card), say-it-once copy, on-screen type + contrast floors for SVG scenes, 3D scene standard, and the pre-delivery audit. Use whenever a lab looks dirty / bloated / messy / cheap, when building or reworking a lab's figure or shell, or before calling any lab visually done."
---

# Lab design — the rulebook

Labs are **figures with a small amount of chrome around them**, not dashboards. When a lab looks
"dirty", the cause is almost never colours or tokens. It is one of five structural faults below.
Fix the fault; do not add decoration.

Companion skills: `ui-ux-pro-max` (generic UX/spacing/type rules DB), `react-three-fiber` (R3F
idioms for `src/three/*`), `creating-svg-illustrations` (viewBox/text hygiene for hand-drawn SVG).
This file wins where they disagree.

The **chrome** around the figure (type roles, spacing, state tints, motion, focus, targets, and
which region of the shell carries which learning principle) is specified in
`docs/DESIGN-SYSTEM.md`. Every number there is a `--lab-*` token; `tests/css-scale.test.ts` and
`tests/css-system.test.ts` fail the build on a raw value, so read that document before adding CSS.

## The five faults (and the rule that prevents each)

### 1. Starved figure → **the figure is the hero**
- The figure gets ≥ 55 % of the lab's vertical space above the fold at 1024 px wide. If the
  chrome (header + status + evidence + controls + callout + nav) is taller than the figure, cut chrome.
- The subject fills the frame. An SVG `viewBox` is cropped to the drawing plus ~6 % margin; a 3D
  camera is placed so the subject spans ≥ 50 % of the viewport height (see §3D).
- Never a figure inside a padded card inside a padded card. The figure sits directly in the
  activity with one padding ring.

### 2. Card-in-card → **one container, hairlines inside**
- Exactly one bordered, rounded container: the activity root. Inside it, regions are separated
  by 1 px hairlines (`var(--border)`), never by nested borders, radii, or shadows.
- Evidence surfaces (`Readout`, `StatList`, `.lab-metric-list`) inside an activity inspector are
  **flat**: no border, no background, no shadow. (`.lab-authored-evidence` already strips them.)
- At most one tinted band per lab (the status strip). The task lead, the callout, and the
  transcript are plain flow with a hairline or a 3 px accent rule.

### 3. Says everything three times → **say it once**
Each fact has one home. Before shipping, grep the JSX for the same number or sentence in two
slots. The homes are:
| Slot | Holds | Never holds |
|---|---|---|
| Status strip | the 1–3 live parameters (β, k, n…) | a sentence, the headline value |
| `Readout` | THE headline number/name + a ≤ 8-word sub | the interpretation sentence |
| `StatList` / metric list | supporting numbers not in the headline | the headline, static filler ("DNA replicated: before mitosis") |
| OBSERVE callout (`observation`) | the one-sentence interpretation | numbers already in Readout unless the sentence needs them |
| Transcript | a11y narration (may repeat, it is collapsed) | — |
- The step lead (the question) is body text in `--foreground`, weight 550. It is the most
  important sentence on screen; muted 13 px fine print for it is a bug.
- A control label is ≤ 3 words. A field `<small>` hint is ≤ 12 words.

### 4. Unreadable scene text → **on-screen type floor 12 px, contrast floor 4.5:1**
- SVG `<text>` is measured **on screen**: `viewBox-px × (rendered-width / viewBox-width)`.
  A 13 px label in a 720-wide viewBox rendered at 360 px is 6.5 px → fail. Size scene text for the
  narrowest layout it will render in, or change the layout (stack instead of split columns).
  **The remedy is usually a NARROWER viewBox, not bigger text.** Worked example (`math/slide-rule`):
  a numbered log scale needs ~10 labels across. At 720 wide a 16-unit `measure` numeral renders at
  8 px on a 360 px column; at 440 wide it renders at 13 px and passes. So the scale carries one
  decade over a 260-unit span in a 440-wide viewBox, and only 1,2,3,4,5,6,8,10 are numbered — 7 and
  9 stay unnumbered majors, because at that span their numerals would touch their neighbours. Cut
  labels and shrink the frame before you shrink the type.
  Classes: `.modern-scene-label` 15 px, `.modern-scene-note` 13 px, `.modern-scene-measure` 16 px,
  `.modern-clock-ledger` 17 px (viewBox units, for ~600–720-wide full-column scenes).
- Every scene label uses `paint-order: stroke` with a `--stage-bg` stroke when it can cross a line.
- Text and thin strokes: ≥ 4.5:1 against `--stage-bg` in BOTH themes (`--stage-fg`, `--stage-muted`
  qualify; `--stage-grid` does not — it is for grids only).
- Bare `<text>` with no class is a bug (inherits host serif/size).

### 5. 3D that reads as noise → **the 3D scene standard**
- **No dense wireframes.** A 28×20 wireframe sphere on a white page is grey noise. Use
  `TranslucentShell` (`src/three/biology/cell-world.tsx`): a darker `BackSide` shell under a glossy
  front shell, `depthWrite={false}`, plus an optional crisp equatorial ring. A guide mesh, if any,
  is ≤ 12×8 segments at ≤ 0.1 opacity.
- **Fill the frame.** Default camera z so the subject spans ≥ 50 % of viewport height
  (`fov 75`: half-height ≈ 0.77·z; a radius-r subject needs z ≈ 2.6·r… 3.3·r).
  Re-place the camera per checkpoint (see `CheckpointCamera` in `mitosis-explorer.tsx`).
- **Objects have volume.** Meaningful things (chromatin, fibres, cargo) are ≥ 0.04 units thick with
  `meshStandardMaterial` (lit), not `meshBasicMaterial` at 0.6 opacity. Reserve translucency for
  containers.
- **Colour = meaning, from the palette only** (`useScenePalette`: accent / secondary / warning /
  foreground). Two families max per scene plus the neutral container. Legend chips name each.
- **Name the parts.** A 3D scene that labels nothing teaches nothing (a Bloch sphere without
  |0⟩ / |1⟩ is a ball). Use `SceneLabel` (`src/three/primitives.tsx`): a canvas-texture sprite,
  no drei, always facing the viewer. Give it `halo={palette.background}` so it survives geometry.
- **Vectors are geometry, not lines.** WebGL ignores `lineWidth`, so a `<line>` arrow is a 1px
  hairline. Use `SceneVector` (lit shaft + cone head; `head={false}` for an axis rod, `opacity`
  below 1 for a field lattice that should recede) and `SceneTrail` for paths.
- **Rings, not wireframes.** Give a translucent sphere its geometry with `SceneRing` great
  circles (equator + two meridians). A 36×20 wireframe is grey noise.
- **The container is neutral.** Spend the two hues on what carries meaning (the state, the
  measured axis); draw the shell, the field lattice and the apparatus in `palette.foreground`
  at low opacity. Legend swatches must match what is drawn: `data-tone` `outer` = accent-2,
  `pair` = accent-2 outline, `nucleus` = warn, `neutral` = muted, none = accent.
- **Draw the field that acts.** Check the model before drawing arrows: the spatial-Lorentz scene
  drew a vertical E field in magnetic mode, where E is zero and B lies along the view axis.
- **Static fallback is real.** `fallback` renders the same facts as an SVG or metric list, not "3D
  unavailable".
- Verify in a real browser (gallery PNGs render the SSR fallback only): start the mentora dev
  server (`apps/web`, :4001) and run `node tests/gallery/live.mjs <route> [--dark] [--match=<text>]`
  (`--match` filters labs by heading text, `--dark` renders under prefers-color-scheme: dark).

## Art direction (the visual language every figure shares)

Brilliant/Duolingo look "rich" because every figure in the product is drawn in ONE language,
not because each is a masterpiece. Ours lives in `styles/figure.css` (tokens + type roles) and
`src/kit/figure/` (the primitives). A lab picks ROLES; it never picks a number.

### Stroke, radius, shadow (SVG user units; figures are 600–720 wide)
| Role | Width | Use |
|---|---|---|
| `hair` 1 | guides, grids, ticks, outlines of filled bodies |
| `line` 1.75 | plots, connectors, arrows |
| `edge` 2.5 | object outlines, glass walls, axes of emphasis |
| `bold` 3.5 | the ONE emphasised path in a figure (max one) |
- Radii: `--fig-r-sm` 3 (tiles), `--fig-r` 6 (bars, regions), `--fig-r-lg` 12 (panels). Nothing else.
- Shadow: only the soft contact ellipse under a container/body (`--fig-shadow`), never drop
  shadows on lines or text. Depth comes from ONE sheen highlight (top-left, `--fig-sheen` at
  ≤ 0.45) and a darker hairline outline (`shade(color)`), not gradients.
- Perspective: figures are flat orthographic side/top views. No isometric boxes, no 3D-ish
  ellipses except the meniscus and the contact shadow. Depth cues are overlap + size only.

### Colour: three hues + neutrals, per domain
`--fig-hue-1` (the subject), `--fig-hue-2` (the other party: product, heat, force),
`--fig-hue-3` (the medium: liquid, field, tissue) plus neutrals (`ink`, `ink-soft`, `paper`,
`glass`, `metal`, `ground`). Semantic tones (`hot`, `cold`, `good`, `warn`, `danger`) are shared.
`Figure domain="chem|physics|biology|math|commerce"` selects the triad; a scene uses at most
two hues + neutrals + one semantic tone. Hex colours in a scene file are a bug (grep `#[0-9a-f]{6}`).
Fills that must recede use `tint(color, %)` (mix toward paper), never alpha, so both themes work.

### Type in figures
`<FigText size="label|note|title|measure|eyebrow" tone="ink|soft|hue-1|hue-2|hue-3|hot|good|inverse">`.
Every label carries a paper halo. Sizes are 13 / 11.5 / 14 / 16 / 10.5 user units; keep the
on-screen result ≥ 12 px (see fault 4). Bare `<text>` or `fontSize={…}` in a scene is a bug.

### Glyph vocabulary (compose, don't redraw)
| Need | Use |
|---|---|
| a sphere / atom / molecule / marble | `Ball` (≥ 6 r gets a sheen), `Particle` for crowds |
| a mass / tile / cell | `Block` |
| beaker, box, flask, tube, cylinder + liquid | `Glass shape=… fill=…` (children are clipped inside) |
| a gas volume / field / tissue region | `Region` |
| a vector, flow, pointer | `Arrow` (weight role, optional label) |
| light / energy beam | `Ray` |
| orbit / trajectory / route | `Track` |
| floor / wall | `Ground` (hatch for a fixed wall) |
| the plot beside the scene | `PlotFrame` + `Curve` / `Area` / `Guide` / `Marker`, `scale()` |
| a composition / mixture bar | `SegmentBar` |
| a legend chip / value pill | `FigTag` |
| artwork HTML/CSS cannot draw | `Illustration` (host-supplied asset, see `docs/ILLUSTRATIONS.md`) |
Reference conversion: `src/chem/kinetics/preset.tsx`. Domain-specific glyphs (thermometer,
burner, circuit parts, planets) stay in their kits but must draw with `STROKE`, `HUE`, `FigText`.

### Converting an existing scene to the kit (checklist)
1. `<svg viewBox … role="img" aria-label>` → `<Figure viewBox={[w,h]} domain="…" label={…}>`.
   Crop the viewBox to the drawing + ~6 % margin; the figure must fill its frame.
2. Every `<text>` → `FigText` with a size + tone role. Delete `fontSize`, `fill`, `fontWeight`,
   `paintOrder` attributes and the old `.modern-scene-*` / ad-hoc classes.
3. Every colour → a role: `HUE[1|2|3]` for the two hues + medium, `HUE.hot|cold|good|warn|danger`
   for semantics, `HUE.ink|soft|glass|metal|paper` for neutrals, `tint()`/`shade()`/`alpha()` for
   variants. No hex, no `--stage-cat-N`, no `--stage-accent` picked directly in a scene.
4. Every `strokeWidth` number → `STROKE.hair|line|edge|bold`; every circle body → `Ball` /
   `Particle`; boxes and tiles → `Block`; vessels → `Glass`; regions → `Region`; arrows →
   `Arrow`; beams → `Ray`; axes → `PlotFrame`; shaded tails → `Area`; reference lines → `Guide`.
5. Layout: no two labels closer than 14 units; captions sit clear of geometry (above the
   figure or below the legend), never across it. Legends go under the drawing, left-aligned.
6. t = 0 must already show the phenomenon (seeded particles, a first wavefront, a resting
   bob): a blank plot or an empty vessel before Play is a bug.
7. Glyphs the kit lacks (a train, a clock face, a nucleus, a mirror) are drawn in the scene
   file from kit parts: one hue + neutrals, hairline outline, at most one sheen, no gradients,
   no emoji-style icons, no fills at 0.x opacity for solid things.
8. Verify: `npx tsc --noEmit` clean, the lab's tests green, rasterize light + dark and LOOK
   (`node tests/gallery/rasterize.mjs <name>`), then the on-screen type/contrast floors.

## Shell anatomy (AuthoredActivityRuntime — the 98-lab default)

```
eyebrow · Title                                    [Focus mode]
description (muted, ≤ 2 lines)
▒ phase · step title · live params                          ← status strip (ONLY tinted band)
Step lead — the question (foreground, 15 px)
┌──────────────────────────────────────────────────────────┐
│                    FIGURE  (hero)                        │
└──────────────────────────────────────────────────────────┘
──────────────────────────────────────────────────────────── hairline
HEADLINE  value      │ label …………… value                       ← evidence row (flat)
sub line             │ label …………… value
──────────────────────────────────────────────────────────── hairline
[control] [control] [control]                               ← controls row
▎OBSERVE  one-sentence interpretation
Event transcript ▸
← Back        n / N        Continue →
```

## Pre-delivery audit (run it, don't skim it)
1. Rasterize (`node tests/gallery/rasterize.mjs <name>`) and LOOK at light **and** dark PNGs.
2. Figure ≥ 55 % of the height above the fold? Subject fills its frame?
3. Count bordered/rounded containers on screen. More than one → flatten.
4. Run `node scripts/say-it-once.mjs` — it lists every authored lab whose status / Readout / rows /
   OBSERVE slots share a dynamic fact. Conditionals (`state.blocked ? … : …`) are fine; repeated
   numbers and sentences are not.
5. Smallest on-screen text in the scene ≥ 12 px? Contrast ≥ 4.5:1 in both themes?
6. 3D: no dense wireframe, subject ≥ 50 % of viewport, objects lit and ≥ 0.04 thick.
7. Controls: labels ≤ 3 words; one segmented control for 2–4 modes (`.lab-segmented`), not stacked buttons.
8. Nothing overlaps at 360 px and 1280 px container widths.
9. `npm run verify` green; snapshots re-baselined only for labs you intentionally changed.

## Anti-patterns seen in this repo (do not reintroduce)
- Triangular zig-zag "springs" (use the coil helix path in `physics/shm` / `work-energy`).
- Two stacked full-width buttons for a two-mode toggle.
- Status strip carrying `energy 100%` or `checkpoint 1/5` when the nav already shows `1 / 5`.
- A 4-row metric list where 3 rows never change.
- `linked` side-by-side scene panels that halve every label to < 8 px.
- Missing padding on `.lab-authored-evidence` / `.lab-authored-controls` (labels overlapping the ledger).
