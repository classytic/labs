# Labs convergence plan

This plan moves the catalog from a large collection of functional interactions to a verified community runtime. The order is deliberate: stabilize shared foundations, prove them across unlike domains, then migrate cohorts. Do not perform a blind mechanical rewrite of 199 labs.

## Audit baseline — 2026-08-21

- Packaging and lazy loading are sound: unbundled ESM, a lightweight root, literal per-lab runtime imports, and separated learner/editor surfaces.
- Catalog structure has not fully converged: approximately 140 tiny canonical runtimes still proxy implementations in older domain trees. This is mainly contributor/navigation debt, not duplicated shipped JavaScript.
- Historical baseline: two shell generations existed at the start of the audit. Runtime convergence is now complete and `Activity` is the sole shell contract.
- The portable authored runtime is used by three reference labs; `ChallengeCard` remains in roughly 65 files and `useCheckpoint` in roughly 137 files.
- CSS delivery is split, but the three layers total 214,455 source bytes. `core.css` still includes some domain-specific styling, and `domains.css` remains a broad shared payload.
- Manifest reporting finds 78/199 contract-ready. Cross-domain cohorts plus tested statistics, discrete-probability, machine-learning, biology, geography, complete language, the connected accounting workflow, and operational inventory/cost decisions now provide chemistry, electronics, algorithms, commerce, probability, statistics, ML, biology, systems-cycle, multilingual listening, reading, vocabulary, focused grammar, equation balance, journal posting, account sorting, linked statements, EOQ, reorder policy, and proportional allocation references alongside the original networking and physics flagships; each promotion is paired with runtime behavior rather than metadata alone.
- Review scores from the audit: platform primitives 74/100, the three flagship experiences 82/100, and catalog convergence/readiness 49/100. These are prioritization signals, not marketing claims.

## Operating rules

1. Keep one canonical primitive for each responsibility. Compatibility surfaces remain only while a known consumer needs them and must have an exit issue.
2. Extract only after the same semantic pattern appears in at least three labs. Do not create wrappers for cosmetic similarity.
3. Fix the package first. Copying `dist` to Brihot is an integration check, not the source of truth.
4. Preserve domain meaning. Standardize shell behavior and authoring contracts, not the scientific scene itself.
5. Migrate in small cohorts with tests and screenshots supplied by the reviewer. Never mark readiness by metadata alone.

Public-surface ownership and deletion rules are maintained in `COMPATIBILITY.md`;
the obsolete lab shell itself has been removed.

Optional spatial rendering follows `THREE-ROADMAP.md`. It keeps one measured,
tree-shakeable `/three` boundary while domain packages retain their models and
authoring contracts; no empty 3D modules are added ahead of working lessons.

## Phase 0 — establish truth (now)

- [x] Canonical generated manifest, render, catalog, and domain-block maps.
- [x] Runtime-only domain loading and separated circuit/logic editor entries.
- [x] Split CSS into core, domains, and commerce layers.
- [x] Public authoring subpath and authored response/runtime contracts.
- [x] Manifest-level quality report and starter-lab release gate.
- [x] Three reference experiences across networking and physics.
- [ ] Add the five-gate rubric from `LABS-TARGET.md` to contribution and review templates.
- [ ] Record explicit owners for every compatibility surface and its removal condition.

Exit: contributors can distinguish registered, contract-ready, visually reviewed, and learner-validated without conflating them.

## Phase 1 — harden the shared experience system

### 1.1 Runtime anatomy

- Audit `Activity` slots for optional rendering, nesting, mobile order, sticky transport, focus mode, and long-content behavior.
- Consolidate repeated feedback/evidence/metric markup into the smallest semantic primitives.
- Define one action hierarchy: one primary action, secondary actions, reset, and step/progress semantics.
- Ensure status, evidence, and feedback have distinct roles and do not repeat the same value.
- Make compact transport thumb-reachable and safe-area aware; add short-viewport behavior so a primary action never requires page-scroll reversal.
- Replace physics-specific scene framing with one neutral scene surface; domain styles paint models, not shell chrome.

### 1.2 Authoring

