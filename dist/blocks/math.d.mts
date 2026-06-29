import { LabBlock } from "./lab-block.mjs";
import { Grapher } from "../math/grapher/preset.mjs";
import { DerivativeExplorer } from "../math/derivative-explorer/preset.mjs";
import { IntegralExplorer } from "../math/integral-explorer/preset.mjs";
import { LimitExplorer } from "../math/limit-explorer/preset.mjs";
import { NumberLineLab } from "../math/number-line/preset.mjs";
import { AreaModelLab } from "../math/area-model/preset.mjs";
import { GrowingPatternLab } from "../math/pattern/preset.mjs";
import { MysteryBucketLab } from "../math/mystery-bucket/preset.mjs";
import { BalanceAlgebraLab } from "../math/balance-algebra/preset.mjs";
import { VertexParabolaLab } from "../math/parabola/preset.mjs";
import { FunctionMachineLab } from "../math/function-machine/preset.mjs";
import { TrigExplorer } from "../math/trig-explorer.mjs";
import { Derivation } from "../math/derivation.mjs";
import { GradientDescent } from "../math/gradient-descent.mjs";
import { InteractiveProblem } from "../math/interactive/preset.mjs";
import { TriangleTrig } from "../math/triangle-trig/preset.mjs";
import { StraightLineLab } from "../math/straight-line/preset.mjs";
import { CircleLab } from "../math/circle/preset.mjs";
import { ConicLab } from "../math/conic/preset.mjs";
import { DomainRangeLab } from "../math/domain-range/preset.mjs";
import { LinearModelLab } from "../math/linear-model/preset.mjs";
import { RateMachineLab } from "../math/rate-machine/preset.mjs";
import { SequencePredict } from "../math/sequence-predict/preset.mjs";
import { PercentBarLab } from "../math/percent-bar/preset.mjs";
import { ComplexPlaneLab } from "../math/complex/preset.mjs";
import { TrigSignsLab } from "../math/trig/preset.mjs";
import { FractionBarLab } from "../math/fraction-bar/preset.mjs";
import { RatioShareLab } from "../math/ratio-share/preset.mjs";
import { TransformLab } from "../math/transform/preset.mjs";
import { ReceiptLab } from "../math/receipt/preset.mjs";
import { SystemSolveLab } from "../math/system-solve/preset.mjs";
import { PolynomialSolverLab } from "../math/poly/preset.mjs";
import { ReactNode } from "react";
import { z } from "zod";

//#region src/blocks/math.d.ts
declare const TrigExplorerBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  functions: z.ZodOptional<z.ZodArray<z.ZodEnum<{
    sin: "sin";
    cos: "cos";
  }>>>;
  startDeg: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
declare const GraphBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equations: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    expr: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>]>>>;
  params: z.ZodOptional<z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    min: z.ZodNumber;
    max: z.ZodNumber;
    step: z.ZodOptional<z.ZodNumber>;
    value: z.ZodNumber;
  }, z.core.$strip>>>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  yScale: z.ZodOptional<z.ZodEnum<{
    linear: "linear";
    log: "log";
  }>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const DerivativeExplorerBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  startX: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const GradientDescentBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  range: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  learningRate: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const IntegralExplorerBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  a: z.ZodOptional<z.ZodNumber>;
  b: z.ZodOptional<z.ZodNumber>;
  n: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const LimitExplorerBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  c: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const DerivationBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  steps: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    tex: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>]>>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** System-of-equations render: two clue lines (slope-intercept) from scalar
 *  props, so the editor form + MDX stay simple number fields. */
declare function LinearSystemView({
  m1,
  b1,
  m2,
  b2
}: {
  m1?: number;
  b1?: number;
  m2?: number;
  b2?: number;
}): ReactNode;
declare const LinearSystemBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  m1: z.ZodDefault<z.ZodNumber>;
  b1: z.ZodDefault<z.ZodNumber>;
  m2: z.ZodDefault<z.ZodNumber>;
  b2: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>>;
declare const NumberLineBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  min: z.ZodDefault<z.ZodNumber>;
  max: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  target: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
