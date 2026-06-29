'use client';

/**
 * ElectricFieldLab, Coulomb's field you can see and probe, on the same
 * @classytic/stage `field` kernel that draws magnetism (one kernel → both). Drag
 * two charges (flip either +/−); field lines retrace live, flowing OUT of + into −.
 * Drop the test charge anywhere and a force arrow F = qE appears, toward + or away,
 * depending on its sign. Interactive (recomputed on drag), not a timed sim.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, MovableDot, useCoords, type Vec2 } from '@classytic/stage';
import { fieldAt, fieldLines, type FieldSource, type Bounds } from '@classytic/stage/field';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { Chip } from '../../kit/controls.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

const VIEW: Bounds = { xMin: -6.5, xMax: 6.5, yMin: -4.1, yMax: 4.1 };

const EFIELD_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'lines',
    prompt: 'Electric field lines point…',
    choices: [
      { value: 'out', label: 'out of + and into −' },
      { value: 'in', label: 'into + and out of −' },
    ],
    answer: 'out',
    explain: 'Field lines flow OUT of a positive charge and INTO a negative one.',
  },
  {
    id: 'force',
    prompt: 'A positive test charge placed near a + charge feels a force…',
    choices: [
      { value: 'away', label: 'pushing it away' },
      { value: 'toward', label: 'pulling it toward' },
      { value: 'none', label: 'no force at all' },
    ],
    answer: 'away',
    explain: 'F = qE points along E for a + charge, so it is pushed away from the + charge (like repels like).',
  },
];
const POS = 'var(--stage-danger, #e03131)';   // + charge / red
const NEG = 'var(--stage-accent, #3b82f6)';    // − charge / blue
const FORCE = 'var(--stage-good)';
const mag = (v: Vec2): number => Math.hypot(v.x, v.y) || 1;

export interface ElectricFieldProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
}

function ChargeFigure({ sources, lines, test, testSign }: {
  sources: FieldSource[];
  lines: { points: Vec2[]; sign: number }[];
  test: Vec2;
  testSign: number;
}): ReactNode {
  const c = useCoords();
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);
  const arrow = (a: Vec2, b: Vec2, key: string, color: string): ReactNode => {
    const [ax, ay] = P(a), [bx, by] = P(b);
    const ang = Math.atan2(by - ay, bx - ax), s = 7;
    return <polygon key={key} points={`${bx},${by} ${bx - s * Math.cos(ang - 0.5)},${by - s * Math.sin(ang - 0.5)} ${bx - s * Math.cos(ang + 0.5)},${by - s * Math.sin(ang + 0.5)}`} fill={color} />;
  };

  // force on the test charge: F = q·E
  const E = fieldAt(sources, test);
  const Em = mag(E);
  const dir = { x: (testSign * E.x) / Em, y: (testSign * E.y) / Em };
  const fTip = { x: test.x + dir.x * 1.1, y: test.y + dir.y * 1.1 };

  return (
    <>
      {lines.map((ln, i) => (
        <g key={`l${i}`}>
          <polyline points={ln.points.map((pt) => P(pt).join(',')).join(' ')} fill="none" stroke="color-mix(in oklab, var(--stage-accent) 60%, transparent)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          {ln.points.length > 24 && (() => { const j = Math.floor(ln.points.length * 0.45); return arrow(ln.points[j]!, ln.points[j + 2]!, `a${i}`, 'var(--stage-accent)'); })()}
        </g>
      ))}
      {/* force arrow on the test charge */}
      {(() => { const [tx, ty] = P(test); const [fx, fy] = P(fTip); return <g style={{ pointerEvents: 'none' }}><line x1={tx} y1={ty} x2={fx} y2={fy} stroke={FORCE} strokeWidth={3} strokeLinecap="round" />{arrow(test, fTip, 'F', FORCE)}<text x={fx + 6} y={fy + 4} fontSize={12} fontWeight={800} fill={FORCE}>F</text></g>; })()}
      {/* charges */}
      {/* test charge marker */}
      {(() => { const [x, y] = P(test); return <g style={{ pointerEvents: 'none' }}><circle cx={x} cy={y} r={8} fill="var(--stage-bg)" stroke={FORCE} strokeWidth={2.5} /><text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill={FORCE}>{testSign > 0 ? '+' : '−'}</text></g>; })()}
    </>
  );
}

