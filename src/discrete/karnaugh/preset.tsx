'use client';

/**
 * KarnaughMapLab, the GENERAL "simplify boolean by eye" tool. A K-map is just a
 * truth table re-laid in GRAY-CODE order so that adjacent cells differ in ONE
 * variable; circling a power-of-two block of 1s drops the variable that changes
 * across it. That is the same "overcount, then correct" move as the rest of the
 * pack, a group merges redundant minterms the way ÷k! merges redundant orderings.
 *
 * Creator declares a `formula` (any 2–4 variable expression) OR explicit
 * `minterms` (+ optional `dontCares`). Two modes:
 *   • show    , the kernel's minimal cover is drawn as coloured loops + the SOP.
 *   • simplify, the learner taps 1-cells to draw their own groups; each is
 *                live-validated (legal sub-cube? all ones?) and its product term
 *                shown; solved when every 1 is covered, with a "minimal!" bonus.
 *
 * Minimisation is Quine–McCluskey in the stage logic kernel (`minimize` /
 * `cubeOfSelection`), the map only RENDERS what the kernel computes. Groups that
 * wrap the map edges render as two (or four) loops, exactly as on paper.
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  compileLogic,
  minimize,
  cubeCovers,
  cubeTerm,
  cubeOfSelection,
  logicToLatex,
  useControlSurface,
  type Cube,
} from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import { ActionButton, StatusPill } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import {
  useHints,
  HintLadder,
  RevealSolution,
  useCheckpoint,
  useChallenge,
  ChallengeCard,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import { CATEGORICAL } from '../../kit/palette.js';

export type KMapMode = 'show' | 'simplify';
export interface KMapProps {
  formula?: string;
  minterms?: number[];
  dontCares?: number[];
  vars?: string[];
  mode?: KMapMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const CS = 50; // cell size
const LH = 50,
  TH = 46; // left / top header gutters
const PALETTE = CATEGORICAL;

const gray = (i: number): number => i ^ (i >> 1);
const bits = (v: number, n: number): string => v.toString(2).padStart(n, '0');

/** Maximal consecutive runs of sorted indices (wrap shows as two runs, desired). */
function runs(idx: number[]): [number, number][] {
  const s = [...idx].sort((a, b) => a - b);
  const out: [number, number][] = [];
  let start = s[0]!,
    prev = s[0]!;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === prev + 1) {
      prev = s[i]!;
      continue;
    }
    out.push([start, prev]);
    start = s[i]!;
    prev = s[i]!;
  }
  out.push([start, prev]);
  return out;
}

