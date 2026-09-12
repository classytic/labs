# Illustrations: where HTML/CSS stops and artwork starts

Every lab figure is drawn live with the figure kit (`src/kit/figure`, art direction in
`.claude/skills/lab-design/SKILL.md`). That covers diagrams, apparatus, particles, plots and
schematic scenes: anything made of a few hundred simple shapes. Some subjects are not that:
a lit cell cutaway, a photoreal reactor core, a textured planet, a human figure. For those the
lab shows a **pre-rendered image** through `<Illustration>`, and the host ships the file.

The package never bundles images. Hosts own their assets and their CDN.

## The contract

```tsx
import { Illustration } from '@classytic/labs/kit';

<Illustration
  src="/labs/illustrations/biology/cell.webp"
  srcDark="/labs/illustrations/biology/cell.dark.webp"   // optional
  alt="Animal cell cutaway: nucleus at centre, rough ER wrapping it, Golgi to the right"
  ratio={16 / 9}                                          // reserved before load
  caption="A eukaryotic cell. Organelle sizes are exaggerated for legibility."
  loading="eager"                                         // only for the hero above the fold
/>
```

- **Path convention** in mentora: `apps/web/public/labs/illustrations/<domain>/<id>.webp`
  plus `<id>.dark.webp`. Same id as the lab manifest.
- **Two themes.** Provide a dark variant whenever the art has a background tone; a
  transparent PNG/WebP with neutral shading can serve both.
- **Size.** 1600 px wide (2× of the 800 px figure column), WebP quality 85–90, ≤ 250 KB.
  Reserve the aspect box with `ratio` so the lab never reflows.
- **Alt text** describes the subject the way the transcript would, not "illustration of".
- **Style.** Match the kit: flat neutral backdrop, soft three-point light, long lens (little
  perspective), one or two hues + neutrals, no gradients on flat things, no text baked into
  the image (labels stay live `FigText` so they translate and re-theme).

## Producing the artwork

### 1. From what we already render (no new tools)

`scripts/render-hero.mjs` screenshots one live figure from the running app at 2× device
pixels, light and dark, WebGL included (SwiftShader):

```sh
# apps/web dev server running on :4001
node scripts/render-hero.mjs biology --match="mitosis" \
  --out=d:/projects/brihot/apps/web/public/labs/illustrations/biology --name=mitosis
```

Use it to freeze a 3D scene into a hero still for lesson cards, static fallbacks, or hosts
that disable WebGL. Adds `.webp` twins when `sharp` is resolvable from the labs repo.

### 2. Blender (headless)

`scripts/blender/render-hero.py` renders a model (`.glb/.gltf/.obj/.fbx`) with the art
direction baked in: neutral world, key/fill/rim area lights, 85 mm lens, subject framed to
~62 % of the height, transparent background, light + dark passes.

```sh
blender -b --python scripts/blender/render-hero.py -- \
  --model assets/cell.glb --out apps/web/public/labs/illustrations/biology/cell \
  --size 1600x900 --yaw 28 --pitch 18 --samples 128
```

Blender is not installed on the dev machine and is not a dependency; run this wherever the
artwork is produced (a designer's box, a CI job with the Blender image). Source `.blend`/GLB
files live outside this repo (see the biology `modelAssets` prop for runtime GLBs the host
may also stream into `src/three` scenes).

### 3. Commissioned or generated art

When neither path gives the quality a hero needs, brief an illustrator (or an image model)
with the art-direction section of the lab-design skill: the palette triad for the domain,
flat orthographic view, single sheen, no baked text. Deliver at the size/format above and
drop the files into the host's `public/labs/illustrations/<domain>/`.

## Where an illustration belongs (and where it does not)

- **Yes:** the hero of a lesson's hook step; the static fallback of a 3D scene; a cutaway or
  photoreal reference beside a schematic figure.
- **No:** anything the learner manipulates, anything carrying live values, anything that
  needs to re-theme or translate. Those stay kit figures.
