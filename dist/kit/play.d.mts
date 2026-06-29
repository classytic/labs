import { ReactNode, RefObject } from "react";

//#region src/kit/play.d.ts
interface PlayGate {
  ref: RefObject<HTMLDivElement | null>;
  inView: boolean;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  /** playing && inView, pass to useFrameLoop's `running`. */
  running: boolean;
}
declare function usePlayGate(autoPlay?: boolean): PlayGate;
declare function PlayWrap({
  gate,
  children
}: {
  gate: PlayGate;
  children: ReactNode;
}): ReactNode;
//#endregion
export { PlayGate, PlayWrap, usePlayGate };