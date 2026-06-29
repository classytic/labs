import { ReactNode } from "react";

//#region src/physics/projectile-lab.d.ts
interface ProjectileLabProps {
  targetMeters?: number | string;
  g?: number | string;
}
declare function ProjectileLab(props: ProjectileLabProps): ReactNode;
//#endregion
export { ProjectileLab, ProjectileLabProps };