'use client';

/**
 * Growing pattern → formula, a SceneDoc FACTORY (Brilliant-style visual
 * algebra), built on @classytic/stage. A creator declares the linear rule
 * count(n) = a·n + b; the template GENERATES the figures for n = 1..k and asks
 * the learner to find the rule. A linear rule is fixed by any two points, so
 * agreement on the shown n PLUS a hidden "predict" row (n = k+1) forces the
 * learner to extrapolate the real rule, not memorise the visible counts.
 */

import { useMemo, useState, type ReactNode } from 'react';
import {
  Scene,
  resolve,
  useEditor,
  controlsFromScene,
  useControlSurface,
  registerAsset,
  type SceneDoc,
  type SceneElement,
  type Ref,
} from '@classytic/stage';
import { PATTERN_FIGURE_ASSET } from './asset.js';
import { Stepper, CheckButton, StatusPill, Chip } from '../../kit/controls.js';
import { ControlExpr } from '../../kit/frame.js';
import { Activity } from '../../kit/activity.js';
import { useCheckpoint } from '../../kit/pedagogy.js';

registerAsset('pattern-figure', PATTERN_FIGURE_ASSET);
export { PATTERN_FIGURE_ASSET };

const CELL = 0.5;

export interface GrowingPatternProps {
  a?: number;
  b?: number;
  steps?: number;
  prompt?: string;
  check?: 'steppers' | 'mcq';
  choices?: string[];
  controlId?: string;
  height?: number;
}

const ruleLabel = (a: number, b: number): string => `${a === 1 ? 'n' : `${a}n`}${b ? ` + ${b}` : ''}`;

export function growingPatternDoc({ a = 2, b = 3, steps = 4 }: GrowingPatternProps): SceneDoc {
  const figW = Math.max(a, b, 1) * CELL;
  const gap = CELL * 2;
  const pitch = figW + gap;
  const predictN = steps + 1;
  const ns = Array.from({ length: steps }, (_, i) => i + 1);

  const elements: SceneElement[] = [
    {
      id: 'aGuess',
      kind: 'scalar',
      label: 'a',
      a11y: { label: 'coefficient a' },
      free: { value: 1, min: 0, max: 9, step: 1 },
    },
    {
      id: 'bGuess',
      kind: 'scalar',
      label: 'b',
      a11y: { label: 'constant b' },
      free: { value: 0, min: 0, max: 9, step: 1 },
    },
  ];
  for (const step of ns) {
    elements.push({
      id: `fig${step}`,
      kind: 'asset',
      def: {
        op: 'asset',
        asset: 'pattern-figure',
        params: { n: step, a, b, cell: CELL, origin: { x: (step - 1) * pitch, y: 0 } },
        bind: {},
      },
    });
  }
  for (const step of [...ns, predictN]) {
    elements.push({
      id: `guess${step}`,
      kind: 'scalar',
      def: {
        op: 'linop',
        terms: [
          { coef: step, in: { ref: 'aGuess' } },
          { coef: 1, in: { ref: 'bGuess' } },
        ],
      },
    });
  }

  const totalW = steps * pitch - gap;
  return {
    schemaVersion: 2,
    type: 'stage-scene',
    view: { xMin: -0.6, xMax: totalW + 0.6, yMin: -(CELL * 2.6 + 0.8), yMax: steps * CELL + 0.8 },
    elements,
    bindings: [],
  };
}

