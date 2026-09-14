# Cambridge O Level curriculum lab map

This is the shared tracker between `D:/projects/brihot/apps/curriculum/cambridge/o-level`
and the published `@classytic/labs` catalogue.

Use three statuses:

- **Available**: a purpose-built lab exists and can be authored now.
- **Adapt**: a generic lab works, but a syllabus-specific preset or activity would improve it.
- **Proposed**: the interaction is not represented well enough yet. Add a lab before describing
  the curriculum lesson as interactive.

The curriculum `npm run check` verifies that every declared available lab key exists. This file
tracks the harder question: whether that lab actually teaches the intended syllabus outcome.

## Cambridge Mathematics 4024

| Syllabus area | Curriculum course/chapter | Lab key | Status | Next action |
|---|---|---|---|---|
| 1 Number foundations | `mathematics-number` chapters 1–3 | `number-structure`, `fraction-bar`, `percent-bar` | Available | Maintain |
| 1 Applied number and surds | `mathematics-number` chapters 4–5 | `rate-machine`, `receipt-totals`, `sequence-predict`, `bounds-window` | Adapt | Add a focused surd simplifier and time-zone timeline |
| 2 Algebra | `mathematics-algebra` | `area-model`, `balance-algebra`, `polynomial-solver` | Available | Maintain |
| 2.9 Practical graphs | `mathematics-graphs` chapter 9 | `graph`, `linear-model`, `derivative-explorer`, `integral-explorer` | Adapt | Add an O Level travel-graph preset with piecewise motion |
| 2.10–2.12 Functions and curves | `mathematics-graphs` chapter 10 | `graph`, `conic`, `function-machine`, `domain-range` | Available | Add 4024 curve-recognition activity presets |
| 3 Coordinate geometry | `mathematics-graphs` chapter 8 | `straight-line`, `geometry-board` | Available | Maintain |
| 4–5 Geometry and mensuration | `mathematics-geometry` | `geometry-board`, `circle-geometry`, `solid-net` | Available | Add a frustum preset |
| 6 Trigonometry | `mathematics-trigonometry` chapter 9 | `triangle-trig`, `oblique-triangle`, `bearings` | Available | Maintain |
| 6.4 Three-dimensional trigonometry | `mathematics-trigonometry` chapter 10 | `lines-in-space`, `solid-net` | Adapt | Add a dedicated line-to-plane angle lab |
| 7.1 Transformations | `mathematics-transformations-and-vectors` chapter 1 | `geometry-transform` | Available | Add combined-transform mode |
| 7.2–7.4 Vectors | `mathematics-transformations-and-vectors` chapter 2 | `vector-board` | Adapt | Add position-vector and collinearity proof modes |
| 8 Probability | `mathematics-statistics` chapter 12 | `sample-space`, `selection`, `venn` | Available | Maintain |
| 9 Statistics | `mathematics-statistics` chapters 10 and 13 | `center-spread`, `histogram`, `ogive` | Adapt | Add bar, pie, pictogram and two-way-table labs |

## Cambridge Additional Mathematics 4037

| Topic | Curriculum course | Primary lab keys | Status | Missing or proposed lab |
|---|---|---|---|---|
| 1 Functions | `additional-mathematics-functions-quadratics` | `function-machine`, `domain-range`, `graph` | Available | Add an inverse/composite activity preset |
| 2 Quadratic functions | `additional-mathematics-functions-quadratics` | `vertex-parabola`, `polynomial-solver`, `graph` | Available | Add discriminant line-versus-curve mode |
| 3 Polynomial factors | `additional-mathematics-algebra-equations` | `polynomial-solver` | Adapt | **Proposed:** remainder/factor theorem and long-division workbench |
| 4 Equations and graphs | `additional-mathematics-algebra-equations` | `modulus-cases`, `graph`, `polynomial-solver` | Available | Extend authored modulus scenarios when new exam patterns justify them |
| 5 Simultaneous equations | `additional-mathematics-algebra-equations` | `linear-system`, `graph`, `polynomial-solver` | Adapt | Add nonlinear-system activity preset |
| 6 Logarithms and exponentials | `additional-mathematics-logs-coordinate-geometry` | `log-law-workbench`, `graph`, `domain-range` | Available | Extend authored bases and equation scenarios when needed |
| 7 Straight-line transformations | `additional-mathematics-logs-coordinate-geometry` | `linearisation`, `straight-line`, `graph` | Available | Extend authored datasets when needed |
| 8 Circle coordinate geometry | `additional-mathematics-logs-coordinate-geometry` | `circle-geometry`, `straight-line`, `intersecting-circles` | Available | Add common-chord activity preset |
| 9 Circular measure | `additional-mathematics-trigonometry-series-vectors` | `radian-wrap`, `area-rearrange` | Available | Add compound-sector problem preset |
| 10 Trigonometry | `additional-mathematics-trigonometry-series-vectors` | `trig-signs`, `graph`, `identity-proof` | Available | Add six-function equation preset |
| 11 Permutations and combinations | `additional-mathematics-trigonometry-series-vectors` | `counting-slots`, `arrangements`, `combination-studio`, `selection` | Available | Maintain syllabus limits: no circular or repeated-object arrangements |
| 12 Series | `additional-mathematics-trigonometry-series-vectors` | `series`, `combination-studio` | Adapt | **Proposed:** positive-integer binomial expansion and target-term lab |
| 13 Vectors | `additional-mathematics-trigonometry-series-vectors` | `vector-geometry-two-d`, `vector-board` | Available | Extend authored collision scenarios when needed |
| 14 Calculus | `additional-mathematics-calculus` | `derivative-explorer`, `integral-explorer`, `graph` | Adapt | Add connected-rates, constrained-optimisation and straight-line kinematics presets |

