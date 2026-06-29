/**
 * @classytic/labs/blocks, physics lab block specs.
 *
 * `defineBlock` editor adapters for the physics labs (one domain per file; the
 * registry is assembled in `./index.ts`). Each spec pairs a zod schema with a
 * render `Component` that, in `mode === 'editing'`, shows the row-based authoring
 * kit (`./authoring`). `@classytic/cms-ui` + `zod` are optional peers touched
 * only by the blocks layer.
 */

import type { ReactNode } from 'react';
import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, NumField, RowsEditor, TagsField, JsonArea, coerceArray } from './authoring.js';
import { ProjectileLab, OrbitLab, GravityDrop, RiverBoat, OpticsLab, LeverBalanceLab, VectorTypesLab, RainRelativeLab, StoppingDistanceLab, RampForcesLab, CollisionTrackLab, type LeverItemSpec, type TypePanel } from '../physics/index.js';
import { VectorBoardView, VECTOR_BOARD_DEMO, type FlatVec } from '../physics/vector-board/view.js';
import { flatVecSchema, typePanelSchema, controlConfigSchema } from '../schemas/index.js';
import { LabConfig } from './lab-config.js';
import { WaveLab, RippleTankLab, DopplerLab, StringReflectionLab, MagnetismLab, LorentzForceLab } from '../physics/index.js';
import { ImpulseLab } from '../physics/impulse/index.js';
import { BulletWallsLab } from '../physics/bullet-walls/index.js';
import { CircularMotionLab } from '../physics/circular-motion/index.js';
import { EnergySkateLab } from '../physics/energy-skate/index.js';
import { SimpleHarmonicLab } from '../physics/shm/index.js';
import { AtwoodLab } from '../physics/atwood/index.js';
import { TerminalVelocityLab } from '../physics/terminal-velocity/index.js';
import { KeplerLab } from '../physics/kepler/index.js';
import { GravitationLab } from '../physics/gravitation/index.js';
import { HeatTransferLab } from '../physics/heat-transfer/index.js';
import { ThermalExpansionLab } from '../physics/expansion/index.js';
import { HeatingCurveLab } from '../physics/thermal/index.js';
import { GasProcessLab } from '../physics/gas-process/index.js';
import { CarnotCycleLab } from '../physics/carnot/index.js';
import { EntropyLab } from '../physics/entropy/index.js';
import { TemperatureScalesLab } from '../physics/temperature-scales/index.js';
import { WaterDensityLab } from '../physics/water-density/index.js';
import { EfficiencyLab } from '../physics/efficiency/index.js';
import { ElectricFieldLab } from '../physics/electric-field/index.js';
import { ElectricFluxLab } from '../physics/electric-flux/index.js';
import { GaussLab } from '../physics/gauss-law/index.js';
import { WorkEnergyLab } from '../physics/work-energy/index.js';
import { WorkPotentialLab } from '../physics/work-potential/index.js';
import { labBlock, buildComponents, commonLabProps } from './lab-block.js';

export const ProjectileLabBlock = defineBlock({
  key: 'projectile-lab', // MDX tag = 'ProjectileLab'
  void: true,
  label: 'Projectile lab',
  description: 'Interactive projectile motion, tune angle & speed, hit a target.',
  category: 'interactive',
  schema: z.object({ targetMeters: z.number().optional(), g: z.number().optional() }),
  Component: ({ attributes }) => <ProjectileLab targetMeters={attributes.targetMeters} g={attributes.g} />,
});

export const OrbitLabBlock = defineBlock({
  key: 'orbit-lab',
  void: true,
  label: 'Orbit lab',
  description: 'Interactive orbit, launch a satellite: crash, orbit, or escape.',
  category: 'interactive',
  schema: z.object({}),
  Component: () => <OrbitLab />,
});

export const GravityDropBlock = defineBlock({
  key: 'gravity-drop',
  void: true,
  label: 'Gravity drop',
  description: 'Drop balls on three worlds, compare how gravity changes the fall.',
  category: 'interactive',
  schema: z.object({ height: z.number().optional() }),
  Component: ({ attributes }) => <GravityDrop height={attributes.height} />,
});

