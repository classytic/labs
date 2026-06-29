//#region src/geography/cycles.ts
/** Water cycle, a clean 5-stage ring; each edge is one distinct process. */
const WATER_CYCLE = {
	nodes: [
		{
			id: "ocean",
			label: "Ocean",
			tone: "var(--stage-accent-2)"
		},
		{
			id: "vapour",
			label: "Water vapour",
			tone: "var(--stage-muted)"
		},
		{
			id: "clouds",
			label: "Clouds",
			tone: "var(--stage-fg)"
		},
		{
			id: "precip",
			label: "Rain & snow",
			tone: "var(--stage-accent)"
		},
		{
			id: "rivers",
			label: "Rivers & ground",
			tone: "var(--stage-good)"
		}
	],
	edges: [
		{
			from: "ocean",
			to: "vapour",
			label: "evaporation"
		},
		{
			from: "vapour",
			to: "clouds",
			label: "condensation"
		},
		{
			from: "clouds",
			to: "precip",
			label: "precipitation"
		},
		{
			from: "precip",
			to: "rivers",
			label: "infiltration"
		},
		{
			from: "rivers",
			to: "ocean",
			label: "runoff"
		}
	]
};
/** Rock cycle, a ring PLUS shortcuts: any rock can skip ahead (heat, re-weather). */
const ROCK_CYCLE = {
	nodes: [
		{
			id: "magma",
			label: "Magma",
			tone: "var(--stage-danger)"
		},
		{
			id: "igneous",
			label: "Igneous",
			tone: "var(--stage-accent)"
		},
		{
			id: "sediment",
			label: "Sediment",
			tone: "var(--stage-warn)"
		},
		{
			id: "sedimentary",
			label: "Sedimentary",
			tone: "var(--stage-good)"
		},
		{
			id: "metamorphic",
			label: "Metamorphic",
			tone: "var(--stage-accent-2)"
		}
	],
	edges: [
		{
			from: "magma",
			to: "igneous",
			label: "cooling"
		},
		{
			from: "igneous",
			to: "sediment",
			label: "weathering"
		},
		{
			from: "sediment",
			to: "sedimentary",
			label: "compaction"
		},
		{
			from: "sedimentary",
			to: "metamorphic",
			label: "heat & pressure"
		},
		{
			from: "metamorphic",
			to: "magma",
			label: "melting"
		},
		{
			from: "igneous",
			to: "metamorphic",
			label: "heat & pressure"
		},
		{
			from: "sedimentary",
			to: "sediment",
			label: "weathering"
		}
	]
};
/** Carbon cycle, branched (CO₂ in/out by several routes); ties to photo/respiration. */
const CARBON_CYCLE = {
	nodes: [
		{
			id: "air",
			label: "Atmospheric CO₂",
			tone: "var(--stage-muted)"
		},
		{
			id: "plants",
			label: "Plants",
			tone: "var(--stage-good)"
		},
		{
			id: "animals",
			label: "Animals",
			tone: "var(--stage-accent)"
		},
		{
			id: "dead",
			label: "Dead matter",
			tone: "var(--stage-warn)"
		},
		{
			id: "fossil",
			label: "Fossil fuels",
			tone: "var(--stage-fg)"
		}
	],
	edges: [
		{
			from: "air",
			to: "plants",
			label: "photosynthesis"
		},
		{
			from: "plants",
			to: "animals",
			label: "feeding"
		},
		{
			from: "animals",
			to: "dead",
			label: "death"
		},
		{
			from: "dead",
			to: "air",
			label: "decomposition"
		},
		{
			from: "plants",
			to: "air",
			label: "respiration"
		},
		{
			from: "animals",
			to: "air",
			label: "respiration"
		},
		{
			from: "dead",
			to: "fossil",
			label: "fossilisation"
		},
		{
			from: "fossil",
			to: "air",
			label: "combustion"
		}
	]
};
const CYCLE_PRESETS = {
	water: WATER_CYCLE,
	rock: ROCK_CYCLE,
	carbon: CARBON_CYCLE
};

//#endregion
export { CARBON_CYCLE, CYCLE_PRESETS, ROCK_CYCLE, WATER_CYCLE };