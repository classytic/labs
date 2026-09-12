# Modern physics experiment redesign

## Decision

The current muon, nuclear-binding, fission, and X-ray activities are reactive
diagrams. They are not release-ready as flagship labs. Do not polish their
existing posters. Replace them with experiments driven by one deterministic
scientific state.

These subjects remain code-native 2D. Their important dimensions are time,
probability, event identity, measurement, and conservation. WebGL would add
occlusion and download cost without adding explanatory power.

## Definition of a lab

A modern-physics activity qualifies as a lab only when it has all of these:

1. A learner makes a prediction before outcomes are revealed.
2. A learner directly changes apparatus or runs an experiment.
3. The scene changes causally over time or space—not merely its labels.
4. Evidence can be measured, captured, or compared.
5. Progression includes at least one interaction-derived success condition.
6. Reset reproduces the authored initial state exactly.
7. Keyboard, reduced-motion, mobile, and transcript paths teach the same idea.

## Shared architecture

```text
src/physics/modern/shared/
  experiment-transport.tsx  Play, pause, event step, reset, scrub
  scientific-stage.tsx      scene/plot composition and responsive view switch
  direct-handle.tsx         pointer + keyboard manipulation with ARIA output
  apparatus-flow.tsx        source, path, interaction, detector grammar
  particle-field.tsx        deterministic sampled particles and event states
  detector-strip.tsx        spatial detector bins and counts
  scientific-plot.tsx       scales, ticks, series, fixed domains, selected points
  trial-tray.tsx             capture, pin, compare, clear
  comparison-meter.tsx      compact A/B and target-band evidence
```

Rules:

- Physics cores are pure functions. Rendering never owns a second copy of state.
- Animation stores only normalized time. Every position and reading is derived.
- Random-looking events use an authored seed and remain reproducible.
- Timeline labs use one transport. Guided Back/Continue never duplicates it.
- Controls and direct handles are synchronized views of the same parameter.
- Plot domains remain fixed while comparing trials.
- SVG contains at most three persistent labels; detailed values live beside it.
- Apparatus uses neutral token colors and 1–1.5 px structural strokes.
- Amber means photons, radiation, or released energy.
- Blue means current/manipulated state. Violet means captured/absorbed.
- Green appears only after a target or conclusion is verified.
- Pure black is reserved for readable text, never large apparatus or decoration.

## Experiment designs

### Muon survival

Run the same deterministic cohort through two synchronized lanes: a
no-dilation prediction and the relativistic proper-time model. Muons descend as
time advances; individual decay rings occur at computed altitudes; a compact
detector counts arrivals. Earth and muon clock rings advance from the same
timeline. Speed and altitude are parameters, not the experiment itself.

Required actions: predict, run/step/scrub, compare detector counts, change one
parameter, rerun. Completion requires a completed comparison trial.

### Relativity of simultaneity and light clock

Use a shared event ledger. The apparatus and spacetime views highlight the same
emission/reflection/flash event. Desktop uses a 60/40 linked view; mobile uses an
Experiment/Spacetime switch. Reversing velocity resets and replays the same
event IDs in the opposite frame ordering.

### Binding energy

Replace the decorative curve with a real binding-energy-per-nucleon dataset and
proper scales. A selected and comparison nuclide drive an aligned mass-energy
balance showing constituent atomic mass, bound atomic mass, mass defect, and
energy. Mark the iron/nickel stability region accurately. A reaction comparison
shows whether total binding increases and computes the released energy.

### Fission chain

The core returns a conservation ledger for every generation:

```text
source neutrons
  -> fuel interactions -> fissions -> emitted neutrons
  -> control capture
  -> leakage
  -> next generation
```

The scene combines a compact reactor lattice/generation tree with a fixed-scale
trend and selected-generation ledger. A semantic control rod moves into the
reactor, never across the graph. Learners restore `0.98 <= k <= 1.02`, then
recover after an authored disturbance.

### X-ray attenuation

Use one bench: source, draggable specimen cross-section, and aligned detector.
Photon bundles terminate in tissue/bone according to Beer-Lambert attenuation;
detector bins update spatially. Exposure/Radiograph explicitly performs display
inversion. Learners capture A/B trials and connect path composition to contrast.

### X-ray spectrum

Link a compact tube bench to a correctly scaled energy plot. Voltage moves the
endpoint on a fixed energy axis. A draggable aluminium filter removes low-energy
area; characteristic lines appear only above threshold. Learners pin before and
after spectra and target greater mean energy while retaining authored output.

## Delivery order

1. Correct fission accounting and add conservation tests.
2. Build shared transport, stage, direct handle, plot, and trial primitives.
3. Rebuild muon survival as the reference timeline experiment.
4. Rebuild fission around the corrected generation ledger.
5. Rebuild binding energy around real data and comparison.
6. Rebuild X-ray attenuation and spectrum around apparatus and captured trials.
7. Migrate simultaneity/light-clock to the same transport and linked-view system.
8. Delete superseded poster renderers and obsolete CSS after all imports migrate.

## Release gates

- Play advances and pauses at authored terminal events.
- Step lands exactly on named events; reset is deterministic.
- Pointer and keyboard manipulation produce identical state.
- Captured trials preserve their scales and parameter snapshots.
- Fission ledgers conserve every channel and control response is monotonic.
- Relativity preserves event identity and invariant quantities across frames.
- X-ray detector output follows the same attenuation state as its displayed image.
- 320 px, 200% zoom, reduced motion, and transcript paths remain complete.
- Tests assert experiment behavior, not only the presence of sliders or text.

