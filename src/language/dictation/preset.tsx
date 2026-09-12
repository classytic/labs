'use client';

/**
 * DictationLab, "hear it, write it": play a word or phrase, the learner TYPES what
 * they heard. Trains listening + spelling together, the hardest, highest-transfer
 * combination (and the one Bangla speakers most lack, e.g. the silent -e, the -ed
 * ending, doubled letters). Answers are checked forgivingly (case + trailing
 * punctuation ignored). A "show spelling" peek is always available.
 *
 * Data-driven off the shared `Deck`; audio is an uploaded clip or the browser voice.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CheckButton, StatusPill } from '../../kit/controls.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Activity } from '../../kit/activity.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { speak, type Deck } from '../deck.js';
import { ListenButton } from '../ui.js';
import { LanguageActivity, LanguageAdvance } from '../activity.js';
import { dirFor } from '../deck.js';

export interface DictationProps {
  deck: Deck;
  /** Show the meaning as a hint under the input. Default false. */
  showMeaning?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const norm = (s: string, locale: string): string =>
  s
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase(locale)
    .replace(/[.,!?;:"']+$/g, '')
    .replace(/\s+/g, ' ');

export function DictationLab({
  deck,
  showMeaning = false,
  title = 'Listen and write',
  prompt = 'Tap play, then type exactly what you hear.',
  objectives,
}: DictationProps): ReactNode {
  const items = deck.items;
  const total = items.length;
  const [round, setRound] = useState(0);
  const [value, setValue] = useState('');
  const [verdict, setVerdict] = useState<null | boolean>(null);
  const [revealed, setRevealed] = useState(false);
  const [listened, setListened] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const answerId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setRound(0);
    setValue('');
    setVerdict(null);
    setRevealed(false);
    setListened(false);
    setSolvedCount(0);
  }, [deck]);

  const target = items[round];
  const allDone = solvedCount >= total && total > 0;
  useCheckpoint({
    solved: allDone,
    activity: 'dictation',
    score: { raw: total, max: total },
  });
  if (!target) return null;

  const solved = verdict === true;
  const isLast = round === total - 1;

  const check = (): void => {
    if (solved) return;
    const ok = norm(value, deck.termLang) === norm(target.term, deck.termLang);
    setVerdict(ok);
    if (ok) setSolvedCount((s) => Math.min(total, s + 1));
  };
  const next = (): void => {
    const nr = Math.min(total - 1, round + 1);
    setRound(nr);
    setValue('');
    setVerdict(null);
    setRevealed(false);
    setListened(speak(items[nr]!, deck.termLang));
    inputRef.current?.focus();
  };

  const figure = (
    <div className="lang-lab lang-dictation-card">
      <div className="lang-dictation-toolbar">
        <ListenButton
          item={target}
          lang={deck.termLang}
          label={listened ? 'Play again' : 'Listen'}
          onPlay={() => setListened(true)}
        />
        <span>Play it again whenever you need.</span>
      </div>
      <div className="lang-dictation-answer">
        <label htmlFor={answerId}>Your answer</label>
        <span className="lang-dictation-input-row">
          <Input
            id={answerId}
            ref={inputRef}
            className="lab-input"
            value={value}
            placeholder="Type what you hear"
            disabled={solved || !listened}
            dir={dirFor(deck.termLang)}
            lang={deck.termLang}
            onChange={(e) => {
              setValue(e.currentTarget.value);
              setVerdict(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) check();
            }}
          />
          {!solved ? (
            <CheckButton onClick={check} disabled={!listened || !value.trim()}>
              Check
            </CheckButton>
          ) : null}
        </span>
      </div>
      <div className="lang-dictation-foot">
        {verdict === false ? (
          <StatusPill ok={false} role="status">
            Not quite, listen again
          </StatusPill>
        ) : null}
        {!solved ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="lab-reveal-btn"
            onClick={() => setRevealed(true)}
          >
            Show spelling
          </Button>
        ) : null}
        {revealed && !solved ? (
          <span className="lang-reveal" lang={deck.termLang} dir={dirFor(deck.termLang)}>
            {target.term}
          </span>
        ) : null}
      </div>
      {solved ? (
        <p className="lang-why" data-state="ok" aria-live="polite">
          <span lang={deck.termLang} dir={dirFor(deck.termLang)}>
            ✓ {target.term}
          </span>
          {showMeaning ? <span lang={deck.transLang}> = {target.translation}</span> : null}
        </p>
      ) : null}
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
