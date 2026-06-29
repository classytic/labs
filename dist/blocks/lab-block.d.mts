import { ReactNode } from "react";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/lab-block.d.ts
/**
 * A `defineBlock` result PLUS the MDX `tag` and raw `lab` render fn, so a domain's
 * tag→component render map can be DERIVED from its blocks (see {@link buildComponents})
 * instead of being hand-maintained in parallel.
 */
type LabBlock = ReturnType<typeof defineBlock> & {
  readonly tag: string;
  readonly lab: (a: any) => ReactNode;
};
//#endregion
export { LabBlock };