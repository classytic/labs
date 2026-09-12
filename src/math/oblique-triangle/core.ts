/**
 * Solving a triangle that is NOT right-angled: the sine rule, the cosine rule, and the ambiguous
 * case.
 *
 * This is the largest single hole in our O Level maths: the course had right-angled trigonometry
 * (see math/triangle-trig) and nothing else, so a learner met "find the third side of a triangle
 * with no right angle" having never been shown the two tools that do it. Both rules are on 4024
 * and 0580 papers every session, and the ambiguous case is the standard way an examiner separates
 * a candidate who understands the picture from one who follows a recipe.
 *
 * NAMING, used throughout: side `a` is opposite angle `A`, side `b` opposite `B`, side `c`
 * opposite `C`. Every formula below depends on that pairing, and getting it wrong is the most
 * common error in the topic, so the solvers take arguments in an order that names which is which.
 *
 * WHICH RULE, the decision the whole topic turns on:
 *   The sine rule needs a MATCHING PAIR, a side and the angle facing it. With one complete pair
 *   plus one more fact it finds everything else. The cosine rule is what you reach for when you
 *   have no pair at all, which happens in exactly two situations: three sides (SSS), or two sides
 *   with the angle BETWEEN them (SAS). That is the whole decision, and it is why we expose
 *   `ruleFor` as a first-class function rather than leaving it as prose in a lesson.
 *
 * THE AMBIGUOUS CASE (SSA) is the reason this file returns an ARRAY of solutions rather than one.
 * Given two sides and an angle NOT between them, the sine rule gives sin B, and sin B = k has two
 * angles in a triangle's range: B and 180 - B. Sometimes both close a real triangle, sometimes one
 * does, sometimes neither. A calculator reports only the acute one, so a learner who trusts it
 * silently loses the second answer. Returning both, and drawing both, is the point.
 */

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Guard against 1.0000000000000002 out of a division, which would make acos/asin NaN. */
const clamp1 = (x: number): number => Math.max(-1, Math.min(1, x));

/** A fully solved triangle. Angles in degrees; `a` faces `A`, and so on. */
export interface Triangle {
  a: number;
  b: number;
  c: number;
  A: number;
  B: number;
  C: number;
}

/** Which of the two rules the given data unlocks, and the reason, in the learner's words. */
export interface RuleChoice {
  rule: 'sine' | 'cosine';
  why: string;
}

/** The four shapes of given data an exam question comes in. */
export type GivenCase = 'sss' | 'sas' | 'aas' | 'ssa';

/**
 * The decision that opens every question in this topic.
 *
 * Deliberately phrased around the matching pair rather than around the case letters. A learner who
 * memorises "SAS means cosine rule" is stuck the moment a question is worded rather than labelled;
 * a learner who asks "do I have a side and the angle facing it?" is never stuck.
 */
export function ruleFor(kind: GivenCase): RuleChoice {
  if (kind === 'sss')
    return {
      rule: 'cosine',
      why: 'Three sides and no angle at all, so there is no matching pair to start the sine rule with.',
    };
  if (kind === 'sas')
    return {
      rule: 'cosine',
      why: 'The angle sits BETWEEN the two known sides, so it faces the unknown one. No pair, so the cosine rule.',
    };
  if (kind === 'aas')
    return {
      rule: 'sine',
      why: 'A side and the angle facing it are both known, which is the matching pair the sine rule runs on.',
    };
  return {
    rule: 'sine',
    why: 'The known angle faces one of the known sides, so the pair is there. Watch for a second triangle.',
  };
}

/** Area from two sides and the angle between them. Needs no height and no perpendicular. */
export const areaFrom = (side1: number, includedAngleDeg: number, side2: number): number =>
  0.5 * side1 * side2 * Math.sin(toRad(includedAngleDeg));

/** Area of a solved triangle, taken from the pair that is certain to be exact. */
export const area = (t: Triangle): number => areaFrom(t.a, t.C, t.b);

/**
 * Three sides given. The cosine rule rearranged to find an angle.
 *
 * Returns null when the sides cannot close: the longest must be shorter than the other two added
 * together. Without that check `acos` of a value outside [-1, 1] gives NaN and the lab would draw
 * a triangle that does not exist.
 */
export function solveSSS(a: number, b: number, c: number): Triangle | null {
  if (a <= 0 || b <= 0 || c <= 0) return null;
  if (a + b <= c || b + c <= a || a + c <= b) return null;
  const A = toDeg(Math.acos(clamp1((b * b + c * c - a * a) / (2 * b * c))));
  const B = toDeg(Math.acos(clamp1((a * a + c * c - b * b) / (2 * a * c))));
  return { a, b, c, A, B, C: 180 - A - B };
}

/**
 * Two sides and the angle BETWEEN them. The cosine rule in its forward direction.
 *
 * The second angle is then taken from the cosine rule too, not the sine rule. That is deliberate:
 * the sine rule would return the acute angle whenever the true one is obtuse, and here the answer
 * is already unique, so introducing an ambiguity we would then have to resolve is a bug waiting to
 * happen. arccos ranges over 0 to 180, so it never has to choose.
 */
