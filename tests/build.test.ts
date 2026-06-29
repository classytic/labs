/**
 * Circuit builder (Phase 1): a CircuitDoc → netlist → MNA solve → solution.
 * Proves the declarative pipeline matches hand-computed circuit theory.
 */

import { describe, it, expect } from 'vitest';
import { solveCircuit, partState, getPart, listParts, addPart, connect, addWire, setGround, updateProps, deletePart, removeWire, spliceIntoWire, wireCurrents, pinKey, tapWire, terminalOf, addJunction, pruneJunctions, wirePolyline, setWireWaypoints, movePart, retargetWire } from '../src/build/index.js';
import type { CircuitDoc } from '../src/build/index.js';

const at = { x: 0, y: 0 };
const blank: CircuitDoc = { parts: [], nodes: [] };

describe('builder registry', () => {
  it('registers the built-in parts', () => {
    const kinds = listParts().map((p) => p.kind).sort();
    expect(kinds).toEqual(['ammeter', 'bulb', 'capacitor', 'cell', 'diode', 'nmos', 'node', 'pmos', 'resistor', 'switch']);
  });
  it('a part maps its instance to engine elements', () => {
    const r = getPart('resistor')!;
    const elems = r.toElems({ id: 'r1', kind: 'resistor', at, props: { ohms: 2000 }, pins: { a: 'x', b: 'y' } }, (pin) => (pin === 'a' ? 1 : 2));
    expect(elems).toEqual([{ kind: 'R', n1: 1, n2: 2, value: 2000 }]);
  });
});

describe('series loop (battery → resistor → lamp)', () => {
  const doc: CircuitDoc = {
    nodes: [{ id: 'gnd', at }, { id: 'n1', at }, { id: 'n2', at }],
    parts: [
      { id: 'bat', kind: 'cell', at, props: { volts: 5 }, pins: { a: 'n1', b: 'gnd' } },
      { id: 'r', kind: 'resistor', at, props: { ohms: 1000 }, pins: { a: 'n1', b: 'n2' } },
      { id: 'lamp', kind: 'bulb', at, props: { ohms: 100 }, pins: { a: 'n2', b: 'gnd' } },
    ],
  };
  const sol = solveCircuit(doc);

  it('solves the voltage divider', () => {
    expect(sol.ok).toBe(true);
    expect(sol.nodeV.n1).toBeCloseTo(5, 6);
    expect(sol.nodeV.n2).toBeCloseTo(5 * 100 / 1100, 4); // ≈ 0.4545 V
  });
  it('derives a live lamp with the loop current', () => {
    const st = partState(doc.parts[2], sol);
    expect(st.i).toBeCloseTo(5 / 1100, 6); // ≈ 4.545 mA
    expect(st.live).toBe(true);
  });
});

describe('diode orientation gates the current', () => {
  const mk = (anode: string, cathode: string): CircuitDoc => ({
    nodes: [{ id: 'gnd', at }, { id: 'n1', at }, { id: 'n2', at }],
    parts: [
      { id: 'bat', kind: 'cell', at, props: { volts: 5 }, pins: { a: 'n1', b: 'gnd' } },
      { id: 'r', kind: 'resistor', at, props: { ohms: 1000 }, pins: { a: 'n1', b: 'n2' } },
      { id: 'd', kind: 'diode', at, pins: { a: anode, b: cathode } },
    ],
  });

  it('conducts when forward-biased (~0.7 V drop)', () => {
    const doc = mk('n2', 'gnd');
    const sol = solveCircuit(doc);
    expect(partState(doc.parts[2], sol).live).toBe(true);
    expect(sol.nodeV.n2).toBeGreaterThan(0.5);
    expect(sol.nodeV.n2).toBeLessThan(0.85);
  });
  it('blocks when reverse-biased (≈ 0 current)', () => {
    const sol = solveCircuit(mk('gnd', 'n2'));
    expect(Math.abs(sol.current.d ?? 0)).toBeLessThan(1e-6);
  });
});