export function GrowingPatternLab({
  a = 2,
  b = 3,
  steps = 4,
  prompt = 'Find the rule for the number of tiles.',
  check = 'steppers',
  choices,
  controlId,
  height = 320,
}: GrowingPatternProps): ReactNode {
  const initial = useMemo(() => growingPatternDoc({ a, b, steps }), [a, b, steps]);
  const { editor, doc } = useEditor(initial);
  const resolved = resolve(doc);

  const aGuess = Number(resolved.values.get('aGuess') ?? 1);
  const bGuess = Number(resolved.values.get('bGuess') ?? 0);
  const predictN = steps + 1;
  const ns = Array.from({ length: steps }, (_, i) => i + 1);
  const truth = (k: number): number => a * k + b;

  const controls = useMemo(
    () =>
      controlsFromScene(editor, [
        { id: 'aGuess', name: 'a', min: 0, max: 9, step: 1 },
        { id: 'bGuess', name: 'b', min: 0, max: 9, step: 1 },
      ]),
    [editor],
  );
  useControlSurface(controlId, controls);
  const setScalar = (id: string, v: number): void => {
    editor.dispatch({ op: 'mutate', id, patch: { free: { value: Math.max(0, v) } } });
  };

  const [sel, setSel] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const answer = ruleLabel(a, b);

  const steppersSolved = [...ns, predictN].every((k) => aGuess * k + bGuess === truth(k));
  const matchRow = (k: number): boolean => aGuess * k + bGuess === truth(k);

  useCheckpoint({
    solved: result === 'correct',
    activity: `pattern-${answer}`,
    response: check === 'mcq' ? (sel ?? '') : `${aGuess}n+${bGuess}`,
  });

  const check_ = (): void => {
    const ok = check === 'mcq' ? sel === answer : steppersSolved;
    setResult(ok ? 'correct' : 'wrong');
  };

  const cellState = (ok: boolean | null): 'correct' | 'wrong' | undefined =>
    ok === null ? undefined : ok ? 'correct' : 'wrong';

  const figure = (
    <>
      <Scene
        doc={doc}
        interactive={false}
        showGrid={false}
        showAxes={false}
        height={height}
        ariaLabel={prompt}
      />

      <table className="math-pattern-table">
        <caption>step n → number of tiles</caption>
        <tbody>
          <tr>
            <th>n</th>
            {ns.map((k) => (
              <td key={k} data-state={cellState(check === 'steppers' ? matchRow(k) : null)}>
                {k}
              </td>
            ))}
            <td data-state="future">{predictN}</td>
          </tr>
          <tr>
            <th>tiles</th>
            {ns.map((k) => (
              <td key={k} data-state={cellState(check === 'steppers' ? matchRow(k) : null)}>
                {truth(k)}
              </td>
            ))}
            <td data-state="future">?</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const controlBar = (
    <div className="lab-activity-fields">
      {check === 'steppers' ? (
        <ControlExpr>
          <span>Your rule:</span>
          <Stepper
            label="a"
            value={aGuess}
            min={0}
            max={9}
            onChange={(v) => {
              setScalar('aGuess', v);
              setResult(null);
            }}
          />
          <span>· n&nbsp;+</span>
          <Stepper
            label="b"
            value={bGuess}
            min={0}
            max={9}
            onChange={(v) => {
              setScalar('bGuess', v);
              setResult(null);
            }}
          />
          <span className="lab-numeric-tertiary">
            → <strong>{ruleLabel(aGuess, bGuess)}</strong>
          </span>
        </ControlExpr>
      ) : (
        <div className="lab-choice-grid">
          {(choices ?? []).map((ch) => (
            <Chip
              key={ch}
              selected={sel === ch}
              onClick={() => {
                setSel(ch);
                setResult(null);
              }}
            >
              {ch}
            </Chip>
          ))}
        </div>
      )}
      <CheckButton onClick={check_} disabled={check === 'mcq' && !sel}>
        Check
      </CheckButton>
      {result === 'correct' && <StatusPill ok>✓ Correct, predicts n = {predictN} too!</StatusPill>}
      {result === 'wrong' && <StatusPill ok={false}>Not quite, match every step</StatusPill>}
    </div>
  );

  return (
    <Activity.Root className="math-growing-pattern-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Patterns and sequences"
          title="Find the growing rule"
          description={prompt}
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{result === 'correct' ? 'Rule verified' : 'Build a rule'}</strong>
        <span>{steps} visible steps</span>
        <span>predict n = {predictN}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Growing tile pattern">{figure}</Activity.Canvas>
        <Activity.Inspector label="Rule builder">{controlBar}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Predict</span>
        <div>A rule must reproduce every visible count and the hidden next step, not merely one example.</div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {result === 'correct'
          ? `Correct. The rule is ${answer}.`
          : result === 'wrong'
            ? 'The proposed rule does not match every step.'
            : `Current rule ${ruleLabel(aGuess, bGuess)}.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{result === 'correct' ? 'Pattern solved' : 'Compare every row'}</strong>
          <span>{ruleLabel(aGuess, bGuess)}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
