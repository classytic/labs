/**
 * Deformation of solids (Cambridge International A Level Physics 9702, chapter 6).
 *
 * A wire of original length L and diameter d carries a load F. Two descriptions of the SAME
 * experiment sit side by side, and the difference between them is the whole chapter:
 *
 *   force and extension   F against x        gradient = k = A E / L   (a property of THIS wire)
 *   stress and strain     sigma against eps  gradient = E             (a property of the MATERIAL)
 *
 * sigma = F / A, eps = x / L, and E = sigma / eps below the limit of proportionality. Dividing
 * the force by the area and the extension by the original length removes the two things the
 * learner is allowed to change (diameter and original length), which is why the stress-strain
 * line does not move when they change them. Nothing in `stressAt` / `strainAt` / the sampled
 * curve reads `diameterMm` or `lengthM`: the invariance is structural, not a coincidence of
 * rounding.
 *
 * Everything here is pure and React-free so it can be tested directly.
 */

export type MaterialId = 'steel' | 'copper' | 'aluminium' | 'glass';

export interface Material {
  id: MaterialId;
  label: string;
  /** Young modulus E, in pascals. */
  E: number;
  /** Stress at the limit of proportionality, in pascals. */
  limitStress: number;
  /** A brittle material snaps at the limit instead of stretching plastically. */
  brittle: boolean;
  /** One-line description shown next to the material picker. */
  note: string;
  /**
   * What the wire LOOKS like, pinned rather than themed.
   *
   * Every material used to draw in one grey `--fig-metal`, so steel, copper, aluminium and glass
   * were the same rod and only the caption changed. Choosing a material is the central act of
   * this lab, and it produced no visible difference at all.
   *
   * Pinned literals because a theme token inverts with light and dark: copper that turns pale
   * blue in dark mode is not copper. A physical object owns its own colour.
   */
  colour: string;
  /** Glass is see-through, so it is drawn lighter than an opaque metal. */
  opacity?: number;
}

/**
 * Slope of the plastic branch, as a fraction of E. This one number is a TEACHING value, not
 * measured data: a real work-hardening curve is not a straight line. It is here only so the
 * graph visibly bends past the limit of proportionality instead of turning a sharp corner into
 * a vertical wall. The elastic part, which is what the lab actually measures, is exact.
 */
export const PLASTIC_SLOPE = 0.06;

/**
 * Material constants.
 *
 * Young modulus values: Kaye & Laby, Tables of Physical and Chemical Constants (steel
 * 200-210 GPa, copper 117-130 GPa, aluminium 70 GPa, soda-lime glass 68-72 GPa). These are the
 * same rounded figures printed in the Cambridge International AS & A Level Physics coursebook
 * (Sang, Jones, Chadha, Woodside), so a learner's answers match their textbook.
 *
 * Limit of proportionality: taken as the quoted yield stress of the common engineering grade,
 * because that is where a school stress-strain graph is drawn to bend.
 *   steel      250 MPa  mild / low-carbon structural steel yield stress
 *   copper      60 MPa  annealed copper yield stress
 *   aluminium   95 MPa  commercial aluminium alloy yield stress
 *   glass       50 MPa  tensile breaking stress of ordinary drawn glass. Glass has no yield
 *                       point at all: it stays proportional and then snaps. Real values scatter
 *                       widely because surface scratches control the fracture.
 *
 * Rubber is deliberately ABSENT. Its stress-strain curve is not a straight line anywhere and it
 * has no single Young modulus, so putting it on this axis would teach a false idea. A separate
 * lab should show rubber with its hysteresis loop.
 */
export const MATERIALS: readonly Material[] = [
  {
    id: 'steel',
    label: 'steel',
    E: 2.1e11,
    limitStress: 2.5e8,
    brittle: false,
    note: 'Very stiff. It stretches very little, then yields and stays stretched.',
    colour: '#8c97a8',
  },
  {
    id: 'copper',
    label: 'copper',
    E: 1.2e11,
    limitStress: 6.0e7,
    brittle: false,
    note: 'Softer than steel and very ductile. It yields early and can be drawn into wire.',
    colour: '#b87333',
  },
  {
    id: 'aluminium',
    label: 'aluminium',
    E: 7.0e10,
    limitStress: 9.5e7,
    brittle: false,
    note: 'A third of the stiffness of steel, so the same load stretches it about three times as far.',
    colour: '#ccd2da',
  },
  {
    id: 'glass',
    label: 'glass',
    E: 7.0e10,
    limitStress: 5.0e7,
    brittle: true,
    note: 'Brittle. The line stays straight right up to the break, then the wire snaps.',
    colour: '#a9d8e0',
    opacity: 0.72,
  },
];

export function material(id: MaterialId): Material {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0]!;
}

/** Cross-sectional area of a round wire, m^2, from its diameter in millimetres. */
export function areaOf(diameterMm: number): number {
  const r = diameterMm / 1000 / 2;
  return Math.PI * r * r;
}

/** Strain at the limit of proportionality: eps_p = sigma_p / E. */
export function limitStrain(m: Material): number {
  return m.limitStress / m.E;
}

