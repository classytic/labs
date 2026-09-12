export interface InvariantMove {
  id: string;
  label: string;
  delta: number;
}

export interface InvariantState {
  value: number;
  moves: string[];
}

export function applyInvariantMove(state: InvariantState, move: InvariantMove): InvariantState {
  return { value: state.value + move.delta, moves: [...state.moves, move.id] };
}

export function residueInvariant(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

export function targetReachableByInvariant(
  start: number,
  target: number,
  moves: readonly InvariantMove[],
  modulus: number,
): boolean {
  const startResidue = residueInvariant(start, modulus);
  const preserved = moves.every((move) => residueInvariant(move.delta, modulus) === 0);
  return !preserved || startResidue === residueInvariant(target, modulus);
}
