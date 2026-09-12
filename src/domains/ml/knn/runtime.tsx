'use client';

/**
 * KNNBoundaryLab, the answer to "a line can't split XOR." k-nearest-neighbours
 * paints the whole plane by asking, at every point, "what are my k closest
 * labelled neighbours, and which class wins the vote?" The boundary it carves is
 * CURVY, it shrugs off XOR and even concentric rings that no straight line could
 * touch. Drag the ✦ test point to watch its k neighbours light up and cast their
 * votes; slide k to feel the trade-off: k=1 memorises every island (jagged,
 * overfit), big k smooths everything (and starts ignoring real structure).
 *
 * The decision regions are a CanvasLayer heatmap (one vote per cell, exactly the
 * high-element-count job canvas is for); points + neighbour spokes draw on top.
 */

import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { CanvasLayer, type CoordinateSystem } from '@classytic/stage';
import { mulberry32, gaussian } from '../../../core/rng.js';
import { Segmented, Slider } from '../../../kit/controls.js';
import {
  useHints,
  HintLadder,
  useCheckpoint,
  useChallenge,
  ChallengeCard,
  type ChallengeQuestion,
} from '../../../kit/pedagogy.js';
import { Field, LiveRegion } from '../../../kit/frame.js';
import { MLActivity, MLResetTransport } from '../activity.js';
import { useControlSurface } from '@classytic/stage';

export type KnnDataset = 'blobs' | 'xor' | 'circles';
export interface KnnProps {
  dataset?: KnnDataset;
  k?: number;
  seed?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

interface P {
  x: number;
  y: number;
  cls: 0 | 1;
}
const R = 5,
  A0 = '#1c7ed6',
  A1 = '#e8590c';
const view = { xMin: -R, xMax: R, yMin: -R, yMax: R };
const TRANSFER: ChallengeQuestion[] = [
  {
    id: 'query-vs-model',
    prompt: 'You move only the unlabelled query point. What happens to leave-one-out model accuracy?',
    choices: [
      { value: 'same', label: 'it stays the same' },
      { value: 'up', label: 'it always increases' },
      { value: 'down', label: 'it always decreases' },
    ],
    answer: 'same',
    explain:
      'The query is not part of the labelled training set used for leave-one-out validation. Its local vote can change, while model accuracy changes only when k or the dataset changes.',
  },
];

function makeData(kind: KnnDataset, seed: number): P[] {
  const rng = mulberry32(seed);
  const pts: P[] = [];
  const blob = (cx: number, cy: number, cls: 0 | 1, k: number, sd = 0.8): void => {
    for (let i = 0; i < k; i++) pts.push({ x: gaussian(rng, cx, sd), y: gaussian(rng, cy, sd), cls });
  };
  if (kind === 'blobs') {
    blob(-2, -1.5, 0, 16);
    blob(2, 1.5, 1, 16);
  } else if (kind === 'xor') {
    blob(-2.2, 2.2, 0, 9);
    blob(2.2, -2.2, 0, 9);
    blob(2.2, 2.2, 1, 9);
    blob(-2.2, -2.2, 1, 9);
  } else {
    // concentric: class 1 core, class 0 ring
    for (let i = 0; i < 16; i++) pts.push({ x: gaussian(rng, 0, 0.7), y: gaussian(rng, 0, 0.7), cls: 1 });
    for (let i = 0; i < 22; i++) {
      const a = rng() * Math.PI * 2,
        r = 3.4 + gaussian(rng, 0, 0.3);
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 0 });
    }
  }
  return pts;
}

