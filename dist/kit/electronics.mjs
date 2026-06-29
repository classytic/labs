'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/electronics.tsx
const WIRE = "var(--stage-wire)";
const LIVE = "var(--stage-live)";
const METAL = "var(--stage-metal)";
const BG = "var(--stage-bg)";
const FG = "var(--stage-fg)";
const CHARGE = "var(--stage-charge)";
const SHEEN = "color-mix(in oklab, var(--stage-sheen) 45%, transparent)";
const C_RESISTOR = "var(--stage-resistor, oklch(0.74 0.09 70))";
const C_CAP = "var(--stage-capacitor, oklch(0.6 0.14 250))";
const C_DIODE = "var(--stage-diode, oklch(0.56 0.16 290))";
const C_CELL = "var(--stage-cell, oklch(0.58 0.18 28))";
const C_LAMP = "var(--stage-warn, oklch(0.78 0.15 75))";
const C_SWITCH = "var(--stage-switch, oklch(0.6 0.04 250))";
const C_MOS = "var(--stage-mosfet, oklch(0.57 0.13 300))";
const C_BAND = [
	"oklch(0.45 0.08 50)",
	"oklch(0.55 0.18 28)",
	"oklch(0.6 0.15 75)"
];
const tint = (c, pct = 12) => `color-mix(in oklab, ${c} ${pct}%, ${BG})`;
/** The two clean leads from each terminal to the body edge at ±bodyHalf (no nubs, no bloat). */
function Leads({ cx, cy, half, bodyHalf, live }) {
	const wire = live ? LIVE : WIRE;
	return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
		x1: cx - half,
		y1: cy,
		x2: cx - bodyHalf,
		y2: cy,
		stroke: wire,
		strokeWidth: 2,
		strokeLinecap: "round"
	}), /* @__PURE__ */ jsx("line", {
		x1: cx + bodyHalf,
		y1: cy,
		x2: cx + half,
		y2: cy,
		stroke: wire,
		strokeWidth: 2,
		strokeLinecap: "round"
	})] });
}
/**
* Tag — an SVG text label with a background HALO (a stroke in the bg colour painted under
* the fill). ALWAYS use this instead of a bare <text> in a schematic: it keeps labels
* readable wherever they land, so a label crossing a wire or sitting on a fill never turns
* into mud. (This is the same paint-order trick the stage axis labels use.)
*/
function Tag({ x, y, text, color = FG, size = 11, weight = 600, anchor = "middle", halo = BG }) {
	return /* @__PURE__ */ jsx("text", {
		x,
		y,
		fill: color,
		fontSize: size,
		fontWeight: weight,
		textAnchor: anchor,
		style: {
			pointerEvents: "none",
			paintOrder: "stroke",
			stroke: halo,
			strokeWidth: 3.5,
			strokeLinejoin: "round"
		},
		children: text
	});
}
/** Value/name label above a body of half-height `bodyH` (haloed via Tag). */
function GlyphLabel({ cx, cy, bodyH, label }) {
	if (!label) return null;
	return /* @__PURE__ */ jsx(Tag, {
		x: cx,
		y: cy - bodyH - 7,
		text: label
	});
}
/**
* RESISTOR, the IEC/CAIE rectangle (an open box interrupting the wire). The
* exam-standard symbol; clean token fill + metal outline + a top-edge sheen.
*/
function ResistorGlyph({ cx, cy, half, live, label }) {
	const bw = 22;
	const bh = 11;
	const body = `color-mix(in oklab, ${C_RESISTOR} 78%, ${BG})`;
	const edge = `color-mix(in oklab, ${C_RESISTOR} 60%, #000)`;
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx(Leads, {
			cx,
			cy,
			half,
			bodyHalf: bw,
			live
		}),
		/* @__PURE__ */ jsx("rect", {
			x: cx - bw,
			y: cy - bh,
			width: bw * 2,
			height: bh * 2,
			rx: bh * .85,
			fill: body,
			stroke: edge,
			strokeWidth: 1.5
		}),
		C_BAND.map((c, i) => /* @__PURE__ */ jsx("rect", {
			x: cx - 8 + i * 7,
			y: cy - bh + 2,
			width: 3,
			height: bh * 2 - 4,
			rx: 1,
			fill: c
		}, i)),
		/* @__PURE__ */ jsx("line", {
			x1: cx - bw * .7,
			y1: cy - bh + 2.5,
			x2: cx + bw * .7,
			y2: cy - bh + 2.5,
			stroke: SHEEN,
			strokeWidth: 1.4,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx(GlyphLabel, {
			cx,
			cy,
			bodyH: bh,
			label
		})
	] });
}
/**
* CELL / BATTERY, one long thin plate (+) and one short thick plate (−). Pass
* `cells` > 1 to draw a battery (repeated plate pairs). EMF label above.
*/
function CellGlyph({ cx, cy, half, live, label, cells = 1 }) {
	const n = Math.max(1, Math.round(cells));
	const gap = 7;
	const span = n * gap * 2 - gap;
	const bodyHalf = span / 2 + 2;
	const longH = 13;
	const shortH = 7;
	const plates = [];
	let x = cx - span / 2;
	for (let i = 0; i < n; i++) {
		plates.push(/* @__PURE__ */ jsx("line", {
			x1: x,
			y1: cy - longH,
			x2: x,
			y2: cy + longH,
			stroke: C_CELL,
			strokeWidth: 2,
			strokeLinecap: "round"
		}, `l${i}`));
		x += gap;
		plates.push(/* @__PURE__ */ jsx("line", {
			x1: x,
			y1: cy - shortH,
			x2: x,
			y2: cy + shortH,
			stroke: C_CELL,
			strokeWidth: 4.5,
			strokeLinecap: "round"
		}, `s${i}`));
		x += gap;
	}
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx(Leads, {
			cx,
			cy,
			half,
			bodyHalf,
			live
		}),
		plates,
		/* @__PURE__ */ jsx(GlyphLabel, {
			cx,
			cy,
			bodyH: longH,
			label
		})
	] });
}
/**
* CAPACITOR, two parallel plates with a visible STORED-CHARGE field between them
* and an optional LEAK. This is the centerpiece glyph: `charge` (0..1) sets how
* many field lines bridge the plates and their intensity, so a charging cap fills
* and a leaking cap visibly empties; `leaking` + `leakPhase` drip charge off the
* lower plate (the "why capacitors don't hold charge forever" picture). All motion
* is data, the lab's RC integrator lowers `charge` and advances `leakPhase`.
*/
function CapacitorGlyph({ cx, cy, half, live, label, charge = 0, leaking, leakPhase = 0, polarised }) {
	const q = Math.max(0, Math.min(1, charge));
	const plateGap = 14;
	const plateH = 18;
	const bodyHalf = 10;
	const lx = cx - plateGap / 2;
	const rx = cx + plateGap / 2;
	const lines = q > .02 ? Math.round(1 + q * 2) : 0;
	const field = [];
	for (let i = 0; i < lines; i++) {
		const fy = cy - plateH * .5 + plateH * (lines === 1 ? .5 : i / (lines - 1));
		field.push(/* @__PURE__ */ jsx("line", {
			x1: lx + 2,
			y1: fy,
			x2: rx - 2,
			y2: fy,
			stroke: CHARGE,
			strokeWidth: 1,
			strokeLinecap: "round",
			opacity: .12 + .3 * q
		}, `f${i}`));
	}
	const drips = [];
	if (leaking && q > .02) for (let d = 0; d < 2; d++) {
		const ph = (leakPhase + d * .5) % 1;
		const dy = cy + plateH + ph * 16;
		drips.push(/* @__PURE__ */ jsx("circle", {
			cx,
			cy: dy,
			r: 2.2,
			fill: CHARGE,
			opacity: (1 - ph) * (.3 + .5 * q)
		}, `d${d}`));
	}
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx(Leads, {
			cx,
			cy,
			half,
			bodyHalf,
			live
		}),
		q > .02 && /* @__PURE__ */ jsx("rect", {
			x: lx + 1,
			y: cy - plateH,
			width: rx - lx - 2,
			height: plateH * 2,
			fill: C_CAP,
			opacity: .12 + .4 * q,
			rx: 1
		}),
		field,
		/* @__PURE__ */ jsx("line", {
			x1: lx,
			y1: cy - plateH,
			x2: lx,
			y2: cy + plateH,
			stroke: C_CAP,
			strokeWidth: 4,
			strokeLinecap: "round"
		}),
		polarised ? /* @__PURE__ */ jsx("path", {
			d: `M ${rx} ${cy - plateH} Q ${rx + 5} ${cy} ${rx} ${cy + plateH}`,
			fill: "none",
			stroke: C_CAP,
			strokeWidth: 3.5,
			strokeLinecap: "round"
		}) : /* @__PURE__ */ jsx("line", {
			x1: rx,
			y1: cy - plateH,
			x2: rx,
			y2: cy + plateH,
			stroke: C_CAP,
			strokeWidth: 3.5,
			strokeLinecap: "round"
		}),
		polarised && /* @__PURE__ */ jsx("text", {
			x: lx - 4,
			y: cy - plateH + 2,
			fill: FG,
			fontSize: 11,
			fontWeight: 700,
			textAnchor: "end",
			style: { pointerEvents: "none" },
			children: "+"
		}),
		drips,
		/* @__PURE__ */ jsx(GlyphLabel, {
			cx,
			cy,
			bodyH: plateH,
			label
		})
	] });
}
/**
* SWITCH (SPST), the exam-standard open/closed switch: two terminal contacts and
* a hinged lever off the left contact. Closed → lever lies horizontal onto the
* right contact (energised path picks up the live colour); open → lever lifts
* ~40° and the gap is drawn in the warn/neutral colour.
*/
function SwitchGlyph({ cx, cy, half, live, label, closed }) {
	const bw = 18;
	const hx = cx - bw;
	const tx = cx + bw;
	const len = bw * 2;
	const ang = closed ? 0 : -40 * (Math.PI / 180);
	const ex = hx + len * Math.cos(ang);
	const ey = cy + len * Math.sin(ang);
	const lever = closed ? C_SWITCH : "var(--stage-warn)";
	const bodyH = closed ? 4 : len * Math.sin(-ang) + 4;
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx(Leads, {
			cx,
			cy,
			half,
			bodyHalf: bw,
			live
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: hx,
			cy,
			r: 3.4,
			fill: C_SWITCH
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: tx,
			cy,
			r: 3.4,
			fill: C_SWITCH
		}),
		/* @__PURE__ */ jsx("line", {
			x1: hx,
			y1: cy,
			x2: ex,
			y2: ey,
			stroke: lever,
			strokeWidth: 3.6,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: hx,
			y1: cy - 1.4,
			x2: ex,
			y2: ey - 1.4,
			stroke: SHEEN,
			strokeWidth: 1.2,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx(GlyphLabel, {
			cx,
			cy,
			bodyH,
			label
		})
	] });
}
/**
* FILAMENT LAMP, the exam-standard circle with an inscribed × cross (NOT a ~,
* which is the AC-source mark). When `live`, a warm glow halo (var(--stage-warn))
* whose radius + opacity scale with `brightness` blooms behind the bulb and the
* cross brightens; when dark, the cross is neutral metal. `bodyHalf` ≈ the circle
* radius, so it lines up with ResistorGlyph. Glow is DATA, the host drives
* `brightness` from the circuit's power.
*/
function BulbGlyph({ cx, cy, half, live, label, brightness = 0 }) {
	const r = 16;
	const b = Math.max(0, Math.min(1, brightness));
	const lit = live && b > .02;
	const k = r * Math.SQRT1_2;
	const crossStroke = lit ? C_LAMP : METAL;
	const ring = lit ? C_LAMP : METAL;
	return /* @__PURE__ */ jsxs("g", { children: [
		lit && /* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: 20 + b * 12,
			fill: "var(--stage-warn)",
			opacity: .12 + .32 * b,
			style: { pointerEvents: "none" }
		}),
		/* @__PURE__ */ jsx(Leads, {
			cx,
			cy,
			half,
			bodyHalf: r,
			live
		}),
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r,
			fill: lit ? tint(C_LAMP, 18) : BG,
			stroke: ring,
			strokeWidth: 2
		}),
		/* @__PURE__ */ jsx("line", {
			x1: cx - k,
			y1: cy - k,
			x2: cx + k,
			y2: cy + k,
			stroke: crossStroke,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: cx - k,
			y1: cy + k,
			x2: cx + k,
			y2: cy - k,
			stroke: crossStroke,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M ${cx - r * .62} ${cy - r * .62} A ${r} ${r} 0 0 1 ${cx + r * .18} ${cy - r * .86}`,
			fill: "none",
			stroke: SHEEN,
			strokeWidth: 1.4,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx(GlyphLabel, {
			cx,
			cy,
			bodyH: r,
			label
		})
	] });
}
/**
* DIODE, the exam-standard symbol: a filled triangle (anode, current →) pointing
* right into a vertical bar (cathode). Current flows anode→cathode only; when it is
* forward-biased and `live`, the triangle, bar and leads light up (`conducting`).
*/
function DiodeGlyph({ cx, cy, half, live, label, conducting }) {
	const bw = 16;
	const bh = 13;
	const on = !!(conducting && live);
	const accent = C_DIODE;
	const apex = cx + bw;
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx(Leads, {
			cx,
			cy,
			half,
			bodyHalf: bw,
			live: on
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M ${cx - bw} ${cy - bh} L ${apex} ${cy} L ${cx - bw} ${cy + bh} Z`,
			fill: tint(C_DIODE, on ? 38 : 14),
			stroke: accent,
			strokeWidth: 2,
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: apex,
			y1: cy - bh,
			x2: apex,
			y2: cy + bh,
			stroke: accent,
			strokeWidth: 3,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: cx - bw + 1.5,
			y1: cy - bh + 1.5,
			x2: apex - 1.5,
			y2: cy - 1,
			stroke: SHEEN,
			strokeWidth: 1.4,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx(GlyphLabel, {
			cx,
			cy,
			bodyH: bh,
			label
		})
	] });
}
/**
* AMMETER, the exam-standard meter symbol: a circle on the wire with a centered
* capital "A". Energised circle picks up the live colour; the `reading` (e.g.
* "0.5 A") sits above the body as the value label.
*/
function AmmeterGlyph({ cx, cy, half, live, label, reading }) {
	const r = 17;
	const ring = live ? LIVE : METAL;
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx(Leads, {
			cx,
			cy,
			half,
			bodyHalf: r,
			live
		}),
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r,
			fill: BG,
			stroke: ring,
			strokeWidth: 2
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M ${cx - r * .6} ${cy - r * .45} A ${r} ${r} 0 0 1 ${cx + r * .6} ${cy - r * .45}`,
			fill: "none",
			stroke: SHEEN,
			strokeWidth: 1.4,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("text", {
			x: cx,
			y: cy,
			fill: ring,
			fontSize: 16,
			fontWeight: 700,
			textAnchor: "middle",
			dominantBaseline: "central",
			style: { pointerEvents: "none" },
			children: "A"
		}),
		/* @__PURE__ */ jsx(GlyphLabel, {
			cx,
			cy,
			bodyH: r,
			label: reading ?? label
		})
	] });
}
/**
* JUNCTION DOT, the wire-junction marker: a single filled node placed where
* wires meet to show they are electrically connected (vs. a crossing). Not a
* two-terminal device, so no `Leads`; energised junctions pick up the live colour.
*/
function JunctionDot({ x, y, r = 4, live, color }) {
	return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("circle", {
		cx: x,
		cy: y,
		r,
		fill: live ? color ?? LIVE : METAL
	}), /* @__PURE__ */ jsx("path", {
		d: `M ${x - r * .55} ${y - r * .55} A ${r} ${r} 0 0 1 ${x + r * .55} ${y - r * .55}`,
		fill: "none",
		stroke: SHEEN,
		strokeWidth: 1.2,
		strokeLinecap: "round"
	})] });
}
/**
* NMOS (enhancement) transistor, the exam-standard symbol turned for a circuit:
* DRAIN at top, SOURCE at bottom, GATE out the left. The gate bar is separated from
* the channel by the oxide gap; the channel is the three dashes of an enhancement
* device (normally off); the body arrow points inward (NMOS). When `on`, the channel
* and drain-source path pick up the live colour.
*/
function MosfetGlyph({ cx, cy, half, gateLen = 24, on, live, pmos, label, labelPos = "right" }) {
	const ch = on && live ? LIVE : C_MOS;
	const wire = live ? LIVE : WIRE;
	const gx = cx - 13;
	const chx = cx - 4;
	const ext = cx + 9;
	const top = cy - half, bot = cy + half;
	const gateTermX = gx - gateLen;
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("line", {
			x1: gateTermX,
			y1: cy,
			x2: pmos ? gx - 9 : gx,
			y2: cy,
			stroke: wire,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		pmos && /* @__PURE__ */ jsx("circle", {
			cx: gx - 5,
			cy,
			r: 4,
			fill: BG,
			stroke: C_MOS,
			strokeWidth: 1.6
		}),
		/* @__PURE__ */ jsx("line", {
			x1: gx,
			y1: cy - 13,
			x2: gx,
			y2: cy + 13,
			stroke: C_MOS,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		[
			[-13, -5],
			[-3, 5],
			[7, 13]
		].map(([a, b], i) => /* @__PURE__ */ jsx("line", {
			x1: chx,
			y1: cy + a,
			x2: chx,
			y2: cy + b,
			stroke: ch,
			strokeWidth: 3,
			strokeLinecap: "round"
		}, i)),
		/* @__PURE__ */ jsx("line", {
			x1: chx,
			y1: cy - 9,
			x2: ext,
			y2: cy - 9,
			stroke: ch,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: ext,
			y1: cy - 9,
			x2: ext,
			y2: top,
			stroke: wire,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: chx,
			y1: cy + 9,
			x2: ext,
			y2: cy + 9,
			stroke: ch,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: ext,
			y1: cy + 9,
			x2: ext,
			y2: bot,
			stroke: wire,
			strokeWidth: 2.5,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M ${chx + 9} ${cy + 6} L ${chx + 2} ${cy + 9} L ${chx + 9} ${cy + 12} Z`,
			fill: ch
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: ext,
			cy: top,
			r: 2.6,
			fill: METAL
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: ext,
			cy: bot,
			r: 2.6,
			fill: METAL
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: gateTermX,
			cy,
			r: 2.6,
			fill: METAL
		}),
		label && (labelPos === "top" ? /* @__PURE__ */ jsx("text", {
			x: cx,
			y: top - 7,
			fill: FG,
			fontSize: 11,
			fontWeight: 600,
			textAnchor: "middle",
			style: { pointerEvents: "none" },
			children: label
		}) : /* @__PURE__ */ jsx("text", {
			x: ext + 7,
			y: cy,
			fill: FG,
			fontSize: 11,
			fontWeight: 600,
			textAnchor: "start",
			dominantBaseline: "central",
			style: { pointerEvents: "none" },
			children: label
		}))
	] });
}
/** A thin, crisp wire polyline through pixel points; energised path picks up the live colour (or a
*  per-net `color` override, so a scene can colour each signal so it stays traceable where wires cross). */
function Wire({ points, live, color }) {
	return /* @__PURE__ */ jsx("polyline", {
		points: points.map((p) => `${p[0]},${p[1]}`).join(" "),
		fill: "none",
		stroke: live ? color ?? LIVE : WIRE,
		strokeWidth: 2,
		strokeLinejoin: "round",
		strokeLinecap: "round"
	});
}
/** Orthogonal (right-angle) route from a left source to a right sink, as polyline points for
*  `Wire`: straight when aligned, otherwise out to a mid-x, vertical, then in. One wire model
*  shared by the electronics and logic scenes (no second wire primitive). */
function orthPoints(a, b) {
	if (Math.abs(a.y - b.y) < 1.5) return [[a.x, a.y], [b.x, b.y]];
	const midX = a.x + Math.max(14, (b.x - a.x) * .5);
	return [
		[a.x, a.y],
		[midX, a.y],
		[midX, b.y],
		[b.x, b.y]
	];
}
function pathLength(points) {
	let t = 0;
	for (let i = 1; i < points.length; i++) t += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
	return t;
}
/** Point a fraction t∈[0,1] along a pixel polyline (for placing current dots). */
function pointAlong(points, t) {
	if (points.length < 2) return points[0] ?? [0, 0];
	const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
	const total = segs.reduce((a, b) => a + b, 0) || 1;
	let d = (t % 1 + 1) % 1 * total;
	for (let i = 0; i < segs.length; i++) {
		if (d <= segs[i]) {
			const f = segs[i] ? d / segs[i] : 0;
			const a = points[i], b = points[i + 1];
			return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
		}
		d -= segs[i];
	}
	return points[points.length - 1];
}
/**
* Conventional current as clean, evenly-spaced dots drifting along a wire path.
* Auto-spaces by arc length (one dot per ~`spacing` px) so it reads as flow, not
* noise — Brilliant-style. `phase` (0..1) animates them.
*/
function FlowDots({ points, phase = 0, spacing = 60, r = 3.5 }) {
	const n = Math.max(3, Math.round(pathLength(points) / spacing));
	return /* @__PURE__ */ jsx("g", {
		style: { pointerEvents: "none" },
		children: Array.from({ length: n }, (_, i) => {
			const [x, y] = pointAlong(points, phase + i / n);
			return /* @__PURE__ */ jsx("circle", {
				cx: x,
				cy: y,
				r,
				fill: LIVE
			}, i);
		})
	});
}
function LampGlyph({ cx, cy, brightness, r = 30 }) {
	const b = Math.max(0, Math.min(1, brightness));
	const hot = b > .04;
	const filament = `color-mix(in oklab, var(--stage-metal) ${Math.round((1 - b) * 100)}%, var(--stage-warn))`;
	return /* @__PURE__ */ jsxs("g", { children: [
		hot && /* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: r + 6 + b * 26,
			fill: "url(#stage-grad-thermal)",
			opacity: .18 + .7 * b,
			filter: b > .55 ? "url(#stage-bloom)" : "url(#stage-glow)",
			style: { pointerEvents: "none" }
		}),
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r,
			fill: "var(--stage-bg)",
			stroke: hot ? "var(--stage-warn)" : "var(--stage-metal)",
			strokeWidth: 2.5
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M ${cx - 16} ${cy + 6} q 4 -16 8 0 q 4 16 8 0 q 4 -16 8 0 q 4 16 8 0`,
			fill: "none",
			stroke: filament,
			strokeWidth: hot ? 3 : 2.2,
			strokeLinecap: "round",
			filter: b > .55 ? "url(#stage-bloom)" : void 0
		}),
		b > .6 && /* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: 6 + (b - .6) * 14,
			fill: "white",
			opacity: (b - .6) * 1.6,
			filter: "url(#stage-bloom)",
			style: { pointerEvents: "none" }
		}),
		/* @__PURE__ */ jsx("rect", {
			x: cx - 9,
			y: cy + r - 2,
			width: 18,
			height: 10,
			rx: 2,
			fill: "var(--stage-metal)"
		})
	] });
}
/** An AC (~) or DC (=) source; a halo behind it tracks output magnitude `level` (-1..1). */
function AcDcSourceGlyph({ cx, cy, mode, level, r = 30 }) {
	const live = Math.abs(Math.max(-1, Math.min(1, level)));
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: r + 10,
			fill: "url(#stage-grad-halo)",
			opacity: .25 + .6 * live,
			style: { pointerEvents: "none" }
		}),
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r,
			fill: "var(--stage-bg)",
			stroke: "var(--stage-accent)",
			strokeWidth: 2.5
		}),
		mode === "ac" ? /* @__PURE__ */ jsx("path", {
			d: `M ${cx - 16} ${cy} q 8 -14 16 0 q 8 14 16 0`,
			fill: "none",
			stroke: "var(--stage-accent)",
			strokeWidth: 3,
			strokeLinecap: "round"
		}) : /* @__PURE__ */ jsxs("g", {
			stroke: "var(--stage-accent)",
			strokeLinecap: "round",
			children: [/* @__PURE__ */ jsx("line", {
				x1: cx - 15,
				y1: cy - 6,
				x2: cx + 15,
				y2: cy - 6,
				strokeWidth: 3.5
			}), /* @__PURE__ */ jsx("line", {
				x1: cx - 15,
				y1: cy + 6,
				x2: cx + 15,
				y2: cy + 6,
				strokeWidth: 2,
				strokeDasharray: "4 4"
			})]
		}),
		/* @__PURE__ */ jsx("text", {
			x: cx,
			y: cy + r + 18,
			textAnchor: "middle",
			fontSize: 13,
			fontWeight: 700,
			fill: "var(--stage-accent)",
			children: mode.toUpperCase()
		})
	] });
}

//#endregion
export { AcDcSourceGlyph, AmmeterGlyph, BulbGlyph, CapacitorGlyph, CellGlyph, DiodeGlyph, FlowDots, JunctionDot, LampGlyph, MosfetGlyph, ResistorGlyph, SwitchGlyph, Tag, Wire, orthPoints };