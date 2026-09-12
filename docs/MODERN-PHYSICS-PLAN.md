# Modern physics lab plan

> The release-remediation contract is in
> [MODERN-PHYSICS-REDESIGN.md](./MODERN-PHYSICS-REDESIGN.md). Its interaction
> and scientific acceptance gates supersede poster-style implementations.

## Goal

Create focused, authorable lesson blocks that make frame dependence, quantum state, spectra, and statistical decay observable without turning Labs into a collection of ornamental 3D scenes. One scientific state must drive every linked representation.

## Architecture decisions

- Keep catalog domain `physics`; use group `Modern Physics`. Do not add another domain or package family.
- Public headless/2D entry: `@classytic/labs/physics/modern`.
- Optional WebGL remains in `@classytic/labs/three/physics`; initially only the Bloch sphere warrants it.
- SVG/Stage: light clocks, spacetime, energy levels, spectra. CanvasLayer: dense wave/decay histories. WebGL: genuinely spatial state models.
- Every block uses `AuthoredActivityRuntime`, semantic author fields, generated manifests, literal lazy runtime imports, transcript/reduced-motion support, and computed scientific claims.
- Add `styles/modern-physics.css`; do not grow the nearly-full domains stylesheet.

## Shared source structure

```text
src/physics/modern/
  constants.ts
  relativity/{core,light-clock,spacetime,activity,index}.ts(x)
  quantum/{complex,wave-core,wave-packet,bloch-core,bloch-sphere,activity,index}.ts(x)
  spectroscopy/{xray-core,data,xray-tube,activity,index}.ts(x)
  nuclear/{decay-core,decay-chain,binding-energy,activity,index}.ts(x)
```

## Delivery sequence

1. Light clock + linked spacetime evidence: proper time, coordinate time, gamma.
2. Simultaneity + length measurement: frame switch and simultaneity slice.
3. Twin journey: piecewise worldline and accumulated proper time; forward time travel only.
4. Quantum wave packet: phase, probability, interference, measurement, tunnelling.
5. Bloch sphere: gates, phase, measurement, mixed-state boundary.
6. X-ray tube + spectrum: cutoff, bremsstrahlung, characteristic lines, attenuation.
7. Nuclear decay statistics and binding energy.

## Flagship interaction contract

- One event ledger drives the light-clock scene, path geometry, spacetime diagram, clock comparison, transcript, and assessment.
- Predict before playback; Play/Step/Scrub is the only experiment transport. Guided sequence navigation must not duplicate it.
- Desktop: linked 60/40 scene. Mobile: `Experiment | Spacetime` switch with shared state, never two squeezed diagrams.
- Author fields describe scenario, beta bounds, proper tick, visible representations, terminology, prompts, and challenge—not pixels or coordinates.
- Green is reserved for verified outcomes. Photon/light cone uses amber; moving frame uses the host accent; axes use foreground.

## Scientific acceptance

- `gamma(0)=1`, `|beta|<1`, stable near configured maximum.
- Lorentz transform inverse roundtrip and interval invariance.
- Lightlike interval is zero; light-clock coordinate/proper-time ratio equals gamma.
- Twin elapsed time integrates over complete worldline legs.
- “Observed later” is never conflated with “occurred later”.
- Backward time travel, wormholes, and closed timelike curves are labelled speculative.

## Experience acceptance

- A learner can identify proper time and explain the diagonal photon path.
- Every representation updates atomically from one action.
- 320 px, keyboard, 200% zoom, long labels, reduced motion, and no-WebGL paths remain complete.
- Authors can build from presets without runtime JSX and cannot override computed physics.
- Validate with at least five learner and two physics-educator think-aloud sessions before freezing the author API.

## Sources

- OpenStax University Physics Volume 3, special relativity chapters.
- Einstein Online, “From light clocks to time dilation” and spacetime overview.
- PhET published simulation-design and engaged-exploration research.
- IBM Quantum Learning for Bloch-sphere scope and limitations.
- NIST Atomic Spectra Database for spectroscopy presets.
# Authorable pathway

`quantumFoundationsPathway` provides the recommended evidence-first sequence:

1. Photoelectric effect — photon energy and threshold evidence.
2. Double slit — localized events and probability interference.
3. Bloch sphere — amplitudes, phase, and measurement bases.
4. Quantum gates — reversible transformations as programs.

The pathway is metadata-only and can generate portable MDX through
`pathwayToMdx`. It deliberately references the lightweight SVG components;
hosts may substitute the optional `three/physics` Bloch renderers without
changing the learning model or authored activity.
