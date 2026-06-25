'use client';

/**
 * HarmonicFormLab — "two waves are secretly one": a cos x + b sin x = R cos(x + α).
 *
 * The whole insight is that adding a cosine and a sine of the SAME frequency gives
 * a SINGLE shifted cosine — and you can SEE why with phasors. The cos term is a
 * vector of length a along the axis; the sin term is a vector of length b at a
 * right angle to it (sin lags cos by 90°). Add them tip-to-tail and the resultant
 * has length R = √(a²+b²) at angle α — exactly the amplitude and phase of the one
 * combined wave. Drag a and b: the phasor triangle and the three waves update live,
 * and the messy two-wave sum visibly collapses onto one clean R cos(x + α).
 *
 * This builds the INTUITION for the auxiliary-angle form (Edexcel "express in the
 * form R cos(x+α)"). The exact R and α arithmetic is left to written working / a
 * paired derivation — the lab is the picture, not the algebra.
 *
 * Convention: a cos x + b sin x = R cos(x + α) ⇒ a = R cos α, b = −R sin α, so
 * α = atan2(−b, a) and the resultant phasor is (a, −b). Tokenized SVG; accessible.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Plot, Vector, Segment, Dot, Label, type Vec2 } from '@classytic/stage';
import { Tex as TexHtml } from '../../core/tex.js';
import { AngleArc, RightAngleMark } from '../../kit/diagram.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion } from '../../kit/frame.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

export interface HarmonicFormProps {
  /** Coefficient of cos x. */
  a?: number;
  /** Coefficient of sin x. */
  b?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const LIM = 8;                 // slider range for a, b
const PHV = 9;                 // phasor half-view (points are ≤ LIM on each axis)
const WAV = 12;                // wave amplitude half-view (R ≤ √(2·8²) ≈ 11.3 fits)

const C_COS = 'var(--stage-accent-2)';
const C_SIN = 'var(--stage-warn)';
const C_R = 'var(--stage-good)';

const HARMONIC_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'shape',
    prompt: 'a cos x + b sin x (same frequency) always combines into…',
    choices: [
      { value: 'one', label: 'one shifted cosine wave' },
      { value: 'two', label: 'two separate waves' },
      { value: 'double', label: 'a wave of double the frequency' },
    ],
    answer: 'one',
    explain: 'Same frequency in → same frequency out: only the amplitude (R) and the phase (α) change.',
  },
  {
    id: 'amp',
    prompt: 'Keep a fixed and increase |b|. The amplitude R of the combined wave…',
    choices: [
      { value: 'up', label: 'increases' },
      { value: 'down', label: 'decreases' },
      { value: 'same', label: 'stays the same' },
    ],
    answer: 'up',
    explain: 'R = √(a² + b²) is the hypotenuse — growing either coefficient lengthens it.',
  },
];

/** LaTeX for "a cos x ± b sin x", tidy for ±1 / 0 coefficients. */
function lhsTex(a: number, b: number): string {
  const cosPart = `${a === 1 ? '' : a === -1 ? '-' : a}\\cos x`;
  const bAbs = Math.abs(b);
  const sinPart = `${bAbs === 1 ? '' : bAbs}\\sin x`;
  return `${cosPart} ${b < 0 ? '-' : '+'} ${sinPart}`;
}

