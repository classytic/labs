'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, HintLadder, useChallenge, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { antinodes, beatFreq, harmonicWavelength, nodes, period, speed, standingY, sumY, waveOmega, waveY } from "./core.mjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { CanvasLayer, useControlSurface, useFrameLoop } from "@classytic/stage";

//#region src/physics/waves/preset.tsx
/**
* WaveLab, one playground for the whole of waves, animated on <CanvasLayer>.
*   • travelling, a wave you SHAPE (amplitude, wavelength, frequency); v = fλ falls
*     out live, with λ and A marked right on the wave.
*   • superpose , two waves add; line them up (constructive, 2A) or oppose them
*     (destructive, flat), or detune the second → BEATS (a throbbing envelope).
*   • standing  , two opposite waves lock into a standing wave: fixed NODES (never
*     move) and ANTINODES (max swing), with a harmonic selector (λ = 2L/n).
* Optional 🔊 maps the frequency into the audible range (two tones in beats mode, so
* you HEAR the wah-wah). All maths from the wave kernel; honours reduced-motion.
*/
const L = 10;
const view = {
	xMin: 0,
	xMax: L,
	yMin: -6,
	yMax: 6
};
const ACC = "--stage-accent", GOOD = "--stage-good", WARN = "--stage-warn", MUT = "--stage-muted", FG = "--stage-fg";
const WAVES_CHALLENGE = [{
	id: "speed",
	prompt: "Double the frequency f while keeping the wavelength λ fixed. The wave speed v…",
	choices: [
		{
			value: "double",
			label: "doubles"
		},
		{
			value: "same",
			label: "is unchanged"
		},
		{
			value: "half",
			label: "halves"
		}
	],
	answer: "double",
	explain: "v = fλ, so at fixed λ doubling f doubles the speed."
}, {
	id: "destructive",
	prompt: "Two equal waves exactly out of phase (offset ½λ) add up to…",
	choices: [
		{
			value: "cancel",
			label: "a flat line (cancel)"
		},
		{
			value: "double",
			label: "double the amplitude"
		},
		{
			value: "same",
			label: "one unchanged wave"
		}
	],
	answer: "cancel",
	explain: "Crest meets trough everywhere → destructive interference, so they cancel to flat."
}];
function WaveLab({ mode: mode0 = "travelling", amplitude = 2, wavelength = 4, frequency = 1, title = "Waves", prompt, objectives, hints: hintList, controlId, height = 300 }) {
	const [mode, setMode] = useState(mode0);
	const [A, setA] = useState(amplitude);
	const [lam, setLam] = useState(wavelength);
	const [f, setF] = useState(frequency);
	const [f2, setF2] = useState(frequency);
	const [phase, setPhase] = useState(0);
	const [nH, setNH] = useState(3);
	const [sound, setSound] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [tick, setTick] = useState(0);
	const t = useRef(0);
	const hints = useHints(hintList);
	const gate = usePlayGate();
	const challenge = useChallenge(WAVES_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "waves"
	});
	useEffect(() => {
		setMounted(true);
	}, []);
	const audio = useRef(null);
	const hz = (fr) => 180 + fr * 130;
	const stopAudio = useCallback(() => {
		audio.current?.osc.forEach((o) => {
			try {
				o.stop();
			} catch {}
		});
		audio.current?.ctx.close();
		audio.current = null;
	}, []);
	useEffect(() => () => stopAudio(), [stopAudio]);
	useEffect(() => {
		if (!sound) {
			stopAudio();
			return;
		}
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const gain = ctx.createGain();
		gain.gain.value = .08;
		gain.connect(ctx.destination);
		const osc = (mode === "superpose" ? [f, f2] : [f]).map((fr) => {
			const o = ctx.createOscillator();
			o.type = "sine";
			o.frequency.value = hz(fr);
			o.connect(gain);
			o.start();
			return o;
		});
		audio.current = {
			ctx,
			gain,
			osc
		};
		return () => {
			osc.forEach((o) => {
				try {
					o.stop();
				} catch {}
			});
			ctx.close();
			audio.current = null;
		};
	}, [
		sound,
		mode,
		f,
		f2,
		stopAudio
	]);
	useFrameLoop((frame) => {
		t.current += frame.dtMs / 1e3;
		setTick((x) => x + 1 & 16777215);
	}, { running: gate.running && mounted });
	const primary = {
		amp: A,
		wavelength: lam,
		freq: f
	};
	const lamStanding = harmonicWavelength(L, nH);
	const v = mode === "standing" ? f * lamStanding : speed(primary);
	const draw = useCallback((ctx, c) => {
		const css = getComputedStyle(ctx.canvas);
		const tok = (n, fb) => css.getPropertyValue(n).trim() || fb;
		tok(FG, "#222");
		const acc = tok(ACC, "#1c7ed6"), good = tok(GOOD, "#2f9e44"), warn = tok(WARN, "#e8a020"), mut = tok(MUT, "#888");
		const W = ctx.canvas.clientWidth || 640, Hh = height;
		ctx.clearRect(0, 0, W, Hh);
		const [, y0] = c.toPx(0, 0);
		ctx.strokeStyle = mut;
		ctx.globalAlpha = .5;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(c.toPx(0, 0)[0], y0);
		ctx.lineTo(c.toPx(L, 0)[0], y0);
		ctx.stroke();
		ctx.globalAlpha = 1;
		const tnow = t.current;
		const curve = (fn, color, width, alpha = 1) => {
			ctx.strokeStyle = color;
			ctx.lineWidth = width;
			ctx.globalAlpha = alpha;
			ctx.beginPath();
			for (let i = 0; i <= 320; i++) {
				const x = i / 320 * L;
				const [px, py] = c.toPx(x, fn(x));
				i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
			}
			ctx.stroke();
			ctx.globalAlpha = 1;
		};
		if (mode === "travelling") {
			curve((x) => waveY(primary, x, tnow), acc, 3);
			let x0 = (Math.PI / 2 + waveOmega(f) * tnow) / (2 * Math.PI / lam) % lam;
			if (x0 < .6) x0 += lam;
			const x1 = x0 + lam;
			if (x1 <= L) {
				const yTop = c.toPx(0, A + .8)[1];
				ctx.strokeStyle = warn;
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.moveTo(c.toPx(x0, 0)[0], yTop);
				ctx.lineTo(c.toPx(x1, 0)[0], yTop);
				ctx.stroke();
				ctx.fillStyle = warn;
				ctx.font = "bold 12px ui-sans-serif";
				ctx.textAlign = "center";
				ctx.fillText("λ", c.toPx((x0 + x1) / 2, 0)[0], yTop - 4);
			}
			const ax = .6;
			ctx.strokeStyle = good;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(c.toPx(ax, 0)[0], y0);
			ctx.lineTo(c.toPx(ax, A)[0], c.toPx(ax, A)[1]);
			ctx.stroke();
			ctx.fillStyle = good;
			ctx.textAlign = "left";
			ctx.fillText("A", c.toPx(ax, A / 2)[0] + 4, c.toPx(ax, A / 2)[1]);
		} else if (mode === "superpose") {
			const w1 = primary, w2 = {
				amp: A,
				wavelength: lam,
				freq: f2,
				phase: phase * Math.PI
			};
			curve((x) => waveY(w1, x, tnow), acc, 1.5, .45);
			curve((x) => waveY(w2, x, tnow), warn, 1.5, .45);
			curve((x) => sumY([w1, w2], x, tnow), good, 3);
		} else {
			const kk = nH * Math.PI / L;
			const env = (x) => 2 * A * Math.sin(kk * x);
			curve((x) => env(x), mut, 1, .4);
			curve((x) => -env(x), mut, 1, .4);
			curve((x) => standingY(A, L, nH, f, x, tnow), acc, 3);
			for (const xn of nodes(L, nH)) {
				const [px] = c.toPx(xn, 0);
				ctx.fillStyle = warn;
				ctx.beginPath();
				ctx.arc(px, y0, 4, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.fillStyle = good;
			ctx.font = "10px ui-sans-serif";
			ctx.textAlign = "center";
			for (const xa of antinodes(L, nH)) ctx.fillText("●", c.toPx(xa, 0)[0], y0);
			ctx.fillStyle = warn;
			ctx.font = "11px ui-sans-serif";
			ctx.fillText("nodes ▼", c.toPx(nodes(L, nH)[1] ?? 1, 0)[0], y0 + 18);
		}
	}, [
		mode,
		A,
		lam,
		f,
		f2,
		phase,
		nH,
		height,
		tick
	]);
	useControlSurface(controlId, {
		mode: {
			type: "enum",
			label: "mode",
			options: [
				"travelling",
				"superpose",
				"standing"
			],
			get: () => mode,
			set: (m) => setMode(m)
		},
		amplitude: {
			type: "number",
			label: "amplitude",
			min: .5,
			max: 2.5,
			step: .1,
			get: () => A,
			set: setA
		},
		wavelength: {
			type: "number",
			label: "wavelength",
			min: 1,
			max: 8,
			step: .1,
			get: () => lam,
			set: setLam
		},
		frequency: {
			type: "number",
			label: "frequency",
			min: .2,
			max: 3,
			step: .1,
			get: () => f,
			set: setF
		},
		run: {
			type: "action",
			label: gate.playing ? "pause" : "play",
			invoke: () => gate.setPlaying(!gate.playing)
		},
		sound: {
			type: "boolean",
			label: "sound",
			get: () => sound,
			set: setSound
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
			children: /* @__PURE__ */ jsx(CanvasLayer, {
				view,
				height,
				draw,
				ariaLabel: `${mode} wave, v=fλ=${v.toFixed(2)}`
			})
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsxs(Callout, {
				tone: "result",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "lab-field-label",
						children: ["wave speed ", /* @__PURE__ */ jsx(Tex$1, { tex: "v = f\\lambda" })]
					}),
					/* @__PURE__ */ jsx("span", {
						className: "lab-callout-big",
						children: v.toFixed(2)
					}),
					/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 12,
							color: "var(--stage-muted)"
						},
						children: mode === "standing" ? `${f.toFixed(1)} · ${lamStanding.toFixed(2)} · T=${period(f).toFixed(2)}` : `${f.toFixed(1)} · ${lam.toFixed(1)} · T=${period(f).toFixed(2)}`
					})
				]
			}),
			mode === "superpose" && /* @__PURE__ */ jsx("p", {
				className: "lab-prompt",
				style: { fontSize: 13 },
				children: Math.abs(f - f2) < .05 ? Math.abs(phase % 2) < .05 ? "In phase → constructive (amplitude doubles)." : Math.abs(Math.abs(phase % 2) - 1) < .05 ? "Opposite phase → destructive (they cancel)." : "Partly in phase." : /* @__PURE__ */ jsxs(Fragment$1, { children: [
					"Detuned → ",
					/* @__PURE__ */ jsx("b", { children: "beats" }),
					" at ",
					/* @__PURE__ */ jsx(Tex$1, { tex: "|f_1 - f_2|" }),
					" = ",
					beatFreq(f, f2).toFixed(2),
					" (the throbbing envelope)."
				] })
			}),
			mode === "standing" && /* @__PURE__ */ jsxs("p", {
				className: "lab-prompt",
				style: { fontSize: 13 },
				children: [
					"Harmonic n=",
					nH,
					": ",
					nH,
					" antinode",
					nH === 1 ? "" : "s",
					", ",
					nH + 1,
					" nodes, ",
					/* @__PURE__ */ jsx(Tex$1, { tex: "\\lambda = \\tfrac{2L}{n}" }),
					" = ",
					lamStanding.toFixed(2),
					". Nodes never move; antinodes swing hardest."
				]
			})
		] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "view",
				children: /* @__PURE__ */ jsx("span", {
					style: {
						display: "flex",
						gap: 6,
						flexWrap: "wrap"
					},
					children: [
						"travelling",
						"superpose",
						"standing"
					].map((m) => /* @__PURE__ */ jsx(Chip, {
						selected: mode === m,
						onClick: () => setMode(m),
						children: m
					}, m))
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "amplitude",
				value: A.toFixed(1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: A,
					min: .5,
					max: 2.5,
					step: .1,
					onChange: setA,
					ariaLabel: "amplitude"
				})
			}),
			mode !== "standing" && /* @__PURE__ */ jsx(Field, {
				label: "wavelength",
				value: lam.toFixed(1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: lam,
					min: 1,
					max: 8,
					step: .1,
					onChange: setLam,
					ariaLabel: "wavelength"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "frequency",
				value: f.toFixed(1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: f,
					min: .2,
					max: 3,
					step: .1,
					onChange: setF,
					ariaLabel: "frequency"
				})
			}),
			mode === "superpose" && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Field, {
				label: "wave 2 freq",
				value: f2.toFixed(1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: f2,
					min: .2,
					max: 3,
					step: .1,
					onChange: setF2,
					ariaLabel: "second frequency"
				})
			}), /* @__PURE__ */ jsx(Field, {
				label: "wave 2 phase",
				value: `${phase.toFixed(1)}π`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: phase,
					min: 0,
					max: 2,
					step: .1,
					onChange: setPhase,
					ariaLabel: "phase"
				})
			})] }),
			mode === "standing" && /* @__PURE__ */ jsx(Field, {
				label: "harmonic n",
				value: nH,
				children: /* @__PURE__ */ jsx(Slider, {
					value: nH,
					min: 1,
					max: 6,
					step: 1,
					onChange: setNH,
					ariaLabel: "harmonic"
				})
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: sound,
				onClick: () => setSound((s) => !s),
				children: "🔊 sound"
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(HintLadder, { hints }), /* @__PURE__ */ jsx(ChallengeCard, {
			questions: WAVES_CHALLENGE,
			state: challenge,
			title: "Predict"
		})] }),
		children: figure
	});
}

//#endregion
export { WaveLab };