'use client';

/**
 * WordMatch, pair each word with its meaning (or picture).
 *
 * Tap a word on the left, then its match on the right; a correct pair locks
 * green, a wrong pair flashes. Right side shows the translation, or, for kids /
 * concrete vocab, the item's icon (emoji/SVG), which is where image-based
 * learning genuinely helps (dual coding). Reads its whole content from a `Deck`,
 * so a new language pair is just new data.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from '../../kit/activity.js';
import { LanguageActivity } from '../activity.js';
import { useCheckpoint, useHints, HintLadder } from '../../kit/pedagogy.js';
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
  objectives?: string[];
  hints?: string[];
}

type Pending = { side: 'L' | 'R'; idx: number } | null;

export function WordMatchLab({
  deck,
  count,
  show = 'translation',
  title = 'Match the pairs',
  prompt = 'Tap a word, then tap its match.',
  objectives,
  hints: hintList,
}: WordMatchProps): ReactNode {
  const n = Math.min(count ?? 6, deck.items.length);
  const items = useMemo(() => deck.items.slice(0, n), [deck, n]);
  const rightOrder = useMemo(
    () =>
      seededShuffle(
        items.map((_, i) => i),
        n * 13 + 5,
      ),
    [items, n],
  );
  const termDir = dirFor(deck.termLang);
  const transDir = dirFor(deck.transLang);

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState<Pending>(null);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState('');
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setMatched(new Set());
    setPending(null);
    setWrong(new Set());
    setAnnouncement('');
  }, [items]);
  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    [],
  );

  const allDone = matched.size === items.length && items.length > 0;
  const hints = useHints(hintList);
  useCheckpoint({
    solved: allDone,
    activity: 'word-match',
    score: { raw: items.length, max: items.length },
    hintsUsed: hints.count,
  });

  const flashWrong = (cells: Array<{ side: 'L' | 'R'; idx: number }>): void => {
    setWrong(new Set(cells.map((cell) => `${cell.side}${cell.idx}`)));
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    wrongTimer.current = setTimeout(() => setWrong(new Set()), 520);
  };

  const tap = (side: 'L' | 'R', idx: number): void => {
    if (matched.has(idx)) return;
    if (!pending) {
      setPending({ side, idx });
      setAnnouncement('First item selected. Choose its match.');
      return;
    }
    if (pending.side === side) {
      setPending({ side, idx });
      setAnnouncement('Selection changed. Choose from the other column.');
      return;
    } // re-pick same side
    if (pending.idx === idx) {
      setMatched((m) => new Set(m).add(idx));
      setPending(null);
      setAnnouncement(`Matched ${items[idx]?.term ?? 'pair'}.`);
    } else {
      flashWrong([{ side, idx }, pending]);
      setPending(null);
      setAnnouncement('Those do not match. Try another pair.');
    }
  };

  const cellState = (side: 'L' | 'R', idx: number): string =>
    matched.has(idx)
      ? 'ok'
      : wrong.has(`${side}${idx}`)
        ? 'no'
        : pending && pending.side === side && pending.idx === idx
          ? 'sel'
          : 'idle';

  const figure = (
    <div className="lang-lab">
      <div className="lang-match">
        <div className="lang-col" aria-label="words">
          {items.map((it, i) => (
            <div key={`L${i}`} className="lang-match-row">
              <Button
                type="button"
                variant="outline"
                className="lang-match-cell"
                data-state={cellState('L', i)}
                disabled={matched.has(i)}
                onClick={() => tap('L', i)}
                aria-label={`${it.term}${matched.has(i) ? ', matched' : ''}`}
              >
                <span className="lang-cell-text" dir={termDir} lang={deck.termLang}>
                  {it.term}
                </span>
                {it.transliteration ? <span className="lang-cell-sub">{it.transliteration}</span> : null}
              </Button>
              <Speaker item={it} lang={deck.termLang} />
            </div>
          ))}
        </div>
        <div className="lang-col" aria-label="matches">
          {rightOrder.map((i) => {
            const it = items[i]!;
            return (
              <Button
                key={`R${i}`}
                type="button"
                variant="outline"
                className="lang-match-cell"
                data-state={cellState('R', i)}
                disabled={matched.has(i)}
                onClick={() => tap('R', i)}
                aria-label={show === 'icon' ? `picture for ${it.translation}` : it.translation}
              >
                {show === 'icon' && it.icon ? (
                  <Icon icon={it.icon} className="lang-cell-icon" size={36} decorative />
                ) : (
                  <span className="lang-cell-text" dir={transDir} lang={deck.transLang}>
                    {it.translation}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
      <Activity.LiveRegion>{allDone ? 'All pairs matched' : announcement}</Activity.LiveRegion>
    </div>
  );

  return (
    <LanguageActivity
      title={title}
      prompt={prompt}
      objectives={objectives}
      progress={<Activity.ItemProgress done={matched.size} total={items.length} label="All matched" />}
      footer={hintList?.length ? <HintLadder hints={hints} /> : undefined}
    >
      {figure}
    </LanguageActivity>
  );
}
