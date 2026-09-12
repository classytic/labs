'use client';

/** Logic-circuit runtime — adapter: convert the authored netlist to a LogicDoc and render it
 *  through the shared digital-logic engine's LogicGateLab (toggle inputs, live wires, optional
 *  goal). No private evaluator/layout: one engine (src/logic) owns evaluation + rendering. */
import type { ReactNode } from 'react';
import { LogicGateLab } from '../../../logic/lab.js';
import { netlistToDoc, type BooleanNetlist } from '../../../logic/netlist.js';

export default function LogicCircuit(a: Record<string, unknown>): ReactNode {
  const doc = netlistToDoc({
    inputs: a.inputs,
    gates: a.gates,
    outputs: a.outputs,
    initial: a.initial,
  } as BooleanNetlist);
  return (
    <LogicGateLab
      doc={doc}
      mode="explore"
      showTable={false}
      title={(a.title as string) ?? 'Logic circuit'}
      prompt={a.prompt as string | undefined}
      activity="logic-circuit"
    />
  );
}
