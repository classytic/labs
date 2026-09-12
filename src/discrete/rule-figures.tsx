'use client';

import { RuleFigure } from '../kit/rule.js';

const cap = (value: number, maximum = 10): number => Math.max(0, Math.min(maximum, Math.round(value)));

const dots = (count: number, label: string) =>
  Array.from({ length: cap(count) }, (_, index) => (
    <span key={`${label}-${index}`} aria-hidden>
      {index + 1}
    </span>
  ));

export function ProductGridFigure({ a, b, c = 1 }: { a: number; b: number; c?: number }) {
  const rows = Math.max(1, cap(a, 8));
  const cols = Math.max(1, cap(b, 8));
  const layers = Math.max(1, Math.round(c));
  return (
    <RuleFigure
      ariaLabel={`${a} by ${b} choice grid across ${c} layers`}
      caption={`Every row pairs with every column${
        layers > 1 ? `, repeated across ${layers} third-stage choices` : ''
      }: ${a} × ${b} × ${c} outcomes.`}
    >
      <div className="count-rule-product">
        <span className="count-rule-axis">{a} first choices</span>
        <div
          className="count-rule-grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(1.5rem, 1fr))`,
          }}
        >
          {Array.from({ length: rows * cols }, (_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        {layers > 1 && <span className="count-rule-layers">× {layers} layers</span>}
      </div>
    </RuleFigure>
  );
}

export function SumGroupsFigure({ a, b }: { a: number; b: number }) {
  return (
    <RuleFigure
      ariaLabel={`${a} choices in case A or ${b} choices in case B`}
      caption={`Choose from case A or case B—not both—so the disjoint groups contribute ${a} + ${b}.`}
    >
      <div className="count-rule-sum">
        <section>
          <strong>case A</strong>
          <div>{dots(a, 'a')}</div>
          <small>{a} choices</small>
        </section>
        <span className="count-rule-or">or</span>
        <section>
          <strong>case B</strong>
          <div>{dots(b, 'b')}</div>
          <small>{b} choices</small>
        </section>
      </div>
    </RuleFigure>
  );
}

export function OrderedSlotsFigure({
  n,
  r = n,
  label = 'ordered positions',
}: {
  n: number;
  r?: number;
  label?: string;
}) {
  const slots = cap(r, 8);
  return (
    <RuleFigure
      ariaLabel={`${r} ordered positions filled from ${n} choices`}
      caption={`The pool shrinks after each placement: ${Array.from({ length: slots }, (_, index) =>
        Math.max(0, n - index),
      ).join(' × ')}.`}
    >
      <div className="count-rule-slots">
        <span>{label}</span>
        <div>
          {Array.from({ length: slots }, (_, index) => (
            <span key={index}>
              <small>slot {index + 1}</small>
              <strong>{Math.max(0, n - index)}</strong>
            </span>
          ))}
        </div>
      </div>
    </RuleFigure>
  );
}

export function CombinationSetFigure({ n, r }: { n: number; r: number }) {
  const shown = cap(n, 12);
  const selected = cap(r, shown);
  return (
    <RuleFigure
      ariaLabel={`${r} selected objects from a set of ${n}`}
      caption="The selected members form one set. Reordering the highlighted members does not create another outcome."
    >
      <div className="count-rule-set">
        {Array.from({ length: shown }, (_, index) => (
          <span key={index} data-selected={index < selected || undefined}>
            {String.fromCharCode(65 + index)}
          </span>
        ))}
      </div>
    </RuleFigure>
  );
}

export function RepeatedSlotsFigure({ n, r }: { n: number; r: number }) {
  const slots = cap(r, 8);
  return (
    <RuleFigure
      ariaLabel={`${r} positions each reusing ${n} choices`}
      caption={`Every position reopens the complete set of ${n} options, producing ${n} × … × ${n} = ${
        n ** r
      }.`}
    >
      <div className="count-rule-repeat">
        {Array.from({ length: slots }, (_, index) => (
          <span key={index}>
            <small>position {index + 1}</small>
            <strong>{n} choices</strong>
            <i aria-hidden>↻</i>
          </span>
        ))}
      </div>
    </RuleFigure>
  );
}
