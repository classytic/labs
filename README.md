# @classytic/labs

**Authorable, domain-organized interactive learning labs — built on the
[`@classytic/stage`](../stage) engine.** Labs are React components composed from the
stage primitives — SVG `<Stage>` (accessible, themeable, agent-drivable) plus a zero-dep
`<CanvasLayer>` for high-element animations — with HTML controls around them, tokenized
and validated by Zod prop schemas. Some labs are backed by a portable JSON `SceneDoc`
(typed dependency graph + resolver + command/undo); many are direct primitive
compositions. Per-domain subpaths so
you only ship what you import.

The product isn't a fixed widget catalogue — it's a small, sharp engine + reusable
**lab families** (templates) a teacher composes and configures. Adding a "new lab" =
registering one family, not new plumbing.

Project direction and review criteria live in [the Labs target](docs/LABS-TARGET.md)
and [the convergence plan](docs/LABS-PLAN.md). They distinguish registered labs from
evidence-backed showcase experiences and define the Stage/Labs/CMS/host boundaries.
The [public-surface inventory](docs/COMPATIBILITY.md) distinguishes active primitives
from temporary compatibility APIs and records the evidence required before removal.
[The design system](docs/DESIGN-SYSTEM.md) specifies the chrome around every figure:
tokens, type roles, motion, focus, targets, and which region of the shell carries which
learning principle. Its tokens are exported to `design-tokens.json` (W3C DTCG 2025.10).

```bash
npm i @classytic/labs @classytic/stage react react-dom katex lucide-react
# optional feature peers: zod (catalog, schemas and authoring),
#                         @classytic/cms-ui + @classytic/cms (/blocks authoring),
#                         three + @react-three/fiber (/three renderers)
```

```css
/* in your global CSS, after `@import "tailwindcss";` */
@import "@classytic/stage/styles.css";   /* engine tokens + asset kit */
@import "@classytic/labs/styles.css";     /* control-UI kit + lab tokens */
```

`styles.css` is the compatibility aggregate. Hosts that only load selected
domains can import the layers explicitly instead:

```css
@import "@classytic/labs/styles/core.css";
@import "@classytic/labs/styles/domains.css";  /* built-in science/math/domain visuals */
@import "@classytic/labs/styles/commerce.css"; /* only on Commerce routes */
```

Three-dimensional renderers are deliberately opt-in. They reuse the same lesson,
controls, evidence, and domain model as the lightweight renderer:

```tsx
import { AtomicOrbitalThreeLab, MolecularGeometryThreeLab } from '@classytic/labs/three/chemistry';
import '@classytic/labs/styles/three.css';

<MolecularGeometryThreeLab molecule="h2o" showLonePairs showDipoles />
<AtomicOrbitalThreeLab orbital="3d-z2" view="cloud" />
```

Use this tier when spatial depth is itself the concept. Importing any normal root
or domain subpath does not load or require React Three Fiber or Three.js.
The broader `@classytic/labs/three` entry remains available as a convenience;
prefer the domain entry when a host only enables one family of 3D lessons.

