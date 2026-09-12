'use client';

import { AssessedChoiceGroup } from '../kit/controls.js';
import type { ReactNode } from 'react';

export function EvidencePanel({
  title = 'Evidence',
  children,
}: {
  title?: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="commerce-evidence">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

export interface MetricItem {
  label: ReactNode;
  value: ReactNode;
  tone?: 'good' | 'warn' | 'danger';
}
export function MetricList({ items }: { items: MetricItem[] }): ReactNode {
  return (
    <dl className="commerce-metrics">
      {items.map((item, index) => (
        <div key={index}>
          <dt>{item.label}</dt>
          <dd data-tone={item.tone}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface DecisionOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
}
export function DecisionDeck({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: DecisionOption[];
  onChange: (value: string) => void;
}): ReactNode {
  return (
    <AssessedChoiceGroup
      className="commerce-decisions"
      ariaLabel={label}
      value={value}
      onChange={onChange}
      options={options.map((option) => ({
        value: option.value,
        label: (
          <>
            <strong>{option.label}</strong>
            {option.description && <small>{option.description}</small>}
          </>
        ),
      }))}
    />
  );
}

export function ScenarioTimeline({
  events,
  active,
}: {
  events: { id: string; label: ReactNode; detail?: ReactNode }[];
  active?: string;
}): ReactNode {
  return (
    <ol className="commerce-timeline">
      {events.map((event) => (
        <li key={event.id} data-active={event.id === active || undefined}>
          <span aria-hidden="true" />
          <div>
            <strong>{event.label}</strong>
            {event.detail && <small>{event.detail}</small>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LedgerTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: ReactNode[][];
}): ReactNode {
  return (
    <div className="commerce-table-wrap">
      <table className="commerce-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
