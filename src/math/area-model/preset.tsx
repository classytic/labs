'use client';

/**
 * Area-model algebra tiles, a SceneDoc FACTORY for (x+a)(x+b), built on
 * @classytic/stage. Two modes share ONE asset:
 *  - EXPAND: drag x and watch x² + (a+b)x + ab; strips grow with x, the
 *    constant block does not, the multiplication made visible.
 *  - FACTOR: given x² + px + q, find a and b (steppers + Check). The unique
 *    positive factor pair {a,b} makes the check unambiguous (swap accepted).
 */

import { useMemo, useState, type ReactNode } from 'react';
import {
  Scene, resolve, useEditor, controlsFromScene, useControlSurface, registerAsset,
  type SceneDoc,
} from '@classytic/stage';
import { AREA_MODEL_ASSET } from './asset.js';
import { Tex } from '../../core/tex.js';
import { LabStyles, Stepper, CheckButton, StatusPill, Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, ControlExpr, Field, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint, useChallenge, ChallengeCard, type ChallengeQuestion } from '../../kit/pedagogy.js';

registerAsset('area-model', AREA_MODEL_ASSET);
export { AREA_MODEL_ASSET };

const MAX_X = 3.5;

export interface AreaModelProps {
  a?: number;
  b?: number;
  mode?: 'expand' | 'factor';
  unit?: number;
  controlId?: string;
  height?: number;
}

export function areaModelDoc({ a = 3, b = 2, mode = 'expand', unit = 1 }: AreaModelProps): SceneDoc {
  const factor = mode === 'factor';
  const totalW = MAX_X + a * unit;
  const totalH = MAX_X + b * unit;
  return {
    schemaVersion: 2,
    type: 'stage-scene',
    view: { xMin: -1.4, xMax: totalW + 1, yMin: -1.6, yMax: totalH + 0.8 },
    elements: [
      { id: 'x', kind: 'scalar', label: 'x', a11y: { label: 'side length x' }, free: { value: 2, min: 0.5, max: MAX_X, step: 0.25 } },
      { id: 'revealed', kind: 'scalar', free: { value: factor ? 0 : 1 } },
      { id: 'solved', kind: 'scalar', free: { value: 0 } },
      {
        id: 'area',
        kind: 'asset',
        def: { op: 'asset', asset: 'area-model', params: { origin: { x: 0, y: 0 }, a, b, unit, mode: factor ? 1 : 0 }, bind: { x: { ref: 'x' }, revealed: { ref: 'revealed' }, solved: { ref: 'solved' } } },
      },
    ],
    bindings: [],
  };
}

const expandLabel = (a: number, b: number): string => `(x + ${a})(x + ${b}) = x² + ${a + b}x + ${a * b}`;
const trinomialLabel = (a: number, b: number): string => `x² + ${a + b}x + ${a * b}`;

