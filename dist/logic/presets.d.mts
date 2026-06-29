import { LogicDoc } from "./contract.mjs";

//#region src/logic/presets.d.ts
declare const LOGIC_PRESETS: Record<string, {
  title: string;
  doc: LogicDoc;
}>;
type LogicPresetKey = keyof typeof LOGIC_PRESETS;
/** Deep-clone a preset doc so the lab can mutate input values without touching the library. */
declare function presetDoc(key: string): LogicDoc;
//#endregion
export { LOGIC_PRESETS, LogicPresetKey, presetDoc };