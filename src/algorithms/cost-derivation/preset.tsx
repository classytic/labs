'use client';

/**
 * Three derivations, drawn. Where a running time comes FROM.
 *
 * A learner can recognise O(n log n) and still not be able to produce it, and producing
 * it is what the exam asks. Each mode draws the one picture that makes a formula
 * obvious, and the formula is shown beside the picture rather than instead of it:
 *
 *   nested     the triangle of comparisons, paired end to end into n(n-1)/2
 *   halving    the chain down to 1, counted, so 2^k = n and k = log2 n
 *   recursion  the tree, whose every level does the same n work
 *
 * The slider is the argument. Drag n and the picture redraws with the count, so the
 * formula is something a learner watched hold rather than something they were given.
 */

import { useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, LiveRegion } from '../../kit/frame.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { FigText, Figure, HUE, STROKE, tint } from '../../kit/figure/index.js';
import {
  halvingChain,
  halvingSteps,
  readout,
  recursionLevels,
  triangleRows,
  trianglePairs,
  triangleTotal,
  type CostMode,
} from './core.js';

export interface CostDerivationProps {
  mode?: CostMode;
  /** Items. Small by default: the triangle has to be countable before it is trusted. */
  n?: number;
  title?: string;
  prompt?: string;
}

const W = 460;
const H = 200;

const MODES: { value: CostMode; label: string }[] = [
  { value: 'nested', label: 'Two loops' },
  { value: 'halving', label: 'Halving' },
  { value: 'recursion', label: 'Divide' },
];

/**
 * One question per mode. A single shared question asked about halving while the figure
 * drew a triangle, which is exactly the disconnect this lab exists to close.
 */
const QUESTIONS: Record<CostMode, ChallengeQuestion[]> = {
  nested: [
    {
      id: 'why-n-squared',
      prompt: 'The rows of comparisons are n−1, n−2, down to 1. Why does that add up to about n²/2?',
      choices: [
        { value: 'pair', label: 'Pairing the ends gives n each time, and there are about n/2 pairs' },
        { value: 'longest', label: 'Because the longest row has n−1 in it' },
        { value: 'rows', label: 'Because there are n rows' },
        { value: 'double', label: 'Because each item is compared twice' },
      ],
      answer: 'pair',
      explain:
        'First row plus last is (n−1) + 1 = n. Second plus second-last is (n−2) + 2 = n. About n/2 pairs, each worth n, so n²/2. The exact total is n(n−1)/2, and the /2 is dropped at the end.',
    },
  ],
  halving: [
    {
      id: 'where-log-comes-from',
      prompt: 'Halving 1000 items down to 1 takes about ten steps. Where does the ten come from?',
      choices: [
        { value: 'log', label: '1000 is about 2^10, so ten halvings undo it' },
        { value: 'root', label: 'It is roughly the square root of 1000' },
        { value: 'tenth', label: 'Each step removes a tenth of the data' },
        { value: 'guess', label: 'It is measured, not calculated' },
      ],
      answer: 'log',
      explain:
        'Each halving divides by 2, so after k steps you have n / 2^k left. Reaching 1 means 2^k = n, and k = log₂ n. For 1000 that is just under 10, because 2^10 = 1024.',
    },
  ],
  recursion: [
    {
      id: 'why-n-log-n',
      prompt: 'Going down the tree, the calls double while each handles half as much. What does that do to the work on each level?',
      choices: [
        { value: 'same', label: 'It stays about the same, roughly n on every level' },
        { value: 'doubles', label: 'It doubles, because the calls double' },
        { value: 'halves', label: 'It halves, because the pieces halve' },
        { value: 'grows', label: 'It grows as n², because both change at once' },
      ],
      answer: 'same',
      explain:
        'Twice as many calls, each doing half as much, multiply back to the same n. So the total is n per level times the number of levels, and the number of levels is the halving count log₂ n. That is n log n.',
    },
  ],
};