export function AreaModelLab({ a = 3, b = 2, mode = 'expand', unit = 1, controlId, height = 380 }: AreaModelProps): ReactNode {
  const initial = useMemo(() => areaModelDoc({ a, b, mode, unit }), [a, b, mode, unit]);
  const { editor, doc } = useEditor(initial);
  const resolved = resolve(doc);
  const x = Number(resolved.values.get('x') ?? 2);

  const controls = useMemo(() => controlsFromScene(editor, [{ id: 'x', name: 'x', min: 0.5, max: MAX_X, step: 0.25 }]), [editor]);
  useControlSurface(controlId, controls);
  const setX = (v: number): void => { editor.dispatch({ op: 'mutate', id: 'x', patch: { free: { value: v } } }); };

  const [ga, setGa] = useState(1);
  const [gb, setGb] = useState(1);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const p = a + b;
  const q = a * b;

  // Predict-first gate: commit to the middle coefficient before the expansion is shown.
  const predictQ = useMemo<ChallengeQuestion[]>(() => {
    const sum = a + b;        // correct middle coefficient
    const product = a * b;    // common wrong answer (the constant term)
    const lure = sum + 1;     // one more plausible number
    const values = Array.from(new Set([sum, product, lure])).sort((m, n) => m - n);
    return [{
      id: 'middle-coeff',
      prompt: `(x + ${a})(x + ${b}) expands to x² + ?x + ?. What is the MIDDLE coefficient?`,
      choices: values.map((v) => ({ value: String(v), label: String(v) })),
      answer: String(sum),
      explain: `The middle term is a+b=${sum} (the sum), and the constant is a·b=${product} (the product) — the area-model's two off-diagonal tiles vs the corner tile.`,
    }];
  }, [a, b]);
  const ch = useChallenge(predictQ);

  useCheckpoint({ solved: result === 'correct' && ch.allCorrect, activity: `factor-x2+${p}x+${q}`, response: `(x+${ga})(x+${gb})` });

  const check = (): void => {
    const ok = ga + gb === p && ga * gb === q;
    setResult(ok ? 'correct' : 'wrong');
    editor.dispatch({ op: 'mutate', id: 'revealed', patch: { free: { value: ok ? 1 : 0 } } });
    editor.dispatch({ op: 'mutate', id: 'solved', patch: { free: { value: ok ? 1 : 0 } } });
  };

  if (mode === 'factor') {
    const figure = (
      <>
        <LabStyles />
        <Scene doc={doc} interactive={false} showGrid={false} showAxes={false} height={height} ariaLabel={`Area model to factor ${trinomialLabel(a, b)}`} />
      </>
    );
    const controlBar = (
      <ControlBar>
        {/* one tight inline expression so the parens/steppers/result don't scatter */}
        <ControlExpr>
          <span>(x +</span>
          <Stepper label="a" value={ga} min={0} max={12} onChange={(v) => { setGa(v); setResult(null); }} />
          <span>)(x +</span>
          <Stepper label="b" value={gb} min={0} max={12} onChange={(v) => { setGb(v); setResult(null); }} />
          <span>)</span>
          <span style={{ opacity: 0.7, marginLeft: 4 }}><Tex tex={`\\to x^2 + ${ga + gb}x + ${ga * gb}`} /></span>
        </ControlExpr>
        <CheckButton onClick={check}>Check</CheckButton>
        {result === 'correct' && <StatusPill ok>✓ Correct!</StatusPill>}
        {result === 'wrong' && <StatusPill ok={false}>Not yet, match {p}x and {q}</StatusPill>}
      </ControlBar>
    );
    const footer = (
      <>
        <ChallengeCard questions={predictQ} state={ch} title="Predict first" />
        <LiveRegion>
          {result === 'correct' ? `Correct. The factors are x plus ${a} and x plus ${b}.` : ''}
        </LiveRegion>
      </>
    );
    return (
      <LabFrame title="Area-model factoring" prompt={`Factor ${trinomialLabel(a, b)}: find the two side lengths.`} controls={controlBar} footer={footer}>
        {figure}
      </LabFrame>
    );
  }

  const figure = (
    <>
      <LabStyles />
      <Scene doc={doc} interactive={false} showGrid={false} showAxes={false} height={height} ariaLabel={`Area model for (x + ${a})(x + ${b})`} />
    </>
  );
  const controlBar = (
    <ControlBar>
      <Field label={expandLabel(a, b)} value={<strong>x = {x}</strong>}>
        <Slider value={x} min={0.5} max={MAX_X} step={0.25} onChange={setX} ariaLabel="side length x" />
      </Field>
      <span style={{ opacity: 0.75 }}>area = {((x + a) * (x + b)).toFixed(2)}</span>
    </ControlBar>
  );
  const footer = <ChallengeCard questions={predictQ} state={ch} title="Predict first" />;
  return <LabFrame title="Area-model expansion" controls={controlBar} footer={footer}>{figure}</LabFrame>;
}
