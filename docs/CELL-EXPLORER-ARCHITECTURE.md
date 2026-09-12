# Explore the cell: product and package architecture

## Decision

Build this as a 3D-first immersive client experience backed by Labs, not as a long lab card and not as parallel 2D/3D implementations.

## Learning journey

1. **Cell boundary:** approach the membrane, identify the phospholipid bilayer, then pass through a selected transport protein.
2. **Cytoplasm:** compare scale and density without representing organelles as an empty decorative room.
3. **Mitochondrion:** cross both membranes and trace the relationship between folds, gradients, and ATP production.
4. **Nucleus:** reveal chromatin organization, then transition into chromosome condensation.
5. **Cell division:** move through authored mitosis checkpoints while the same chromosome objects replicate, align, separate, and decondense.

Every checkpoint must ask for an observation or prediction that requires the current spatial view. Facts that do not need the scene belong in ordinary lesson content.

## Ownership

### `@classytic/labs/biology`

- Pure cell-scale, transport, chromosome, spindle, and division-state engines.
- Authored checkpoint and assessment schemas.
- Lightweight semantic summaries and state-derived evidence.

### `@classytic/labs/three/biology`

- Cell membrane, organelle, chromosome, spindle, and molecular scene objects.
- Camera targets and scene composition helpers.
- Instanced repeated structures and progressive model loaders.
- No routing, authentication, commerce, or product navigation.

### Host application

- Dedicated client route and dynamic import of `/three/biology`.
- Sticky full-viewport canvas, chapter DOM, progress, resume, analytics, and completion handoff.
- Asset CDN policy, preload decisions, error UI, and device-quality selection.

## Authoring contract

An experience is data, not a custom page per teacher:

```ts
interface SpatialCheckpoint {
  id: string;
  title: string;
  target: 'cell' | 'membrane' | 'mitochondrion' | 'nucleus' | 'spindle';
  camera: { position: [number, number, number]; lookAt: [number, number, number] };
  reveal: string[];
  prompt: string;
  evidence: string[];
  gate?: { question?: string; answer: string };
}
```

Authors select scientifically validated scene objects, set the sequence and prompts, replace narration, and configure questions. Arbitrary shaders, camera scripts, and mesh injection stay outside the public authoring surface.

## First vertical slice

Do not model the full cell first. Build one polished sequence:

`cell overview → nucleus → condensed chromosome → metaphase alignment → anaphase separation`

Acceptance requires a single persistent canvas, five keyboard-addressable checkpoints, reduced-motion camera cuts, mobile touch navigation, semantic state summaries, and no duplicated 2D simulation.
