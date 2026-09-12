'use client';

/**
 * PascalTriangleLab, where counting, the binomial theorem, and a fractal meet. The
 * triangle is built live by the one rule that defines it, each cell is the SUM of
 * the two above, and every cell is also C(n,k): the number of ways to choose k of
 * n (so the counting labs and this are the same numbers). Click a cell to see the
 * two parents add into it AND its three identities (combination · path count ·
 * binomial coefficient). Pick the binomial view and a whole ROW becomes the
 * expansion (a+b)ⁿ. Flip "odd/even" and the triangle blooms into the Sierpiński
 * triangle, the wow that shows structure hides in plain arithmetic.
 *
 * Values come from nCr (kernel), but the recurrence is what's shown, the formula
 * is derived by the picture, not stated.
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { nCr } from '../core/combinatorics.js';
import { Tex } from '../../core/tex.js';
import { Chip, Slider } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { Activity } from '../../kit/activity.js';
import {
  useHints,
  HintLadder,
  useChallenge,
  ChallengeCard,
  useCheckpoint,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';

export type PascalView = 'build' | 'binomial' | 'parity';
export interface PascalProps {
  rows?: number;
  view?: PascalView;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const CW = 46,
  RH = 42,
  R = 18,
  PAD = 22;
const ACC = 'var(--stage-accent)',
  GOOD = 'var(--stage-good)',
  WARN = 'var(--stage-warn)';

function expansionTex(n: number): string {
  const terms: string[] = [];
  for (let k = 0; k <= n; k++) {
    const c = nCr(n, k),
      ai = n - k,
      bi = k;
    let t = c === 1 ? '' : String(c);
    if (ai > 0) t += ai === 1 ? 'a' : `a^{${ai}}`;
    if (bi > 0) t += bi === 1 ? 'b' : `b^{${bi}}`;
    terms.push(t || '1');
  }
  return `(a+b)^{${n}} = ${terms.join(' + ')}`;
}

export function PascalTriangleLab({
  rows = 7,
  view: view0 = 'build',
  title = "Pascal's triangle",
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: PascalProps): ReactNode {
  const [N, setN] = useState(rows); // last row index
  const [view, setView] = useState<PascalView>(view0);
  const [sel, setSel] = useState<{ n: number; k: number } | null>(() => ({
    n: Math.min(4, rows),
    k: Math.min(2, rows),
  }));
  const [interacted, setInteracted] = useState(false);
  const hints = useHints(hintList);

  const Q: ChallengeQuestion[] = useMemo(
    () => [
      {
        id: 'pascal-C52',
        prompt:
          'Row 5 of Pascal’s triangle is 1, 5, 10, 10, 5, 1. What is C(5,2), the number of ways to choose 2 from 5?',
        choices: [
          { value: '20', label: '20' },
          { value: '10', label: '10' },
          { value: '7', label: '7' },
        ],
        answer: '10',
        explain:
          'Each cell is the sum of the two above it, and equals C(n,k); C(5,2)=10, while 5×4=20 counts ordered pairs, the same two chosen in each order.',
      },
    ],
    [],
  );
  const ch = useChallenge(Q);
  useCheckpoint({ solved: interacted && ch.allCorrect, activity: 'pascal:predict' });

  const selectCell = (n: number, k: number): void => {
    setSel({ n, k });
    setInteracted(true);
  };
  const setRows = (value: number): void => {
    const next = Math.max(3, Math.min(14, Math.round(value)));
    setN(next);
    setInteracted(true);
    setSel((current) => (current && current.n > next ? { n: next, k: Math.min(current.k, next) } : current));
  };

  const vbW = N * CW + 2 * R + 40,
    vbH = PAD + (N + 1) * RH + 10;
  const cx = (n: number, k: number): number => vbW / 2 + (k - n / 2) * CW;
  const cy = (n: number): number => PAD + R + n * RH;

  const selRow = sel?.n ?? -1;
  const parents = useMemo(() => {
    if (!sel || sel.n === 0) return null;
    const l = sel.k - 1 >= 0 && sel.k - 1 <= sel.n - 1 ? { n: sel.n - 1, k: sel.k - 1 } : null;
    const r = sel.k <= sel.n - 1 ? { n: sel.n - 1, k: sel.k } : null;
    return { l, r };
  }, [sel]);

  useControlSurface(controlId, {
    rows: { type: 'number', label: 'rows', min: 3, max: 14, step: 1, get: () => N, set: setRows },
    view: {
      type: 'enum',
      label: 'view',
      options: ['build', 'binomial', 'parity'],
      get: () => view,
      set: (v) => {
        setView(v as PascalView);
        setInteracted(true);
      },
    },
  });

  const cells: ReactNode[] = [];
  for (let n = 0; n <= N; n++)
    for (let k = 0; k <= n; k++) {
      const v = nCr(n, k);
      const odd = v % 2 === 1;
      const isSel = sel?.n === n && sel?.k === k;
      const isParent =
        parents && ((parents.l?.n === n && parents.l?.k === k) || (parents.r?.n === n && parents.r?.k === k));
      const inRow = view === 'binomial' && n === selRow;
      let fill = 'var(--stage-bg)',
        stroke = 'var(--stage-grid)',
        txt = 'var(--stage-fg)';
      if (view === 'parity') {
        fill = odd ? ACC : 'transparent';
        stroke = odd ? ACC : 'color-mix(in oklab, var(--stage-grid) 50%, transparent)';
        txt = odd ? 'white' : 'var(--stage-muted)';
      }
      if (isParent) {
        fill = `color-mix(in oklab, ${WARN} 22%, var(--stage-bg))`;
        stroke = WARN;
      }
      if (inRow) {
        fill = `color-mix(in oklab, ${ACC} 14%, var(--stage-bg))`;
        stroke = ACC;
      }
      if (isSel) {
        fill = GOOD;
        stroke = GOOD;
        txt = 'white';
      }
      const digits = String(v).length;
      cells.push(
        <g
          key={`${n}-${k}`}
          className="pascal-cell"
          role="button"
          tabIndex={0}
          aria-label={`row ${n}, position ${k}, value ${v}`}
          aria-pressed={isSel}
          onClick={() => selectCell(n, k)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              selectCell(n, k);
            }
          }}
        >
          <circle
            cx={cx(n, k)}
            cy={cy(n)}
            r={R}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSel || isParent ? 2.5 : 1.3}
          />
          {(view !== 'parity' || odd) && (
            <text
              className="logic-svg-passive"
              x={cx(n, k)}
              y={cy(n)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.max(9, 15 - (digits - 1) * 2)}
              fontWeight={isSel ? 800 : 600}
              fill={txt}
            >
              {v}
            </text>
          )}
        </g>,
      );
    }
  // parent → child "+" arrows for the selected cell
  const arrows: ReactNode[] = [];
  if (parents && sel) {
    for (const p of [parents.l, parents.r])
      if (p)
        arrows.push(
          <line
            key={`a${p.k}`}
            x1={cx(p.n, p.k)}
            y1={cy(p.n) + R}
            x2={cx(sel.n, sel.k)}
            y2={cy(sel.n) - R}
            stroke={WARN}
            strokeWidth={2}
            markerEnd="url(#stage-arrow)"
          />,
        );
  }

  const figure = (
    <div className="pascal-scene">
      <svg
        className="pascal-svg"
        style={{ '--pascal-width': `${vbW}px` } as CSSProperties}
        viewBox={`0 0 ${vbW} ${vbH}`}
        role="group"
        aria-label={`Pascal's triangle, ${N + 1} rows`}
      >
        <defs>
          <marker
            id="stage-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={WARN} />
          </marker>
        </defs>
        {arrows}
        {cells}
      </svg>
    </div>
  );

  const aside = sel ? (
    <>
      <Readout
        label={`cell (row ${sel.n}, position ${sel.k})`}
        value={nCr(sel.n, sel.k)}
        sub={`C(${sel.n},${sel.k})`}
      />
      <div className="pascal-identities">
        {parents && (parents.l || parents.r) ? (
          <p>
            📐 sum of the two above:{' '}
            <b>
              {parents.l ? nCr(parents.l.n, parents.l.k) : 0} +{' '}
              {parents.r ? nCr(parents.r.n, parents.r.k) : 0} = {nCr(sel.n, sel.k)}
            </b>
          </p>
        ) : (
          <p>
            📐 an edge, always <b>1</b> (one way).
          </p>
        )}
        <p>
          🎯 = ways to{' '}
          <b>
            choose {sel.k} of {sel.n}
          </b>{' '}
          (C({sel.n},{sel.k}))
        </p>
        <p>
          ➕ = coefficient of <Tex tex={`a^{${sel.n - sel.k}}b^{${sel.k}}`} /> in (a+b)<sup>{sel.n}</sup>
        </p>
        <p className="discrete-muted">
          row {sel.n} sums to 2<sup>{sel.n}</sup> = {2 ** sel.n}
        </p>
      </div>
    </>
  ) : (
    <p className="lab-muted-copy">Select any cell to inspect its recurrence and identities.</p>
  );

  const footer = (
    <>
      <ChallengeCard questions={Q} state={ch} title="Predict first" />
      {view === 'binomial' && selRow >= 0 && (
        <div className="pascal-expansion">
          <Tex tex={expansionTex(selRow)} />{' '}
          <span className="pascal-expansion-note">← row {selRow} of the triangle is the coefficients</span>
        </div>
      )}
      {view === 'parity' && (
        <p className="lab-prompt">
          Colour only the <b>odd</b> numbers → the <b>Sierpiński triangle</b> appears. Structure hiding inside
          plain addition.
        </p>
      )}
      <HintLadder hints={hints} />
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <Field label="view">
        <span className="pascal-view-switch">
          <Chip selected={view === 'build'} onClick={() => setView('build')}>
            build (sum above)
          </Chip>
          <Chip selected={view === 'binomial'} onClick={() => setView('binomial')}>
            (a+b)ⁿ
          </Chip>
          <Chip selected={view === 'parity'} onClick={() => setView('parity')}>
            odd/even
          </Chip>
        </span>
      </Field>
      <Field label="rows" value={N}>
        <Slider value={N} min={3} max={14} step={1} onChange={setRows} ariaLabel="rows" />
      </Field>
    </div>
  );

  return (
    <Activity.Root className="discrete-pascal-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Combinatorial structure"
          title={title}
          description={
            prompt ??
            'Select a cell and connect one local addition rule to combinations, binomial coefficients, and parity structure.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{sel ? `C(${sel.n},${sel.k}) = ${nCr(sel.n, sel.k)}` : 'Select a cell'}</strong>
        <span>{N + 1} rows</span>
        <span>{view}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive Pascal triangle">{figure}</Activity.Canvas>
        <Activity.Inspector label="Cell identities and triangle controls">
          <div className="lab-activity-fields">
            {aside}
            {controls}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {sel && parents
            ? `The selected value ${nCr(sel.n, sel.k)} is the sum of its two parents and also counts ways to choose ${sel.k} from ${sel.n}.`
            : 'Edge values remain 1 because there is only one way to choose none or everything.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Pascal-triangle prediction and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        {sel
          ? `Selected row ${sel.n}, position ${sel.k}, value ${nCr(sel.n, sel.k)}.`
          : 'Select a cell to inspect its recurrence and identities.'}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{interacted ? 'Structure inspected' : 'Choose a cell'}</strong>
          <span>
            row {sel?.n ?? 0} · {view} view
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