export function KarnaughMapLab({
  formula,
  minterms: mtIn,
  dontCares: dcIn = [],
  vars: varsIn,
  mode = 'simplify',
  title = 'Karnaugh map',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: KMapProps): ReactNode {
  const model = useMemo(() => {
    let vars: string[];
    let minterms: number[];
    let dontCares: number[] = dcIn;
    if (formula) {
      const c = compileLogic(formula);
      if (!c.ok) return { error: c.error } as const;
      vars = c.vars;
      const total = 1 << vars.length;
      minterms = [];
      for (let m = 0; m < total; m++) {
        const env: Record<string, boolean> = {};
        vars.forEach((v, i) => {
          env[v] = (m & (1 << (vars.length - 1 - i))) !== 0;
        });
        if (c.eval(env)) minterms.push(m);
      }
    } else {
      vars = varsIn ?? ['a', 'b'];
      minterms = (mtIn ?? [0, 1, 2]).slice();
    }
    const n = vars.length;
    if (n < 2 || n > 4) return { error: 'K-map supports 2–4 variables' } as const;
    const result = minimize({ minterms, vars, dontCares });
    return { vars, n, minterms, dontCares, result } as const;
  }, [formula, mtIn, dcIn, varsIn]);

  const hints = useHints(hintList);
  const transferQuestions = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'group-size-transfer',
        prompt: 'Why must every legal Karnaugh-map group contain 1, 2, 4, 8, … cells?',
        choices: [
          { value: 'variable-drop', label: 'each doubling lets one changing variable disappear' },
          { value: 'square-map', label: 'the map is always a square' },
          { value: 'binary-value', label: 'every cell contains a binary digit' },
        ],
        answer: 'variable-drop',
        explain:
          'A power-of-two subcube spans every value of one or more changing variables, so those variables cancel from the product term.',
      },
    ],
    [],
  );
  const challenge = useChallenge(transferQuestions);
  const [selected, setSelected] = useState<number[]>([]);
  const [groups, setGroups] = useState<Cube[]>([]);
  const [revealed, setRevealed] = useState(false);

  if ('error' in model)
    return (
      <Activity.Root>
        <Activity.Header>
          <Activity.Heading eyebrow="Boolean minimization" title={title} />
        </Activity.Header>
        <Activity.Feedback>
          <span>Configuration</span>
          <div>{model.error}</div>
        </Activity.Feedback>
      </Activity.Root>
    );
  const { vars, n, minterms, dontCares, result } = model;

  const rowBits = n <= 2 ? 1 : n === 3 ? 1 : 2;
  const colBits = n - rowBits;
  const nRows = 1 << rowBits,
    nCols = 1 << colBits;
  const oneSet = new Set(minterms);
  const dcSet = new Set(dontCares);
  const rowVars = vars.slice(0, rowBits),
    colVars = vars.slice(rowBits);

  // cell at (gr,gc) → minterm
  const mintermAt = (gr: number, gc: number): number => (gray(gr) << colBits) | gray(gc);
  const cellOf = (m: number): { gr: number; gc: number } => {
    for (let gr = 0; gr < nRows; gr++)
      for (let gc = 0; gc < nCols; gc++) if (mintermAt(gr, gc) === m) return { gr, gc };
    return { gr: 0, gc: 0 };
  };

  const gridW = nCols * CS,
    gridH = nRows * CS;
  const W = LH + gridW + 16,
    H = TH + gridH + 16;
  const cellX = (gc: number): number => LH + gc * CS;
  const cellY = (gr: number): number => TH + gr * CS;

  // group loops (wrap-aware): a cube → up to 4 rects
  const loopsFor = (cube: Cube): { x: number; y: number; w: number; h: number }[] => {
    const cells = cubeCovers(cube, n).map(cellOf);
    const rowRuns = runs([...new Set(cells.map((c) => c.gr))]);
    const colRuns = runs([...new Set(cells.map((c) => c.gc))]);
    const out: { x: number; y: number; w: number; h: number }[] = [];
    for (const [r0, r1] of rowRuns)
      for (const [c0, c1] of colRuns)
        out.push({ x: cellX(c0), y: cellY(r0), w: (c1 - c0 + 1) * CS, h: (r1 - r0 + 1) * CS });
    return out;
  };

  const shownGroups: { cube: Cube; color: string }[] =
    mode === 'simplify'
      ? (revealed ? result.cover : groups).map((cube, i) => ({ cube, color: PALETTE[i % PALETTE.length]! }))
      : result.cover.map((cube, i) => ({ cube, color: PALETTE[i % PALETTE.length]! }));

  // ── simplify-mode interaction ──
  const tapCell = (m: number): void => {
    if (mode !== 'simplify' || revealed) return;
    if (!oneSet.has(m) && !dcSet.has(m)) return; // only 1s / don't-cares are groupable
    setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  };
  const currentCube = selected.length ? cubeOfSelection(selected, n) : null;
  const currentValid =
    currentCube !== null && cubeCovers(currentCube, n).every((m) => oneSet.has(m) || dcSet.has(m));
  const currentKey = currentCube ? `${currentCube.value}:${currentCube.mask}` : '';
  const duplicateGroup = currentCube
    ? groups.some((group) => `${group.value}:${group.mask}` === currentKey)
    : false;
  const addGroup = (): void => {
    if (currentValid && currentCube && !duplicateGroup) {
      setGroups((g) => [...g, currentCube]);
      setSelected([]);
    }
  };
  const covered = new Set<number>();
  for (const g of groups) for (const m of cubeCovers(g, n)) covered.add(m);
  const allCovered = minterms.every((m) => covered.has(m));
  const minimal = allCovered && groups.length === result.cover.length;
  const solved = mode === 'simplify' && allCovered && challenge.allCorrect;

  useCheckpoint({
    solved: solved && !revealed,
    activity: `kmap:${title}`,
    hintsUsed: hints.count,
    score: { raw: minimal ? 1 : 0.85, max: 1 },
  });

  const reset = (): void => {
    setGroups([]);
    setSelected([]);
    setRevealed(false);
    challenge.reset();
  };

  useControlSurface(controlId, {
    reveal: { type: 'action', label: 'reveal minimal cover', invoke: () => setRevealed(true) },
    reset: { type: 'action', label: 'clear groups', invoke: reset },
  });

  const TexExpr = ({ expr }: { expr: string }): ReactNode => {
    if (expr === '0' || expr === '1') return <b className="logic-minimal-constant">{expr}</b>;
    const c = compileLogic(expr.replace(/¬/g, '~'));
    return c.ok ? <Tex tex={logicToLatex(c.ast)} /> : <span>{expr}</span>;
  };

  const figure = (
    <svg
      className="kmap-svg"
      viewBox={`0 0 ${W} ${H}`}
      role="grid"
      aria-label={`Karnaugh map, ${n} variables (${vars.join(', ')}), ${nRows * nCols} cells, ${minterms.length} one${minterms.length === 1 ? '' : 's'}`}
    >
      {/* axis var labels */}
      <text
        x={LH + gridW / 2}
        y={16}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="var(--stage-muted)"
      >
        {colVars.join('')}
      </text>
      <text
        x={14}
        y={TH + gridH / 2}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="var(--stage-muted)"
        transform={`rotate(-90 14 ${TH + gridH / 2})`}
      >
        {rowVars.join('')}
      </text>
      {/* column headers (gray) */}
      {Array.from({ length: nCols }, (_, gc) => (
        <text
          key={`ch${gc}`}
          x={cellX(gc) + CS / 2}
          y={TH - 8}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill="var(--stage-fg)"
          fontFamily="ui-monospace, monospace"
        >
          {bits(gray(gc), colBits)}
        </text>
      ))}
      {/* row headers (gray) */}
      {Array.from({ length: nRows }, (_, gr) => (
        <text
          key={`rh${gr}`}
          x={LH - 10}
          y={cellY(gr) + CS / 2}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={13}
          fontWeight={700}
          fill="var(--stage-fg)"
          fontFamily="ui-monospace, monospace"
        >
          {bits(gray(gr), rowBits)}
        </text>
      ))}
      {/* cells */}
      {Array.from({ length: nRows }, (_, gr) =>
        Array.from({ length: nCols }, (_, gc) => {
          const m = mintermAt(gr, gc);
          const isOne = oneSet.has(m),
            isDC = dcSet.has(m);
          const sel = mode === 'simplify' && selected.includes(m);
          const val = isOne ? '1' : isDC ? 'X' : '0';
          const tappable = mode === 'simplify' && (isOne || isDC) && !revealed;
          const cellLabel = `minterm ${m}, value ${val}${sel ? ', selected' : ''}`;
          return (
            <g
              key={`c${gr}-${gc}`}
              onClick={() => tapCell(m)}
              onKeyDown={
                tappable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        tapCell(m);
                      }
                    }
                  : undefined
              }
              role={tappable ? 'button' : 'img'}
              tabIndex={tappable ? 0 : undefined}
              aria-label={cellLabel}
              aria-pressed={tappable ? sel : undefined}
              className="kmap-cell"
              data-tappable={tappable}
            >
              <rect
                x={cellX(gc)}
                y={cellY(gr)}
                width={CS}
                height={CS}
                fill={
                  sel
                    ? 'color-mix(in oklab, var(--stage-good) 24%, transparent)'
                    : isOne
                      ? 'color-mix(in oklab, var(--stage-good) 9%, transparent)'
                      : 'var(--stage-bg)'
                }
                stroke="var(--stage-grid)"
                strokeWidth={1}
              />
              <text
                className="logic-svg-passive"
                x={cellX(gc) + CS / 2}
                y={cellY(gr) + CS / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={17}
                fontWeight={800}
                fill={isOne ? 'var(--stage-good)' : isDC ? 'var(--stage-warn)' : 'var(--stage-muted)'}
              >
                {val}
              </text>
              <text
                className="logic-svg-passive"
                x={cellX(gc) + CS - 4}
                y={cellY(gr) + 11}
                textAnchor="end"
                fontSize={8.5}
                fill="var(--stage-muted)"
                fontFamily="ui-monospace, monospace"
              >
                {m}
              </text>
            </g>
          );
        }),
      )}
      {/* group loops */}
      {shownGroups.map(({ cube, color }, gi) =>
        loopsFor(cube).map((r, ri) => {
          const inset = 4 + (gi % 3) * 4;
          return (
            <rect
              key={`g${gi}-${ri}`}
              x={r.x + inset}
              y={r.y + inset}
              width={r.w - inset * 2}
              height={r.h - inset * 2}
              rx={12}
              fill="none"
              stroke={color}
              strokeWidth={3}
              opacity={0.95}
            />
          );
        }),
      )}
      {/* current selection outline (dashed) */}
      {mode === 'simplify' &&
        currentCube &&
        currentValid &&
        loopsFor(currentCube).map((r, ri) => (
          <rect
            key={`cur${ri}`}
            x={r.x + 3}
            y={r.y + 3}
            width={r.w - 6}
            height={r.h - 6}
            rx={12}
            fill="none"
            stroke="var(--stage-fg)"
            strokeWidth={2.5}
            strokeDasharray="6 5"
          />
        ))}
    </svg>
  );

  const aside = (
    <>
      {mode === 'show' ? (
        <>
          <p className="logic-panel-title">Minimal form</p>
          <div className="logic-minimal-form">
            <TexExpr expr={result.expression} />
          </div>
          <p className="logic-panel-copy">
            {result.cover.length} group{result.cover.length === 1 ? '' : 's'} cover
            {result.cover.length === 1 ? 's' : ''} {minterms.length} one{minterms.length === 1 ? '' : 's'}.
            Each loop drops the variable that flips across it.
          </p>
        </>
      ) : (
        <>
          <p className="logic-panel-title">Your groups</p>
          {groups.length === 0 && (
            <p className="logic-panel-copy">
              Tap adjacent 1s to draw a group (size 1, 2, 4, 8…). Wrapping around edges is allowed.
            </p>
          )}
          <ul className="kmap-group-list">
            {groups.map((g, i) => (
              <li key={i} style={{ '--group-color': PALETTE[i % PALETTE.length] } as CSSProperties}>
                <TexExpr expr={cubeTerm(g, vars)} />
              </li>
            ))}
          </ul>
          {selected.length > 0 && (
            <div className="kmap-selection-status">
              Selection:{' '}
              {currentValid ? (
                duplicateGroup ? (
                  <span className="logic-error-text">this group is already present</span>
                ) : (
                  <>
                    valid group →{' '}
                    <b>
                      <TexExpr expr={cubeTerm(currentCube!, vars)} />
                    </b>
                  </>
                )
              ) : (
                <span className="logic-error-text">not a legal group (need a power-of-two block of 1s)</span>
              )}
            </div>
          )}
          <div className="lab-bar kmap-actions">
            <ActionButton onClick={addGroup} disabled={!currentValid || duplicateGroup}>
              Add group
            </ActionButton>
            <ActionButton onClick={() => setSelected([])} disabled={selected.length === 0}>
              Clear selection
            </ActionButton>
            <ActionButton onClick={reset} disabled={groups.length === 0 && selected.length === 0}>
              Reset
            </ActionButton>
          </div>
          {allCovered && (
            <StatusPill ok className="kmap-complete">
              {minimal
                ? '✓ all ones covered, minimal!'
                : `✓ covered, but minimal is ${result.cover.length} group${result.cover.length === 1 ? '' : 's'}`}
            </StatusPill>
          )}
        </>
      )}
    </>
  );

  const footer = (
    <>
      {mode === 'simplify' && (
        <RevealSolution
          available={!allCovered || !minimal}
          buttonLabel="Show minimal cover"
          solution={
            <>
              The minimal SOP is <TexExpr expr={result.expression} />, {result.cover.length} group
              {result.cover.length === 1 ? '' : 's'}.
            </>
          }
          onReveal={() => setRevealed(true)}
        />
      )}
      {mode === 'simplify' && (
        <ChallengeCard questions={transferQuestions} state={challenge} title="Explain why grouping works" />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="discrete-karnaugh-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Boolean minimization"
          title={title}
          description={
            prompt ??
            'Group adjacent one-cells in powers of two and watch changing variables disappear from the simplified expression.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {allCovered
            ? minimal
              ? 'Minimal cover'
              : 'Covered'
            : mode === 'show'
              ? 'Minimal form'
              : 'Build groups'}
        </strong>
        <span>
          {covered.size}/{minterms.length} ones covered
        </span>
        <span>{groups.length} groups</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive Karnaugh map">{figure}</Activity.Canvas>
        <Activity.Inspector label="Grouping evidence and controls">{aside}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {allCovered
            ? `Every one-cell is covered; ${minimal ? 'the number of groups is minimal.' : `the minimal cover uses ${result.cover.length} groups.`}`
            : 'Gray-code adjacency means neighbouring cells differ in one variable, which can disappear when grouped.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Karnaugh-map explanation and support">
        {footer}
      </section>
      {mode === 'simplify' ? (
        <Activity.LiveRegion>
          {allCovered
            ? `All ${minterms.length} one-cells are covered with ${groups.length} groups.`
            : `${covered.size} of ${minterms.length} one-cells covered. ${selected.length} cells selected for the next group.`}
        </Activity.LiveRegion>
      ) : null}
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{selected.length ? `${selected.length} cells selected` : 'Select a legal group'}</strong>
          <span>
            {covered.size} of {minterms.length} covered
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
