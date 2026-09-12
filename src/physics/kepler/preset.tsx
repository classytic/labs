'use client';

/**
 * KeplerLab, "Equal areas, equal time", the shape and rhythm of orbits.
 *
 * A planet on a true ellipse with the star at one FOCUS (Kepler 1). It moves by
 * solving Kepler's equation M = E − e·sinE, so it genuinely speeds up at
 * perihelion and dawdles at aphelion, and the wedges swept in equal time slices
 * (shaded alternately) come out EQUAL in area (Kepler 2): fat-and-short near the
 * star, thin-and-long far away. The period follows T² ∝ a³ (Kepler 3), so a wider
 * orbit takes disproportionately longer.
 *
 * Drag eccentricity from a circle to a stretched ellipse; drag the semi-major
 * axis and watch the period balloon. Ambient PlayWrap. Tokenized SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Polyline, Polygon, Dot, Segment, Label, type Vec2 } from '@classytic/stage';
import { usePlayGate } from '../../kit/play.js';
import { SunGlyph, EarthGlyph } from '../../kit/space.js';
import { Slider, Chip } from '../../kit/controls.js';
import { Field, Control, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { MechanicsVector, SceneSurface } from '../mechanics/presentation.js';
import { ellipseStateAtMeanAnomaly, keplerPeriod } from '../orbital/core.js';

const KEPLER_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Equal areas, unequal speeds',
  objectives: [
    'Locate a star at an ellipse focus',
    'Explain equal areas in equal times',
    'Relate semi-major axis to orbital period',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the fastest point',
      lead: 'Commit before playing the orbit.',
      success: 'speed-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Play one orbit',
      lead: 'Watch the planet change speed around the ellipse.',
      controls: true,
      reveal: ['model'],
      success: 'played',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare equal-time wedges',
      lead: 'Compare wedge shapes while their areas remain equal.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the speed change',
      lead: 'Use equal swept area to explain fast perihelion motion.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Stretch the orbit',
      lead: 'Change eccentricity or semi-major axis and compare period.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'orbit-changed',
    },
  ],
  questions: [
    {
      id: 'speed',
      prompt: 'Where does a planet move fastest in an elliptical orbit?',
      choices: [
        { value: 'perihelion', label: 'At perihelion, nearest the star' },
        { value: 'aphelion', label: 'At aphelion, farthest away' },
        { value: 'constant', label: 'Its speed is constant' },
      ],
      answer: 'perihelion',
      explain:
        'The radius is shorter near perihelion, so sweeping equal area in equal time requires a longer arc and greater speed.',
    },
  ],
  success: [
    {
      id: 'speed-answer',
      source: 'answer',
      key: 'speed',
      operator: 'eq',
      value: 'perihelion',
      pendingLabel: 'Choose where orbital speed is greatest.',
    },
    {
      id: 'played',
      source: 'metric',
      key: 'played',
      operator: 'eq',
      value: true,
      pendingLabel: 'Play the orbit.',
    },
    {
      id: 'orbit-changed',
      source: 'metric',
      key: 'orbitChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the orbit shape or size.',
    },
  ],
};

export interface KeplerProps {
  /** Semi-major axis (drawn units). */
  semiMajor?: number;
  eccentricity?: number;
  /** Show the equal-time / equal-area wedges. */
  wedges?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ hide: ['equal-area wedges'] }`. */
  controlConfig?: ControlConfig;
  activity?: string | AuthoredActivity;
}

const N_WEDGE = 12; // equal-time slices

export function KeplerLab({
  semiMajor = 4,
  eccentricity = 0.5,
  wedges = true,
  title = 'Kepler: equal areas in equal time',
  prompt = 'The planet rides a true ellipse with the star at a focus. It speeds up near the star and slows far away, yet the wedge it sweeps in each equal time-slice has the same area (Kepler’s 2nd law). Stretch the orbit, and the period grows as T² ∝ a³.',
  objectives,
  controlConfig,
  activity = 'kepler',
}: KeplerProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'kepler';
  const authoredActivity = typeof activity === 'string' ? KEPLER_ACTIVITY : activity;
  const [a, setA] = useState(clamp(semiMajor, 2.5, 5));
  const [e, setE] = useState(clamp(eccentricity, 0, 0.85));
  const [showWedge, setShowWedge] = useState(wedges);
  const gate = usePlayGate();

  const tRef = useRef(0);

  const c = a * e; // focus offset (star at origin)
  const b = a * Math.sqrt(1 - e * e);
  const T = keplerPeriod(a, 1.6);

  useFrameTick(gate.running, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
  });

  // position from eccentric anomaly (star/focus at origin)
  const pos = (M: number): Vec2 => {
    const state = ellipseStateAtMeanAnomaly(a, e, M);
    return { x: state.x, y: state.y };
  };

  const M0 = (2 * Math.PI * (tRef.current / T)) % (2 * Math.PI);
  const planet = pos(M0);
  const nextPlanet = pos(M0 + 0.035);
  const velocityScale = 4.5;
  const velocityTip = {
    x: planet.x + (nextPlanet.x - planet.x) * velocityScale,
    y: planet.y + (nextPlanet.y - planet.y) * velocityScale,
  };

  // full ellipse outline
  const outline: Vec2[] = [];
  for (let i = 0; i <= 96; i++) {
    const E = (i / 96) * 2 * Math.PI;
    outline.push({ x: -c + a * Math.cos(E), y: b * Math.sin(E) });
  }

  /**
   * One equal-time wedge, bounded by the ORBIT rather than by a straight chord.
   *
   * This used to draw a triangle from the focus to the two end points. A triangle is not the
   * region the planet sweeps: the far edge is the curved path, and the curvature differs between
   * perihelion and aphelion. Measured across twelve slices the triangles varied by 29.6% in area
   * while the true sectors agree to 0.1%, and the perihelion wedge came out the SMALLEST. So the
   * picture showed the opposite of the law printed beside it. Following the arc costs a handful
   * of points and makes the equality something a learner can actually see.
   */
  const wedge = (index: number): Vec2[] => {
    const from = (2 * Math.PI * index) / N_WEDGE;
    const to = (2 * Math.PI * (index + 1)) / N_WEDGE;
    const arc: Vec2[] = [{ x: 0, y: 0 }];
    for (let k = 0; k <= 14; k++) arc.push(pos(from + ((to - from) * k) / 14));
    return arc;
  };

  const polygonArea = (pts: Vec2[]): number => {
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!;
      const q = pts[(i + 1) % pts.length]!;
      sum += p.x * q.y - q.x * p.y;
    }
    return Math.abs(sum) / 2;
  };

  // The two the law is actually about: the slice starting at perihelion, and the one opposite it.
  // Shading all twelve equally turns the comparison into a pinwheel, which is the one thing the
  // eye cannot read areas off.
  const nearIndex = 0;
  const farIndex = Math.floor(N_WEDGE / 2);
  const nearWedge = wedge(nearIndex);
  const farWedge = wedge(farIndex);
  const nearArea = polygonArea(nearWedge);
  const farArea = polygonArea(farWedge);

  const peri = a * (1 - e),
    apo = a * (1 + e);
  const view = { xMin: -(a + c) - 1, xMax: a - c + 1, yMin: -b - 1, yMax: b + 1 };

  const figure = (
    <SceneSurface ref={gate.ref} tone="space">
      <Stage
        view={view}
        height={300}
        preserveAspect
        ariaLabel={`Elliptical orbit, eccentricity ${e.toFixed(2)}, star at a focus`}
      >
        {/* The two the law compares, drawn to be looked at rather than decorated with. One is
            short and fat, the other long and thin, and they enclose the same area. */}
        {showWedge && (
          <>
            <Polygon
              points={nearWedge}
              color="var(--stage-warn)"
              fill="var(--stage-warn)"
              fillOpacity={0.45}
              weight={1.4}
            />
            <Polygon
              points={farWedge}
              color="var(--stage-good)"
              fill="var(--stage-good)"
              fillOpacity={0.45}
              weight={1.4}
            />
          </>
        )}
        {/* orbit path */}
        <Polyline points={outline} color="var(--stage-accent)" opacity={0.72} weight={2.2} />
        {/* major axis + foci */}
        <Segment
          from={{ x: -(a + c), y: 0 }}
          to={{ x: a - c, y: 0 }}
          color="var(--stage-fg)"
          opacity={0.25}
          weight={1}
          dashed
        />
        <Dot x={-2 * c} y={0} r={3} color="var(--stage-muted)" />
        {/* star at the focus */}
        <SunGlyph center={{ x: 0, y: 0 }} r={0.5} />
        {/* perihelion / aphelion ticks. The perihelion label sits BELOW the axis: the planet
            starts on top of that point, and the label was being overprinted by the glyph. */}
        <Label x={a - c} y={0} text="perihelion" color="var(--stage-muted)" size={9} dy={14} anchor="end" />
        <Label
          x={-(a + c)}
          y={0}
          text="aphelion"
          color="var(--stage-muted)"
          size={9}
          dy={-6}
          anchor="start"
        />
        {/* the planet + sweep line to the star */}
        <Segment from={{ x: 0, y: 0 }} to={planet} color="var(--stage-accent)" opacity={0.7} weight={1.2} />
        <EarthGlyph center={planet} r={0.34} atmosphere={false} />
        <MechanicsVector
          tail={planet}
          tip={velocityTip}
          color="var(--stage-good)"
          label="v"
          labelDy={-7}
          labelSize={11}
          active
        />
      </Stage>
    </SceneSurface>
  );

  const aside = (
    <>
      <div className="physics-orbital-ledger">
        <div>
          <span>Eccentricity · e</span>
          <strong>
            {e.toFixed(2)}
            {e < 0.02 ? ' · circle' : ''}
          </strong>
        </div>
        <div>
          <span>Perihelion · aphelion</span>
          <strong>
            {peri.toFixed(1)} · {apo.toFixed(1)}
          </strong>
        </div>
        <div>
          <span>Period · T ∝ a¹·⁵</span>
          <strong>{T.toFixed(1)}</strong>
        </div>
        <div data-highlight>
          <span>Kepler invariant · T²/a³</span>
          <strong>{((T * T) / (a * a * a)).toFixed(2)}</strong>
        </div>
        {/* The claim, as a number the learner can check, rather than a sentence to be believed.
            Two wedges of visibly different shape, measured, agreeing. */}
        <div data-highlight>
          <span>Wedge area · near · far</span>
          <strong>
            {nearArea.toFixed(2)} · {farArea.toFixed(2)}
          </strong>
        </div>
      </div>
      <p className="physics-explain">
        The two bright wedges are equal time-slices. One is short and fat near the star, the other long and
        thin far from it, and the measured areas above agree (Kepler’s 2nd law). Equal area in equal time is
        only possible if the planet moves fastest at perihelion. T²/a³ stays constant as you widen the orbit
        (Kepler’s 3rd law).
      </p>
      <LiveRegion>{`Eccentricity ${e.toFixed(2)}, period ${T.toFixed(1)}. Equal-time wedges have equal area.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <div className="lab-field-row">
        <Chip selected={gate.playing} onClick={() => gate.setPlaying(!gate.playing)}>
          {gate.playing ? 'Pause orbit' : 'Play orbit'}
        </Chip>
        <Chip
          selected={false}
          onClick={() => {
            gate.setPlaying(false);
            tRef.current = 0;
          }}
        >
          Reset
        </Chip>
      </div>
      <Control name="equal-area wedges">
        <Chip selected={showWedge} onClick={() => setShowWedge((w) => !w)}>
          equal-area wedges
        </Chip>
      </Control>
      <Field label="eccentricity" value={e.toFixed(2)}>
        <Slider value={e} min={0} max={0.7} step={0.05} onChange={setE} ariaLabel="eccentricity" />
      </Field>
      <Field label="semi-major a" value={a.toFixed(1)}>
        <Slider
          value={a}
          min={2.5}
          max={5}
          step={0.5}
          onChange={(n) => setA(clamp(n, 2.5, 5))}
          ariaLabel="semi-major axis"
        />
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Orbital mechanics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{e < 0.02 ? 'Circular orbit' : 'Elliptical orbit'}</span>
          <span>e {e.toFixed(2)}</span>
          <span>T {T.toFixed(1)}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="Equal changes in mean anomaly represent equal time intervals. The focus-to-orbit wedges therefore sweep equal areas even though their shapes differ."
      transcript={
        <p>{`The orbit has eccentricity ${e.toFixed(2)}, perihelion ${peri.toFixed(1)}, aphelion ${apo.toFixed(1)}, and period ${T.toFixed(1)}. Equal-time wedges have equal area.`}</p>
      }
      controlConfig={controlConfig}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="played"
            met={gate.playing || tRef.current > 0}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="orbit-changed"
            met={Math.abs(a - semiMajor) > 0.01 || Math.abs(e - eccentricity) > 0.01}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
