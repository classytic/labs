'use client';

/**
 * Two NOR gates with their outputs crossed back into each other's inputs.
 *
 * The crossing is the whole figure. Everything else on the page is ordinary: two switches, two
 * gates, two lamps. The two diagonal wires in the middle are what make this memory rather than
 * logic, so they are drawn as the most prominent thing on the page and are the only wires that
 * get a name. When the latch is holding, the feedback wire carrying the high level is thickened
 * and labelled, because at that moment it is literally the thing keeping the bit alive.
 *
 * Underneath, the two outputs are drawn against gate delays. That strip is what shows the order a
 * set happens in (Q̅ falls, and only then does Q rise) and what shows the forbidden release as a
 * square wave that never stops. A static truth table can show neither.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha } from '../kit/figure/index.js';
import { GateGlyph, gatePorts } from '../kit/logic-gates/gate.js';
import { Lamp, ToggleSwitch } from '../kit/logic-gates/display.js';
import type { LatchInputs, LatchLevels, LatchSettle } from './latch.js';

const W = 680;
const H = 392;

const GX = 300;
const GS = 76;
// The circuit sits high and the trace low, with a clear band between: the trace used to start
// right under the lower gate and the "set" label, and read as part of the circuit.
const TOP_Y = 34;
const BOTTOM_Y = 150;
const JUNCTION_X = 412;
const LAMP_X = 566;
const SWITCH = { x: 96, w: 46, h: 22 };

const TRACE = { x: 240, right: 620, qY: 302, nqY: 346, amp: 18 };
/**
 * The strip always shows at least this many delays. A settle that took none would otherwise be a
 * single stub column, which reads as "nothing to see" when the point is "and it stays like this".
 * Padding continues what the circuit does next: a flat line after a settle, the same flip after a
 * race. The padding is drawn fainter and left unnumbered, so it never passes for a recorded step.
 */
const MIN_COLUMNS = 8;

const LIVE = 'var(--stage-live)';
const WIRE = 'var(--stage-wire)';
const ink = (high: boolean): string => (high ? LIVE : WIRE);

export interface LatchSceneProps {
  inputs: LatchInputs;
  result: LatchSettle;
  /** Which gate delay is on screen. */
  cursor: number;
  onToggle?: (which: 's' | 'r') => void;
  label: string;
}

