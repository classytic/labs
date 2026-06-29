import { getGate, listGates, registerGate } from "./registry.mjs";
import { registerBuiltinGates } from "./gates.mjs";
import { evaluate, truthTable } from "./evaluate.mjs";
import { LogicScene } from "./LogicScene.mjs";
import { LOGIC_PRESETS, presetDoc } from "./presets.mjs";
import { LogicGateLab } from "./lab.mjs";
import { BinaryDisplayLab } from "./display.mjs";
import { LogicEditScene } from "./LogicEditScene.mjs";
import { addNode, connect, deleteNode, disconnect, moveNode, relabel, setGoal, setInputValue, toggleInput } from "./edit-ops.mjs";
import { LogicEditor } from "./LogicEditor.mjs";
import { LogicBuildLab } from "./LogicBuildLab.mjs";

export { BinaryDisplayLab, LOGIC_PRESETS, LogicBuildLab, LogicEditScene, LogicEditor, LogicGateLab, LogicScene, addNode, connect, deleteNode, disconnect, evaluate, getGate, listGates, moveNode, presetDoc, registerBuiltinGates, registerGate, relabel, setGoal, setInputValue, toggleInput, truthTable };