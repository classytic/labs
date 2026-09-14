'use client';

import { useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { ActivitySelect, AssessedChoiceGroup, CheckButton } from '../../../kit/controls.js';
import { Field, LiveRegion, Readout, Stat, StatList } from '../../../kit/frame.js';
import { activity } from './activity.js';

type SampleKey = 'copper-ii' | 'ammonium' | 'chloride' | 'carbon-dioxide';
type TestKey = 'sodium-hydroxide' | 'acidified-silver-nitrate' | 'limewater' | 'litmus';
interface Sample {
  label: string;
  correctTest: TestKey;
  observation: string;
  identity: string;
  choices: string[];
}
const SAMPLES: Record<SampleKey, Sample> = {
  'copper-ii': {
    label: 'Sample A: blue solution',
    correctTest: 'sodium-hydroxide',
    observation: 'A light blue precipitate forms and remains insoluble in excess.',
    identity: 'copper(II)',
    choices: ['copper(II)', 'iron(II)', 'ammonium'],
  },
  ammonium: {
    label: 'Sample B: colourless solution',
    correctTest: 'sodium-hydroxide',
    observation: 'On warming, a pungent gas is released and turns damp red litmus blue.',
    identity: 'ammonium',
    choices: ['ammonium', 'chloride', 'nitrate'],
  },
  chloride: {
    label: 'Sample C: colourless solution',
    correctTest: 'acidified-silver-nitrate',
    observation: 'A white precipitate forms.',
    identity: 'chloride',
    choices: ['chloride', 'bromide', 'iodide'],
  },
  'carbon-dioxide': {
    label: 'Sample D: colourless gas',
    correctTest: 'limewater',
    observation: 'The limewater turns milky.',
    identity: 'carbon dioxide',
    choices: ['carbon dioxide', 'ammonia', 'hydrogen'],
  },
};
const TESTS = [
  { value: 'sodium-hydroxide', label: 'add aqueous sodium hydroxide; warm if needed' },
  { value: 'acidified-silver-nitrate', label: 'acidify, then add aqueous silver nitrate' },
  { value: 'limewater', label: 'bubble through limewater' },
  { value: 'litmus', label: 'test with damp litmus paper' },
] as const;

interface QualitativeAnalysisProps {
  title?: string;
  prompt?: string;
  sample?: SampleKey;
}
export default function QualitativeAnalysisBench({
  title = 'Qualitative Analysis Bench',
  prompt = 'Choose a test, record the visible evidence, then identify the unknown.',
  sample = 'copper-ii',
}: QualitativeAnalysisProps): ReactNode {
  const specimen = SAMPLES[sample];
  const [test, setTest] = useState<TestKey>('sodium-hydroxide');
  const [ranTest, setRanTest] = useState(false);
  const [identity, setIdentity] = useState<string>();
  const useful = ranTest && test === specimen.correctTest;
  const correct = useful && identity === specimen.identity;
  const observation = !ranTest
    ? 'No test performed.'
    : useful
      ? specimen.observation
      : 'No diagnostic change is observed with this test.';
  const run = (): void => {
    setRanTest(true);
    setIdentity(undefined);
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="chem-qualitative-analysis"
      eyebrow="Chemistry practical analysis"
      title={title}
      description={prompt}
      status={
        <>
          <span>{specimen.label}</span>
          <span>{ranTest ? 'observation recorded' : 'awaiting test'}</span>
        </>
      }
      controls={({ sequence }) =>
        sequence.current.id === 'choose' ? (
          <>
            <Field label="Test">
              <ActivitySelect
                value={test}
                onChange={(next) => {
                  setTest(next);
                  setRanTest(false);
                  setIdentity(undefined);
                }}
                options={TESTS}
                ariaLabel="Select qualitative analysis test"
              />
            </Field>
            <Field label="Action">
              <CheckButton onClick={run}>Perform test</CheckButton>
            </Field>
          </>
        ) : sequence.current.id === 'identify' ? (
          <AssessedChoiceGroup
            value={identity}
            onChange={setIdentity}
            ariaLabel="Identity of unknown"
            options={specimen.choices.map((choice) => ({
              value: choice,
              label: choice,
              tone: identity
                ? choice === specimen.identity
                  ? 'correct'
                  : identity === choice
                    ? 'wrong'
                    : undefined
                : undefined,
            }))}
          />
        ) : null
      }
      evidence={
        <>
          <Readout value={useful ? 'diagnostic' : ranTest ? 'no match' : '—'} sub="evidence quality" />
          <StatList>
            <Stat label="reagent or test" value={TESTS.find((item) => item.value === test)?.label ?? test} />
            <Stat label="observation" value={observation} />
          </StatList>
        </>
      }
      observation={
        correct
          ? `${specimen.identity} is supported by the recorded observation.`
          : useful
            ? 'Keep the observation separate from the inference: first state what changed, then name the species.'
            : 'A negative result can eliminate possibilities, but identification needs a diagnostic observation.'
      }
      transcript={
        <LiveRegion>{`${specimen.label}. ${observation}${identity ? ` Proposed identity: ${identity}.` : ''}`}</LiveRegion>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="test-run" met={useful} complete={complete} outcome={observation} />
          <AuthoredMetricGate conditionId="identified" met={correct} complete={complete} outcome={identity} />
          <div className="lab-statlist" aria-label="Observation record">
            <div className="lab-stat">
              <span className="lab-stat-label">Unknown</span>
              <strong className="lab-stat-val">{specimen.label}</strong>
            </div>
            <div className="lab-stat">
              <span className="lab-stat-label">What you see</span>
              <strong className="lab-stat-val">{observation}</strong>
            </div>
          </div>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
