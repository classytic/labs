'use client';

/**
 * ZTableLab, read a z-table like the exam expects, and see what each lookup MEANS.
 * Standardize a raw value (x → z = (x−μ)/σ), then the classic Φ(z) table lights up
 * the row/column and cell for that z, while a mini standard-normal curve shades the
 * matching tail and shows the probability. Click any cell to jump there (and the
 * raw value x updates to stay consistent). Negative z is handled by the symmetry
 * Φ(−z) = 1 − Φ(z), spelled out rather than hidden.
 *
 * Φ comes from the normal kernel (`normalCdf`); the table is just that function laid
 * out as the familiar grid, one source of truth, no transcribed magic numbers.
 */

import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { normalCdf, normalPdf, zScore } from '../core/normal.js';
import { Tex } from '../../core/tex.js';
import { Chip } from '../../kit/controls.js';
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

const CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'zmean',
    prompt: 'A z-score of +1.5 means the value is…',
    choices: [
      { value: 'sd', label: '1.5 standard deviations above the mean' },
      { value: 'times', label: '1.5 times the mean' },
      { value: 'pct', label: '15% above average' },
    ],
    answer: 'sd',
    explain:
      'z = (x − μ)/σ counts how many standard deviations x sits from the mean. So z = 1.5 is 1.5σ above μ — here a 650 in N(500, 100).',
  },
  {
    id: 'tail',
    prompt: 'The table gives Φ(z) = P(Z ≤ z), the left tail. To get the right tail P(Z ≥ z) you…',
    choices: [
      { value: 'sub', label: 'subtract from 1: 1 − Φ(z)' },
      { value: 'same', label: 'read the same cell' },
      { value: 'double', label: 'double it' },
    ],
    answer: 'sub',
    explain:
      'The whole area is 1, so the right tail is whatever the left tail leaves: 1 − Φ(z). Toggle “right tail” to see it.',
  },
];

