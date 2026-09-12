export type OverlapMode = 's-s-sigma' | 'p-p-sigma' | 'p-p-pi';
export type OverlapPhase = 'bonding' | 'antibonding';
export const OVERLAP_FACTS: Record<
  OverlapMode,
  { label: string; bond: 'σ' | 'π'; overlap: string; nodalPlanes: number }
> = {
  's-s-sigma': { label: 's–s head-on', bond: 'σ', overlap: 'along the internuclear axis', nodalPlanes: 0 },
  'p-p-sigma': { label: 'p–p head-on', bond: 'σ', overlap: 'along the internuclear axis', nodalPlanes: 0 },
  'p-p-pi': {
    label: 'p–p side-on',
    bond: 'π',
    overlap: 'above and below the internuclear axis',
    nodalPlanes: 1,
  },
};
export function overlapStrength(mode: OverlapMode, separation: number, phase: OverlapPhase): number {
  const geometry = mode === 'p-p-pi' ? 0.72 : mode === 'p-p-sigma' ? 0.9 : 1;
  return (phase === 'bonding' ? 1 : -1) * geometry * Math.exp(-Math.max(0.4, separation) * 0.72);
}
