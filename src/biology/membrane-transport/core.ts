export const TRANSPORT_MODES = ['diffusion', 'facilitated', 'osmosis', 'active'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];
export interface MembraneTransportInput {
  mode: TransportMode;
  outside: number;
  inside: number;
  permeability: number;
  atp: boolean;
}
export interface MembraneTransportState {
  mode: TransportMode;
  netDirection: 'into cell' | 'out of cell' | 'equilibrium' | 'stalled';
  rate: number;
  requiresProtein: boolean;
  requiresAtp: boolean;
  againstGradient: boolean;
  summary: string;
}
const direction = (value: number): MembraneTransportState['netDirection'] =>
  Math.abs(value) < 0.05 ? 'equilibrium' : value > 0 ? 'into cell' : 'out of cell';
export function membraneTransportState({
  mode,
  outside,
  inside,
  permeability,
  atp,
}: MembraneTransportInput): MembraneTransportState {
  const gradient = outside - inside;
  if (mode === 'active') {
    const running = atp && permeability > 0;
    return {
      mode,
      netDirection: running ? 'into cell' : 'stalled',
      rate: running ? permeability : 0,
      requiresProtein: true,
      requiresAtp: true,
      againstGradient: inside >= outside,
      summary: running
        ? 'ATP changes the carrier shape, moving solute into the cell even when that opposes the concentration gradient.'
        : 'Without ATP the pump cannot complete its transport cycle.',
    };
  }
  if (mode === 'osmosis') {
    const waterGradient = inside - outside;
    const net = direction(waterGradient);
    return {
      mode,
      netDirection: net,
      rate: Math.abs(waterGradient) * permeability,
      requiresProtein: false,
      requiresAtp: false,
      againstGradient: false,
      summary:
        net === 'equilibrium'
          ? 'Water molecules cross both ways at equal rates.'
          : `Water moves ${net} toward the higher solute concentration.`,
    };
  }
  const net = direction(gradient),
    facilitated = mode === 'facilitated';
  return {
    mode,
    netDirection: net,
    rate: Math.abs(gradient) * permeability,
    requiresProtein: facilitated,
    requiresAtp: false,
    againstGradient: false,
    summary:
      net === 'equilibrium'
        ? 'Particles still move both ways, but there is no net movement.'
        : `${facilitated ? 'A channel lets the solute move' : 'The solute moves directly through the bilayer'} ${net}, down its concentration gradient.`,
  };
}
