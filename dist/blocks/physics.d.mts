import { LabBlock } from "./lab-block.mjs";
import { VectorBoardView } from "../physics/vector-board/view.mjs";
import { OpticsLab } from "../physics/optics/preset.mjs";
import { ProjectileLab } from "../physics/projectile-lab.mjs";
import { GravityDrop } from "../physics/gravity-drop.mjs";
import { RiverBoat } from "../physics/river-boat.mjs";
import { VectorTypesLab } from "../physics/vector-types/preset.mjs";
import { RainRelativeLab } from "../physics/rain-relative/preset.mjs";
import { StoppingDistanceLab } from "../physics/stopping-distance/preset.mjs";
import { RampForcesLab } from "../physics/ramp-forces/preset.mjs";
import { CollisionTrackLab } from "../physics/collision-track/preset.mjs";
import { OrbitLab } from "../physics/orbit-lab.mjs";
import { ReactNode } from "react";
import { z } from "zod";

//#region src/blocks/physics.d.ts
declare const ProjectileLabBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  targetMeters: z.ZodOptional<z.ZodNumber>;
  g: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
declare const OrbitLabBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{}, z.core.$strip>>;
declare const GravityDropBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  height: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
declare const RiverBoatBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  boatSpeed: z.ZodOptional<z.ZodNumber>;
  current: z.ZodOptional<z.ZodNumber>;
  riverWidth: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** Simple lever authoring → the labs component's items[] API. */
declare function LeverPuzzle({
  knownWeight,
  knownDist,
  unknownDist,
  maxWeight,
  controlId
}: {
  knownWeight?: number;
  knownDist?: number;
  unknownDist?: number;
  maxWeight?: number;
  controlId?: string;
}): ReactNode;
declare const OpticsBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{}, z.core.$strip>>;
declare const LeverBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  knownWeight: z.ZodDefault<z.ZodNumber>;
  knownDist: z.ZodDefault<z.ZodNumber>;
  unknownDist: z.ZodDefault<z.ZodNumber>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const VectorBoardBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vectors: z.ZodDefault<z.ZodArray<z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    dx: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    dy: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    color: z.ZodOptional<z.ZodString>;
    drag: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>>>;
  combine: z.ZodDefault<z.ZodEnum<{
    sum: "sum";
    diff: "diff";
    none: "none";
  }>>;
  goalX: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
  goalY: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
  components: z.ZodOptional<z.ZodBoolean>;
  angle: z.ZodDefault<z.ZodBoolean>;
  objectives: z.ZodOptional<z.ZodArray<z.ZodString>>;
  hints: z.ZodOptional<z.ZodArray<z.ZodString>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const VectorTypesBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  types: z.ZodOptional<z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    caption: z.ZodString;
    vectors: z.ZodOptional<z.ZodArray<z.ZodObject<{
      tail: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
      }, z.core.$strip>>;
      comp: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
      }, z.core.$strip>;
      color: z.ZodOptional<z.ZodString>;
      label: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    origin: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>>>;
}, z.core.$strip>>;
declare const RainRelativeBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  maxSpeed: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const StoppingDistanceBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  speed: z.ZodDefault<z.ZodNumber>;
  reactionTime: z.ZodDefault<z.ZodNumber>;
  deceleration: z.ZodDefault<z.ZodNumber>;
  predict: z.ZodDefault<z.ZodBoolean>;
  showGraphs: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const RampForcesBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  angleDeg: z.ZodDefault<z.ZodNumber>;
  mass: z.ZodDefault<z.ZodNumber>;
  friction: z.ZodDefault<z.ZodNumber>;
  showComponents: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  controls: z.ZodOptional<z.ZodObject<{
    hide: z.ZodOptional<z.ZodArray<z.ZodString>>;
    lock: z.ZodOptional<z.ZodArray<z.ZodString>>;
  }, z.core.$strip>>;
}, z.core.$strip>>;
declare const CollisionTrackBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  m1: z.ZodDefault<z.ZodNumber>;
  m2: z.ZodDefault<z.ZodNumber>;
  u1: z.ZodDefault<z.ZodNumber>;
  u2: z.ZodDefault<z.ZodNumber>;
  elasticity: z.ZodDefault<z.ZodNumber>;
  showCenterOfMass: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const WaveBlock: LabBlock;
