import { DeckItem, Pos } from "./deck.mjs";
import { ReactNode } from "react";

//#region src/language/ui.d.ts
/**
 * True once the browser's TTS voice list is populated (it loads async).
 *
 * Starts `false`, NOT seeded from `getVoices()`, so the first client render
 * matches the server (where there's no `speechSynthesis`). Seeding from the
 * live voice list would make a TTS-only item render its speaker button on the
 * client but not the server → a hydration mismatch that forces React to
 * regenerate the whole subtree on the client. The effect flips it true after
 * mount, which is a normal post-mount update, not a hydration diff.
 */
declare function useVoicesReady(): boolean;
/**
 * A speaker button, renders nothing if the item can't be voiced.
 *
 * `audioUrl` items can voice on the server too (no browser needed), so they
 * render the button consistently across SSR/hydration. Browser-TTS items only
 * become voiceable once `voicesReady` flips post-mount, gating on it (instead
 * of querying `window.speechSynthesis` during render) keeps the first client
 * render identical to the server.
 */
declare function Speaker({
  item,
  lang
}: {
  item: DeckItem;
  lang: string;
}): ReactNode;
/** A word tile coloured by part of speech, with an optional L1 gloss beneath. */
declare function Tile({
  pos,
  text,
  gloss,
  dir,
  selected,
  dimmed,
  onClick,
  ariaLabel
}: {
  pos?: Pos;
  text: string;
  gloss?: string;
  dir?: 'ltr' | 'rtl';
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}): ReactNode;
//#endregion
export { Speaker, Tile, useVoicesReady };