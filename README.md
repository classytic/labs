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

```bash
npm i @classytic/labs @classytic/stage
# required peers:  react, react-dom
# optional peers:  katex (pretty math), zod (template params + /blocks), lucide-react,
#                  @classytic/cms-ui + @classytic/cms (for /blocks authoring)
```

```css
/* in your global CSS, after `@import "tailwindcss";` */
@import "@classytic/stage/styles.css";   /* engine tokens + asset kit */
@import "@classytic/labs/styles.css";     /* control-UI kit + lab tokens */
```

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

Labs are authored with the stage **SceneBuilder** in `authoring` mode (place points,
sliders, labels; live scalar controls; a pedagogy/`LabMeta` editor) and surfaced in a
host (e.g. Brihot/Mentora) via the `@classytic/cms-ui` `defineBlock` contract. The lab's
completion/score events flow to the host's learner seam (xAPI) via `useLearner().report`.

## Subpaths

Domain packs (lab components): `@classytic/labs/{math, physics, chem, circuits, geometry,
language, ict, commerce, biology, geography, discrete, statistics, ml}`. Shared:
`@classytic/labs/{core, catalog, schemas}`. Editor blocks: `@classytic/labs/blocks` (all)
or per-domain `@classytic/labs/blocks/{math, physics, chem, circuits, geometry, ict,
language, accounting, economics, biology, geography, ml, discrete, statistics}`. Import
only what you need (tree-shaken at the subpath boundary).

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
