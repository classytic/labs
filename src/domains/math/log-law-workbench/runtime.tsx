'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { ActivitySelect, AssessedChoiceGroup } from '../../../kit/controls.js';
import { Field, LiveRegion, Readout, Stat, StatList } from '../../../kit/frame.js';
import { activity } from './activity.js';

type Law = 'product' | 'quotient' | 'power' | 'change-base';
const LAWS: Record<Law, { expression: string; answer: string; options: string[]; cue: string }> = {
  product: {
    expression: 'log_a(mn)',
    answer: 'log_a(m) + log_a(n)',
    options: ['log_a(m) + log_a(n)', 'log_a(m)log_a(n)', 'log_a(m) - log_a(n)'],
    cue: 'product inside -> sum outside',
  },
  quotient: {
    expression: 'log_a(m/n)',
    answer: 'log_a(m) - log_a(n)',
    options: ['log_a(m) + log_a(n)', 'log_a(m) - log_a(n)', 'log_a(m)/log_a(n)'],
    cue: 'quotient inside -> difference outside',
  },
  power: {
    expression: 'log_a(m^k)',
    answer: 'k log_a(m)',
    options: ['k log_a(m)', 'log_a(km)', 'log_a(m)/k'],
    cue: 'power inside -> coefficient outside',
  },
  'change-base': {
    expression: 'log_a(m)',
    answer: 'log_b(m)/log_b(a)',
    options: ['log_b(m)/log_b(a)', 'log_b(a)/log_b(m)', 'log_b(am)'],
    cue: 'new log of argument divided by new log of base',
  },
};
const LAW_OPTIONS = [
  { value: 'product', label: 'product' },
  { value: 'quotient', label: 'quotient' },
  { value: 'power', label: 'power' },
  { value: 'change-base', label: 'change base' },
] as const;

export default function LogLawWorkbench({
  title = 'Log Law Workbench',
  prompt = 'Read the structure first. Then choose the reversible law.',
}: {
  title?: string;
  prompt?: string;
}): ReactNode {
  const [law, setLaw] = useState<Law>('product');
  const [answers, setAnswers] = useState<Partial<Record<Law, string>>>({});
  const card = LAWS[law];
  const correctCount = useMemo(
    () => (Object.keys(LAWS) as Law[]).filter((key) => answers[key] === LAWS[key].answer).length,
    [answers],
  );
  const selected = answers[law];
  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="log-law-workbench"
      eyebrow="Additional Mathematics 4037"
      title={title}
      description={prompt}
      status={
        <>
          <span>{correctCount}/4 laws checked</span>
          <span>{law}</span>
        </>
      }
      controls={({ sequence }) =>
        sequence.current.id === 'build' ? (
          <>
            <Field label="Law">
              <ActivitySelect
                value={law}
                onChange={setLaw}
                options={LAW_OPTIONS}
                ariaLabel="Select logarithm law"
              />
            </Field>
            <AssessedChoiceGroup
              value={selected}
              onChange={(value) => setAnswers((current) => ({ ...current, [law]: value }))}
              ariaLabel={`Equivalent form of ${card.expression}`}
              options={card.options.map((option) => ({
                value: option,
                label: option,
                tone: selected
                  ? option === card.answer
                    ? 'correct'
                    : selected === option
                      ? 'wrong'
                      : undefined
                  : undefined,
              }))}
            />
          </>
        ) : null
      }
      evidence={
        <>
          <Readout value={card.expression} sub="expression to transform" />
          <StatList>
            <Stat label="recognition cue" value={card.cue} />
            <Stat label="selected form" value={selected ?? 'choose a form'} />
          </StatList>
        </>
      }
      observation={
        selected === card.answer
          ? 'Correct. Read the same equality from right to left when a question asks you to combine logarithms.'
          : 'Name the operation inside the logarithm before selecting a law.'
      }
      transcript={
        <LiveRegion>{`${correctCount} of four laws correct. Current expression ${card.expression}. ${selected ? `Selected ${selected}.` : 'No equivalent selected.'}`}</LiveRegion>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="laws-tested"
            met={correctCount === 4}
            complete={complete}
            outcome="four laws correct"
          />
          <StatList>
            <Stat label="base conditions" value="a > 0 and a != 1" />
            <Stat label="argument condition" value="m > 0" />
          </StatList>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