## Cambridge Physics 5054

| Syllabus area | Curriculum course | Primary lab keys | Status | Missing or proposed lab |
|---|---|---|---|---|
| 1.6 Momentum | `physics` chapter 9 | `collision-track`, `impulse`, `vector-board` | Available | Add O Level collision presets with signed one-dimensional velocity |
| 1.5.4 Circular motion | `physics` chapter 10 | `circular-motion` | Available | Keep the O Level qualitative preset; do not require the centripetal-force equation |
| 1.7.3 Energy resources | `physics` chapter 11 | `efficiency`, `power` | Adapt | **Proposed:** energy-resource and electricity-generation comparison lab |
| 3 Waves | `physics-waves-light-and-sound` | `wave-lab`, `ripple-tank`, `refraction`, `lens-imaging` | Available | Add eye-defect and prism-dispersion presets |
| 4.1 Magnetism | `physics-electricity-and-magnetism` chapter 1 | `magnetism` | Available | Add induced-magnetism and soft-iron comparison modes |
| 4.2–4.4 Electricity | `physics-electricity-and-magnetism` chapters 2–4 | `conduction`, `circuit`, `circuit-builder`, `circuit-lab` | Available | Add fuse, earth-wire and household-energy presets |
| 4.5–4.6 Induction and oscilloscope | `physics-electricity-and-magnetism` chapter 5 | `lorentz`, `alternating-current`, `wave-lab` | Adapt | **Proposed:** O Level generator, transformer and oscilloscope workbench |
| 5 Nuclear physics | `physics-nuclear-and-space` chapters 1–3 | `bohr-atom`, `fission-chain`, `nuclear-binding-energy`, `xray-attenuation` | Adapt | **Proposed:** alpha/beta/gamma comparison and half-life counter |
| 6 Space physics | `physics-nuclear-and-space` chapter 4 | `orbit-lab`, `kepler`, `nuclear-binding-energy` | Adapt | **Proposed:** stellar-life and red-shift evidence lab |
| Paper 3/4 skills | `physics-practical-skills` | `physics-practical-studio`, `measurement`, `graph`, topic labs | Adapt | Pendulum planning/data/evaluation workflow is available; add apparatus-scale, circuits, thermal and optics scenarios. Virtual work does not replace supervised apparatus practice. |

## Cambridge Chemistry 5070

| Syllabus area | Curriculum course | Primary lab keys | Status | Missing or proposed lab |
|---|---|---|---|---|
| 1–3 Matter, atoms, bonding and mole | `chemistry-matter-and-the-mole` | `bohr-atom`, `crystal-lattice`, `stoichiometry`, `solution-box` | Available | Maintain O Level presets |
| 4–8 Reactions and Periodic Table | `chemistry-reactions-and-the-periodic-table` | `reaction-lab`, `electrochem`, `reaction-profile`, `kinetics`, `le-chatelier` | Available | Add fuel-cell and aqueous-electrolysis presets |
| 9 Metals | `chemistry-metals-environment-and-industry` chapters 1–2 | `crystal-lattice`, `reaction-lab`, `electrochem` | Adapt | **Proposed:** blast-furnace and aluminium-extraction process lab |
| 10 Environment and industry | `chemistry-metals-environment-and-industry` chapters 3–4 | `solution-box`, `reaction-lab`, `le-chatelier` | Adapt | **Proposed:** water-treatment train and pollutant source/effect lab |
| 11 Organic chemistry | `chemistry-organic` | `molecular-geometry`, `reaction-lab`, `kinetics`, `titration` | Adapt | **Proposed:** O Level homologous-series, reaction-pathway and polymer builders |
| 12 Experimental techniques | `chemistry-practical-analysis` | `chem-qualitative-analysis`, `measurement`, `graph`, `solution-box`, `titration` | Adapt | Evidence-first ion/gas identification is available; extend to the full official tables, excess-reagent behaviour, flame tests, sulfur dioxide, separation and chromatography/Rf. |

## Cambridge Accounting 7707

