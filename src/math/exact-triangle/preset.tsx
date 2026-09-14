'use client';

/**
 * ExactTriangleLab — where the Paper 1 values actually come from.
 *
 * sin 30 = 1/2 is taught as a fact to memorise, and a memorised fact is the first thing to go in an
 * exam room. It is not a fact, it is a measurement of half an equilateral triangle, and a learner
 * who has watched the cut can rebuild every value on the page in ten seconds with no calculator.
 *
 * So the lab starts with the WHOLE shape and cuts it. An equilateral triangle of side 2 splits down
 * the middle into base 1, hypotenuse 2 and height root 3; a unit square splits on its diagonal into
 * 1, 1 and root 2. Those two pictures carry every exact value 4024 asks for, and the slider is what
 * connects the shape a learner already knows to the numbers they are told to remember.
 *
 * The ratios are shown in BOTH forms, 1/root 2 and root 2 over 2, because a mark scheme accepts
 * either and a learner who has only seen one form assumes the other is a different number.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Label, Dot } from '@classytic/stage';
import { Activity } from '../../kit/activity.js';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

export type ExactShape = 'half-equilateral' | 'half-square';

export interface ExactTriangleProps {
  shape?: ExactShape;
  /** Which angle to read the ratios at. 30 or 60 for the triangle, 45 for the square. */
  angle?: 30 | 45 | 60;
  /** How far the cut has opened when the lab loads, 0 whole and 1 fully separated. */
  cut?: number;
  title?: string;
  prompt?: string;
  height?: number;
}

interface P2 {
  x: number;
  y: number;
}

const R3 = Math.sqrt(3);
const R2 = Math.sqrt(2);

/** Exact ratios, written the two ways a mark scheme accepts. */
const RATIOS: Record<number, { sin: string; cos: string; tan: string; also?: string }> = {
  30: { sin: '1/2', cos: '√3/2', tan: '1/√3', also: 'tan 30° is also √3/3' },
  60: { sin: '√3/2', cos: '1/2', tan: '√3' },
  45: { sin: '1/√2', cos: '1/√2', tan: '1', also: 'sin 45° is also √2/2' },
};

