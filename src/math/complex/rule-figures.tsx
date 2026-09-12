'use client';

import { Circle, Dot, Label, Polyline, Segment, type Vec2 } from '@classytic/stage';
import { CoordPlane } from '../../kit/coords.js';
import { RuleFigure } from '../../kit/rule.js';
import * as C from './core.js';

const fmt = (value: number, digits = 2): string =>
  (Math.round(value * 10 ** digits) / 10 ** digits).toString().replace(/^-/, '−');

const arc = (theta: number, radius: number): Vec2[] =>
  Array.from({ length: 25 }, (_, index) => {
    const angle = (theta * index) / 24;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });

function VectorPanel({
  radius,
  theta,
  label,
  tone,
  range,
}: {
  radius: number;
  theta: number;
  label: string;
  tone: string;
  range: number;
}) {
  const tip = { x: radius * Math.cos(theta), y: radius * Math.sin(theta) };
  return (
    <CoordPlane
      view={{ xMin: -range, xMax: range, yMin: -range, yMax: range }}
      height={220}
      step={1}
      ariaLabel={label}
    >
      <Circle center={{ x: 0, y: 0 }} r={1} color="var(--stage-muted)" opacity={0.35} fill="none" />
      <Polyline points={arc(theta, Math.min(radius * 0.35, 0.7))} color="var(--stage-muted)" weight={1.5} />
      <Segment from={{ x: 0, y: 0 }} to={tip} color={tone} weight={3} />
      <Dot x={tip.x} y={tip.y} r={6} color={tone} />
      <Label x={tip.x / 2} y={tip.y / 2} text={label} color={tone} size={12} dy={-10} />
    </CoordPlane>
  );
}

export function IPowerCycleFigure({ n }: { n: number }) {
  const active = ((Math.trunc(n) % 4) + 4) % 4;
  const roots = C.rootsOfUnity(4);
  const labels = ['1', 'i', '−1', '−i'];
  return (
    <RuleFigure
      ariaLabel={`Powers of i cycle, i to exponent ${n}`}
      caption={`n mod 4 = ${active}; the pointer lands on ${labels[active]}.`}
    >
      <CoordPlane
        view={{ xMin: -1.45, xMax: 1.45, yMin: -1.45, yMax: 1.45 }}
        height={270}
        step={1}
        ariaLabel="Four-position powers of i cycle"
      >
        <Circle center={{ x: 0, y: 0 }} r={1} color="var(--stage-muted)" opacity={0.45} fill="none" />
        {roots.map((root, index) => (
          <g key={labels[index]}>
            <Segment
              from={{ x: 0, y: 0 }}
              to={{ x: root.re, y: root.im }}
              color={index === active ? 'var(--stage-accent)' : 'var(--stage-grid)'}
              weight={index === active ? 3 : 1.25}
            />
            <Dot
              x={root.re}
              y={root.im}
              r={index === active ? 8 : 5}
              color={index === active ? 'var(--stage-accent)' : 'var(--stage-muted)'}
            />
            <Label
              x={root.re}
              y={root.im}
              text={labels[index]!}
              color={index === active ? 'var(--stage-accent)' : 'var(--stage-fg)'}
              size={14}
              dx={root.re >= 0 ? 13 : -13}
              dy={root.im >= 0 ? -10 : 16}
              anchor={root.re >= 0 ? 'start' : 'end'}
            />
          </g>
        ))}
      </CoordPlane>
    </RuleFigure>
  );
}

