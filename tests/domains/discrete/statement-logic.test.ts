import { describe, expect, it } from 'vitest';
import {
  answerOptions,
  expectedAnswer,
  validateStatementRounds,
  type StatementLogicRound,
} from '../../../src/discrete/statement-logic/core.js';

describe('statement logic authoring model', () => {
  it('maps authored truth answers to stable choice values', () => {
    const round: StatementLogicRound = {
      id: 'truth',
      kind: 'truth',
      statement: 'Two is even.',
      answer: true,
      explanation: 'It is divisible by two.',
    };
    expect(expectedAnswer(round)).toBe('true');
    expect(answerOptions(round).map((choice) => choice.value)).toEqual(['true', 'false']);
  });

  it('rejects implication decks without one exact counterexample', () => {
    const round: StatementLogicRound = {
      id: 'implication',
      kind: 'implication',
      statement: 'A card is blue.',
      conclusion: 'It has a star.',
      explanation: 'A counterexample keeps the premise and breaks the conclusion.',
      worlds: [
        { id: 'a', label: 'Blue circle', premiseTrue: true, conclusionTrue: false },
        { id: 'b', label: 'Blue square', premiseTrue: true, conclusionTrue: false },
      ],
      answer: 'a',
    };
    expect(validateStatementRounds([round])[0]).toContain('exactly one authored counterexample');
  });

  it('accepts translated authored copy because logic depends only on stable ids', () => {
    const round: StatementLogicRound = {
      id: 'bn-truth',
      kind: 'truth',
      context: 'বাক্সে পাঁচটি বল আছে।',
      statement: 'তিনটি বল নীল।',
      answer: false,
      explanation: 'প্রসঙ্গটি দাবিটিকে সমর্থন করে না।',
    };
    expect(validateStatementRounds([round])).toEqual([]);
  });
});