- [x] Extend `lab:create` to generate a compiled authored activity with a measurable gate, shared controls, useful interaction/accessibility tests, and an MDX authoring example without falsely declaring an unverified experience contract.
- Add schema guidance for meaningful variables, feedback, checkpoints, transfer tasks, and sensible defaults.
- Provide three recipes: explorer, guided investigation, and challenge. Recipes compose the same primitives and do not become parallel runtimes.
- Add explicit experience archetypes—full guided, investigation, builder, practice/deck, and assessment—with appropriate minimum phases instead of forcing identical visible panels.
- Prevent activity/manifest drift by deriving the experience summary or validating it against the authored activity.
- Reject unreachable success gates, empty reflections, missing action handlers, and missing media/text fallbacks before preview.

### 1.3 Visual and responsive foundations

- Establish shared scene typography, collision-safe annotation, plot margins, responsive inspector behavior, touch targets, and control density.
- Test 320 px, 768 px, desktop, focus mode, 200% zoom, reduced motion, and long translated strings.
- Use semantic host tokens for UI chrome. Keep quantitative/domain colors in scene palettes with contrast checks.
- Add automated checks for avoidable inline UI styles, raw interactive elements outside approved primitives, and eager cross-domain imports.
- Set a learning-interface typography floor of 0.875rem; allow smaller scene labels only when nonessential and backed by an accessible full label.
- Add a long-locale fixture and collision-aware annotation strategy for plots and diagrams.

Exit: three deliberately different labs can use the same shell without looking cloned or breaking on mobile.

### Review rubric

Score candidates out of 100: learning arc 20, content/model validity 15, assessment and feedback 15, accessibility 15, authorability 15, interaction/visual clarity 10, and runtime/host integrity 10. `showcase-ready` requires at least 80 overall, at least 60% in every category, and no critical accessibility or content-validity failure.

## Phase 2 — prove the system with representative cohorts

Migrate representative labs before broad cleanup. Each cohort includes a simple explorer, a guided activity, and a data-rich or animated lab.

### Cohort A: high-visibility visual defects

- Thermal physics: Heat Transfer, Efficiency, Temperature Scales, Refraction/Optics follow-up.
- Fix label collisions, oversized scene text, empty space, nested borders, and evidence duplication.
- Make scene parameters and checkpoint content authorable.

### Cohort B: algorithms and machine learning

- Dijkstra/graph, K-means, KNN, and Perceptron Boundary.
- Separate model validation metrics from the current query result.
- Provide visible state transitions, event transcript, dataset/model controls, and prediction/transfer checkpoints.

### Cohort C: language learning

- Dictation, sentence builder, word match, and error correction.
- Standardize fields, validation, audio state, replay, reveal, attempts, and next-step transport.
- Preserve task-specific interaction; do not reduce every language activity to a toggle or generic quiz.

### Cohort D: commerce and foundational math

- Break-even/finance, balance algebra, proportional linked views, and one calculus engine lab.
- Replace decorative cards with meaningful linked representations and authorable scenarios.
- Ensure equations, graphs, tables, and scene objects share one source of model state.

Exit per cohort: all selected labs pass the five gates, authors can produce two materially different instances, and no cohort adds a parallel shell.

## Phase 3 — catalog migration and deletion

- Rank remaining labs by usage, curriculum value, uniqueness of interaction, and defect severity.
- For each cohort: inventory → map to canonical primitives → migrate → test → review → declare experience → delete superseded code.
- Remove dead aliases and primitives only after repository-wide import search, public-export review, and migration note.
- Quarantine labs that are merely static illustrations until they gain a meaningful interaction; do not inflate catalog readiness.
- Track readiness by domain and gate, not only an aggregate percentage.

Exit: every published showcase lab is verified; remaining experimental labs are clearly labelled and do not weaken the public promise.

### Completed convergence cohorts

