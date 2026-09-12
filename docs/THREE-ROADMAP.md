# Optional 3D renderer roadmap

Three-dimensional rendering is a progressive enhancement for lessons where
depth, occlusion, spatial symmetry, or viewpoint is part of the concept. It is
not a second lab runtime and it is never imported by a normal domain barrel.

## Public subpath contract

Keep one optional public boundary:

```ts
import {
  MolecularGeometryThreeLab,
  AtomicOrbitalThreeLab,
} from '@classytic/labs/three/chemistry';
import { OrbitalMechanicsThreeLab } from '@classytic/labs/three/physics';
import '@classytic/labs/styles/three.css';
```

Public subpaths stop at the renderer domain (`/three/chemistry` and, when its
first lesson ships, `/three/physics`). Do not publish a subpath per scene: the
unbundled build already preserves file boundaries, so named imports remain
tree-shakeable without multiplying the package API.

The domain packages continue to own models and authorable activities:

```text
@classytic/labs/chem       orbital and molecular models + 2D/SVG activities
@classytic/labs/physics    fields and orbital-mechanics models + 2D activities
@classytic/labs/three      optional R3F renderers for those activities
@classytic/labs/styles/*   token-driven presentation only
@classytic/stage           renderer-neutral scene, viewport, and interaction APIs
```

Stage must not depend on Three.js or React Three Fiber. A domain activity
accepts a renderer/scene slot; the optional adapter fills that slot while
reusing the same authored state, evidence, questions, transcript, and
completion logic.

## Source layout

Add implementations only when their first usable lesson ships. Do not create
empty compatibility modules.

```text
src/three/
  index.ts                         convenience exports across shipped domains
  surface.tsx                     capability, visibility, DPR, recovery, fallback
  chemistry/
    index.ts                       chemistry public boundary
    molecular-geometry.tsx        reference adapter
    atomic-orbital.tsx            milestone 1 complete
  crystal-lattice.tsx             milestone 2
  vector-field.tsx                milestone 3
  orbital-mechanics.tsx           milestone 4
  internal/
    camera-rig.tsx                extract after two scenes need the same behavior
    spatial-annotation.tsx        DOM projection; never WebGL-only lesson text
    selectable-object.tsx         keyboard/pointer selection parity
    probability-surface.tsx       data shader, introduced with atomic orbitals
    vector-glyph-field.tsx        instanced arrows, introduced with field lab
```

Files in `internal/` are not package exports. A primitive becomes public only
after at least three independent labs use it and its accessibility contract is
stable. Domain equations and simulation state never move into `src/three`.

## Delivery order

### 1. Atomic orbitals and hybridisation — complete

- Reuse `chem/orbitals/core` and the existing authored orbital activity.
- Add a renderer slot to `AtomicOrbitalLab`, following molecular geometry.
- Render probability density, phase, radial nodes, and angular nodes.
- Begin with one buffered point cloud. Add an isosurface shader only when it makes the
  probability boundary easier to compare; it must be data-driven, not visual
  decoration.
- Keep the present projected SVG as the full fallback and static export.
- Provide authored camera presets such as `front`, `side`, `node-plane`, and
  `free`; do not auto-spin.

### 2. Crystal lattices and unit cells

- Domain model belongs in `chem/crystal-lattice`.
- Teach coordination, repetition, packing, and crystallographic planes.
- Use instancing for repeated atoms and bonds.
- Provide a reduced unit-cell SVG fallback and keyboard-accessible plane
  selection.

### 3. Electric, gravitational, and magnetic fields

- Shared field sampling belongs in `physics/fields`; the renderer receives
  sampled vectors/scalars and contains no field equations.
- Prefer 2D for introductory slices. Enable 3D for spatial divergence, curl,
  helical motion, or equipotential surfaces.
- Use instanced glyphs and bounded sampling. Never create one React component
  per arrow.

### 4. Orbital mechanics

- Reuse `physics/orbital/core` for every numerical result.
- Teach orbital plane, inclination, velocity direction, transfer burns, and
  conserved quantities—not decorative planets.
- Advance simulation with a fixed timestep and render interpolation; pause
  offscreen and under reduced motion.
- Preserve the existing 2D trajectory as fallback and comparison view.

Molecular interactions and macromolecular structures remain later candidates.
They should not start until selection, annotation, and large-scene performance
contracts have been proven by the first four milestones.

## Required renderer contract

Every optional scene must use `ThreeSceneSurface` and provide:

- a meaningful SVG/DOM fallback using the same state;
- an accessible name plus a concise state description or transcript;
- DOM controls, focus order, visible focus, and keyboard equivalents;
- pointer behavior that preserves page scrolling on touch devices;
- `frameloop="demand"` by default, with continuous frames only during an
  authored simulation or direct manipulation;
- near-viewport initialization, delayed offscreen context release, context-loss
  recovery, and a device-pixel-ratio ceiling;
- design-token colours with live host-theme updates;
- no essential meaning encoded only by colour, depth, motion, or hover;
- no bloom, post-processing, masks, particles, or shaders unless they encode
  lesson data that cannot be communicated as clearly by simpler rendering.

Physics-based easing may be used for a learner-triggered camera transition or
state change. It must settle, remain interruptible, and become immediate when
reduced motion is enabled. It is not a reason to animate an idle scene.

## Performance acceptance budgets

Measure production builds in a small host fixture before enabling a scene in a
gallery or lesson:

- normal root/domain entries contain no `three` or `@react-three/fiber` import;
- optional engine code is loaded only after the scene approaches the viewport;
- idle scenes schedule no continuous animation frame work;
- default DPR is at most `1.5` and geometry/material instances are reused;
- repeated geometry uses instancing and bounded sample counts;
- pointer interaction does not trigger React state on every frame;
- resize and theme observers are shared or scoped and cleaned up;
- context loss produces the fallback instead of a blank lesson;
- no long task above 50 ms in the representative interaction trace;
- mobile interaction remains usable at 320 CSS px and with coarse pointers.

Budgets are checked by architecture and behavior tests where deterministic;
bundle size, long tasks, and GPU behavior require the host fixture and release
checklist.

## Extraction rule

Do not create a universal scene factory. Extract the smallest behavior only
when two completed scenes demonstrate the same implementation, and make it a
public authoring primitive only after three domain-independent uses. This keeps
the API small while allowing the eventual reusable spatial kit to emerge from
real teaching activities.
