import { describe, expect, it } from 'vitest';
import {
  assessLabExperience,
  authoredQuestionSchema,
  defineLab,
  deriveActivityExperience,
  labTag,
} from '../src/authoring/index.js';
import type { AuthoredActivity } from '../src/kit/activity-authoring.js';
import { z } from 'zod';

describe('public community authoring surface', () => {
  const activity: AuthoredActivity = {
    pattern: 'investigation',
    objectives: ['Predict and test the relationship'],
    steps: [
      { id: 'predict', phase: 'predict', title: 'Predict' },
      { id: 'act', phase: 'act', title: 'Test' },
    ],
    questions: [
      {
        id: 'prediction',
        prompt: 'Which changes?',
        choices: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        answer: 'a',
      },
    ],
    success: [{ id: 'answered', source: 'answer', key: 'prediction' }],
  };

  it('derives truthful manifest evidence and identifies drift', () => {
    const accessibility = { keyboard: true, textAlternative: true, reducedMotion: true };
    const experience = deriveActivityExperience(activity, accessibility);
    expect(experience).toEqual({
      objectives: ['Predict and test the relationship'],
      phases: ['predict', 'act'],
      responses: ['choice'],
      accessibility,
    });
    expect(assessLabExperience({ experience }, activity).issues).toEqual([
      'Add the observe phase.',
      'Add the explain phase.',
      'Add the transfer phase.',
    ]);
    expect(
      assessLabExperience(
        {
          experience: {
            ...experience,
            phases: [...experience.phases, 'observe', 'explain', 'transfer'],
            responses: ['reflection'],
          },
        },
        activity,
      ).issues,
    ).toEqual(
      expect.arrayContaining([
        'Manifest phases do not match the authored activity.',
        'Manifest response types do not match the authored activity.',
      ]),
    );
  });

  it('defines a host-neutral manifest without importing a runtime', () => {
    const manifest = defineLab({
      id: 'community-model',
      domain: 'math',
      group: 'Math',
      title: 'Community model',
      description: 'A portable authored lab.',
      schema: z.object({ value: z.number().default(1) }),
      taxonomy: { interaction: 'guided', authorability: 'moderate' },
      experience: {
        objectives: ['Compare two model states'],
        phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
        responses: ['numeric', 'reflection'],
        accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
      },
      loadRuntime: async () => ({ default: () => null }),
    });
    expect(manifest.id).toBe('community-model');
    expect(labTag(manifest.id)).toBe('CommunityModel');
    expect(assessLabExperience(manifest)).toEqual({ ready: true, issues: [] });
  });

  it('exports the richer response schema', () => {
    expect(
      authoredQuestionSchema.safeParse({
        kind: 'numeric',
        id: 'n',
        prompt: 'Value?',
        answer: 4,
        tolerance: 0.01,
      }).success,
    ).toBe(true);
  });

  it('explains why an explorer is not yet showcase-ready', () => {
    expect(
      assessLabExperience({
        experience: {
          objectives: [],
          phases: ['act', 'observe'],
          responses: [],
          accessibility: { keyboard: false, textAlternative: false, reducedMotion: false },
        },
      }),
    ).toEqual({
      ready: false,
      issues: [
        'Add at least one observable learning objective.',
        'Add the predict phase.',
        'Add the explain phase.',
        'Add the transfer phase.',
        'Add at least one learner response type.',
        'Provide a keyboard-complete interaction path.',
        'Provide a text alternative or transcript for the scene.',
        'Provide a reduced-motion behavior.',
      ],
    });
  });
});
