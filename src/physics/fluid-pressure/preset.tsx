'use client';

/**
 * FluidPressureLab, hydrostatic pressure as a function of DEPTH alone.
 *
 * The classic misconception is an amount-of-stuff intuition: a wide tank holds far more water
 * than a thin tube, so surely the water at its bottom is "pressed harder". Telling a learner
 * p = rho*g*h does not dislodge that, because the formula is silent about shape and the learner
 * reads the silence as "shape must be a special case". The only thing that dislodges it is
 * seeing the SAME NUMBER appear in three visibly unequal vessels at once.
 *
 * So the figure is three connected vessels sharing one base manifold: a wide tank, a narrow
 * tube, and a cone that flares upward. Because they are joined, the fluid finds one common
 * level by itself, which removes the obvious escape hatch ("you filled them differently"). One
 * dashed depth line then sweeps all three at once and each vessel carries its own gauge tag.
 * Drag the probe and three identical readings move together. Nothing on screen ever privileges
 * the tank, so there is no story left in which width matters.
 *
 * Why the vessels are drawn CONNECTED rather than as three separate jars: a separate jar invites
 * "you must have poured more into that one". A shared manifold makes equal level a consequence
 * of the physics rather than of the drawing, and it quietly previews the hydraulic press.
 *
 * The fluid chips carry the contrast that shape does not. Swapping water for mercury at a fixed
 * depth multiplies every reading by 13.6, which shows the learner that the formula's two
 * physical inputs really are density and height, and that "how much fluid" is not among them.
 *
 * The atmosphere toggle is deliberately opt-in and GROWS the frame upward: turning it on
 * literally adds the air to the picture and adds its constant to every gauge. Kept off, the
 * scene stays a clean gauge-pressure argument; kept as a toggle, it never crowds the vessels.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Polygon, Polyline, Segment, Vector, Dot, Label, MovableDot } from '@classytic/stage';
import { Field } from '../../kit/frame.js';
import { Slider, Segmented } from '../../kit/controls.js';
import { Tex } from '../../core/tex.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { SceneSurface } from '../mechanics/presentation.js';

/** Standard sea-level atmospheric pressure, Pa. */
const ATM = 101325;
const ACCENT = 'var(--stage-accent)';
const INK = 'var(--stage-fg)';
const SOFT = 'var(--stage-muted)';
const WALL = 'var(--stage-metal)';

/**
 * The four fluids, each with a distinct token colour so a density change is visible before the
 * number is read. Mercury sits at the far end on purpose: 13.6x water is impossible to dismiss.
 */
const FLUIDS = [
  { id: 'water', label: 'water', rho: 1000, color: 'var(--stage-accent)' },
  { id: 'seawater', label: 'seawater', rho: 1025, color: 'var(--stage-good)' },
  { id: 'oil', label: 'oil', rho: 850, color: 'var(--stage-warn)' },
  { id: 'mercury', label: 'mercury', rho: 13600, color: 'var(--stage-metal)' },
] as const;

export type FluidId = (typeof FLUIDS)[number]['id'];

const fluidOf = (id: FluidId): (typeof FLUIDS)[number] => FLUIDS.find((f) => f.id === id) ?? FLUIDS[0];

// ---------------------------------------------------------------------------
// Scene geometry, in METRES so the drag maps straight onto the quantity taught.
// ---------------------------------------------------------------------------
const BASE_Y = 0; // outside floor of the connecting manifold
const FLOOR_Y = 0.3; // top of the manifold = the vessels' shared floor
const RIM_Y = 3.15; // open tops
const SURFACE_Y = 2.8; // the one common fluid level
const MAX_DEPTH = SURFACE_Y - FLOOR_Y; // 2.5 m of fluid column

const TANK = { left: 0.55, right: 2.45 };
const TUBE = { left: 2.85, right: 3.55 };
// The cone flares upward: narrow where it joins the manifold, wide at the rim.
const CONE = { baseLeft: 4.1, baseRight: 4.7, rimLeft: 3.9, rimRight: 6.2 };
const MANIFOLD = { left: TANK.left, right: CONE.baseRight };

