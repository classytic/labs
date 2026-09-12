import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLearningSequence, type LearningSequenceStep } from '../dist/kit/index.mjs';

const STEPS: LearningSequenceStep[] = [
  {
    id: 'predict',
    phase: 'predict',
    reveal: ['question'],
    gate: { kind: 'answer', id: 'forecast' },
    next: { byOutcome: { high: 'act', low: 'explain' } },
  },
  {
    id: 'act',
    phase: 'act',
    reveal: ['model'],
    controls: true,
    gate: { kind: 'action', id: 'changed-model' },
  },
  { id: 'explain', phase: 'explain', reveal: ['evidence'] },
];

describe('useLearningSequence', () => {
  it('resumes from an authored step and reports navigation changes', () => {
    const onStepChange = vi.fn();
    const { result } = renderHook(() => useLearningSequence(STEPS, { initialStepId: 'act', onStepChange }));
    expect(result.current.current.id).toBe('act');
    expect(onStepChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'act' }), 1);
    act(() => result.current.complete('changed-model'));
    act(() => result.current.next());
    expect(result.current.current.id).toBe('explain');
    expect(onStepChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'explain' }), 2);
  });
  it('gates progression, branches by outcome, and accumulates reveal layers', () => {
    const { result } = renderHook(() => useLearningSequence(STEPS));
    expect(result.current.canAdvance).toBe(false);
    act(() => result.current.next());
    expect(result.current.current.id).toBe('predict');
    act(() => result.current.complete('forecast', 'high'));
    act(() => result.current.next());
    expect(result.current.current.id).toBe('act');
    expect(result.current.shows('question')).toBe(true);
    expect(result.current.shows('model')).toBe(true);
    expect(result.current.showControls).toBe(true);
  });

  it('supports authored alternate branches and back navigation', () => {
    const { result } = renderHook(() => useLearningSequence(STEPS));
    act(() => result.current.complete('forecast', 'low'));
    act(() => result.current.next());
    expect(result.current.current.id).toBe('explain');
    act(() => result.current.back());
    expect(result.current.current.id).toBe('predict');
  });

  it('fully resets progress, outcomes, reveals, and controls', () => {
    const { result } = renderHook(() => useLearningSequence(STEPS));
    act(() => result.current.complete('forecast', 'high'));
    act(() => result.current.next());
    act(() => result.current.complete('changed-model'));
    expect(result.current.showControls).toBe(true);
    expect(result.current.shows('model')).toBe(true);
    act(() => result.current.reset());
    expect(result.current.current.id).toBe('predict');
    expect(result.current.history).toEqual(['predict']);
    expect(result.current.canAdvance).toBe(false);
    expect(result.current.showControls).toBe(false);
    expect(result.current.shows('model')).toBe(false);
  });
});
