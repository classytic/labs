# Labs UX audit — September 2026

## Direction

Keep the existing figure-first, host-themed runtime. The strongest transferable pattern from
[Brilliant](https://brilliant.org/) is not its branding: it is one small intellectual move at a
time, direct manipulation, immediate causal feedback and contextual help. Brilliant describes its
interactives as typing, dragging and manipulating with a predictable restart path, and its public
classroom guidance frames lessons as short step-by-step sessions rather than dashboards.

The Classytic design system already supports this direction: one bordered root, a dominant figure,
one current task, progressive disclosure, semantic tokens and restrained motion. The remaining
problem is consistent proof and enforcement across a large catalogue.

## Verified in this pass

- Fixed `scripts/experience-check.mjs` so its host UI shim registers before the gallery imports.
- Raised compact controls to a 44 × 44 px hit area and enforced that target for buttons under a lab
  root.
- The browser check now passes six representative activities at 320 CSS px, 200% zoom and reduced
  motion with no undersized controls or horizontal overflow.
- Added four Cambridge-focused labs with authored progression and focused tests:
  `physics-practical-studio`, `chem-qualitative-analysis`, `bank-reconciliation` and
  `control-account-builder`.
- The catalogue now contains 294 labs. The Cambridge P0 cohort adds focused logarithm-law,
  linearisation, modulus-case and two-dimensional vector workbenches. Catalogue size is not a UX score.

## Next enforcement work

1. Replace the one-dimensional “ready” label with evidence fields for model review, interaction,
   keyboard, non-drag pointer alternative, text alternative, reduced motion, responsive/zoom,
   light/dark visual review, authoring variation and bundle budget.
2. Fix the seven current `say-it-once` failures in cell division, cell system, supply chain,
   embedding space, fission, quantum and refraction.
3. Add conformance checks for raw colours, bare SVG text and direct font sizes, with documented
   Canvas/WebGL/data-colour exceptions.
4. Review the Cambridge-facing visual cohort first: heat transfer, refraction, efficiency,
   measurement, travelling waves and statement sorter.
5. Curate learner-facing families so near-duplicate engines and compatibility aliases do not appear
   as separate choices.

## Lean acceptance gate

A showcase lab teaches one difficult mental operation; states the current task in one sentence;
starts with a meaningful scene; gives every control a visible same-frame effect; reveals evidence
after the action that earns it; says each fact once; supports keyboard and a non-drag pointer path;
has 44 px targets, text alternatives and predictable reset; works at 320/768/1280 px and 200% zoom
in light/dark and reduced motion; accepts a materially different authored scenario; and ends in
feedback plus transfer.
