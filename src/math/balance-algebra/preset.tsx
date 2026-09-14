'use client';

/**
 * Balance-scale algebra flagship, a SceneDoc FACTORY (a general tool for any
 * a·x + b = c), built on @classytic/stage. All "logic" is typed numeric
 * derivations that actually evaluate: L = a·x+b (linop), diff = L−R, tilt =
 * clamp(3·diff), balanced = (diff == 0). Solving the equation == balancing.
 */

import { useMemo, type ReactNode } from 'react';
import {
  Scene,
  resolve,
  useEditor,
  controlsFromScene,
  useControlSurface,
  registerAsset,
  type SceneDoc,
} from '@classytic/stage';
import { BALANCE_ALGEBRA_ASSET } from './asset.js';
import { Slider, StatusPill } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { Activity } from '../../kit/activity.js';
import { useCheckpoint, Feedback } from '../../kit/pedagogy.js';

registerAsset('balance-algebra', BALANCE_ALGEBRA_ASSET);
export { BALANCE_ALGEBRA_ASSET };

export interface BalanceEquation {
  coef: number;
  addend: number;
  rhs: number;
  answer: number;
}

export function balanceAlgebraDoc(eq: BalanceEquation): SceneDoc {
  const maxX = Math.max(8, eq.answer + 2);
  const start = Math.min(maxX, Math.max(0, Math.round(eq.answer / 2) || 1));
  return {
    schemaVersion: 2,
    type: 'stage-scene',
    view: { xMin: -5, xMax: 5, yMin: -1.55, yMax: 1.6 },
    elements: [
      {
        id: 'x',
        kind: 'scalar',
        label: 'x',
        a11y: { label: 'unknown x' },
        free: { value: start, min: 0, max: maxX, step: 1 },
      },
      {
        id: 'L',
        kind: 'scalar',
        def: { op: 'linop', terms: [{ coef: eq.coef, in: { ref: 'x' } }], const: eq.addend },
      },
      { id: 'R', kind: 'scalar', def: { op: 'linop', terms: [], const: eq.rhs } },
      {
        id: 'diff',
        kind: 'scalar',
        def: {
          op: 'linop',
          terms: [
            { coef: 1, in: { ref: 'L' } },
            { coef: -1, in: { ref: 'R' } },
          ],
        },
      },
      { id: 'tiltRaw', kind: 'scalar', def: { op: 'linop', terms: [{ coef: 3, in: { ref: 'diff' } }] } },
      { id: 'tilt', kind: 'scalar', def: { op: 'clamp', in: { ref: 'tiltRaw' }, min: -14, max: 14 } },
      {
        id: 'balanced',
        kind: 'boolean',
        def: { op: 'compare', a: { ref: 'diff' }, b: 0, cmp: 'eq', eps: 0.001 },
      },
      {
        id: 'scale',
        kind: 'asset',
        def: {
          op: 'asset',
          asset: 'balance-algebra',
          params: { pivot: { x: 0, y: 0.4 }, arm: 3.3, coef: eq.coef, addend: eq.addend, rhs: eq.rhs },
          bind: { x: { ref: 'x' }, tilt: { ref: 'tilt' }, balanced: { ref: 'balanced' } },
        },
      },
    ],
    bindings: [],
    meta: {
      pedagogy: {
        objectives: ['Solve a linear equation a·x + b = c by keeping a balance level'],
        misconceptions: [
          {
            trigger: 'sets x so one side is heavier',
            note: 'doing a thing to one side only, both sides must stay equal',
          },
        ],
        hints: ['What single value of x makes both pans weigh the same?', `Try x = ${eq.answer}.`],
        difficulty: 2,
        successCriteria: 'The beam is level (left load = right load).',
      },
    },
  };
}

export interface BalanceAlgebraProps {
  coef?: number;
  addend?: number;
  rhs?: number;
  answer?: number;
  title?: string;
  prompt?: string;
  controlId?: string;
  height?: number;
}

export function BalanceAlgebraLab({
  coef = 2,
  addend = 1,
  rhs = 7,
  answer = 3,
  title = 'Balance-scale algebra',
  prompt,
  controlId,
  height = 280,
}: BalanceAlgebraProps): ReactNode {
  const initial = useMemo(
    () => balanceAlgebraDoc({ coef, addend, rhs, answer }),
    [coef, addend, rhs, answer],
  );
  const { editor, doc } = useEditor(initial);
  const resolved = resolve(doc);

  const x = Number(resolved.values.get('x') ?? 0);
  const L = Number(resolved.values.get('L') ?? 0);
  const R = Number(resolved.values.get('R') ?? 0);
  const balanced = resolved.values.get('balanced') === true;
  const maxX = Math.max(8, answer + 2);

  const controls = useMemo(
    () => controlsFromScene(editor, [{ id: 'x', name: 'x', min: 0, max: maxX, step: 1 }]),
    [editor, maxX],
  );
  useControlSurface(controlId, controls);

  useCheckpoint({ solved: balanced, activity: `solve-${coef}x+${addend}=${rhs}`, response: String(x) });

  const setX = (v: number): void => {
    editor.dispatch({ op: 'mutate', id: 'x', patch: { free: { value: v } } });
  };
  const eqLabel = `${coef === 1 ? '' : coef}x${addend ? ` + ${addend}` : ''} = ${rhs}`;

  // diff = L − R drives the tilt. diff > 0 → left heavier → x is too big.
  // diff < 0 → right heavier → x is too small. The hint reasons FROM the scale.
  const diff = L - R;
  const solution = coef !== 0 ? (rhs - addend) / coef : NaN;
  const solutionStr = Number.isInteger(solution) ? String(solution) : solution.toFixed(2);
  const hint = balanced
    ? `Solved. x = (c − b) / a = (${rhs} − ${addend}) / ${coef} = ${solutionStr}`
    : diff > 0
      ? `Left side is heavier (${L} > ${R}): make x smaller.`
      : `Right side is heavier (${L} < ${R}): make x bigger.`;

  const figure = (
    <>
      <Scene
        doc={doc}
        interactive={false}
        showGrid={false}
        showAxes={false}
        height={height}
        ariaLabel={`Balance scale for ${eqLabel}`}
      />
    </>
  );

  const controlBar = (
    <div className="lab-activity-fields">
      <Field label={eqLabel} value={<strong>x = {x}</strong>}>
        <Slider value={x} min={0} max={maxX} step={1} onChange={setX} ariaLabel="value of x" />
      </Field>
      <span className="lab-numeric-tertiary">
        left {L} · right {R}
      </span>
      <StatusPill ok={balanced}>{balanced ? '✓ Balanced, solved!' : 'Not balanced'}</StatusPill>
      <Feedback ok={balanced} okText={`Balanced. x = (c − b) / a = ${solutionStr}`} tryText={hint} />
    </div>
  );

  return (
    <Activity.Root className="math-balance-algebra-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Linear equations"
          title={title}
          description={prompt ?? `Adjust x until both sides of ${eqLabel} balance.`}
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{balanced ? 'Balanced' : 'Compare both sides'}</strong>
        <span>x {x}</span>
        <span>left {L}</span>
        <span>right {R}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Equation balance scale">{figure}</Activity.Canvas>
        <Activity.Inspector label="Equation and balance evidence">{controlBar}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>{hint}</div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {balanced ? `Balanced. x equals ${x}. ${hint}` : `Left load ${L}, right load ${R}. ${hint}`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{balanced ? 'Equation solved' : 'Level the beam'}</strong>
          <span>{eqLabel}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