const coneT = (y: number): number => (y - FLOOR_Y) / (RIM_Y - FLOOR_Y);
const coneLeft = (y: number): number => CONE.baseLeft + (CONE.rimLeft - CONE.baseLeft) * coneT(y);
const coneRight = (y: number): number => CONE.baseRight + (CONE.rimRight - CONE.baseRight) * coneT(y);

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
/** kPa, with more precision where the number is small enough for it to matter. */
const kPa = (pa: number): string => (Math.abs(pa) < 10000 ? (pa / 1000).toFixed(2) : (pa / 1000).toFixed(1));

const FLUID_PRESSURE_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Pressure follows depth, not shape',
  objectives: [
    'Predict that pressure at a given depth is independent of the vessel shape',
    'Use p = rho g h to calculate hydrostatic pressure',
    'Explain why a denser fluid raises the pressure at the same depth',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict which vessel reads higher',
      lead: 'Three connected vessels, one common level. Commit before you drag anything.',
      success: 'shape-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Drag the probe deeper',
      lead: 'Move the probe up and down. Watch all three gauges, not just the one you are holding.',
      controls: true,
      reveal: ['model'],
      success: 'depth-changed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the three gauges',
      lead: 'One depth line, three shapes, three readings. Compare them.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain why width drops out',
      lead: 'Extra width brings extra weight AND extra base area to carry it. The two grow together.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the fluid',
      lead: 'Shape changed nothing. Now change what the fluid is made of and hold the depth fixed.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'fluid-changed',
    },
  ],
  questions: [
    {
      id: 'shape',
      prompt:
        'The wide tank, the narrow tube and the cone are joined at the base and filled to the same level. A probe sits 2 m below the surface in each. Which reads the highest pressure?',
      choices: [
        {
          value: 'tank',
          label: 'The wide tank, because it holds far more fluid above the base',
          feedback: 'That is the amount-of-fluid intuition. Check it against the three gauges.',
        },
        {
          value: 'tube',
          label: 'The narrow tube, because the fluid is squeezed into a small area',
        },
        {
          value: 'cone',
          label: 'The cone, because its walls slope and push inward',
        },
        {
          value: 'same',
          label: 'All three read exactly the same',
        },
      ],
      answer: 'same',
      explain:
        'Pressure at a point is set by the height of fluid above it, p = rho g h, not by how much fluid there is. The wide tank does hold more weight, but it also has a proportionally wider base to carry it, so the force per unit area is unchanged.',
    },
  ],
  success: [
    {
      id: 'shape-answer',
      source: 'answer',
      key: 'shape',
      operator: 'eq',
      value: 'same',
      pendingLabel: 'Commit to a prediction first.',
    },
    {
      id: 'depth-changed',
      source: 'metric',
      key: 'depthChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Drag the probe to a different depth.',
    },
    {
      id: 'fluid-changed',
      source: 'metric',
      key: 'fluidChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch to a different fluid.',
    },
  ],
};