export function HarmonicFormLab({
  a: a0 = 4, b: b0 = -3,
  title = 'Express a cos x + b sin x as one wave R cos(x + α)',
  prompt = 'A cosine plus a sine of the same frequency is secretly a single shifted cosine. Drag a and b and watch the phasors add up.',
  objectives,
}: HarmonicFormProps = {}): ReactNode {
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [showComp, setShowComp] = useState(true);
  const challenge = useChallenge(HARMONIC_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'harmonic-form' });

  const R = Math.hypot(a, b);
  const alpha = Math.atan2(-b, a);                 // a cos x + b sin x = R cos(x + α)
  const sum = (x: number): number => a * Math.cos(x) + b * Math.sin(x);

  // phasor triangle: cos-leg (0,0)→(a,0), sin-leg (a,0)→(a,−b), resultant (0,0)→(a,−b)
  const O: Vec2 = { x: 0, y: 0 };
  const corner: Vec2 = { x: a, y: 0 };
  const tip: Vec2 = { x: a, y: -b };
  const peakX = -alpha;                            // R cos(x+α) peaks where x = −α

  const phasor = (
    <Stage view={{ xMin: -PHV, xMax: PHV, yMin: -PHV, yMax: PHV }} height={280} ariaLabel={`Phasor diagram: cosine component ${a}, sine component ${b}, resultant length ${R.toFixed(2)}`}>
      <Grid step={3} />
      <Axes />
      {showComp && a !== 0 && <Vector tail={O} tip={corner} color={C_COS} weight={2.5} />}
      {showComp && b !== 0 && <Vector tail={corner} tip={tip} color={C_SIN} weight={2.5} />}
      <Vector tail={O} tip={tip} color={C_R} weight={3.5} />
      {a !== 0 && b !== 0 && <RightAngleMark at={corner} u={{ x: -1, y: 0 }} v={{ x: 0, y: -b }} />}
      {R > 0.5 && <AngleArc at={O} from={{ x: 1, y: 0 }} to={tip} rPx={28} label="α" />}
      {showComp && a !== 0 && <Label x={a / 2} y={0} text="a" color={C_COS} size={13} dy={16} />}
      {showComp && b !== 0 && <Label x={a} y={-b / 2} text="b" color={C_SIN} size={13} dx={14} />}
      <Label x={tip.x / 2} y={tip.y / 2} text="R" color={C_R} size={14} dx={-12} dy={-6} />
    </Stage>
  );

  const waves = (
    <Stage view={{ xMin: -Math.PI, xMax: 2 * Math.PI, yMin: -WAV, yMax: WAV }} height={280} preserveAspect={false} ariaLabel="The cosine term, the sine term, and their combined single wave">
      <Grid />
      <Axes />
      {/* amplitude guide lines at ±R */}
      <Segment from={{ x: -Math.PI, y: R }} to={{ x: 2 * Math.PI, y: R }} color={C_R} weight={1} dashed opacity={0.4} />
      <Segment from={{ x: -Math.PI, y: -R }} to={{ x: 2 * Math.PI, y: -R }} color={C_R} weight={1} dashed opacity={0.4} />
      {showComp && <Plot.OfX y={(x) => a * Math.cos(x)} color={C_COS} weight={1.5} />}
      {showComp && <Plot.OfX y={(x) => b * Math.sin(x)} color={C_SIN} weight={1.5} />}
      <Plot.OfX y={sum} color={C_R} weight={3} />
      {/* peak marker: the shift x = −α */}
      <Segment from={{ x: peakX, y: 0 }} to={{ x: peakX, y: R }} color="var(--stage-fg)" weight={1} dashed opacity={0.4} />
      <Dot x={peakX} y={R} r={5} color={C_R} />
      <Label x={peakX} y={R} text="R" color={C_R} size={13} dy={-10} />
      <Label x={peakX} y={0} text="x = −α" color="var(--stage-muted)" size={11} dy={16} />
    </Stage>
  );

  const figure = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 240px', minWidth: 240 }}>{phasor}</div>
      <div style={{ flex: '2 1 320px', minWidth: 300 }}>{waves}</div>
    </div>
  );

  const aside = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 8, fontVariantNumeric: 'tabular-nums' }}>
        <TexHtml tex={lhsTex(a, b)} />
        <TexHtml tex={`= ${R.toFixed(2)}\\cos(x ${alpha < 0 ? '-' : '+'} ${Math.abs(alpha).toFixed(3)})`} />
        <span style={{ fontSize: 13 }}>R = √(a² + b²) = <strong>{R.toFixed(3)}</strong></span>
        <span style={{ fontSize: 13 }}>α = <strong>{alpha.toFixed(3)}</strong> rad = {(alpha * 180 / Math.PI).toFixed(1)}°</span>
      </div>
    </Callout>
  );

  const controls = (
    <ControlBar>
      <Field label="a (cos x)" value={a}><Slider value={a} min={-LIM} max={LIM} step={1} onChange={setA} ariaLabel="coefficient of cosine" /></Field>
      <Field label="b (sin x)" value={b}><Slider value={b} min={-LIM} max={LIM} step={1} onChange={setB} ariaLabel="coefficient of sine" /></Field>
      <Chip selected={showComp} onClick={() => setShowComp((v) => !v)}>show components</Chip>
    </ControlBar>
  );

  const footer = (
    <>
      <p className="lab-prompt">
        The two coloured waves add to the bold one. Its height is <TexHtml tex="R=\sqrt{a^2+b^2}" /> and it peaks at <TexHtml tex="x=-\alpha" /> — the phasor's length and angle.
      </p>
      <ChallengeCard questions={HARMONIC_CHALLENGE} state={challenge} title="Predict" />
      <LiveRegion>{`${a} cos x ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} sin x equals ${R.toFixed(2)} cos(x ${alpha < 0 ? 'minus' : 'plus'} ${Math.abs(alpha).toFixed(3)}).`}</LiveRegion>
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