| Syllabus area | Curriculum course | Primary lab keys | Status | Missing or proposed lab |
|---|---|---|---|---|
| 1–4 Foundations and adjustments | `accounting` | `equation-balance`, `journal-poster`, `statement-builder`, `depreciation` | Available | Add inventory lower-of-cost-and-NRV preset |
| 3.3–3.4 Verification | `accounting-verification-and-control` | `bank-reconciliation`, `control-account-builder`, `journal-poster` | Available | Extend authoring scenarios with errors, dishonoured cheques, interest, contra entries, refunds and reverse-start reconciliations. |
| 5.2 Partnerships | `accounting-entity-statements` chapter 1 | `apportion`, `statement-builder`, `journal-poster` | Adapt | **Proposed:** appropriation and partner-current-account builder |
| 5.3 Companies | `accounting-entity-statements` chapter 2 | `limited-company`, `statement-builder` | Available | Add company-equity preset |
| 5.4–5.6 Manufacturing, clubs and incomplete records | `accounting-entity-statements` chapters 3–5 | `apportion`, `statement-builder`, `statement-sorter` | Adapt | **Proposed:** manufacturing, subscriptions and incomplete-records workbenches |
| 6 Analysis | `accounting-analysis-and-modern-practice` chapters 1–2 | `ratio-lab`, `statement-sorter` | Available | Add interested-party comparison preset |
| 7 Concepts and modern practice | `accounting-analysis-and-modern-practice` chapter 3 | `rule-card`, `business-lesson` | Adapt | **Proposed:** ethics, technology and sustainability scenario lab |

## Build queue

| Priority | Proposed lab | Supports | Acceptance condition |
|---|---|---|---|
| Delivered P0 | `log-law-workbench` | 4037 topic 6 | Learner combines/splits logs, changes base and solves `a^x=b` |
| Delivered P0 | `linearisation` | 4037 topic 7 | Learner selects transformed axes and recovers both original constants |
| Delivered P0 | `vector-geometry-two-d` | 4024 topic 7; 4037 topic 13 | Position vectors, unit vectors, ratios, collinearity and velocity composition |
| Delivered P0 | `modulus-cases` | 4037 topic 4 | Learner links algebraic cases to the folded graph and solution intervals |
| Delivered P0 | `physics-practical-studio` | 5054 Paper 3/4 | Ships a keyboard/touch pendulum plan → readings → T² evidence → evaluation workflow; additional apparatus scenarios remain tracked above. |
| Delivered P0 | `chem-qualitative-analysis` | 5070 topic 12 | Ships reagent choice, explicit observation recording and four authorable unknowns; full-table expansion remains tracked above. |
| Delivered P0 | `bank-reconciliation` | 7707 section 3.3 | Updates the cash book first, then reconciles timing differences to the bank-statement balance. |
| Delivered P0 | `control-account-builder` | 7707 section 3.4 | Sources entries from books of prime entry and balances both control-account families. |
| P1 | `polynomial-theorems` | 4037 topic 3 | Remainder, factor theorem and polynomial long division in one workflow |
| P1 | `binomial-expansion` | 4037 topic 12 | Builds coefficients and isolates a requested general term |
| P1 | `line-plane-angle` | 4024 topic 6.4 | Learner identifies the perpendicular projection before calculating |
| P1 | `calculus-kinematics` | 4037 topic 14 | Links displacement, velocity and acceleration equations and graphs |
| P1 | `induction-transformer-scope` | 5054 sections 4.5–4.6 | Generator direction, turns ratio, transmission loss and oscilloscope scale reading |
| P1 | `radiation-half-life` | 5054 section 5 | Compares alpha/beta/gamma and separates background before repeated half-life readings |
| P1 | `energy-resource-grid` | 5054 section 1.7.3 | Boiler, turbine and generator pathways plus availability and environmental comparisons |
| P1 | `organic-reaction-map` | 5070 topic 11 | Moves between alkane, alkene, alcohol, acid, ester and polymer with conditions |
| P1 | `separation-analysis-bench` | 5070 topic 12 | Separation choice, Rf calculation, purity and practical observations |
| P1 | `entity-statements` | 7707 sections 5.2–5.6 | Partnerships, manufacturing, clubs and incomplete-record formats with linked workings |
| P2 | `data-chart-studio` | 4024 topic 9 | Two-way tables, bar charts, pie charts and pictograms with misleading-scale checks |
| P2 | `time-zone-line` | 4024 topic 1 | Cross-midnight and signed-zone conversions on one movable timeline |
| P2 | `space-evidence` | 5054 section 6 | Stellar life cycles, red-shift, distance and expansion evidence at O Level depth |
| P2 | `environment-processes` | 5070 topics 9–10 | Blast furnace, water treatment and pollutant source/effect chains |
| P2 | `accounting-ethics-scenarios` | 7707 topic 7 | Requires a justified response to ethical, technology and sustainability trade-offs |

## Maintenance rule

When a proposed lab ships, change its row to **Available**, record the real catalogue key, add a
curriculum lesson using that key, run the labs package tests, then run `npm run sync:labs` and
`npm run check` in the curriculum package.
