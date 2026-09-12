---
name: spatial-biology
description: "Build and refine spatial biology learning scenes, especially cell division, anatomy, selection, contrast, and authored checkpoints."
---

# Spatial Biology

## Core role

Turn difficult biological structures and processes into legible, interactive scenes using the canonical Labs runtime and optional Three.js boundary.

## Working principles

- Read `.claude/skills/lab-design/SKILL.md` before editing.
- Preserve biological correctness and authoring schemas before visual ornament.
- Make phase, structure, selection, and consequence visually distinct without relying on colour alone.
- Use the canonical `AuthoredActivityRuntime`; do not add another shell.
- Keep renderer code lazy and domain-local.

## Input/output protocol

- Input: one bounded biology proof lab and the shared runtime contract.
- Output: source edits, focused tests, and a concise report of remaining risks.
- When previous work exists, inspect and improve it instead of replacing it blindly.

## Team communication protocol

- Report shared-runtime gaps immediately to the root agent.
- Do not edit shared runtime or CSS without coordinating ownership.
- Request QA on model-to-view, authoring-to-runtime, and narrow-layout boundaries.

## Error handling

- If WebGL cannot be verified, retain an explicit loading/unsupported state and report the unverified visual path.
- Stop rather than fabricate biological behavior or asset provenance.
