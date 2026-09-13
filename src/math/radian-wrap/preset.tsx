'use client';

/**
 * Lay the radius along the rim and count. The count IS the angle.
 *
 * A radian is normally introduced as a conversion factor, which teaches the arithmetic
 * and hides the idea. Here the figure is the whole argument: one circle, the radius
 * drawn as a stick, and that same stick bent onto the circumference again and again.
 * Six fit, then a short stub, and the learner has derived 2π instead of being told it.
 * They commit to a guess first, because "about 3" and "about 6" are both common and
 * being wrong once is what makes 6.28 stay put.
 */

import { useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { Slider } from '../../kit/controls.js';
import { Field, LiveRegion } from '../../kit/frame.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { FigText, Figure, HUE, STROKE, tint } from '../../kit/figure/index.js';
import { TAU, arcPoints, bands, onCircle, readout, type Pt } from './core.js';

export interface RadianWrapProps {
  /** Where the slider starts, in radii of arc laid. Default 1, exactly one radian. */
  startRadians?: number;
  /** Drawn radius in figure units. The COUNT must not depend on it, which is the point. */
  radius?: number;
  title?: string;
  prompt?: string;
}

const W = 440;
const H = 250;
const CX = 150;
const CY = 125;
/** The straightened radius sits here, so "the arc is as long as r" is one glance. */
const RULER_X = 286;

const QUESTIONS: ChallengeQuestion[] = [
  {
    id: 'radii-per-turn',
    prompt: 'Cut a string as long as the radius. How many fit around the whole rim?',
    choices: [
      { value: '3', label: 'About 3' },
      { value: '6', label: 'A little over 6' },
      { value: '57', label: 'About 57' },
      { value: '360', label: '360' },
    ],
    answer: '6',
    explain:
      'The circumference is 2πr, so it holds 2π radii: six whole ones and about 0.28 of another, which is 6.28 radians in a full turn. 57 is the DEGREES in one radian, and 360 is the degrees in a turn.',
  },
];

const poly = (pts: Pt[]): string => pts.map((p) => `${p.x},${p.y}`).join(' ');

export function RadianWrapLab({
  startRadians = 1,
  radius = 88,
  title,
  prompt,
}: RadianWrapProps = {}): ReactNode {
  const [laid, setLaid] = useState(Math.min(TAU, Math.max(0, startRadians)));
  const challenge = useChallenge(QUESTIONS);
  const read = readout(laid, 1);
  useCheckpoint({ solved: read.closed && challenge.allCorrect, activity: 'radian-wrap' });

  const r = radius;
  const c: Pt = { x: CX, y: CY };
  const laidBands = bands(laid);
  const tip = onCircle(c, r, laid);

  const figure = (
    <Figure viewBox={[W, H]} domain="math" label={`${read.whole} whole radii laid along the rim`}>
      {/* The rim not yet covered. */}
      <circle cx={c.x} cy={c.y} r={r} fill="none" stroke={HUE.soft} strokeWidth={STROKE.hair} />

      {/* One band per laid radius, so the count is countable rather than a number. */}
      {laidBands.map((b) => (
        <polyline
          key={b.index}
          // Alternating fill plus a hairline gap, because six same-coloured bands butted
          // together render as ONE ring and the counting, which is the entire lesson,
          // becomes invisible. Rendered before this they were indistinguishable.
          points={poly(arcPoints(c, r, b.from + 0.012, b.to - 0.012))}
          fill="none"
          stroke={b.fraction < 1 ? tint(HUE[1], 35) : b.index % 2 ? HUE[1] : tint(HUE[1], 68)}
          strokeWidth={9}
        />
      ))}

      {/* The number of each laid radius, sitting on its own band. */}
      {laidBands.map((b) => {
        const mid = onCircle(c, r + 19, (b.from + b.to) / 2);
        return (
          <FigText key={`n${b.index}`} x={mid.x} y={mid.y + 4} size="label" tone="soft" anchor="middle">
            {b.fraction < 1 ? `+${b.fraction.toFixed(2)}` : String(b.index)}
          </FigText>
        );
      })}

      {/* The radius itself: the unit being counted, and the moving arm. */}
      <line x1={c.x} y1={c.y} x2={c.x + r} y2={c.y} stroke={HUE.ink} strokeWidth={STROKE.line} />
      <line x1={c.x} y1={c.y} x2={tip.x} y2={tip.y} stroke={HUE[2]} strokeWidth={STROKE.line} />
      <circle cx={c.x} cy={c.y} r={3} fill={HUE.ink} />
      <FigText x={c.x + r / 2} y={c.y - 8} size="label" anchor="middle">
        r
      </FigText>

      {/* The same length, straightened, beside the circle. */}
      <FigText x={RULER_X} y={40} size="label" tone="soft" anchor="start">
        one radius, straightened
      </FigText>
      <line x1={RULER_X} y1={54} x2={RULER_X + r} y2={54} stroke={HUE[1]} strokeWidth={7} />
      <line x1={RULER_X} y1={47} x2={RULER_X} y2={61} stroke={HUE.ink} strokeWidth={STROKE.hair} />
      <line x1={RULER_X + r} y1={47} x2={RULER_X + r} y2={61} stroke={HUE.ink} strokeWidth={STROKE.hair} />

      {/* The count, large, beside the figure rather than buried under it. */}
      <FigText x={RULER_X} y={104} size="measure" anchor="start">
        {`${read.radians.toFixed(2)} rad`}
      </FigText>
      <FigText x={RULER_X} y={128} size="label" tone="soft" anchor="start">
        {`= ${read.degrees.toFixed(0)}°`}
      </FigText>
      <FigText x={RULER_X} y={154} size="label" anchor="start">
        {read.whole === 0
          ? 'no whole radius yet'
          : `${read.whole} whole radi${read.whole === 1 ? 'us' : 'i'}`}
      </FigText>
      {read.closed && (
        <FigText x={RULER_X} y={178} size="label" tone="good" anchor="start">
          the rim is closed
        </FigText>
      )}
    </Figure>
  );

  return (
    <Activity.Root className="math-radian-wrap">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Angle measure"
          title={title ?? 'One radian, measured in radii'}
          description={
            prompt ?? 'Lay the radius along the rim, one length at a time, and count how many fit.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Workspace>
        <Activity.Canvas label="Radius laid along the rim">{figure}</Activity.Canvas>
        <Activity.Dock>
          {/* No Readout cards: the figure already states the angle, the degrees and the
              count. Repeating them here pushed the figure down to a third of the frame
              and said the same number three times. */}
          <Field label="lay the radius" value={`${read.radians.toFixed(2)} rad`}>
            <Slider
              value={Math.round(laid * 100)}
              min={0}
              max={Math.round(TAU * 100)}
              step={1}
              onChange={(v) => setLaid(v / 100)}
              ariaLabel="radii of arc laid along the rim"
              valueText={`${read.radians.toFixed(2)} radians`}
            />
          </Field>
        </Activity.Dock>
      </Activity.Workspace>

      <ChallengeCard questions={QUESTIONS} state={challenge} />

      <Activity.Feedback>
        <span>What to notice</span>
        <div>
          Make the circle bigger and the arc gets longer, but so does the radius, and the count does not
          move. That is why an angle in radians is a pure number with no units attached.
        </div>
      </Activity.Feedback>

      <LiveRegion>
        {`${read.radians.toFixed(2)} radians laid, ${read.degrees.toFixed(0)} degrees, ${read.whole} whole radii.`}
      </LiveRegion>
    </Activity.Root>
  );
}
