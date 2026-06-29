'use client';

import { CrossGrid } from "./grid.mjs";
import { comboColorMap, monohybridSpec, resolveModel } from "./core.mjs";
import { useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useLearner } from "@classytic/stage";

//#region src/biology/genetic-cross/preset.tsx
/**
* GeneticCrossLab, ONE authorable cross tool for every Mendelian pattern, now
* MULTI-LOCUS. The creator declares one model per gene; the lab derives gametes by
* independent assortment (one allele per locus → 2ⁿ gametes), fills the Punnett
* grid via the shared CrossGrid, and reads off the genotype + phenotype ratios.
*
*  • one locus  → monohybrid / multiple alleles / codominance / incomplete dominance
*  • two loci   → dihybrid 9:3:3:1 (4×4 grid)
*
* The pattern is DATA, not a bespoke widget. PunnettCross is a monohybrid preset of
* this; SexLinkedCrossLab shares the same CrossGrid.
*/
const cartesian = (pairs) => pairs.reduce((acc, pair) => acc.flatMap((g) => pair.map((a) => [...g, a])), [[]]);
function GeneticCrossLab({ spec, loci, parent1, parent2, predictFirst = true, title, prompt, objectives }) {
	const specs = useMemo(() => loci ?? [spec ?? monohybridSpec()], [loci, spec]);
	const models = useMemo(() => specs.map(resolveModel), [specs]);
	const multi = models.length > 1;
	const comboColors = useMemo(() => comboColorMap(models), [models]);
	const learner = useLearner();
	const reported = useRef(false);
	const toPairs = (p, dflt) => {
		if (!p) return dflt;
		return Array.isArray(p[0]) ? p : [p];
	};
	const defaultHet = () => models.map((m) => [m.alleles[0].symbol, m.alleles[Math.min(1, m.alleles.length - 1)].symbol]);
	const defaultP2 = () => models.map((m) => [m.alleles[0].symbol, m.alleles[m.alleles.length - 1].symbol]);
	const [p1, setP1] = useState(() => toPairs(parent1, defaultHet()).map((pr, i) => models[i].norm(pr[0], pr[1])));
	const [p2, setP2] = useState(() => toPairs(parent2, multi ? defaultHet() : defaultP2()).map((pr, i) => models[i].norm(pr[0], pr[1])));
	const gametes1 = cartesian(p1);
	const gametes2 = cartesian(p2);
	const combine = (g1, g2) => {
		const perLocus = models.map((m, i) => ({
			geno: m.norm(g1[i], g2[i]),
			pheno: m.phenotypeOf(g1[i], g2[i]),
			m,
			g1: g1[i],
			g2: g2[i]
		}));
		const genotype = perLocus.map((l) => l.geno.join("")).join("");
		const label = perLocus.map((l) => l.pheno.label).join(" ");
		const color = multi ? comboColors.get(label) ?? "var(--stage-accent)" : perLocus[0].pheno.color;
		let note = "";
		if (!multi) {
			const [a, b] = perLocus[0].geno;
			if (a !== b) {
				const [hi, lo] = models[0].masks(a, b) ? [a, b] : models[0].masks(b, a) ? [b, a] : ["", ""];
				if (hi) note = `, the recessive ${lo} is still there, masked`;
			}
		}
		return {
			genotype,
			phenotype: {
				label,
				color
			},
			note
		};
	};
	const cycle = (setter, parent, locus, slot) => {
		const syms = models[locus].alleles.map((a) => a.symbol);
		const i = (syms.indexOf(parent[locus][slot]) + 1) % syms.length;
		const nextPair = slot === 0 ? [syms[i], parent[locus][1]] : [parent[locus][0], syms[i]];
		setter(parent.map((pr, L) => L === locus ? models[locus].norm(nextPair[0], nextPair[1]) : pr));
	};
	const traitLabel = multi ? "phenotype" : models[0].trait;
	const alleleStyle = (locus, s) => ({
		color: multi ? "var(--stage-fg)" : models[0].phenotypeColor(models[0].phenotypeOf(s, s).label),
		fontWeight: 800
	});
	const parentRow = (name, parent, setter) => /* @__PURE__ */ jsxs("span", {
		style: {
			display: "inline-flex",
			alignItems: "center",
			gap: 8,
			flexWrap: "wrap"
		},
		children: [
			name,
			":",
			parent.map((pair, L) => /* @__PURE__ */ jsx("span", {
				style: {
					display: "inline-flex",
					gap: 2,
					padding: "2px 4px",
					borderRadius: 8,
					background: "color-mix(in oklab, var(--stage-fg) 6%, transparent)"
				},
				children: pair.map((s, ai) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lab-chip",
					style: {
						minWidth: 26,
						fontSize: 16,
						...alleleStyle(L, s)
					},
					onClick: () => cycle(setter, parent, L, ai),
					"aria-label": `${name} gene ${L + 1} allele ${ai + 1}: ${s}, tap to change`,
					children: s
				}, ai))
			}, L))
		]
	});
	const header = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: 16,
			marginBottom: 12,
			flexWrap: "wrap",
			alignItems: "center"
		},
		children: [
			parentRow("Parent 1", p1, setP1),
			parentRow("Parent 2", p2, setP2),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "(tap an allele to cycle it)"
			})
		]
	});
	const legend = /* @__PURE__ */ jsx("p", {
		style: {
			fontSize: 12,
			color: "var(--stage-muted)",
			margin: "0 0 8px"
		},
		children: models.map((m, i) => /* @__PURE__ */ jsxs("span", { children: [
			multi ? `Gene ${i + 1}: ` : `Trait: ${m.trait} · `,
			m.alleles.map((a, j) => /* @__PURE__ */ jsxs("span", { children: [
				/* @__PURE__ */ jsx("b", {
					style: alleleStyle(i, a.symbol),
					children: a.symbol
				}),
				"=",
				a.trait,
				j < m.alleles.length - 1 ? ", " : ""
			] }, a.symbol)),
			i < models.length - 1 ? " · " : ""
		] }, i))
	});
	return /* @__PURE__ */ jsx(CrossGrid, {
		gametes1,
		gametes2,
		gameteLabel: (g) => g.join(""),
		combine,
		traitLabel,
		resetKey: JSON.stringify([p1, p2]),
		predictFirst,
		header,
		legend,
		title: title ?? (multi ? "Dihybrid cross, 9 : 3 : 3 : 1" : "The cross you can count"),
		prompt: prompt ?? (multi ? "Two genes assort independently, four gametes each, sixteen boxes, four phenotype classes." : "Alleles segregate into gametes, recombine, and the ratio falls out."),
		objectives,
		showGenotypeTally: !multi,
		onReveal: () => {
			if (!reported.current) {
				reported.current = true;
				learner?.report({
					activity: "genetic-cross",
					correct: true,
					score: {
						raw: 1,
						max: 1
					},
					completion: true
				});
			}
		}
	});
}

//#endregion
export { GeneticCrossLab };