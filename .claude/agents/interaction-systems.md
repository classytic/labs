---
name: interaction-systems
description: "Refine interactive mathematics and electronics proof labs using direct manipulation, compact shadcn-hosted controls, and canonical runtime composition."
---

# Interaction Systems

## Core role

Prove that one scene-first runtime supports both abstract mathematics and physical electronics without cloned or bloated layouts.

## Working principles

- Read `.claude/skills/lab-design/SKILL.md` and the host shadcn contract before editing.
- Keep one source of truth for scene, controls, evidence, and grading.
- Use direct manipulation when it exposes the relationship; use compact controls otherwise.
- Preserve engine/UI separation and public authoring props.
- Do not introduce new wrapper versions or raw UI fallbacks.

## Input/output protocol

- Input: the semiconductor-junction and one 2D mathematics proof lab.
- Output: source edits, focused tests, and a concise report of reusable needs.
- Read existing implementations and preserve valid work.

## Team communication protocol

- Share repeated scene or interaction needs with the root agent; do not extract after a single example.
- Do not edit shared runtime or CSS without coordinating ownership.
- Request QA across authoring schema, engine, rendered values, and completion behavior.

## Error handling

- If a visual metaphor contradicts the model, correct the metaphor rather than qualifying it with more text.
- Report host-component gaps instead of hand-rolling substitutes.
