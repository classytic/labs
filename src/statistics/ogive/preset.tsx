'use client';

/**
 * OgiveLab, the S-curve you read quartiles off.
 *
 * The point of a cumulative frequency curve is that it turns "find the median of grouped data"
 * from an arithmetic recipe into a MEASUREMENT: go across at half the total, drop down, read the
 * axis. So the interaction is that movement and nothing else. Drag the horizontal line, watch it
 * meet the curve, watch the vertical drop to a value. The quartile buttons move the same line to
 * n/4, n/2 and 3n/4, so a learner sees that the three readings are one action performed at three
 * heights, not three separate rules to memorise.
 *
 * The interquartile range is drawn as the band between the two outer drops, because IQR is a WIDTH
 * on the value axis, and every learner who has only ever seen "Q3 minus Q1" pictures it as
 * subtraction rather than as the middle half of the data standing in front of them.
 *
 * See ./core.ts for why the plot goes at the upper class boundary and why the readings use n/2.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Polyline, Segment, Dot, Label, type Vec2 } from '@classytic/stage';
import { Slider, Chip } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity } from '../../kit/activity.js';
import { cumulativePoints, quartiles, readAt, totalFrequency, type Bin } from './core.js';

export interface OgiveProps {
  bins?: Bin[];
  title?: string;
  prompt?: string;
  /** Label for the measured quantity, shown on the value axis. */
  unit?: string;
  activity?: string;
}

/** Marks in a test, the shape almost every exam question on this topic uses. */
const DEFAULT_BINS: Bin[] = [
  { from: 0, to: 10, frequency: 4 },
  { from: 10, to: 20, frequency: 10 },
  { from: 20, to: 30, frequency: 14 },
  { from: 30, to: 40, frequency: 8 },
  { from: 40, to: 50, frequency: 4 },
];

export function OgiveLab({
  bins = DEFAULT_BINS,
  title = 'The S-curve: read the median off the picture',
  prompt = 'Cumulative frequency climbs steeply where the data is crowded and flattens where it thins out, which is what gives the curve its S. Go across at half the total and drop down: that is the median.',
  unit = 'mark',
  activity = 'ogive',
}: OgiveProps = {}): ReactNode {
  const total = totalFrequency(bins);
  const q = quartiles(bins);
  const points = cumulativePoints(bins);
  const lowest = points[0]?.x ?? 0;
  const highest = points.at(-1)?.x ?? 1;

  const [height, setHeight] = useState(total / 2);
  const [seenAll, setSeenAll] = useState<Set<string>>(new Set());

  const value = readAt(bins, height);
  const near = (target: number): boolean => Math.abs(height - target) < 0.01;

  const jump = (label: string, target: number): void => {
    setHeight(target);
    setSeenAll((s) => new Set(s).add(label));
  };

  // Solved once the learner has taken all three readings, which is the skill: the same movement
  // at three heights, not three formulas.
  useCheckpoint({ solved: seenAll.size >= 3, activity });

  // One tick per class across, and a tick every quarter of the total up, so n/4, n/2 and 3n/4 all
  // land exactly on a gridline the learner can trace.
  const classWidth = bins[0] ? bins[0].to - bins[0].from : (highest - lowest) / 5;
  const tickY = total / 4;
  const pad = (highest - lowest) * 0.08;
  const view = { xMin: lowest - pad, xMax: highest + pad, yMin: -total * 0.2, yMax: total * 1.1 };
  const curve: Vec2[] = points.map((p) => ({ x: p.x, y: p.cumulative }));

  const figure = (
    <Stage
      view={view}
      height={320}
      ariaLabel={`Cumulative frequency curve, reading ${value?.toFixed(1) ?? '?'} at height ${height.toFixed(1)}`}
    >
      <Grid />
      {/* Numbered axes are not decoration here: the entire skill is reading a value OFF the value
          axis, and an unnumbered grid makes that impossible. Tick spacing follows the class width
          so the gridlines land on the class boundaries the curve is plotted at. */}
      <Axes labels ticks stepX={classWidth} stepY={tickY} />

      {/* The middle half of the data, as a width rather than a subtraction. */}
      {q ? (
        <>
          {/* Slightly BELOW the axis, not on it: sitting at y = 0 put the band and its label on
              top of the x-axis tick numbers, and the one thing this band must not do is obscure
              the very axis a learner is reading the quartiles off. */}
          <Polyline
            points={[
              { x: q.q1, y: -total * 0.055 },
              { x: q.q3, y: -total * 0.055 },
            ]}
            color="var(--stage-accent-2)"
            weight={8}
            opacity={0.3}
          />
          <Label
            x={(q.q1 + q.q3) / 2}
            y={-total * 0.055}
            text={`IQR ${q.iqr.toFixed(1)}`}
            color="var(--stage-accent-2)"
            size={11}
            dy={16}
          />
        </>
      ) : null}

      <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
      {points.map((p, i) => (
        <Dot key={i} x={p.x} y={p.cumulative} r={3} color="var(--stage-accent)" />
      ))}

      {/* The reading itself: across, then down. */}
      {value !== null ? (
        <>
          <Segment
            from={{ x: view.xMin, y: height }}
            to={{ x: value, y: height }}
            color="var(--stage-warn)"
            weight={1.6}
            dashed
          />
          <Segment
            from={{ x: value, y: height }}
            to={{ x: value, y: 0 }}
            color="var(--stage-warn)"
            weight={1.6}
            dashed
          />
          <Dot x={value} y={height} r={5} color="var(--stage-warn)" />
          <Label x={value} y={0} text={value.toFixed(1)} color="var(--stage-warn)" size={12} dy={-8} />
        </>
      ) : null}
    </Stage>
  );

  return (
    <Activity.Root className="statistics-ogive" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading eyebrow="Representation of data" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{total} values</strong>
        <span>reading at {height.toFixed(1)}</span>
        <span>
          gives {value?.toFixed(1) ?? '-'} {unit}s
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Cumulative frequency curve">{figure}</Activity.Canvas>
        <Activity.Dock>
          <div className="lab-field-row">
            <Chip selected={q ? near(total / 4) : false} onClick={() => jump('q1', total / 4)}>
              Lower quartile, n/4
            </Chip>
            <Chip selected={q ? near(total / 2) : false} onClick={() => jump('median', total / 2)}>
              Median, n/2
            </Chip>
            <Chip selected={q ? near((3 * total) / 4) : false} onClick={() => jump('q3', (3 * total) / 4)}>
              Upper quartile, 3n/4
            </Chip>
          </div>
          <Field label="cumulative frequency" value={height.toFixed(1)}>
            <Slider
              value={height}
              min={0}
              max={total}
              step={0.5}
              onChange={setHeight}
              ariaLabel="cumulative frequency to read at"
            />
          </Field>
        </Activity.Dock>
        {q ? (
          <Readout
            value={`Q1 ${q.q1.toFixed(1)} · median ${q.median.toFixed(1)} · Q3 ${q.q3.toFixed(1)}`}
            sub={`interquartile range ${q.iqr.toFixed(1)} ${unit}s, the width holding the middle half`}
          />
        ) : null}
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Why n/2 and not (n+1)/2</span>
        <div>
          The curve models grouped data as spread evenly through each class, so the median is the value at
          half the total. The (n+1)/2 rule is for an ordered list of individual values, and using it here is
          the most common lost mark in this topic.
        </div>
      </Activity.Feedback>
      <LiveRegion>
        {`Reading at cumulative frequency ${height.toFixed(1)} of ${total} gives ${value?.toFixed(1) ?? 'no value'}.`}
      </LiveRegion>
    </Activity.Root>
  );
}
