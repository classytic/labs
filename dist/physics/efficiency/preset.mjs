'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/physics/efficiency/preset.tsx
/**
* EfficiencyLab, efficiency as the input→output RATIO you can see. Energy flows in
* on the left and splits into a USEFUL output stream and WASTED streams (usually
* heat), drawn as a Sankey: each ribbon's thickness is its share of the energy, so
* efficiency η = useful / input is literally the fraction of the flow that stays
* green. Compare an incandescent bulb (≈5%) with an LED (≈45%), a petrol engine
* (≈25%) with an electric motor (≈90%), and feel why "wasted as heat" matters.
*
* The device is AUTHORABLE: a creator declares the streams (label, share, useful or
* waste) so the same lab draws any energy-flow / efficiency diagram. Interactive
* resize on every change; press Play to watch the energy actually stream. Pure SVG.
*/
const W = 720, H = 340;
const GREEN = "var(--stage-good, #16a34a)";
const HEAT = "rgb(214,90,60)";
const PRESETS = {
	incandescent: {
		name: "Incandescent bulb",
		streams: [{
			label: "Light",
			share: 5,
			kind: "useful"
		}, {
			label: "Heat",
			share: 95,
			kind: "waste"
		}]
	},
	led: {
		name: "LED bulb",
		streams: [{
			label: "Light",
			share: 45,
			kind: "useful"
		}, {
			label: "Heat",
			share: 55,
			kind: "waste"
		}]
	},
	"petrol-engine": {
		name: "Petrol engine",
		streams: [{
			label: "Motion",
			share: 25,
			kind: "useful"
		}, {
			label: "Heat (exhaust + cooling)",
			share: 75,
			kind: "waste"
		}]
	},
	"electric-motor": {
		name: "Electric motor",
		streams: [{
			label: "Motion",
			share: 90,
			kind: "useful"
		}, {
			label: "Heat",
			share: 10,
			kind: "waste"
		}]
	},
	"power-station": {
		name: "Thermal power station",
		streams: [{
			label: "Electricity",
			share: 40,
			kind: "useful"
		}, {
			label: "Heat (cooling towers)",
			share: 60,
			kind: "waste"
		}]
	},
	human: {
		name: "Human body",
		streams: [{
			label: "Useful work",
			share: 25,
			kind: "useful"
		}, {
			label: "Heat",
			share: 75,
			kind: "waste"
		}]
	}
};
const ORDER = [
	"incandescent",
	"led",
	"petrol-engine",
	"electric-motor",
	"power-station",
	"human"
];
function EfficiencyLab({ device: device0 = "incandescent", deviceName, inputJoules = 100, streams: streamsProp, title = "Efficiency: how much of the energy is useful?", prompt = "Energy in splits into useful output and wasted energy (mostly heat). Efficiency is the fraction that comes out useful: η = useful ÷ input. Compare the devices.", objectives = [
	"Define efficiency as the input→output ratio η = useful energy ÷ total input",
	"Read a Sankey diagram, ribbon thickness is energy share",
	"Compare real devices and see where energy is wasted (heat)"
] } = {}) {
	const [device, setDevice] = useState(device0);
	const tRef = useRef(0);
	const gate = usePlayGate();
	useFrameTick(gate.running, (f) => {
		tRef.current += Math.min(.05, f.dtMs / 1e3);
	});
	const t = tRef.current;
	const preset = PRESETS[device];
	const streams = streamsProp && streamsProp.length ? streamsProp : preset.streams;
	const name = deviceName ?? (streamsProp ? "Device" : preset.name);
	const total = streams.reduce((a, s) => a + Math.max(0, s.share), 0) || 1;
	const usefulFrac = streams.filter((s) => s.kind === "useful").reduce((a, s) => a + s.share, 0) / total;
	const colorOf = (s) => s.color ?? (s.kind === "useful" ? GREEN : HEAT);
	const INX1 = 150, OUTX = 520, TOP = 80, bandH = 300 - TOP;
	const ordered = [...streams].sort((a, b) => a.kind === b.kind ? 0 : a.kind === "useful" ? -1 : 1);
	let yi = TOP;
	const inSeg = ordered.map((s) => {
		const h = s.share / total * bandH;
		const seg = {
			s,
			y0: yi,
			y1: yi + h
		};
		yi += h;
		return seg;
	});
	const usefulH = ordered.filter((s) => s.kind === "useful").reduce((a, s) => a + s.share / total * bandH, 0);
	const GAP = 26;
	let yo = TOP, started = false;
	const outSeg = ordered.map((s) => {
		if (s.kind === "waste" && !started) {
			started = true;
			yo = TOP + usefulH + GAP;
		}
		const h = s.share / total * (bandH - GAP * 0);
		const seg = {
			s,
			y0: yo,
			y1: yo + h
		};
		yo += h;
		return seg;
	});
	const ribbon = (a, b, color) => {
		const mx = 670 / 2;
		return /* @__PURE__ */ jsx("path", {
			d: `M ${INX1} ${a.y0} C ${mx} ${a.y0}, ${mx} ${b.y0}, ${OUTX} ${b.y0} L ${OUTX} ${b.y1} C ${mx} ${b.y1}, ${mx} ${a.y1}, ${INX1} ${a.y1} Z`,
			fill: color,
			fillOpacity: .5
		});
	};
	const flow = [];
	if (gate.playing) inSeg.forEach((seg, k) => {
		const o = outSeg[k];
		const yMidA = (seg.y0 + seg.y1) / 2, yMidB = (o.y0 + o.y1) / 2;
		const n = Math.max(1, Math.round(seg.s.share / total * 14));
		for (let i = 0; i < n; i++) {
			const u = (t * .5 + i / n) % 1;
			const x = INX1 + u * (OUTX - INX1);
			const e = u * u * (3 - 2 * u);
			const y = yMidA + (yMidB - yMidA) * e;
			flow.push(/* @__PURE__ */ jsx("circle", {
				cx: x,
				cy: y,
				r: 2.6,
				fill: colorOf(seg.s),
				opacity: .9
			}, `${k}-${i}`));
		}
	});
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				overflow: "hidden",
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)"
			},
			children: /* @__PURE__ */ jsxs("svg", {
				viewBox: `0 0 ${W} ${H}`,
				width: "100%",
				role: "img",
				"aria-label": `${name}, efficiency ${Math.round(usefulFrac * 100)} percent`,
				children: [
					/* @__PURE__ */ jsx("rect", {
						x: 90,
						y: TOP,
						width: INX1 - 90,
						height: bandH,
						rx: 3,
						fill: "var(--stage-accent, #3b82f6)",
						opacity: .7
					}),
					/* @__PURE__ */ jsx("text", {
						x: 90,
						y: TOP - 10,
						fontSize: 12,
						fontWeight: 700,
						fill: "var(--stage-fg)",
						children: "energy in"
					}),
					/* @__PURE__ */ jsxs("text", {
						x: 90,
						y: 318,
						fontSize: 11,
						fill: "var(--stage-muted)",
						children: [inputJoules, " J (100%)"]
					}),
					inSeg.map((seg, k) => /* @__PURE__ */ jsx("g", { children: ribbon(seg, outSeg[k], colorOf(seg.s)) }, k)),
					flow,
					outSeg.map((seg, k) => {
						const j = seg.s.share / total * inputJoules;
						return /* @__PURE__ */ jsxs("g", { children: [
							/* @__PURE__ */ jsx("rect", {
								x: OUTX,
								y: seg.y0,
								width: 6,
								height: Math.max(2, seg.y1 - seg.y0),
								fill: colorOf(seg.s)
							}),
							/* @__PURE__ */ jsx("text", {
								x: 532,
								y: (seg.y0 + seg.y1) / 2 - 2,
								fontSize: 12,
								fontWeight: 700,
								fill: colorOf(seg.s),
								children: seg.s.label
							}),
							/* @__PURE__ */ jsxs("text", {
								x: 532,
								y: (seg.y0 + seg.y1) / 2 + 13,
								fontSize: 11,
								fill: "var(--stage-muted)",
								style: { fontVariantNumeric: "tabular-nums" },
								children: [
									j.toFixed(0),
									" J · ",
									Math.round(seg.s.share / total * 100),
									"%",
									seg.s.kind === "useful" ? " ✓ useful" : " wasted"
								]
							})
						] }, k);
					})
				]
			})
		})
	});
	const usefulJ = usefulFrac * inputJoules;
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "grid",
					gap: 2,
					fontVariantNumeric: "tabular-nums"
				},
				children: [/* @__PURE__ */ jsxs("span", {
					style: {
						fontWeight: 800,
						fontSize: 20
					},
					children: [
						"η = ",
						Math.round(usefulFrac * 100),
						"%"
					]
				}), /* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 13,
						color: "var(--stage-muted)"
					},
					children: name
				})]
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [/* @__PURE__ */ jsx(Tex, {
				tex: "\\eta = \\dfrac{\\text{useful output}}{\\text{total input}}",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"Of every ",
					/* @__PURE__ */ jsxs("strong", {
						style: { color: "var(--stage-fg)" },
						children: [inputJoules, " J"]
					}),
					" in, ",
					/* @__PURE__ */ jsxs("strong", {
						style: { color: GREEN },
						children: [usefulJ.toFixed(0), " J"]
					}),
					" comes out useful and ",
					/* @__PURE__ */ jsxs("strong", {
						style: { color: HEAT },
						children: [(inputJoules - usefulJ).toFixed(0), " J"]
					}),
					" is wasted (mostly heat). Energy is conserved, efficiency is about how much ends up where you want it."
				]
			})]
		})] }),
		controls: /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "device",
			children: /* @__PURE__ */ jsx("span", {
				className: "lab-field-row",
				style: { flexWrap: "wrap" },
				children: ORDER.map((k) => /* @__PURE__ */ jsx(Chip, {
					selected: device === k,
					onClick: () => setDevice(k),
					children: PRESETS[k].name
				}, k))
			})
		}) }),
		children: figure
	});
}

//#endregion
export { EfficiencyLab };