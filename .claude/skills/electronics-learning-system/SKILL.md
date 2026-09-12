---
name: electronics-learning-system
description: "Design, audit, implement, update, or improve @classytic/labs electronics, semiconductor, logic, circuit, schematic, PCB, routing, and hardware-learning experiences. Use for any request connecting device physics to gates, circuits, boards, or manufacturing."
---

# Electronics learning system

## Goal
Build one authorable causal chain: carriers → junctions → switches → gates → circuits → schematic nets → physical PCB → verification.

## Audit first
1. Inventory existing engines, activities, manifests, public exports, and tests.
2. Mark every concept as foundational, bridge, application, or duplicate.
3. Find discontinuities where a learner accepts a new abstraction without constructing it.
4. Reuse a working engine or scene contract before proposing a package.

## Learning contract
- Give one consequential action, one visible causal response, and one inference.
- Require prediction before decisive evidence.
- Do not display the final answer before commitment.
- Make electrical and physical views projections of shared semantic state.
- Label simplified models and keep calculations outside React.

## Architecture contract
- Keep public dependency subpaths coarse: `circuits`, `circuits/semiconductor`, and `circuits/pcb` only when direct imports justify them.
- Organize PCB internals by capability: `core`, `schematic`, `placement`, `routing`, `drc`, `runtime`, `authoring`.
- Documents are serializable and renderer-independent: components, pins, nets, footprints, pads, traces, vias, layers, rules, violations.
- SVG/Stage owns editing. Optional 3D is a leaf assembled-board view, never a correctness dependency.
- Extend the circuit solver through adapters; do not duplicate simulation.
- No heavy engines in manifests, authoring, shared kit, or broad barrels.

## Visual and interaction contract
- Follow `.claude/skills/lab-design/SKILL.md`.
- Use conventional symbols and recognizable footprints.
- Provide keyboard alternatives for drag, route, rotate, and place.
- Reduce ratsnest as nets are routed.
- Never rely on color alone for net identity or errors.
- Reveal one abstraction layer at a time, not a professional EDA dashboard.

## Verification
- Test conservation, connectivity, netlists, geometry, DRC, deterministic routing, undo/redo, and serialization.
- Cross-check schematic pins against footprint pads.
- Test narrow/wide containers, keyboard use, reduced motion, and host themes.

## Test prompts
- "Connect a diode lesson to a transistor and NOT-gate lesson without duplicating the solver."
- "Design an authorable two-layer PCB routing lab with DRC."
- "Audit whether current electronics labs explain how gates become real hardware."

## Trigger boundaries
Use for electronics learning systems and PCB authoring. Do not trigger for isolated calculations, generic CAD, or firmware-only instruction.