export function CostDerivationLab({
  mode: startMode = 'nested',
  n: startN = 8,
  title,
  prompt,
}: CostDerivationProps = {}): ReactNode {
  const [mode, setMode] = useState<CostMode>(startMode);
  const [n, setN] = useState(Math.max(2, Math.min(64, startN)));
  const questions = QUESTIONS[mode];
  const challenge = useChallenge(questions);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'cost-derivation' });

  const read = readout(mode, n);

  const figure = (
    <Figure viewBox={[W, H]} domain="math" label={`${mode} cost derivation for ${n} items`}>
      {mode === 'nested' && <Triangle n={n} />}
      {mode === 'halving' && <Halving n={n} />}
      {mode === 'recursion' && <Tree n={n} />}
    </Figure>
  );

  return (
    <Activity.Root className="algorithms-cost-derivation">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Where the cost comes from"
          title={title ?? 'Deriving a running time'}
          description={prompt ?? 'Count the picture, then read the formula it forces. Drag n and watch both move together.'}
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Workspace>
        <Activity.Canvas label="Cost derivation">{figure}</Activity.Canvas>
        <Activity.Dock>
          {/* No Readout cards: the figure states the count, the formula and the growth
              class already, and repeating them cost the picture a third of the frame. */}
          <Field label="method">
            <Segmented value={mode} options={MODES} onChange={(v) => setMode(v)} ariaLabel="which derivation" />
          </Field>
          <Field label="items" value={String(n)}>
            <Slider
              value={n}
              min={2}
              max={64}
              step={1}
              onChange={setN}
              ariaLabel="number of items"
              valueText={`${n} items`}
            />
          </Field>
        </Activity.Dock>
      </Activity.Workspace>

      <ChallengeCard questions={questions} state={challenge} />

      <Activity.Feedback>
        <span>What to notice</span>
        <div>
          Every one of these drops its constants at the end. Half of n² is still n², because doubling
          the data still quadruples the work, and that is the only thing the growth class promises.
        </div>
      </Activity.Feedback>

      <LiveRegion>{`${read.steps} steps for ${n} items, which is ${read.formula}, or ${read.bigO}.`}</LiveRegion>
    </Activity.Root>
  );
}

// ── nested loops: the triangle, and the pairing that collapses it ───────────

function Triangle({ n }: { n: number }): ReactNode {
  const rows = triangleRows(n);
  const maxRows = rows.length;
  const cell = Math.max(3, Math.min(12, 150 / Math.max(maxRows, 1)));
  const x0 = 26;
  const y0 = 30;
  const pairs = trianglePairs(n);
  const firstPair = pairs[0];
  return (
    <>
      <FigText x={x0} y={18} size="label" tone="soft" anchor="start">
        one dot per comparison
      </FigText>
      {rows.map((len, r) => (
        <g key={r}>
          {Array.from({ length: len }, (_, c) => (
            <circle
              key={c}
              cx={x0 + c * cell + cell / 2}
              cy={y0 + r * cell + cell / 2}
              r={Math.max(1.2, cell * 0.28)}
              fill={r === 0 || r === maxRows - 1 ? HUE[2] : tint(HUE[1], 55)}
            />
          ))}
        </g>
      ))}
      {/* The pairing argument: top row plus bottom row is always n. */}
      {firstPair && maxRows > 1 && (
        <FigText x={x0 + 160} y={y0 + 14} size="label" anchor="start">
          {`${firstPair.a} + ${firstPair.b} = ${firstPair.sum}`}
        </FigText>
      )}
      <FigText x={x0 + 160} y={y0 + 38} size="label" tone="soft" anchor="start">
        every pair of rows sums to n
      </FigText>
      <FigText x={x0 + 160} y={y0 + 74} size="measure" anchor="start">
        {triangleTotal(n).toLocaleString()}
      </FigText>
      <FigText x={x0 + 160} y={y0 + 98} size="label" tone="soft" anchor="start">
        = n(n − 1) / 2
      </FigText>
      <FigText x={x0 + 160} y={y0 + 126} size="label" tone="hue-2" anchor="start">
        grows like n²
      </FigText>
    </>
  );
}

