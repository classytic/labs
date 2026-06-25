'use client';

/**
 * TitrationLab — add base to an acid drop by drop and watch the pH curve build, on
 * the shared `@classytic/stage/chem` acid–base kernel (pH solved exactly from the
 * charge balance at every volume).
 *
 * A burette of strong base drips into a flask of acid; the phenolphthalein indicator
 * stays colourless and flips pink past pH ≈ 8.3. The curve on the right shows the
 * signature shape: a gentle start, then for a WEAK acid a flat BUFFER region whose
 * midpoint sits at pH = pKa, a steep jump through the equivalence point, and a
 * levelling-off in excess base. A strong acid skips the buffer and crosses pH 7 at
 * equivalence; a weak acid's equivalence point is basic (pH > 7). Interactive — drag
 * the volume, no simulation loop.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { titrationCurve, pHAt, type TitrationSpec } from '@classytic/stage/chem';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { Tex } from '../../core/tex.js';

export interface TitrationProps {
  analyte?: 'strong-acid' | 'weak-acid';
  /** Acid concentration in the flask, mol/L (default 0.1). */
  concAcid?: number;
  /** Acid volume in the flask, mL (default 25). */
  volAcidMl?: number;
  /** Strong-base titrant concentration, mol/L (default 0.1). */
  concBase?: number;
  /** Weak-acid pKa (default 4.76 = acetic acid). */
  pKa?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 720, H = 400;
const PINK = 'rgb(214,51,132)';

/** Predict the two facts the curve hides: pKa lives at the half-equivalence point, and a weak acid's equivalence point is basic. */
const TITRATION_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'half-eq',
    prompt: 'At the half-equivalence point of a WEAK acid, the pH equals…',
    choices: [
      { value: 'pka', label: 'pKa' },
      { value: 'seven', label: '7' },
      { value: 'pkw', label: '14 − pKa' },
    ],
    answer: 'pka',
    explain: 'Half-neutralised means [A⁻] = [HA], so the Henderson–Hasselbalch log term is zero and pH = pKa.',
  },
  {
    id: 'equiv',
    prompt: 'The equivalence point of a WEAK acid titrated with strong base is…',
    choices: [
      { value: 'acidic', label: 'acidic (pH < 7)' },
      { value: 'neutral', label: 'neutral (pH = 7)' },
      { value: 'basic', label: 'basic (pH > 7)' },
    ],
    answer: 'basic',
    explain: 'All acid is now its conjugate base, which hydrolyses water to give pH > 7. (A strong acid would cross pH 7.)',
  },
];

