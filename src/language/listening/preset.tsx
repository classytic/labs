'use client';

/**
 * ListeningLab, "listen and choose": play a word or phrase, pick what you heard.
 * The missing receptive skill, most language labs only test READING; this trains
 * the ear (crucial for the English sounds Bangla lacks, e.g. /θ/, /v/, /w/).
 *
 * Data-driven off the shared `Deck`: each round plays one item's audio (uploaded
 * clip, or the browser voice) and shows it among distractors drawn from the same
 * deck. Pick the written word, its meaning, or its picture (`mode`).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { AssessedChoiceGroup } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { dirFor, seededShuffle, speak, type Deck, type DeckItem } from '../deck.js';
import { Icon } from '../icon.js';
import { ListenButton } from '../ui.js';
import { LanguageActivity, LanguageAdvance } from '../activity.js';

export type ListenMode = 'word' | 'meaning' | 'picture';

export interface ListeningProps {
  deck: Deck;
  /** What the OPTIONS show: the target word, its meaning, or its picture. */
  mode?: ListenMode;
  /** Options per round (incl. the answer). Default 4. */
  choices?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

export function ListeningLab({
  deck,
  mode = 'word',
  choices = 4,
  title = 'Listen and choose',
  prompt = 'Tap play, then pick what you hear.',
  objectives,
}: ListeningProps): ReactNode {
  const items = deck.items;
  const total = items.length;
  const [round, setRound] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [listened, setListened] = useState(false);
  useEffect(() => {
    setRound(0);
    setSolvedCount(0);
    setPicked(null);
    setWrong(null);
    setListened(false);
  }, [deck]);

  const target = items[round];
  const allDone = solvedCount >= total && total > 0;
  useCheckpoint({ solved: allDone, activity: 'listening', score: { raw: total, max: total } });
  if (!target) return null;

  // options = the answer + distractors from the same deck, shuffled per round (SSR-safe)
  const n = Math.max(2, Math.min(choices, total));
  const distractors = seededShuffle(
    items.filter((_, i) => i !== round),
    round + 1,
  ).slice(0, n - 1);
  const options = seededShuffle([target, ...distractors], round * 7 + 3);
  const correctIdx = options.indexOf(target);
  const solved = picked !== null && picked === correctIdx;
  const isLast = round === total - 1;

  const pick = (i: number): void => {
    if (solved) return;
    if (i === correctIdx) {
      setPicked(i);
      setWrong(null);
      setSolvedCount((s) => Math.min(total, s + 1));
    } else {
      setPicked(i);
      setWrong(i);
    }
  };
  const next = (): void => {
    const nr = Math.min(total - 1, round + 1);
    setPicked(null);
    setWrong(null);
    setRound(nr);
    setListened(speak(items[nr]!, deck.termLang)); // advancing is a user gesture → safe to autoplay
  };

  const label = (it: DeckItem): ReactNode =>
    mode === 'picture' ? (
      <Icon icon={it.icon ?? '❓'} className="lang-cell-icon" size={36} decorative />
    ) : mode === 'meaning' ? (
      it.translation
    ) : (
      it.term
    );

  const figure = (
    <div className="lang-lab">
      <div className="lang-listen-play">
        <ListenButton
          item={target}
          lang={deck.termLang}
          label={listened ? 'Play again' : 'Play audio'}
          onPlay={() => setListened(true)}
        />
      </div>
      <div className="lang-listening-choices" data-layout={mode}>
        <AssessedChoiceGroup
          value={picked?.toString()}
          onChange={(value) => pick(Number(value))}
          ariaLabel="Choose what you heard"
          options={options.map((item, index) => ({
            value: index.toString(),
            label: label(item),
            disabled: solved || !listened,
            tone:
              index === picked && solved
                ? ('correct' as const)
                : index === wrong
                  ? ('wrong' as const)
                  : undefined,
          }))}
        />
      </div>
      <div aria-live="polite" aria-atomic="true">
        {solved ? (
          <p className="lang-why" data-state="ok">
            <span lang={deck.termLang} dir={dirFor(deck.termLang)}>
              ✓ {target.term}
            </span>{' '}
            ={' '}
            <span lang={deck.transLang} dir={dirFor(deck.transLang)}>
              {target.translation}
            </span>
          </p>
        ) : wrong !== null ? (
          <p className="lang-why" data-state="no">
            That was not the sound. Listen again, then compare another choice.
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <LanguageActivity
      title={title}
      prompt={prompt}
      objectives={objectives}
      progress={<Activity.ItemProgress done={solvedCount} total={total} label="All correct" />}
      controls={
        solved && !isLast ? <LanguageAdvance current={solvedCount} total={total} onNext={next} /> : undefined
      }
    >
      {figure}
    </LanguageActivity>
  );
}
