'use client';

import { clamp } from "../../core/util.mjs";
import { useFrameTick, useReducedMotionDeferred } from "../../kit/anim.mjs";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { CanvasLayer, useInView } from "@classytic/stage";

//#region src/chem/solution/field.tsx
/**
* SolutionField, the SHARED "solute dots in a solution box" primitive (single
* source of truth for the concentration family). Both SolutionBoxLab and
* DilutionLab compose it, so the dot-field, density tint, Brownian jitter and the
* draggable probe live in exactly ONE place.
*
* GENERIC on purpose: it takes a dot COUNT + a fill fraction (the liquid's share
* of the box = volume) + a tint 0..1, the chemistry (moles→dots, M→tint) is the
* lab's job, not the field's. Dots hold fixed fractional positions so growing the
* box spreads the SAME dots apart (dilution = spreading, never removing). SVG-free
* CanvasLayer; deterministic seed (no Math.random at render) so SSR == client;
* jitter + probe run client-side; honours prefers-reduced-motion.
*/
const MAXDOTS = 260;
const PAD = .06;
function SolutionField({ dots, fill, tint, hue = 178, height = 230, showProbe = false, animate = true, ariaLabel = "solution" }) {
	const n = clamp(Math.round(dots), 0, MAXDOTS);
	const seeds = useRef([]);
	const probe = useRef({
		x: .22,
		y: .5
	});
	const [mounted, setMounted] = useState(false);
	const reduce = useReducedMotionDeferred();
	const { ref: viewRef, inView } = useInView();
	useEffect(() => {
		setMounted(true);
	}, []);
	if (seeds.current.length === 0) {
		const pool = [];
		for (let i = 0; i < MAXDOTS; i++) {
			const fx = i * .61803398875 % 1;
			const fy = (i * .38196601125 + .13) % 1;
			const a = i * 2.39996 % (Math.PI * 2);
			pool.push({
				fx,
				fy,
				vx: Math.cos(a),
				vy: Math.sin(a)
			});
		}
		seeds.current = pool;
	}
	const repaint = useFrameTick(mounted && animate && !reduce && inView, (f) => {
		const dt = Math.min(.05, f.dtMs / 1e3);
		for (let i = 0; i < n; i++) {
			const s = seeds.current[i];
			s.fx = clamp(s.fx + s.vx * dt * .06, 0, 1);
			s.fy = clamp(s.fy + s.vy * dt * .09, 0, 1);
			if (s.fx <= 0 || s.fx >= 1) s.vx *= -1;
			if (s.fy <= 0 || s.fy >= 1) s.vy *= -1;
		}
	});
	const PROBE = .2;
	let probeCount = 0;
	const fillW = clamp(fill, .12, 1);
	for (let i = 0; i < n; i++) {
		const s = seeds.current[i];
		const bx = PAD * fillW + s.fx * (fillW - 2 * PAD * fillW);
		const by = PAD + s.fy * (1 - 2 * PAD);
		if (Math.abs(bx - probe.current.x) < PROBE / 2 && Math.abs(by - probe.current.y) < PROBE / 2) probeCount++;
	}
	const draw = (ctx, c) => {
		const [bx0, by0] = c.toPx(0, 1);
		const [bx1, by1] = c.toPx(1, 0);
		const W = bx1 - bx0, Hh = by1 - by0;
		ctx.clearRect(bx0 - 4, by0 - 4, W + 8, Hh + 8);
		const liqW = clamp(fill, .12, 1) * W;
		ctx.fillStyle = `hsl(${hue} 70% 50% / ${(.1 + .55 * clamp(tint, 0, 1)).toFixed(3)})`;
		ctx.fillRect(bx0, by0, liqW, Hh);
		ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--stage-fg").trim() || "#333";
		ctx.globalAlpha = .5;
		ctx.lineWidth = 2;
		ctx.strokeRect(bx0, by0, W, Hh);
		ctx.globalAlpha = 1;
		ctx.fillStyle = `hsl(${hue} 75% 38%)`;
		const fw = clamp(fill, .12, 1);
		for (let i = 0; i < n; i++) {
			const s = seeds.current[i];
			const px = bx0 + (PAD * fw + s.fx * (fw - 2 * PAD * fw)) * W;
			const py = by0 + (PAD + s.fy * (1 - 2 * PAD)) * Hh;
			ctx.beginPath();
			ctx.arc(px, py, 3.2, 0, Math.PI * 2);
			ctx.fill();
		}
		if (showProbe) {
			ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--stage-accent").trim() || "#3b82f6";
			ctx.lineWidth = 2;
			ctx.strokeRect(bx0 + (probe.current.x - PROBE / 2) * W, by0 + (probe.current.y - PROBE / 2) * Hh, PROBE * W, PROBE * Hh);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		ref: viewRef,
		style: { position: "relative" },
		children: [/* @__PURE__ */ jsx(CanvasLayer, {
			view: {
				xMin: 0,
				xMax: 1,
				yMin: 0,
				yMax: 1
			},
			height,
			draw,
			onPointerMath: showProbe ? (m) => {
				probe.current = {
					x: clamp(m[0], PROBE / 2, 1 - PROBE / 2),
					y: clamp(m[1], PROBE / 2, 1 - PROBE / 2)
				};
				repaint();
			} : void 0,
			ariaLabel
		}), showProbe && /* @__PURE__ */ jsxs("span", {
			style: {
				position: "absolute",
				top: 8,
				right: 10,
				fontSize: 12,
				fontWeight: 700,
				fontVariantNumeric: "tabular-nums",
				background: "color-mix(in oklab, var(--stage-bg) 80%, transparent)",
				border: "1px solid var(--stage-grid)",
				borderRadius: 8,
				padding: "2px 8px",
				color: "var(--stage-accent)"
			},
			children: [
				"probe: ",
				probeCount,
				" dots"
			]
		})]
	});
}

//#endregion
export { SolutionField };