export function ExactTriangleLab({
  shape = 'half-equilateral',
  angle,
  cut: cut0 = 0,
  title = 'Where the exact values come from',
  prompt = 'Open the cut, then read the two sides off the half that is left.',
  height = 330,
}: ExactTriangleProps = {}): ReactNode {
  const [cut, setCut] = useState(clamp(cut0, 0, 1));
  const defaultAngle: 30 | 45 | 60 = shape === 'half-square' ? 45 : 60;
  const [which, setWhich] = useState<30 | 45 | 60>(angle ?? defaultAngle);

  const isSquare = shape === 'half-square';
  const open = cut > 0.98;
  useCheckpoint({ solved: open, activity: 'exact-triangle' });

  /**
   * The kept half stays put and the discarded half slides away, so the learner watches one shape
   * become the other rather than two shapes appearing side by side.
   */
  const geom = useMemo(() => {
    if (isSquare) {
      const keep: P2[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ];
      const drop: P2[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ];
      return {
        keep,
        drop,
        slide: { x: -1.25, y: 0.35 },
        rightAngleAt: { x: 1, y: 0 },
        legs: [
          { a: { x: 0, y: 0 }, b: { x: 1, y: 0 }, text: '1', dy: 22, dx: 0 },
          { a: { x: 1, y: 0 }, b: { x: 1, y: 1 }, text: '1', dy: 0, dx: 20 },
        ],
        hyp: { a: { x: 0, y: 0 }, b: { x: 1, y: 1 }, text: '√2' },
        marks: [
          { at: { x: 0, y: 0 }, deg: 45 as const },
          { at: { x: 1, y: 1 }, deg: 45 as const },
        ],
      };
    }
    const keep: P2[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: R3 },
    ];
    const drop: P2[] = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: R3 },
    ];
    return {
      keep,
      drop,
      slide: { x: -1.5, y: 0 },
      rightAngleAt: { x: 0, y: 0 },
      legs: [
        { a: { x: 0, y: 0 }, b: { x: 1, y: 0 }, text: '1', dy: 22, dx: 0 },
        { a: { x: 0, y: 0 }, b: { x: 0, y: R3 }, text: '√3', dy: 0, dx: -22 },
      ],
      hyp: { a: { x: 1, y: 0 }, b: { x: 0, y: R3 }, text: '2' },
      marks: [
        { at: { x: 1, y: 0 }, deg: 60 as const },
        { at: { x: 0, y: R3 }, deg: 30 as const },
      ],
    };
  }, [isSquare]);

  const slid = geom.drop.map((p) => ({
    x: p.x + geom.slide.x * cut,
    y: p.y + geom.slide.y * cut,
  }));

  const angleChoices = [...new Set(geom.marks.map((m) => m.deg))];
  const r = RATIOS[which]!;

  const figure = (
    <Stage
      view={{ xMin: -2.9, xMax: 2.0, yMin: -0.9, yMax: 2.4 }}
      height={height}
      preserveAspect={true}
      ariaLabel={`${isSquare ? 'A unit square' : 'An equilateral triangle of side 2'} cut into two halves; the kept half has sides ${geom.legs.map((l) => l.text).join(', ')} and ${geom.hyp.text}`}
    >
      <Polygon
        points={slid}
        color="var(--stage-fg)"
        fill="var(--stage-fg)"
        fillOpacity={0.05}
        opacity={0.45}
        weight={1.2}
      />
      <Polygon
        points={geom.keep}
        color="var(--stage-accent)"
        fill="var(--stage-accent)"
        fillOpacity={0.16}
        weight={2}
      />

      {/* The right angle, marked once the cut has actually made one. */}
      {(() => {
        const m = 0.14;
        const c = geom.rightAngleAt;
        const a = isSquare ? { x: c.x - m, y: c.y } : { x: c.x + m, y: c.y };
        const b = { x: c.x, y: c.y + m };
        const d = { x: a.x, y: b.y };
        return (
          <Polygon
            points={[a, d, b]}
            color="var(--stage-accent)"
            fill="var(--stage-accent)"
            fillOpacity={0}
            weight={1.4}
            opacity={cut}
          />
        );
      })()}

      {geom.legs.map((l, i) => (
        <Label
          key={`leg${i}`}
          x={(l.a.x + l.b.x) / 2}
          y={(l.a.y + l.b.y) / 2}
          text={l.text}
          color="var(--stage-muted)"
          size={14}
          dx={l.dx}
          dy={l.dy}
        />
      ))}
      <Segment from={geom.hyp.a} to={geom.hyp.b} color="var(--stage-good)" weight={3} />
      <Label
        x={(geom.hyp.a.x + geom.hyp.b.x) / 2}
        y={(geom.hyp.a.y + geom.hyp.b.y) / 2}
        text={geom.hyp.text}
        color="var(--stage-good)"
        size={14}
        dx={22}
        dy={-8}
      />

      {geom.marks.map((m, i) => (
        <Label
          key={`ang${i}`}
          x={m.at.x}
          y={m.at.y}
          text={`${m.deg}°`}
          color={m.deg === which ? 'var(--stage-good)' : 'var(--stage-muted)'}
          size={13}
          dx={m.at.x > 0.5 ? -26 : 20}
          dy={m.at.y > 1 ? 20 : -18}
        />
      ))}
      {geom.marks
        .filter((m) => m.deg === which)
        .map((m, i) => (
          <Dot key={`sel${i}`} x={m.at.x} y={m.at.y} r={5} color="var(--stage-good)" />
        ))}
    </Stage>
  );

  return (
    <Activity.Root className="math-exact-triangle-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Paper 1, no calculator" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{open ? 'Cut open' : 'Still whole'}</strong>
        <span>
          sin {which}&deg; = {r.sin}
        </span>
        <span>
          cos {which}&deg; = {r.cos}
        </span>
        <span>
          tan {which}&deg; = {r.tan}
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="A shape cut into two halves">{figure}</Activity.Canvas>
        <Activity.Dock>
          <Field label="open the cut" value={`${Math.round(cut * 100)}%`}>
            <Slider
              value={Math.round(cut * 100)}
              min={0}
              max={100}
              step={2}
              onChange={(v) => setCut(clamp(v / 100, 0, 1))}
              ariaLabel="open the cut"
            />
          </Field>
          {/* Both angles of the half-square are 45, so the chooser would offer the same option
              twice. Dedupe, and drop the control entirely when there is nothing to choose. */}
          {angleChoices.length > 1 ? (
            <Field label="read at">
              <Segmented
                value={String(which)}
                options={angleChoices.map((deg) => ({ value: String(deg), label: `${deg}°` }))}
                onChange={(v) => setWhich(Number(v) as 30 | 45 | 60)}
                ariaLabel="which angle to read the ratios at"
              />
            </Field>
          ) : null}
        </Activity.Dock>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>{open ? 'Complete' : 'Observe'}</span>
        <div>
          {open
            ? `Every ratio here is read straight off the picture: opposite over hypotenuse, adjacent over hypotenuse, opposite over adjacent. ${r.also ?? 'Rationalise a root on the bottom if the question asks for it.'}`
            : isSquare
              ? 'A square of side 1, about to be cut along its diagonal. Predict the length of that diagonal before you open it.'
              : 'An equilateral triangle of side 2, about to be cut down the middle. Predict the height before you open it.'}
        </div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {`${open ? 'Cut open' : 'Whole'}; sin ${which} = ${r.sin}, cos ${which} = ${r.cos}, tan ${which} = ${r.tan}`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{open ? 'Rebuild it, do not memorise it' : 'Open the cut'}</strong>
          <span>{isSquare ? 'unit square, cut on the diagonal' : 'equilateral side 2, cut down the middle'}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