// ── halving: the chain, and the k that solves 2^k = n ───────────────────────

function Halving({ n }: { n: number }): ReactNode {
  const chain = halvingChain(n);
  const k = halvingSteps(n);
  const unit = 300 / Math.max(chain[0] ?? 1, 1);
  const rowH = Math.max(10, Math.min(22, 170 / chain.length));
  return (
    <>
      <FigText x={26} y={18} size="label" tone="soft" anchor="start">
        what is left after each halving
      </FigText>
      {chain.map((size, i) => (
        <g key={i}>
          <rect
            x={26}
            y={28 + i * rowH}
            width={Math.max(2, size * unit)}
            height={rowH - 4}
            rx={2}
            fill={i === chain.length - 1 ? HUE[2] : tint(HUE[1], 60 - i * 4)}
          />
          <FigText x={20} y={28 + i * rowH + rowH / 2 + 3} size="label" tone="soft" anchor="end">
            {String(size)}
          </FigText>
        </g>
      ))}
      <FigText x={346} y={54} size="label" anchor="start">
        {`n / 2^k = 1`}
      </FigText>
      <FigText x={346} y={76} size="label" anchor="start">
        {`2^k = ${n}`}
      </FigText>
      <FigText x={346} y={108} size="measure" anchor="start">
        {String(k)}
      </FigText>
      <FigText x={346} y={130} size="label" tone="soft" anchor="start">
        {`k = log₂ n`}
      </FigText>
      <FigText x={346} y={156} size="label" tone="hue-2" anchor="start">
        grows like log n
      </FigText>
    </>
  );
}

// ── divide and conquer: every level does the same work ─────────────────────

function Tree({ n }: { n: number }): ReactNode {
  const levels = recursionLevels(n);
  // Sized to the space that is LEFT once the two summary lines below are reserved.
  // Fixed row heights pushed those lines past the frame at six levels, so the
  // conclusion ("n x log2 n") fell off the bottom of the derivation that earns it.
  const BOTTOM = 46;
  const rowH = Math.max(9, Math.min(24, (H - 34 - BOTTOM) / levels.length));
  return (
    <>
      <FigText x={26} y={18} size="label" tone="soft" anchor="start">
        twice the calls, each half the size
      </FigText>
      {levels.map((lv) => {
        const boxes = Math.min(lv.calls, 16);
        const w = 260 / boxes;
        return (
          <g key={lv.depth}>
            {Array.from({ length: boxes }, (_, i) => (
              <rect
                key={i}
                x={26 + i * w + 1}
                y={28 + lv.depth * rowH}
                width={Math.max(1.5, w - 2)}
                height={rowH - 5}
                rx={2}
                fill={tint(HUE[1], 30 + lv.depth * 8)}
              />
            ))}
            {/* The observation the whole derivation rests on. */}
            <FigText x={296} y={28 + lv.depth * rowH + rowH / 2 + 2} size="label" tone="soft" anchor="start">
              {`${lv.calls} × ${Math.round(lv.sizeEach)} = ${Math.round(lv.workHere)}`}
            </FigText>
          </g>
        );
      })}
      <line
        x1={288}
        y1={26}
        x2={288}
        y2={28 + levels.length * rowH}
        stroke={HUE.soft}
        strokeWidth={STROKE.hair}
      />
      <FigText x={26} y={28 + levels.length * rowH + 18} size="label" anchor="start">
        {`${levels.length - 1} levels, about ${n} work on each`}
      </FigText>
      <FigText x={26} y={28 + levels.length * rowH + 38} size="label" tone="hue-2" anchor="start">
        n × log₂ n
      </FigText>
    </>
  );
}
