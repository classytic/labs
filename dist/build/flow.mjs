import { getPart } from "./registry.mjs";

//#region src/build/flow.ts
/**
* Per-wire current for the flow animation. The MNA solve (`solveCircuit`) yields node
* voltages and COMPONENT branch currents, but a net is one equipotential region, so it
* cannot say how much current each individual WIRE carries. Without that, the renderer
* animated every wire in an energised net, even dead-end stubs and bypassed branches, so
* a learner saw "current flowing through every path" regardless of the real circuit.
*
* We recover honest per-wire current with a small resistor-network solve: build the graph
* of pins/nodes joined by wires, give each wire a unit conductance, inject each component's
* KNOWN terminal current at its pins, and solve the graph Laplacian L·v = b for node
* potentials. A wire's current is then v_u − v_v. This is exact on a series path (it carries
* the full loop current), splits evenly across parallel wires, and is ZERO on a dead branch,
* so the animation flows only where current actually flows. When a wire shorts past a
* component, that wire carries the current while the component (v ≈ 0 across it) goes dark.
*/
const fnum = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
const pinKey = (id, pin) => `${id} ${pin}`;
const nodeKey = (nid) => `node:${nid}`;
/** current the part drives a→b internally (n1→n2), reused from the part state convention. */
const branchAB = (p, sol) => p.kind === "resistor" || p.kind === "bulb" ? (sol.pinV(p.id, "a") - sol.pinV(p.id, "b")) / fnum(p.props?.ohms, p.kind === "bulb" ? 100 : 1e3) : sol.current[p.id] ?? 0;
/** Dense linear solve A·x = b via Gaussian elimination with partial pivoting; null if singular. */
function solveDense(A, b) {
	const n = b.length;
	const M = A.map((r, i) => [...r, b[i]]);
	for (let c = 0; c < n; c++) {
		let piv = c;
		for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
		if (Math.abs(M[piv][c]) < 1e-12) return null;
		[M[c], M[piv]] = [M[piv], M[c]];
		const pv = M[c][c];
		for (let r = 0; r < n; r++) {
			if (r === c) continue;
			const f = M[r][c] / pv;
			if (f === 0) continue;
			for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
		}
	}
	return M.map((r, i) => r[n] / r[i]);
}
/** Threshold below which a wire is treated as carrying no current (float-noise / open branch). */
const FLOW_EPS = 1e-6;
function wireCurrents(doc, sol) {
	if (!sol.ok) return { current: () => 0 };
	const edges = [];
	const nodePins = /* @__PURE__ */ new Map();
	for (const p of doc.parts) {
		const def = getPart(p.kind);
		if (!def) continue;
		for (const pin of def.pins) {
			const nid = p.pins?.[pin];
			if (nid) (nodePins.get(nid) ?? nodePins.set(nid, []).get(nid)).push(pinKey(p.id, pin));
		}
	}
	for (const [nid, pins] of nodePins) if (pins.length >= 2) for (const pk of pins) edges.push([pk, nodeKey(nid)]);
	for (const w of doc.wires ?? []) edges.push([pinKey(w.a.partId, w.a.pin), pinKey(w.b.partId, w.b.pin)]);
	const idx = /* @__PURE__ */ new Map();
	const vid = (k) => {
		let n = idx.get(k);
		if (n === void 0) {
			n = idx.size;
			idx.set(k, n);
		}
		return n;
	};
	for (const [u, v] of edges) {
		vid(u);
		vid(v);
	}
	const N = idx.size;
	if (N === 0) return { current: () => 0 };
	const b = new Array(N).fill(0);
	for (const p of doc.parts) {
		const def = getPart(p.kind);
		if (!def) continue;
		const Ib = branchAB(p, sol);
		const p0 = def.pins[0] ? idx.get(pinKey(p.id, def.pins[0])) : void 0;
		const p1 = def.pins[1] ? idx.get(pinKey(p.id, def.pins[1])) : void 0;
		if (p0 !== void 0) b[p0] -= Ib;
		if (p1 !== void 0) b[p1] += Ib;
	}
	const parent = Array.from({ length: N }, (_, i) => i);
	const find = (x) => {
		while (parent[x] !== x) {
			parent[x] = parent[parent[x]];
			x = parent[x];
		}
		return x;
	};
	const L = Array.from({ length: N }, () => new Array(N).fill(0));
	for (const [u, v] of edges) {
		const a = idx.get(u), c = idx.get(v);
		L[a][a] += 1;
		L[c][c] += 1;
		L[a][c] -= 1;
		L[c][a] -= 1;
		parent[find(a)] = find(c);
	}
	const pots = new Array(N).fill(0);
	const comps = /* @__PURE__ */ new Map();
	for (let i = 0; i < N; i++) (comps.get(find(i)) ?? comps.set(find(i), []).get(find(i))).push(i);
	for (const verts of comps.values()) {
		if (verts.length < 2) continue;
		const unknown = verts.slice(1);
		const x = solveDense(unknown.map((ri) => unknown.map((cj) => L[ri][cj])), unknown.map((ri) => b[ri]));
		if (x) unknown.forEach((vi, i) => {
			pots[vi] = x[i];
		});
	}
	return { current: (u, v) => {
		const iu = idx.get(u), iv = idx.get(v);
		return iu === void 0 || iv === void 0 ? 0 : pots[iu] - pots[iv];
	} };
}

//#endregion
export { FLOW_EPS, nodeKey, pinKey, wireCurrents };