declare const RippleTankBlock: LabBlock;
declare const DopplerBlock: LabBlock;
declare const StringReflectionBlock: LabBlock;
declare const MagnetismBlock: LabBlock;
declare const LorentzBlock: LabBlock;
declare const ImpulseBlock: LabBlock;
declare const BulletWallsBlock: LabBlock;
declare const CircularMotionBlock: LabBlock;
declare const EnergySkateBlock: LabBlock;
declare const SimpleHarmonicBlock: LabBlock;
declare const AtwoodBlock: LabBlock;
declare const TerminalVelocityBlock: LabBlock;
declare const KeplerBlock: LabBlock;
declare const GravitationBlock: LabBlock;
declare const HeatTransferBlock: LabBlock;
declare const ThermalExpansionBlock: LabBlock;
declare const HeatingCurveBlock: LabBlock;
declare const GasProcessBlock: LabBlock;
declare const CarnotBlock: LabBlock;
declare const EntropyBlock: LabBlock;
declare const TemperatureScalesBlock: LabBlock;
declare const WaterDensityBlock: LabBlock;
declare const EfficiencyBlock: LabBlock;
declare const ElectricFieldBlock: LabBlock;
declare const ElectricFluxBlock: LabBlock;
declare const GaussLawBlock: LabBlock;
declare const WorkEnergyBlock: LabBlock;
declare const WorkPotentialBlock: LabBlock;
declare const physicsBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  targetMeters: z.ZodOptional<z.ZodNumber>;
  g: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  height: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  boatSpeed: z.ZodOptional<z.ZodNumber>;
  current: z.ZodOptional<z.ZodNumber>;
  riverWidth: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  knownWeight: z.ZodDefault<z.ZodNumber>;
  knownDist: z.ZodDefault<z.ZodNumber>;
  unknownDist: z.ZodDefault<z.ZodNumber>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vectors: z.ZodDefault<z.ZodArray<z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    dx: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    dy: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    color: z.ZodOptional<z.ZodString>;
    drag: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>>>;
  combine: z.ZodDefault<z.ZodEnum<{
    sum: "sum";
    diff: "diff";
    none: "none";
  }>>;
  goalX: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
  goalY: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
  components: z.ZodOptional<z.ZodBoolean>;
  angle: z.ZodDefault<z.ZodBoolean>;
  objectives: z.ZodOptional<z.ZodArray<z.ZodString>>;
  hints: z.ZodOptional<z.ZodArray<z.ZodString>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  types: z.ZodOptional<z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    caption: z.ZodString;
    vectors: z.ZodOptional<z.ZodArray<z.ZodObject<{
      tail: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
      }, z.core.$strip>>;
      comp: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
      }, z.core.$strip>;
      color: z.ZodOptional<z.ZodString>;
      label: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    origin: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>>>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  maxSpeed: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  speed: z.ZodDefault<z.ZodNumber>;
  reactionTime: z.ZodDefault<z.ZodNumber>;
  deceleration: z.ZodDefault<z.ZodNumber>;
  predict: z.ZodDefault<z.ZodBoolean>;
  showGraphs: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  angleDeg: z.ZodDefault<z.ZodNumber>;
  mass: z.ZodDefault<z.ZodNumber>;
  friction: z.ZodDefault<z.ZodNumber>;
  showComponents: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  controls: z.ZodOptional<z.ZodObject<{
    hide: z.ZodOptional<z.ZodArray<z.ZodString>>;
    lock: z.ZodOptional<z.ZodArray<z.ZodString>>;
  }, z.core.$strip>>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  m1: z.ZodDefault<z.ZodNumber>;
  m2: z.ZodDefault<z.ZodNumber>;
  u1: z.ZodDefault<z.ZodNumber>;
  u2: z.ZodDefault<z.ZodNumber>;
  elasticity: z.ZodDefault<z.ZodNumber>;
  showCenterOfMass: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock];
declare const physicsComponents: {
  VectorBoard: typeof VectorBoardView;
  VectorTypes: typeof VectorTypesLab;
  RainRelative: typeof RainRelativeLab;
  StoppingDistance: typeof StoppingDistanceLab;
  RampForces: typeof RampForcesLab;
  CollisionTrack: typeof CollisionTrackLab;
  Optics: typeof OpticsLab;
  Lever: typeof LeverPuzzle;
  ProjectileLab: typeof ProjectileLab;
  RiverBoat: typeof RiverBoat;
  OrbitLab: typeof OrbitLab;
  GravityDrop: typeof GravityDrop;
};
//#endregion
export { AtwoodBlock, BulletWallsBlock, CarnotBlock, CircularMotionBlock, CollisionTrackBlock, DopplerBlock, EfficiencyBlock, ElectricFieldBlock, ElectricFluxBlock, EnergySkateBlock, EntropyBlock, GasProcessBlock, GaussLawBlock, GravitationBlock, GravityDropBlock, HeatTransferBlock, HeatingCurveBlock, ImpulseBlock, KeplerBlock, LeverBlock, LeverPuzzle, LorentzBlock, MagnetismBlock, OpticsBlock, OrbitLabBlock, ProjectileLabBlock, RainRelativeBlock, RampForcesBlock, RippleTankBlock, RiverBoatBlock, SimpleHarmonicBlock, StoppingDistanceBlock, StringReflectionBlock, TemperatureScalesBlock, TerminalVelocityBlock, ThermalExpansionBlock, VectorBoardBlock, VectorTypesBlock, WaterDensityBlock, WaveBlock, WorkEnergyBlock, WorkPotentialBlock, physicsBlocks, physicsComponents };