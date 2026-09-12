export const GEOMETRY_FOUNDATION_MODES = ['pythagorean', 'circle-theorem', 'polygon-angles'] as const;
export type GeometryFoundationMode = (typeof GEOMETRY_FOUNDATION_MODES)[number];

export interface GeometryFoundationInput {
  mode: GeometryFoundationMode;
  sideA: number;
  sideB: number;
  centralAngle: number;
  sides: number;
}

export interface GeometryFoundationState {
  headline: string;
  formula: string;
  values: ReadonlyArray<{ label: string; value: string }>;
  explanation: string;
}

export function geometryFoundationState(input: GeometryFoundationInput): GeometryFoundationState {
  if (input.mode === 'pythagorean') {
    const c = Math.hypot(input.sideA, input.sideB);
    return {
      headline: `${input.sideA ** 2} + ${input.sideB ** 2} = ${Number(c.toFixed(4)) ** 2}`,
      formula: 'a² + b² = c²',
      values: [
        { label: 'leg squares', value: `${input.sideA ** 2} + ${input.sideB ** 2}` },
        { label: 'hypotenuse', value: c.toFixed(2) },
      ],
      explanation:
        'The two smaller square areas exactly cover the square on the hypotenuse; rearranging changes position, not area.',
    };
  }
  if (input.mode === 'circle-theorem') {
    const circumferenceAngle = input.centralAngle / 2;
    return {
      headline: `${input.centralAngle}° = 2 × ${circumferenceAngle}°`,
      formula: 'angle at centre = 2 × angle at circumference',
      values: [
        { label: 'centre angle', value: `${input.centralAngle}°` },
        { label: 'circumference angle', value: `${circumferenceAngle}°` },
      ],
      explanation:
        'Both angles stand on the same arc. The radii form isosceles triangles, making the centre angle twice the circumference angle.',
    };
  }
  const triangles = input.sides - 2;
  const sum = triangles * 180;
  return {
    headline: `${triangles} triangles · ${sum}°`,
    formula: '(n − 2) × 180°',
    values: [
      { label: 'triangles from one vertex', value: String(triangles) },
      { label: 'interior-angle sum', value: `${sum}°` },
      { label: 'regular interior angle', value: `${(sum / input.sides).toFixed(1)}°` },
    ],
    explanation:
      'Diagonals from one vertex partition the polygon into n − 2 non-overlapping triangles, so their angle sums add.',
  };
}
