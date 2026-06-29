'use client';

import { monohybridSpec } from "../genetic-cross/core.mjs";
import { GeneticCrossLab } from "../genetic-cross/preset.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/biology/punnett-cross/preset.tsx
function PunnettCrossLab({ parent1 = "Aa", parent2 = "Aa", dominantLabel = "tall", recessiveLabel = "short", alleleLetter = "A", predictFirst = true, title = "The 3:1 you can count", prompt = "Cross two parents: alleles segregate into gametes, recombine, and the ratio falls out.", objectives }) {
	return /* @__PURE__ */ jsx(GeneticCrossLab, {
		spec: monohybridSpec(alleleLetter, dominantLabel, recessiveLabel),
		parent1: parent1.split(""),
		parent2: parent2.split(""),
		predictFirst,
		title,
		prompt,
		objectives
	});
}

//#endregion
export { PunnettCrossLab };