export type ZTail = 'left' | 'right';
export interface ZTableProps {
  x?: number;
  mu?: number;
  sigma?: number;
  tail?: ZTail;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const CW = 230,
  CH = 116,
  CPAD = 6;
const ROWS = Array.from({ length: 35 }, (_, i) => i / 10); // 0.0 … 3.4
const COLS = Array.from({ length: 10 }, (_, j) => j / 100); // .00 … .09
const f2 = (x: number): string => x.toFixed(2);
const f4 = (x: number): string => x.toFixed(4);

export function ZTableLab({
  x = 650,
  mu = 500,
  sigma = 100,
  tail = 'left',
  title = 'The z-table',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: ZTableProps): ReactNode {
  const [xv, setXv] = useState(x);
  const [m, setM] = useState(mu);
  const [sg, setSg] = useState(sigma);
  const [t, setT] = useState<ZTail>(tail);
  const hints = useHints(hintList);
  const ch = useChallenge(CHALLENGE);

  const z = zScore(xv, m, sg);
  const phi = normalCdf(z); // Φ(z) = P(Z ≤ z)
  const prob = t === 'left' ? phi : 1 - phi;
  const zAbs = Math.min(3.49, Math.abs(z));
  const zLook = Math.round(zAbs * 100) / 100; // table is for |z|; symmetry handles the sign

  // mini standard-normal curve
  const xMinC = -3.5,
    xMaxC = 3.5,
    yMaxC = normalPdf(0) * 1.1;
  const cx = (v: number): number => CPAD + ((v - xMinC) / (xMaxC - xMinC)) * (CW - 2 * CPAD);
  const cy = (v: number): number => CH - 16 - (v / yMaxC) * (CH - 26);
  const curve = useMemo(
    () =>
      Array.from({ length: 121 }, (_, i) => {
        const v = xMinC + (i / 120) * (xMaxC - xMinC);
        return `${cx(v).toFixed(1)},${cy(normalPdf(v)).toFixed(1)}`;
      }).join(' '),
    [],
  );
  const shade = useMemo(() => {
    const loX = t === 'left' ? xMinC : z,
      hiX = t === 'left' ? z : xMaxC;
    const a0 = Math.max(xMinC, Math.min(loX, hiX)),
      a1 = Math.min(xMaxC, Math.max(loX, hiX));
    const pts = [`${cx(a0).toFixed(1)},${cy(0).toFixed(1)}`];
    for (let i = 0; i <= 60; i++) {
      const v = a0 + (i / 60) * (a1 - a0);
      pts.push(`${cx(v).toFixed(1)},${cy(normalPdf(v)).toFixed(1)}`);
    }
    pts.push(`${cx(a1).toFixed(1)},${cy(0).toFixed(1)}`);
    return `M${pts.join(' L')} Z`;
  }, [z, t]);

  const pickCell = (rz: number, cz: number): void => {
    const zz = (z < 0 ? -1 : 1) * (rz + cz);
    setXv(Math.round((m + zz * sg) * 100) / 100);
  };

  // keep the highlighted row scrolled into view INSIDE the table box (no page jump)
  const scrollBox = useRef<HTMLDivElement>(null);
  const selRow = useRef<HTMLTableRowElement>(null);
  const moveTableFocus = useRef(false);
  useEffect(() => {
    const box = scrollBox.current,
      row = selRow.current;
    if (!box || !row) return;
    const br = box.getBoundingClientRect(),
      rr = row.getBoundingClientRect();
    box.scrollTop += rr.top - br.top - box.clientHeight / 2 + rr.height / 2;
    if (moveTableFocus.current) {
      box.querySelector<HTMLElement>('[data-selected="true"][role="button"]')?.focus();
      moveTableFocus.current = false;
    }
  }, [zLook]);

  // intrinsic "solved" signal: the learner has standardized x → z and read the
  // table for at least 3 DISTINCT z-values (proving they can convert and look up).
  const lookedUp = useRef<Set<number>>(new Set());
  const [lookupCount, setLookupCount] = useState(0);
  useEffect(() => {
    if (Number.isFinite(zLook) && !lookedUp.current.has(zLook)) {
      lookedUp.current.add(zLook);
      setLookupCount(lookedUp.current.size);
    }
  }, [zLook]);
  const solved = lookupCount >= 3;
  useCheckpoint({
    solved,
    activity: `z-table:${title}`,
    hintsUsed: hints?.count ?? 0,
  });

  useControlSurface(controlId, {
    x: {
      type: 'number',
      label: 'raw value x',
      min: -10000,
      max: 10000,
      step: 1,
      get: () => xv,
      set: setXv,
    },
    mu: {
      type: 'number',
      label: 'mean μ',
      min: -10000,
      max: 10000,
      step: 1,
      get: () => m,
      set: setM,
    },
    sigma: {
      type: 'number',
      label: 'std dev σ',
      min: 0.1,
      max: 10000,
      step: 1,
      get: () => sg,
      set: (value) => setSg(Math.max(0.1, value)),
    },
    tail: {
      type: 'enum',
      label: 'tail',
      options: ['left', 'right'],
      get: () => t,
      set: (v) => setT(v as ZTail),
    },
  });

  // The width is a FLOOR, not a fixed size: a three-digit value plus the number spinner needs more
  // than the 52px the sigma field was given, and it was printing "1(" for 100.
  const numIn = (val: number, set: (n: number) => void, label: string, w = 64, min?: number): ReactNode => (
    <Input
      className="statistics-z-input"
      type="number"
      aria-label={label}
      min={min}
      value={Number.isInteger(val) ? val : Number(val.toFixed(2))}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isFinite(next)) set(min === undefined ? next : Math.max(min, next));
      }}
      style={{ '--statistics-input-width': `${Math.max(w, 68)}px` } as CSSProperties}
    />
  );

  const figure = (
    <>
      {/* standardize → curve */}
      <div className="statistics-z-summary">
        <div className="statistics-z-formula">
          <span>x = {numIn(xv, setXv, 'Raw value x')}</span>
          <span className="discrete-muted">
            from N(
            <Tex tex={'\\mu'} />={numIn(m, setM, 'Mean mu', 56)}, <Tex tex={'\\sigma'} />=
            {numIn(sg, setSg, 'Standard deviation sigma', 52, 0.1)})
          </span>
          <strong>
            <Tex tex={'\\to z ='} /> <span className="statistics-z-accent">{f2(z)}</span>
          </strong>
        </div>
        <div className="statistics-z-curve-summary">
          <svg
            className="statistics-z-curve"
            viewBox={`0 0 ${CW} ${CH}`}
            role="img"
            aria-label={`standard normal, ${t} tail at z ${f2(z)}, area ${f4(prob)}`}
          >
            <path d={shade} fill="color-mix(in oklab, var(--stage-accent) 36%, transparent)" />
            <line x1={CPAD} y1={cy(0)} x2={CW - CPAD} y2={cy(0)} stroke="var(--stage-fg)" strokeWidth={1.2} />
            <polyline points={curve} fill="none" stroke="var(--stage-fg)" strokeWidth={2} />
            <line
              x1={cx(z)}
              y1={cy(0)}
              x2={cx(z)}
              y2={16}
              stroke="var(--stage-accent)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={cx(Math.max(xMinC + 0.4, Math.min(xMaxC - 0.4, z)))}
              y={CH - 3}
              textAnchor="middle"
              fontSize={10}
              fill="var(--stage-accent)"
              fontWeight={700}
            >
              z={f2(z)}
            </text>
          </svg>
          <div>
            <div className="statistics-z-probability">{(prob * 100).toFixed(2)}%</div>
            <div className="statistics-z-expression">
              <Tex tex={`P(Z ${t === 'left' ? '\\le' : '\\ge'} ${f2(z)})`} />
            </div>
          </div>
        </div>
      </div>

      {z < 0 && (
        <p className="lab-prompt statistics-z-note">
          z is negative, the table lists |z|; use symmetry{' '}
          <b>
            <Tex tex={`\\Phi(${f2(z)}) = 1 - \\Phi(${f2(-z)}) = ${f4(phi)}`} />
          </b>
          .
        </p>
      )}

      {/* the z-table */}
      <div ref={scrollBox} className="statistics-z-table-scroll">
        <table className="statistics-z-table">
          <thead>
            <tr>
              <th className="statistics-z-corner">z</th>
              {COLS.map((c) => (
                <th
                  key={c}
                  className="statistics-z-column"
                  data-selected={Math.abs(((zLook * 100) % 10) / 100 - c) < 0.005 || undefined}
                >
                  .{(c * 100).toFixed(0).padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const rowSel = Math.abs(Math.floor(zLook * 10) / 10 - r) < 0.005;
              return (
                <tr key={r} ref={rowSel ? selRow : undefined}>
                  <td className="statistics-z-row-label" data-selected={rowSel || undefined}>
                    {r.toFixed(1)}
                  </td>
                  {COLS.map((c) => {
                    const cellZ = r + c;
                    const sel = Math.abs(cellZ - zLook) < 0.005;
                    return (
                      <td
                        key={c}
                        className="statistics-z-cell"
                        role="button"
                        tabIndex={sel ? 0 : -1}
                        aria-label={`z ${f2(cellZ)}, cumulative probability ${f4(normalCdf(cellZ))}`}
                        data-selected={sel || undefined}
                        data-row-selected={rowSel || undefined}
                        onClick={() => pickCell(r, c)}
                        onKeyDown={(event) => {
                          const movement = {
                            ArrowLeft: -0.01,
                            ArrowRight: 0.01,
                            ArrowUp: -0.1,
                            ArrowDown: 0.1,
                          }[event.key];
                          if (movement === undefined) return;
                          event.preventDefault();
                          const next = Math.max(
                            0,
                            Math.min(3.49, Math.round((cellZ + movement) * 100) / 100),
                          );
                          moveTableFocus.current = true;
                          pickCell(Math.floor(next * 10) / 10, (Math.round(next * 100) % 10) / 100);
                        }}
                      >
                        {f4(normalCdf(cellZ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <Chip selected={t === 'left'} onClick={() => setT('left')}>
        left tail Φ(z)
      </Chip>
      <Chip selected={t === 'right'} onClick={() => setT('right')}>
        right tail 1−Φ(z)
      </Chip>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={CHALLENGE} state={ch} title="Predict first" />
      <p className="statistics-z-note discrete-muted">
        The table gives <Tex tex={'\\Phi(z) = P(Z \\le z)'} />. Row = z to one decimal, column = the
        hundredths digit. Click a cell to jump there.
      </p>
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="statistics-z-table-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Standard normal lookup"
          title={title}
          description={
            prompt ??
            'Standardize a raw value, locate its table cell, and connect the lookup to shaded probability.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>z {f2(z)}</strong>
        <span>{t} tail</span>
        <span>{(prob * 100).toFixed(2)}%</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Z-table and normal-tail model">{figure}</Activity.Canvas>
        <Activity.Inspector label="Probability tail">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          The highlighted row supplies tenths, the column supplies hundredths, and the selected cell gives the
          cumulative left-tail area.
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Z-table prediction and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        z score {f2(z)}; {t} tail probability {(prob * 100).toFixed(2)} percent.
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>Table cell {f2(Math.abs(z))}</strong>
          <span>
            {t} tail · {(prob * 100).toFixed(2)}%
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