export function KNNBoundaryLab({
  dataset = 'circles',
  k = 5,
  seed = 7,
  title = 'k-nearest neighbours',
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height = 330,
}: KnnProps): ReactNode {
  const [kind, setKind] = useState<KnnDataset>(dataset);
  const [pts, setPts] = useState<P[]>(() => makeData(dataset, seed));
  const [kk, setKk] = useState(k);
  const [query, setQuery] = useState({ x: 0.6, y: 1.2 });
  const [movedQuery, setMovedQuery] = useState(false);
  const [comparedModel, setComparedModel] = useState(false);
  const hints = useHints(hintList);
  const challenge = useChallenge(TRANSFER);

  // k nearest training points to (x,y) → their indices
  const nearest = useCallback(
    (x: number, y: number, kn: number, exclude = -1): number[] => {
      const d = pts
        .map((p, i) => ({ i, d2: (p.x - x) ** 2 + (p.y - y) ** 2 }))
        .filter((o) => o.i !== exclude);
      d.sort((a, b) => a.d2 - b.d2);
      return d.slice(0, kn).map((o) => o.i);
    },
    [pts],
  );
  const vote = useCallback(
    (idxs: number[]): 0 | 1 => {
      let s = 0;
      for (const i of idxs) s += pts[i]!.cls;
      return s * 2 > idxs.length ? 1 : 0;
    },
    [pts],
  );

  // leave-one-out accuracy (honest k-NN score)
  const acc = useMemo(() => {
    if (!pts.length) return 0;
    let ok = 0;
    for (let i = 0; i < pts.length; i++) if (vote(nearest(pts[i]!.x, pts[i]!.y, kk, i)) === pts[i]!.cls) ok++;
    return ok / pts.length;
  }, [pts, kk, nearest, vote]);

  const qNbrs = nearest(query.x, query.y, kk);
  const qCls = vote(qNbrs);
  const qCount1 = qNbrs.reduce((a, i) => a + pts[i]!.cls, 0);
  useCheckpoint({
    solved: movedQuery && comparedModel && challenge.allCorrect,
    activity: `knn:${title}`,
    hintsUsed: hints.count,
  });

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, c: CoordinateSystem) => {
      const css = getComputedStyle(ctx.canvas);
      const tok = (s: string, fb: string): string => css.getPropertyValue(s).trim() || fb;
      const fg = tok('--stage-fg', '#222'),
        bg = tok('--stage-bg', '#fff');
      const W = ctx.canvas.clientWidth || 640,
        H = height,
        CELL = 7;
      ctx.clearRect(0, 0, W, H);
      // decision heatmap, one majority vote per cell
      for (let px = 0; px < W; px += CELL)
        for (let py = 0; py < H; py += CELL) {
          const [mx, my] = c.toMath(px + CELL / 2, py + CELL / 2);
          ctx.fillStyle = vote(nearest(mx, my, kk)) ? A1 : A0;
          ctx.globalAlpha = 0.16;
          ctx.fillRect(px, py, CELL + 1, CELL + 1);
        }
      ctx.globalAlpha = 1;
      // training points
      for (const p of pts) {
        const [x, y] = c.toPx(p.x, p.y);
        ctx.fillStyle = p.cls ? A1 : A0;
        ctx.strokeStyle = bg;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      // neighbour spokes + query marker
      const [qx, qy] = c.toPx(query.x, query.y);
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.2;
      for (const i of qNbrs) {
        const [nx, ny] = c.toPx(pts[i]!.x, pts[i]!.y);
        ctx.beginPath();
        ctx.moveTo(qx, qy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = qCls ? A1 : A0;
      ctx.beginPath();
      ctx.arc(qx, qy, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = bg;
      ctx.font = 'bold 11px ui-sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', qx, qy);
    },
    [pts, kk, query, qNbrs, qCls, height],
  );

  const loadData = useCallback(
    (d: KnnDataset) => {
      setKind(d);
      setPts(makeData(d, seed));
      setComparedModel(true);
    },
    [seed],
  );
  const changeK = useCallback((value: number) => {
    setKk(value);
    setComparedModel(true);
  }, []);

  useControlSurface(controlId, {
    dataset: {
      type: 'enum',
      label: 'dataset',
      options: ['blobs', 'xor', 'circles'],
      get: () => kind,
      set: (v) => loadData(v as KnnDataset),
    },
    k: { type: 'number', label: 'k (neighbours)', min: 1, max: 15, step: 2, get: () => kk, set: changeK },
  });

  const vw = useMemo(() => view, []);

  const clampX = (x: number): number => Math.max(view.xMin, Math.min(view.xMax, x));
  const clampY = (y: number): number => Math.max(view.yMin, Math.min(view.yMax, y));
  // Keyboard nudge for the query point: a CanvasLayer has no DOM children to tab
  // to, so the wrapper below is the focusable target. Arrow keys move ✦ by 0.25
  // math units (= 1/40 of the 10-unit view span), clamped to the view, via the
  // SAME setQuery the drag handler uses.
  const KEY_STEP = 0.25;
  const onKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    let dx = 0,
      dy = 0;
    if (e.key === 'ArrowLeft') dx = -KEY_STEP;
    else if (e.key === 'ArrowRight') dx = KEY_STEP;
    else if (e.key === 'ArrowUp')
      dy = KEY_STEP; // math-up is +y
    else if (e.key === 'ArrowDown') dy = -KEY_STEP;
    else return;
    e.preventDefault();
    setMovedQuery(true);
    setQuery((q) => ({ x: clampX(q.x + dx), y: clampY(q.y + dy) }));
  }, []);

  const figure = (
    <div
      tabIndex={0}
      role="img"
      aria-label={`k-NN decision boundary, k ${kk}. Test point predicts class ${qCls ? 'B' : 'A'}. Accuracy ${(acc * 100).toFixed(0)} percent. Use arrow keys to move the test point.`}
      onKeyDown={onKeyDown}
      className="ml-interactive-scene"
    >
      <CanvasLayer
        view={vw}
        height={height}
        draw={draw}
        onPointerMath={(m) => {
          setMovedQuery(true);
          setQuery({ x: clampX(m[0]), y: clampY(m[1]) });
        }}
        ariaLabel={`k-NN boundary, k ${kk}, accuracy ${(acc * 100).toFixed(0)}%`}
      />
    </div>
  );

  const aside = (
    <div className="ml-readout" style={{ '--ml-class-a': A0, '--ml-class-b': A1 } as CSSProperties}>
      <div className="ml-legend">
        <span data-class="a">● class A</span>
        <span data-class="b">● class B</span>
      </div>
      <span className="lab-field-label">Query prediction</span>
      <div className="ml-vote">
        {kk - qCount1} A vs {qCount1} B →{' '}
        <strong data-class={qCls ? 'b' : 'a'}>class {qCls ? 'B' : 'A'}</strong>
      </div>
      <span className="lab-field-label">Model validation</span>
      <strong className="ml-score" data-perfect={acc === 1 || undefined}>
        LOO accuracy {(acc * 100).toFixed(1)}%
      </strong>
      <p className="ml-control-hint">
        Moving the query changes its vote, not this score. LOO accuracy changes when you change k or the
        dataset.
      </p>
    </div>
  );

  const controls = (
    <>
      <Field label="k (neighbours)" value={<b>{kk}</b>}>
        <Slider value={kk} min={1} max={15} step={2} onChange={changeK} ariaLabel="number of neighbours" />
      </Field>
      <div className="lab-segmented-field">
        <span className="lab-field-label">Dataset</span>
        <Segmented
          ariaLabel="dataset"
          value={kind}
          onChange={loadData}
          options={(['blobs', 'xor', 'circles'] as const).map((d) => ({ value: d, label: d }))}
        />
      </div>
      <p className="ml-control-hint">
        Move the query, then change k or the dataset to compare how the vote changes.
      </p>
    </>
  );

  const reset = (): void => {
    setKind(dataset);
    setPts(makeData(dataset, seed));
    setKk(k);
    setQuery({ x: 0.6, y: 1.2 });
    setMovedQuery(false);
    setComparedModel(false);
    challenge.reset();
  };
  const evidence = `The ${kk} nearest examples vote ${kk - qCount1} for class A and ${qCount1} for class B, so the query is classified as ${qCls ? 'B' : 'A'}. Model leave-one-out accuracy is ${(acc * 100).toFixed(1)} percent and is independent of the query position.`;

  return (
    <MLActivity
      className="ml-knn-boundary"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>Query: class {qCls ? 'B' : 'A'}</strong>
          <span>k {kk}</span>
          <span>
            vote {kk - qCount1}:{qCount1}
          </span>
          <span>model LOO {(acc * 100).toFixed(1)}%</span>
        </>
      }
      figure={figure}
      instruments={
        <>
          {aside}
          <LiveRegion>{evidence}</LiveRegion>
        </>
      }
      controls={controls}
      feedback={
        comparedModel
          ? 'Changing k changes the model itself, so both the decision regions and leave-one-out validation can change.'
          : movedQuery
            ? 'Moving the query changes only its local neighbours and vote. The model and its leave-one-out validation stay fixed.'
            : 'The highlighted neighbours are the complete evidence for this query prediction. Move the query to watch that local evidence change.'
      }
      objectives={objectives}
      transport={
        <MLResetTransport
          onReset={reset}
          state={
            movedQuery && comparedModel
              ? 'Comparison complete'
              : movedQuery
                ? 'Now compare k or dataset'
                : 'Move the query point'
          }
          detail={`class ${qCls ? 'B' : 'A'} · ${kk - qCount1}:${qCount1} vote`}
        />
      }
      challenge={<ChallengeCard questions={TRANSFER} state={challenge} title="Transfer the comparison" />}
      support={<HintLadder hints={hints} />}
      canvasLabel="k-nearest-neighbours decision regions, training examples, query, and neighbour links"
      inspectorLabel="Neighbour vote and model controls"
    />
  );
}

export default KNNBoundaryLab;
