export const MEASUREMENT_MODES = [
  'pi-roll',
  'wheel-distance',
  'cylinder',
  'walking-path',
  'irregular-area',
] as const;
export type MeasurementMode = (typeof MEASUREMENT_MODES)[number];
export interface MeasurementInput {
  mode: MeasurementMode;
  radius: number;
  height: number;
  turns: number;
  length: number;
  width: number;
  pathWidth: number;
  gridSize: number;
  coveredCells: number;
  partialCells: number;
}
export interface MeasurementState {
  primaryLabel: string;
  primaryValue: number;
  unit: string;
  formula: string;
  secondaryLabel: string;
  secondaryValue: number;
  explanation: string;
}
export function measurementState(input: MeasurementInput): MeasurementState {
  const { mode, radius, height, turns, length, width, pathWidth, gridSize, coveredCells, partialCells } =
    input;
  if (mode === 'pi-roll') {
    const circumference = 2 * Math.PI * radius;
    return {
      primaryLabel: 'circumference',
      primaryValue: circumference,
      unit: 'm',
      formula: 'C = 2πr',
      secondaryLabel: 'C ÷ diameter',
      secondaryValue: circumference / (2 * radius),
      explanation:
        'One full roll lays the circumference along the ground; dividing it by the diameter approaches π.',
    };
  }
  if (mode === 'wheel-distance') {
    const distance = 2 * Math.PI * radius * turns;
    return {
      primaryLabel: 'distance travelled',
      primaryValue: distance,
      unit: 'm',
      formula: 'd = 2πr × turns',
      secondaryLabel: 'rotation angle',
      secondaryValue: turns * 360,
      explanation: 'Every complete turn advances one circumference when the wheel rolls without slipping.',
    };
  }
  if (mode === 'cylinder') {
    const volume = Math.PI * radius * radius * height,
      surface = 2 * Math.PI * radius * (radius + height);
    return {
      primaryLabel: 'volume',
      primaryValue: volume,
      unit: 'm³',
      formula: 'V = πr²h',
      secondaryLabel: 'total surface area',
      secondaryValue: surface,
      explanation:
        'The cylinder stacks circular layers; its net is two circles plus a rectangle whose width is the circumference.',
    };
  }
  if (mode === 'walking-path') {
    const outer = (length + 2 * pathWidth) * (width + 2 * pathWidth),
      inner = length * width,
      path = outer - inner;
    return {
      primaryLabel: 'path area',
      primaryValue: path,
      unit: 'm²',
      formula: 'Apath = Aouter − Ainner',
      secondaryLabel: 'outer perimeter',
      secondaryValue: 2 * (length + 2 * pathWidth + (width + 2 * pathWidth)),
      explanation:
        'The walking path is the enlarged outer rectangle with the central pond or garden removed.',
    };
  }
  const estimate = (coveredCells + partialCells * 0.5) * gridSize * gridSize;
  return {
    primaryLabel: 'estimated area',
    primaryValue: estimate,
    unit: 'm²',
    formula: 'A ≈ (full + ½ partial) × cell area',
    secondaryLabel: 'cells represented',
    secondaryValue: coveredCells + partialCells,
    explanation:
      'Counting full cells and approximating boundary cells exposes both the estimate and its uncertainty.',
  };
}
