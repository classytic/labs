'use client';

import { jsx, jsxs } from "react/jsx-runtime";
import { useCoords } from "@classytic/stage";

//#region src/kit/scale.tsx
const GRAD = "url(#stage-grad-metal)";
const EDGE = "color-mix(in oklab, var(--stage-metal) 60%, black)";
const SHEEN = "color-mix(in oklab, var(--stage-sheen) 70%, transparent)";
const SHADE = "color-mix(in oklab, var(--stage-metal) 62%, black)";
const GOOD = "var(--stage-good)";
/** A solid rectangular bar (metal rod) between two points, reads as a rigid
*  strut, not a string. Returns an SVG path for a filled quad of width `w`. */
function barPath(x1, y1, x2, y2, w) {
	const dx = x2 - x1, dy = y2 - y1;
	const len = Math.hypot(dx, dy) || 1;
	const nx = -dy / len * (w / 2);
	const ny = dx / len * (w / 2);
	return `M ${x1 + nx} ${y1 + ny} L ${x2 + nx} ${y2 + ny} L ${x2 - nx} ${y2 - ny} L ${x1 - nx} ${y1 - ny} Z`;
}
function ScaleFrame({ pivot, beamA, beamB, trayLC, trayRC, baseY, panR, balanced }) {
	const c = useCoords();
	const P = (v) => c.toPx(v.x, v.y);
	const [pivx, pivy] = P(pivot);
	const [bax, bay] = P(beamA);
	const [bbx, bby] = P(beamB);
	const [, basey] = P({
		x: pivot.x,
		y: baseY
	});
	const beamAngle = Math.atan2(bby - bay, bbx - bax) * 180 / Math.PI;
	const beamLen = Math.hypot(bbx - bax, bby - bay);
	const rxPan = c.sx(panR);
	const beamH = 13;
	const halfW = beamLen / 2 + 7;
	const colTopHalf = 7;
	const colBotHalf = 12;
	const baseRx = Math.max(30, colBotHalf * 2.6);
	const Pan = ({ cx, cy, ex, ey, k }) => {
		const ry = rxPan * .24;
		const depth = rxPan * .5;
		const rimL = cx - rxPan * .66;
		const rimR = cx + rxPan * .66;
		const body = `M ${cx - rxPan} ${cy} C ${cx - rxPan} ${cy + depth * .95} ${cx - rxPan * .5} ${cy + depth} ${cx} ${cy + depth} C ${cx + rxPan * .5} ${cy + depth} ${cx + rxPan} ${cy + depth * .95} ${cx + rxPan} ${cy} Z`;
		return /* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx("path", {
				d: barPath(ex, ey, rimL, cy, 3.6),
				fill: GRAD,
				stroke: EDGE,
				strokeWidth: .6,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: barPath(ex, ey, rimR, cy, 3.6),
				fill: GRAD,
				stroke: EDGE,
				strokeWidth: .6,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("path", {
				d: body,
				fill: GRAD,
				stroke: EDGE,
				strokeWidth: .9,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("ellipse", {
				cx,
				cy,
				rx: rxPan,
				ry,
				fill: SHADE,
				stroke: EDGE,
				strokeWidth: .75
			}),
			/* @__PURE__ */ jsx("path", {
				d: `M ${cx - rxPan} ${cy} A ${rxPan} ${ry} 0 0 0 ${cx + rxPan} ${cy}`,
				fill: "none",
				stroke: SHEEN,
				strokeWidth: 1.4,
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: rimL,
				cy,
				r: 2.7,
				fill: GRAD,
				stroke: EDGE,
				strokeWidth: .7
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: rimR,
				cy,
				r: 2.7,
				fill: GRAD,
				stroke: EDGE,
				strokeWidth: .7
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: ex,
				cy: ey,
				r: 3.8,
				fill: GRAD,
				stroke: EDGE,
				strokeWidth: .9
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: ex - 1.2,
				cy: ey - 1.3,
				r: 1.3,
				fill: SHEEN
			})
		] }, k);
	};
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("ellipse", {
			cx: pivx,
			cy: basey,
			rx: baseRx,
			ry: 9,
			fill: GRAD,
			stroke: EDGE,
			strokeWidth: .9
		}),
		/* @__PURE__ */ jsx("ellipse", {
			cx: pivx,
			cy: basey - 4,
			rx: baseRx * .62,
			ry: 6,
			fill: GRAD,
			stroke: EDGE,
			strokeWidth: .75
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M ${pivx - colTopHalf} ${pivy} L ${pivx + colTopHalf} ${pivy} L ${pivx + colBotHalf} ${basey - 3} Q ${pivx + colBotHalf} ${basey} ${pivx + colBotHalf - 3} ${basey} L ${pivx - colBotHalf + 3} ${basey} Q ${pivx - colBotHalf} ${basey} ${pivx - colBotHalf} ${basey - 3} Z`,
			fill: GRAD,
			stroke: EDGE,
			strokeWidth: .9,
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: pivx - colTopHalf + 2,
			y1: pivy + 2,
			x2: pivx - colBotHalf + 3,
			y2: basey - 3,
			stroke: SHEEN,
			strokeWidth: 1.3,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx(Pan, {
			cx: P(trayLC)[0],
			cy: P(trayLC)[1],
			ex: bax,
			ey: bay,
			k: "L"
		}),
		/* @__PURE__ */ jsx(Pan, {
			cx: P(trayRC)[0],
			cy: P(trayRC)[1],
			ex: bbx,
			ey: bby,
			k: "R"
		}),
		/* @__PURE__ */ jsxs("g", {
			transform: `rotate(${beamAngle} ${pivx} ${pivy})`,
			children: [
				balanced && /* @__PURE__ */ jsx("rect", {
					x: pivx - halfW - 3,
					y: pivy - beamH / 2 - 3,
					width: halfW * 2 + 6,
					height: 19,
					rx: 19 / 2,
					fill: GOOD,
					opacity: .18
				}),
				/* @__PURE__ */ jsx("rect", {
					x: pivx - halfW,
					y: pivy - beamH / 2,
					width: halfW * 2,
					height: beamH,
					rx: beamH / 2,
					fill: balanced ? GOOD : GRAD,
					stroke: EDGE,
					strokeWidth: .9
				}),
				/* @__PURE__ */ jsx("rect", {
					x: pivx - halfW + 4,
					y: pivy - beamH / 2 + 1.5,
					width: halfW * 2 - 8,
					height: 2.4,
					rx: 1.2,
					fill: SHEEN
				})
			]
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: bax,
			cy: bay,
			r: 4,
			fill: balanced ? GOOD : GRAD,
			stroke: EDGE,
			strokeWidth: .9
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: bbx,
			cy: bby,
			r: 4,
			fill: balanced ? GOOD : GRAD,
			stroke: EDGE,
			strokeWidth: .9
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: pivx,
			cy: pivy,
			r: 7.5,
			fill: GRAD,
			stroke: EDGE,
			strokeWidth: 1
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: pivx - 2.2,
			cy: pivy - 2.4,
			r: 2,
			fill: SHEEN
		})
	] });
}

//#endregion
export { ScaleFrame };