'use client';

/**
 * Shared DOM UI for the language labs, Speaker button + POS-coloured Tile.
 * Themed via the `.lang-*` classes shipped in `@classytic/labs/styles.css`
 * (POS colours come from `--lang-pos-*` tokens). Kept here, not in the generic
 * `kit/controls`, so non-language labs pay nothing for it.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { hasVoiceFor, speak, POS_LABEL, type DeckItem, type Pos } from './deck.js';

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
export function useVoicesReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const sync = (): void => { if (window.speechSynthesis.getVoices().length > 0) setReady(true); };
    sync();
    window.speechSynthesis.addEventListener('voiceschanged', sync);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', sync);
  }, [ready]);
  return ready;
}

/**
 * A speaker button, renders nothing if the item can't be voiced.
 *
 * `audioUrl` items can voice on the server too (no browser needed), so they
 * render the button consistently across SSR/hydration. Browser-TTS items only
 * become voiceable once `voicesReady` flips post-mount, gating on it (instead
 * of querying `window.speechSynthesis` during render) keeps the first client
 * render identical to the server.
 */
export function Speaker({ item, lang }: { item: DeckItem; lang: string }): ReactNode {
  const voicesReady = useVoicesReady();
  const canVoice = Boolean(item.audioUrl) || (voicesReady && hasVoiceFor(lang));
  if (!canVoice) return null;
  return (
    <button
      type="button"
      className="lang-speak"
      aria-label={`Play pronunciation of ${item.term}`}
      onClick={(e) => { e.stopPropagation(); speak(item, lang); }}
    >
      <span aria-hidden>🔊</span>
    </button>
  );
}

/** A word tile coloured by part of speech, with an optional L1 gloss beneath. */
export function Tile({
  pos = 'other', text, gloss, dir = 'ltr', selected, dimmed, onClick, ariaLabel,
}: {
  pos?: Pos; text: string; gloss?: string; dir?: 'ltr' | 'rtl';
  selected?: boolean; dimmed?: boolean; onClick?: () => void; ariaLabel?: string;
}): ReactNode {
  const style = { '--pos': `var(--lang-pos-${pos})` } as CSSProperties;
  const label = ariaLabel ?? `${text}${gloss ? `, ${gloss}` : ''} (${POS_LABEL[pos]})`;
  return (
    <button
      type="button"
      className="lang-tile"
      style={style}
      data-sel={selected ? 'true' : undefined}
      data-dim={dimmed ? 'true' : undefined}
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
    >
      <span className="lang-tile-text" dir={dir}>{text}</span>
      {gloss ? <span className="lang-tile-gloss">{gloss}</span> : null}
    </button>
  );
}