export function TitrationLab({
  analyte: analyte0 = 'weak-acid',
  concAcid = 0.1,
  volAcidMl = 25,
  concBase = 0.1,
  pKa: pKa0 = 4.76,
  title = 'Acid–base titration — build the pH curve',
  prompt = 'Drip strong base into the acid and track the pH. Watch the buffer region, the steep jump at the equivalence point, and the indicator flip pink.',
  objectives = [
    'Read a titration curve: start, buffer, equivalence jump, excess base',
    'For a weak acid, see the half-equivalence pH equals the pKa',
    'See the equivalence pH is 7 for a strong acid but >7 for a weak acid',
  ],
}: TitrationProps = {}): ReactNode {
  const Ca = concAcid, Va = volAcidMl / 1000, Cb = concBase;
  const [analyte, setAnalyte] = useState<'strong-acid' | 'weak-acid'>(analyte0);
  const [pKa, setPKa] = useState(pKa0);
  const [vAddedMl, setVAddedMl] = useState(12);
  const challenge = useChallenge(TITRATION_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'titration' });

  const spec: TitrationSpec = useMemo(() => ({ analyte, Ca, Va, Cb, pKa }), [analyte, Ca, Va, Cb, pKa]);
  const curve = useMemo(() => titrationCurve(spec), [spec]);
  const weak = analyte === 'weak-acid';
  const vEqMl = curve.vEq * 1000;
  const vMaxMl = vEqMl * 2;
  const vb = Math.min(vAddedMl, vMaxMl) / 1000;
  const pH = pHAt(spec, vb);

  // diagram coords
  const GX0 = 360, GX1 = 700, GY0 = 30, GY1 = 330;
  const PXv = (ml: number): number => GX0 + (ml / vMaxMl) * (GX1 - GX0);
  const PYp = (p: number): number => GY1 - (p / 14) * (GY1 - GY0);
  const path = curve.points.map((pt) => `${PXv(pt.v * 1000).toFixed(1)},${PYp(pt.pH).toFixed(1)}`).join(' ');

  // indicator (phenolphthalein): colourless → pink past ~8.3
  const pink = Math.max(0, Math.min(1, (pH - 8.3) / 1.7));
  const ratio = vAddedMl / vEqMl;
  const region = vAddedMl < vEqMl * 0.04 ? 'initial acid'
    : Math.abs(vAddedMl - vEqMl) < vEqMl * 0.04 ? 'equivalence point'
      : vAddedMl > vEqMl ? 'excess base'
        : weak ? 'buffer region' : 'before equivalence';

  // apparatus
  const burX = 120, burTop = 40, burH = 150, burW = 26;
  const titDrop = Math.min(1, vAddedMl / vMaxMl);
  const titTop = burTop + titDrop * (burH - 20);
  const flaskCx = burX, flaskTop = 250, flaskBot = 348;

  const figure = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Titration, ${vAddedMl.toFixed(1)} millilitres added, pH ${pH.toFixed(2)}, ${region}`}>
        {/* burette */}
        <rect x={burX - burW / 2} y={burTop} width={burW} height={burH} rx={4} fill="var(--stage-bg)" stroke="var(--stage-metal)" strokeWidth={2} />
        <rect x={burX - burW / 2 + 2} y={titTop} width={burW - 4} height={burTop + burH - titTop - 2} fill="color-mix(in oklab, var(--stage-accent) 30%, transparent)" />
        {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={burX + burW / 2} y1={burTop + t * burH} x2={burX + burW / 2 + 5} y2={burTop + t * burH} stroke="var(--stage-muted)" strokeWidth={1} />)}
        <text x={burX + burW / 2 + 8} y={burTop + 10} fontSize={10} fill="var(--stage-muted)">NaOH</text>
        {/* tip + a falling drop */}
        <path d={`M ${burX - 4} ${burTop + burH} L ${burX + 4} ${burTop + burH} L ${burX} ${burTop + burH + 10} Z`} fill="var(--stage-metal)" />
        {vAddedMl < vMaxMl && <circle cx={burX} cy={burTop + burH + 24} r={3} fill="color-mix(in oklab, var(--stage-accent) 40%, transparent)" />}
        {/* Erlenmeyer flask with indicator solution */}
        <path d={`M ${flaskCx - 10} ${flaskTop} L ${flaskCx - 10} ${flaskTop + 14} L ${flaskCx - 44} ${flaskBot - 6} Q ${flaskCx - 46} ${flaskBot} ${flaskCx - 40} ${flaskBot} L ${flaskCx + 40} ${flaskBot} Q ${flaskCx + 46} ${flaskBot} ${flaskCx + 44} ${flaskBot - 6} L ${flaskCx + 10} ${flaskTop + 14} L ${flaskCx + 10} ${flaskTop} Z`}
          fill={`color-mix(in oklab, ${PINK} ${(pink * 70).toFixed(0)}%, color-mix(in oklab, var(--stage-accent) 8%, var(--stage-bg)))`} stroke="var(--stage-metal)" strokeWidth={2} strokeLinejoin="round" />
        <text x={flaskCx} y={flaskBot + 16} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">{pink > 0.5 ? 'pink — past end point' : 'colourless'}</text>

        {/* titration curve */}
        <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        {[0, 7, 14].map((p) => <g key={p}><line x1={GX0 - 4} y1={PYp(p)} x2={GX0} y2={PYp(p)} stroke="var(--stage-muted)" strokeWidth={1} /><text x={GX0 - 7} y={PYp(p) + 3} textAnchor="end" fontSize={10} fill="var(--stage-muted)">{p}</text></g>)}
        <text x={GX0 - 7} y={GY0 - 4} textAnchor="end" fontSize={10} fill="var(--stage-muted)">pH</text>
        <text x={GX1} y={GY1 + 18} textAnchor="end" fontSize={10} fill="var(--stage-muted)">base added (mL) →</text>
        {/* pH 7 reference */}
        <line x1={GX0} y1={PYp(7)} x2={GX1} y2={PYp(7)} stroke="var(--stage-grid)" strokeWidth={1} strokeDasharray="3 4" />
        {/* buffer region (weak acid) + half-equivalence pKa */}
        {weak && <>
          <rect x={PXv(vEqMl * 0.15)} y={GY0} width={PXv(vEqMl * 0.85) - PXv(vEqMl * 0.15)} height={GY1 - GY0} fill="var(--stage-good)" opacity={0.08} />
          <line x1={PXv(vEqMl / 2)} y1={PYp(curve.pHHalf)} x2={PXv(vEqMl / 2)} y2={GY1} stroke="var(--stage-good)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={PXv(vEqMl / 2)} y={PYp(curve.pHHalf) - 6} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--stage-good)">½eq · pH=pKa</text>
        </>}
        {/* equivalence point */}
        <circle cx={PXv(vEqMl)} cy={PYp(curve.pHEq)} r={4} fill="var(--stage-warn)" />
        <text x={PXv(vEqMl)} y={PYp(curve.pHEq) - 8} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--stage-warn)">equiv. {vEqMl.toFixed(0)} mL</text>
        {/* curve + marker */}
        <polyline points={path} fill="none" stroke="var(--stage-accent)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={PXv(vAddedMl)} cy={PYp(pH)} r={6} fill={pink > 0.5 ? PINK : 'var(--stage-fg)'} stroke="var(--stage-bg)" strokeWidth={2} />
      </svg>
    </div>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>pH {pH.toFixed(2)}</span>
          <span style={{ fontSize: 13, color: 'var(--stage-muted)' }}>{vAddedMl.toFixed(1)} mL added · {region}</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
        {weak
          ? <><Tex tex={'\\text{pH} = \\text{p}K_a + \\log\\dfrac{[\\mathrm{A^-}]}{[\\mathrm{HA}]}'} block /><span style={{ color: 'var(--stage-muted)' }}>In the buffer region the pH barely moves — at the half-equivalence point [A⁻] = [HA] so <strong style={{ color: 'var(--stage-fg)' }}>pH = pKa = {pKa.toFixed(2)}</strong>. The equivalence point is <strong style={{ color: 'var(--stage-fg)' }}>basic (pH {curve.pHEq.toFixed(1)})</strong> because the conjugate base hydrolyses.</span></>
          : <><Tex tex={'\\text{pH} = -\\log[\\mathrm{H^+}]'} block /><span style={{ color: 'var(--stage-muted)' }}>A strong acid is fully dissociated, so the pH climbs slowly then leaps through <strong style={{ color: 'var(--stage-fg)' }}>pH 7</strong> at the equivalence point and levels off in excess base.</span></>}
      </div>
    </>
  );

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="acid in the flask">
          <span className="lab-field-row">
            <Chip selected={!weak} onClick={() => setAnalyte('strong-acid')}>strong acid (HCl)</Chip>
            <Chip selected={weak} onClick={() => setAnalyte('weak-acid')}>weak acid (CH₃COOH)</Chip>
          </span>
        </Field>
        {weak && <Field label="pKa" value={pKa.toFixed(2)}><Slider value={pKa} min={3} max={6} step={0.1} onChange={setPKa} ariaLabel="acid pKa" /></Field>}
      </ControlBar>
      <ControlBar>
        <Field label="base added" value={`${vAddedMl.toFixed(1)} mL`}>
          <Slider value={vAddedMl} min={0} max={vMaxMl} step={0.5} onChange={setVAddedMl} ariaLabel="volume of base added (mL)" />
        </Field>
      </ControlBar>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<ChallengeCard questions={TITRATION_CHALLENGE} state={challenge} title="Predict" />}>{figure}</LabFrame>;
}
