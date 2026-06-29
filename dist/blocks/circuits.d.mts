import { CircuitLab } from "../circuits/circuit-lab.mjs";
import { CircuitBuilder } from "../circuits/circuit-builder.mjs";
import { CapacitorLeakLab } from "../circuits/capacitor-leak/preset.mjs";
import { RCChargingLab } from "../circuits/rc-charging/preset.mjs";
import { DiodeLab } from "../circuits/diode/preset.mjs";
import { TransistorLab } from "../circuits/transistor/preset.mjs";
import { CmosInverterLab, CmosNandLab, CmosNorLab, RNmosNotLab } from "../circuits/cmos-gate/preset.mjs";
import { BrownoutLab } from "../circuits/brownout/preset.mjs";
import { BjtInsideLab, ConductionLab, HallEffectLab, MosfetInsideLab, PnJunctionLab, SiliconLatticeLab } from "../circuits/semiconductor/preset.mjs";
import { CircuitDoc } from "../build/contract.mjs";
import { ReactNode } from "react";
import { z } from "zod";

//#region src/blocks/circuits.d.ts
declare const CircuitLabBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  voltage: z.ZodOptional<z.ZodNumber>;
  r1: z.ZodOptional<z.ZodNumber>;
  r2: z.ZodOptional<z.ZodNumber>;
  mode: z.ZodOptional<z.ZodEnum<{
    parallel: "parallel";
    series: "series";
  }>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const CircuitBuilderBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  battery: z.ZodOptional<z.ZodNumber>;
  components: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** Simple single-loop circuit authoring → the labs component's branches[][] API. */
declare function CircuitPuzzle({
  emf,
  bulbOhms,
  withSwitch,
  controlId
}: {
  emf?: number;
  bulbOhms?: number;
  withSwitch?: boolean;
  controlId?: string;
}): ReactNode;
declare const CircuitBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  emf: z.ZodDefault<z.ZodNumber>;
  bulbOhms: z.ZodDefault<z.ZodNumber>;
  withSwitch: z.ZodDefault<z.ZodBoolean>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const CapacitorLeakBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  emf: z.ZodDefault<z.ZodNumber>;
  rK: z.ZodDefault<z.ZodNumber>;
  capU: z.ZodDefault<z.ZodNumber>;
  leakK: z.ZodDefault<z.ZodNumber>;
  startCharged: z.ZodOptional<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** Render a stored doc for learners: a CircuitPlayer they can operate (tap switches). */
declare function CircuitSceneView({
  doc
}: {
  doc?: CircuitDoc;
}): ReactNode;
declare const CircuitSceneBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  doc: z.ZodOptional<z.ZodObject<{
    parts: z.ZodDefault<z.ZodArray<z.ZodObject<{
      id: z.ZodString;
      kind: z.ZodString;
      at: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
      }, z.core.$strip>;
      orient: z.ZodOptional<z.ZodEnum<{
        h: "h";
        v: "v";
      }>>;
      props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodString, z.ZodBoolean]>>>;
      pins: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strip>>>;
    nodes: z.ZodDefault<z.ZodArray<z.ZodObject<{
      id: z.ZodString;
      at: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
      }, z.core.$strip>;
    }, z.core.$strip>>>;
    size: z.ZodOptional<z.ZodObject<{
      w: z.ZodNumber;
      h: z.ZodNumber;
    }, z.core.$strip>>;
  }, z.core.$strip>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const MosfetInsideBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  pmos: z.ZodDefault<z.ZodBoolean>;
  vth: z.ZodDefault<z.ZodNumber>;
  k: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const PnJunctionBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const BjtInsideBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  pnp: z.ZodDefault<z.ZodBoolean>;
  beta: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const SiliconLatticeBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  mode: z.ZodDefault<z.ZodEnum<{
    n: "n";
    intrinsic: "intrinsic";
    p: "p";
  }>>;
  temperature: z.ZodDefault<z.ZodNumber>;
  lockDoping: z.ZodDefault<z.ZodBoolean>;
  showTemperature: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ConductionBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const HallEffectBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const RCChargingBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  volts: z.ZodOptional<z.ZodNumber>;
  resistanceK: z.ZodOptional<z.ZodNumber>;
  capacitanceU: z.ZodOptional<z.ZodNumber>;
  show: z.ZodOptional<z.ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const DiodeBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  volts: z.ZodOptional<z.ZodNumber>;
  resistanceK: z.ZodOptional<z.ZodNumber>;
  show: z.ZodOptional<z.ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const TransistorBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  supply: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  loadK: z.ZodOptional<z.ZodNumber>;
  show: z.ZodOptional<z.ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const RNmosNotBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vdd: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  rpull: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const CmosInverterBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vdd: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  show: z.ZodOptional<z.ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const CmosNandBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vdd: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const CmosNorBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vdd: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const BrownoutBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vth: z.ZodOptional<z.ZodNumber>;
  vmax: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** All circuits lab blocks, spread into the registry in `./index.ts`. */