export function solveSAS(b: number, includedAngleDeg: number, c: number): Triangle | null {
  if (b <= 0 || c <= 0 || includedAngleDeg <= 0 || includedAngleDeg >= 180) return null;
  const A = includedAngleDeg;
  const a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(toRad(A)));
  const B = toDeg(Math.acos(clamp1((a * a + c * c - b * b) / (2 * a * c))));
  return { a, b, c, A, B, C: 180 - A - B };
}

/**
 * Two angles and a side. The third angle is free (angles sum to 180), so this is always one
 * triangle. `a` is the side facing `A`; ASA questions become this after one subtraction.
 */
export function solveAAS(A: number, B: number, a: number): Triangle | null {
  if (a <= 0 || A <= 0 || B <= 0 || A + B >= 180) return null;
  const C = 180 - A - B;
  const k = a / Math.sin(toRad(A)); // the common ratio the sine rule asserts is shared
  return { a, b: k * Math.sin(toRad(B)), c: k * Math.sin(toRad(C)), A, B, C };
}

/**
 * Two sides and an angle NOT between them: the ambiguous case.
 *
 * Given `a`, `b` and angle `A` facing `a`, the sine rule gives sin B = b sin A / a. Two angles
 * share that sine, B and 180 - B, and which of them survive is decided by geometry:
 *
 *   Let h = b sin A, the perpendicular distance from C down to the line through A. It is the
 *   shortest that side `a` could possibly be and still reach.
 *     a < h            side a cannot reach the base at all         no triangle
 *     a = h            it reaches exactly perpendicular            one right-angled triangle
 *     h < a < b        it reaches the base twice, near and far     TWO triangles
 *     a >= b           the far crossing is behind A, so invalid    one triangle
 *
 * Returned acute-first, which is also the order a candidate meets them: the calculator's answer,
 * then the one they have to remember to look for.
 */
export function solveSSA(a: number, b: number, A: number): Triangle[] {
  if (a <= 0 || b <= 0 || A <= 0 || A >= 180) return [];
  const sinB = clamp1((b * Math.sin(toRad(A))) / a);
  if ((b * Math.sin(toRad(A))) / a > 1) return []; // side a is too short to reach
  const acute = toDeg(Math.asin(sinB));
  const obtuse = 180 - acute;

  const build = (B: number): Triangle | null => {
    const C = 180 - A - B;
    if (C <= 1e-9) return null; // the three angles do not leave room for a third
    const k = a / Math.sin(toRad(A));
    return { a, b, c: k * Math.sin(toRad(C)), A, B, C };
  };

  // An obtuse given angle can only ever face the longest side, so it admits at most one triangle.
  // Checking `A >= 90` explicitly rather than relying on the C <= 0 test keeps the reason visible.
  const solutions = [build(acute)];
  if (A < 90 && Math.abs(obtuse - acute) > 1e-9) solutions.push(build(obtuse));
  return solutions.filter((t): t is Triangle => t !== null);
}

/** Why the SSA data produced 0, 1 or 2 triangles, in words a learner can repeat in an answer. */
export function ambiguityNote(a: number, b: number, A: number): string {
  const h = b * Math.sin(toRad(A));
  if (a < h)
    return `a = ${a} is shorter than the height ${h.toFixed(2)}, so the side never reaches. No triangle.`;
  if (Math.abs(a - h) < 1e-9)
    return `a equals the height ${h.toFixed(2)} exactly, so it meets at a right angle. One triangle.`;
  if (A >= 90) return `The given angle is not acute, so it must face the longest side. One triangle.`;
  if (a < b)
    return `The height ${h.toFixed(2)} is less than a = ${a}, which is less than b = ${b}. The side reaches twice, so TWO triangles.`;
  return `a = ${a} is at least b = ${b}, so the second crossing falls behind the angle. One triangle.`;
}

/**
 * Vertices for drawing, with A at the origin and side `c` laid along the positive x-axis.
 *
 * Placing the triangle this way is not just convenient: it is the picture the ambiguous case needs.
 * Both SSA solutions share the vertex A, the direction of side b and the base line, and differ only
 * in where C lands on that base. Drawn from a common frame, the two triangles visibly hinge on the
 * same swing of side `a`, which is the whole insight.
 */
export function vertices(t: Triangle): { A: [number, number]; B: [number, number]; C: [number, number] } {
  return {
    A: [0, 0],
    B: [t.c, 0],
    C: [t.b * Math.cos(toRad(t.A)), t.b * Math.sin(toRad(t.A))],
  };
}

/** Authoring mistakes worth catching before a learner meets them. */
export function triangleProblems(kind: GivenCase, given: number[]): string[] {
  const problems: string[] = [];
  if (given.some((v) => !Number.isFinite(v) || v <= 0)) problems.push('every given value must be positive');
  if (kind === 'sss' && solveSSS(given[0]!, given[1]!, given[2]!) === null)
    problems.push('these three sides cannot close: the longest is at least the other two added together');
  if (kind === 'sas' && (given[1]! <= 0 || given[1]! >= 180))
    problems.push('the included angle must lie strictly between 0 and 180 degrees');
  if (kind === 'aas' && given[0]! + given[1]! >= 180)
    problems.push('two angles of a triangle must add to less than 180 degrees');
  if (kind === 'ssa' && solveSSA(given[0]!, given[1]!, given[2]!).length === 0)
    problems.push('this data closes no triangle at all, so there is nothing to draw');
  return problems;
}