describe('editor ops build a solvable circuit from scratch', () => {
  it('place → wire → solve a battery + lamp loop', () => {
    // first cell auto-grounds its − terminal
    let doc = addPart(blank, 'cell', { x: 80, y: 120 });
    doc = addPart(doc, 'bulb', { x: 300, y: 120 });
    const cell = doc.parts[0];
    const bulb = doc.parts[1];
    expect(cell.pins.b).toBe('gnd'); // grounded reference
    // wire cell+ to bulb a, and bulb b to ground
    doc = connect(doc, { partId: cell.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });
    doc = setGround(doc, { partId: bulb.id, pin: 'b' });
    doc = updateProps(doc, cell.id, { volts: 6 });
    doc = updateProps(doc, bulb.id, { ohms: 60 });
    const sol = solveCircuit(doc);
    expect(sol.ok).toBe(true);
    const st = partState(doc.parts[1], sol);
    expect(st.i).toBeCloseTo(6 / 60, 4); // 100 mA through the lamp
    expect(st.live).toBe(true);
  });

  it('connect adds a wire edge, it does NOT merge nodes (parts stay independent)', () => {
    let doc = addPart(blank, 'cell', at);
    doc = addPart(doc, 'resistor', at);
    const [c, r] = doc.parts;
    doc = connect(doc, { partId: c.id, pin: 'a' }, { partId: r.id, pin: 'a' });
    expect(doc.wires).toHaveLength(1);
    expect(c.pins.a).not.toBe(r.pins.a); // distinct node ids; the wire joins them
    // a duplicate connect is a no-op
    expect(connect(doc, { partId: r.id, pin: 'a' }, { partId: c.id, pin: 'a' }).wires).toHaveLength(1);
  });

  it('flags a source wired straight across itself as a short', () => {
    let doc = addPart(blank, 'cell', at); // b auto-grounded
    const cell = doc.parts[0];
    doc = setGround(doc, { partId: cell.id, pin: 'a' }); // now + and − are both ground
    const sol = solveCircuit(doc);
    expect(sol.shorted).toContain(cell.id);
    expect(sol.ok).toBe(false);
  });

  it('splices a part into a wire (in series): wire removed, two new wires added', () => {
    let doc = addPart(blank, 'cell', at);
    doc = addPart(doc, 'bulb', at);
    const [c, b] = doc.parts;
    doc = connect(doc, { partId: c.id, pin: 'a' }, { partId: b.id, pin: 'a' });
    const wireId = doc.wires![0].id;
    doc = spliceIntoWire(doc, wireId, 'resistor', { x: 200, y: 100 });
    expect(doc.parts).toHaveLength(3); // cell, bulb, spliced resistor
    expect(doc.wires).toHaveLength(2); // original removed, two new ones
    const r = doc.parts.find((p) => p.kind === 'resistor')!;
    // resistor now sits between cell.a and bulb.a (in series): its pins are wired to both
    const touchesR = doc.wires!.filter((w) => w.a.partId === r.id || w.b.partId === r.id);
    expect(touchesR).toHaveLength(2);
  });

  it('delete removes a part and its wires', () => {
    let doc = addPart(blank, 'resistor', at);
    doc = addPart(doc, 'bulb', at);
    const [r, b] = doc.parts;
    doc = connect(doc, { partId: r.id, pin: 'b' }, { partId: b.id, pin: 'a' });
    doc = deletePart(doc, r.id);
    expect(doc.parts).toHaveLength(1);
    expect(doc.wires).toHaveLength(0); // dangling wire pruned
  });
});

describe('junction nodes + ammeter (parallel / bridge / meter circuits)', () => {
  it('a node adds no element; parallel resistors carry independent branch currents', () => {
    const node = getPart('node')!;
    expect(node.toElems({ id: 'j', kind: 'node', at, pins: {} }, () => 1)).toEqual([]);
    const doc: CircuitDoc = {
      nodes: [], parts: [
        { id: 'bat', kind: 'cell', at, props: { volts: 6 }, pins: { a: 'n1', b: 'gnd' } },
        { id: 'r1', kind: 'resistor', at, props: { ohms: 1000 }, pins: { a: 'n1', b: 'gnd' } },
        { id: 'r2', kind: 'resistor', at, props: { ohms: 2000 }, pins: { a: 'n1', b: 'gnd' } },
      ],
    };
    const sol = solveCircuit(doc);
    expect(partState(doc.parts[1], sol).i).toBeCloseTo(6 / 1000, 4); // 6 mA
    expect(partState(doc.parts[2], sol).i).toBeCloseTo(6 / 2000, 4); // 3 mA
  });

  it('the ammeter reports its branch current', () => {
    const doc: CircuitDoc = {
      nodes: [], parts: [
        { id: 'bat', kind: 'cell', at, props: { volts: 6 }, pins: { a: 'n1', b: 'gnd' } },
        { id: 'am', kind: 'ammeter', at, pins: { a: 'n1', b: 'n2' } },
        { id: 'r', kind: 'resistor', at, props: { ohms: 1000 }, pins: { a: 'n2', b: 'gnd' } },
      ],
    };
    expect(Math.abs(solveCircuit(doc).current['am'] ?? 0)).toBeCloseTo(6 / 1000, 5);
  });

  it('an OPEN switch breaks the loop, no current flows', () => {
    const doc: CircuitDoc = {
      nodes: [], parts: [
        { id: 'bat', kind: 'cell', at, props: { volts: 6 }, pins: { a: 'n1', b: 'gnd' } },
        { id: 'sw', kind: 'switch', at, props: { closed: false }, pins: { a: 'n1', b: 'n2' } },
        { id: 'r', kind: 'resistor', at, props: { ohms: 1000 }, pins: { a: 'n2', b: 'gnd' } },
      ],
    };
    expect(partState(doc.parts[2], solveCircuit(doc)).live).toBe(false);
  });
});