export const RiverBoatBlock = defineBlock({
  key: 'river-boat',
  void: true,
  label: 'River crossing (vectors)',
  description: 'Boat-and-river vector problem, step through tip-to-tail addition + component resolution.',
  category: 'interactive',
  schema: z.object({
    boatSpeed: z.number().optional(),
    current: z.number().optional(),
    riverWidth: z.number().optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const boatSpeed = typeof attributes.boatSpeed === 'number' ? attributes.boatSpeed : 4;
    const current = typeof attributes.current === 'number' ? attributes.current : 2;
    const riverWidth = typeof attributes.riverWidth === 'number' ? attributes.riverWidth : 8;
    const title = attributes.title ?? 'Crossing a flowing river';
    const widget = <RiverBoat boatSpeed={boatSpeed} current={current} riverWidth={riverWidth} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="boat vᵦ"><NumField value={boatSpeed} onChange={(v) => updateAttributes({ boatSpeed: v })} /></ConfigRow>
          <ConfigRow label="current vᵧ"><NumField value={current} onChange={(v) => updateAttributes({ current: v })} /></ConfigRow>
          <ConfigRow label="river width"><NumField value={riverWidth} onChange={(v) => updateAttributes({ riverWidth: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

/** Simple lever authoring → the labs component's items[] API. */
export function LeverPuzzle({ knownWeight = 4, knownDist = 3, unknownDist = 2, maxWeight = 12, controlId }: { knownWeight?: number; knownDist?: number; unknownDist?: number; maxWeight?: number; controlId?: string }): ReactNode {
  const items: LeverItemSpec[] = [
    { side: 'L', dist: knownDist, weight: knownWeight },
    { side: 'R', dist: unknownDist, weight: 'unknown' },
  ];
  return <LeverBalanceLab items={items} maxWeight={maxWeight} controlId={controlId} />;
}

export const OpticsBlock = defineBlock({
  key: 'optics',
  tag: 'Optics',
  void: true,
  label: 'Optics (reflect the ray)',
  description: 'Drag the source / mirrors so the light ray reflects into the target.',
  category: 'interactive',
  schema: z.object({}),
  Component: ({ mode }) => (
    mode === 'editing'
      ? <div><ConfigPanel><span style={{ opacity: 0.7 }}>No settings, drag the source, aim, or mirrors in the lesson.</span></ConfigPanel><OpticsLab /></div>
      : <OpticsLab />
  ),
});

export const LeverBlock = defineBlock({
  key: 'lever',
  tag: 'Lever',
  void: true,
  label: 'Lever (balance the torque)',
  description: 'A known weight at a distance vs an unknown, set the unknown so turning effects match.',
  category: 'interactive',
  schema: z.object({ knownWeight: z.number().default(4), knownDist: z.number().default(3), unknownDist: z.number().default(2), controlId: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { knownWeight = 4, knownDist = 3, unknownDist = 2 } = attributes;
    const widget = <LeverPuzzle knownWeight={knownWeight} knownDist={knownDist} unknownDist={unknownDist} controlId={attributes.controlId} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="known weight"><NumField value={knownWeight} onChange={(v) => updateAttributes({ knownWeight: v })} /></ConfigRow>
          <ConfigRow label="its distance"><NumField value={knownDist} onChange={(v) => updateAttributes({ knownDist: v })} /></ConfigRow>
          <ConfigRow label="unknown distance"><NumField value={unknownDist} onChange={(v) => updateAttributes({ unknownDist: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const VectorBoardBlock = defineBlock({
  key: 'vector-board',
  tag: 'VectorBoard',
  void: true,
  label: 'Vector board (resultant / relative)',
  description: 'Drag vector heads; live resultant (sum) or relative velocity (diff, the rain case) + angle. Optional drag-to-match goal.',
  category: 'interactive',
  schema: z.object({
    vectors: z.array(flatVecSchema).default(VECTOR_BOARD_DEMO),
    combine: z.enum(['sum', 'diff', 'none']).default('sum'),
    goalX: z.union([z.number(), z.string()]).optional(),
    goalY: z.union([z.number(), z.string()]).optional(),
    components: z.boolean().optional(),
    angle: z.boolean().default(true),
    objectives: z.array(z.string()).optional(),
    hints: z.array(z.string()).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const vectors = coerceArray<FlatVec>(attributes.vectors, VECTOR_BOARD_DEMO);
    const objectives = coerceArray<string>(attributes.objectives);
    const hints = coerceArray<string>(attributes.hints);
    const widget = <VectorBoardView vectors={vectors} combine={attributes.combine} goalX={attributes.goalX} goalY={attributes.goalY} components={attributes.components} angle={attributes.angle} objectives={objectives} hints={hints} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="combine">
            <ChipToggle active={attributes.combine === 'sum'} onClick={() => updateAttributes({ combine: 'sum' })}>sum</ChipToggle>
            <ChipToggle active={attributes.combine === 'diff'} onClick={() => updateAttributes({ combine: 'diff' })}>diff (relative)</ChipToggle>
          </ConfigRow>
          <ConfigRow label="show">
            <ChipToggle active={!!attributes.components} onClick={() => updateAttributes({ components: !attributes.components })}>components</ChipToggle>
            <ChipToggle active={attributes.angle !== false} onClick={() => updateAttributes({ angle: attributes.angle === false })}>angle</ChipToggle>
          </ConfigRow>
          <ConfigRow label="target"><TextField value={String(attributes.goalX ?? '')} onChange={(v) => updateAttributes({ goalX: v })} placeholder="x" /><TextField value={String(attributes.goalY ?? '')} onChange={(v) => updateAttributes({ goalY: v })} placeholder="y" /></ConfigRow>
          <ConfigRow label="objectives"><TagsField value={objectives} onChange={(v) => updateAttributes({ objectives: v })} placeholder="comma-separated goals" /></ConfigRow>
          <ConfigRow label="hints"><TagsField value={hints} onChange={(v) => updateAttributes({ hints: v })} placeholder="comma-separated hints" /></ConfigRow>
          <ConfigRow label="vectors">
            <RowsEditor
              rows={vectors}
              onChange={(v) => updateAttributes({ vectors: v })}
              columns={[{ key: 'label', label: 'label' }, { key: 'dx', label: 'dx' }, { key: 'dy', label: 'dy' }, { key: 'color', label: 'color', grow: true }, { key: 'drag', label: 'drag', type: 'bool' }]}
              newRow={() => ({ label: '', dx: 1, dy: 1, drag: true })}
              addLabel="vector"
            />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const VectorTypesBlock = defineBlock({
  key: 'vector-types',
  tag: 'VectorTypes',
  void: true,
  label: 'Vector types (reference figure)',
  description: 'Labeled gallery: equal, negative, null, unit, parallel, position. The vectors-chapter opener.',
  category: 'interactive',
  schema: z.object({ title: z.string().optional(), types: z.array(typePanelSchema).optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const types = attributes.types as TypePanel[] | undefined;
    const widget = <VectorTypesLab title={attributes.title} types={types} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Types of vectors" /></ConfigRow>
          <ConfigRow label="panels (advanced)"><JsonArea value={types ?? []} onChange={(v) => updateAttributes({ types: v })} rows={6} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const RainRelativeBlock = defineBlock({
  key: 'rain-relative',
  tag: 'RainRelative',
  void: true,
  label: 'Rain on a moving car (relative velocity)',
  description: 'Animated rain that slants as the car speeds up, apparent velocity V_rain − V_car, with a live triangle + angle.',
  category: 'interactive',
  schema: z.object({ maxSpeed: z.number().default(10), start: z.number().default(0), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <RainRelativeLab maxSpeed={attributes.maxSpeed} start={attributes.start} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Rain on a moving car" /></ConfigRow>
          <ConfigRow label="max speed"><NumField value={attributes.maxSpeed ?? 10} onChange={(v) => updateAttributes({ maxSpeed: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const StoppingDistanceBlock = defineBlock({
  key: 'stopping-distance',
  tag: 'StoppingDistance',
  void: true,
  label: 'Stopping distance (drive & brake)',
  description: '1-D kinematics: a car reacts then brakes; the road paints a blue thinking stripe + red braking stripe while synced v–t (area = distance) and s–t graphs share a playhead. ×2 speed shows thinking double but braking quadruple.',
  category: 'interactive',
  schema: z.object({
    speed: z.number().default(20),
    reactionTime: z.number().default(0.7),
    deceleration: z.number().default(6),
    predict: z.boolean().default(false),
    showGraphs: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <StoppingDistanceLab speed={attributes.speed} reactionTime={attributes.reactionTime} deceleration={attributes.deceleration} predict={attributes.predict} showGraphs={attributes.showGraphs} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Drive & Brake" /></ConfigRow>
          <ConfigRow label="speed (m/s)"><NumField value={attributes.speed ?? 20} onChange={(v) => updateAttributes({ speed: v })} /></ConfigRow>
          <ConfigRow label="reaction (s)"><NumField value={attributes.reactionTime ?? 0.7} onChange={(v) => updateAttributes({ reactionTime: v })} /></ConfigRow>
          <ConfigRow label="brake (m/s²)"><NumField value={attributes.deceleration ?? 6} onChange={(v) => updateAttributes({ deceleration: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const RampForcesBlock = defineBlock({
  key: 'ramp-forces',
  tag: 'RampForces',
  void: true,
  label: 'Ramp forces (F = ma on an incline)',
  description: 'Tilt the incline: the weight vector splits into mg sinθ (down-slope) + mg cosθ (into-slope), the normal force shrinks as you tilt (N = mg cosθ), a friction slider spans frictionless→sticky, and the crate slides at a = g(sinθ − μcosθ).',
  category: 'interactive',
  schema: z.object({
    angleDeg: z.number().default(30),
    mass: z.number().default(2),
    friction: z.number().default(0.3),
    showComponents: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
    controls: controlConfigSchema.optional().describe('hide/lock knobs: angle, push, mass, frictionStatic, frictionKinetic, components, release'),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <RampForcesLab angleDeg={attributes.angleDeg} mass={attributes.mass} friction={attributes.friction} showComponents={attributes.showComponents} title={attributes.title} prompt={attributes.prompt} controlConfig={attributes.controls} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Tilt the Ramp" /></ConfigRow>
          <ConfigRow label="angle (°)"><NumField value={attributes.angleDeg ?? 30} onChange={(v) => updateAttributes({ angleDeg: v })} /></ConfigRow>
          <ConfigRow label="friction μ"><NumField value={attributes.friction ?? 0.3} onChange={(v) => updateAttributes({ friction: v })} /></ConfigRow>
          <ConfigRow label='controls: e.g. { "hide": ["mass"], "lock": ["angle"] }'><JsonArea value={attributes.controls ?? {}} onChange={(v) => updateAttributes({ controls: v })} rows={3} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const CollisionTrackBlock = defineBlock({
  key: 'collision-track',
  tag: 'CollisionTrack',
  void: true,
  label: 'Collision track (momentum & elasticity)',
  description: 'Two carts collide; one elasticity slider morphs inelastic↔elastic. The momentum bar stays full while the KE bar leaks when sticky, and a constant-velocity centre-of-mass marker proves momentum is conserved either way.',
  category: 'interactive',
  schema: z.object({
    m1: z.number().default(1),
    m2: z.number().default(1),
    u1: z.number().default(4),
    u2: z.number().default(-2),
    elasticity: z.number().default(1),
    showCenterOfMass: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <CollisionTrackLab m1={attributes.m1} m2={attributes.m2} u1={attributes.u1} u2={attributes.u2} elasticity={attributes.elasticity} showCenterOfMass={attributes.showCenterOfMass} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Sticky or Bouncy?" /></ConfigRow>
          <ConfigRow label="elasticity"><NumField value={attributes.elasticity ?? 1} onChange={(v) => updateAttributes({ elasticity: v })} /></ConfigRow>
          <ConfigRow label="m₁"><NumField value={attributes.m1 ?? 1} onChange={(v) => updateAttributes({ m1: v })} /></ConfigRow>
          <ConfigRow label="m₂"><NumField value={attributes.m2 ?? 1} onChange={(v) => updateAttributes({ m2: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

// ── waves + magnetism (LabConfig-panel pattern; spread attrs into the lab) ──
// Shared authoring props + the one block-wrapping factory (see ./lab-block).
const common = commonLabProps;
/* eslint-disable @typescript-eslint/no-explicit-any */
// Thin positional alias kept so the existing wlab(...) call sites read unchanged. Typed
// against the schema (so schema↔prop drift is a compile error) + optional MDX `tag`.
const wlab = <S extends z.ZodObject<any>>(key: string, label: string, description: string, schema: S, Comp: (a: z.infer<S>) => ReactNode, tag?: string) =>
  labBlock({ key, label, description, schema, Component: Comp, tag });

const waveSchema = z.object({ mode: z.enum(['travelling', 'superpose', 'standing']).optional(), amplitude: z.number().optional(), wavelength: z.number().optional(), frequency: z.number().optional(), ...common });
export const WaveBlock = wlab('wave-lab', 'Waves (travelling / superposition / standing)', 'One waves playground: shape a travelling wave (v=fλ), add a second for interference/beats, or lock two opposite waves into a standing wave with nodes/antinodes. Optional sound.', waveSchema, (a) => <WaveLab {...a} />);

const rippleSchema = z.object({ wavelength: z.number().optional(), view: z.enum(['ripples', 'fringes']).optional(), ...common });
export const RippleTankBlock = wlab('ripple-tank', 'Ripple tank (2-D interference)', 'Two draggable sources → live circular ripples or the static bright/dark interference fringes (Δ=nλ vs (n+½)λ).', rippleSchema, (a) => <RippleTankLab {...a} />);

const dopplerSchema = z.object({ mach: z.number().optional(), ...common });
export const DopplerBlock = wlab('doppler', 'Doppler effect', 'A moving source bunches wavefronts ahead (higher pitch) and stretches them behind; past Mach 1 a shock cone forms. Drive-by siren via Web Audio.', dopplerSchema, (a) => <DopplerLab {...a} />);

const stringSchema = z.object({ mode: z.enum(['pulse', 'resonance']).optional(), end: z.enum(['fixed', 'free']).optional(), frequency: z.number().optional(), ...common });
export const StringReflectionBlock = wlab('string-reflection', 'Reflection & standing waves on a string', 'A pulse reflects (fixed end inverts, free end upright); a continuous wave + its reflection lock into a standing wave at the resonant harmonics fₙ=n·c/2L.', stringSchema, (a) => <StringReflectionLab {...a} />);

const magnetismSchema = z.object({ ...common });
export const MagnetismBlock = wlab('magnetism', 'Magnetism, field lines & compass', 'Drag a bar magnet (or switch to a current-carrying wire); the field lines retrace live and a draggable compass needle aligns to the field.', magnetismSchema, (a) => <MagnetismLab {...a} />);

const lorentzSchema = z.object({ charge: z.union([z.literal(1), z.literal(-1)]).optional(), fieldOut: z.boolean().optional(), B: z.number().optional(), speed: z.number().optional(), ...common });
export const LorentzBlock = wlab('lorentz', 'Lorentz force F = q·v×B', 'A charge fired into a magnetic field curves (cyclotron motion); v, B, F shown perpendicular with the right-hand rule. Flip charge or field → the curve reverses. Cyclotron / aurora framing.', lorentzSchema, (a) => <LorentzForceLab {...a} />);

const impulseSchema = z.object({ mass: z.number().optional(), speed: z.number().optional(), contact: z.number().optional(), crackForce: z.number().optional(), ...common });
export const ImpulseBlock = wlab('impulse', 'Impulse, catch the egg (J = F·Δt = Δp)', 'Same ball, same speed → fixed impulse. Stretch the contact time and the force–time pulse morphs from a tall spike to a low bump with EQUAL shaded area, so the peak force plummets. A fragile egg cracks above its force limit, the number behind airbags, crumple zones and bending your knees.', impulseSchema, (a) => <ImpulseLab {...a} />);

const bulletWallsSchema = z.object({ speed: z.number().optional(), toughness: z.number().optional(), planks: z.number().optional(), mass: z.number().optional(), ...common });
export const BulletWallsBlock = wlab('bullet-walls', 'Bullet through N planks (penetration)', 'The classic "how many planks?" problem, predict-first: each plank drains a fixed chunk of energy (a fixed Δv²), so the bullet slows plank-by-plank and lodges when its kinetic energy runs out. Guess the count, fire, and watch v² = u² − 2as play out with a draining energy bar.', bulletWallsSchema, (a) => <BulletWallsLab {...a} />);

// `controlConfig` lets a creator author a FOCUSED lesson: set `mode` + hide the switcher
// (e.g. mode:'spring', controlConfig:{hide:['mode']}) so the lab shows one idea, not every setup.
// Any knob (keyed by its Field/Control name) can also be hidden or locked.
const ccSchema = z.object({ hide: z.array(z.string()).optional(), lock: z.array(z.string()).optional() }).optional();
const circularSchema = z.object({ speed: z.number().optional(), radius: z.number().optional(), mass: z.number().optional(), controlConfig: ccSchema, ...common });
export const CircularMotionBlock = wlab('circular-motion', 'Circular motion, centripetal force & cut the string', 'A ball whirls on a string: velocity stays tangent while the tension (centripetal force F = mv²/r) points to the centre, bending the path without changing speed. Cut the string and it flies off along the TANGENT, not radially outward, killing the classic misconception. Live F, ω and period.', circularSchema, (a) => <CircularMotionLab {...a} />);

const energySkateSchema = z.object({ startHeight: z.number().optional(), friction: z.boolean().optional(), mass: z.number().optional(), controlConfig: ccSchema, ...common });
export const EnergySkateBlock = wlab('energy-skate', 'Energy skate park, KE ⇄ PE (+ heat)', 'A skater released on a ramp: potential, kinetic and thermal bars always sum to the same total. Friction off → it returns to the same height forever; friction on → the heat bar grows and every peak is lower. Energy conservation and conversion, animated (the LOL bar chart).', energySkateSchema, (a) => <EnergySkateLab {...a} />);

const shmSchema = z.object({ mode: z.enum(['spring', 'pendulum']).optional(), k: z.number().optional(), length: z.number().optional(), mass: z.number().optional(), amplitude: z.number().optional(), controlConfig: ccSchema, ...common });
export const SimpleHarmonicBlock = wlab('shm', 'Simple harmonic motion, spring & pendulum', 'One a = −ω²x kernel, two skins. A restoring force ∝ displacement gives x(t) = A·cos(ωt), and a pen traces it out as a SINE, the bridge to the waves lessons. Spring: ω=√(k/m). Pendulum: ω=√(g/L), with the period independent of mass and amplitude. Live ω/T/f and a PE⇄KE energy split.', shmSchema, (a) => <SimpleHarmonicLab {...a} />, 'SimpleHarmonic');

const atwoodSchema = z.object({ m1: z.number().optional(), m2: z.number().optional(), ...common });
export const AtwoodBlock = wlab('atwood', 'Atwood machine, two masses over a pulley', 'Two masses share one rope over a pulley. Only the difference in weight drives the system while the total mass resists it: a = (m₁−m₂)g/(m₁+m₂), tension T = 2m₁m₂g/(m₁+m₂). Equal masses balance; a tiny difference on big masses gives a slow, measurable a, how Atwood weighed gravity. Predict which side falls, then release.', atwoodSchema, (a) => <AtwoodLab {...a} />);

const terminalSchema = z.object({ mass: z.number().optional(), drag: z.number().optional(), parachute: z.boolean().optional(), controlConfig: ccSchema, ...common });
export const TerminalVelocityBlock = wlab('terminal-velocity', 'Terminal velocity, the skydiver (air drag)', 'A fall with air resistance: drag grows with speed (∝v²) until it balances gravity, so the speed levels off at v_t = √(mg/b). The weight arrow stays fixed while the drag arrow rises to meet it and the v–t curve flattens onto its asymptote (exact tanh solution). Pop the parachute and v_t collapses to a survivable speed.', terminalSchema, (a) => <TerminalVelocityLab {...a} />);

const keplerSchema = z.object({ semiMajor: z.number().optional(), eccentricity: z.number().optional(), wedges: z.boolean().optional(), controlConfig: ccSchema, ...common });
export const KeplerBlock = wlab('kepler', 'Kepler’s laws, orbits & equal areas', 'A planet on a true ellipse with the star at a focus (Kepler 1). Solving Kepler’s equation makes it genuinely speed up at perihelion, and the equal-time wedges it sweeps come out equal in area (Kepler 2), fat-and-short near the star, thin-and-long far out. Stretch the orbit and the period grows as T² ∝ a³ (Kepler 3).', keplerSchema, (a) => <KeplerLab {...a} />);

const gravitationSchema = z.object({ planetMass: z.number().optional(), satMass: z.number().optional(), ...common });
export const GravitationBlock = wlab('gravitation', 'Universal gravitation, the inverse-square law', 'Newton’s F = G·M·m / r². Drag the satellite and the pull tracks 1/r²: double the distance and the force drops to a quarter (not a half). A live F–r curve marks your spot on the steep fall-off; the same law thins weight with altitude (g = GM/r²) and sets orbital speed v = √(GM/r).', gravitationSchema, (a) => <GravitationLab {...a} />);

const heatTransferSchema = z.object({ mode: z.enum(['conduction', 'convection', 'radiation']).optional(), controlConfig: ccSchema, ...common });
export const HeatTransferBlock = wlab('heat-transfer', 'Heat transfer, conduction / convection / radiation', 'The three ways heat moves, each with its rate law and animation. Author a survey (all three) OR a focused lesson: set mode + controlConfig.hide=[\'mechanism\'] to show conduction (or convection / radiation) on its own.', heatTransferSchema, (a) => <HeatTransferLab {...a} />);

const thermalExpansionSchema = z.object({ mode: z.enum(['length', 'area', 'volume', 'bimetallic']).optional(), controlConfig: ccSchema, ...common });
export const ThermalExpansionBlock = wlab('thermal-expansion', 'Thermal expansion, length / area / volume / bimetallic', 'Heat a solid and it grows: ΔL=αLΔT, ΔA=2αAΔT, ΔV=3αVΔT, plus a bimetallic-strip thermostat. Author one case (e.g. mode:\'area\', controlConfig.hide=[\'what expands\']) or the full set.', thermalExpansionSchema, (a) => <ThermalExpansionLab {...a} />);

// ── Heat & temperature + thermodynamics (on the thermal core + thermo kernel) ──
const heatingCurveSchema = z.object({
  substance: z.enum(['water', 'ethanol']).optional().describe('preset to start from'),
  substanceName: z.string().optional().describe('custom substance name (overrides the preset)'),
  cSolid: z.number().optional(), cLiquid: z.number().optional(), cGas: z.number().optional(),
  lFusion: z.number().optional().describe('latent heat of fusion, J/g'),
  lVapor: z.number().optional().describe('latent heat of vaporisation, J/g'),
  tMelt: z.number().optional(), tBoil: z.number().optional(),
  mass: z.number().optional().describe('initial sample mass, g'),
  power: z.number().optional().describe('initial heating power, W (negative cools)'),
  ...common,
});
export const HeatingCurveBlock = wlab('heating-curve', 'Heating curve, q=mcΔθ runs + latent plateaus', 'Pour heat into ice and watch temperature climb in steps: sloped runs where a phase warms (q=mcΔθ) and flat plateaus where it melts/boils (q=mL). Burner + beaker + thermometer beside the live curve. AUTHOR the model: pick a preset OR declare a custom substance (specific + latent heats, melt/boil points) and the starting mass/power.', heatingCurveSchema, (a) => <HeatingCurveLab {...a} />);

const gasProcessSchema = z.object({ kind: z.enum(['isothermal', 'adiabatic', 'isobaric', 'isochoric']).optional(), gas: z.enum(['monatomic', 'diatomic']).optional(), moles: z.number().optional(), tempK: z.number().optional().describe('initial temperature, K'), volumeL: z.number().optional().describe('initial volume, L'), ...common });
export const GasProcessBlock = wlab('gas-process', 'Gas processes, work = area under P–V', 'Expand/compress an ideal gas isothermally, adiabatically, isobarically or isochorically. The shaded area under the P–V curve is the work; the first law ΔU = Q − W balances every term. A faint reference isotherm shows the adiabatic falling steeper.', gasProcessSchema, (a) => <GasProcessLab {...a} />);

const carnotSchema = z.object({ hotK: z.number().optional().describe('hot reservoir temperature, K'), coldK: z.number().optional().describe('cold reservoir temperature, K'), gas: z.enum(['monatomic', 'diatomic']).optional(), expansionRatio: z.number().optional().describe('isothermal expansion V₂/V₁'), ...common });
export const CarnotBlock = wlab('carnot', 'Carnot cycle, P–V loop + T–S rectangle', 'The most efficient heat engine, shown as a P–V loop (enclosed area = net work) and the same cycle as a T–S rectangle (heat in at Th, out at Tc). Efficiency η = 1 − Tc/Th, with the entropy bookkeeping ΔS = Qh/Th = Qc/Tc → net 0.', carnotSchema, (a) => <CarnotCycleLab {...a} />);

const entropySchema = z.object({ mode: z.enum(['heat', 'expansion']).optional(), ...common });
export const EntropyBlock = wlab('entropy', 'Entropy & the 2nd law, the one-way arrow', 'Why heat flows hot→cold (ΔS_total = Q/Tc − Q/Th > 0) and a gas spreads into a vacuum (ΔS = nR·ln Vf/Vi). The total entropy of the universe always increases. Two modes: heat flow and free expansion.', entropySchema, (a) => <EntropyLab {...a} />);

const tempScalesSchema = z.object({ ...common });
export const TemperatureScalesBlock = wlab('temperature-scales', 'Temperature scales, °C / °F / K', 'One mercury column read against Celsius, Fahrenheit and Kelvin at once (F = 9⁄5·C + 32, K = C + 273.15). Fixed points marked; jump to absolute zero, ice, body, boiling. Shows why Kelvin starts at absolute zero.', tempScalesSchema, (a) => <TemperatureScalesLab {...a} />);

const waterDensitySchema = z.object({ mode: z.enum(['anomaly', 'lake']).optional(), ...common });
export const WaterDensityBlock = wlab('water-density', 'Water’s 4 °C anomaly, why ice floats', 'Water is densest at 4 °C and expands again toward freezing, so ice floats. Drag the temperature on the density curve, or switch to the lake view to see why a pond freezes top-down (4 °C water and fish survive below the ice).', waterDensitySchema, (a) => <WaterDensityLab {...a} />);

const efficiencySchema = z.object({
  device: z.enum(['incandescent', 'led', 'petrol-engine', 'electric-motor', 'power-station', 'human']).optional(),
  deviceName: z.string().optional(),
  inputJoules: z.number().optional().describe('energy supplied, J (100 → shares read as %)'),
  streams: z.array(z.object({ label: z.string(), share: z.number(), kind: z.enum(['useful', 'waste']), color: z.string().optional() })).optional().describe('author your own energy breakdown'),
  ...common,
});
export const EfficiencyBlock = wlab('efficiency', 'Efficiency, input→output ratio (Sankey)', 'Efficiency as the fraction of energy that comes out useful: η = useful ÷ input, drawn as a Sankey energy flow that splits into a useful stream and wasted heat. Compare real devices (incandescent vs LED, engine vs motor) or AUTHOR your own breakdown via the streams field.', efficiencySchema, (a) => <EfficiencyLab {...a} />);

// ── Electrostatics (charges / flux / Gauss) + work–energy (on the shared `field` core) ──
const electricFieldSchema = z.object({ title: z.string().optional(), prompt: z.string().optional(), objectives: z.array(z.string()).optional() });
export const ElectricFieldBlock = wlab('electric-field', 'Electric field, charges & the force F = qE', 'Drag two charges and flip their signs; field lines retrace live, flowing out of + into −. Drop a test charge anywhere and a force arrow F = qE appears, toward + or away depending on its sign. Like charges repel, opposites attract.', electricFieldSchema, (a) => <ElectricFieldLab {...a} />);

const electricFluxSchema = z.object({
  field: z.number().optional().describe('field strength in vacuum (arbitrary units)'),
  area: z.number().optional().describe('area: length of the flat window, scene units'),
  angleDeg: z.number().optional().describe('initial angle between the area normal and the field, degrees'),
  height: z.number().optional(),
  activity: z.string().optional(),
  title: z.string().optional(),
  prompt: z.string().optional(),
});
export const ElectricFluxBlock = wlab('electric-flux', 'Electric flux Φ = E·A·cosθ (line-counting)', 'Flux made literal: how many field lines thread your area. Rotate the area (edge-on Φ = 0, face-on Φ = E·A), resize it, or change the medium (permittivity εr weakens E). The lines that pass through light up: that count is the flux.', electricFluxSchema, (a) => <ElectricFluxLab {...a} />);

const gaussSchema = z.object({ height: z.number().optional(), activity: z.string().optional(), title: z.string().optional(), prompt: z.string().optional() });
export const GaussLawBlock = wlab('gauss-law', 'Gauss’s law, flux depends only on charge inside', 'A Gaussian loop (drag its centre, drag the rim to resize) sits in the field of two charges. Green markers show field leaving, red show field entering. The net flux Φ = Q/ε₀ depends only on the charge ENCLOSED, not the loop’s size or shape, and a charge outside adds zero.', gaussSchema, (a) => <GaussLab {...a} />, 'GaussLaw');

const workEnergySchema = z.object({ mode: z.enum(['spring', 'constant']).optional(), title: z.string().optional(), prompt: z.string().optional(), objectives: z.array(z.string()).optional() });
export const WorkEnergyBlock = wlab('work-energy', 'Work done = area under the force–distance graph', 'Work made visible as the AREA under the force–distance graph. A spring (F = kx) gives a triangle so W = ½kx², a constant force gives a rectangle so W = Fx. Drag the distance and the shaded area (the work) grows with it; the equation updates live.', workEnergySchema, (a) => <WorkEnergyLab {...a} />);

const workPotentialSchema = z.object({ height: z.number().optional(), activity: z.string().optional(), title: z.string().optional(), prompt: z.string().optional() });
export const WorkPotentialBlock = wlab('work-potential', 'Potential & work, equipotentials and W = qΔV', 'Electric potential made visible through equipotential rings (V = kQ/r) with field lines at right angles. Drag points A and B: the work to move a charge A → B is W = qΔV and depends only on the endpoints, never the path. Slide a point around a ring (same V) and the work is zero.', workPotentialSchema, (a) => <WorkPotentialLab {...a} />);

export const physicsBlocks = [
  ProjectileLabBlock,
  OrbitLabBlock,
  GravityDropBlock,
  RiverBoatBlock,
  OpticsBlock,
  LeverBlock,
  VectorBoardBlock,
  VectorTypesBlock,
  RainRelativeBlock,
  StoppingDistanceBlock,
  RampForcesBlock,
  CollisionTrackBlock,
  WaveBlock,
  RippleTankBlock,
  DopplerBlock,
  StringReflectionBlock,
  MagnetismBlock,
  LorentzBlock,
  ImpulseBlock,
  BulletWallsBlock,
  CircularMotionBlock,
  EnergySkateBlock,
  SimpleHarmonicBlock,
  AtwoodBlock,
  TerminalVelocityBlock,
  KeplerBlock,
  GravitationBlock,
  HeatTransferBlock,
  ThermalExpansionBlock,
  HeatingCurveBlock,
  GasProcessBlock,
  CarnotBlock,
  EntropyBlock,
  TemperatureScalesBlock,
  WaterDensityBlock,
  EfficiencyBlock,
  ElectricFieldBlock,
  ElectricFluxBlock,
  GaussLawBlock,
  WorkEnergyBlock,
  WorkPotentialBlock,
] as const;

// tag→component MDX render map. The 24 wlab-based blocks are DERIVED from physicsBlocks
// (one source of truth, a new wlab block appears here automatically). Only the bespoke
// defineBlock blocks (custom editor UI, or a different raw render component) are listed by hand.
export const physicsComponents = {
  ...buildComponents(physicsBlocks),
  VectorBoard: VectorBoardView,
  VectorTypes: VectorTypesLab,
  RainRelative: RainRelativeLab,
  StoppingDistance: StoppingDistanceLab,
  RampForces: RampForcesLab,
  CollisionTrack: CollisionTrackLab,
  Optics: OpticsLab,
  Lever: LeverPuzzle,
  ProjectileLab,
  RiverBoat,
  OrbitLab,
  GravityDrop,
};
