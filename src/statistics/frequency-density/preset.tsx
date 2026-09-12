'use client';

/**
 * FrequencyDensity, the histogram whose bar heights are not the frequencies.
 *
 * The one thing a learner has to see here is the SAME data drawn twice: once with height set to the
 * frequency, which is what everybody does first, and once with height set to frequency density,
 * which is what a histogram actually is. Told as a rule it sounds arbitrary. Drawn as a toggle it
 * is obvious, because a wide class visibly deflates the moment its count is spread over its width.
 *
 * Our lessons taught this topic with a bar borrowed from a linear-model lab, so the unequal-width
 * histogram, the entire subject, was never drawn. The prose asserted which bar was shorter and the
 * learner had nothing to look at.
 *
 * Each bar carries its frequency as a label INSIDE it, because in the correct rendering the
 * frequency is the bar's area, and putting the number in the area is the shortest possible way to
 * say so. See ./core.ts for why the wrong rendering is computed on purpose.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Axes, Polygon, Label, type Vec2 } from '@classytic/stage';
import { Segmented } from '../../kit/controls.js';
import { LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity } from '../../kit/activity.js';
import { bars, densityProblems, modalClass, tallest, totalFrequency, type Klass } from './core.js';

export interface FrequencyDensityProps {
  classes?: Klass[];
  /** What one value is, e.g. "day". */
  unit?: string;
  /** What the horizontal axis measures, e.g. "rainfall in mm". */
  measure?: string;
  /**
   * Which picture to open on. Defaults to the WRONG one, because the lab exists to displace that
   * belief and starting on the correct picture never surfaces it. A revision lesson that has
   * already made the point can open on 'density'.
   */
  startMode?: 'density' | 'frequency';
  title?: string;
  prompt?: string;
  activity?: string;
}

/** Rainfall over thirty days, the classes our A Level lesson already uses. */
const DEFAULT_CLASSES: Klass[] = [
  { from: 0, to: 5, frequency: 10 },
  { from: 5, to: 10, frequency: 6 },
  { from: 10, to: 20, frequency: 8 },
  { from: 20, to: 50, frequency: 6 },
];

type Mode = 'density' | 'frequency';

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(n < 1 ? 2 : 1));

export function FrequencyDensity({
  classes = DEFAULT_CLASSES,
  unit = 'day',
  measure = 'rainfall in mm',
  startMode = 'frequency',
  title = 'On a histogram the frequency is the area, not the height',
  prompt = 'Every bar below holds the number of values printed inside it. Switch the height between the frequency and the frequency density, and watch which bars change shape.',
  activity = 'frequency-density',
}: FrequencyDensityProps = {}): ReactNode {
  const [mode, setMode] = useState<Mode>(startMode);
  const [seen, setSeen] = useState<Set<Mode>>(new Set([startMode]));

  const problems = densityProblems(classes);
  const drawn = bars(classes, mode);
  const total = totalFrequency(classes);
  const modal = modalClass(classes);
  const ranking = tallest(classes);

  // Solved once both renderings have been looked at, because the comparison IS the lesson. Reaching
  // only the correct one teaches the rule without ever exposing the belief it has to displace.
  const choose = (next: Mode): void => {
    setMode(next);
    setSeen((s) => new Set(s).add(next));
  };
  useCheckpoint({ solved: seen.size === 2, activity });

  const left = classes[0]?.from ?? 0;
  const right = classes.at(-1)?.to ?? 1;
  const tallestHeight = Math.max(...drawn.map((b) => b.height), 1);
  const view = {
    xMin: left - (right - left) * 0.06,
    xMax: right + (right - left) * 0.06,
    yMin: -tallestHeight * 0.18,
    yMax: tallestHeight * 1.16,
  };

  const rect = (x0: number, x1: number, h: number): Vec2[] => [
    { x: x0, y: 0 },
    { x: x1, y: 0 },
    { x: x1, y: h },
    { x: x0, y: h },
  ];

  const figure = (
    <Stage
      view={view}
      height={320}
      preserveAspect={false}
      ariaLabel={`Histogram of ${measure}, height showing ${mode === 'density' ? 'frequency density' : 'frequency'}`}
    >
      {/* The vertical axis carries a different quantity in each mode, which is the entire point, so
          it is re-scaled rather than held fixed: a shared scale would flatten the density picture
          into an unreadable strip. */}
      <Axes labels ticks stepX={Math.max(5, Math.round((right - left) / 8))} stepY={tallestHeight / 4} />
      {drawn.map((bar, i) => (
        <Polygon
          key={i}
          points={rect(bar.from, bar.to, bar.height)}
          color={i === ranking.byDensity ? 'var(--stage-accent-2)' : 'var(--stage-accent)'}
          fill={i === ranking.byDensity ? 'var(--stage-accent-2)' : 'var(--stage-accent)'}
          fillOpacity={0.22}
          weight={2}
        />
      ))}
      {drawn.map((bar, i) => (
        <Label
          key={`f${i}`}
          x={(bar.from + bar.to) / 2}
          y={bar.height / 2}
          text={`${bar.frequency}`}
          color="var(--stage-fg)"
          size={13}
          weight={700}
        />
      ))}
      {/* The height is only worth printing when it differs from the frequency already inside the
          bar. In the frequency rendering the two are the same number, and printing both put the
          identical value twice on every bar. */}
      {mode === 'density'
        ? drawn.map((bar, i) => (
            <Label
              key={`h${i}`}
              x={(bar.from + bar.to) / 2}
              y={bar.height}
              text={fmt(bar.height)}
              color="var(--stage-muted)"
              size={11}
              dy={-8}
            />
          ))
        : null}
    </Stage>
  );

  const headline =
    mode === 'density' ? `Area of each bar = its frequency` : `Wide classes are inflated by their width`;

  return (
    <Activity.Root className="statistics-frequency-density">
      <Activity.Header>
        <Activity.Heading eyebrow="Representation of data" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {total} {unit}s
        </strong>
        <span>{classes.length} classes</span>
        <span>widths {classes.map((k) => k.to - k.from).join(', ')}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label={`Histogram of ${measure}`}>{figure}</Activity.Canvas>
        <Activity.Dock>
          <Segmented
            value={mode}
            options={[
              { value: 'frequency', label: 'Height = frequency' },
              { value: 'density', label: 'Height = frequency ÷ width' },
            ]}
            onChange={(v) => choose(v as Mode)}
            ariaLabel="what the bar height shows"
          />
        </Activity.Dock>
        <Readout
          value={headline}
          sub={
            mode === 'density'
              ? `The number inside each bar is its area. Modal class ${modal ? `${modal.from} to ${modal.to}` : '-'}.`
              : `The ${classes.at(-1)!.from} to ${classes.at(-1)!.to} class is ${classes.at(-1)!.to - classes.at(-1)!.from} units wide, so this picture gives it far too much area.`
          }
        />
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Why the area</span>
        <div>
          A bar covers a range of values, so the values it holds are spread across its whole width. Height
          times width has to come back to the count, which forces height to be frequency divided by width. The
          modal class is the one with the greatest density, not the greatest count.
          {problems.length ? ` Authoring note: ${problems.join('; ')}.` : ''}
        </div>
      </Activity.Feedback>
      <LiveRegion>
        {`Height now shows ${mode === 'density' ? 'frequency density' : 'frequency'}. Bar heights: ${drawn
          .map((b) => `${b.from} to ${b.to}, ${fmt(b.height)}`)
          .join('; ')}.`}
      </LiveRegion>
    </Activity.Root>
  );
}