describe('per-wire current — flow animates only where current actually flows', () => {
  it('a series wire carries the full loop current; a dead-end branch carries ~0', () => {
    let doc = addPart(blank, 'cell', { x: 60, y: 120 });
    doc = addPart(doc, 'bulb', { x: 300, y: 120 });
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    doc = connect(doc, { partId: cell.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });
    doc = setGround(doc, { partId: bulb.id, pin: 'b' });
    doc = updateProps(doc, cell.id, { volts: 6 });
    doc = updateProps(doc, bulb.id, { ohms: 60 });
    // a resistor T-d onto the top rail with its other end LEFT OPEN: a dead branch
    doc = addPart(doc, 'resistor', { x: 300, y: 40 });
    const res = doc.parts[2]!;
    doc = connect(doc, { partId: res.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });
    const sol = solveCircuit(doc);
    const wf = wireCurrents(doc, sol);
    const I = 6 / 60; // 100 mA loop current
    expect(Math.abs(wf.current(pinKey(cell.id, 'a'), pinKey(bulb.id, 'a')))).toBeCloseTo(I, 4);
    expect(Math.abs(wf.current(pinKey(res.id, 'a'), pinKey(bulb.id, 'a')))).toBeLessThan(1e-6);
  });

  it('a wire shorting a component carries the current while the component goes dark', () => {
    const doc: CircuitDoc = {
      nodes: [{ id: 'gnd', at }, { id: 'n1', at }, { id: 'n2', at }],
      parts: [
        { id: 'bat', kind: 'cell', at, props: { volts: 6 }, pins: { a: 'n1', b: 'gnd' } },
        { id: 'r', kind: 'resistor', at, props: { ohms: 1000 }, pins: { a: 'n1', b: 'n2' } },
        { id: 'lamp', kind: 'bulb', at, props: { ohms: 100 }, pins: { a: 'n2', b: 'gnd' } },
      ],
      wires: [{ id: 'short', a: { partId: 'lamp', pin: 'a' }, b: { partId: 'lamp', pin: 'b' } }],
    };
    const sol = solveCircuit(doc);
    expect(sol.ok).toBe(true);
    expect(Math.abs(partState(doc.parts[2]!, sol).i)).toBeLessThan(1e-6); // lamp bypassed → dark
    const wf = wireCurrents(doc, sol);
    expect(Math.abs(wf.current(pinKey('lamp', 'a'), pinKey('lamp', 'b')))).toBeCloseTo(6 / 1000, 5);
  });

  it('two parallel wires split the current evenly', () => {
    let doc = addPart(blank, 'cell', { x: 60, y: 120 });
    doc = addPart(doc, 'bulb', { x: 300, y: 120 });
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    doc = connect(doc, { partId: cell.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });
    doc = { ...doc, wires: [...doc.wires!, { id: 'w2', a: { partId: cell.id, pin: 'a' }, b: { partId: bulb.id, pin: 'a' } }] };
    doc = setGround(doc, { partId: bulb.id, pin: 'b' });
    doc = updateProps(doc, cell.id, { volts: 6 });
    doc = updateProps(doc, bulb.id, { ohms: 60 });
    const wf = wireCurrents(doc, solveCircuit(doc));
    expect(Math.abs(wf.current(pinKey(cell.id, 'a'), pinKey(bulb.id, 'a')))).toBeCloseTo((6 / 60) / 2, 4);
  });

  it('no current anywhere when the loop is open (open switch)', () => {
    const doc: CircuitDoc = {
      nodes: [], parts: [
        { id: 'bat', kind: 'cell', at, props: { volts: 6 }, pins: { a: 'n1', b: 'gnd' } },
        { id: 'sw', kind: 'switch', at, props: { closed: false }, pins: { a: 'n1', b: 'n2' } },
        { id: 'r', kind: 'resistor', at, props: { ohms: 1000 }, pins: { a: 'n2', b: 'gnd' } },
      ],
    };
    const wf = wireCurrents(doc, solveCircuit(doc));
    expect(Math.abs(wf.current(pinKey('sw', 'b'), pinKey('r', 'a')))).toBeLessThan(1e-6);
  });
});

