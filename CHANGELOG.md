# @classytic/labs

## 0.3.0

### Minor changes

- **Authorable activity contracts** for goals, staged gates, misconception feedback, datasets and transfer cases, with misconception-safe challenge feedback.
- **Commerce runtime.** Canonical Commerce compositions, direct-manipulation finance charts, and consequential experiences across EOQ, ratios, apportionment, break-even, depreciation, limited liability and linked financial statements. Finance, Accounting and Economics now converge on the shared Commerce runtime, while the authored compound-interest, reorder-point and business-simulation scripts are preserved.
- **One shell.** The legacy `LabFrame` shell converges on the shared Activity runtime.
- **Independently importable CSS layers** (core and per-subject) alongside the aggregate stylesheet, so a page loads only the sheets its labs need.
- **Design system v2.** One typographic scale, a 2px spacing grid, motion durations chosen by cause, a single focus ring and a single reduced-motion policy, all as `--lab-*` tokens; documented in `docs/DESIGN-SYSTEM.md`, exported as W3C design tokens in `design-tokens.json`, and enforced by the `css-scale` and `css-system` tests.
- **Label placement.** Figures declare keep-clear zones (`PlaneAxes`, `kit/ticks`, cycle pill placement), so axis numbers and process labels are placed rather than drawn blind. Every gallery scene is now free of label collisions and of phone-width overflow, both gated by `npm run collisions:check` and `overflow-check`.

### Patch changes

- Emit every declared math engine and explorer subpath.
- Validate exports, SSR imports, published files and CSS budgets before publishing.
- Standardize ML evidence, prediction semantics and activity transport composition.
- Remove unreachable legacy barrels and an unregistered lab implementation.
- Correct peer-installation and release documentation.

## 0.2.0

### Minor changes

- New circuit, math and physics labs, plus the kit components behind them. Requires `@classytic/stage` >= 0.2.0.

## 0.1.0

### Initial release

- Rename the interactive visualization package to `@classytic/labs`, add the stage-backed lab template catalog, migrate the core math/physics/circuit families toward `@classytic/stage`, and keep domain subpaths for math, physics, chemistry, circuits, geometry, catalog, and blocks.
- Mechanics & gravitation lab pack + the space glyph kit.

  - **Mechanics** (`@classytic/labs/physics`): ImpulseLab (J = F·Δt = Δp — equal-area force pulse, catch the egg), BulletWallsLab (predict-first penetration, v² = u² − 2as), CircularMotionLab (centripetal F = mv²/r, cut the string → tangent fly-off), EnergySkateLab (KE ⇄ PE ⇄ heat bars summing to a constant), SimpleHarmonicLab (spring & pendulum on one a = −ω²x kernel; x(t) traces a sine — the bridge to the waves labs), AtwoodLab (a = (m₁−m₂)g/(m₁+m₂)), TerminalVelocityLab (quadratic drag, exact v(t) = v_t·tanh(gt/v_t), parachute).
  - **Gravitation path**: KeplerLab (true ellipse, equal-area-in-equal-time wedges via Kepler's equation, T² ∝ a³) and GravitationLab (inverse-square F = GMm/r², drag the satellite, live F–r curve) — complementing the qualitative OrbitLab with the actual laws.
  - **New `kit/space`** glyphs: `EarthGlyph`, `SunGlyph`, `SatelliteGlyph` (Kurzgesagt-style, drawn in the stage pixel frame, SSR-stable).
  - Every lab is an authorable `defineBlock` in `@classytic/labs/blocks/physics`; all covered by the SVG gallery snapshot harness.

- Big lab-pack expansion + authorability for v1.

  - **Discrete math & probability** (`@classytic/labs/discrete`): truth tables, counting tree, Venn / inclusion–exclusion, sample space, Boolean circuits, Karnaugh map, Monte Carlo, Monty Hall, sample-space builder, Bayes, counting-by-slots, selection (cards/balls), arrangements (multiset), Pascal's triangle, binomial & hypergeometric distributions, expected value, law of large numbers — on the stage logic + combinatorics kernels.
  - **Statistics & sequences** (`@classytic/labs/statistics`): centre & spread, sequences/series, Galton board (CLT), histogram & box plot, normal curve + z-scores, z-table, sampling distribution & confidence intervals.
  - **ML / data analytics** (`@classytic/labs/ml`): regression + gradient descent, k-means, classification threshold, decision boundary (perceptron), k-NN.
  - **Physics waves + EM**: WaveLab (travelling / superposition / standing), ripple tank, Doppler, string reflection/resonance, magnetism, Lorentz force — on a shared wave/field kernel, with optional Web Audio.
  - **Authorable as CMS blocks**: every new lab is a `defineBlock` spec with a Zod schema; new `@classytic/labs/blocks/discrete` and `@classytic/labs/blocks/statistics` subpaths; waves/magnetism/Lorentz added to `@classytic/labs/blocks/physics`.
  - Shared kits: `kit/frame` (LabFrame layout), `kit/play` (play-gate), `kit/annotate` (on-figure Pointer/Bracket/Spotlight), `kit/probability` + `kit/gameshow` glyphs. New `verify` script (typecheck + build + test + gallery).
