export const U_TO_MEV = 931.49410372,
  HYDROGEN_ATOM_MASS_U = 1.00782503223,
  NEUTRON_MASS_U = 1.00866491595;
export interface Nuclide {
  id: string;
  symbol: string;
  name: string;
  A: number;
  Z: number;
  atomicMassU: number;
}
export const NUCLIDES = {
  deuterium: { id: 'deuterium', symbol: '²H', name: 'deuterium', A: 2, Z: 1, atomicMassU: 2.01410177812 },
  helium4: { id: 'helium4', symbol: '⁴He', name: 'helium-4', A: 4, Z: 2, atomicMassU: 4.00260325413 },
  carbon12: { id: 'carbon12', symbol: '¹²C', name: 'carbon-12', A: 12, Z: 6, atomicMassU: 12 },
  iron56: { id: 'iron56', symbol: '⁵⁶Fe', name: 'iron-56', A: 56, Z: 26, atomicMassU: 55.93493633 },
  uranium235: {
    id: 'uranium235',
    symbol: '²³⁵U',
    name: 'uranium-235',
    A: 235,
    Z: 92,
    atomicMassU: 235.0439299,
  },
  uranium238: {
    id: 'uranium238',
    symbol: '²³⁸U',
    name: 'uranium-238',
    A: 238,
    Z: 92,
    atomicMassU: 238.05078826,
  },
} as const;
export type NuclideId = keyof typeof NUCLIDES;
export interface BindingState {
  nuclide: Nuclide;
  neutrons: number;
  separatedMassU: number;
  massDefectU: number;
  bindingEnergyMeV: number;
  perNucleonMeV: number;
  massRetainedPercent: number;
}
export function bindingState(nuclide: Nuclide): BindingState {
  const neutrons = nuclide.A - nuclide.Z,
    separatedMassU = nuclide.Z * HYDROGEN_ATOM_MASS_U + neutrons * NEUTRON_MASS_U,
    massDefectU = separatedMassU - nuclide.atomicMassU,
    bindingEnergyMeV = massDefectU * U_TO_MEV;
  return {
    nuclide,
    neutrons,
    separatedMassU,
    massDefectU,
    bindingEnergyMeV,
    perNucleonMeV: bindingEnergyMeV / nuclide.A,
    massRetainedPercent: (nuclide.atomicMassU / separatedMassU) * 100,
  };
}