Community-authored labs using the Activity, pedagogy, and response primitives need only
`core.css`. Add `domains.css` when rendering the package's built-in domain catalog and
`commerce.css` only for Commerce experiences. All layers consume shadcn-compatible semantic
tokens (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`) with
Stage fallbacks; they do not install or override a host theme.

```ts
// once, if you use any lab that renders equations (DerivativeExplorer, Grapher, …)
import "katex/dist/katex.min.css";
```

## Use a lab

```tsx
import { Grapher, DerivativeExplorer, BalanceAlgebraLab } from '@classytic/labs/math';
import { LeverBalanceLab } from '@classytic/labs/physics';
import { CircuitNetworkLab } from '@classytic/labs/circuits';

// type any equation(s) + expose learner-draggable param sliders:
<Grapher equations={['a*sin(b*x)']} params={[{ name: 'a', min: 0, max: 3, value: 1 }]} />

// drag a point; the secant becomes the EXACT tangent (symbolic f′), shown in KaTeX:
<DerivativeExplorer equation="x^2" />

// solve 2x + 1 = 7 by balancing the scale:
<BalanceAlgebraLab coef={2} addend={1} rhs={7} answer={3} />
```

## The lab-template registry (`@classytic/labs/catalog`)

Families are listable/instantiable units — the basis for a lab "marketplace" and the
authoring kit. Params are validated against the family's zod schema before a scene is built.

```ts
import { listLabTemplates, instantiateTemplate } from '@classytic/labs/catalog';

listLabTemplates();                       // [{ id:'balance-algebra', category:'algebra', … }, …]
const r = instantiateTemplate('balance-algebra', { coef: 3, addend: 1, rhs: 10, answer: 3 });
if (r.ok) renderScene(r.doc);             // r.doc is a portable SceneDoc
else console.warn(r.error, r.issues);     // typed validation errors — no broken scene
```

Built-in families: `balance-algebra`, `area-model`, `growing-pattern`, `balance-lever`,
`optics`, `circuit` (more as domains migrate).

## Authoring

Community tools should import the host-neutral contract from `@classytic/labs/authoring`:

```ts
import { defineLab, parseAuthoredActivity } from '@classytic/labs/authoring';
```

This subpath contains no lab renderer, editor, or domain barrel. A manifest owns the
validated configuration schema, lazy runtime boundary, taxonomy, and optional portable
learning-experience declaration. `parseAuthoredActivity` validates unknown CMS input and
returns the dependency-free runtime plan. New labs created with `npm run lab:create` receive
a compiled investigation with a measurable gate, shared controls, evidence, transcript, and
stable transport. Authors expand it into the phases their learning objective actually needs
instead of receiving decorative empty steps. Authors replace the functional starter model
with domain teaching; they do not rebuild headers, focus mode, responsive workspace,
inspector, feedback, transcript, or transport controls.

The generator emits five reviewable artifacts: a cheap `manifest.ts`, a pure compiled
`activity.ts`, an isolated `runtime.tsx`, an `example.mdx` showing the CMS-facing
configuration, and an interaction test covering
the primary action, reset, live feedback, and transcript. The starter is functional, but it
does not declare itself showcase-ready. Add the manifest `experience` contract only when the
real domain activity has evidence for every declared phase and accessibility behavior.
`activity.ts` is the single source for the lesson sequence: runtime and quality tooling import
it directly, while the global manifest catalog does not, preserving its schema/metadata-only
boundary.

Authored activities support choice, numeric-with-tolerance, accepted-text, ordering, and
rubric-based reflection responses. Hosts decide how those portable response contracts are
rendered and persisted.

Before featuring a community lab, call `assessLabExperience(manifest)`. It returns actionable
issues when the experience is missing a phase, response, keyboard path, scene transcript, or
reduced-motion behavior. This is a quality gate, not a second runtime or a versioned UI system.

Run `npm run labs:quality` for a concise catalog score, add `--list` for migration candidates,
or `--details` for actionable issues. Use `--domain physics` to focus a cohort or `--json` for external tooling. Release verification
runs the strict form, which rejects any lab advertised as a starter unless its portable
experience contract is complete. Browser, accessibility, scientific-review, and learner-outcome
testing remain independent requirements; metadata alone is never called proof of learning.

Labs are authored with the stage **SceneBuilder** in `authoring` mode (place points,
sliders, labels; live scalar controls; a pedagogy/`LabMeta` editor) and surfaced in a
host (e.g. Brihot/Mentora) via the `@classytic/cms-ui` `defineBlock` contract. The lab's
completion/score events flow to the host's learner seam (xAPI) via `useLearner().report`.

## Subpaths

Domain packs (lab components): `@classytic/labs/{math, physics, chem, circuits, geometry,
language, ict, commerce, biology, geography, discrete, statistics, ml}`. Shared:
`@classytic/labs/{core, catalog, schemas}`. Editor blocks use
`@classytic/labs/blocks`; discovery-only hosts should prefer `/blocks/catalog`,
`/blocks/gallery`, or `/blocks/domains`, and load the full block surface only when
opening an authoring editor. Import only the domain runtime you need; the build
preserves leaf modules so ESM bundlers can tree-shake them.

## Authoring algorithm lessons

Algorithm runtimes use deterministic event traces, while their CMS editors remain lazy and
domain-scoped. Authors configure the teaching problem; the package owns playback, prediction
gates, responsive layout, focus mode, transcript, and keyboard controls.

```tsx
import {
  GraphAlgorithmLab,
  GridPathLab,
  HeapQuestLab,
  TreeQuestLab,
} from '@classytic/labs/algorithms/react';

<GraphAlgorithmLab algorithm="dijkstra" graph={graph} source="home" target="server" />
<TreeQuestLab operation="avl-insert" values={[30, 10]} target={20} predict />
<HeapQuestLab operation="insert" kind="min" values={[3, 7, 5, 12]} value={1} />
<GridPathLab rows={4} cols={5} />
```

Use `@classytic/labs/algorithms/core` for contracts and trace-independent utilities,
`/graph`, `/tree`, `/heap`, or `/dp` for one pure algorithm family, and `/react` only in a
React learner surface. Graph, tree, heap, and DP manifests all provide lazy authoring panels;
editors do not enter learner bundles. Keep trees at 31 nodes, heaps at 15 items, and DP grids
at 8×8 or below so labels and touch controls remain instructional rather than decorative.

## Authorable pathways

`@classytic/labs/pathways` publishes small, runtime-free curriculum sequences. A host
can inspect the steps or generate portable MDX and then edit each activity normally:

```ts
import { chemistryFoundationsPathway, pathwayToMdx } from '@classytic/labs/pathways';

const starterMdx = pathwayToMdx(chemistryFoundationsPathway);
```

The chemistry pathway progresses from the deliberately limited Bohr shell model to
periodic evidence, probability orbitals, molecular geometry, reactions,
stoichiometry, solutions, and titration. It supplies recommended defaults rather
than locking authors into one lesson script.

## Release verification

Run `npm run verify:release` before packing or publishing. It validates generated
registries, types, every declared export target, SSR imports, the CSS transfer budget,
and the complete test suite. `prepublishOnly` runs the same command automatically.
See [`docs/release-checklist.md`](docs/release-checklist.md) for the consumer smoke test.

## Theming & customization (the CSS contract)

The lab UI is plain global CSS with **stable, semantic selectors** — no CSS modules, no
hashed class names, no inline chrome — so a host can restyle everything without forking.
Three levels, from broadest to most surgical:

**1. Tokens (retheme everything at once).** All chrome consumes one small scale defined
in `labs/styles.css` `:root`. Override any of them in your own `:root` / `.dark`:

```css
:root {
  /* colour — binds to your shadcn vars automatically (--primary, --success, …),
     or pin the lab palette directly: */
  --lab-accent: oklch(0.55 0.2 300);

  /* density: paddings/gaps everywhere follow the spacing scale */
  --lab-sp-2: 8px;  --lab-sp-3: 12px;  --lab-sp-4: 14px;   /* tighter UI */

  /* shape + type */
  --lab-r-md: 8px;                  /* squarer cards/chips        */
  --lab-t-lg: 16px;                 /* bigger question prompts    */
  --lab-shadow-sm: none;            /* flat, borderless look      */
}
```

Stage figures theme the same way via `--stage-*` (canvas, grid, accents, glyph colours)
in `stage/styles.css`.

**2. Component selectors (restyle one pattern).** Class names are a public API and
single-class specificity, so a plain selector wins. States are data-attributes:

```css
.lab-challenge { border: 0; box-shadow: var(--lab-shadow-md); }      /* card-ier quiz */
.lab-challenge .lab-choice { border-radius: var(--lab-r-pill); }     /* pill choices  */
.lab-choice[data-tone="correct"] { … }  .lab-choice[data-tone="wrong"] { … }
.lab-explain { border-left-width: 0; }                                /* no accent edge */
.lab-activity-fields { background: transparent; border: 0; }          /* bare controls  */
.lab-stepnav .lab-dot[data-on="true"] { … }                           /* stepper dots   */
.lab-predict-body[data-locked] > * { filter: blur(6px); }             /* stronger lock  */
.lab-confetti { display: none; }                                      /* no celebration */
```

Key hooks: `.lab-activity / .lab-activity-header / .lab-activity-workspace /
.lab-activity-canvas / .lab-activity-inspector / .lab-activity-fields / .lab-activity-transport` (layout) · `.lab-challenge / .lab-choice / .lab-explain /
.lab-pill[data-state] / .lab-hints / .lab-solution` (pedagogy) · `.lab-field /
.lab-btn / .lab-chip / .lab-input` (controls) · `.lab-stepnav / .lab-dots` (stepper) ·
`.lab-option / .lab-panel / .lab-eyebrow` (the shared primitive families — restyling
these restyles every variant at once).

**3. Structure (beyond CSS).** Layout/behaviour variants are component props, authored
in the CMS block form — e.g. `guided` (step-by-step arc vs free explorer),
`controlConfig={{ hide, lock }}` (which knobs a learner sees), `objectives`, per-lab
scenes. If a variant you need isn't a prop yet, that's a kit request, not a CSS hack.

## Rendering model (all on @classytic/stage)

**Every lab renders on the stage engine — the legacy canvas engine is gone.** Two backends:

- **SVG `<Stage>`** (the default — accessible, themeable, SceneDoc-portable): all of math,
  the physics vector/diagram labs (`VectorScene`, `RiverBoat`, `ProjectileLab`,
  `GravityDrop`), chemistry (`BohrAtom`, `ReactionProfile`, `ReactionLab`, `Battery`),
  circuits (`CircuitLab`, `CircuitBuilder`, `CircuitNetworkLab`), and geometry
  (`GeometryBoard`, `GeometryBuilder`, `IntersectingCircles`).
- **`<CanvasLayer>`** (stage's zero-dependency raw-Canvas2D escape hatch — HiDPI, shares the
  engine coords + clock) for the genuine high-element-count labs: `GradientDescent` (per-cell
  heatmap) and `OrbitLab` (fading 260-point trail). This is the deliberate alternative to a
  heavy GPU dependency; nothing here needs WebGL.

`@classytic/labs/core` is now just a small domain-neutral toolkit on top of stage (lazy-KaTeX
`<Tex>`, numerical calculus, easing/keyframes, a tiny reactive value, number utils) — the
coordinate system, primitives, resolver, clock, control surface, and learner seam all live in
`@classytic/stage`.

## License

MIT

## Trademark

MIT-licensed code. "Classytic"/"arc" names + logos are trademarks of Classytic LLC — see [TRADEMARK.md](TRADEMARK.md).
