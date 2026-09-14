'use client';
import { useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { AssessedChoiceGroup } from '../../../kit/controls.js';
import { LiveRegion, Readout, Stat, StatList } from '../../../kit/frame.js';
import { activity } from './activity.js';

export default function LinearisationLab({
  title = 'Linearisation Lab',
  prompt = 'Transform first; then compare with Y = mX + c.',
}: {
  title?: string;
  prompt?: string;
}): ReactNode {
  const [power, setPower] = useState<string>();
  const [exponential, setExponential] = useState<string>();
  const powerCorrect = power === 'A3-n2';
  const exponentialCorrect = exponential === 'A5-b2';
  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="linearisation"
      eyebrow="Additional Mathematics 4037"
      title={title}
      description={prompt}
      status={
        <>
          <span>power law: {powerCorrect ? 'recovered' : 'open'}</span>
          <span>exponential: {exponentialCorrect ? 'recovered' : 'open'}</span>
        </>
      }
      controls={({ sequence }) =>
        sequence.current.id === 'recover' ? (
          <AssessedChoiceGroup
            value={power}
            onChange={setPower}
            ariaLabel="Constants for power law"
            options={[
              { value: 'A3-n2', label: 'A = 3, n = 2' },
              { value: 'A2-n3', label: 'A = 2, n = 3' },
              { value: 'A10-n2', label: 'A = 10, n = 2' },
            ].map((option) => ({
              ...option,
              tone: power
                ? option.value === 'A3-n2'
                  ? 'correct'
                  : power === option.value
                    ? 'wrong'
                    : undefined
                : undefined,
            }))}
          />
        ) : sequence.current.id === 'transfer' ? (
          <AssessedChoiceGroup
            value={exponential}
            onChange={setExponential}
            ariaLabel="Constants for exponential law"
            options={[
              { value: 'A5-b2', label: 'A = 5, b = 2' },
              { value: 'A2-b5', label: 'A = 2, b = 5' },
              { value: 'A5-b0693', label: 'A = 5, b = 0.693' },
            ].map((option) => ({
              ...option,
              tone: exponential
                ? option.value === 'A5-b2'
                  ? 'correct'
                  : exponential === option.value
                    ? 'wrong'
                    : undefined
                : undefined,
            }))}
          />
        ) : null
      }
      evidence={
        <>
          <Readout value="log y = 2 log x + log 3" sub="power-law straight line" />
          <StatList>
            <Stat label="gradient" value="n = 2" />
            <Stat label="intercept" value="log A = log 3" />
            <Stat label="transfer line" value="ln y = x ln 2 + ln 5" />
          </StatList>
        </>
      }
      observation="Always define the transformed X and Y. Then compare coefficients with Y = mX + c."
      transcript={
        <LiveRegion>{`Power law ${powerCorrect ? 'correctly recovered' : 'not yet recovered'}. Exponential law ${exponentialCorrect ? 'correctly recovered' : 'not yet recovered'}.`}</LiveRegion>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="constants"
            met={powerCorrect}
            complete={complete}
            outcome="A=3,n=2"
          />
          <AuthoredMetricGate
            conditionId="transfer"
            met={exponentialCorrect}
            complete={complete}
            outcome="A=5,b=2"
          />
          <StatList>
            <Stat label="original power law" value="y = 3x^2" />
            <Stat label="original exponential law" value="y = 5(2^x)" />
          </StatList>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
