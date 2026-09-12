'use client';

import { Button } from '@/components/ui/button';
import { Clock3, RotateCcw } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Activity } from '../kit/activity.js';
import {
  createSequentialState,
  observeSequential,
  readUnsigned,
  stepSequential,
  type SequentialLogicDoc,
  type SequentialState,
} from './sequential.js';
import { SEQUENTIAL_PRESETS, sequentialPreset, type SequentialPresetKey } from './sequential-presets.js';

export interface SequentialLogicLabProps {
  doc?: SequentialLogicDoc;
  preset?: SequentialPresetKey;
  title?: string;
  description?: string;
  clock?: string;
  historyLength?: number;
}

interface TraceSample {
  tick: number;
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
}

export function SequentialLogicLab({
  doc: authoredDoc,
  preset = 'd-flip-flop',
  title,
  description,
  clock,
  historyLength = 10,
}: SequentialLogicLabProps = {}): ReactNode {
  const selected = useMemo(() => sequentialPreset(preset), [preset]);
  const doc = authoredDoc ?? selected.doc;
  const clockId = clock ?? selected.clock;
  const initialInputs = () => Object.fromEntries(doc.inputs.map((item) => [item.id, item.value ?? false]));
  const [inputs, setInputs] = useState<Record<string, boolean>>(initialInputs);
  const [state, setState] = useState<SequentialState>(() => createSequentialState(doc));
  const [history, setHistory] = useState<TraceSample[]>([]);
  const solution = observeSequential(doc, state, inputs);

  const record = (next: SequentialState, nextInputs: Record<string, boolean>) => {
    const observed = observeSequential(doc, next, nextInputs);
    setHistory((items) =>
      [...items, { tick: next.tick, inputs: { ...nextInputs }, outputs: { ...observed.outputs } }].slice(
        -historyLength,
      ),
    );
  };

  const applyInputs = (nextInputs: Record<string, boolean>) => {
    const next = stepSequential(doc, state, nextInputs).state;
    setInputs(nextInputs);
    setState(next);
    record(next, nextInputs);
  };

  const toggle = (id: string) => applyInputs({ ...inputs, [id]: !inputs[id] });
  const pulse = () => {
    if (!clockId) return;
    const lowInputs = { ...inputs, [clockId]: false };
    const low = stepSequential(doc, state, lowInputs).state;
    const highInputs = { ...lowInputs, [clockId]: true };
    const high = stepSequential(doc, low, highInputs).state;
    setInputs(highInputs);
    setState(high);
    record(high, highInputs);
  };
  const reset = () => {
    setInputs(initialInputs());
    setState(createSequentialState(doc));
    setHistory([]);
  };

  return (
    <Activity.Root className="sequential-lab">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Sequential logic"
          title={title ?? selected.title}
          description={description ?? selected.description}
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>tick {state.tick}</strong>
        <span>
          {doc.cells.length} state element{doc.cells.length === 1 ? '' : 's'}
        </span>
        <span>{solution.valid ? 'stable' : `${solution.diagnostics.length} issue(s)`}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Sequential circuit state">
          <div className="sequential-signal-flow">
            <section className="sequential-bank" aria-label="Inputs">
              <span className="sequential-bank-label">inputs</span>
              <div className="sequential-bit-row">
                {doc.inputs
                  .filter((item) => item.id !== clockId)
                  .map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      data-active={inputs[item.id] || undefined}
                      onClick={() => toggle(item.id)}
                    >
                      {item.label ?? item.id} <strong>{inputs[item.id] ? 1 : 0}</strong>
                    </Button>
                  ))}
              </div>
            </section>
            <span className="sequential-flow-arrow" aria-hidden>
              →
            </span>
            <section className="sequential-bank" aria-label="Memory">
              <span className="sequential-bank-label">stored state</span>
              <div className="sequential-cell-list">
                {doc.cells.map((cell) => (
                  <div className="sequential-cell" key={cell.id} data-kind={cell.kind}>
                    <span>{cell.kind.replaceAll('-', ' ')}</span>
                    <strong>
                      {cell.kind === 'fsm'
                        ? state.machines[cell.id]
                        : cell.kind === 'counter'
                          ? `${readUnsigned(state, cell.id)} · ${[...(state.bits[cell.id] ?? [])].reverse().map(Number).join('')}`
                          : [...(state.bits[cell.id] ?? [])].reverse().map(Number).join('')}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
            <span className="sequential-flow-arrow" aria-hidden>
              →
            </span>
            <section className="sequential-bank" aria-label="Outputs">
              <span className="sequential-bank-label">outputs</span>
              <div className="sequential-bit-row">
                {doc.outputs.length ? (
                  doc.outputs.map((output) => (
                    <output
                      key={output.id}
                      className="sequential-output"
                      data-high={solution.outputs[output.id] || undefined}
                    >
                      <span>{output.label ?? output.id}</span>
                      <strong>{solution.outputs[output.id] ? 1 : 0}</strong>
                    </output>
                  ))
                ) : (
                  <output className="sequential-output" data-high>
                    {state.machines[doc.cells[0]?.id ?? ''] ?? '—'}
                  </output>
                )}
              </div>
            </section>
          </div>
          <div className="sequential-trace" aria-label="Recent state trace">
            <span className="sequential-bank-label">recent edges</span>
            {history.length === 0 ? (
              <p>Change an input or pulse the clock to begin the trace.</p>
            ) : (
              <ol>
                {history.map((sample, index) => (
                  <li key={`${sample.tick}-${index}`}>
                    <span>t{sample.tick}</span>
                    <strong>
                      {Object.values(sample.outputs).map(Number).join('') ||
                        state.machines[doc.cells[0]?.id ?? '']}
                    </strong>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Activity.Canvas>
      </Activity.Workspace>
      {solution.diagnostics.length > 0 && (
        <Activity.Feedback>
          {solution.diagnostics.map((item) => (
            <span key={`${item.code}-${item.nodeId}`}>{item.message}</span>
          ))}
        </Activity.Feedback>
      )}
      <Activity.Transport>
        <Button variant="outline" size="icon" onClick={reset} aria-label="Reset simulation">
          <RotateCcw aria-hidden />
        </Button>
        <span className="sequential-transport-state">
          {clockId ? 'Ready for the next clock edge' : 'Inputs update this latch immediately'}
        </span>
        {clockId && (
          <Button onClick={pulse}>
            <Clock3 aria-hidden /> Pulse clock
          </Button>
        )}
      </Activity.Transport>
    </Activity.Root>
  );
}

export { SEQUENTIAL_PRESETS };