/** Strain produced by a stress, following the model curve (elastic, then plastic). */
export function strainAt(m: Material, stress: number): number {
  if (stress <= m.limitStress) return stress / m.E;
  if (m.brittle) return limitStrain(m); // it broke; no larger strain exists
  return limitStrain(m) + (stress - m.limitStress) / (m.E * PLASTIC_SLOPE);
}

/** Stress carried at a given strain, following the model curve. */
export function stressAt(m: Material, strain: number): number {
  const ep = limitStrain(m);
  if (strain <= ep) return strain * m.E;
  if (m.brittle) return m.limitStress;
  return m.limitStress + (strain - ep) * m.E * PLASTIC_SLOPE;
}

/**
 * How far the plotted stress-strain graph runs. It depends ONLY on the material, so the axes
 * hold still while the learner changes the wire. A ductile material gets three times its limit
 * strain, which keeps the straight elastic part large enough to read a gradient from.
 */
export function plotStrainMax(m: Material): number {
  return limitStrain(m) * (m.brittle ? 1.6 : 3);
}

/** Top of the stress axis, in pascals. Material-only, for the same reason. */
export function plotStressMax(m: Material): number {
  return m.brittle ? m.limitStress * 1.35 : stressAt(m, plotStrainMax(m)) * 1.12;
}

export interface CurvePoint {
  strain: number;
  stress: number;
}

/**
 * The material's stress-strain curve, sampled. The point at the limit of proportionality is
 * always included, so the bend stays a real vertex instead of being smoothed away.
 */
export function stressStrainCurve(m: Material, samples = 28): CurvePoint[] {
  const ep = limitStrain(m);
  const end = m.brittle ? ep : plotStrainMax(m);
  const points: CurvePoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const strain = (i / samples) * ep;
    points.push({ strain, stress: stressAt(m, strain) });
  }
  if (!m.brittle) {
    for (let i = 1; i <= samples; i++) {
      const strain = ep + (i / samples) * (end - ep);
      points.push({ strain, stress: stressAt(m, strain) });
    }
  }
  return points;
}

export interface WireInput {
  material: Material;
  /** Wire diameter, mm. */
  diameterMm: number;
  /** Original (unstretched) length, m. */
  lengthM: number;
  /** Load hung on the wire, N. */
  loadN: number;
}

export interface WireState {
  /** Cross-sectional area, m^2. */
  areaM2: number;
  /** Applied stress F/A, Pa. Still reported after a brittle wire has snapped. */
  stressPa: number;
  /** Strain the model allows: clamped at the limit once a brittle wire has broken. */
  strain: number;
  /** Extension, m. */
  extensionM: number;
  /** Spring constant of THIS wire, k = F/x = A E / L, N/m. */
  springConstantNPerM: number;
  /** Young modulus of the MATERIAL, Pa. Independent of the wire's shape. */
  youngModulusPa: number;
  /** True once the load has pushed the wire past the limit of proportionality. */
  beyondLimit: boolean;
  /** True when a brittle wire has been loaded past its breaking stress. */
  broken: boolean;
  /** Elastic potential energy stored, J: the area under the force-extension graph. */
  energyJ: number;
  /** Load at the limit of proportionality, N. */
  limitLoadN: number;
  /** Extension at the limit of proportionality, m. */
  limitExtensionM: number;
}

/**
 * Energy stored per unit volume, J/m^3: the area under the stress-strain graph up to `strain`.
 * The model is piecewise straight, so the area is two exact triangles/trapezia, no integration.
 */
export function energyDensity(m: Material, strain: number): number {
  const ep = limitStrain(m);
  if (strain <= ep) return 0.5 * stressAt(m, strain) * strain;
  const elastic = 0.5 * m.limitStress * ep;
  const plastic = 0.5 * (m.limitStress + stressAt(m, strain)) * (strain - ep);
  return elastic + plastic;
}

/** Everything the lab reads off one wire under one load. */
export function wireState({ material: m, diameterMm, lengthM, loadN }: WireInput): WireState {
  const areaM2 = areaOf(diameterMm);
  const stressPa = loadN / areaM2;
  const broken = m.brittle && stressPa > m.limitStress;
  const strain = strainAt(m, stressPa);
  const extensionM = strain * lengthM;
  // k = F/x = (sigma A)/(eps L) = A E / L. Written from A, E and L so it stays defined at F = 0.
  const springConstantNPerM = (areaM2 * m.E) / lengthM;
  return {
    areaM2,
    stressPa,
    strain,
    extensionM,
    springConstantNPerM,
    youngModulusPa: m.E,
    beyondLimit: stressPa > m.limitStress,
    broken,
    // Volume A*L converts energy per unit volume into joules. In the straight part this is
    // exactly one half F x, which is what the shaded triangle on the graph shows.
    energyJ: energyDensity(m, strain) * areaM2 * lengthM,
    limitLoadN: m.limitStress * areaM2,
    limitExtensionM: limitStrain(m) * lengthM,
  };
}
