'use client';
import { useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { AssessedChoiceGroup, Chip } from '../../../kit/controls.js';
import { LiveRegion, Readout, Stat, StatList } from '../../../kit/frame.js';
import { activity } from './activity.js';
const ROOTS = [-1, 0, 1, 4] as const;
export default function ModulusCases({
  title = 'Modulus Cases',
  prompt = 'Treat modulus as distance, then let the graph confirm the cases.',
}: {
  title?: string;
  prompt?: string;
}): ReactNode {
  const [roots, setRoots] = useState<number[]>([]);
  const [interval, setInterval] = useState<string>();
  const rootCorrect = roots.length === 2 && roots.includes(-1) && roots.includes(4);
  const intervalCorrect = interval === '-1<x<4';
  const toggle = (root: number): void =>
    setRoots((current) =>
      current.includes(root) ? current.filter((value) => value !== root) : [...current, root],
    );
  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="modulus-cases"
      eyebrow="Additional Mathematics 4037"
      title={title}
      description={prompt}
      status={
        <>
          <span>|2x - 3| = 5</span>
          <span>{roots.length} roots selected</span>
        </>
      }
      controls={({ sequence }) =>
        sequence.current.id === 'solve' ? (
          <div className="lab-statlist" role="group" aria-label="Select both roots">
            {ROOTS.map((root) => (
              <Chip key={root} selected={roots.includes(root)} onClick={() => toggle(root)}>
                {root}
              </Chip>
            ))}
          </div>
        ) : sequence.current.id === 'transfer' ? (
          <AssessedChoiceGroup
            value={interval}
            onChange={setInterval}
            ariaLabel="Solution interval"
            options={[
              { value: '-1<x<4', label: '-1 < x < 4' },
              { value: 'x<-1-or-x>4', label: 'x < -1 or x > 4' },
              { value: '-4<x<1', label: '-4 < x < 1' },
            ].map((option) => ({
              ...option,
              tone: interval
                ? option.value === '-1<x<4'
                  ? 'correct'
                  : interval === option.value
                    ? 'wrong'
                    : undefined
                : undefined,
            }))}
          />
        ) : null
      }
      evidence={
        <>
          <Readout value="2x - 3 = 5 or -5" sub="two signed cases" />
          <StatList>
            <Stat label="right intersection" value="x = 4" />
            <Stat label="left intersection" value="x = -1" />
            <Stat label="inside the V" value="|2x - 3| < 5" />
          </StatList>
        </>
      }
      observation={
        rootCorrect
          ? 'Both selected values give a distance of five. The strict inequality keeps the x-values between them.'
          : 'A modulus equation can have two roots because equal distances can lie on opposite sides of zero.'
      }
      transcript={
        <LiveRegion>{`Selected roots ${roots.length ? roots.join(' and ') : 'none'}. Correct boundaries are negative one and four. Interval choice ${intervalCorrect ? 'correct' : 'not yet correct'}.`}</LiveRegion>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="roots" met={rootCorrect} complete={complete} outcome="x=-1,4" />
          <AuthoredMetricGate
            conditionId="interval"
            met={intervalCorrect}
            complete={complete}
            outcome="-1<x<4"
          />
          <StatList>
            <Stat label="root check" value="|-5| = |5| = 5" />
            <Stat label="boundary rule" value="solve equality before choosing intervals" />
          </StatList>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