- **First pedagogical flagship cohort:** Periodic Trends and Demand Shift now declare their existing five-phase authored investigations; Transistor gained linked-view observation plus a load-change transfer task; Graph Algorithm gained a concise end-of-trace transfer challenge. Chemistry, electronics, algorithms, and commerce now each have one contract-ready reference without imposing a cloned scene.
- **Second pedagogical flagship cohort:** Stoichiometry and Break-even now declare their existing tested investigations; RC Charging gained linked-view observation plus a time-constant redesign task; Grid Path DP now pauses for a recurrence prediction and ends by adapting the recurrence to diagonal movement.
- **Third pedagogical flagship cohort:** Titration and Compound Interest now declare their existing tested investigations; Diode gained linked-view observation plus a forward-current transfer task; Tree Quest now ends by transferring BST ordering, AVL repair, and balance-complexity reasoning to a changed tree.
- **Fourth pedagogical flagship cohort:** Market Equilibrium now declares its tested market-clearing investigation; Kinetics gained reactive-tail observation plus a heat-versus-catalyst transfer; Hall Effect now transfers Hall polarity into carrier identification; Heap Quest gained shared event feedback and a partial-order transfer check.
- **Statistics accessibility promotion:** Normal Distribution's existing area/z-score investigation now has keyboard-operable interval handles, bounded value semantics, and a live textual reading; its prediction and unfamiliar-interval transfer checks now earn the experience contract.
- **Statistics inference promotion:** Sampling Distribution now uses the canonical shared runtime transport and exposes deterministic single-sample stepping, so reduced-motion learners can build confidence-interval coverage and sampling distributions without animation.
- **Statistics simulation promotion:** Galton Board now settles manual drops deterministically under reduced motion, uses the shared activity transport, and keeps only experiment parameters in its control bar.
- **Statistics lookup promotion:** Z-table now exposes labeled distribution parameters, a positive standard-deviation contract, a single-tab-stop arrow-key grid, and live probability feedback.
- **Statistics descriptive promotion:** Centre & Spread now exposes its data points as keyboard-adjustable sliders, announces recalculated statistics, and distinguishes commands from selectable options.
- **Statistics display promotion:** Histogram & Box Plot now offers an explicit keyboard/mobile value-entry path, selected preset semantics, command controls, and live summary feedback while retaining direct plot clicks as a shortcut.
- **Statistics series promotion:** Sequences & Series now announces term, partial-sum, and convergence results as shared sliders change, with bounded author inputs and a tested predict-to-transfer contract.
- **Discrete distribution promotion:** Binomial now handles tied modes correctly and announces inspected probabilities; Hypergeometric announces its finite-population variance comparison; Expected Value adds a predict-before-simulate fairness task and uses action semantics for simulation commands.
- **Conditional probability and simulation promotion:** Bayes removes render-time state updates and announces its natural-frequency walkthrough; Law of Large Numbers now has an explicit play/reset transport instead of a static scene and earns completion only after learner action plus prediction and transfer; Monty Hall separates a committed strategy prediction from at least 100 simulated comparisons.
- **Monte Carlo engine promotion:** the runtime now defaults to a complete π-darts investigation, mirrors canvas estimates, targets, errors, and trial counts into translatable DOM, exposes run/reset/single-trial transport including reduced-motion batching, validates all four authored experiment families, and keeps its prediction feedback separate from empirical evidence.
- **Language shell dependency:** removed no-op `ControlBar` and legacy frame imports; canonical item progress and live narration now belong to `Activity`.
- **Bayes runtime convergence:** the base-rate investigation now uses canonical `Activity`, `LearningSequenceNav`, responsive inspector, feedback, and simulation transport; no built-in lab consumes the deprecated `Guide` / `Steps` compatibility layer.
- **Biology shell convergence, photosynthesis:** Limiting Factors now uses scene-first `Activity` anatomy with a responsive evidence/control inspector, explicit comparison transport, concise causal feedback, focus mode, and live narration while preserving its compare-before-explain checkpoint.
- **Biology shell convergence, respiration:** the day/night comparison now uses canonical `Activity` anatomy, shared transport and authored task placement, visible net-exchange feedback, focus mode, and live narration; completion requires learners to inspect both conditions and solve both predictions.
- **Biology shell convergence, enzymes and molecular genetics:** Enzyme Rate, Sequence, and Central Dogma now share canonical scene/inspector/feedback/task/transport anatomy; the irreversible-denaturation investigation and construct-before-explain DNA → mRNA → protein flow remain domain-specific and author-configurable.
- **Biology shell convergence, inheritance:** the single shared genetic-cross renderer now gives Punnett, monohybrid, dihybrid, blood-type, and sex-linked experiences canonical scene/inspector/feedback/task/transport anatomy while retaining predict-before-reveal and author-defined inheritance models.
- **Geography shell convergence:** the authorable water, rock, carbon, and custom directed-cycle runtime now shares canonical scene/inspector/feedback/task/transport anatomy in both trace and process-matching modes, without changing the reusable graph model.
- **Probability simulation shell convergence:** Law of Large Numbers now presents its reusable Stage sampler through canonical scene/inspector/feedback/task/transport anatomy while retaining deterministic runs, coin/die authoring, speed controls, and predict-before-test evidence.
- **Probability simulation family convergence:** Monty Hall and Monte Carlo now join LLN on canonical scene/inspector/feedback/task/transport anatomy; the playable informed-reveal game, seeded generic simulation engine, reduced-motion stepping, author-defined series, and evidence thresholds remain intact.
- **Discrete distribution family convergence:** Binomial, Hypergeometric, and Expected Value now share canonical scene/inspector/feedback/task/transport anatomy while preserving interrogable distributions, finite-population comparison, probability-weighted balance, deterministic trials, and author parameters.
- **Cartesian-product counting convergence:** Sample Space, Outcome Builder, and Combination Studio now share canonical scene/inspector/feedback/task/transport anatomy while preserving event selection, staged product construction, discovery walls, predict-first checks, and author-defined experiments.
- **Permutation and selection convergence:** Counting Tree, Counting Slots, Arrangements, and Selection now share canonical scene/inspector/feedback/task/transport anatomy while preserving path tracing, shrinking-choice products, order-collapse evidence, indistinguishable-copy correction, grouped draws, and author-defined counting models.
- **Set and combinatorial-structure convergence:** Venn and Pascal Triangle now share canonical scene/inspector/feedback/task/transport anatomy while preserving compiled set expressions, inclusion–exclusion evidence, keyboard cell inspection, recurrence links, binomial views, parity structure, and author configuration.
- **Discrete Boolean-logic convergence:** Truth Table and Karnaugh Map now share canonical scene/inspector/feedback/task/transport anatomy, including invalid-authoring states, while preserving live evaluation, prediction-gated grading, equivalence comparison, Gray-code grouping, minimal-cover evidence, and author-defined formulas.
- **Normal-distribution lookup convergence:** Normal Distribution and Z-table now share canonical scene/inspector/feedback/task/transport anatomy while preserving keyboard interval handles, parameter authoring, synchronized area and z-score evidence, one-tab-stop table navigation, tail symmetry, and prediction tasks.
- **Descriptive-statistics convergence:** Centre & Spread and Histogram & Box Plot now share canonical scene/inspector/feedback/task/transport anatomy while preserving keyboard-adjustable data, mobile value entry, aligned linked views, preset comparison, live summaries, outlier evidence, and author-defined datasets.
- **Statistical simulation and series convergence:** Sampling Distribution, Galton Board, and Sequences & Series now share canonical scene/inspector/feedback/task/transport anatomy while preserving deterministic manual stepping, reduced-motion behavior, continuous seeded runs, confidence-interval coverage, linked term/sum views, convergence evidence, and author parameters.
- **Isolated runtime convergence:** Projectile Lab now keeps its authored investigation runtime without a nested legacy control bar, and declarative Geometry Board uses a minimal canonical Activity wrapper while retaining portable Stage scene documents and direct manipulation.
- **Logic learning-surface convergence:** Logic Gate and Binary Display now use canonical Activity anatomy without nested legacy controls or callouts while preserving authorable circuit documents, live truth tables, signal stepping, output prediction, bit-place interaction, and checkpoint reporting.
- **Electronics evidence convergence:** All authored circuit, CMOS, brownout, and semiconductor flagships now render status, measurements, truth tables, and explanations directly in the canonical evidence region; redundant legacy callout cards are gone without adding CSS or changing the electrical models and authoring contracts.
- **Commerce evidence convergence:** Statement sorting, business decisions, compound growth, and supply-chain simulations now keep status, model evidence, feedback, and explanations directly inside their canonical authored evidence regions. Nested legacy callout cards are gone while accounting identities, finance engines, operational scenarios, authoring contracts, and guided sequences remain unchanged.
- **Domain runtime convergence complete:** Photosynthesis factors, reaction motion, Bayes evidence, and ML regression removed the final domain-level legacy callouts. The obsolete shell implementations and exports were subsequently deleted before community release; `Activity` is the only runtime shell.
- **Elementary math manipulative convergence:** Fraction Bar, Percent Bar, Ratio Share, Area Model, and Receipt now share canonical scene/inspector/feedback/task/transport anatomy while preserving linked concrete representations, draggable keyboard-operable boundaries, equivalent forms, author-defined quantities, factor/expand modes, and slot-filled receipt reasoning.
- **Algebra and linear-model convergence:** Balance Algebra, Mystery Bucket, Linear System, System Solve, Function Machine, Rate Machine, Linear Model, and Straight Line now share canonical scene/inspector/feedback/task/transport anatomy while preserving portable Stage documents, direct manipulation, linked concrete representations, elimination guidance, configurable scenes, authored questions, and checkpoint reporting.
- **Math runtime convergence complete:** Coordinate geometry, function exploration, sequences, reasoning, trigonometry, and the complex plane now join the elementary and algebra cohorts on canonical Activity anatomy. Math has no remaining legacy `LabFrame`, `ControlBar`, or `Callout` consumer; public authoring props, questions, checkpoints, animation, direct manipulation, ω/root-of-unity views, and tree-shakeable subpaths remain intact.
- **ICT number systems:** Place Value Dial, Bit Grouper, and Base Odometer now compose `Activity` directly without cross-domain shell classes.
- **ML source layout:** five runtime implementations and their shared activity live beside canonical manifests; ten old proxy/implementation files were deleted while `@classytic/labs/ml` remained stable.
- **ML learning-experience promotion:** all five ML activities now pair model manipulation with bounded authoring schemas and tested transfer evidence: threshold classification separates precision from recall, regression links residual squares to MSE, k-means distinguishes convergence from global optimality, k-NN separates query votes from validation, and the perceptron exposes XOR's linear limitation.
- **Networking UI layout:** Packet Journey now lives beside its canonical manifest; reusable network contracts, algorithms, presets, and scene primitives remain in the domain engine folder, and `@classytic/labs/networking` remains stable.
- **Learner rendering:** the misleading `./blocks/manifests` alias was replaced atomically by the schema-free `./blocks/render` entry in Labs and Brihot.

