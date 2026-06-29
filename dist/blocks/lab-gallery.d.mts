import { ReactNode } from "react";

//#region src/blocks/lab-gallery.d.ts
/** The minimum a gallery card needs, structurally satisfied by a cms-ui BlockSpec. */
interface LabPickItem {
  key: string;
  /** MDX tag / Plate node type the host inserts on pick. */
  tag?: string;
  label: string;
  description?: string;
  /** Subject grouping for the gallery (e.g. 'Math', 'Physics'). */
  group?: string;
  /** Renders the lab; called with `mode:'preview'` for the thumbnail. */
  Component: (props: {
    attributes: Record<string, unknown>;
    mode: string;
  }) => ReactNode;
  /** Example attributes to preview with (defaults to {} → the lab's own defaults). */
  defaults?: Record<string, unknown>;
}
interface LabGalleryProps {
  blocks: LabPickItem[];
  onPick?: (item: LabPickItem) => void;
}
declare function LabGallery({
  blocks,
  onPick
}: LabGalleryProps): ReactNode;
//#endregion
export { LabGallery, LabGalleryProps, LabPickItem };