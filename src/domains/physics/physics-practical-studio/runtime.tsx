'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { CheckButton, Chip, Slider } from '../../../kit/controls.js';
import { Field, LiveRegion, Readout, Stat, StatList } from '../../../kit/frame.js';
import { activity } from './activity.js';

interface Reading {
  length: number;
  tenSwings: number;
}
interface PhysicsPracticalStudioProps {
  title?: string;
  prompt?: string;
  gravity?: number;
}

const APPARATUS = ['metre rule', 'stopwatch', 'ammeter'] as const;
const REQUIRED = new Set<string>(['metre rule', 'stopwatch']);

export default function PhysicsPracticalStudio({
  title = 'Physics Practical Studio',
  prompt = 'Plan a pendulum investigation, gather repeated measurements, then evaluate the method.',
  gravity = 9.81,
}: PhysicsPracticalStudioProps): ReactNode {
  const [apparatus, setApparatus] = useState<string[]>([]);
  const [length, setLength] = useState(40);
  const [readings, setReadings] = useState<Reading[]>([]);
  const planReady = [...REQUIRED].every((item) => apparatus.includes(item)) && !apparatus.includes('ammeter');
  const distinctReadings = new Set(readings.map((item) => item.length)).size;
  const tableReady = distinctReadings >= 3;
  const evaluationReady = false;
  const tenSwings = useMemo(
    () => Number((20 * Math.PI * Math.sqrt(length / 100 / Math.max(gravity, 0.1))).toFixed(2)),
    [gravity, length],
  );
  const record = (): void =>
    setReadings((current) =>
      [...current.filter((item) => item.length !== length), { length, tenSwings }].sort(
        (a, b) => a.length - b.length,
      ),
    );
  const toggle = (item: string): void =>
    setApparatus((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );

  const table = (
    <div className="lab-statlist" aria-label="Pendulum results table">
      {readings.length === 0 ? (
        <p>No readings recorded yet.</p>
      ) : (
        readings.map((reading) => (
          <div className="lab-stat" key={reading.length}>
            <span className="lab-stat-label">
              {reading.length} cm · 10 swings {reading.tenSwings.toFixed(2)} s
            </span>
            <strong className="lab-stat-val">
              T²{' '}
              {(reading.tenSwings / 10) ** 2 < 10
                ? ((reading.tenSwings / 10) ** 2).toFixed(2)
                : ((reading.tenSwings / 10) ** 2).toFixed(1)}{' '}
              s²
            </strong>
          </div>
        ))
      )}
    </div>
  );

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="physics-practical-studio"
      eyebrow="Physics practical skills"
      title={title}
      description={prompt}
      status={
        <>
          <span>{distinctReadings} lengths recorded</span>
          <span>timer resolution 0.01 s</span>
        </>
      }
      controls={({ sequence }) =>
        sequence.current.id === 'plan' ? (
          <Field label="Apparatus">
            {APPARATUS.map((item) => (
              <Chip key={item} selected={apparatus.includes(item)} onClick={() => toggle(item)}>
                {item}
              </Chip>
            ))}
          </Field>
        ) : sequence.current.id === 'measure' ? (
          <>
            <Field label="Length" value={`${length} cm`}>
              <Slider
                value={length}
                min={20}
                max={100}
                step={20}
                onChange={setLength}
                ariaLabel="Pendulum length"
              />
            </Field>
            <Field label="Measure">
              <CheckButton onClick={record}>Time 10 swings</CheckButton>
            </Field>
          </>
        ) : null
      }
      evidence={
        <>
          <Readout
            value={readings.length ? `${readings[readings.length - 1]!.tenSwings.toFixed(2)} s` : '—'}
            sub="latest time for 10 swings"
          />
          <StatList>
            <Stat label="independent variable" value="length" />
            <Stat label="dependent variable" value="period" />
            <Stat label="controlled variable" value="release angle" />
          </StatList>
        </>
      }
      observation={
        evaluationReady
          ? 'Timing more oscillations makes the reaction-time uncertainty a smaller fraction of the measured interval.'
          : tableReady
            ? 'As length increases, T² increases approximately in direct proportion, so a T²–length graph should be straight.'
            : 'Repeat timing over several oscillations and vary only pendulum length.'
      }
      transcript={
        <LiveRegion>{`Selected apparatus: ${apparatus.join(', ') || 'none'}. ${distinctReadings} distinct lengths recorded. The current predicted time for ten swings is ${tenSwings.toFixed(2)} seconds.`}</LiveRegion>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="plan-ready" met={planReady} complete={complete} />
          <AuthoredMetricGate
            conditionId="table-ready"
            met={tableReady}
            complete={complete}
            outcome={`${distinctReadings} lengths`}
          />
          {table}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
