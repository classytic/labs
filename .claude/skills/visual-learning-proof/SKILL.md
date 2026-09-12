---
name: visual-learning-proof
description: "Implement, revise, or audit a Labs flagship proof activity. Use for scene-first biology, physics, electronics, or mathematics work and for follow-up improvements based on learner screenshots."
---

# Visual learning proof

1. Read `docs/VISUAL-LEARNING-BENCHMARK.md`, `docs/LABS-TARGET.md`, and `.claude/skills/lab-design/SKILL.md`.
2. Trace authoring schema -> pure model/engine -> scene -> evidence -> completion gate. Preserve one source of truth.
3. State the scene's single visual thesis in one sentence. Remove marks, controls, and prose that do not serve it.
4. Use the canonical `AuthoredActivityRuntime`. Keep the scene dominant, controls in its dock, evidence contextual, and navigation stable.
5. Put domain meaning in model data and domain scene primitives. Use host shadcn controls for generic UI.
6. Test model correctness, a learner interaction, author override behavior, and the relevant boundary between engine and UI.
7. Run formatting, focused tests, typecheck, and `git diff --check`.
8. Report passed, failed, and visually unverified claims separately. Never call screenshot quality verified without inspecting a rendered screenshot.