Architecture tests ratchet these cohorts so legacy structure cannot be reintroduced silently.

## Phase 4 — ecosystem release confidence

- Pack and install the tarball in a clean React 19/Next/Turbopack host.
- Verify lightweight engine imports, one domain import, lazy authoring, and optional heavy rendering separately.
- Test theme inheritance with two shadcn-compatible host themes without copying host components into Labs.
- Publish author documentation, recipes, migration notes, and a gallery that identifies interaction type and readiness evidence.
- Run educator/learner reviews on the reference cohort and feed observed confusion into primitives or lab content as appropriate.

Exit: a third-party author can install, build, theme, author, test, and ship a lab without reading internal source code.

## Immediate execution queue

1. Recompose `AuthoredActivityRuntime` as the single scene-first shell described in `VISUAL-LEARNING-BENCHMARK.md`; do not add runtime versions.
2. Prove the composition on semiconductor junction, cell division, relativity reference frame, and one 2D mathematics manipulation.
3. Extract only the spatial viewport, selection, annotation, layer, measurement, and quality behavior repeated by those proofs.
4. Add non-subjective quality dimensions to the report without pretending they are automatically verified: contract, interaction test, accessibility evidence, visual review, authoring example, domain validation.
5. Migrate the visible showcase cohort, delete superseded layout CSS, and then run the clean-tarball integration matrix. Publishing remains the maintainer's duty.

## Required checks for every pull request

```bash
npm run labs:check
npm run typecheck
npm run build
npm run labs:quality -- --details
npm run package:check
npm test
```

For a release candidate, run `npm run verify:release` plus the clean tarball and browser checks in `docs/release-checklist.md`.

## Progress measures

- Contract readiness by domain and interaction type.
- Percentage of showcase labs with keyboard, reduced-motion, mobile/zoom, authoring, and domain-review evidence.
- Number of public compatibility surfaces with active consumers and removal conditions.
- CSS source/gzip size per layer and per-lab runtime chunk regression.
- Time for a new author to create and ship a non-trivial lab.
- Learner task-completion rate and observed explanation/transfer success for reviewed cohorts.

The goal is evidence-backed quality, not reaching 199/199 as quickly as possible.
