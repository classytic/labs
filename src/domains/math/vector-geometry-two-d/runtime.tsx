'use client';
import { useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { AssessedChoiceGroup } from '../../../kit/controls.js';
import { LiveRegion, Readout, Stat, StatList } from '../../../kit/frame.js';
import { activity } from './activity.js';
export default function VectorGeometry2D({
  title = 'Vector Geometry 2D',
  prompt = 'Follow directed routes. Do not compare coordinates separately.',
}: {
  title?: string;
  prompt?: string;
}): ReactNode {
  const [displacement, setDisplacement] = useState<string>();
  const [unit, setUnit] = useState<string>();
  const vectorCorrect = displacement === '6,3';
  const unitCorrect = unit === '0.6,0.8';
  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="vector-geometry-two-d"
      eyebrow="Mathematics vectors"
      title={title}
      description={prompt}
      status={
        <>
          <span>A(2,1) to B(8,4)</span>
          <span>{vectorCorrect ? 'route proved' : 'route open'}</span>
        </>
      }
      controls={({ sequence }) =>
        sequence.current.id === 'construct' ? (
          <AssessedChoiceGroup
            value={displacement}
            onChange={setDisplacement}
            ariaLabel="Vector AB"
            options={[
              { value: '6,3', label: 'AB = (6,3) = 3(2,1)' },
              { value: '10,5', label: 'AB = (10,5)' },
              { value: '-6,-3', label: 'AB = (-6,-3)' },
            ].map((option) => ({
              ...option,
              tone: displacement
                ? option.value === '6,3'
                  ? 'correct'
                  : displacement === option.value
                    ? 'wrong'
                    : undefined
                : undefined,
            }))}
          />
        ) : sequence.current.id === 'transfer' ? (
          <AssessedChoiceGroup
            value={unit}
            onChange={setUnit}
            ariaLabel="Unit vector in direction 6 8"
            options={[
              { value: '0.6,0.8', label: '(0.6, 0.8)' },
              { value: '3,4', label: '(3, 4)' },
              { value: '6,8', label: '(6, 8)' },
            ].map((option) => ({
              ...option,
              tone: unit
                ? option.value === '0.6,0.8'
                  ? 'correct'
                  : unit === option.value
                    ? 'wrong'
                    : undefined
                : undefined,
            }))}
          />
        ) : null
      }
      evidence={
        <>
          <Readout value="AB = OB - OA" sub="destination minus start" />
          <StatList>
            <Stat label="AB" value="(8,4) - (2,1) = (6,3)" />
            <Stat label="scalar relation" value="AB = 3 OA" />
            <Stat label="|(6,8)|" value="10" />
          </StatList>
        </>
      }
      observation={
        vectorCorrect
          ? 'AB is a positive scalar multiple of OA. Since both routes meet at A, O, A and B are collinear.'
          : 'Subtract the start position vector from the destination position vector.'
      }
      transcript={
        <LiveRegion>{`Vector AB is 6,3. Its scalar relation is three times OA. Unit-vector choice ${unitCorrect ? 'correct' : 'not yet correct'}.`}</LiveRegion>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="vector-found"
            met={vectorCorrect}
            complete={complete}
            outcome="AB=(6,3)=3OA"
          />
          <AuthoredMetricGate
            conditionId="unit-vector"
            met={unitCorrect}
            complete={complete}
            outcome="(0.6,0.8)"
          />
          <StatList>
            <Stat label="unit-vector rule" value="v / |v|" />
            <Stat label="velocity composition" value="ground velocity = vehicle + medium" />
          </StatList>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
