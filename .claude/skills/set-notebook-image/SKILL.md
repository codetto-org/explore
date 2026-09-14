# Skill: Set Codetto Notebook Image

Sets or updates the background image (`metadata.codetto.image`) on an **existing** Codetto notebook — the image shown behind the title on its index/tile card. Use this when the only thing that needs to change is that one field. For creating a new notebook from scratch, or editing any other part of one, use the `create-notebook` skill instead (its "Image" section covers the same field, among everything else).

## What this field is

```json
"metadata": {
  "codetto": {
    "image": "data:image/jpeg;base64,/9j/4AAQ…"
  }
}
```

Base64 JPEG data URL used as the card background. If absent, the app shows a default ruled-notebook SVG placeholder instead.

## Step 1 — Generate the resized data URL

**Never hand-roll this with `base64`.** The `notebook-image` script reproduces the app's own teacher-upload pipeline (`src/utils/imageResize.ts` in `codetto/core`): downscale so the longest side is ≤ 800px, then re-encode as JPEG trying quality 0.82 / 0.70 / 0.55 in order, taking the first result under 400 KB.

The script lives in **this repo** (`public/curriculum/explore/`, a separate git submodule from `codetto/core`) — run it from here, not from the `core` root:

```bash
npm install                                          # first time only (installs jimp)
node scripts/notebook-image.mjs path/to/cover.png    # prints the data: URL to stdout
node scripts/notebook-image.mjs path/to/cover.png --json   # -> {"image": "data:image/jpeg;base64,..."}
# or: npm run notebook-image -- path/to/cover.png
```

Accepts `.png` / `.jpg` / `.jpeg` / `.webp` / `.gif` / `.bmp`. Progress/size info goes to stderr; only the data URL goes to stdout, so it's safe to capture (`IMG=$(node scripts/notebook-image.mjs cover.png)`). Exits non-zero and writes nothing to stdout if the image can't be squeezed under 400 KB even at the lowest quality — pick a simpler or smaller source in that case.

If courses/notebooks elsewhere in `codetto/core` need this same treatment, the script is specific to this submodule's checkout; there's no separate copy in `core/scripts/`.

## Step 2 — Write it into the notebook

**Do not use `NotebookEdit`** — it only normalizes/edits cell `source`, never notebook or cell `metadata`. Use the `Edit` tool to make a targeted, exact-string replacement inside the notebook's raw JSON:

1. `Read` the notebook file to find the current state of `metadata.codetto`.
2. If an `"image"` key already exists under `metadata.codetto`, `Edit` that one line's value in place (old_string = the exact existing `"image": "data:...",` line, new_string = the same key with the new data URL).
3. If `metadata.codetto` exists but has no `"image"` key yet, `Edit` to insert `"image": "data:...",` as a new line inside that object (anchor the `old_string` on an adjacent, unique existing line inside `metadata.codetto`, e.g. right after `"title": "...",`).
4. If the notebook predates the `metadata.codetto` nesting entirely (no `codetto` object under `metadata` at all — rare, pre-convention notebooks), you'll need to add the whole nested object; in that case it's simplest to fall back to `Write` with the complete, hand-verified JSON (see `create-notebook`'s notebook-format section for the required shape) rather than trying to `Edit` it into existence.

This keeps the edit scoped to one field — no risk of transcribing cell `source` arrays incorrectly, which is the real hazard of rewriting a whole notebook by hand.

**Legacy flat key:** if the notebook has an old top-level `metadata.image` (not nested under `codetto`, from before the `metadata.codetto` convention) and you're now setting the nested one, remove the flat key too so there's a single source of truth — the app's `getCodettoMeta` falls back to it, so leaving both isn't broken, just redundant and worth cleaning up when you're already touching this notebook.

## Step 3 — Regenerate the Explore index (if applicable)

Only needed for notebooks under `public/curriculum/explore/` (this repo) that are listed in `index.yml` — that catalog snapshots each notebook's `image` directly so the Explore tab can render tiles from one fetch, and it won't pick up your change until regenerated. From `codetto/core`'s root (not this submodule):

```bash
npm run generate:explore-index
```

Not needed for notebooks under `public/curriculum/courses/` — courses don't snapshot `image` into their `metadata.yml`.

## Optional — Version bump

Changing the image alone is cosmetic and doesn't require bumping `metadata.codetto.stable_version`. Only bump it if you specifically want students who already downloaded this notebook to be offered the update (the version-diff check in `src/notebookVersioning/` is what surfaces "update available" — a bare image swap otherwise only affects new downloads and the Explore/Home card view).
