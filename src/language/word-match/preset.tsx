'use client';

/**
 * WordMatch — pair each word with its meaning (or picture).
 *
 * Tap a word on the left, then its match on the right; a correct pair locks
 * green, a wrong pair flashes. Right side shows the translation, or — for kids /
 * concrete vocab — the item's icon (emoji/SVG), which is where image-based
 * learning genuinely helps (dual coding). Reads its whole content from a `Deck`,
 * so a new language pair is just new data.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StatusPill } from '../../kit/controls.js';
import { LabFrame, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Speaker } from '../ui.js';
import { dirFor, seededShuffle, type Deck } from '../deck.js';
import { Icon } from '../icon.js';

export interface WordMatchProps {
  deck: Deck;
  /** How many pairs to show at once (default min(items, 6)). */
  count?: number;
  /** Right column: the translation text, or the item icon (kids/concrete). */
  show?: 'translation' | 'icon';
  title?: string;
  prompt?: string;
}

type Pending = { side: 'L' | 'R'; idx: number } | null;

export function WordMatchLab({
  deck,
  count,
  show = 'translation',
  title = 'Match the pairs',
  prompt = 'Tap a word, then tap its match.',
}: WordMatchProps): ReactNode {
  const n = Math.min(count ?? 6, deck.items.length);
  const items = useMemo(() => deck.items.slice(0, n), [deck, n]);
  const rightOrder = useMemo(() => seededShuffle(items.map((_, i) => i), n * 13 + 5), [items, n]);
  const termDir = dirFor(deck.termLang);
  const transDir = dirFor(deck.transLang);

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState<Pending>(null);
  const [wrong, setWrong] = useState<number | null>(null); // item idx that just flashed wrong
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setMatched(new Set()); setPending(null); setWrong(null); }, [items]);
  useEffect(() => () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); }, []);

  const allDone = matched.size === items.length && items.length > 0;
  useCheckpoint({ solved: allDone, activity: 'word-match', score: { raw: items.length, max: items.length } });

  const flashWrong = (idx: number): void => {
    setWrong(idx);
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    wrongTimer.current = setTimeout(() => setWrong(null), 520);
  };

  const tap = (side: 'L' | 'R', idx: number): void => {
    if (matched.has(idx)) return;
    if (!pending) { setPending({ side, idx }); return; }
    if (pending.side === side) { setPending({ side, idx }); return; } // re-pick same side
    if (pending.idx === idx) { setMatched((m) => new Set(m).add(idx)); setPending(null); }
    else { flashWrong(idx); flashWrong(pending.idx); setPending(null); }
  };

  const cellState = (side: 'L' | 'R', idx: number): string =>
    matched.has(idx) ? 'ok'
      : wrong === idx ? 'no'
      : pending && pending.side === side && pending.idx === idx ? 'sel'
      : 'idle';

  const figure = (
    <div className="lang-lab">
      <div className="lang-match">
        <div className="lang-col" aria-label="words">
          {items.map((it, i) => (
            <div key={`L${i}`} className="lang-match-row">
              <button type="button" className="lang-match-cell" data-state={cellState('L', i)} disabled={matched.has(i)} onClick={() => tap('L', i)} aria-label={`${it.term}${matched.has(i) ? ', matched' : ''}`}>
                <span className="lang-cell-text" dir={termDir}>{it.term}</span>
                {it.transliteration ? <span className="lang-cell-sub">{it.transliteration}</span> : null}
              </button>
              <Speaker item={it} lang={deck.termLang} />
            </div>
          ))}
        </div>
        <div className="lang-col" aria-label="matches">
          {rightOrder.map((i) => {
            const it = items[i]!;
            return (
              <button key={`R${i}`} type="button" className="lang-match-cell" data-state={cellState('R', i)} disabled={matched.has(i)} onClick={() => tap('R', i)} aria-label={show === 'icon' ? `picture for ${it.translation}` : it.translation}>
                {show === 'icon' && it.icon
                  ? <Icon icon={it.icon} className="lang-cell-icon" size={36} decorative />
                  : <span className="lang-cell-text" dir={transDir}>{it.translation}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <LiveRegion>
        {allDone ? 'All pairs matched' : ''}
      </LiveRegion>
    </div>
  );

  return (
    <LabFrame
      title={title}
      prompt={prompt}
      aside={<StatusPill ok={allDone}>{allDone ? '✓ All matched' : `${matched.size} / ${items.length} matched`}</StatusPill>}
    >
      {figure}
    </LabFrame>
  );
}
