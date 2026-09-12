'use client';

/**
 * VennSetBoard, the GENERAL sets + inclusion–exclusion tool (2 or 3 sets). The
 * creator declares set MEMBERS; the lab places each element in its true region,
 * shows live region counts, and (explore) the inclusion–exclusion breakdown
 * |A∪B| = |A| + |B| − |A∩B|, the "overcount, then correct" spine made visible.
 *
 * The trinity made literal: a SET expression is a PROPOSITIONAL formula over
 * membership (∩↔∧, ∪↔∨, ᶜ↔¬), so "shade the region for A ∩ ¬B" runs on the SAME
 * `compileLogic` kernel as the truth-table lab, one source of truth.
 *
 * Self-contained SVG (a fixed diagram, not a coordinate plot), so no Stage coords
 * needed; counts/IE come from `@classytic/labs/discrete/core`.
 */

import { useId, useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { useControlSurface, useLearner, compileLogic } from '@classytic/stage';
import { Chip, CheckButton, StatusPill, IconButton } from '../../kit/controls.js';
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
import { inclusionExclusion, type Elem } from '../core/index.js';

export interface VennSet {
  name: string;
  members: Elem[];
}
export type VennMode = 'explore' | 'shade';

export interface VennSetBoardProps {
  sets: VennSet[]; // 2 or 3
  mode?: VennMode;
  /** shade mode: the target set expression over the set NAMES (∩ ∪ ¬, or ∧ ∨ !). */
  target?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

interface Geo {
  vb: [number, number, number, number];
  circles: { cx: number; cy: number; r: number }[];
  centroids: Record<string, [number, number]>;
  labels: { x: number; y: number }[];
}

// Geometry tuned for clean, well-separated region labels: centres form an
// equilateral triangle (side ≈ r) so the seven regions are evenly sized, set
// names sit OUTSIDE their circles with margin (no clipping / overlap), and each
// count lands on its region's true visual centroid.
const GEO2: Geo = {
  vb: [0, 0, 340, 224],
  circles: [
    { cx: 132, cy: 118, r: 82 },
    { cx: 208, cy: 118, r: 82 },
  ],
  centroids: { '10': [80, 118], '01': [260, 118], '11': [170, 118], '00': [40, 30] },
  labels: [
    { x: 104, y: 26 },
    { x: 236, y: 26 },
  ],
};
const GEO3: Geo = {
  vb: [0, 0, 360, 306],
  circles: [
    { cx: 140, cy: 116, r: 78 },
    { cx: 220, cy: 116, r: 78 },
    { cx: 180, cy: 186, r: 78 },
  ],
  centroids: {
    '100': [104, 96],
    '010': [256, 96],
    '001': [180, 232],
    '110': [180, 84],
    '101': [132, 162],
    '011': [228, 162],
    '111': [180, 140],
    '000': [44, 30],
  },
  labels: [
    { x: 104, y: 30 },
    { x: 256, y: 30 },
    { x: 180, y: 296 },
  ],
};

const PALETTE = ['var(--stage-accent)', 'var(--stage-accent-2)', 'var(--stage-good)'];

const IE_LETTERS = ['A', 'B', 'C', 'D'];

/** Set expression → logic formula the kernel can parse (∩→∧, ∪→∨, postfix ' / ᶜ → prefix ¬). */
function normalizeSetExpr(s: string): string {
  return s
    .replace(/([A-Za-z_][A-Za-z0-9_]*)\s*[ᶜ']/g, '¬$1') // A' / Aᶜ → ¬A (single name)
    .replace(/∩/g, '∧')
    .replace(/∪/g, '∨')
    .replace(/[\\∖]/g, '∧¬');
}

/** A masked SVG fill for one region (∩ of "in" circles ∖ ∪ of "out" circles). */
function RegionShape({
  sig,
  geo,
  color,
  uid,
  opacity,
}: {
  sig: string;
  geo: Geo;
  color: string;
  uid: string;
  opacity: number;
}): ReactNode {
  const ins: { cx: number; cy: number; r: number }[] = [];
  const outs: { cx: number; cy: number; r: number }[] = [];
  [...sig].forEach((c, i) => (c === '1' ? ins : outs).push(geo.circles[i]!));
  const [vx, vy, vw, vh] = geo.vb;
  const maskId = `${uid}m${sig}`;
  const clipIds = ins.map((_, k) => `${uid}c${sig}_${k}`);
  let node: ReactNode = (
    <rect
      x={vx}
      y={vy}
      width={vw}
      height={vh}
      fill={color}
      opacity={opacity}
      mask={outs.length ? `url(#${maskId})` : undefined}
    />
  );
  for (let k = ins.length - 1; k >= 0; k--) node = <g clipPath={`url(#${clipIds[k]})`}>{node}</g>;
  return (
    <>
      <defs>
        {ins.map((c, k) => (
          <clipPath key={k} id={clipIds[k]}>
            <circle cx={c.cx} cy={c.cy} r={c.r} />
          </clipPath>
        ))}
        {outs.length > 0 && (
          <mask id={maskId}>
            <rect x={vx} y={vy} width={vw} height={vh} fill="white" />
            {outs.map((c, k) => (
              <circle key={k} cx={c.cx} cy={c.cy} r={c.r} fill="black" />
            ))}
          </mask>
        )}
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
  sets,
  mode: mode0 = 'explore',
  target,
  title = 'Sets & Venn',
  prompt,
  objectives,
  hints: hintList,
  controlId,
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
  const transferQuestions = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'inclusion-exclusion-overlap',
        prompt: 'Why does inclusion–exclusion subtract the intersection after adding two set sizes?',
        choices: [
          { value: 'double-counted', label: 'members in both sets were counted twice' },
          { value: 'outside', label: 'members outside both sets must be removed' },
          { value: 'equal-size', label: 'the two sets must be made equal in size' },
        ],
        answer: 'double-counted',
        explain:
          'Adding |A| and |B| counts every shared member once through A and once through B, so one copy of the overlap must be subtracted.',
      },
    ],
    [],
  );
  const challenge = useChallenge(transferQuestions);

  // region signature of an element (which sets contain it)
  const sigOf = (m: Elem): string => sets.map((s) => (s.members.includes(m) ? '1' : '0')).join('');
  const regions = useMemo(() => {
    const counts: Record<string, number> = {};
    const all = new Set<Elem>();
    sets.forEach((s) => s.members.forEach((m) => all.add(m)));
    all.forEach((m) => {
      const k = sigOf(m);
      counts[k] = (counts[k] ?? 0) + 1;
    });
    const keys: string[] = [];
    for (let mask = 0; mask < 1 << n; mask++)
      keys.push(mask.toString(2).padStart(n, '0').split('').reverse().join(''));
    return keys.map((sig) => ({
      sig,
      count: counts[sig] ?? 0,
      centroid: geo.centroids[sig] ?? geo.centroids['00'] ?? [0, 0],
    }));
  }, [sets, n, geo]);

  const ie = useMemo(() => inclusionExclusion(sets.map((s) => s.members)), [sets]);

  // target region set (shade mode) via the logic kernel
  const targetExpr = target ?? names.join(' ∩ ');
  const targetKeys = useMemo(() => {
    const c = compileLogic(normalizeSetExpr(targetExpr));
    if (!c.ok) return new Set<string>();
    const out = new Set<string>();
    regions.forEach(({ sig }) => {
      const env: Record<string, boolean> = {};
      names.forEach((nm, i) => {
        env[nm] = sig[i] === '1';
      });
      if (c.eval(env)) out.add(sig);
    });
    return out;
  }, [targetExpr, regions, names]);

  const correct = useMemo(
    () => shaded.size === targetKeys.size && [...shaded].every((k) => targetKeys.has(k)),
    [shaded, targetKeys],
  );
  const solved = mode === 'shade' && checked && correct && !peeked && challenge.allCorrect;
  useCheckpoint({ solved, activity: `venn:${title}`, hintsUsed: hints.count });

  const toggle = (sig: string): void => {
    setChecked(false);
    setShaded((s) => {
      const n2 = new Set(s);
      n2.has(sig) ? n2.delete(sig) : n2.add(sig);
      return n2;
    });
  };
  const check = (): void => setChecked(true);
  const reset = (): void => {
    setMode(mode0);
    setShaded(new Set());
    setChecked(false);
    setPeeked(false);
    challenge.reset();
  };
  const reveal = (): void => {
    setPeeked(true);
    setShaded(new Set(targetKeys));
    setChecked(true);
    learner?.report({
      activity: `venn:${title}`,
      correct: false,
      completion: true,
      score: { raw: 0, max: 1 },
    });
  };

  useControlSurface(controlId, {
    mode: {
      type: 'enum',
      label: 'mode',
      options: ['explore', 'shade'],
      get: () => mode,
      set: (v) => setMode(v as VennMode),
    },
    reveal: { type: 'action', label: 'shade the target', invoke: reveal },
    check: { type: 'action', label: 'grade the shading', invoke: check },
    reset: { type: 'action', label: 'clear', invoke: reset },
  });

  // The diagram geometry only exists for 2 or 3 sets; surface a friendly error
  // instead of silently drawing 4+ sets with 2-set circles.
  if (n < 2 || n > 3) {
    return (
      <Activity.Root>
        <Activity.Header>
          <Activity.Heading eyebrow="Set relationships" title={title} description={prompt} />
        </Activity.Header>
        <Activity.Feedback>
          <span>Configuration</span>
          <div>The Venn lab supports 2 or 3 sets; you gave {n}. Reduce the number of sets.</div>
        </Activity.Feedback>
      </Activity.Root>
    );
  }

  const [vx, vy, vw, vh] = geo.vb;
  const showShade = mode === 'shade';

  const figure = (
    <div className="venn-scene">
      <svg
        className="venn-svg"
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        role="img"
        aria-label={`Venn diagram of ${names.join(', ')}`}
      >
        {/* shaded regions (or faint target preview after a wrong check) */}
        {showShade &&
          [...shaded].map((sig) => (
            <RegionShape key={sig} sig={sig} geo={geo} color="var(--stage-accent)" uid={uid} opacity={0.38} />
          ))}
        {/* circle rings + faint matching fills, the ring colour ties each
              circle to its set name (no gray outlines floating free) */}
        {geo.circles.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={PALETTE[i]}
            fillOpacity={0.09}
            stroke={PALETTE[i]}
            strokeOpacity={0.7}
            strokeWidth={2}
          />
        ))}
        {geo.labels.map((l, i) => (
          <text
            key={i}
            className="venn-svg-label"
            x={l.x}
            y={l.y}
            fill={PALETTE[i]}
            fontSize={15}
            fontWeight={800}
            textAnchor="middle"
          >
            {names[i]}
          </text>
        ))}
        {/* region counts (explore) */}
        {mode === 'explore' &&
          regions
            .filter((r) => r.count > 0 && r.sig !== '0'.repeat(n))
            .map((r) => (
              <text
                key={r.sig}
                className="venn-svg-count"
                x={r.centroid[0]}
                y={r.centroid[1]}
                fill="var(--stage-fg)"
                fontSize={16}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {r.count}
              </text>
            ))}
      </svg>
    </div>
  );

  const aside =
    mode === 'explore' ? (
      <div className="venn-inclusion-panel">
        <div className="venn-set-key">
          <div className="lab-field-label">Inclusion–exclusion</div>
          <div className="venn-set-key-list">
            {names.map((nm, i) => (
              <span key={i}>
                <b>{IE_LETTERS[i]}</b> = {nm}
              </span>
            ))}
          </div>
        </div>
        {/* symbolic line */}
        <div className="venn-equation">
          {ie.terms.map((t, i) => (
            <span key={i} data-negative={t.sign < 0}>
              {i > 0 ? (t.sign < 0 ? '− ' : '+ ') : ''}|{t.indices.map((j) => IE_LETTERS[j]).join('∩')}|
            </span>
          ))}
          <span className="venn-equation-result">= |{names.map((_, i) => IE_LETTERS[i]).join('∪')}|</span>
        </div>
        {/* numeric line */}
        <div className="venn-equation venn-equation-numeric">
          {ie.terms.map((t, i) => (
            <span key={i} data-negative={t.sign < 0}>
              {i > 0 ? (t.sign < 0 ? '− ' : '+ ') : ''}
              {t.size}
            </span>
          ))}
          <span className="venn-equation-total">= {ie.unionSize}</span>
        </div>
      </div>
    ) : undefined;

  const controls =
    mode === 'shade' ? (
      <div className="lab-activity-fields">
        <span className="venn-shade-target">Shade: {targetExpr}</span>
        {regions.map((r) => (
          <Chip key={r.sig} selected={shaded.has(r.sig)} onClick={() => toggle(r.sig)}>
            {regionLabel(r.sig, names)}
          </Chip>
        ))}
        {checked && (
          <StatusPill ok={correct}>
            {correct ? '✓ Exactly right' : 'Not quite, adjust the regions'}
          </StatusPill>
        )}
      </div>
    ) : undefined;

  const footer = (
    <>
      {mode === 'shade' && (
        <RevealSolution
          available={checked && !correct}
          solution={
            <>
              Shade: <b>{[...targetKeys].map((k) => regionLabel(k, names)).join(', ') || 'no regions'}</b>.
            </>
          }
          onReveal={reveal}
        />
      )}
      {mode === 'shade' && (
        <ChallengeCard
          questions={transferQuestions}
          state={challenge}
          title="Explain the overlap correction"
        />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="discrete-venn-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Set relationships"
          title={title}
          description={
            prompt ?? 'Inspect membership regions or build the region described by a set expression.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {mode === 'shade'
            ? checked
              ? correct
                ? 'Expression matched'
                : 'Revise regions'
              : `Shade ${targetExpr}`
            : `Union ${ie.unionSize}`}
        </strong>
        <span>{n} sets</span>
        <span>{mode === 'shade' ? `${shaded.size} regions selected` : 'inclusion–exclusion'}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Venn set diagram">{figure}</Activity.Canvas>
        <Activity.Inspector
          label={mode === 'shade' ? 'Set-expression regions' : 'Inclusion–exclusion evidence'}
        >
          {mode === 'shade' ? controls : aside}
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {mode === 'shade'
            ? checked && correct
              ? `The selected regions are exactly ${targetExpr}.`
              : 'Set operations describe membership conditions; each visual region has one unique membership signature.'
            : `Adding individual set sizes overcounts shared members; alternating intersection terms corrects the union to ${ie.unionSize}.`}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Venn explanation and support">
        {footer}
      </section>
      {mode === 'shade' ? (
        <Activity.LiveRegion>
          {checked
            ? correct
              ? 'The selected regions match the target expression.'
              : 'The selected regions do not yet match the target expression.'
            : `${shaded.size} of ${regions.length} regions selected for ${targetExpr}.`}
        </Activity.LiveRegion>
      ) : null}
      <Activity.Transport>
        <IconButton label="Reset Venn activity" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{mode === 'shade' ? 'Build the expression' : 'Inspect the overlap'}</strong>
          <span>{n} sets</span>
        </div>
        {mode === 'shade' ? (
          <CheckButton onClick={check} disabled={shaded.size === 0}>
            Check
          </CheckButton>
        ) : null}
      </Activity.Transport>
    </Activity.Root>
  );
}
