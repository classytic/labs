export type StatementClass = 'proposition' | 'open-sentence' | 'non-statement';

export interface StatementChoice {
  value: string;
  label: string;
}

interface RoundBase {
  id: string;
  statement: string;
  explanation: string;
}

export interface ClassifyStatementRound extends RoundBase {
  kind: 'classify';
  answer: StatementClass;
}

export interface TruthStatementRound extends RoundBase {
  kind: 'truth';
  context?: string;
  answer: boolean;
}

export interface NegateStatementRound extends RoundBase {
  kind: 'negate';
  choices: StatementChoice[];
  answer: string;
}

export interface ImplicationWorld {
  id: string;
  label: string;
  premiseTrue: boolean;
  conclusionTrue: boolean;
  evidence?: string;
}

export interface ImplicationStatementRound extends RoundBase {
  kind: 'implication';
  conclusion: string;
  worlds: ImplicationWorld[];
  answer: string;
}

export type StatementLogicRound =
  | ClassifyStatementRound
  | TruthStatementRound
  | NegateStatementRound
  | ImplicationStatementRound;

export function answerOptions(round: StatementLogicRound): StatementChoice[] {
  if (round.kind === 'classify') {
    return [
      { value: 'proposition', label: 'A statement with a truth value' },
      { value: 'open-sentence', label: 'It depends on an unknown' },
      { value: 'non-statement', label: 'A question or command' },
    ];
  }
  if (round.kind === 'truth') {
    return [
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' },
    ];
  }
  if (round.kind === 'negate') return round.choices;
  return round.worlds.map((world) => ({ value: world.id, label: world.label }));
}

export function expectedAnswer(round: StatementLogicRound): string {
  if (round.kind === 'truth') return String(round.answer);
  return round.answer;
}

export function validateStatementRounds(rounds: readonly StatementLogicRound[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const round of rounds) {
    if (ids.has(round.id)) errors.push(`Duplicate round id: ${round.id}`);
    ids.add(round.id);
    const choices = answerOptions(round);
    if (choices.length < 2 || choices.length > 4) errors.push(`${round.id} must offer 2 to 4 choices`);
    if (!choices.some((choice) => choice.value === expectedAnswer(round))) {
      errors.push(`${round.id} has an answer that is not one of its choices`);
    }
    if (new Set(choices.map((choice) => choice.value)).size !== choices.length) {
      errors.push(`${round.id} contains duplicate choice ids`);
    }
    if (round.kind === 'implication') {
      const counterexamples = round.worlds.filter((world) => world.premiseTrue && !world.conclusionTrue);
      if (counterexamples.length !== 1 || counterexamples[0]?.id !== round.answer) {
        errors.push(`${round.id} must contain exactly one authored counterexample`);
      }
    }
  }
  return errors;
}