declare const MysteryBucketBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  bucketWeight: z.ZodDefault<z.ZodNumber>;
  bucketCount: z.ZodDefault<z.ZodNumber>;
  maxWeights: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>>;
declare const BalanceAlgebraBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  coef: z.ZodDefault<z.ZodNumber>;
  addend: z.ZodDefault<z.ZodNumber>;
  rhs: z.ZodDefault<z.ZodNumber>;
  answer: z.ZodDefault<z.ZodNumber>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const VertexParabolaBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  a: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>>;
declare const AreaModelBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  a: z.ZodDefault<z.ZodNumber>;
  b: z.ZodDefault<z.ZodNumber>;
  mode: z.ZodDefault<z.ZodEnum<{
    factor: "factor";
    expand: "expand";
  }>>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const GrowingPatternBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  a: z.ZodDefault<z.ZodNumber>;
  b: z.ZodDefault<z.ZodNumber>;
  steps: z.ZodDefault<z.ZodNumber>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const InteractiveProblemBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equations: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    expr: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>]>>>;
  params: z.ZodOptional<z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    min: z.ZodNumber;
    max: z.ZodNumber;
    step: z.ZodOptional<z.ZodNumber>;
    value: z.ZodNumber;
  }, z.core.$strip>>>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  yRange: z.ZodOptional<z.ZodUnion<readonly [z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, z.ZodLiteral<"auto">]>>;
  derive: z.ZodOptional<z.ZodArray<z.ZodObject<{
    kind: z.ZodEnum<{
      area: "area";
      roots: "roots";
      intersections: "intersections";
      tangent: "tangent";
      normal: "normal";
    }>;
    of: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>>;
    at: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    between: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    from: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    to: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    label: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    answer: z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>;
    placeholder: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const TriangleTrigBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  angleDeg: z.ZodOptional<z.ZodNumber>;
  leg: z.ZodOptional<z.ZodNumber>;
  legKind: z.ZodOptional<z.ZodEnum<{
    opposite: "opposite";
    adjacent: "adjacent";
  }>>;
  mode: z.ZodOptional<z.ZodEnum<{
    elevation: "elevation";
    depression: "depression";
    plain: "plain";
  }>>;
  labels: z.ZodOptional<z.ZodObject<{
    opposite: z.ZodOptional<z.ZodString>;
    adjacent: z.ZodOptional<z.ZodString>;
    hypotenuse: z.ZodOptional<z.ZodString>;
    angle: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  drive: z.ZodOptional<z.ZodArray<z.ZodEnum<{
    angle: "angle";
    leg: "leg";
  }>>>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    answer: z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>;
    placeholder: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const StraightLineBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  mode: z.ZodOptional<z.ZodEnum<{
    "two-point": "two-point";
    "gradient-intercept": "gradient-intercept";
    "intercept-form": "intercept-form";
    parallel: "parallel";
    perpendicular: "perpendicular";
  }>>;
  pointA: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  pointB: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  given: z.ZodOptional<z.ZodObject<{
    m: z.ZodNumber;
    c: z.ZodNumber;
  }, z.core.$strip>>;
  through: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  showDistance: z.ZodOptional<z.ZodBoolean>;
  snap: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const CircleBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  center: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  radius: z.ZodOptional<z.ZodNumber>;
  showTangent: z.ZodOptional<z.ZodBoolean>;
  showExpanded: z.ZodOptional<z.ZodBoolean>;
  tangentAngleDeg: z.ZodOptional<z.ZodNumber>;
  snap: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ConicBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  kind: z.ZodOptional<z.ZodEnum<{
    parabola: "parabola";
    ellipse: "ellipse";
    hyperbola: "hyperbola";
    rectangular: "rectangular";
  }>>;
  a: z.ZodOptional<z.ZodNumber>;
  b: z.ZodOptional<z.ZodNumber>;
  c: z.ZodOptional<z.ZodNumber>;
  showFocusDirectrix: z.ZodOptional<z.ZodBoolean>;
  showAsymptotes: z.ZodOptional<z.ZodBoolean>;
  snap: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const DomainRangeBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  restrict: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  probe: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const LinearModelBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  slope: z.ZodDefault<z.ZodNumber>;
  intercept: z.ZodDefault<z.ZodNumber>;
  predictX: z.ZodDefault<z.ZodNumber>;
  xMax: z.ZodDefault<z.ZodNumber>;
  yMax: z.ZodDefault<z.ZodNumber>;
  yStep: z.ZodDefault<z.ZodNumber>;
  xLabel: z.ZodDefault<z.ZodString>;
  yLabel: z.ZodDefault<z.ZodString>;
  unit: z.ZodDefault<z.ZodString>;
  scene: z.ZodDefault<z.ZodString>;
  vesselObjects: z.ZodDefault<z.ZodBoolean>;
  vesselBinds: z.ZodDefault<z.ZodEnum<{
    guess: "guess";
    truth: "truth";
  }>>;
  objectLabel: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const SequencePredictBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  start: z.ZodDefault<z.ZodNumber>;
  rule: z.ZodDefault<z.ZodEnum<{
    geometric: "geometric";
    arithmetic: "arithmetic";
  }>>;
  factor: z.ZodDefault<z.ZodNumber>;
  shown: z.ZodDefault<z.ZodNumber>;
  predict: z.ZodDefault<z.ZodNumber>;
  stepLabel: z.ZodDefault<z.ZodString>;
  highlightNew: z.ZodDefault<z.ZodBoolean>;
  scene: z.ZodDefault<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const PercentBarBlock: LabBlock;
declare const FractionBarBlock: LabBlock;
declare const RatioShareBlock: LabBlock;
declare const ComplexPlaneBlock: LabBlock;
declare const TrigSignsBlock: LabBlock;
declare const PolynomialSolverBlock: LabBlock;
declare const RateMachineBlock: LabBlock;
declare const GeoTransformBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  kind: z.ZodDefault<z.ZodEnum<{
    translate: "translate";
    reflect: "reflect";
    rotate: "rotate";
    enlarge: "enlarge";
  }>>;
  byX: z.ZodDefault<z.ZodNumber>;
  byY: z.ZodDefault<z.ZodNumber>;
  axis: z.ZodDefault<z.ZodEnum<{
    x: "x";
    y: "y";
    "y=x": "y=x";
    "y=-x": "y=-x";
  }>>;
  deg: z.ZodDefault<z.ZodNumber>;
  k: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ReceiptBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  store: z.ZodDefault<z.ZodString>;
  currency: z.ZodDefault<z.ZodString>;
  items: z.ZodOptional<z.ZodArray<z.ZodObject<{
    qty: z.ZodNumber;
    name: z.ZodString;
    unit: z.ZodNumber;
  }, z.core.$strip>>>;
  askItems: z.ZodDefault<z.ZodBoolean>;
  askCost: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const SystemSolveBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  scene: z.ZodDefault<z.ZodString>;
  symA: z.ZodDefault<z.ZodString>;
  labelA: z.ZodDefault<z.ZodString>;
  answerA: z.ZodDefault<z.ZodNumber>;
  symB: z.ZodDefault<z.ZodString>;
  labelB: z.ZodDefault<z.ZodString>;
  answerB: z.ZodDefault<z.ZodNumber>;
  a0: z.ZodDefault<z.ZodNumber>;
  b0: z.ZodDefault<z.ZodNumber>;
  a1: z.ZodDefault<z.ZodNumber>;
  b1: z.ZodDefault<z.ZodNumber>;
  currency: z.ZodOptional<z.ZodString>;
  unit: z.ZodOptional<z.ZodString>;
  store: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const CustomSceneBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  name: z.ZodDefault<z.ZodString>;
  label: z.ZodOptional<z.ZodString>;
  variant: z.ZodDefault<z.ZodEnum<{
    count: "count";
    icons: "icons";
    shape: "shape";
  }>>;
  icon: z.ZodDefault<z.ZodString>;
  slots: z.ZodDefault<z.ZodNumber>;
  shape: z.ZodDefault<z.ZodEnum<{
    box: "box";
    cup: "cup";
    circle: "circle";
  }>>;
  color: z.ZodDefault<z.ZodString>;
}, z.core.$strip>>;
/** All math labs blocks, spread into a host's `defineBlock` list. */
declare const mathBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  functions: z.ZodOptional<z.ZodArray<z.ZodEnum<{
    sin: "sin";
    cos: "cos";
  }>>>;
  startDeg: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equations: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    expr: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>]>>>;
  params: z.ZodOptional<z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    min: z.ZodNumber;
    max: z.ZodNumber;
    step: z.ZodOptional<z.ZodNumber>;
    value: z.ZodNumber;
  }, z.core.$strip>>>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  yScale: z.ZodOptional<z.ZodEnum<{
    linear: "linear";
    log: "log";
  }>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  startX: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  range: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  learningRate: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  a: z.ZodOptional<z.ZodNumber>;
  b: z.ZodOptional<z.ZodNumber>;
  n: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  c: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  steps: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    tex: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>]>>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  m1: z.ZodDefault<z.ZodNumber>;
  b1: z.ZodDefault<z.ZodNumber>;
  m2: z.ZodDefault<z.ZodNumber>;
  b2: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  min: z.ZodDefault<z.ZodNumber>;
  max: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
  target: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  bucketWeight: z.ZodDefault<z.ZodNumber>;
  bucketCount: z.ZodDefault<z.ZodNumber>;
  maxWeights: z.ZodDefault<z.ZodNumber>;
  start: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  coef: z.ZodDefault<z.ZodNumber>;
  addend: z.ZodDefault<z.ZodNumber>;
  rhs: z.ZodDefault<z.ZodNumber>;
  answer: z.ZodDefault<z.ZodNumber>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  a: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  a: z.ZodDefault<z.ZodNumber>;
  b: z.ZodDefault<z.ZodNumber>;
  mode: z.ZodDefault<z.ZodEnum<{
    factor: "factor";
    expand: "expand";
  }>>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  a: z.ZodDefault<z.ZodNumber>;
  b: z.ZodDefault<z.ZodNumber>;
  steps: z.ZodDefault<z.ZodNumber>;
  controlId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equations: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    expr: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>]>>>;
  params: z.ZodOptional<z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    min: z.ZodNumber;
    max: z.ZodNumber;
    step: z.ZodOptional<z.ZodNumber>;
    value: z.ZodNumber;
  }, z.core.$strip>>>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  yRange: z.ZodOptional<z.ZodUnion<readonly [z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, z.ZodLiteral<"auto">]>>;
  derive: z.ZodOptional<z.ZodArray<z.ZodObject<{
    kind: z.ZodEnum<{
      area: "area";
      roots: "roots";
      intersections: "intersections";
      tangent: "tangent";
      normal: "normal";
    }>;
    of: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>>;
    at: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    between: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    from: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    to: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    label: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    answer: z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>;
    placeholder: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  angleDeg: z.ZodOptional<z.ZodNumber>;
  leg: z.ZodOptional<z.ZodNumber>;
  legKind: z.ZodOptional<z.ZodEnum<{
    opposite: "opposite";
    adjacent: "adjacent";
  }>>;
  mode: z.ZodOptional<z.ZodEnum<{
    elevation: "elevation";
    depression: "depression";
    plain: "plain";
  }>>;
  labels: z.ZodOptional<z.ZodObject<{
    opposite: z.ZodOptional<z.ZodString>;
    adjacent: z.ZodOptional<z.ZodString>;
    hypotenuse: z.ZodOptional<z.ZodString>;
    angle: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  drive: z.ZodOptional<z.ZodArray<z.ZodEnum<{
    angle: "angle";
    leg: "leg";
  }>>>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    answer: z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>;
    placeholder: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  mode: z.ZodOptional<z.ZodEnum<{
    "two-point": "two-point";
    "gradient-intercept": "gradient-intercept";
    "intercept-form": "intercept-form";
    parallel: "parallel";
    perpendicular: "perpendicular";
  }>>;
  pointA: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  pointB: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  given: z.ZodOptional<z.ZodObject<{
    m: z.ZodNumber;
    c: z.ZodNumber;
  }, z.core.$strip>>;
  through: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  showDistance: z.ZodOptional<z.ZodBoolean>;
  snap: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  center: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  radius: z.ZodOptional<z.ZodNumber>;
  showTangent: z.ZodOptional<z.ZodBoolean>;
  showExpanded: z.ZodOptional<z.ZodBoolean>;
  tangentAngleDeg: z.ZodOptional<z.ZodNumber>;
  snap: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  kind: z.ZodOptional<z.ZodEnum<{
    parabola: "parabola";
    ellipse: "ellipse";
    hyperbola: "hyperbola";
    rectangular: "rectangular";
  }>>;
  a: z.ZodOptional<z.ZodNumber>;
  b: z.ZodOptional<z.ZodNumber>;
  c: z.ZodOptional<z.ZodNumber>;
  showFocusDirectrix: z.ZodOptional<z.ZodBoolean>;
  showAsymptotes: z.ZodOptional<z.ZodBoolean>;
  snap: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  equation: z.ZodOptional<z.ZodString>;
  xRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  restrict: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  probe: z.ZodOptional<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  slope: z.ZodDefault<z.ZodNumber>;
  intercept: z.ZodDefault<z.ZodNumber>;
  predictX: z.ZodDefault<z.ZodNumber>;
  xMax: z.ZodDefault<z.ZodNumber>;
  yMax: z.ZodDefault<z.ZodNumber>;
  yStep: z.ZodDefault<z.ZodNumber>;
  xLabel: z.ZodDefault<z.ZodString>;
  yLabel: z.ZodDefault<z.ZodString>;
  unit: z.ZodDefault<z.ZodString>;
  scene: z.ZodDefault<z.ZodString>;
  vesselObjects: z.ZodDefault<z.ZodBoolean>;
  vesselBinds: z.ZodDefault<z.ZodEnum<{
    guess: "guess";
    truth: "truth";
  }>>;
  objectLabel: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  ask: z.ZodOptional<z.ZodObject<{
    prompt: z.ZodString;
    placeholder: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
      kind: z.ZodLiteral<"number">;
      value: z.ZodNumber;
      tol: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
      kind: z.ZodLiteral<"expression">;
      value: z.ZodString;
    }, z.core.$strip>]>>;
    choices: z.ZodOptional<z.ZodArray<z.ZodObject<{
      value: z.ZodString;
      label: z.ZodString;
    }, z.core.$strip>>>;
    correct: z.ZodOptional<z.ZodString>;
    explain: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, LabBlock, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  start: z.ZodDefault<z.ZodNumber>;
  rule: z.ZodDefault<z.ZodEnum<{
    geometric: "geometric";
    arithmetic: "arithmetic";
  }>>;
  factor: z.ZodDefault<z.ZodNumber>;
  shown: z.ZodDefault<z.ZodNumber>;
  predict: z.ZodDefault<z.ZodNumber>;
  stepLabel: z.ZodDefault<z.ZodString>;
  highlightNew: z.ZodDefault<z.ZodBoolean>;
  scene: z.ZodDefault<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  kind: z.ZodDefault<z.ZodEnum<{
    translate: "translate";
    reflect: "reflect";
    rotate: "rotate";
    enlarge: "enlarge";
  }>>;
  byX: z.ZodDefault<z.ZodNumber>;
  byY: z.ZodDefault<z.ZodNumber>;
  axis: z.ZodDefault<z.ZodEnum<{
    x: "x";
    y: "y";
    "y=x": "y=x";
    "y=-x": "y=-x";
  }>>;
  deg: z.ZodDefault<z.ZodNumber>;
  k: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  store: z.ZodDefault<z.ZodString>;
  currency: z.ZodDefault<z.ZodString>;
  items: z.ZodOptional<z.ZodArray<z.ZodObject<{
    qty: z.ZodNumber;
    name: z.ZodString;
    unit: z.ZodNumber;
  }, z.core.$strip>>>;
  askItems: z.ZodDefault<z.ZodBoolean>;
  askCost: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  scene: z.ZodDefault<z.ZodString>;
  symA: z.ZodDefault<z.ZodString>;
  labelA: z.ZodDefault<z.ZodString>;
  answerA: z.ZodDefault<z.ZodNumber>;
  symB: z.ZodDefault<z.ZodString>;
  labelB: z.ZodDefault<z.ZodString>;
  answerB: z.ZodDefault<z.ZodNumber>;
  a0: z.ZodDefault<z.ZodNumber>;
  b0: z.ZodDefault<z.ZodNumber>;
  a1: z.ZodDefault<z.ZodNumber>;
  b1: z.ZodDefault<z.ZodNumber>;
  currency: z.ZodOptional<z.ZodString>;
  unit: z.ZodOptional<z.ZodString>;
  store: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
  activity: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  name: z.ZodDefault<z.ZodString>;
  label: z.ZodOptional<z.ZodString>;
  variant: z.ZodDefault<z.ZodEnum<{
    count: "count";
    icons: "icons";
    shape: "shape";
  }>>;
  icon: z.ZodDefault<z.ZodString>;
  slots: z.ZodDefault<z.ZodNumber>;
  shape: z.ZodDefault<z.ZodEnum<{
    box: "box";
    cup: "cup";
    circle: "circle";
  }>>;
  color: z.ZodDefault<z.ZodString>;
}, z.core.$strip>>];
/** The MDX tag → component render map slice for the math domain. */
declare const mathComponents: {
  readonly MysteryBucket: typeof MysteryBucketLab;
  readonly NumberLine: typeof NumberLineLab;
  readonly LinearSystem: typeof LinearSystemView;
  readonly BalanceAlgebra: typeof BalanceAlgebraLab;
  readonly VertexParabola: typeof VertexParabolaLab;
  readonly AreaModel: typeof AreaModelLab;
  readonly GrowingPattern: typeof GrowingPatternLab;
  readonly FunctionMachine: typeof FunctionMachineLab;
  readonly Graph: typeof Grapher;
  readonly DerivativeExplorer: typeof DerivativeExplorer;
  readonly IntegralExplorer: typeof IntegralExplorer;
  readonly LimitExplorer: typeof LimitExplorer;
  readonly GradientDescent: typeof GradientDescent;
  readonly Derivation: typeof Derivation;
  readonly TrigExplorer: typeof TrigExplorer;
  readonly InteractiveProblem: typeof InteractiveProblem;
  readonly TriangleTrig: typeof TriangleTrig;
  readonly StraightLine: typeof StraightLineLab;
  readonly CircleLab: typeof CircleLab;
  readonly ConicLab: typeof ConicLab;
  readonly DomainRange: typeof DomainRangeLab;
  readonly LinearModel: typeof LinearModelLab;
  readonly RateMachine: typeof RateMachineLab;
  readonly SequencePredict: typeof SequencePredict;
  readonly PercentBar: typeof PercentBarLab;
  readonly FractionBar: typeof FractionBarLab;
  readonly RatioShare: typeof RatioShareLab;
  readonly ComplexPlane: typeof ComplexPlaneLab;
  readonly TrigSigns: typeof TrigSignsLab;
  readonly PolynomialSolver: typeof PolynomialSolverLab;
  readonly GeoTransform: typeof TransformLab;
  readonly ReceiptTotals: typeof ReceiptLab;
  readonly SystemSolve: typeof SystemSolveLab;
};
//#endregion
export { AreaModelBlock, BalanceAlgebraBlock, CircleBlock, ComplexPlaneBlock, ConicBlock, CustomSceneBlock, DerivationBlock, DerivativeExplorerBlock, DomainRangeBlock, FractionBarBlock, GeoTransformBlock, GradientDescentBlock, GraphBlock, GrowingPatternBlock, IntegralExplorerBlock, InteractiveProblemBlock, LimitExplorerBlock, LinearModelBlock, LinearSystemBlock, LinearSystemView, MysteryBucketBlock, NumberLineBlock, PercentBarBlock, PolynomialSolverBlock, RateMachineBlock, RatioShareBlock, ReceiptBlock, SequencePredictBlock, StraightLineBlock, SystemSolveBlock, TriangleTrigBlock, TrigExplorerBlock, TrigSignsBlock, VertexParabolaBlock, mathBlocks, mathComponents };