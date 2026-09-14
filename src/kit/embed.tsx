'use client';

/**
 * Is this lab EMBEDDED in a lesson, or standing on its own?
 *
 * A lab in the gallery or the authoring preview has to introduce itself: nothing else
 * on the page says what it is. A lab inside a lesson does not. The page has already
 * given the learner a title, a question and a paragraph of context, so the lab adding
 * a category eyebrow and a product name ("ANGLE MEASURE / Trig Explorer") says the
 * same thing a third time and pushes the figure down the screen. The design rulebook
 * calls both of those out by name: say-it-once, and the figure is the hero.
 *
 * The distinction is structural, not a prop, so no lab has to thread it: every lab
 * rendered from an MDX tag goes through `LabRuntime`, and that is the only place this
 * provider is used. Importing a lab component directly (gallery, stage-preview,
 * authoring) skips it and keeps the full heading.
 *
 * The same context carries the HEADLINE the lesson authored. A lab's heading is written
 * once, in its preset, for the general case: "Balance-scale algebra", "Discover the rule".
 * A lesson using it has a specific case, in its own words and often its own language, and
 * had no way to say so unless that particular lab happened to thread a `title` prop down
 * to `Activity.Heading`. Routing it through here instead means EVERY lab can be renamed by
 * the lesson that uses it, including the ones whose component never took the prop, because
 * every lab's heading goes through `Activity.Heading` (directly, or via the authored shell).
 *
 * This lives in its own module so `kit/activity` and `lab-def/lab-runtime` can both
 * use it without importing each other.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';

/** What the surrounding lesson has already said about this lab. */
interface LabEmbedValue {
  embedded: boolean;
  /** The lesson's own name for this lab, overriding the preset's general one. */
  title?: string;
  /** The lesson's own instruction, overriding the preset's general one. */
  prompt?: string;
}

const EmbedContext = createContext<LabEmbedValue>({ embedded: false });

/** True when the surrounding page already names this lab. */
export function useLabEmbed(): boolean {
  return useContext(EmbedContext).embedded;
}

/** The lesson-authored heading, where the lesson set one. */
export function useAuthoredHeadline(): { title?: string; prompt?: string } {
  const { title, prompt } = useContext(EmbedContext);
  return { title, prompt };
}

/** Blank and whitespace-only are the same as unset: an empty heading helps nobody. */
const authored = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

export function LabEmbedProvider({
  children,
  title,
  prompt,
}: {
  /** Optional so `createElement(LabEmbedProvider, props, child)` type-checks. */
  children?: ReactNode;
  title?: unknown;
  prompt?: unknown;
}): ReactNode {
  const value = useMemo(
    () => ({ embedded: true, title: authored(title), prompt: authored(prompt) }),
    [title, prompt],
  );
  return <EmbedContext.Provider value={value}>{children}</EmbedContext.Provider>;
}
