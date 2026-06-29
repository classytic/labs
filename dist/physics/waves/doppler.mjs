'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useHints } from "../../kit/pedagogy.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { CanvasLayer, useControlSurface } from "@classytic/stage";

//#region src/physics/waves/doppler.tsx
/**
* DopplerLab, why a passing siren drops in pitch. A source glides across the tank
* emitting wavefronts at a steady rate; because it CHASES its own waves, the fronts
* bunch up ahead (shorter λ → higher pitch) and spread out behind (longer λ → lower
* pitch). Crank the speed past the wave speed (Mach > 1) and the fronts pile into a
* shock CONE, the sonic boom. A fixed listener hears the classic high→low sweep as
* the source approaches then recedes; 🔊 plays that Doppler-shifted tone for real.
*
*   f_observed = f_source · c / (c − v_radial)
*
* Animated wavefront field on <CanvasLayer>; play-gated; honours reduced-motion.
*/
const VIEW = {
	xMin: 0,
	xMax: 1,
	yMin: 0,
	yMax: 1
};
const C = 150;
const FEMIT = 1.6;
function DopplerLab({ mach = .6, title = "Doppler effect", prompt, objectives, hints: hintList, controlId, height = 320 }) {
	const [M, setM] = useState(mach);
	const [sound, setSound] = useState(false);
	const [mounted, setMounted] = useState(false);
	const hints = useHints(hintList);
	const gate = usePlayGate();
	const sim = useRef(0);
	const sx = useRef(-.05);
	const emitAcc = useRef(0);
	const fronts = useRef([]);
	const obs = useRef({
		x: .5,
		y: .82
	});
	const fObs = useRef(1);
	const audio = useRef(null);
	useEffect(() => {
		setMounted(true);
	}, []);
	const stopAudio = useCallback(() => {
		try {
			audio.current?.osc.stop();
		} catch {}
		audio.current?.ctx.close();
		audio.current = null;
	}, []);
	useEffect(() => stopAudio, [stopAudio]);
	useEffect(() => {
		if (!sound) {
			stopAudio();
			return;
		}
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const gain = ctx.createGain();
		gain.gain.value = .07;
		gain.connect(ctx.destination);
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.value = 420;
		osc.connect(gain);
		osc.start();
		audio.current = {
			ctx,
			osc,
			gain
		};
		return () => {
			try {
				osc.stop();
			} catch {}
			ctx.close();
			audio.current = null;
		};
	}, [sound, stopAudio]);
	useFrameTick(gate.running && mounted, (frame) => {
		const dt = Math.min(.04, frame.dtMs / 1e3);
		sim.current += dt;
		const vfrac = M * C / 600;
		sx.current += vfrac * dt;
		if (sx.current > 1.08) {
			sx.current = -.08;
			fronts.current = [];
		}
		emitAcc.current += dt;
		while (emitAcc.current >= 1 / FEMIT) {
			emitAcc.current -= 1 / FEMIT;
			fronts.current.push({
				x: sx.current,
				y: .4,
				t: sim.current
			});
		}
		if (fronts.current.length > 40) fronts.current.splice(0, fronts.current.length - 40);
		const dx = (obs.current.x - sx.current) * 600, dy = (obs.current.y - .4) * height, d = Math.hypot(dx, dy) || 1;
		const vr = M * C * (dx / d);
		fObs.current = C / Math.max(40, C - vr);
		if (sound && audio.current) audio.current.osc.frequency.value = 420 * fObs.current;
	});
	const draw = (ctx, _c) => {
		const css = getComputedStyle(ctx.canvas);
		const tok = (n, fb) => css.getPropertyValue(n).trim() || fb, acc = tok("--stage-accent", "#1c7ed6"), warn = tok("--stage-warn", "#e8a020"), good = tok("--stage-good", "#2f9e44"), fg = tok("--stage-fg", "#222");
		tok("--stage-grid", "#bbb");
		const W = ctx.canvas.clientWidth || 640, H = height;
		ctx.clearRect(0, 0, W, H);
		const now = sim.current, sourceY = .4 * H;
		for (const fr of fronts.current) {
			const r = C * (now - fr.t);
			if (r < 4 || r > Math.hypot(W, H)) continue;
			ctx.strokeStyle = acc;
			ctx.globalAlpha = Math.max(.12, 1 - r / Math.hypot(W, H));
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(fr.x * W, fr.y * H, r, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
		if (M > 1) {
			const sxp = sx.current * W;
			const ang = Math.asin(1 / M);
			ctx.strokeStyle = warn;
			ctx.lineWidth = 2;
			ctx.setLineDash([6, 4]);
			for (const s of [-1, 1]) {
				ctx.beginPath();
				ctx.moveTo(sxp, sourceY);
				ctx.lineTo(sxp - Math.cos(ang) * W, sourceY + s * Math.sin(ang) * W);
				ctx.stroke();
			}
			ctx.setLineDash([]);
		}
		ctx.fillStyle = warn;
		ctx.beginPath();
		ctx.arc(sx.current * W, sourceY, 7, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = good;
		ctx.beginPath();
		ctx.arc(obs.current.x * W, obs.current.y * H, 7, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = fg;
		ctx.font = "11px ui-sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("🔊 source", sx.current * W, sourceY - 12);
		ctx.fillText("👂 listener", obs.current.x * W, obs.current.y * H + 20);
	};
	useControlSurface(controlId, {
		mach: {
			type: "number",
			label: "speed (Mach)",
			min: 0,
			max: 1.6,
			step: .05,
			get: () => M,
			set: setM
		},
		sound: {
			type: "boolean",
			label: "sound",
			get: () => sound,
			set: setSound
		}
	});
	const ahead = M < 1 ? 1 / (1 - M) : Infinity, behind = 1 / (1 + M);
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				overflow: "hidden",
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)"
			},
			children: /* @__PURE__ */ jsx(CanvasLayer, {
				view: VIEW,
				height,
				draw,
				ariaLabel: `Doppler, Mach ${M.toFixed(2)}`
			})
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "lab-field-label",
					children: ["Mach ", /* @__PURE__ */ jsx(Tex$1, { tex: "= v_\\text{source} / c" })]
				}),
				/* @__PURE__ */ jsx("span", {
					className: "lab-callout-big",
					children: M.toFixed(2)
				}),
				/* @__PURE__ */ jsx("div", {
					style: {
						fontSize: 12,
						fontWeight: 700,
						color: M >= 1 ? "var(--stage-warn)" : "var(--stage-muted)"
					},
					children: M >= 1 ? "💥 shock cone (sonic boom)" : "subsonic"
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				fontSize: 13,
				display: "grid",
				gap: 3
			},
			children: [
				/* @__PURE__ */ jsxs("span", { children: ["ahead (approaching): pitch ×", /* @__PURE__ */ jsx("b", {
					style: { color: "var(--stage-warn)" },
					children: M < 1 ? ahead.toFixed(2) : "∞"
				})] }),
				/* @__PURE__ */ jsxs("span", { children: ["behind (receding): pitch ×", /* @__PURE__ */ jsx("b", {
					style: { color: "var(--stage-accent)" },
					children: behind.toFixed(2)
				})] }),
				/* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: ["at the listener now: ×", fObs.current.toFixed(2)]
				})
			]
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "speed (Mach)",
			value: M.toFixed(2),
			children: /* @__PURE__ */ jsx(Slider, {
				value: M,
				min: 0,
				max: 1.6,
				step: .05,
				onChange: setM,
				ariaLabel: "source speed"
			})
		}), /* @__PURE__ */ jsx(Chip, {
			selected: sound,
			onClick: () => setSound((s) => !s),
			children: "🔊 hear the pass-by"
		})] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { DopplerLab };