/** The charge discs with their ± sign, drawn ON TOP so the drag handles never hide them. */
function ChargeSymbols({ charges }: { charges: { at: Vec2; q: number }[] }): ReactNode {
  const c = useCoords();
  return (
    <g style={{ pointerEvents: 'none' }}>
      {charges.map((ch, i) => {
        const [x, y] = c.toPx(ch.at.x, ch.at.y);
        return <g key={i}><circle cx={x} cy={y} r={15} fill={ch.q > 0 ? POS : NEG} stroke="var(--stage-bg)" strokeWidth={2} /><text x={x} y={y + 5} textAnchor="middle" fontSize={18} fontWeight={800} fill="white">{ch.q > 0 ? '+' : '−'}</text></g>;
      })}
    </g>
  );
}

export function ElectricFieldLab({
  title = 'Electric field: charges & the force you feel',
  prompt = 'Drag the two charges and flip their signs; field lines flow out of + into −. Drop the test charge and watch the force F = qE.',
  objectives = ['Read an electric field as field lines (out of +, into −)', 'See like charges repel, opposites attract', 'Feel the force on a test charge: F = qE'],
}: ElectricFieldProps = {}): ReactNode {
  const [a, setA] = useState<Vec2>({ x: -2.2, y: 0 });
  const [b, setB] = useState<Vec2>({ x: 2.2, y: 0 });
  const [qa, setQa] = useState(1);
  const [qb, setQb] = useState(-1);
  const [test, setTest] = useState<Vec2>({ x: 0, y: 2.3 });
  const [testSign, setTestSign] = useState(1);

  const challenge = useChallenge(EFIELD_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'electric-field' });

  const charges = useMemo(() => [{ at: a, q: qa }, { at: b, q: qb }], [a, b, qa, qb]);
  const sources = useMemo<FieldSource[]>(() => charges.map((ch) => ({ kind: 'point', at: ch.at, q: ch.q })), [charges]);
  const lines = useMemo(() => fieldLines(sources, { perSource: 14, step: 0.07, maxSteps: 700, bounds: VIEW, seed: 0.35 }), [sources]);

  const figure = (
    <Stage view={VIEW} height={420} ariaLabel="Electric field lines from two charges, with a draggable test charge feeling a force">
      <ChargeFigure sources={sources} lines={lines} test={test} testSign={testSign} />
      <MovableDot value={a} onMove={(p) => setA(p)} color={qa > 0 ? POS : NEG} ariaLabel="charge A" r={9} />
      <MovableDot value={b} onMove={(p) => setB(p)} color={qb > 0 ? POS : NEG} ariaLabel="charge B" r={9} />
      <MovableDot value={test} onMove={(p) => setTest(p)} color={FORCE} ariaLabel="test charge" r={8} />
      <ChargeSymbols charges={charges} />
    </Stage>
  );

  const controls = (
    <ControlBar>
      <Field label="charge A">
        <span className="lab-field-row">
          <Chip selected={qa > 0} onClick={() => setQa(1)}>+</Chip>
          <Chip selected={qa < 0} onClick={() => setQa(-1)}>−</Chip>
        </span>
      </Field>
      <Field label="charge B">
        <span className="lab-field-row">
          <Chip selected={qb > 0} onClick={() => setQb(1)}>+</Chip>
          <Chip selected={qb < 0} onClick={() => setQb(-1)}>−</Chip>
        </span>
      </Field>
      <Field label="test charge">
        <span className="lab-field-row">
          <Chip selected={testSign > 0} onClick={() => setTestSign(1)}>+ probe</Chip>
          <Chip selected={testSign < 0} onClick={() => setTestSign(-1)}>− probe</Chip>
        </span>
      </Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={<ChallengeCard questions={EFIELD_CHALLENGE} state={challenge} title="Predict" />}>{figure}</LabFrame>;
}
