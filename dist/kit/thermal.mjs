'use client';

import { Fragment, jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/thermal.tsx
const METAL = "var(--stage-metal, #8a8a8a)";
const BG = "var(--stage-bg, #fff)";
const FG = "var(--stage-fg, #222)";
const GLASS = "color-mix(in oklab, var(--stage-fg) 28%, transparent)";
/** Blue (cold) → red (hot) along a 0..1 fraction, in perceptual space. */
function thermalColor(frac) {
	return `color-mix(in oklab, #e23b3b ${(Math.max(0, Math.min(1, frac)) * 100).toFixed(0)}%, #2b7fff)`;
}
function ThermometerGlyph({ cx, top, h, frac, label }) {
	const f = Math.max(0, Math.min(1, frac));
	const bulbR = Math.max(9, h * .085);
	const stemW = bulbR * .85;
	const bulbCy = top + h - bulbR;
	const stemTop = top + bulbR * .5;
	const colBot = bulbCy;
	const colTop = colBot - f * (colBot - stemTop);
	const col = thermalColor(f);
	const ticks = [
		0,
		.25,
		.5,
		.75,
		1
	].map((tk) => colBot - tk * (colBot - stemTop));
	return /* @__PURE__ */ jsxs("g", {
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ jsx("circle", {
				cx,
				cy: bulbCy,
				r: bulbR,
				fill: col,
				stroke: METAL,
				strokeWidth: 2
			}),
			/* @__PURE__ */ jsx("rect", {
				x: cx - stemW / 2,
				y: stemTop,
				width: stemW,
				height: colBot - stemTop,
				rx: stemW / 2,
				fill: BG,
				stroke: METAL,
				strokeWidth: 2
			}),
			/* @__PURE__ */ jsx("rect", {
				x: cx - stemW / 2 + 2.5,
				y: colTop,
				width: stemW - 5,
				height: colBot - colTop,
				fill: col
			}),
			/* @__PURE__ */ jsx("rect", {
				x: cx - stemW / 2 + 2.5,
				y: colBot - 4,
				width: stemW - 5,
				height: bulbR,
				fill: col
			}),
			ticks.map((ty, i) => /* @__PURE__ */ jsx("line", {
				x1: cx + stemW / 2 + 1,
				y1: ty,
				x2: cx + stemW / 2 + (i % 2 ? 5 : 8),
				y2: ty,
				stroke: METAL,
				strokeWidth: 1.5
			}, i)),
			/* @__PURE__ */ jsx("rect", {
				x: cx - stemW / 2 + 3,
				y: stemTop + 3,
				width: 2,
				height: colBot - stemTop - 6,
				rx: 1,
				fill: "color-mix(in oklab, var(--stage-sheen, #fff) 55%, transparent)"
			}),
			label && /* @__PURE__ */ jsx("text", {
				x: cx,
				y: top - 4,
				textAnchor: "middle",
				fontSize: 12,
				fontWeight: 700,
				fill: FG,
				children: label
			})
		]
	});
}
function BeakerGlyph({ x, y, w, h, fillFrac, color, boiling = 0, steam = 0, iceFrac = 0, phase = 0, label }) {
	const innerTop = y + 8;
	const innerBot = y + h - 3;
	const innerH = innerBot - innerTop;
	const liq = Math.max(0, Math.min(1, fillFrac));
	const liquidTop = innerBot - liq * innerH;
	const lx = x + 4, rx = x + w - 4;
	const nB = Math.round(boiling * 10);
	const bubbles = [];
	for (let i = 0; i < nB; i++) {
		const fr = (phase * .7 + i * .137 * 7) % 1;
		const by = innerBot - fr * (innerBot - liquidTop);
		const bx = lx + 8 + i * .41 % 1 * (rx - lx - 16);
		const r = 1.6 + i % 3;
		bubbles.push(/* @__PURE__ */ jsx("circle", {
			cx: bx,
			cy: by,
			r,
			fill: BG,
			opacity: .5 * (1 - fr) + .25
		}, `b${i}`));
	}
	const nIce = iceFrac > .02 ? Math.max(1, Math.round(iceFrac * 5)) : 0;
	const cubes = [];
	for (let i = 0; i < nIce; i++) {
		const s = (7 + i % 2 * 4) * (.5 + .5 * iceFrac);
		const cxp = lx + 10 + (i * .37 + .1) % 1 * (rx - lx - 20);
		const bob = Math.sin(phase * 1.4 + i) * 2;
		const cyp = liquidTop + 3 + bob;
		cubes.push(/* @__PURE__ */ jsxs("g", {
			opacity: .9,
			children: [/* @__PURE__ */ jsx("rect", {
				x: cxp,
				y: cyp,
				width: s,
				height: s,
				rx: 2,
				fill: "color-mix(in oklab, #cfeaff 80%, var(--stage-bg))",
				stroke: "color-mix(in oklab, #2b7fff 40%, transparent)",
				strokeWidth: 1
			}), /* @__PURE__ */ jsx("line", {
				x1: cxp + 2,
				y1: cyp + s * .35,
				x2: cxp + s - 2,
				y2: cyp + s * .35,
				stroke: "color-mix(in oklab, #2b7fff 30%, transparent)",
				strokeWidth: 1
			})]
		}, `i${i}`));
	}
	const wisps = [];
	if (steam > .04) for (let i = 0; i < 3; i++) {
		const sx = x + w * (.3 + i * .2);
		const off = (phase * 18 + i * 13) % 26;
		const o = steam * .5 * (1 - off / 26);
		wisps.push(/* @__PURE__ */ jsx("path", {
			d: `M ${sx} ${y - off} q 6 -8 0 -16 q -6 -8 0 -16`,
			fill: "none",
			stroke: "color-mix(in oklab, var(--stage-fg) 35%, transparent)",
			strokeWidth: 3,
			strokeLinecap: "round",
			opacity: Math.max(0, o)
		}, `s${i}`));
	}
	return /* @__PURE__ */ jsxs("g", { children: [
		wisps,
		liq > .001 && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("rect", {
			x: lx,
			y: liquidTop,
			width: rx - lx,
			height: innerBot - liquidTop,
			fill: color,
			fillOpacity: .45
		}), /* @__PURE__ */ jsx("ellipse", {
			cx: (lx + rx) / 2,
			cy: liquidTop,
			rx: (rx - lx) / 2,
			ry: 4,
			fill: color,
			fillOpacity: .7
		})] }),
		bubbles,
		cubes,
		/* @__PURE__ */ jsx("path", {
			d: `M ${x} ${y} L ${lx} ${innerBot} Q ${x + w / 2} ${y + h + 4} ${rx} ${innerBot} L ${x + w} ${y}`,
			fill: "none",
			stroke: GLASS,
			strokeWidth: 3,
			strokeLinejoin: "round",
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: x - 3,
			y1: y,
			x2: x + w + 3,
			y2: y,
			stroke: METAL,
			strokeWidth: 3,
			strokeLinecap: "round"
		}),
		label && /* @__PURE__ */ jsx("text", {
			x: x + w / 2,
			y: y + h + 22,
			textAnchor: "middle",
			fontSize: 12,
			fontWeight: 700,
			fill: FG,
			children: label
		})
	] });
}
function BurnerGlyph({ cx, baseY, w, level, phase = 0 }) {
	const flame = Math.max(0, level);
	const cold = Math.max(0, -level);
	const flicker = 1 + Math.sin(phase * 9) * .06;
	const fh = flame * (w * 1.5) * flicker;
	const fw = w * .42;
	const tip = baseY - fh;
	const teardrop = (scale, fill, op) => {
		const hw = fw * scale, ht = fh * scale, ty = baseY - ht;
		return /* @__PURE__ */ jsx("path", {
			d: `M ${cx} ${baseY + 3} C ${cx - hw} ${baseY - ht * .4} ${cx - hw * .5} ${ty} ${cx} ${ty} C ${cx + hw * .5} ${ty} ${cx + hw} ${baseY - ht * .4} ${cx} ${baseY + 3} Z`,
			fill,
			opacity: op
		});
	};
	return /* @__PURE__ */ jsxs("g", {
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: cx - w / 2,
				y: baseY,
				width: w,
				height: 9,
				rx: 4,
				fill: METAL
			}),
			/* @__PURE__ */ jsx("rect", {
				x: cx - w / 2 - 4,
				y: baseY + 9,
				width: w + 8,
				height: 4,
				rx: 2,
				fill: "color-mix(in oklab, var(--stage-metal) 70%, var(--stage-bg))"
			}),
			flame > .02 && /* @__PURE__ */ jsxs(Fragment, { children: [
				teardrop(1.25, "color-mix(in oklab, var(--stage-warn, #e0a020) 55%, transparent)", .35),
				teardrop(1, "var(--stage-warn, #e0a020)", .9),
				teardrop(.6, "color-mix(in oklab, #ffd23b 80%, var(--stage-warn))", .95),
				teardrop(.28, "color-mix(in oklab, #fff 75%, #ffd23b)", .95),
				/* @__PURE__ */ jsx("circle", {
					cx,
					cy: tip,
					r: 1.5,
					fill: "#fff",
					opacity: .8
				})
			] }),
			cold > .02 && /* @__PURE__ */ jsx("g", {
				opacity: .5 + cold * .45,
				stroke: "color-mix(in oklab, #2b7fff 70%, var(--stage-bg))",
				strokeWidth: 2,
				strokeLinecap: "round",
				children: [
					-1,
					0,
					1
				].map((k) => {
					const sx = cx + k * w * .28, len = 10 + cold * 12;
					return /* @__PURE__ */ jsxs("g", { children: [
						/* @__PURE__ */ jsx("line", {
							x1: sx,
							y1: baseY + 14,
							x2: sx,
							y2: baseY + 14 + len
						}),
						/* @__PURE__ */ jsx("line", {
							x1: sx - 4,
							y1: baseY + 18,
							x2: sx + 4,
							y2: baseY + 22
						}),
						/* @__PURE__ */ jsx("line", {
							x1: sx + 4,
							y1: baseY + 18,
							x2: sx - 4,
							y2: baseY + 22
						})
					] }, k);
				})
			})
		]
	});
}

//#endregion
export { BeakerGlyph, BurnerGlyph, ThermometerGlyph, thermalColor };