declare const circuitsBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  voltage: z.ZodOptional<z.ZodNumber>;
  r1: z.ZodOptional<z.ZodNumber>;
  r2: z.ZodOptional<z.ZodNumber>;
  mode: z.ZodOptional<z.ZodEnum<{
    parallel: "parallel";
    series: "series";
  }>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  battery: z.ZodOptional<z.ZodNumber>;
  components: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  doc: z.ZodOptional<z.ZodObject<{
    parts: z.ZodDefault<z.ZodArray<z.ZodObject<{
      id: z.ZodString;
      kind: z.ZodString;
      at: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
      }, z.core.$strip>;
      orient: z.ZodOptional<z.ZodEnum<{
        h: "h";
        v: "v";
      }>>;
      props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodString, z.ZodBoolean]>>>;
      pins: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strip>>>;
    nodes: z.ZodDefault<z.ZodArray<z.ZodObject<{
      id: z.ZodString;
      at: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
      }, z.core.$strip>;
    }, z.core.$strip>>>;
    size: z.ZodOptional<z.ZodObject<{
      w: z.ZodNumber;
      h: z.ZodNumber;
    }, z.core.$strip>>;
  }, z.core.$strip>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  emf: z.ZodDefault<z.ZodNumber>;
  bulbOhms: z.ZodDefault<z.ZodNumber>;
  withSwitch: z.ZodDefault<z.ZodBoolean>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  mode: z.ZodDefault<z.ZodEnum<{
    n: "n";
    intrinsic: "intrinsic";
    p: "p";
  }>>;
  temperature: z.ZodDefault<z.ZodNumber>;
  lockDoping: z.ZodDefault<z.ZodBoolean>;
  showTemperature: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  pmos: z.ZodDefault<z.ZodBoolean>;
  vth: z.ZodDefault<z.ZodNumber>;
  k: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  pnp: z.ZodDefault<z.ZodBoolean>;
  beta: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  emf: z.ZodDefault<z.ZodNumber>;
  rK: z.ZodDefault<z.ZodNumber>;
  capU: z.ZodDefault<z.ZodNumber>;
  leakK: z.ZodDefault<z.ZodNumber>;
  startCharged: z.ZodOptional<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  volts: z.ZodOptional<z.ZodNumber>;
  resistanceK: z.ZodOptional<z.ZodNumber>;
  capacitanceU: z.ZodOptional<z.ZodNumber>;
  show: z.ZodOptional<z.ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  volts: z.ZodOptional<z.ZodNumber>;
  resistanceK: z.ZodOptional<z.ZodNumber>;
  show: z.ZodOptional<z.ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  supply: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  loadK: z.ZodOptional<z.ZodNumber>;
  show: z.ZodOptional<z.ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vdd: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  rpull: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vdd: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  show: z.ZodOptional<z.ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vdd: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vdd: z.ZodOptional<z.ZodNumber>;
  vth: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  vth: z.ZodOptional<z.ZodNumber>;
  vmax: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
/** MDX tag → component render map slice for the circuits domain. */
declare const circuitsComponents: {
  readonly CapacitorLeak: typeof CapacitorLeakLab;
  readonly Circuit: typeof CircuitPuzzle;
  readonly CircuitBuilder: typeof CircuitBuilder;
  readonly CircuitLab: typeof CircuitLab;
  readonly CircuitScene: typeof CircuitSceneView;
  readonly MosfetInside: typeof MosfetInsideLab;
  readonly PnJunction: typeof PnJunctionLab;
  readonly BjtInside: typeof BjtInsideLab;
  readonly SiliconLattice: typeof SiliconLatticeLab;
  readonly Conduction: typeof ConductionLab;
  readonly HallEffect: typeof HallEffectLab;
  readonly RCCharging: typeof RCChargingLab;
  readonly Diode: typeof DiodeLab;
  readonly Transistor: typeof TransistorLab;
  readonly RNmosNot: typeof RNmosNotLab;
  readonly CmosInverter: typeof CmosInverterLab;
  readonly CmosNand: typeof CmosNandLab;
  readonly CmosNor: typeof CmosNorLab;
  readonly Brownout: typeof BrownoutLab;
};
//#endregion
export { BjtInsideBlock, BrownoutBlock, CapacitorLeakBlock, CircuitBlock, CircuitBuilderBlock, CircuitLabBlock, CircuitPuzzle, CircuitSceneBlock, CircuitSceneView, CmosInverterBlock, CmosNandBlock, CmosNorBlock, ConductionBlock, DiodeBlock, HallEffectBlock, MosfetInsideBlock, PnJunctionBlock, RCChargingBlock, RNmosNotBlock, SiliconLatticeBlock, TransistorBlock, circuitsBlocks, circuitsComponents };