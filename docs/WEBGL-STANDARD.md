# WebGL learning-scene standard

WebGL is an optional renderer for concepts whose spatial structure is itself evidence. It is not a decoration layer. A 3D-first activity may require WebGL for direct spatial exploration, but its learning claims, current state, instructions, and assessment must remain available as semantic DOM.

## Supported renderer pair

- React Three Fiber: `>=9.7`
- Three.js: `>=0.172`

Three.js deprecated `Clock` in r183 while React Three Fiber 9.7 still owns a
`THREE.Clock` in its render store. Labs does not cap host peer versions for this
upstream warning. Do not suppress it or patch a host's console; hosts that need a
quiet development console may temporarily resolve Three to r182 until Fiber
migrates its internal clock.

## The 3D admission test

A lesson earns WebGL only when learners must inspect depth, occlusion,
orientation, spatial symmetry, or viewpoint. Molecular geometry,
stereochemistry, orbitals, crystal lattices, and a navigable cell can qualify.
Plots, spectra, light clocks, spacetime diagrams, circuit schematics, and
ordinary graphs remain SVG or Canvas2D.

Every admitted scene must provide all of the following:

- direct pointer and touch manipulation with an obvious affordance;
- a useful initial camera, constrained navigation, and a reset-view action;
- readable silhouette and semantic colour in both light and dark host themes;
- state-driven changes that answer the lesson question, not ambient motion;
- demand rendering when idle, capped pixel ratio, and no decorative shadows or
  post-processing unless they carry information;
- a semantic DOM explanation and controls outside the canvas.

## Choose the experience tier

### Embedded instrument

Use the regular lab runtime with a bounded scene when one manipulation answers one focused question. Examples: molecular geometry, orbital orientation, a vector in a magnetic field, chromosome alignment at one mitosis stage.

### Immersive exploration

Use a dedicated client route when the learner navigates a world, changes scale, or follows more than one spatial checkpoint. Examples: exploring a cell from membrane to nucleus, moving through an electrical substation, or travelling from Earth orbit to a planetary system.

An immersive route is not a giant lab card. It has one persistent canvas, DOM chapters layered beside it, explicit checkpoint navigation, saved progress, and a compact assessment handoff. The host application owns the route and product shell. Labs owns the scientific state, authored checkpoint schema, reusable scene objects, and assessment contract.

### Do not use WebGL

Prefer SVG or Canvas when depth does not change the inference: graphs, timelines, circuit schematics, sorting, tables, and most two-dimensional field diagrams. “Modern browsers support it” is not by itself a reason to spend GPU, download, authoring, and accessibility budget.

## Package boundary

- Keep Three.js and React Three Fiber behind `@classytic/labs/three`, `/three/chemistry`, or `/three/physics`.
- Keep the model, authored activity, controls, and projected scene in the regular domain package.
- A WebGL component replaces only the scene renderer; it must not fork the lesson logic.
- Do not add a new subpath for every lesson. Add a domain subpath only when it prevents consumers from resolving an unrelated renderer family.

## Scene contract

- Use `ThreeSceneSurface` for capability detection, deferred mounting, context-loss recovery, reduced motion, capped DPR, demand rendering, and the accessible scene label.
- Supply an informative semantic fallback. It may be a compact projected scene, state table, or labelled still; it does not need to duplicate the interactive renderer.
- Use `useScenePalette` and shared `SceneEnvironment`, `SceneAtom`, and `SceneBond` primitives.
- Keep controls and explanatory text in accessible DOM outside the canvas.
- Default to `frameloop="demand"`. Use continuous rendering only while motion conveys changing evidence.
- Prefer geometry, materials, points, and instancing over bitmap assets. Reuse loaded assets by stable URL when an external model is genuinely necessary.

## Visual direction

- One primary object, one teaching action, one evidence layer.
- Use depth, lighting, and camera movement to explain structure—not to create spectacle.
- Reserve accent colours for authored semantic roles and provide a legend when colour carries meaning.
- Avoid bloom, particles, shaders, textures, and shadows unless removing them would make the concept harder to understand.
- Preserve a quiet background, crisp silhouette, bounded camera, and readable projected alternative.

## Scroll-led immersive routes

- Use one sticky canvas for the entire experience. Do not create a WebGL context per chapter.
- Treat scroll as chapter selection and camera interpolation, not as an unbounded animation timeline.
- Pair each camera destination with a named checkpoint and URL/progress state so keyboard and touch users can navigate without precision scrolling.
- Keep headings, explanations, controls, captions, and assessments in DOM. The canvas shows spatial evidence only.
- Pause motion and expensive simulation when the page is hidden or the canvas leaves the viewport.
- Load a small structural model first; stream optional high-detail assets after the first checkpoint is usable.
- Precompute camera paths and reuse geometry/materials. Instance repeated organelles, particles, atoms, or cells.
- Respect reduced motion by cutting between stable camera poses instead of flying between them.
- Never bind ordinary page scrolling to orbit or zoom. Enter an explicit “explore” mode before capturing gestures.

## Acceptance checks

1. The regular domain subpath works without Three.js installed.
2. The scene remains meaningful with WebGL unavailable and with reduced motion enabled.
3. Idle scenes stop drawing frames.
4. Mobile scrolling is not captured unless direct manipulation has begun.
5. The scene description states the same evidence that sighted learners can inspect.
6. Repeated atoms, particles, or lattice points are batched or instanced before draw calls become material.
