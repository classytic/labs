'use client';

/**
 * VennSetBoard — the GENERAL sets + inclusion–exclusion tool (2 or 3 sets). The
 * creator declares set MEMBERS; the lab places each element in its true region,
 * shows live region counts, and (explore) the inclusion–exclusion breakdown
 * |A∪B| = |A| + |B| − |A∩B| — the "overcount, then correct" spine made visible.
 *
 * The trinity made literal: a SET expression is a PROPOSITIONAL formula over
 * membership (∩↔∧, ∪↔∨, ᶜ↔¬), so "shade the region for A ∩ ¬B" runs on the SAME
 * `compileLogic` kernel as the truth-table lab — one source of truth.
 *
 * Self-contained SVG (a fixed diagram, not a coordinate plot), so no Stage coords
 * needed; counts/IE come from `@classytic/labs/discrete/core`.
 */

import { useId, useMemo, useState, type ReactNode } from 'react';
import { useControlSurface, useLearner, compileLogic } from '@classytic/stage';
import { Chip, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';
import { inclusionExclusion, type Elem } from '../core/index.js';

export interface VennSet { name: string; members: Elem[] }
export type VennMode = 'explore' | 'shade';

export interface VennSetBoardProps {
  sets: VennSet[];                 // 2 or 3
  mode?: VennMode;
  /** shade mode: the target set expression over the set NAMES (∩ ∪ ¬, or ∧ ∨ !). */
  target?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

interface Geo { vb: [number, number, number, number]; circles: { cx: number; cy: number; r: number }[]; centroids: Record<string, [number, number]>; labels: { x: number; y: number }[] }

const GEO2: Geo = {
  vb: [0, 0, 340, 210],
  circles: [{ cx: 132, cy: 108, r: 84 }, { cx: 208, cy: 108, r: 84 }],
  centroids: { '10': [78, 108], '01': [262, 108], '11': [170, 108], '00': [38, 26] },
  labels: [{ x: 70, y: 22 }, { x: 270, y: 22 }],
};
const GEO3: Geo = {
  vb: [0, 0, 340, 260],
  circles: [{ cx: 132, cy: 102, r: 80 }, { cx: 208, cy: 102, r: 80 }, { cx: 170, cy: 168, r: 80 }],
  centroids: { '100': [96, 78], '010': [244, 78], '001': [170, 210], '110': [170, 66], '101': [116, 144], '011': [224, 144], '111': [170, 118], '000': [38, 28] },
  labels: [{ x: 78, y: 20 }, { x: 262, y: 20 }, { x: 170, y: 252 }],
};

const PALETTE = ['var(--stage-accent)', 'var(--stage-accent-2)', 'var(--stage-good)'];

const IE_LETTERS = ['A', 'B', 'C', 'D'];

/** Set expression → logic formula the kernel can parse (∩→∧, ∪→∨, postfix ' / ᶜ → prefix ¬). */
function normalizeSetExpr(s: string): string {
  return s
    .replace(/([A-Za-z_][A-Za-z0-9_]*)\s*[ᶜ']/g, '¬$1')   // A' / Aᶜ → ¬A (single name)
    .replace(/∩/g, '∧').replace(/∪/g, '∨').replace(/[\\∖]/g, '∧¬');
}

/** A masked SVG fill for one region (∩ of "in" circles ∖ ∪ of "out" circles). */
function RegionShape({ sig, geo, color, uid, opacity }: { sig: string; geo: Geo; color: string; uid: string; opacity: number }): ReactNode {
  const ins: { cx: number; cy: number; r: number }[] = [];
  const outs: { cx: number; cy: number; r: number }[] = [];
  [...sig].forEach((c, i) => (c === '1' ? ins : outs).push(geo.circles[i]!));
  const [vx, vy, vw, vh] = geo.vb;
  const maskId = `${uid}m${sig}`;
  const clipIds = ins.map((_, k) => `${uid}c${sig}_${k}`);
  let node: ReactNode = <rect x={vx} y={vy} width={vw} height={vh} fill={color} opacity={opacity} mask={outs.length ? `url(#${maskId})` : undefined} />;
  for (let k = ins.length - 1; k >= 0; k--) node = <g clipPath={`url(#${clipIds[k]})`}>{node}</g>;
  return (
    <>
      <defs>
        {ins.map((c, k) => <clipPath key={k} id={clipIds[k]}><circle cx={c.cx} cy={c.cy} r={c.r} /></clipPath>)}
        {outs.length > 0 && <mask id={maskId}><rect x={vx} y={vy} width={vw} height={vh} fill="white" />{outs.map((c, k) => <circle key={k} cx={c.cx} cy={c.cy} r={c.r} fill="black" />)}</mask>}
      </defs>
      {node}
    </>
  );
}

const regionLabel = (sig: string, names: string[]): string => {
  const inN = names.filter((_, i) => sig[i] === '1');
  if (inN.length === 0) return 'neither';
  if (inN.length === 1) return `${inN[0]} only`;
  return inN.join(' ∩ ');
};

export function VennSetBoardLab({
  sets, mode: mode0 = 'explore', target, title = 'Sets & Venn', prompt, objectives, hints: hintList, controlId,
}: VennSetBoardProps): ReactNode {
  const n = sets.length;
  const geo = n === 3 ? GEO3 : GEO2;
  const names = sets.map((s) => s.name);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [mode, setMode] = useState<VennMode>(mode0);
  const [shaded, setShaded] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hints = useHints(hintList);
  const learner = useLearner();

  // region signature of an element (which sets contain it)
  const sigOf = (m: Elem): string => sets.map((s) => (s.members.includes(m) ? '1' : '0')).join('');
  const regions = useMemo(() => {
    const counts: Record<string, number> = {};
    const all = new Set<Elem>();
    sets.forEach((s) => s.members.forEach((m) => all.add(m)));
    all.forEach((m) => { const k = sigOf(m); counts[k] = (counts[k] ?? 0) + 1; });
    const keys: string[] = [];
    for (let mask = 0; mask < (1 << n); mask++) keys.push(mask.toString(2).padStart(n, '0').split('').reverse().join(''));
    return keys.map((sig) => ({ sig, count: counts[sig] ?? 0, centroid: geo.centroids[sig] ?? geo.centroids['00'] ?? [0, 0] }));
  }, [sets, n, geo]);

  const ie = useMemo(() => inclusionExclusion(sets.map((s) => s.members)), [sets]);

  // target region set (shade mode) via the logic kernel
  const targetKeys = useMemo(() => {
    if (!target) return new Set<string>();
    const c = compileLogic(normalizeSetExpr(target));
    if (!c.ok) return new Set<string>();
    const out = new Set<string>();
    regions.forEach(({ sig }) => {
      const env: Record<string, boolean> = {};
      names.forEach((nm, i) => { env[nm] = sig[i] === '1'; });
      if (c.eval(env)) out.add(sig);
    });
    return out;
  }, [target, regions, names]);

  const correct = useMemo(() => shaded.size === targetKeys.size && [...shaded].every((k) => targetKeys.has(k)), [shaded, targetKeys]);
  const solved = mode === 'shade' && checked && correct && !peeked;
  useCheckpoint({ solved, activity: `venn:${title}`, hintsUsed: hints.count });

  const toggle = (sig: string): void => { setChecked(false); setShaded((s) => { const n2 = new Set(s); n2.has(sig) ? n2.delete(sig) : n2.add(sig); return n2; }); };
  const check = (): void => setChecked(true);
  const reset = (): void => { setShaded(new Set()); setChecked(false); };
  const reveal = (): void => { setPeeked(true); setShaded(new Set(targetKeys)); setChecked(true); learner?.report({ activity: `venn:${title}`, correct: false, completion: true, score: { raw: 0, max: 1 } }); };

  useControlSurface(controlId, {
    mode: { type: 'enum', label: 'mode', options: ['explore', 'shade'], get: () => mode, set: (v) => setMode(v as VennMode) },
    reveal: { type: 'action', label: 'shade the target', invoke: reveal },
    check: { type: 'action', label: 'grade the shading', invoke: check },
    reset: { type: 'action', label: 'clear', invoke: reset },
  });

  const [vx, vy, vw, vh] = geo.vb;
  const showShade = mode === 'shade';

  const figure = (
    <div style={{ display: 'flex', justifyContent: 'center', borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 12 }}>
        <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} style={{ width: '100%', maxWidth: 360, height: 'auto' }} role="img" aria-label={`Venn diagram of ${names.join(', ')}`}>
          {/* shaded regions (or faint target preview after a wrong check) */}
          {showShade && [...shaded].map((sig) => <RegionShape key={sig} sig={sig} geo={geo} color="var(--stage-accent)" uid={uid} opacity={0.38} />)}
          {/* circle outlines + faint fills */}
          {geo.circles.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={PALETTE[i]} fillOpacity={0.06} stroke="var(--stage-fg)" strokeOpacity={0.5} strokeWidth={1.5} />
          ))}
          {geo.labels.map((l, i) => <text key={i} x={l.x} y={l.y} fill={PALETTE[i]} fontSize={15} fontWeight={800} textAnchor="middle">{names[i]}</text>)}
          {/* region counts (explore) */}
          {mode === 'explore' && regions.filter((r) => r.count > 0 && r.sig !== '0'.repeat(n)).map((r) => (
            <text key={r.sig} x={r.centroid[0]} y={r.centroid[1]} fill="var(--stage-fg)" fontSize={15} fontWeight={700} textAnchor="middle" dominantBaseline="central"
              style={{ paintOrder: 'stroke', stroke: 'var(--stage-bg)', strokeWidth: 4, strokeLinejoin: 'round' }}>{r.count}</text>
          ))}
        </svg>
    </div>
  );

  const aside = mode === 'explore' ? (
        <div style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--stage-grid)', display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--stage-muted)' }}>
            <div className="lab-field-label">Inclusion–exclusion</div>
            {names.map((nm, i) => <span key={i} style={{ marginRight: 12 }}><b>{IE_LETTERS[i]}</b> = {nm}</span>)}
          </div>
          {/* symbolic line */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 7px', fontWeight: 600 }}>
            {ie.terms.map((t, i) => (
              <span key={i} style={{ color: t.sign < 0 ? 'var(--stage-danger)' : 'var(--stage-fg)' }}>
                {i > 0 ? (t.sign < 0 ? '− ' : '+ ') : ''}|{t.indices.map((j) => IE_LETTERS[j]).join('∩')}|
              </span>
            ))}
            <span style={{ fontWeight: 800, marginLeft: 4 }}>= |{names.map((_, i) => IE_LETTERS[i]).join('∪')}|</span>
          </div>
          {/* numeric line */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 7px', fontVariantNumeric: 'tabular-nums', color: 'var(--stage-muted)' }}>
            {ie.terms.map((t, i) => (
              <span key={i} style={{ color: t.sign < 0 ? 'var(--stage-danger)' : 'inherit' }}>
                {i > 0 ? (t.sign < 0 ? '− ' : '+ ') : ''}{t.size}
              </span>
            ))}
            <span style={{ fontWeight: 800, marginLeft: 4, color: 'var(--stage-good)' }}>= {ie.unionSize}</span>
          </div>
        </div>
  ) : undefined;

  const controls = mode === 'shade' ? (
    <ControlBar>
      <span style={{ fontWeight: 600, marginRight: 4 }}>Shade: {target}</span>
      {regions.map((r) => <Chip key={r.sig} selected={shaded.has(r.sig)} onClick={() => toggle(r.sig)}>{regionLabel(r.sig, names)}</Chip>)}
      <CheckButton onClick={check} disabled={shaded.size === 0}>Check</CheckButton>
      {checked && <StatusPill ok={correct}>{correct ? '✓ Exactly right' : 'Not quite — adjust the regions'}</StatusPill>}
    </ControlBar>
  ) : undefined;

  const footer = (
    <>
      {mode === 'shade' && (
        <RevealSolution available={checked && !correct} solution={<>Shade: <b>{[...targetKeys].map((k) => regionLabel(k, names)).join(', ') || 'no regions'}</b>.</>} onReveal={reveal} />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
