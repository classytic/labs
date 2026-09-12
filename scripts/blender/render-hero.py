"""
render-hero.py — headless Blender render for lab hero illustrations.

Produces the light and dark variants of ONE subject with the labs art direction baked in:
neutral studio backdrop (paper / near-black), three-point soft lighting, orthographic-ish
long lens, transparent background so the page's own surface shows through, 2× resolution.

    blender -b --python scripts/blender/render-hero.py -- \
        --model path/to/subject.glb --out apps/web/public/labs/illustrations/biology/cell \
        [--size 1600x900] [--yaw 28] [--pitch 18] [--zoom 1.0] [--samples 128]

Writes <out>.png and <out>.dark.png. Convert to WebP with `sharp`/`cwebp` if desired; the lab
references them via <Illustration src="/labs/illustrations/biology/cell.webp" srcDark=… />.

Blender ≥ 3.6 (Cycles or Eevee-Next). Blender is NOT a package dependency: this script is a
template for whoever produces the artwork (a designer, a build box, a one-off local run).
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy  # type: ignore  # only available inside Blender

# The two paper colours match the app's light/dark stage backgrounds closely enough for the
# shading to feel native; the background itself renders transparent.
SCHEMES = {
    "light": {"world": (0.96, 0.96, 0.97), "key": 3.0, "fill": 1.2, "rim": 2.0, "suffix": ""},
    "dark": {"world": (0.07, 0.075, 0.09), "key": 2.4, "fill": 0.9, "rim": 3.2, "suffix": ".dark"},
}


def parse() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--model", required=True, help=".glb/.gltf/.obj/.fbx to render")
    p.add_argument("--out", required=True, help="output path WITHOUT extension")
    p.add_argument("--size", default="1600x900")
    p.add_argument("--yaw", type=float, default=28.0)
    p.add_argument("--pitch", type=float, default=18.0)
    p.add_argument("--zoom", type=float, default=1.0)
    p.add_argument("--samples", type=int, default=128)
    return p.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_model(path: Path) -> list[bpy.types.Object]:
    ext = path.suffix.lower()
    before = set(bpy.data.objects)
    if ext in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=str(path))
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path))
    else:
        raise SystemExit(f"unsupported model format: {ext}")
    return [o for o in bpy.data.objects if o not in before and o.type == "MESH"]


def frame_subject(meshes: list[bpy.types.Object], yaw: float, pitch: float, zoom: float) -> None:
    # bounding sphere of every mesh vertex (world space)
    pts = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
    if not pts:
        raise SystemExit("model has no mesh geometry")
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    cz = sum(p.z for p in pts) / len(pts)
    radius = max(math.dist((p.x, p.y, p.z), (cx, cy, cz)) for p in pts) or 1.0

    cam_data = bpy.data.cameras.new("HeroCam")
    cam_data.lens = 85  # long lens: little perspective distortion, like the flat SVG figures
    cam_data.sensor_width = 36
    cam = bpy.data.objects.new("HeroCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    # subject spans ~62 % of the frame height (the "figure is the hero" rule)
    fov = 2 * math.atan(cam_data.sensor_width / (2 * cam_data.lens))
    dist = (radius / 0.62) / math.tan(fov / 2) / zoom
    y, p = math.radians(yaw), math.radians(pitch)
    cam.location = (
        cx + dist * math.cos(p) * math.sin(y),
        cy - dist * math.cos(p) * math.cos(y),
        cz + dist * math.sin(p),
    )
    direction = bpy.mathutils.Vector((cx, cy, cz)) - cam.location  # type: ignore[attr-defined]
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_lights(scheme: dict) -> None:
    def lamp(name: str, kind: str, energy: float, loc: tuple[float, float, float], size: float = 3.0) -> None:
        data = bpy.data.lights.new(name, kind)
        data.energy = energy * 400
        if kind == "AREA":
            data.size = size
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        bpy.context.scene.collection.objects.link(obj)
        direction = bpy.mathutils.Vector((0, 0, 0)) - obj.location  # type: ignore[attr-defined]
        obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    lamp("Key", "AREA", scheme["key"], (4, -4, 6), 4)
    lamp("Fill", "AREA", scheme["fill"], (-5, -2, 3), 6)
    lamp("Rim", "AREA", scheme["rim"], (0, 6, 5), 2)


def render(out: Path, size: str, samples: int, scheme: dict) -> None:
    scene = bpy.context.scene
    w, h = (int(v) for v in size.lower().split("x"))
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    world = bpy.data.worlds.new("HeroWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (*scheme["world"], 1.0)
    bg.inputs[1].default_value = 1.0
    scene.world = world
    scene.render.filepath = str(out.with_name(out.name + scheme["suffix"] + ".png"))
    bpy.ops.render.render(write_still=True)
    print(f"[hero] {scene.render.filepath}")


def main() -> None:
    args = parse()
    model = Path(args.model).resolve()
    out = Path(args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    for scheme in SCHEMES.values():
        clear_scene()
        meshes = import_model(model)
        frame_subject(meshes, args.yaw, args.pitch, args.zoom)
        add_lights(scheme)
        render(out, args.size, args.samples, scheme)


if __name__ == "__main__":
    main()
