'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/build/editor-ui.tsx
const R = "var(--radius, 0.625rem)";
const BORDER = "var(--border, oklch(0.92 0.004 286))";
const MUTED = "var(--muted-foreground, oklch(0.55 0.01 286))";
const FG = "var(--foreground, oklch(0.21 0.006 286))";
function Panel({ title, children, style }) {
	return /* @__PURE__ */ jsxs("div", {
		style: {
			background: "var(--card, #fff)",
			color: FG,
			border: `1px solid ${BORDER}`,
			borderRadius: R,
			padding: 12,
			display: "flex",
			flexDirection: "column",
			gap: 10,
			...style
		},
		children: [title && /* @__PURE__ */ jsx("div", {
			style: {
				fontSize: 11,
				fontWeight: 700,
				letterSpacing: "0.04em",
				textTransform: "uppercase",
				color: MUTED
			},
			children: title
		}), children]
	});
}
function EBtn({ children, onClick, active, variant = "default", title, disabled }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick,
		title,
		disabled,
		style: {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			gap: 6,
			padding: "7px 11px",
			fontSize: 13,
			fontWeight: 600,
			lineHeight: 1,
			background: variant === "primary" || active ? "var(--primary, oklch(0.21 0.006 286))" : variant === "danger" ? "var(--destructive, oklch(0.58 0.22 27))" : variant === "ghost" ? "transparent" : "var(--secondary, oklch(0.97 0.001 286))",
			color: variant === "primary" || active ? "var(--primary-foreground, oklch(0.98 0 0))" : variant === "danger" ? "var(--destructive-foreground, #fff)" : FG,
			border: `1px solid ${variant === "ghost" ? BORDER : "transparent"}`,
			borderRadius: `calc(${R} - 2px)`,
			cursor: disabled ? "not-allowed" : "pointer",
			opacity: disabled ? .5 : 1,
			transition: "background 120ms, opacity 120ms",
			whiteSpace: "nowrap"
		},
		children
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ jsxs("label", {
		style: {
			display: "grid",
			gridTemplateColumns: "1fr auto",
			alignItems: "center",
			gap: 8,
			fontSize: 13,
			color: FG
		},
		children: [/* @__PURE__ */ jsx("span", {
			style: { color: MUTED },
			children: label
		}), children]
	});
}
function NumInput({ value, onChange, step = 1, min, ariaLabel }) {
	return /* @__PURE__ */ jsx("input", {
		type: "number",
		value,
		step,
		min,
		"aria-label": ariaLabel,
		onChange: (e) => {
			const v = Number(e.target.value);
			if (Number.isFinite(v)) onChange(v);
		},
		style: {
			width: 92,
			padding: "5px 8px",
			fontSize: 13,
			textAlign: "right",
			fontVariantNumeric: "tabular-nums",
			color: FG,
			background: "var(--background, #fff)",
			border: `1px solid ${BORDER}`,
			borderRadius: `calc(${R} - 3px)`
		}
	});
}
function TextInput({ value, onChange, ariaLabel }) {
	return /* @__PURE__ */ jsx("input", {
		type: "text",
		value,
		"aria-label": ariaLabel,
		onChange: (e) => onChange(e.target.value),
		style: {
			width: 120,
			padding: "5px 8px",
			fontSize: 13,
			color: FG,
			background: "var(--background, #fff)",
			border: `1px solid ${BORDER}`,
			borderRadius: `calc(${R} - 3px)`
		}
	});
}

//#endregion
export { EBtn, Field, NumInput, Panel, TextInput };