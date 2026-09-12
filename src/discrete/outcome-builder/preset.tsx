'use client';

/**
 * OutcomeBuilderLab, "where do the possibilities come from?" Build a sample space
 * one stage at a time: add a coin or a die and watch the list of ALL outcomes
 * fan out, with the counting principle spelled out (2 × 2 × 6 = 24). Each outcome
 * is drawn with the real coin/dice glyphs, so the abstract "sample space" is a
 * concrete board you can point at. Click outcomes to mark an EVENT and read its
 * probability as favourable ÷ total, the definition, built by hand.
 *
 * Pure enumeration (cartesian product of the per-stage option lists); P uses the
 * gcd from the discrete kernel for a reduced fraction.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CoinGlyph, DiceGlyph } from '../../kit/probability.js';
import { cartesianProduct, gcd } from '../core/combinatorics.js';
import { RotateCcw } from 'lucide-react';
import { ActionButton, IconButton } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import {
  useHints,
  HintLadder,
  useCheckpoint,
  useChallenge,
  ChallengeCard,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

type StageKind = 'coin' | 'die';
export interface OutcomeBuilderProps {
  stages?: StageKind[];
  maxOutcomes?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

interface Item {
  kind: StageKind;
  val: string | number;
}
const OPTIONS: Record<StageKind, (string | number)[]> = { coin: ['H', 'T'], die: [1, 2, 3, 4, 5, 6] };

const ItemGlyph = ({ it, size = 26 }: { it: Item; size?: number }): ReactNode => (
  <svg className="probability-glyph" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
    {it.kind === 'coin' ? (
      <CoinGlyph cx={size / 2} cy={size / 2} r={size * 0.42} face={String(it.val)} />
    ) : (
      <DiceGlyph x={size * 0.1} y={size * 0.1} size={size * 0.8} value={Number(it.val)} />
    )}
  </svg>
);

export function OutcomeBuilderLab({
  stages: stages0 = ['coin', 'coin'],
  maxOutcomes = 72,
  title = 'Build the sample space',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: OutcomeBuilderProps): ReactNode {
  const [stages, setStages] = useState<StageKind[]>(stages0);
  const [fav, setFav] = useState<Set<string>>(new Set());
  const hints = useHints(hintList);
  const transferQuestions = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'new-die-factor',
        prompt: 'If you add one fair die to an existing experiment, what happens to the number of outcomes?',
        choices: [
          { value: 'times-six', label: 'it is multiplied by 6' },
          { value: 'plus-six', label: '6 outcomes are added' },
          { value: 'unchanged', label: 'it stays unchanged' },
        ],
        answer: 'times-six',
        explain: 'Every existing outcome branches into six new outcomes—one for each die face.',
      },
    ],
    [],
  );
  const challenge = useChallenge(transferQuestions);

  const outcomes = useMemo(() => {
    return cartesianProduct(stages.map((stage) => OPTIONS[stage].map((val) => ({ kind: stage, val }))));
  }, [stages]);

  const total = stages.reduce((a, s) => a * OPTIONS[s].length, 1);
  const tooMany = total > maxOutcomes;
  const key = (o: Item[]): string => o.map((it) => `${it.kind[0]}${it.val}`).join('');

  const add = (k: StageKind): void => {
    if (total * OPTIONS[k].length <= maxOutcomes * 4) {
      setStages((s) => [...s, k]);
      setFav(new Set());
    }
  };
  const removeStage = (): void => {
    setStages((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setFav(new Set());
  };
  const reset = (): void => {
    setStages(stages0);
    setFav(new Set());
    challenge.reset();
  };
  const toggle = (k: string): void =>
    setFav((f) => {
      const n = new Set(f);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const favCount = fav.size;
  const g = favCount > 0 ? gcd(favCount, total) : 1;
  useCheckpoint({
    solved: favCount > 0 && challenge.allCorrect,
    activity: `outcome-builder:${title}`,
    hintsUsed: hints.count,
  });

  useControlSurface(controlId, {
    addCoin: { type: 'action', label: 'add a coin', invoke: () => add('coin') },
    addDie: { type: 'action', label: 'add a die', invoke: () => add('die') },
    remove: { type: 'action', label: 'remove last stage', invoke: removeStage },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const figure = (
    <>
      {/* counting principle */}
      <div className="outcome-product">
        {stages.map((s, i) => (
          <span key={i} className="outcome-factor">
            {i > 0 && <span className="outcome-operator">×</span>}
            <span className="outcome-factor-value">{OPTIONS[s].length}</span>
            <span className="outcome-factor-label">({s})</span>
          </span>
        ))}
        {stages.length > 0 && (
          <>
            <span className="outcome-operator">=</span>
            <span className="outcome-total">{total}</span>
            <span className="outcome-total-label">outcomes</span>
          </>
        )}
      </div>

      {/* the sample space */}
      {tooMany ? (
        <p className="outcome-overflow-note">
          That's <b>{total}</b> equally-likely outcomes, too many to draw. The counting principle still gives
          the count without listing them all.
        </p>
      ) : (
        <div className="outcome-space" role="group" aria-label="Selectable sample-space outcomes">
          {outcomes.map((o) => {
            const k = key(o);
            const on = fav.has(k);
            return (
              <Button
                key={k}
                className="outcome-option"
                type="button"
                variant="outline"
                onClick={() => toggle(k)}
                aria-pressed={on}
                aria-label={`outcome ${o.map((item) => item.val).join(', ')}`}
              >
                {o.map((it, i) => (
                  <ItemGlyph key={i} it={it} size={24} />
                ))}
              </Button>
            );
          })}
        </div>
      )}
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <ActionButton onClick={() => add('coin')} disabled={total * 2 > maxOutcomes * 4}>
        Add coin
      </ActionButton>
      <ActionButton onClick={() => add('die')} disabled={total * 6 > maxOutcomes * 4}>
        Add die
      </ActionButton>
      <ActionButton onClick={removeStage} disabled={stages.length <= 1}>
        Remove stage
      </ActionButton>
      <ActionButton onClick={() => setFav(new Set())} disabled={favCount === 0}>
        Clear event
      </ActionButton>
    </div>
  );

  const evidence = (
    <div className="probability-inspector" data-tone={favCount > 0 ? 'success' : undefined}>
      {favCount > 0 ? (
        <span className="outcome-probability">
          <Tex tex={`P(\\text{event}) = ${favCount}/${total}`} />
          {g > 1 && (
            <span className="discrete-muted">
              {' '}
              <Tex tex={`= ${favCount / g}/${total / g}`} />
            </span>
          )}{' '}
          <Tex tex={`= ${(favCount / total).toFixed(3)}`} />
        </span>
      ) : (
        <span className="discrete-muted">
          Click outcomes to mark an event → its probability is favourable ÷ {total}.
        </span>
      )}
      {controls}
    </div>
  );

  return (
    <Activity.Root className="discrete-outcome-builder-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Counting principle"
          title={title}
          description={
            prompt ??
            'Add independent stages, enumerate their outcomes, then mark any event directly on the resulting sample space.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {stages.map((stage) => OPTIONS[stage].length).join(' × ')} = {total}
        </strong>
        <span>{stages.length} stages</span>
        <span>{favCount} event outcomes</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Constructed sample space">{figure}</Activity.Canvas>
        <Activity.Inspector label="Experiment stages and event probability">{evidence}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {favCount
            ? `The marked event contains ${favCount} of ${total} outcomes, giving probability ${favCount / g}/${total / g}.`
            : tooMany
              ? `The product still counts all ${total} outcomes even when drawing every outcome is no longer useful.`
              : 'Each added independent stage branches every existing outcome into all of that stage’s possibilities.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Predict the next sample-space branch">
        <ChallengeCard questions={transferQuestions} state={challenge} title="Predict the next branch" />
        <HintLadder hints={hints} />
      </section>
      <Activity.LiveRegion>
        {favCount} of {total} outcomes selected; event probability {favCount}/{total}.
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset outcome builder" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state" aria-live="polite">
          <strong>{favCount ? 'Event defined' : 'Build and mark an event'}</strong>
          <span>{total} outcomes</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
