export type InventoryScenario = 'steady' | 'demand-spike' | 'supplier-delay';

export interface InventoryPolicyInput {
  usagePerDay: number;
  orderQty: number;
  leadTimeDays: number;
  bufferStock: number;
  days: number;
  scenario?: InventoryScenario;
}

export interface InventoryPolicyResult {
  series: number[];
  demand: number[];
  reorderPoint: number;
  ordersPlaced: number;
  lostUnits: number;
  serviceLevel: number;
  averageStock: number;
  eventLabel: string;
}

/**
 * Small, deterministic inventory simulation for teaching policy rather than forecasting.
 * Each scenario adds one explainable disruption, so replaying a lesson always gives the
 * same evidence and never hides the causal relationship behind random noise.
 */
export function simulateInventoryPolicy({
  usagePerDay,
  orderQty,
  leadTimeDays,
  bufferStock,
  days,
  scenario = 'steady',
}: InventoryPolicyInput): InventoryPolicyResult {
  const horizon = Math.max(1, Math.floor(days));
  const usage = Math.max(0, usagePerDay);
  const quantity = Math.max(0, orderQty);
  const lead = Math.max(1, Math.floor(leadTimeDays));
  const buffer = Math.max(0, bufferStock);
  const reorderPoint = usage * lead + buffer;
  const spikeStart = Math.max(2, Math.floor(horizon * 0.38));
  const demand = Array.from({ length: horizon }, (_, day) =>
    scenario === 'demand-spike' && day >= spikeStart && day < spikeStart + 3 ? usage * 2 : usage,
  );
  const deliveries: { due: number; quantity: number }[] = [];
  const series: number[] = [];
  let stock = buffer + quantity;
  let ordersPlaced = 0;
  let requested = 0;
  let fulfilled = 0;
  let stockTotal = 0;

  for (let day = 0; day < horizon; day += 1) {
    for (const delivery of deliveries) if (delivery.due === day) stock += delivery.quantity;
    const dailyDemand = demand[day]!;
    requested += dailyDemand;
    const served = Math.min(stock, dailyDemand);
    fulfilled += served;
    stock -= served;
    const onOrder = deliveries
      .filter((delivery) => delivery.due > day)
      .reduce((sum, delivery) => sum + delivery.quantity, 0);
    if (stock + onOrder <= reorderPoint && quantity > 0) {
      const extraDelay = scenario === 'supplier-delay' && ordersPlaced === 1 ? 3 : 0;
      deliveries.push({ due: day + lead + extraDelay + 1, quantity });
      ordersPlaced += 1;
    }
    series.push(stock);
    stockTotal += stock;
  }

  const lostUnits = requested - fulfilled;
  return {
    series,
    demand,
    reorderPoint,
    ordersPlaced,
    lostUnits,
    serviceLevel: requested > 0 ? fulfilled / requested : 1,
    averageStock: stockTotal / horizon,
    eventLabel:
      scenario === 'demand-spike'
        ? `Demand doubles on days ${spikeStart + 1}–${spikeStart + 3}`
        : scenario === 'supplier-delay'
          ? 'The second delivery arrives 3 days late'
          : 'Demand and lead time stay steady',
  };
}
