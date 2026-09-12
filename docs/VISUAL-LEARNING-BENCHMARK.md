# Visual learning benchmark

This benchmark compares the reusable Labs runtime with two local reference products:

- `E:/repos/human-atlas`
- `E:/repos/cell-architecture-studio`

It is a product and architecture benchmark, not a request to reproduce either interface.

## What the references get right

### Human Atlas

Human Atlas makes the model the product. A nearly full-viewport scene remains visually dominant while search, layer visibility, selection details, and explode controls float at its edges. Controls appear where their effect is visible. The active structure—not generic application chrome—owns colour and emphasis.

The result is easy to scan because it has a strict hierarchy:

1. spatial model;
2. selected object and direct manipulation;
3. contextual detail;
4. secondary tools.

It also uses compact shadcn controls, sheets, switches, sliders, and icon actions instead of rendering every capability as a permanent card.

### Cell Architecture Studio

Cell Architecture Studio offers a stronger sense of exploration than a conventional lesson page. Its best ideas are the persistent specimen context, selectable organelles, focus/cross-section modes, camera manipulation, comparison, and an obvious relationship between the selected object and the detail panel.

Its implementation is not a package blueprint. The app currently has a 1,000-line scene component, a 3,722-line global stylesheet, many hand-built controls, and two individual GLB assets larger than 56 MB. It demonstrates useful experience patterns, but also the coupling and payload Labs must avoid.

## Why Labs currently feels poorer

The primary deficit is composition, not shadcn availability and not the absence of 3D.

- The runtime gives header, status, task, canvas, inspector, evidence, observation, support, transcript, and transport similar visual weight.
- Evidence and explanations are often visible before the learner asks for them, shrinking the model and revealing the lesson's answer.
- Generic bordered rows describe framework structure instead of the subject's causal structure.
- Controls are grouped by implementation slot rather than placed near the object or consequence they change.
- Many scenes are illustrations inside a document. Strong references behave like instruments: select, manipulate, isolate, compare, and measure.
- Domain scenes do not yet share enough art-direction infrastructure for lighting, camera framing, annotation, selection, scale, and responsive density.

Replacing these rows with prettier cards would preserve the problem. The shell must reveal less and let the model do more.

## How Labs can get ahead

Labs should not compete on raw polygon count. It can lead by combining visual quality with a portable teaching contract that the reference apps do not provide.

### 1. One canonical scene-first shell

Keep one runtime and its existing semantic slots, but change their default composition:

- the scene receives the dominant area;
- the task becomes one concise mission overlay or band;
- persistent controls form a compact contextual dock;
- evidence opens in a contextual inspector only after interaction;
- observation becomes a quiet caption tied to changed state;
- transcript, hints, derivation, and extended explanation share one support disclosure;
- sequence transport remains thumb-reachable and never competes with model controls.

This is one shell with responsive arrangements, not versioned shells.

### 2. A small spatial scene system

Build reusable scene infrastructure only where three real labs need it:

- `SceneViewport`: sizing, loading, error state, reduced motion, focus, and renderer boundary;
- `SceneCamera`: authored framing presets and safe reset, not raw camera coordinates in lesson content;
- `SceneSelection`: hover/focus/selection state with an accessible DOM mirror;
- `SceneAnnotation`: occlusion-aware labels, leader lines, density limits, and mobile prioritisation;
- `SceneLayers`: isolate, reveal, compare, and opacity controls;
- `SceneMeasure`: distance, angle, scale, and unit readouts;
- `SceneQuality`: adaptive DPR and quality budgets.

SVG, Canvas, and WebGL should implement the same conceptual contract where useful. Renderer parity does not mean forcing every scene into 3D.

### 3. Teaching interactions, not dashboard widgets

Every flagship activity should centre on one difficult mental operation:

- isolate a structure;
- transform a model and preserve an invariant;
- compare two states;
- assemble a system;
- predict, run, and diagnose a failure;
- measure a quantity that is otherwise invisible.

The default experience arc is `orient -> predict -> manipulate -> observe -> explain -> transfer`. Authors may omit phases that add no learning value. Answers and explanatory evidence remain hidden until the relevant commitment or action.

### 4. Domain art direction as data

The shell owns no decorative blue/green visual language. Each domain may provide a restrained palette and scene vocabulary through semantic data:

- biology: membrane, nucleus, chromosome, spindle, selected structure;
- chemistry: atom, bond, orbital, phase, reaction progress;
- physics: body, field, vector, wave, reference frame;
- electronics: conductor, carrier, junction, potential, current path;
- mathematics: object, construction, invariant, target, error.

Colour is backed by geometry, label, pattern, or narration. Authors choose meaningful emphasis and checkpoints, not CSS classes or repair coordinates.

### 5. Progressive fidelity and honest loading

Use the least expensive renderer that makes the concept clearer:

- DOM/SVG for discrete, symbolic, graph, and geometry relationships;
- Canvas for dense particles and high-frequency plots;
- WebGL for depth, occlusion, spatial assembly, fields, molecular geometry, anatomy, and camera-dependent phenomena.

WebGL labs dynamically load their renderer and assets. Production assets need compression, explicit budgets, loading progress, a usable unsupported state, and a DOM learning path. A fallback is not a second decorative simulation.

## Canonical viewport composition

Desktop and focus mode:

```text
┌ mission / compact live state ─────────────────────────┐
│                                                       │
│                  dominant scene                       │
│                                       contextual      │
│                                       inspector       │
│                                                       │
│       scene tools / selection       control dock      │
├ observation caption / support disclosure ─────────────┤
└ back             progress                  continue ───┘
```

Compact viewports keep the scene first, move the inspector to a sheet/disclosure, and keep sequence transport at the safe-area edge. The scene must reserve room for the dock so controls never cover its important content.

## Release scorecard

A showcase activity must demonstrate all of the following:

| Dimension | Required evidence |
| --- | --- |
| Visual thesis | One relationship is obvious without reading a paragraph |
| Directness | Learner manipulates the relevant object or variable |
| Causality | The consequence is visible in the same frame or an intentionally linked view |
| Disclosure | Answers and extended evidence appear only when pedagogically appropriate |
| Responsiveness | 320 px, short landscape, desktop, focus, and 200% zoom remain usable |
| Accessibility | Keyboard/touch completion, narration, contrast, reduced motion, and renderer-independent meaning |
| Authorability | A second meaningful lesson instance requires data/configuration, not runtime edits |
| Performance | Domain and renderer remain lazy; asset and frame budgets are documented and measured |

## Execution order

1. Recompose `AuthoredActivityRuntime` around scene, dock, contextual inspector, and support disclosure without adding a parallel runtime.
2. Prove it on four unlike activities: semiconductor junction, cell division, relativity reference frame, and one 2D mathematics manipulation.
3. Extract only the spatial primitives shared by those proofs.
4. Establish one authored asset/annotation schema and adaptive rendering budget for `/three` labs.
5. Migrate the visible showcase cohort, delete superseded layout CSS, and only then broaden the catalog.

The winning claim is not “more 3D.” It is: difficult ideas become manipulable, measurable, explainable experiences that authors can ship without rebuilding an application.