export function LatchScene({ inputs, result, cursor, onToggle, label }: LatchSceneProps): ReactNode {
  const shown: LatchLevels = result.steps[Math.min(cursor, result.steps.length - 1)]!;
  const top = gatePorts('NOR', GX, TOP_Y, GS);
  const bottom = gatePorts('NOR', GX, BOTTOM_Y, GS);
  const qY = top.output.y;
  const nqY = bottom.output.y;
  const stubEnd = top.output.x + 0.14 * GS;

  const holding = !inputs.s && !inputs.r && result.stable && cursor >= result.steps.length - 1;

  // A carries Q down into the lower gate; B carries Q̅ up into the upper gate. The diagonals cross.
  const feedbackQ = `M${JUNCTION_X},${qY} V${qY + 30} L${GX - 38},${bottom.inputs[0]!.y - 22} V${bottom.inputs[0]!.y} H${GX}`;
  const feedbackNq = `M${JUNCTION_X},${nqY} V${nqY - 30} L${GX - 54},${top.inputs[1]!.y + 22} V${top.inputs[1]!.y} H${GX}`;

  const switchAt = (which: 's' | 'r', y: number): ReactNode => (
    <g
      role={onToggle ? 'switch' : undefined}
      aria-checked={inputs[which]}
      aria-label={which === 's' ? 'Set input' : 'Reset input'}
      tabIndex={onToggle ? 0 : undefined}
      style={{ cursor: onToggle ? 'pointer' : undefined }}
      onClick={() => onToggle?.(which)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle?.(which);
        }
      }}
    >
      <ToggleSwitch x={SWITCH.x} y={y - SWITCH.h / 2} w={SWITCH.w} h={SWITCH.h} on={inputs[which]} />
      <FigText x={SWITCH.x - 12} y={y + 5} size="label" anchor="end" tone="ink">
        {which.toUpperCase()}
      </FigText>
      <FigText x={SWITCH.x + SWITCH.w / 2} y={y + 28} size="note" anchor="middle" tone="soft">
        {which === 's' ? 'set' : 'reset'}
      </FigText>
    </g>
  );

  // Step waveform for one output: the recorded delays, then a fainter continuation.
  const recorded = result.steps.length;
  const padded = [...result.steps];
  while (padded.length < MIN_COLUMNS) {
    // A race keeps alternating, so continue it from two back; a settle just stays put.
    padded.push(result.oscillating ? padded[padded.length - 2]! : padded[padded.length - 1]!);
  }
  const columns = padded.length;
  const colW = (TRACE.right - TRACE.x) / columns;
  /**
   * Segments coloured by LEVEL, exactly as the wires above are: live where high, wire grey where
   * low. A single-colour trace read a low Q̅ as "on", contradicting the circuit it sits under.
   */
  const trace = (key: string, pick: (levels: LatchLevels) => boolean, baseY: number): ReactNode[] =>
    padded.flatMap((levels, index) => {
      const high = pick(levels);
      const faded = index >= recorded;
      const x0 = TRACE.x + index * colW;
      const dash = faded ? '4 3' : undefined;
      const parts: ReactNode[] = [];
      if (index > 0 && pick(padded[index - 1]!) !== high) {
        parts.push(
          <line
            key={`${key}-v${index}`}
            x1={x0}
            y1={baseY - TRACE.amp}
            x2={x0}
            y2={baseY}
            stroke={alpha(WIRE, faded ? 45 : 100)}
            strokeWidth={STROKE.line}
            strokeDasharray={dash}
          />,
        );
      }
      parts.push(
        <line
          key={`${key}-h${index}`}
          x1={x0}
          y1={high ? baseY - TRACE.amp : baseY}
          x2={x0 + colW}
          y2={high ? baseY - TRACE.amp : baseY}
          stroke={alpha(high ? LIVE : WIRE, faded ? 45 : 100)}
          strokeWidth={high ? STROKE.edge : STROKE.line}
          strokeLinecap="round"
          strokeDasharray={dash}
        />,
      );
      return parts;
    });

  return (
    <Figure viewBox={[W, H]} domain="physics" label={label}>
      {/* ── inputs ──────────────────────────────────────────────────────────── */}
      <line
        x1={SWITCH.x + SWITCH.w}
        y1={top.inputs[0]!.y}
        x2={GX}
        y2={top.inputs[0]!.y}
        stroke={ink(inputs.r)}
        strokeWidth={STROKE.edge}
      />
      <line
        x1={SWITCH.x + SWITCH.w}
        y1={bottom.inputs[1]!.y}
        x2={GX}
        y2={bottom.inputs[1]!.y}
        stroke={ink(inputs.s)}
        strokeWidth={STROKE.edge}
      />
      {switchAt('r', top.inputs[0]!.y)}
      {switchAt('s', bottom.inputs[1]!.y)}

      {/* ── the feedback, drawn under the gates so the crossing reads cleanly ─── */}
      <path
        d={feedbackQ}
        fill="none"
        stroke={ink(shown.q)}
        strokeWidth={holding && shown.q ? STROKE.bold + 1 : STROKE.edge}
        strokeLinejoin="round"
      />
      <path
        d={feedbackNq}
        fill="none"
        stroke={ink(shown.nq)}
        strokeWidth={holding && shown.nq ? STROKE.bold + 1 : STROKE.edge}
        strokeLinejoin="round"
      />
      {/* Inside the right-hand wedge of the X, between the two wires it names. On the crossing it sat
          on both wires; out to the left it floated too far from them to read as their name. */}
      <FigText x={JUNCTION_X - 38} y={(qY + nqY) / 2 + 4} size="note" anchor="middle" tone="soft">
        feedback
      </FigText>

      {/* ── the two gates ───────────────────────────────────────────────────── */}
      <GateGlyph x={GX} y={TOP_Y} size={GS} type="NOR" live={shown.q} />
      <GateGlyph x={GX} y={BOTTOM_Y} size={GS} type="NOR" live={shown.nq} />

      {/* ── outputs ─────────────────────────────────────────────────────────── */}
      <line x1={stubEnd} y1={qY} x2={LAMP_X - 16} y2={qY} stroke={ink(shown.q)} strokeWidth={STROKE.edge} />
      <line
        x1={stubEnd}
        y1={nqY}
        x2={LAMP_X - 16}
        y2={nqY}
        stroke={ink(shown.nq)}
        strokeWidth={STROKE.edge}
      />
      <circle cx={JUNCTION_X} cy={qY} r={4} fill={ink(shown.q)} />
      <circle cx={JUNCTION_X} cy={nqY} r={4} fill={ink(shown.nq)} />
      <Lamp cx={LAMP_X} cy={qY} r={15} on={shown.q} />
      <Lamp cx={LAMP_X} cy={nqY} r={15} on={shown.nq} />
      <FigText x={LAMP_X + 26} y={qY + 5} size="label" tone="ink">
        Q
      </FigText>
      <FigText x={LAMP_X + 26} y={nqY + 5} size="label" tone="ink">
        Q̅
      </FigText>

      {holding && (
        <FigText x={LAMP_X} y={TOP_Y - 10} size="note" anchor="middle" tone="ink">
          held by feedback alone
        </FigText>
      )}
      {!result.complementary && result.stable && (
        <FigText x={LAMP_X} y={TOP_Y - 10} size="note" anchor="middle" tone="hot">
          Q and Q̅ are both {shown.q ? 1 : 0}
        </FigText>
      )}

      {/* ── the outputs against gate delays ─────────────────────────────────── */}
      <FigText x={TRACE.x - 14} y={TRACE.qY - 4} size="note" anchor="end" tone="ink">
        Q
      </FigText>
      <FigText x={TRACE.x - 14} y={TRACE.nqY - 4} size="note" anchor="end" tone="ink">
        Q̅
      </FigText>
      <rect
        x={TRACE.x + Math.min(cursor, columns - 1) * colW}
        y={TRACE.qY - TRACE.amp - 8}
        width={colW}
        height={TRACE.nqY - TRACE.qY + TRACE.amp + 14}
        fill={alpha(HUE[1], 12)}
        stroke={alpha(HUE[1], 40)}
        strokeWidth={STROKE.hair}
      />
      {trace('q', (levels) => levels.q, TRACE.qY)}
      {trace('nq', (levels) => levels.nq, TRACE.nqY)}
      {result.steps.map((_, index) => (
        <FigText
          key={index}
          x={TRACE.x + index * colW + colW / 2}
          y={TRACE.nqY + 20}
          size="note"
          anchor="middle"
          tone="soft"
        >
          {index}
        </FigText>
      ))}
      <FigText x={TRACE.x} y={TRACE.nqY + 38} size="note" tone="soft">
        gate delays after the last change
      </FigText>
      {result.oscillating && (
        <FigText x={TRACE.right} y={TRACE.nqY + 38} size="note" anchor="end" tone="hot">
          never settles
        </FigText>
      )}
    </Figure>
  );
}