export interface FluidPressureProps {
  /** Which fluid the vessels open filled with. */
  fluid?: FluidId;
  /** Opening probe depth below the surface, m (0 to 2.5). */
  depthM?: number;
  /** Open with atmospheric pressure added to every reading. */
  includeAtmosphere?: boolean;
  /** Gravitational field strength, m/s^2, lower it to pose the same lab on the Moon. */
  gravityMs2?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

export function FluidPressureLab({
  fluid: fluid0 = 'water',
  depthM = 2,
  includeAtmosphere = false,
  gravityMs2 = 9.81,
  title = 'Hydrostatic pressure: p = ρgh',
  prompt = 'Three vessels of different shape share one base and one fluid level. Drag the probe and read all three gauges at once.',
  objectives,
  activity = 'fluid-pressure',
}: FluidPressureProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'fluid-pressure';
  const authoredActivity = typeof activity === 'string' ? FLUID_PRESSURE_ACTIVITY : activity;
  const depth0 = clamp(depthM, 0, MAX_DEPTH);
  const [depth, setDepth] = useState(depth0);
  const [fluidId, setFluidId] = useState<FluidId>(fluid0);
  const [atmosphere, setAtmosphere] = useState(includeAtmosphere);

  const g = gravityMs2;
  const liquid = fluidOf(fluidId);
  const gauge = liquid.rho * g * depth; // Pa
  const shown = atmosphere ? gauge + ATM : gauge;
  const tag = `${kPa(shown)} kPa`;

  const probeY = SURFACE_Y - depth;
  const surfaceRight = coneRight(SURFACE_Y);
  const lineRight = coneRight(probeY);
  const coneMid = (coneLeft(probeY) + lineRight) / 2;
  // Mixed toward the BACKGROUND, not to transparent. A 32% alpha tint reads fine on white and
  // disappears on a near-black ground, which left every vessel looking empty in dark mode.
  const fill = `color-mix(in oklab, ${liquid.color} 30%, var(--stage-bg))`;

  // The frame grows upward only when the air is part of the model, so a gauge-pressure
  // lesson never pays for empty sky above the vessels.
  // xMax clears the cone's rim (6.2) with real margin: at 6.45 the flare ran into the frame
  // edge and the vessel read as clipped rather than wide.
  const view = { xMin: -0.85, xMax: 6.8, yMin: -0.3, yMax: atmosphere ? 4.05 : 3.6 };

  const ruler = [0, 0.5, 1, 1.5, 2, 2.5];

  const figure = (
    <SceneSurface>
      <Stage
        view={view}
        height={360}
        preserveAspect={false}
        ariaLabel="Three connected vessels of different shape holding one fluid at a common level, with a movable depth probe"
      >
        {/* the fluid body: one connected volume, drawn as four pieces of the same colour */}
        <Polygon
          points={[
            { x: MANIFOLD.left, y: BASE_Y },
            { x: MANIFOLD.right, y: BASE_Y },
            { x: MANIFOLD.right, y: FLOOR_Y },
            { x: MANIFOLD.left, y: FLOOR_Y },
          ]}
          fill={fill}
          fillOpacity={1}
          color="transparent"
        />
        <Polygon
          points={[
            { x: TANK.left, y: FLOOR_Y },
            { x: TANK.right, y: FLOOR_Y },
            { x: TANK.right, y: SURFACE_Y },
            { x: TANK.left, y: SURFACE_Y },
          ]}
          fill={fill}
          fillOpacity={1}
          color="transparent"
        />
        <Polygon
          points={[
            { x: TUBE.left, y: FLOOR_Y },
            { x: TUBE.right, y: FLOOR_Y },
            { x: TUBE.right, y: SURFACE_Y },
            { x: TUBE.left, y: SURFACE_Y },
          ]}
          fill={fill}
          fillOpacity={1}
          color="transparent"
        />
        <Polygon
          points={[
            { x: CONE.baseLeft, y: FLOOR_Y },
            { x: CONE.baseRight, y: FLOOR_Y },
            { x: surfaceRight, y: SURFACE_Y },
            { x: coneLeft(SURFACE_Y), y: SURFACE_Y },
          ]}
          fill={fill}
          fillOpacity={1}
          color="transparent"
        />

        {/* the shared level: a faint guide bridges the gaps so "same level" is seen, not asserted */}
        <Segment
          from={{ x: TANK.left, y: SURFACE_Y }}
          to={{ x: surfaceRight, y: SURFACE_Y }}
          color="var(--stage-grid)"
          weight={1}
          dashed
        />
        <Segment
          from={{ x: TANK.left, y: SURFACE_Y }}
          to={{ x: TANK.right, y: SURFACE_Y }}
          color={liquid.color}
          weight={2}
        />
        <Segment
          from={{ x: TUBE.left, y: SURFACE_Y }}
          to={{ x: TUBE.right, y: SURFACE_Y }}
          color={liquid.color}
          weight={2}
        />
        <Segment
          from={{ x: coneLeft(SURFACE_Y), y: SURFACE_Y }}
          to={{ x: surfaceRight, y: SURFACE_Y }}
          color={liquid.color}
          weight={2}
        />

        {/* the vessel walls, one continuous outer wall plus the two internal partitions */}
        <Polyline
          points={[
            { x: TANK.left, y: RIM_Y },
            { x: TANK.left, y: BASE_Y },
            { x: MANIFOLD.right, y: BASE_Y },
            { x: MANIFOLD.right, y: FLOOR_Y },
            { x: CONE.rimRight, y: RIM_Y },
          ]}
          color={WALL}
          weight={2.5}
        />
        <Polyline
          points={[
            { x: TANK.right, y: RIM_Y },
            { x: TANK.right, y: FLOOR_Y },
            { x: TUBE.left, y: FLOOR_Y },
            { x: TUBE.left, y: RIM_Y },
          ]}
          color={WALL}
          weight={2.5}
        />
        <Polyline
          points={[
            { x: TUBE.right, y: RIM_Y },
            { x: TUBE.right, y: FLOOR_Y },
            { x: CONE.baseLeft, y: FLOOR_Y },
            { x: CONE.rimLeft, y: RIM_Y },
          ]}
          color={WALL}
          weight={2.5}
        />

        {/* depth ruler: zero sits ON the surface, so "depth" is never confused with height */}
        <Segment from={{ x: 0.15, y: SURFACE_Y }} to={{ x: 0.15, y: FLOOR_Y }} color={SOFT} weight={1.5} />
        {ruler.map((d) => (
          <Segment
            key={d}
            from={{ x: 0.15, y: SURFACE_Y - d }}
            to={{ x: 0.3, y: SURFACE_Y - d }}
            color={SOFT}
            weight={1}
          />
        ))}
        {ruler.map((d) => (
          <Label
            key={d}
            x={0.1}
            y={SURFACE_Y - d}
            text={d.toFixed(1)}
            color={SOFT}
            size={12}
            anchor="end"
            weight={500}
          />
        ))}
        <Label x={0.15} y={SURFACE_Y + 0.25} text="depth (m)" color={SOFT} size={12} />

        {/* A pressure-intensity rail makes the causal direction visible before the numbers are read. */}
        {Array.from({ length: 10 }, (_, index) => {
          const fraction = (index + 0.5) / 10;
          const y = SURFACE_Y - fraction * MAX_DEPTH;
          return (
            <Segment
              key={`pressure-depth-${index}`}
              from={{ x: -0.62, y }}
              to={{ x: -0.28, y }}
              color={liquid.color}
              opacity={0.18 + fraction * 0.72}
              weight={2 + fraction * 5}
            />
          );
        })}
        <Label x={-0.45} y={SURFACE_Y + 0.25} text="low p" color={SOFT} size={11} />
        <Label x={-0.45} y={FLOOR_Y - 0.18} text="high p" color={liquid.color} size={11} weight={700} />

        {/* the argument: ONE depth line crossing all three shapes, each carrying its own gauge */}
        <Segment
          from={{ x: 0.15, y: probeY }}
          to={{ x: lineRight, y: probeY }}
          color={ACCENT}
          weight={2}
          dashed
        />
        <Dot x={0.15} y={probeY} r={4} color={ACCENT} />
        {/* tags hang BELOW the line: above it is where the drag pill appears, and a reading
            that jumps out of the way while you drag is a reading you cannot compare */}
        <Label x={1.5} y={probeY} dy={16} text={tag} color={INK} size={13} weight={700} />
        <Label x={3.2} y={probeY} dy={16} text={tag} color={INK} size={13} weight={700} />
        <Label x={coneMid} y={probeY} dy={16} text={tag} color={INK} size={13} weight={700} />

        {/* names above the rims, clear of every wall and of the fluid */}
        <Label x={1.5} y={RIM_Y + 0.25} text="wide tank" color={SOFT} size={13} />
        <Label x={3.2} y={RIM_Y + 0.25} text="narrow tube" color={SOFT} size={13} />
        <Label x={5.05} y={RIM_Y + 0.25} text="cone" color={SOFT} size={13} />

        {atmosphere && (
          <>
            {[0.9, 2, 3.2, 4.3, 5.5].map((x) => (
              <Vector key={x} tail={{ x, y: 3.98 }} tip={{ x, y: 3.68 }} color={SOFT} weight={2} />
            ))}
            <Label x={-0.8} y={3.83} text="air 101.3 kPa" color={SOFT} size={13} anchor="start" />
          </>
        )}

        <MovableDot
          value={{ x: 1.5, y: probeY }}
          onMove={(p) => setDepth(clamp(Math.round((SURFACE_Y - p.y) * 100) / 100, 0, MAX_DEPTH))}
          constrain="vertical"
          range={{ min: FLOOR_Y, max: SURFACE_Y }}
          step={0.05}
          color={ACCENT}
          r={9}
          // The pill answers the question the drag is asking: at THIS depth, what does it read?
          readout={(v) => {
            const h = clamp(SURFACE_Y - v.y, 0, MAX_DEPTH);
            return `${h.toFixed(2)} m → ${kPa(liquid.rho * g * h + (atmosphere ? ATM : 0))} kPa`;
          }}
          ariaLabel="pressure probe, drag up and down to change its depth"
        />
      </Stage>
    </SceneSurface>
  );

  const instruments = (
    <>
      <div className="physics-probe">
        <span>Pressure at the probe</span>
        <strong className="physics-equation-result">
          <Tex
            tex={
              atmosphere
                ? `p=p_0+\\rho gh=${kPa(ATM)}+${kPa(gauge)}=${kPa(shown)}\\,\\mathrm{kPa}`
                : `p=\\rho gh=${liquid.rho}\\times${g}\\times${depth.toFixed(2)}=${Math.round(gauge)}\\,\\mathrm{Pa}=${kPa(gauge)}\\,\\mathrm{kPa}`
            }
          />
        </strong>
        <small>
          {atmosphere
            ? 'Absolute pressure: the air column sits on top of the fluid column'
            : 'Gauge pressure: what a manometer reads, taking the air as zero'}
        </small>
      </div>
      <p className="physics-explain">
        {atmosphere ? (
          <>
            Adding the atmosphere adds the same 101.3 kPa to every point in every vessel, so it shifts all
            three gauges together and still leaves them equal. Shape is untouched by it.
          </>
        ) : (
          <>
            Only two things enter <Tex tex="p=\rho gh" />: how dense the fluid is and how far down you are.
            Neither the width of the vessel nor the volume it holds appears, which is exactly why all three
            read the same.
          </>
        )}
      </p>
    </>
  );

  const controls = (
    <>
      <Field label="fluid">
        <Segmented
          ariaLabel="fluid"
          value={fluidId}
          onChange={setFluidId}
          options={FLUIDS.map((f) => ({ value: f.id, label: f.label }))}
        />
      </Field>
      <Field label="depth" value={`${depth.toFixed(2)} m`}>
        <Slider
          value={depth}
          min={0}
          max={MAX_DEPTH}
          step={0.05}
          onChange={setDepth}
          ariaLabel="probe depth below the surface"
          valueText={`${depth.toFixed(2)} metres below the surface`}
        />
      </Field>
      <Field label="reading">
        <Segmented
          ariaLabel="reading"
          value={atmosphere ? 'absolute' : 'gauge'}
          onChange={(v) => setAtmosphere(v === 'absolute')}
          options={[
            { value: 'gauge', label: 'gauge' },
            { value: 'absolute', label: '+ atmosphere' },
          ]}
        />
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Fluids"
      title={title}
      description={prompt}
      status={
        <>
          <span>{liquid.label}</span>
          <span>ρ {liquid.rho} kg/m³</span>
          <span>h {depth.toFixed(2)} m</span>
        </>
      }
      evidence={instruments}
      controls={controls}
      observation={
        depth === 0
          ? 'At the surface there is no fluid above the probe, so the gauge pressure is zero in all three vessels.'
          : 'The wide tank, the narrow tube and the cone hold very different amounts of fluid, yet the one depth line gives all three the same reading. Only depth and density moved it.'
      }
      transcript={
        <p>
          {`${liquid.label}, density ${liquid.rho} kilograms per cubic metre, at a depth of ${depth.toFixed(2)} metres with g = ${g} metres per second squared. Pressure due to the fluid: ${kPa(gauge)} kilopascals${
            atmosphere ? `, plus 101.3 kilopascals of atmosphere, giving ${kPa(shown)} kilopascals` : ''
          }. The wide tank, the narrow tube and the cone all read the same.`}
        </p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="depth-changed" met={depth !== depth0} complete={complete} />
          <AuthoredMetricGate conditionId="fluid-changed" met={fluidId !== fluid0} complete={complete} />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