export function ModulusTriangleFigure({ a, b }: { a: number; b: number }) {
  const radius = Math.hypot(a, b);
  const range = Math.max(5, Math.abs(a), Math.abs(b)) * 1.18;
  const point = { x: a, y: b };
  return (
    <RuleFigure
      ariaLabel={`Right triangle for ${a} plus ${b} i`}
      caption={`The horizontal and vertical legs are a = ${a} and b = ${b}; the hypotenuse is |z| = ${fmt(
        radius,
      )}.`}
    >
      <CoordPlane
        view={{ xMin: -range, xMax: range, yMin: -range, yMax: range }}
        height={280}
        step={1}
        ariaLabel="Complex modulus as a right triangle"
      >
        <Segment from={{ x: 0, y: 0 }} to={{ x: a, y: 0 }} color="var(--stage-accent)" weight={3} />
        <Segment from={{ x: a, y: 0 }} to={point} color="var(--stage-success)" weight={3} />
        <Segment from={{ x: 0, y: 0 }} to={point} color="var(--stage-fg)" weight={3} />
        <Dot x={a} y={b} r={7} color="var(--stage-fg)" />
        <Label x={a / 2} y={0} text={`a = ${a}`} color="var(--stage-accent)" size={12} dy={14} />
        <Label
          x={a}
          y={b / 2}
          text={`b = ${b}`}
          color="var(--stage-success)"
          size={12}
          dx={b >= 0 ? 9 : -9}
        />
        <Label x={a / 2} y={b / 2} text={`|z| = ${fmt(radius)}`} color="var(--stage-fg)" size={12} dy={-10} />
      </CoordPlane>
    </RuleFigure>
  );
}

export function DeMoivreFigure({ r, thetaDeg, n }: { r: number; thetaDeg: number; n: number }) {
  const theta = (thetaDeg * Math.PI) / 180;
  const poweredRadius = r ** n;
  const poweredTheta = theta * n;
  const range = Math.max(1.6, r, poweredRadius) * 1.18;
  return (
    <RuleFigure
      ariaLabel="Before and after vectors for De Moivre's theorem"
      caption={`Power ${n}: r ${fmt(r)} → ${fmt(poweredRadius)}, while θ ${fmt(
        thetaDeg,
        0,
      )}° → ${fmt(thetaDeg * n, 0)}°.`}
    >
      <div className="complex-rule-pair">
        <VectorPanel radius={r} theta={theta} label={`r∠θ`} tone="var(--stage-accent)" range={range} />
        <VectorPanel
          radius={poweredRadius}
          theta={poweredTheta}
          label={`r${n}∠${n}θ`}
          tone="var(--stage-success)"
          range={range}
        />
      </div>
    </RuleFigure>
  );
}

export function OmegaFigure() {
  const roots = C.rootsOfUnity(3);
  const labels = ['1', 'ω', 'ω²'];
  return (
    <RuleFigure
      ariaLabel="Cube roots of unity: one, omega and omega squared"
      caption="The three roots are 120° apart. Their vectors close into an equilateral triangle, so their sum is zero."
    >
      <CoordPlane
        view={{ xMin: -1.45, xMax: 1.45, yMin: -1.35, yMax: 1.35 }}
        height={280}
        step={1}
        ariaLabel="Omega and the cube roots of unity"
      >
        <Circle center={{ x: 0, y: 0 }} r={1} color="var(--stage-muted)" opacity={0.4} fill="none" />
        <Polyline
          points={[
            ...roots.map((root) => ({ x: root.re, y: root.im })),
            { x: roots[0]!.re, y: roots[0]!.im },
          ]}
          color="var(--stage-accent)"
          weight={2}
        />
        {roots.map((root, index) => (
          <g key={labels[index]}>
            <Segment
              from={{ x: 0, y: 0 }}
              to={{ x: root.re, y: root.im }}
              color="var(--stage-grid)"
              weight={1.25}
            />
            <Dot
              x={root.re}
              y={root.im}
              r={7}
              color={index === 0 ? 'var(--stage-fg)' : 'var(--stage-accent)'}
            />
            <Label
              x={root.re}
              y={root.im}
              text={labels[index]!}
              color="var(--stage-fg)"
              size={14}
              dx={root.re >= 0 ? 13 : -13}
              dy={root.im >= 0 ? -10 : 16}
              anchor={root.re >= 0 ? 'start' : 'end'}
            />
          </g>
        ))}
      </CoordPlane>
    </RuleFigure>
  );
}
