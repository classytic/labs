'use client';

/**
 * Shared DOM UI for the language labs, Speaker button + POS-coloured Tile.
 * Themed via the `.lang-*` classes shipped in `@classytic/labs/styles.css`
 * (POS colours come from `--lang-pos-*` tokens). Kept here, not in the generic
 * `kit/controls`, so non-language labs pay nothing for it.
 */

import { Button } from '@/components/ui/button';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ActionButton } from '../kit/controls.js';
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
    const sync = (): void => {
      if (window.speechSynthesis.getVoices().length > 0) setReady(true);
    };
    sync();
    window.speechSynthesis.addEventListener('voiceschanged', sync);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', sync);
  }, [ready]);
  return ready;
}

/**
 * The speaker glyph, a crisp inline SVG (not the 🔊 emoji, which renders
 * inconsistently across platforms and can't be theme-coloured or stroke-matched).
 * Inherits `currentColor` + sizes to `1em`, so it tracks the button's colour/size.
 */
export function SpeakerGlyph({ size = 15 }: { size?: number }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.8 5.2a9 9 0 0 1 0 13.6" />
    </svg>
  );
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
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      className="lang-speak"
      aria-label={`Play pronunciation of ${item.term}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(item, lang);
      }}
    >
      <SpeakerGlyph />
    </Button>
  );
}

/** Prominent but compact audio action for listening-led activities. */
export function ListenButton({
  item,
  lang,
  label = 'Play audio',
  onPlay,
}: {
  item: DeckItem;
  lang: string;
  label?: string;
  onPlay?: () => void;
}): ReactNode {
  const voicesReady = useVoicesReady();
  const available = Boolean(item.audioUrl) || (voicesReady && hasVoiceFor(lang));
  return (
    <ActionButton
      className="lang-audio-action"
      onClick={() => {
        if (speak(item, lang)) onPlay?.();
      }}
      disabled={!available}
    >
      <SpeakerGlyph size={17} />
      <span>{label}</span>
    </ActionButton>
  );
}

/** A word tile coloured by part of speech, with an optional L1 gloss beneath. */
export function Tile({
  pos = 'other',
  text,
  gloss,
  dir = 'ltr',
  lang,
  glossLang,
  selected,
  dimmed,
  onClick,
  ariaLabel,
}: {
  pos?: Pos;
  text: string;
  gloss?: string;
  dir?: 'ltr' | 'rtl';
  lang?: string;
  glossLang?: string;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}): ReactNode {
  const style = { '--pos': `var(--lang-pos-${pos})` } as CSSProperties;
  const label = ariaLabel ?? `${text}${gloss ? `, ${gloss}` : ''} (${POS_LABEL[pos]})`;
  return (
    <Button
      type="button"
      variant="outline"
      className="lang-tile"
      style={style}
      data-sel={selected ? 'true' : undefined}
      data-dim={dimmed ? 'true' : undefined}
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
    >
      <span className="lang-tile-text" dir={dir} lang={lang}>
        {text}
      </span>
      {gloss ? (
        <span className="lang-tile-gloss" lang={glossLang}>
          {gloss}
        </span>
      ) : null}
    </Button>
  );
}
