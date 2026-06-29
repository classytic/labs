import { ReactNode } from "react";

//#region src/math/function-machine/preset.d.ts
interface FunctionMachineProps {
  prompt?: string;
  inputs: (string | number)[];
  outputs: (string | number)[];
  choices: string[];
  answer: string;
  height?: number;
}
declare function FunctionMachineLab({
  prompt,
  inputs,
  outputs,
  choices,
  answer,
  height
}: FunctionMachineProps): ReactNode;
//#endregion
export { FunctionMachineLab, FunctionMachineProps };