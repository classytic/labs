export interface InductionModel {
  first: number;
  last: number;
  baseEstablished: boolean;
  bridgeEstablished: boolean;
}

export function inductionReach(model: InductionModel): number[] {
  if (!model.baseEstablished) return [];
  if (!model.bridgeEstablished) return [model.first];
  return Array.from({ length: Math.max(0, model.last - model.first + 1) }, (_, index) => model.first + index);
}

export function inductionComplete(model: InductionModel): boolean {
  return inductionReach(model).at(-1) === model.last;
}

export function inductionDiagnosis(model: InductionModel): string {
  if (!model.baseEstablished) return 'The implication has nowhere to start: establish the base case.';
  if (!model.bridgeEstablished) return 'The base is true, but no general k → k + 1 bridge carries it onward.';
  return 'Base plus bridge reaches every integer in the authored range.';
}