describe('mid-wire tap — branch off any point on a wire', () => {
  const loop = (): CircuitDoc => {
    let doc = addPart({ parts: [], nodes: [] }, 'cell', { x: 60, y: 120 });
    doc = addPart(doc, 'bulb', { x: 300, y: 120 });
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    doc = connect(doc, { partId: cell.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });
    doc = setGround(doc, { partId: bulb.id, pin: 'b' });
    doc = updateProps(doc, cell.id, { volts: 6 });
    doc = updateProps(doc, bulb.id, { ohms: 60 });
    return doc;
  };

  it('splits the tapped wire and puts a junction on one net with both ends', () => {
    const doc = loop();
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    const ca = terminalOf(doc, { partId: cell.id, pin: 'a' })!;
    const ba = terminalOf(doc, { partId: bulb.id, pin: 'a' })!;
    const { doc: d2, pin: jp } = tapWire(doc, doc.wires![0]!.id, { x: (ca.x + ba.x) / 2, y: (ca.y + ba.y) / 2 });
    expect(d2.parts.some((p) => p.kind === 'node')).toBe(true); // junction created
    expect(d2.wires).toHaveLength(2); // the wire was split in two
    const sol = solveCircuit(d2);
    expect(sol.net(jp.partId, jp.pin)).toBe(sol.net(cell.id, 'a')); // junction on the same net
    expect(sol.net(cell.id, 'a')).toBe(sol.net(bulb.id, 'a'));
  });

  it('a junction is electrically transparent: tapping does not change the current', () => {
    const doc = loop();
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    const before = partState(bulb, solveCircuit(doc)).i;
    const ca = terminalOf(doc, { partId: cell.id, pin: 'a' })!;
    const ba = terminalOf(doc, { partId: bulb.id, pin: 'a' })!;
    const { doc: d2 } = tapWire(doc, doc.wires![0]!.id, { x: (ca.x + ba.x) / 2, y: ca.y });
    const after = partState(d2.parts.find((p) => p.id === bulb.id)!, solveCircuit(d2)).i;
    expect(after).toBeCloseTo(before, 6);
    expect(solveCircuit(d2).ok).toBe(true);
  });

  it('real effects: a resistor over its power rating burns; within rating is fine; 0 = no limit', () => {
    const mk = (ohms: number, maxPower: number): CircuitDoc => ({
      nodes: [{ id: 'gnd', at }, { id: 'n1', at }],
      parts: [
        { id: 'bat', kind: 'cell', at, props: { volts: 6 }, pins: { a: 'n1', b: 'gnd' } },
        { id: 'r', kind: 'resistor', at, props: { ohms, maxPower }, pins: { a: 'n1', b: 'gnd' } },
      ],
    });
    const hot = mk(50, 0.5);
    const st = partState(hot.parts[1]!, solveCircuit(hot));
    expect(st.power).toBeCloseTo((6 * 6) / 50, 3);  // P = V²/R = 0.72 W
    expect(st.damage).toBe('overpower');             // 0.72 W > 0.5 W rating → burns out
    // raise the rating → safe
    expect(partState(mk(50, 1).parts[1]!, solveCircuit(mk(50, 1))).damage).toBeUndefined();
    // no rating (0) = no limit modelled, even at a huge power
    expect(partState(mk(1, 0).parts[1]!, solveCircuit(mk(1, 0))).damage).toBeUndefined();
  });

  it('a redundant parallel return wire: the lamp still gets the FULL current; the two wires split it 50/50', () => {
    // exactly the user's case: a second wire drawn between two pins already on the same net
    let doc = addPart({ parts: [], nodes: [] }, 'cell', { x: 0, y: 0 });
    doc = addPart(doc, 'bulb', { x: 200, y: 0 });
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    doc = updateProps(doc, cell.id, { volts: 6 });
    doc = updateProps(doc, bulb.id, { ohms: 60 });
    doc = connect(doc, { partId: cell.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });   // supply
    doc = addWire(doc, { partId: bulb.id, pin: 'b' }, { partId: cell.id, pin: 'b' });    // return wire #1
    doc = addWire(doc, { partId: bulb.id, pin: 'b' }, { partId: cell.id, pin: 'b' });    // redundant return #2
    const sol = solveCircuit(doc);
    expect(sol.ok).toBe(true);
    expect(Math.abs(partState(doc.parts.find((p) => p.id === bulb.id)!, sol).i)).toBeCloseTo(6 / 60, 4); // lamp = full 100 mA
    const wf = wireCurrents(doc, sol);
    expect(Math.abs(wf.current(pinKey(bulb.id, 'b'), pinKey(cell.id, 'b')))).toBeCloseTo((6 / 60) / 2, 4); // each wire = 50 mA
  });

  it('Wheatstone bridge: balanced (P/Q = R/S) → zero current through the bridge arm', () => {
    const at = { x: 0, y: 0 };
    const doc: CircuitDoc = {
      nodes: [], parts: [
        { id: 'V', kind: 'cell', at, props: { volts: 6 }, pins: { a: 'A', b: 'gnd' } }, // C = gnd
        { id: 'P', kind: 'resistor', at, props: { ohms: 100 }, pins: { a: 'A', b: 'B' } },
        { id: 'Q', kind: 'resistor', at, props: { ohms: 200 }, pins: { a: 'B', b: 'gnd' } },
        { id: 'R', kind: 'resistor', at, props: { ohms: 300 }, pins: { a: 'A', b: 'D' } },
        { id: 'S', kind: 'resistor', at, props: { ohms: 600 }, pins: { a: 'D', b: 'gnd' } },
        { id: 'G', kind: 'resistor', at, props: { ohms: 1000 }, pins: { a: 'B', b: 'D' } }, // bridge arm
      ],
    };
    const sol = solveCircuit(doc); // 100/200 = 300/600 → balanced
    expect(sol.ok).toBe(true);
    expect(sol.nodeV.B).toBeCloseTo(sol.nodeV.D!, 5);                       // the two mid-nodes sit at equal V
    expect(Math.abs(partState(doc.parts[5]!, sol).i)).toBeLessThan(1e-6);   // no current across the bridge
  });

  it('moving a part keeps its wires attached (connections survive a move; nets unchanged)', () => {
    let doc = addPart({ parts: [], nodes: [] }, 'cell', { x: 0, y: 0 });
    doc = addPart(doc, 'bulb', { x: 200, y: 0 });
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    doc = connect(doc, { partId: cell.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });
    doc = setGround(doc, { partId: bulb.id, pin: 'b' });
    const before = solveCircuit(doc);
    doc = movePart(doc, bulb.id, { x: 400, y: 120 });
    const after = solveCircuit(doc);
    expect(after.net(bulb.id, 'a')).toBe(before.net(bulb.id, 'a')); // still the same net after moving
    expect(after.nodeV).toEqual(before.nodeV);                       // identical solve (wires followed the part)
  });

  it('addWire always creates a drawn wire (even between already-connected pins) so it never vanishes', () => {
    let doc = addPart({ parts: [], nodes: [] }, 'cell', { x: 0, y: 0 });
    doc = addPart(doc, 'bulb', { x: 100, y: 0 });
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    const a = { partId: cell.id, pin: 'a' }, b = { partId: bulb.id, pin: 'a' };
    doc = connect(doc, a, b);
    expect(doc.wires).toHaveLength(1);
    // connect dedups a second identical edge...
    expect(connect(doc, a, b).wires).toHaveLength(1);
    // ...but a user-DRAWN wire (addWire) is created anyway, carrying its bends
    const drawn = addWire(doc, a, b, [{ x: 50, y: 40 }]);
    expect(drawn.wires).toHaveLength(2);
    expect(drawn.wires![1]!.mid).toEqual([{ x: 50, y: 40 }]);
    // self-links are still rejected
    expect(addWire(doc, a, a).wires).toHaveLength(1);
  });

  it('retargetWire detaches one end and reconnects it elsewhere (rejects self-loop)', () => {
    let doc = addPart({ parts: [], nodes: [] }, 'cell', { x: 0, y: 0 });
    doc = addPart(doc, 'bulb', { x: 100, y: 0 });
    doc = addPart(doc, 'resistor', { x: 200, y: 0 });
    const cell = doc.parts[0]!, bulb = doc.parts[1]!, res = doc.parts[2]!;
    doc = connect(doc, { partId: cell.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });
    const wid = doc.wires![0]!.id;
    // re-target end 'b' (bulb.a) → resistor.a
    doc = retargetWire(doc, wid, 'b', { partId: res.id, pin: 'a' });
    expect(doc.wires![0]!.b).toEqual({ partId: res.id, pin: 'a' });
    expect(doc.wires![0]!.a).toEqual({ partId: cell.id, pin: 'a' }); // other end unchanged
    // a self-loop (re-targeting end 'b' onto end 'a's pin) is rejected → 'b' stays put
    expect(retargetWire(doc, wid, 'b', { partId: cell.id, pin: 'a' }).wires![0]!.b).toEqual({ partId: res.id, pin: 'a' });
  });

  it('wire bend points position the path and are purely visual (no effect on the net)', () => {
    let doc = addPart({ parts: [], nodes: [] }, 'cell', { x: 60, y: 120 });
    doc = addPart(doc, 'bulb', { x: 300, y: 120 });
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    doc = connect(doc, { partId: cell.id, pin: 'a' }, { partId: bulb.id, pin: 'a' });
    const wid = doc.wires![0]!.id;
    // default route: a single Manhattan elbow
    const ta = terminalOf(doc, { partId: cell.id, pin: 'a' })!, tb = terminalOf(doc, { partId: bulb.id, pin: 'a' })!;
    expect(wirePolyline(ta, [], tb).length).toBeLessThanOrEqual(3);
    // add a bend → the path now routes through it; the electrical net is unchanged
    const before = solveCircuit(doc).net(cell.id, 'a');
    doc = setWireWaypoints(doc, wid, [{ x: 180, y: 40 }]);
    expect(doc.wires![0]!.mid).toEqual([{ x: 180, y: 40 }]);
    expect(wirePolyline(ta, doc.wires![0]!.mid!, tb)).toEqual([ta, { x: 180, y: 40 }, tb]);
    expect(solveCircuit(doc).net(cell.id, 'a')).toBe(before); // bends don't change connectivity
    // clearing the bends drops the `mid` field
    expect(setWireWaypoints(doc, wid, []).wires![0]!.mid).toBeUndefined();
  });

  it('prunes a stray junction (a node with < 2 wires) but keeps a real branch/corner', () => {
    // a floating junction with no wires → pruned
    const { doc: lone } = addJunction({ parts: [], nodes: [] }, { x: 50, y: 50 });
    expect(pruneJunctions(lone).parts.some((p) => p.kind === 'node')).toBe(false);
    // a junction tapped into a wire (3 connections) survives; deleting the branch back to 2 keeps it;
    const doc = loop();
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    const ca = terminalOf(doc, { partId: cell.id, pin: 'a' })!;
    const ba = terminalOf(doc, { partId: bulb.id, pin: 'a' })!;
    const { doc: d2, pin: jp } = tapWire(doc, doc.wires![0]!.id, { x: (ca.x + ba.x) / 2, y: ca.y });
    expect(pruneJunctions(d2).parts.some((p) => p.id === jp.partId)).toBe(true); // 2 split halves → kept
  });

  it('branching a parallel bulb off the tap doubles the source current', () => {
    const doc = loop();
    const cell = doc.parts[0]!, bulb = doc.parts[1]!;
    const ca = terminalOf(doc, { partId: cell.id, pin: 'a' })!;
    const ba = terminalOf(doc, { partId: bulb.id, pin: 'a' })!;
    let { doc: d2, pin: jp } = tapWire(doc, doc.wires![0]!.id, { x: (ca.x + ba.x) / 2, y: ca.y });
    // a second identical bulb from the junction to ground = two 60Ω in parallel across 6 V
    d2 = addPart(d2, 'bulb', { x: 300, y: 30 });
    const bulb2 = d2.parts[d2.parts.length - 1]!;
    d2 = updateProps(d2, bulb2.id, { ohms: 60 });
    d2 = connect(d2, jp, { partId: bulb2.id, pin: 'a' });
    d2 = setGround(d2, { partId: bulb2.id, pin: 'b' });
    const sol = solveCircuit(d2);
    expect(Math.abs(partState(d2.parts.find((p) => p.id === bulb2.id)!, sol).i)).toBeCloseTo(6 / 60, 4);
  });
});
