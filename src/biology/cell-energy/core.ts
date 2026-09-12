export interface CellEnergyInput {
  glucose: number;
  oxygen: number;
  demand: number;
  fermentation: boolean;
}
export interface CellEnergyState {
  aerobicRate: number;
  fermentationRate: number;
  atpProduction: number;
  atpDemand: number;
  balance: number;
  limiting: 'glucose' | 'oxygen' | 'balanced';
  workFraction: number;
  summary: string;
}
export function cellEnergyState({ glucose, oxygen, demand, fermentation }: CellEnergyInput): CellEnergyState {
  const aerobicRate = Math.min(glucose, oxygen),
    remainingGlucose = Math.max(0, glucose - aerobicRate),
    fermentationRate = fermentation ? remainingGlucose : 0,
    atpProduction = aerobicRate * 30 + fermentationRate * 2,
    atpDemand = demand * 30,
    balance = atpProduction - atpDemand,
    limiting: CellEnergyState['limiting'] =
      glucose === oxygen ? 'balanced' : glucose < oxygen ? 'glucose' : 'oxygen',
    workFraction = atpDemand === 0 ? 1 : Math.min(1, atpProduction / atpDemand),
    summary =
      balance >= 0
        ? `ATP supply meets current cellular demand; ${limiting === 'balanced' ? 'substrate delivery is balanced' : `${limiting} limits further aerobic respiration`}.`
        : `ATP supply meets ${Math.round(workFraction * 100)}% of demand; ${limiting} limits aerobic respiration.`;
  return {
    aerobicRate,
    fermentationRate,
    atpProduction,
    atpDemand,
    balance,
    limiting,
    workFraction,
    summary,
  };
}
