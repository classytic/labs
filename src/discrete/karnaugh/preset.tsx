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

import { useMemo, useState, type ReactNode } from 'react';
import { compileLogic, minimize, cubeCovers, cubeTerm, cubeOfSelection, logicToLatex, useControlSurface, type Cube } from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import { Chip } from '../../kit/controls.js';
import { LabFrame } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';
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

const CS = 50;            // cell size
const LH = 50, TH = 46;   // left / top header gutters
const PALETTE = CATEGORICAL;

const gray = (i: number): number => i ^ (i >> 1);
const bits = (v: number, n: number): string => v.toString(2).padStart(n, '0');

/** Maximal consecutive runs of sorted indices (wrap shows as two runs, desired). */
function runs(idx: number[]): [number, number][] {
  const s = [...idx].sort((a, b) => a - b);
  const out: [number, number][] = [];
  let start = s[0]!, prev = s[0]!;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === prev + 1) { prev = s[i]!; continue; }
    out.push([start, prev]); start = s[i]!; prev = s[i]!;
  }
  out.push([start, prev]);
  return out;
}

export function KarnaughMapLab({ formula, minterms: mtIn, dontCares: dcIn = [], vars: varsIn, mode = 'show', title = 'Karnaugh map', prompt, objectives, hints: hintList, controlId }: KMapProps): ReactNode {
  const model = useMemo(() => {
    let vars: string[]; let minterms: number[]; let dontCares: number[] = dcIn;
    if (formula) {
      const c = compileLogic(formula);
      if (!c.ok) return { error: c.error } as const;
      vars = c.vars;
      const total = 1 << vars.length;
      minterms = [];
      for (let m = 0; m < total; m++) {
        const env: Record<string, boolean> = {};
        vars.forEach((v, i) => { env[v] = (m & (1 << (vars.length - 1 - i))) !== 0; });
        if (c.eval(env)) minterms.push(m);
      }
    } else {
      vars = varsIn ?? ['a', 'b'];
      minterms = (mtIn ?? []).slice();
    }
    const n = vars.length;
    if (n < 2 || n > 4) return { error: 'K-map supports 2–4 variables' } as const;
    const result = minimize({ minterms, vars, dontCares });
    return { vars, n, minterms, dontCares, result } as const;
  }, [formula, mtIn, dcIn, varsIn]);

  const hints = useHints(hintList);
  const [selected, setSelected] = useState<number[]>([]);
  const [groups, setGroups] = useState<Cube[]>([]);
  const [revealed, setRevealed] = useState(false);

  if ('error' in model) return <LabFrame title={title}><p style={{ color: 'var(--stage-bad)' }}>⚠ {model.error}</p></LabFrame>;
  const { vars, n, minterms, dontCares, result } = model;

  const rowBits = n <= 2 ? 1 : n === 3 ? 1 : 2;
  const colBits = n - rowBits;
  const nRows = 1 << rowBits, nCols = 1 << colBits;
  const oneSet = new Set(minterms);
  const dcSet = new Set(dontCares);
  const rowVars = vars.slice(0, rowBits), colVars = vars.slice(rowBits);

  // cell at (gr,gc) → minterm
  const mintermAt = (gr: number, gc: number): number => (gray(gr) << colBits) | gray(gc);
  const cellOf = (m: number): { gr: number; gc: number } => {
    for (let gr = 0; gr < nRows; gr++) for (let gc = 0; gc < nCols; gc++) if (mintermAt(gr, gc) === m) return { gr, gc };
    return { gr: 0, gc: 0 };
  };

  const gridW = nCols * CS, gridH = nRows * CS;
  const W = LH + gridW + 16, H = TH + gridH + 16;
  const cellX = (gc: number): number => LH + gc * CS;
  const cellY = (gr: number): number => TH + gr * CS;

  // group loops (wrap-aware): a cube → up to 4 rects
  const loopsFor = (cube: Cube): { x: number; y: number; w: number; h: number }[] => {
    const cells = cubeCovers(cube, n).map(cellOf);
    const rowRuns = runs([...new Set(cells.map((c) => c.gr))]);
    const colRuns = runs([...new Set(cells.map((c) => c.gc))]);
    const out: { x: number; y: number; w: number; h: number }[] = [];
    for (const [r0, r1] of rowRuns) for (const [c0, c1] of colRuns) out.push({ x: cellX(c0), y: cellY(r0), w: (c1 - c0 + 1) * CS, h: (r1 - r0 + 1) * CS });
    return out;
  };

  const shownGroups: { cube: Cube; color: string }[] = mode === 'simplify'
    ? (revealed ? result.cover : groups).map((cube, i) => ({ cube, color: PALETTE[i % PALETTE.length]! }))
    : result.cover.map((cube, i) => ({ cube, color: PALETTE[i % PALETTE.length]! }));

  // ── simplify-mode interaction ──
  const tapCell = (m: number): void => {
    if (mode !== 'simplify' || revealed) return;
    if (!oneSet.has(m) && !dcSet.has(m)) return;       // only 1s / don't-cares are groupable
    setSelected((s) => s.includes(m) ? s.filter((x) => x !== m) : [...s, m]);
  };
  const currentCube = selected.length ? cubeOfSelection(selected, n) : null;
  const currentValid = currentCube !== null && cubeCovers(currentCube, n).every((m) => oneSet.has(m) || dcSet.has(m));
  const addGroup = (): void => { if (currentValid && currentCube) { setGroups((g) => [...g, currentCube]); setSelected([]); } };
  const covered = new Set<number>();
  for (const g of groups) for (const m of cubeCovers(g, n)) covered.add(m);
  const allCovered = minterms.every((m) => covered.has(m));
  const minimal = allCovered && groups.length === result.cover.length;
  const solved = mode === 'simplify' ? allCovered : true;

  useCheckpoint({ solved: mode === 'simplify' ? allCovered : false, activity: `kmap:${title}`, hintsUsed: hints.count, score: { raw: minimal ? 1 : 0.85, max: 1 } });

  useControlSurface(controlId, {
    reveal: { type: 'action', label: 'reveal minimal cover', invoke: () => setRevealed(true) },
    reset: { type: 'action', label: 'clear groups', invoke: () => { setGroups([]); setSelected([]); setRevealed(false); } },
  });

  const TexExpr = ({ expr }: { expr: string }): ReactNode => {
    if (expr === '0' || expr === '1') return <b style={{ fontSize: 18 }}>{expr}</b>;
    const c = compileLogic(expr.replace(/¬/g, '~'));
    return c.ok ? <Tex tex={logicToLatex(c.ast)} /> : <span>{expr}</span>;
  };

  const figure = (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '100%', height: 'auto' }} role="grid" aria-label={`Karnaugh map, ${n} variables (${vars.join(', ')}), ${nRows * nCols} cells, ${minterms.length} one${minterms.length === 1 ? '' : 's'}`}>
          {/* axis var labels */}
          <text x={LH + gridW / 2} y={16} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--stage-muted)">{colVars.join('')}</text>
          <text x={14} y={TH + gridH / 2} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--stage-muted)" transform={`rotate(-90 14 ${TH + gridH / 2})`}>{rowVars.join('')}</text>
          {/* column headers (gray) */}
          {Array.from({ length: nCols }, (_, gc) => (
            <text key={`ch${gc}`} x={cellX(gc) + CS / 2} y={TH - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--stage-fg)" fontFamily="ui-monospace, monospace">{bits(gray(gc), colBits)}</text>
          ))}
          {/* row headers (gray) */}
          {Array.from({ length: nRows }, (_, gr) => (
            <text key={`rh${gr}`} x={LH - 10} y={cellY(gr) + CS / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill="var(--stage-fg)" fontFamily="ui-monospace, monospace">{bits(gray(gr), rowBits)}</text>
          ))}
          {/* cells */}
          {Array.from({ length: nRows }, (_, gr) => Array.from({ length: nCols }, (_, gc) => {
            const m = mintermAt(gr, gc);
            const isOne = oneSet.has(m), isDC = dcSet.has(m);
            const sel = mode === 'simplify' && selected.includes(m);
            const val = isOne ? '1' : isDC ? 'X' : '0';
            const tappable = mode === 'simplify' && (isOne || isDC) && !revealed;
            const cellLabel = `minterm ${m}, value ${val}${sel ? ', selected' : ''}`;
            return (
              <g
                key={`c${gr}-${gc}`}
                onClick={() => tapCell(m)}
                onKeyDown={tappable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapCell(m); } } : undefined}
                role={tappable ? 'button' : 'img'}
                tabIndex={tappable ? 0 : undefined}
                aria-label={cellLabel}
                aria-pressed={tappable ? sel : undefined}
                style={{ cursor: tappable ? 'pointer' : 'default' }}
              >
                <rect x={cellX(gc)} y={cellY(gr)} width={CS} height={CS} fill={sel ? 'color-mix(in oklab, var(--stage-good) 24%, transparent)' : isOne ? 'color-mix(in oklab, var(--stage-good) 9%, transparent)' : 'var(--stage-bg)'} stroke="var(--stage-grid)" strokeWidth={1} />
                <text x={cellX(gc) + CS / 2} y={cellY(gr) + CS / 2} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={800} fill={isOne ? 'var(--stage-good)' : isDC ? 'var(--stage-warn)' : 'var(--stage-muted)'} style={{ pointerEvents: 'none' }}>{val}</text>
                <text x={cellX(gc) + CS - 4} y={cellY(gr) + 11} textAnchor="end" fontSize={8.5} fill="var(--stage-muted)" style={{ pointerEvents: 'none' }} fontFamily="ui-monospace, monospace">{m}</text>
              </g>
            );
          }))}
          {/* group loops */}
          {shownGroups.map(({ cube, color }, gi) => loopsFor(cube).map((r, ri) => {
            const inset = 4 + (gi % 3) * 4;
            return <rect key={`g${gi}-${ri}`} x={r.x + inset} y={r.y + inset} width={r.w - inset * 2} height={r.h - inset * 2} rx={12} fill="none" stroke={color} strokeWidth={3} opacity={0.95} />;
          }))}
          {/* current selection outline (dashed) */}
          {mode === 'simplify' && currentCube && currentValid && loopsFor(currentCube).map((r, ri) => (
            <rect key={`cur${ri}`} x={r.x + 3} y={r.y + 3} width={r.w - 6} height={r.h - 6} rx={12} fill="none" stroke="var(--stage-fg)" strokeWidth={2.5} strokeDasharray="6 5" />
          ))}
    </svg>
  );

  const aside = (
    <>
          {mode === 'show' ? (
            <>
              <p style={{ fontWeight: 700, margin: '0 0 6px' }}>Minimal form</p>
              <div style={{ fontSize: 18, padding: '8px 12px', borderRadius: 10, background: 'color-mix(in oklab, var(--stage-good) 10%, transparent)' }}><TexExpr expr={result.expression} /></div>
              <p style={{ fontSize: 13, color: 'var(--stage-muted)', marginTop: 8 }}>{result.cover.length} group{result.cover.length === 1 ? '' : 's'} cover{result.cover.length === 1 ? 's' : ''} {minterms.length} one{minterms.length === 1 ? '' : 's'}. Each loop drops the variable that flips across it.</p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 700, margin: '0 0 6px' }}>Your groups</p>
              {groups.length === 0 && <p style={{ fontSize: 13, color: 'var(--stage-muted)' }}>Tap adjacent 1s to draw a group (size 1, 2, 4, 8…). Wrapping around edges is allowed.</p>}
              <ul style={{ margin: '4px 0', paddingLeft: 18 }}>
                {groups.map((g, i) => <li key={i} style={{ color: PALETTE[i % PALETTE.length] }}><TexExpr expr={cubeTerm(g, vars)} /></li>)}
              </ul>
              {selected.length > 0 && (
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  Selection: {currentValid ? <>valid group → <b><TexExpr expr={cubeTerm(currentCube!, vars)} /></b></> : <span style={{ color: 'var(--stage-bad)' }}>not a legal group (need a power-of-two block of 1s)</span>}
                </div>
              )}
              <div className="lab-bar" style={{ gap: 8, marginTop: 8 }}>
                <Chip selected={false} onClick={addGroup}>add group</Chip>
                <Chip selected={false} onClick={() => setSelected([])}>clear pick</Chip>
                <Chip selected={false} onClick={() => { setGroups([]); setSelected([]); setRevealed(false); }}>reset</Chip>
              </div>
              {allCovered && <p className="lab-pill" data-state="ok" style={{ marginTop: 8 }}>{minimal ? '✓ all ones covered, minimal!' : `✓ covered, but minimal is ${result.cover.length} group${result.cover.length === 1 ? '' : 's'}`}</p>}
            </>
          )}
    </>
  );

  const footer = (
    <>
      {mode === 'simplify' && (
        <RevealSolution available={!allCovered || !minimal} buttonLabel="Show minimal cover" solution={<>The minimal SOP is <TexExpr expr={result.expression} />, {result.cover.length} group{result.cover.length === 1 ? '' : 's'}.</>} onReveal={() => setRevealed(true)} />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} footer={footer}>{figure}</LabFrame>;
}
