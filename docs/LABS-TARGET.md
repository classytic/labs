# Labs target: a dependable interactive-learning runtime

## Product promise

`@classytic/labs` lets an author turn a difficult idea into an accessible, responsive interaction without rebuilding layout, controls, feedback, assessment, animation, or host theming. It is a community package, not a Brihot-specific component collection. Brihot's stage preview is one integration and release smoke test.

The target is not visual sameness. Every lab should share a predictable learning and interaction grammar while preserving the domain-specific scene that makes the idea visible.

## Definition of world-class

A showcase-ready lab must pass five independent gates. Passing a manifest check alone is not enough.

1. **Learning** — it has an observable objective and a coherent predict → act → observe → explain → transfer arc. The activity reveals a relationship that prose or a static diagram cannot reveal as effectively.
2. **Interaction** — the learner always knows the current task, what changed, why it changed, and how to continue. Primary actions do not move unpredictably or disappear below long panels.
3. **Visual communication** — the scene establishes hierarchy through scale, contrast, motion, labels, and meaningful domain imagery. Text does not collide, clip, become decorative, or duplicate nearby prose.
4. **Access** — the complete task works with keyboard and touch, has a text alternative, respects reduced motion, preserves visible focus, and remains usable at 320 CSS px and 200% zoom.
5. **Engineering** — the lab is authorable through a validated schema, loads through its own runtime chunk, uses public shared primitives, consumes semantic host tokens, and adds no unrelated domain or editor code to the host bundle.

## Standard runtime anatomy

Use the shared `Activity` composition for new and migrated labs:

- Header: one mission, a short description, and focus mode.
- Status: compact live state only when it helps interpret the scene.
- Workspace: the domain scene plus an optional inspector; one primary visual surface.
- Evidence: measurements, traces, comparison, or explanation tied to the learner's action.
- Feedback: a concise interpretation of the current state, not a permanent blue decoration.
- Support: transcript, hints, goals, or history in one contextual disclosure.
- Transport: reset, progress, and one primary action in a stable responsive location.

These are slots, not mandatory cards. Empty slots render nothing. A simple manipulation should stay simple.

On compact and short viewports, transport must remain thumb-reachable, account for the device safe area, and never cover content. Inspectors need an authored priority/default-open policy rather than disappearing solely because the viewport narrowed.

## Authoring contract

Authors configure meaning, not internal layout. Each public lab schema should expose the meaningful variables for its subject: data, model parameters, constraints, prompts, checkpoints, response type, feedback, and transfer task. Authors should not need to supply pixel coordinates unless spatial placement is itself the lesson.

The supported response family is choice, numeric, text, ordering, and reflection. Domain-specific interactions may extend it, but must report attempts and completion through the same runtime contract.

Static exposition, prerequisites, and lesson-to-lesson navigation remain in CMS/MDX. Labs own the live model, task-local guidance, evidence, feedback, and exact completion condition.

## Design-system contract

- Consume semantic shadcn-compatible variables such as background, foreground, primary, muted, border, destructive, and ring; never ship a host theme.
- Shared primitives own type scale, spacing, radii, borders, focus, control height, and responsive behavior.
- Domain palettes may identify quantities or classes, but cannot replace semantic UI colors.
- Use a host-provided icon system when available; package icons must be small, semantic, accessible SVG primitives rather than decorative clip art.
- Avoid nested bordered cards. Borders communicate a real boundary, disclosure, selection, or interactive surface.
- Labels belong to a collision-aware scene layer or an external legend when the scene is dense.
- Learning-interface body text should be at least `0.875rem`. Smaller SVG labels are reserved for nonessential annotations and require an accessible full-text equivalent.

### Scene-first art direction

The visualization is the primary explanatory object, not a backdrop behind interface chrome. Apply these principles when reviewing or authoring a scene:

- **One visual thesis:** a scene should make one relationship unmistakable through position, scale, motion, comparison, or transformation. Remove marks that neither explain state nor afford interaction.
- **Composed hierarchy:** the model is visually dominant; current state and essential annotations are secondary; controls, evidence, and extended explanation recede into their standard runtime slots.
- **Purposeful space:** empty space separates causes, effects, phases, or competing quantities. It must not result from an unused layout column, a fixed oversized canvas, or content centered without semantic reason.
- **Meaningful colour:** semantic UI state continues to use host tokens. A restrained domain palette may encode quantities, classes, phases, or direction, but the same meaning must also be available through shape, label, pattern, or text.
- **Sparse scene text:** keep only identifiers, units, current values, and short causal annotations inside the visualization. Put sentences in feedback or evidence and longer teaching prose in MDX/support.
- **Craft without ornament:** depth, rhythm, and motion should clarify structure or change. Decorative gradients, shadows, particles, illustrations, and animation do not qualify unless they improve comprehension or motivation without obscuring the model.
- **Authorable composition:** authors configure semantic emphasis, annotations, palettes, checkpoints, and evidence. They should not recreate shell spacing or hard-code coordinates solely to repair layout.

This is an adaptation of visual-canvas practice for interactive learning. It deliberately rejects bundled art fonts, static-canvas output, and a universal “minimal text” rule because Labs must remain host-native, responsive, translatable, and accessible.

## Performance and packaging targets

- Keep engines pure and React-free where practical.
- Keep runtime, editor, and heavy renderer subpaths separate.
- A domain import must not eagerly import another domain, the catalog, or authoring/editor surfaces.
- Three.js or another heavy renderer must be an optional leaf subpath and dynamically loaded by the lab that needs it.
- Preserve the current CSS layers: core, domains, and commerce. Aggregate CSS is convenience only.
- Release checks must enforce export resolution, SSR importability, catalog generation, and documented CSS budgets.

## Evidence required before calling a lab ready

- Manifest experience assessment passes.
- Schema/default and interaction tests pass.
- A keyboard-only completion path is tested.
- Reduced-motion behavior is tested or explicitly inspected.
- Mobile, desktop, focus mode, 200% zoom, and long/localized text are reviewed.
- Scientific or domain calculations have unit tests and cited assumptions where appropriate.
- An author can create a materially different lesson instance without editing runtime code.
- A learner or educator review records whether the intended relationship became clearer.

Promotion to `showcase-ready` requires at least 80/100 using the rubric in `LABS-PLAN.md`, no category below 60%, and no critical accessibility or domain-validity failure.

## Current baseline

The catalog contains 199 registered labs. Seventy-eight currently declare and pass the complete manifest-level experience contract. These include tested references across networking, physics, chemistry, electronics, algorithms, accounting, economics, discrete probability, statistics, machine learning, biology, geography, and the complete language domain. Accounting now covers the connected books workflow plus EOQ, progressive reorder-policy disruption scenarios, general cost apportionment, and warehouse cost allocation. The warehouse preset intentionally teaches cost responsibility rather than pretending to be a warehouse-operations simulator; operational inventory evidence lives in the reorder-policy engine. The other 121 are **unverified**, not automatically rejected. Readiness must be earned cohort by cohort; metadata must never be added merely to raise the score.

## Non-goals

- Recreating Brilliant's product shell, branding, or proprietary lesson content.
- Making every lab use the same visual scene or the same question type.
- Adding package versions, compatibility aliases, wrappers, or abstractions without a current consumer and a demonstrated repeated need.
- Moving lesson prose, course routing, analytics dashboards, or CMS concerns into the runtime package.
- Declaring all 199 labs ready before representative learner and integration evidence exists.
