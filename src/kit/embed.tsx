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
 * This lives in its own module so `kit/activity` and `lab-def/lab-runtime` can both
 * use it without importing each other.
 */

import { createContext, useContext, type ReactNode } from 'react';

const EmbedContext = createContext(false);

/** True when the surrounding page already names this lab. */
export function useLabEmbed(): boolean {
  return useContext(EmbedContext);
}

export function LabEmbedProvider({ children }: { children: ReactNode }): ReactNode {
  return <EmbedContext.Provider value={true}>{children}</EmbedContext.Provider>;
}
