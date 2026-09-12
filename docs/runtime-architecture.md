# Labs runtime architecture

The manifest registry is the single source of truth for catalog metadata, CMS blocks, runtime loading, authoring loading, and MDX tags. A lab must not be added through a parallel block catalog or a per-domain loader.

## Rendering policy

- Use Stage SVG primitives for semantic diagrams, draggable geometry, labels, small graphs, and hardware scenes.
- Use Stage `CanvasLayer` only when the visual has a dense or continuously animated field where hundreds of SVG nodes would hurt host React applications.
- Canvas rendering must still use Stage coordinates, visibility/frame hooks, an accessible label, design tokens, and DOM controls. A standalone `<canvas>` runtime is not permitted.
- Three.js belongs in a separately loaded lab subpath and must never enter a domain barrel eagerly.

The intentional CanvasLayer labs are pinned by `tests/architecture-convergence.test.ts`; additions require an explicit performance rationale in that allowlist.

## Optional three-dimensional renderers

WebGL is an opt-in renderer tier, not the default labs runtime. Import it only
from `@classytic/labs/three`; the normal root and domain subpaths never import
Three.js or React Three Fiber. Hosts that choose the tier install compatible
`three` and `@react-three/fiber` peers and import `@classytic/labs/styles/three.css`.

Use 3D only when depth, occlusion, viewpoint, or spatial symmetry is part of the
learning objective. Molecular geometry, atomic orbitals, spatial vector fields,
and orbital mechanics can qualify. Circuits, algorithm traces, network diagrams,
and ordinary plots should stay SVG or Canvas2D because 3D adds navigation cost
without adding explanatory information.

Every WebGL renderer must:

- reuse the same pure domain model and authored Activity shell as its 2D peer;
- preserve a non-WebGL renderer or meaningful fallback;
- provide a text alternative and keep controls in accessible DOM;
- render on demand unless continuous motion is instructionally necessary;
- cap device pixel ratio and pause when hidden or reduced motion is requested;
- live behind its own package subpath and CSS subpath so tree shaking is explicit.

The first reference implementation is `MolecularGeometryThreeLab`. It injects a
Three renderer into `MolecularGeometryLab`; it does not duplicate the lesson,
state, controls, evidence, questions, or chemistry model.

The implementation order, ownership rules, proposed source tree, performance
budgets, and extraction threshold for additional spatial lessons are defined in
[`THREE-ROADMAP.md`](./THREE-ROADMAP.md). That roadmap intentionally retains a
single optional `/three` entry until measurements—not speculation—justify more
public subpaths.

`ThreeSceneSurface` owns capability detection, near-viewport mounting, delayed
offscreen context release, context-loss/error fallback, reduced-motion behavior,
and the DPR ceiling. Keep semantic labels and interactive controls in DOM/SVG.
The experimental HTML-in-Canvas shader path is intentionally not used: it is not
widely available and adds no instructional value to the current molecule scene.
Likewise, CSS masks and decorative shaders are not renderer requirements. Add a
shader only when the field itself is the lesson—for example orbital probability
density or an electrostatic potential—not to decorate controls or backgrounds.

## Learner UI contract

The host lesson and MDX own static exposition, objectives, prerequisites, and worked explanations. A lab runtime owns the manipulation that cannot be expressed well as prose:

- one current task and the controls required to complete it;
- the live model or scene;
- dynamic evidence, feedback, and an exact completion condition;
- compact progress/navigation when the interaction has authored steps;
- optional help only when it responds to the learner's current state.

Do not repeat objectives in a “Learning goals”, “Learning support”, or “What you'll learn” panel. Do not keep success feedback from the previous step visible beside the next task. Cumulative history such as ledgers, traces, and prior attempts belongs in a labelled disclosure until the history itself becomes the current task. Prefer one visual surface per hierarchy level; a workspace should not add a decorative card merely because it sits inside the activity canvas.

Every gated step must name the measurable target and expose every control needed to reach it. Its interaction test must prove the default state can reach the next step without relying on hidden controls.

## Authoring policy

Authoring panels use the shared primitives in `src/blocks/authoring.tsx`. Raw inputs in per-lab authoring files are prohibited so focus behavior, validation, theming, and host integration remain consistent.

Static activities should use `defineAuthoredActivity`, which compiles their
sequence and lookup indexes once beside the domain model. CMS input remains a
readable `AuthoredActivity`: validate it with `authoredActivitySchema` at the
authoring boundary, or call `parseAuthoredActivity` to validate and compile in
one operation. The compiler deliberately
has no Zod dependency, keeping author validation out of learner chunks. The
runtime also accepts raw activities for compatibility and memoizes their plan;
new package-owned activities should provide the compiled form.

The authoring schema rejects unreachable steps, unused success conditions, and
questions that are not connected to a scored answer or reflection gate. These
are authoring errors rather than harmless metadata: the learner runtime could
never encounter that content.

`deriveActivityExperience` computes objectives, phases, and response types from
raw or compiled activity data. `assessLabExperience(manifest, activity)` compares
those facts with a manifest and reports drift. Keyboard completion, text
alternatives, and reduced-motion behavior remain explicit evidence because they
cannot be inferred honestly from configuration data. Catalog generation must
not import a React runtime to obtain this evidence.

New generated labs place this portable definition in `activity.ts`. The leaf runtime imports
that plan for rendering and its quality test imports the same plan for drift checks. Manifests
do not eagerly import activity plans: catalog listing remains metadata-only, while authoring
and release tools can opt into the richer definition per lab.

## Compatibility policy

Compatibility aliases are temporary only when a known host consumes them. Empty registries, no-op components, and unused fallback loaders are removed rather than retained indefinitely.
