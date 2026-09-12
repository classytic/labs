---
name: labs-proof-orchestrator
description: "Coordinate initial and follow-up Labs flagship proof migrations, runtime refinement, visual-learning audits, fixes, updates, and improvements using specialist agents and incremental integration QA."
---

# Labs proof orchestrator

## Phase 0: context

- Read `_workspace/` outputs when present and decide whether this is an initial, follow-up, or partial run.
- Read the benchmark, target, plan, canonical runtime, and current diffs.

## Phase 1: fan-out

- Spatial Biology owns the cell-division proof.
- Physics Visualization owns the relativity reference-frame proof.
- Interaction Systems owns semiconductor junction and one representative 2D mathematics proof.
- Agents edit only their owned domain files and focused tests. The root agent owns shared runtime, shared CSS, documentation, build, and consumer sync.
- Agents send shared discoveries to the root rather than independently extracting primitives.

## Phase 2: incremental QA

After each proof completes, cross-check both sides of these boundaries:

- authoring props/schema <-> runtime state;
- pure engine result <-> visual/evidence value;
- learning gate <-> enabled transport;
- renderer loading/unsupported state <-> accessible DOM meaning;
- domain scene <-> shared runtime layout.

One retry is allowed after a concrete failure report. Preserve unresolved findings in `_workspace/`.

## Phase 3: integration

- Extract a shared primitive only when at least three proofs demonstrate the same semantic need.
- Run focused tests, typecheck, host UI conformance, build, and package sync.
- Record claims as verified, failed, or visually unverified.

## Test scenarios

- Normal: all four proofs retain author overrides, pass focused tests, and use the canonical scene-first composition.
- Error: a WebGL proof cannot render in CI; verify engine, loading/unsupported UI, DOM narration, and type/build boundaries, then mark screenshot quality unverified.
