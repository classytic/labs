'use client';
import { useState, type PointerEvent, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import { ActivitySelect, Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { Arrow, Ball, FigText, Figure, Guide, HUE, Track } from '../../../kit/figure/index.js';
import { lorentzExplorerActivity } from './explorer-activity.js';
import { lorentzExplorerState } from './explorer-core.js';
import type { SpacetimeEvent } from './core.js';
import { clipSegment } from './scene-primitives.js';
export interface LorentzTransformationLabProps {
  event?: SpacetimeEvent;
  beta?: number;
  title?: string;
  prompt?: string;
  activity?: AuthoredActivity;
}
const presets = {
  timelike: { x: 1, ct: 3 },
  lightlike: { x: 3, ct: 3 },
  spacelike: { x: 3, ct: 1 },
} as const;
type PresetKind = keyof typeof presets;
const EVENT_PRESETS: ReadonlyArray<{ value: PresetKind; label: string }> = [
  { value: 'timelike', label: 'Timelike event' },
  { value: 'lightlike', label: 'Lightlike event' },
  { value: 'spacelike', label: 'Spacelike event' },
];

const W = 720;
const H = 392;
const OX = 360;
const OY = 300;
const UNIT = 54;
const X_RANGE = [-5, 5] as const;
const CT_RANGE = [-1, 5] as const;
const toScreen = (v: number) => OX + v * UNIT;
const toY = (v: number) => OY - v * UNIT;
const PLOT = {
  x0: toScreen(X_RANGE[0]),
  y0: toY(CT_RANGE[1]),
  x1: toScreen(X_RANGE[1]),
  y1: toY(CT_RANGE[0]),
};

export function LorentzTransformationLab({
  event: initialEvent = { x: 1, ct: 3 },
  beta: initialBeta = 0.6,
  title = 'Lorentz explorer: one event, two coordinate systems',
  prompt = 'Drag one event through spacetime, then change the moving frame. Coordinates and simultaneity change; the light cone and interval do not.',
  activity,
}: LorentzTransformationLabProps = {}): ReactNode {
  const [event, setEvent] = useState(initialEvent),
    [beta, setBeta] = useState(initialBeta),
    s = lorentzExplorerState(event, beta),
    drag = (e: PointerEvent<HTMLDivElement>) => {
      if (!(e.buttons & 1)) return;
      const r = e.currentTarget.getBoundingClientRect(),
        x = ((e.clientX - r.left) / r.width) * W,
        y = ((e.clientY - r.top) / r.height) * H;
      setEvent({
        x: Math.max(X_RANGE[0], Math.min(X_RANGE[1], (x - OX) / UNIT)),
        ct: Math.max(CT_RANGE[0], Math.min(CT_RANGE[1], (OY - y) / UNIT)),
      });
    };
  const controls = (
      <>
        <Field label="event type">
          <ActivitySelect<PresetKind>
            ariaLabel="event type"
            value={s.kind}
            onChange={(k) => setEvent(presets[k])}
            options={EVENT_PRESETS}
          />
        </Field>
        <Field label="frame speed β" value={beta.toFixed(2)}>
          <Slider
            value={beta}
            min={-0.9}
            max={0.9}
            step={0.01}
            onChange={setBeta}
            ariaLabel="moving frame velocity"
          />
        </Field>
        <Field label="event x" value={event.x.toFixed(2)}>
          <Slider
            value={event.x}
            min={-5}
            max={5}
            step={0.05}
            onChange={(x) => setEvent({ ...event, x })}
            ariaLabel="event space coordinate"
          />
        </Field>
        <Field label="event ct" value={event.ct.toFixed(2)}>
          <Slider
            value={event.ct}
            min={-1}
            max={5}
            step={0.05}
            onChange={(ct) => setEvent({ ...event, ct })}
            ariaLabel="event time coordinate times c"
          />
        </Field>
      </>
    ),
    evidence = (
      <>
        <Readout value={`${s.kind} interval`} sub={`s² = ${s.interval.toFixed(3)}`} />
        <div className="lab-metric-list">
          <div>
            <span>lab frame (x, ct)</span>
            <strong>
              ({s.event.x.toFixed(2)}, {s.event.ct.toFixed(2)})
            </strong>
          </div>
          <div>
            <span>moving frame (x′, ct′)</span>
            <strong>
              ({s.transformed.x.toFixed(2)}, {s.transformed.ct.toFixed(2)})
            </strong>
          </div>
          <div>
            <span>invariance error</span>
            <strong>{Math.abs(s.interval - s.transformedInterval).toExponential(1)}</strong>
          </div>
        </div>
      </>
    ),
    showControls = (context: AuthoredActivityContext): ReactNode =>
      ['act', 'transfer'].includes(context.sequence.current.phase) ? controls : null,
    showEvidence = (context: AuthoredActivityContext): ReactNode =>
      ['observe', 'explain', 'transfer'].includes(context.sequence.current.phase) ? evidence : null;
  const ex = toScreen(event.x);
  const ey = toY(event.ct);
  // the moving frame's axes: x′ (ct = βx) and ct′ (x = βct), clipped to the plot
  const xPrime = clipSegment(toScreen(-5), toY(-5 * beta), toScreen(5), toY(5 * beta), PLOT);
  const ctPrime = clipSegment(toScreen(-beta), toY(-1), toScreen(5 * beta), toY(5), PLOT);
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={activity ?? lorentzExplorerActivity}
      activityId="lorentz-transformation"
      eyebrow="Modern physics · spacetime"
      title={title}
      description={prompt}
      status={
        <>
          <span>β {beta.toFixed(2)}</span>
          <span>{s.kind}</span>
        </>
      }
      controls={showControls}
      evidence={showEvidence}
      observation={`Coordinates change between frames; both calculate the same interval s² = ${s.interval.toFixed(3)}.`}
    >
      {(context) => {
        const showFrame = context.sequence.current.phase !== 'predict';
        return (
          <div
            style={{ touchAction: 'none', cursor: 'crosshair' }}
            onPointerMove={drag}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag(e);
            }}
          >
            <Figure
              viewBox={[W, H]}
              domain="physics"
              label={`Spacetime event ${s.kind}; x ${event.x.toFixed(2)}, ct ${event.ct.toFixed(2)}`}
            >
              {/* grid */}
              {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((v) => (
                <Track
                  key={`x${v}`}
                  points={[
                    [toScreen(v), PLOT.y0],
                    [toScreen(v), PLOT.y1],
                  ]}
                  dashed={false}
                  color={HUE.glass}
                  weight="hair"
                />
              ))}
              {[0, 1, 2, 3, 4, 5].map((v) => (
                <Track
                  key={`t${v}`}
                  points={[
                    [PLOT.x0, toY(v)],
                    [PLOT.x1, toY(v)],
                  ]}
                  dashed={false}
                  color={HUE.glass}
                  weight="hair"
                />
              ))}
              {/* lab-frame axes */}
              <Arrow x1={PLOT.x0 - 20} y1={OY} x2={PLOT.x1 + 24} y2={OY} color={HUE.ink} head={8} />
              <Arrow x1={OX} y1={PLOT.y1 + 4} x2={OX} y2={PLOT.y0 - 8} color={HUE.ink} head={8} />
              <FigText x={PLOT.x1 + 32} y={OY} baseline="middle" size="note" tone="soft">
                x
              </FigText>
              <FigText x={OX + 8} y={PLOT.y0 - 2} size="note" tone="soft">
                ct
              </FigText>
              {/* light cone through the origin */}
              <Track
                points={[
                  [toScreen(-5), toY(5)],
                  [OX, OY],
                  [toScreen(5), toY(5)],
                ]}
                color={HUE[2]}
                weight="line"
              />
              {/* moving-frame axes */}
              {showFrame && xPrime && (
                <Track
                  points={[
                    [xPrime[0], xPrime[1]],
                    [xPrime[2], xPrime[3]],
                  ]}
                  dashed={false}
                  color={HUE[3]}
                  weight="edge"
                />
              )}
              {showFrame && ctPrime && (
                <Track
                  points={[
                    [ctPrime[0], ctPrime[1]],
                    [ctPrime[2], ctPrime[3]],
                  ]}
                  dashed={false}
                  color={HUE[3]}
                  weight="edge"
                />
              )}
              {/* the event and its lab-frame coordinates */}
              <Guide x1={ex} y1={ey} x2={ex} y2={OY} color={HUE[1]} />
              <Guide x1={ex} y1={ey} x2={OX} y2={ey} color={HUE[1]} />
              <Ball cx={ex} cy={ey} r={11} color={HUE[1]} active />
              <FigText x={ex + 16} y={ey - 14}>
                event
              </FigText>
              {/* legend */}
              <Ball cx={90} cy={378} r={5} color={HUE[1]} />
              <FigText x={100} y={378} baseline="middle" size="note" tone="soft">
                event (drag it)
              </FigText>
              <Track
                points={[
                  [220, 378],
                  [244, 378],
                ]}
                color={HUE[2]}
                weight="line"
              />
              <FigText x={252} y={378} baseline="middle" size="note" tone="soft">
                light cone
              </FigText>
              {showFrame && (
                <>
                  <Track
                    points={[
                      [350, 378],
                      [374, 378],
                    ]}
                    dashed={false}
                    color={HUE[3]}
                    weight="edge"
                  />
                  <FigText x={382} y={378} baseline="middle" size="note" tone="soft">
                    x′, ct′ axes of the moving frame
                  </FigText>
                </>
              )}
            </Figure>
          </div>
        );
      }}
    </AuthoredActivityRuntime>
  );
}
