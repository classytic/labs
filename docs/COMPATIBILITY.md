# Public surfaces and removal rules

The package is converging on `Activity`, generated manifests, focused block entrypoints, and separated runtime/editor subpaths. Compatibility code is temporary only when it has a known consumer or capability that the canonical runtime does not yet provide.

| Surface | Current state | Keep until | Removal rule |
| --- | --- | --- | --- |
| `Field`, `ControlPolicy`, `Readout`, `StatList`, `Progress`, `LiveRegion` | Active composable Activity primitives | Used by canonical runtimes | Keep; these provide control policy, evidence, and accessibility without owning a shell |
| `CommerceActivity`, `MLActivity`, `LanguageActivity`, mechanics/thermal/wave adapters | Capability-bearing domain recipes | Canonical authored runtime has equivalent semantic slots | Delete only after every consumer moves; do not replace with another wrapper generation |
| `ChallengeCard`, hints, reveal, `LabAsk` | Active interaction capabilities | Authored responses support their rich prompts, math equivalence, hints, and reveal policies | Migrate by cohort, then remove only at zero consumers |
| `Guide` / `Steps` | No built-in consumers; deprecated public compatibility only | Third-party users have a major-version migration window | Remove in the next major after packed-consumer and documentation review |
| `PredictGate` | No built-in lab consumer, but public and tested | Authored predict gate is documented as replacement | Deprecate before removal; do not silently remove from a published minor |
| `./blocks` | Broad block compatibility entry | Consumers use `catalog`, `domains`, `gallery`, `lazy`, `lesson`, or `render` | Major release only |
| `./blocks/render` | Canonical schema-free learner render map | Required by MDX hosts | Keep |
| `styles.css` | Aggregate convenience stylesheet | Hosts can choose layered CSS | Keep; document selective loading as preferred |

## Proof required before deletion

1. Repository and known-consumer import search returns zero uses.
2. The package export is absent from README examples and integration fixtures.
3. A canonical replacement covers behavior, accessibility, authoring, and reporting—not merely visual shape.
4. Generated registry, typecheck, build, package check, gallery, and focused interaction tests pass.
5. Public removals have an appropriate migration note once the package has published consumers.

`LabFrame`, `ControlBar`, and `Callout` were removed before the first community release after repository-wide migration reached zero consumers. `Activity` is the only shell contract.

Generated `dist` is rebuilt from a clean output directory. Stale generated files absent from a clean build are deleted rather than preserved as compatibility artifacts.
