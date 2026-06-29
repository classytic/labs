import { getPart } from "./registry.mjs";

//#region src/build/editor-ops.ts
const freshId = (prefix, taken) => {
	let i = 1;
	while (taken.has(`${prefix}${i}`)) i++;
	return `${prefix}${i}`;
};
const nodeIdsOf = (doc) => new Set([...doc.nodes.map((n) => n.id), ...doc.parts.flatMap((p) => Object.values(p.pins))]);
/** Add a part; each pin starts on its own fresh node (unconnected). The first cell's −
*  terminal is tied to ground so the network always has a reference. */
function addPart(doc, kind, at) {
	const def = getPart(kind);
	if (!def) return doc;
	const id = freshId(kind, new Set(doc.parts.map((p) => p.id)));
	const taken = nodeIdsOf(doc);
	const grounded = [...taken].includes("gnd");
	const pins = {};
	for (const pin of def.pins) {
		if (kind === "cell" && !grounded && pin === "b") {
			pins[pin] = "gnd";
			continue;
		}
		const nid = freshId("nd", taken);
		taken.add(nid);
		pins[pin] = nid;
	}
	const part = {
		id,
		kind,
		at,
		orient: "h",
		props: { ...def.defaultProps },
		pins
	};
	return {
		...doc,
		parts: [...doc.parts, part]
	};
}
function movePart(doc, id, at) {
	return {
		...doc,
		parts: doc.parts.map((p) => p.id === id ? {
			...p,
			at
		} : p)
	};
}
function updateProps(doc, id, patch) {
	return {
		...doc,
		parts: doc.parts.map((p) => p.id === id ? {
			...p,
			props: {
				...p.props,
				...patch
			}
		} : p)
	};
}
function rotatePart(doc, id) {
	return {
		...doc,
		parts: doc.parts.map((p) => p.id === id ? {
			...p,
			orient: p.orient === "v" ? "h" : "v"
		} : p)
	};
}
/**
* Drop junction nodes that have fewer than 2 wire connections AND their dangling wires, to a
* fixpoint. This is an EXPLICIT "tidy" the UI can offer; it is NOT run automatically, because a
* node a user just placed (or is half-way wiring) legitimately has 0 or 1 connection and must
* not vanish under them.
*/
function pruneJunctions(doc) {
	let parts = doc.parts;
	let wires = doc.wires ?? [];
	for (;;) {
		const count = /* @__PURE__ */ new Map();
		for (const w of wires) for (const e of [w.a, w.b]) count.set(e.partId, (count.get(e.partId) ?? 0) + 1);
		const orphans = new Set(parts.filter((p) => p.kind === "node" && (count.get(p.id) ?? 0) < 2).map((p) => p.id));
		if (orphans.size === 0) break;
		parts = parts.filter((p) => !orphans.has(p.id));
		wires = wires.filter((w) => !orphans.has(w.a.partId) && !orphans.has(w.b.partId));
	}
	return {
		...doc,
		parts,
		wires
	};
}
function deletePart(doc, id) {
	return {
		...doc,
		parts: doc.parts.filter((p) => p.id !== id),
		wires: (doc.wires ?? []).filter((w) => w.a.partId !== id && w.b.partId !== id)
	};
}
const samePin = (x, y) => x.partId === y.partId && x.pin === y.pin;
const sameWire = (a, b, x, y) => samePin(a, x) && samePin(b, y) || samePin(a, y) && samePin(b, x);
/** True when the ref names a real part AND a pin that part's definition declares.
*  Keeps invalid (invisible no-op) wires out of persisted, authored docs. */
const pinExists = (doc, ref) => {
	const part = doc.parts.find((p) => p.id === ref.partId);
	if (!part) return false;
	return getPart(part.kind)?.pins.includes(ref.pin) ?? false;
};
/** Connect two pins with a NEW wire edge (parts keep their positions). No-op for a
*  self-link, a duplicate of an existing wire, or an endpoint whose part/pin
*  doesn't exist (an invalid edge that would persist as an invisible no-op). */
function connect(doc, a, b) {
	if (samePin(a, b)) return doc;
	if (!pinExists(doc, a) || !pinExists(doc, b)) return doc;
	const wires = doc.wires ?? [];
	if (wires.some((w) => sameWire(w.a, w.b, a, b))) return doc;
	const id = freshId("w", new Set(wires.map((w) => w.id)));
	return {
		...doc,
		wires: [...wires, {
			id,
			a,
			b
		}]
	};
}
/** Add a wire the way a user DRAWS one: it is always created (even between pins already on the
*  same net, e.g. a deliberately-routed redundant path) so a drawn wire never silently vanishes.
*  Only a self-link or an endpoint that doesn't exist is rejected. Carries optional bend points. */
function addWire(doc, a, b, mids) {
	if (samePin(a, b) || !pinExists(doc, a) || !pinExists(doc, b)) return doc;
	const wires = doc.wires ?? [];
	const id = freshId("w", new Set(wires.map((w) => w.id)));
	return {
		...doc,
		wires: [...wires, mids?.length ? {
			id,
			a,
			b,
			mid: mids
		} : {
			id,
			a,
			b
		}]
	};
}
/** Remove a wire edge. Low-level: callers that may orphan a junction wrap with pruneJunctions. */
function removeWire(doc, wireId) {
	return {
		...doc,
		wires: (doc.wires ?? []).filter((w) => w.id !== wireId)
	};
}
/** Re-target ONE end of a wire to a different pin (drag-to-detach / reconnect). Rejects a move
*  that would make the wire a self-loop, or that points at a pin which doesn't exist. */
function retargetWire(doc, wireId, end, to) {
	return {
		...doc,
		wires: (doc.wires ?? []).map((w) => {
			if (w.id !== wireId) return w;
			if (samePin(to, end === "a" ? w.b : w.a) || !pinExists(doc, to)) return w;
			return end === "a" ? {
				...w,
				a: to
			} : {
				...w,
				b: to
			};
		})
	};
}
/** Remove a wire (the editor's delete-wire action). Junctions are left in place, never
*  auto-removed, so nothing the user placed disappears unexpectedly. */
function disconnectWire(doc, wireId) {
	return removeWire(doc, wireId);
}
/** World position of a pin's terminal (via its PartDef), for geometry on the doc. */
function terminalOf(doc, ref) {
	const p = doc.parts.find((x) => x.id === ref.partId);
	const def = p && getPart(p.kind);
	return def ? def.terminalAt(p, ref.pin) : void 0;
}
/** Manhattan route a pin→pin wire takes (straight if aligned, else a single elbow). */
function route(a, b) {
	return a.x === b.x || a.y === b.y ? [a, b] : [
		a,
		{
			x: a.x,
			y: b.y
		},
		b
	];
}
/** The full polyline a wire draws: through its bend points if it has any, else the default
*  Manhattan elbow. The renderer, hit-test, and tap all route through this one function. */
function wirePolyline(ta, mids, tb) {
	return mids.length ? [
		ta,
		...mids,
		tb
	] : route(ta, tb);
}
/** Set (or clear, when empty) a wire's bend points. */
function setWireWaypoints(doc, wireId, mids) {
	return {
		...doc,
		wires: (doc.wires ?? []).map((w) => w.id === wireId ? {
			...w,
			mid: mids.length ? mids : void 0
		} : w)
	};
}
/** Closest point on a polyline to p (so a tapped junction sits exactly on the wire). */
function projectOnPolyline(p, pts) {
	let best = pts[0] ?? p, bd = Infinity;
	for (let i = 0; i < pts.length - 1; i++) {
		const a = pts[i], b = pts[i + 1];
		const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
		const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
		const pt = {
			x: a.x + t * dx,
			y: a.y + t * dy
		};
		const d = Math.hypot(p.x - pt.x, p.y - pt.y);
		if (d < bd) {
			bd = d;
			best = pt;
		}
	}
	return best;
}
/** Place a free junction (a 'node' part) at a point; returns its pin for wiring. */
function addJunction(doc, at) {
	const d = addPart(doc, "node", at);
	return {
		doc: d,
		pin: {
			partId: d.parts[d.parts.length - 1].id,
			pin: "j"
		}
	};
}
/**
* Tap an existing wire at a point: drop a junction ON the wire (projected onto its route)
* and SPLIT the wire into two that meet there, so a new lead can branch off mid-span. The
* junction is a `node` part (no element), so the three wires share one net and the solver
* needs no special mid-wire case. Returns the junction pin to wire the new lead to.
*/
function tapWire(doc, wireId, at) {
	const wire = (doc.wires ?? []).find((w) => w.id === wireId);
	const ta = wire && terminalOf(doc, wire.a);
	const tb = wire && terminalOf(doc, wire.b);
	if (!wire || !ta || !tb) return addJunction(doc, at);
	const { doc: withNode, pin } = addJunction(doc, projectOnPolyline(at, wirePolyline(ta, wire.mid ?? [], tb)));
	let d = connect(withNode, wire.a, pin);
	d = connect(d, pin, wire.b);
	d = removeWire(d, wireId);
	return {
		doc: d,
		pin
	};
}
/** Drop a part ONTO a wire: insert it in series. The wire is removed and the part's two
*  ends are wired to the wire's two original endpoints (a → pin0, pin1 → b). */
function spliceIntoWire(doc, wireId, kind, at) {
	const wire = (doc.wires ?? []).find((w) => w.id === wireId);
	const def = getPart(kind);
	if (!wire || !def || def.pins.length < 2) return addPart(doc, kind, at);
	let d = addPart(doc, kind, at);
	const part = d.parts[d.parts.length - 1];
	if (!part) return d;
	const [p0, p1] = def.pins;
	d = removeWire(d, wireId);
	d = connect(d, wire.a, {
		partId: part.id,
		pin: p0
	});
	d = connect(d, {
		partId: part.id,
		pin: p1
	}, wire.b);
	return d;
}
/** Toggle a pin's connection to ground. Grounding ties the pin's net to the reference;
*  toggling again gives the pin a fresh independent node (un-grounds it), so a short made
*  by grounding both terminals of a source can always be undone. */
function setGround(doc, ref) {
	const part = doc.parts.find((p) => p.id === ref.partId);
	if (!part) return doc;
	const next = part.pins[ref.pin] === "gnd" ? freshId("nd", nodeIdsOf(doc)) : "gnd";
	return {
		...doc,
		parts: doc.parts.map((p) => p.id === ref.partId ? {
			...p,
			pins: {
				...p.pins,
				[ref.pin]: next
			}
		} : p)
	};
}

//#endregion
export { addJunction, addPart, addWire, connect, deletePart, disconnectWire, movePart, pruneJunctions, removeWire, retargetWire, rotatePart, setGround, setWireWaypoints, spliceIntoWire, tapWire, terminalOf, updateProps, wirePolyline };