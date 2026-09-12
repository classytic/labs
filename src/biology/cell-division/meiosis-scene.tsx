import type { ReactNode } from 'react';
import type { MeiosisSceneProps } from './meiosis-preset.js';

function Chromosome({
  x,
  y,
  tone,
  recombinant = false,
  separated = false,
}: {
  x: number;
  y: number;
  tone: 'maternal' | 'paternal';
  recombinant?: boolean;
  separated?: boolean;
}): ReactNode {
  const primary = tone === 'maternal' ? 'var(--stage-primary)' : 'var(--stage-warn)';
  const alternate = tone === 'maternal' ? 'var(--stage-warn)' : 'var(--stage-primary)';
  return (
    <g transform={`translate(${x} ${y})`}>
      {separated ? (
        <path d="M0 -26V26" stroke={primary} strokeWidth="10" strokeLinecap="round" />
      ) : (
        <>
          <path d="M-18 -28L18 28M18 -28L-18 28" stroke={primary} strokeWidth="10" strokeLinecap="round" />
          <circle r="7" fill="var(--stage-bg)" stroke={primary} strokeWidth="4" />
        </>
      )}
      {recombinant && (
        <path
          d={separated ? 'M0 10V26' : 'M7 11L18 28'}
          stroke={alternate}
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function Cell({
  cx,
  cy,
  radius,
  children,
}: {
  cx: number;
  cy: number;
  radius: number;
  children: ReactNode;
}): ReactNode {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="var(--stage-muted)"
        stroke="var(--stage-accent-2)"
        strokeWidth="3"
      />
      <g transform={`translate(${cx} ${cy})`}>{children}</g>
    </g>
  );
}

/** Complete non-WebGL representation: the lesson remains visual when contexts are unavailable. */
export function MeiosisSemanticScene({
  state,
  crossover,
  orientation,
  products,
}: MeiosisSceneProps): ReactNode {
  const maternalLeft = orientation === 'maternal-left';
  const recombinant = crossover && state.checkpoint !== 'pairing';
  let cells: ReactNode;
  if (state.checkpoint === 'products') {
    const positions = [
      [190, 120],
      [430, 120],
      [190, 300],
      [430, 300],
    ] as const;
    cells = positions.map(([cx, cy], index) => (
      <Cell key={index} cx={cx} cy={cy} radius={72}>
        <Chromosome
          x={0}
          y={0}
          tone={index < 2 ? 'maternal' : 'paternal'}
          recombinant={recombinant && index % 2 === 1}
          separated
        />
        <text y="54" textAnchor="middle" className="lab-meiosis-product">
          {products[index]}
        </text>
      </Cell>
    ));
  } else if (state.cellCount === 2) {
    cells = (
      <>
        <Cell cx={190} cy={210} radius={112}>
          <Chromosome x={0} y={0} tone={maternalLeft ? 'maternal' : 'paternal'} recombinant={recombinant} />
        </Cell>
        <Cell cx={430} cy={210} radius={112}>
          <Chromosome x={0} y={0} tone={maternalLeft ? 'paternal' : 'maternal'} recombinant={recombinant} />
        </Cell>
      </>
    );
  } else {
    cells = (
      <Cell cx={310} cy={210} radius={172}>
        {state.checkpoint === 'metaphase-i' && (
          <>
            <circle cx="-132" r="9" fill="var(--stage-accent-2)" />
            <circle cx="132" r="9" fill="var(--stage-accent-2)" />
            <path
              d="M-125 0L-32 0M125 0L32 0"
              stroke="var(--stage-accent-2)"
              strokeWidth="3"
              strokeDasharray="7 6"
            />
          </>
        )}
        <Chromosome x={-28} y={0} tone={maternalLeft ? 'maternal' : 'paternal'} recombinant={recombinant} />
        <Chromosome x={28} y={0} tone={maternalLeft ? 'paternal' : 'maternal'} recombinant={recombinant} />
        {state.checkpoint === 'crossing-over' && (
          <circle r="13" fill="var(--stage-bg)" stroke="var(--stage-warn)" strokeWidth="4" />
        )}
      </Cell>
    );
  }
  return (
    <figure className="lab-meiosis-scene" role="img" aria-label={`${state.title}. ${state.summary}`}>
      <svg viewBox="0 0 620 420" aria-hidden="true">
        {cells}
      </svg>
      <figcaption>
        <strong>{state.title}</strong>
        <span>{state.summary}</span>
      </figcaption>
    </figure>
  );
}
