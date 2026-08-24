# Skill: Create Codetto Notebook

You are creating a `.ipynb` notebook for the **Codetto** platform — a browser-based Jupyter client for K-12 students that runs Python via Pyodide (in-browser, no server). This skill covers all platform-specific extensions beyond standard `.ipynb` format.

## Notebook file format

A Codetto notebook is a standard `.ipynb` JSON file (`nbformat: 4`). Always write the JSON manually using the `Write` tool — **never use `NotebookEdit`**, which writes `source` as a plain string and breaks the parser. Every `source` field must be an **array of strings** (one string per line, with `\n` at the end of each line except the last).

```json
{
  "nbformat": 4,
  "nbformat_minor": 5,
  "metadata": {
    "codetto": {
      "title": "Lesson 1: Hello World"
    },
    "kernelspec": {
      "display_name": "Python 3",
      "language": "python",
      "name": "python3"
    }
  },
  "cells": []
}
```

---

## Notebook metadata extensions

All Codetto-specific metadata lives under a single `metadata.codetto` object, namespaced to avoid clashing with other tools that might read the same `.ipynb` file (this mirrors how Colab uses `metadata.colab`, Papermill uses `metadata.papermill`, etc.). **Always nest these fields under `metadata.codetto`** — do not write them as flat top-level keys directly under `metadata`. (The app still reads old flat keys from notebooks authored before this convention, but every notebook you write from now on should use the nested form.)

```json
"metadata": {
  "codetto": {
    "title": "...",
    "globals": { "...": "..." },
    "description": "...",
    "color": "...",
    "progress": 0,
    "image": "...",
    "category": "how-tos",
    "tags": ["..."],
    "estimated_time": 15,
    "stable_id": "...",
    "stable_version": "...",
    "files": [ ]
  }
}
```

### Title

```json
"metadata": {
  "codetto": {
    "title": "Lesson 4: Variables and Data Flow"
  }
}
```

Falls back to filename if absent. Always set a descriptive title.

Notebooks in this repo (`public/curriculum/explore/`) are organized as a flat, filterable index — not a folder hierarchy and not a course/module structure. Students find a notebook via **Category**, **Tags**, and free-text search over title/description (see **Category, Tags, and Estimated Time** below). There is no `folder` field to set.

### Globals

Named values substituted at runtime using `{{VARIABLE}}` syntax in markdown and code cells. Supports per-locale overrides:

```json
"metadata": {
  "codetto": {
    "globals": {
      "STUDENT_NAME": {
        "default": "Rylee",
        "hi-IN": "Aditi",
        "ja-JP": "Daichi"
      },
      "FAVORITE_FOOD": {
        "default": "Pizza",
        "hi-IN": "Puri"
      }
    }
  }
}
```

Use globals in cell source: `Hello, {{STUDENT_NAME}}!`

### Description

Short summary shown below the notebook title on the index card. Also searched by the index search box. If absent, the description area is blank.

```json
"metadata": {
  "codetto": {
    "description": "Learn to draw shapes and patterns with Python's turtle module."
  }
}
```

### Color

Hex color string for the left accent border on the index card. Defaults to `#42a5f5` (blue) if absent. Set this to give each notebook or unit a distinct visual identity.

```json
"metadata": {
  "codetto": {
    "color": "#e53935"
  }
}
```

Common choices: `#e53935` red · `#43a047` green · `#fb8c00` orange · `#8e24aa` purple · `#00897b` teal · `#1e88e5` blue.

### Progress

Integer `0–100` shown as a `v-progress-linear` bar pinned to the bottom edge of the index card. Hidden if absent. In practice you don't need to author this by hand: the app recalculates it on every autosave from answered/total CFU cells (and removes it if the notebook has none), so it only matters here as the notebook's *initial* value before a student has opened it — `0` is the usual choice.

```json
"metadata": {
  "codetto": {
    "progress": 0
  }
}
```

### Image

Base64 data URL used as the background image on the index card. Overrides the default ruled-notebook SVG placeholder for both light and dark themes. Use a JPEG for photos, PNG for graphics with transparency.

```json
"metadata": {
  "codetto": {
    "image": "data:image/jpeg;base64,/9j/4AAQ…"
  }
}
```

To generate the base64 string from a file:

```bash
base64 -i image.jpg | tr -d '\n'
```

Then prefix with `data:image/jpeg;base64,` (or `data:image/png;base64,` for PNG). Keep images small — 50–100 KB is reasonable; very large images bloat the notebook file and slow index load.

### Category, Tags, and Estimated Time

**`category` is required on every notebook in this repo** (`public/curriculum/explore/`) — `npm run generate:explore-index` (the script that builds `index.yml`, the catalog the Explore tab renders from) exits with an error if it's missing or outside the closed enum below. `tags` and `estimated_time` are optional but recommended; they drive the sidebar's tag-chip filter and the card's "N min" footer.

```json
"metadata": {
  "codetto": {
    "category": "how-tos",
    "tags": ["variables", "loops"],
    "estimated_time": 15
  }
}
```

- `category` — one of exactly `"how-tos"` | `"demos"` | `"templates"`. No other values are accepted.
- `tags` — free-form `string[]`, shown as filter chips in the Explore sidebar.
- `estimated_time` — integer minutes, shown near the card footer as "N min".

After adding or editing a notebook here, run `npm run generate:explore-index` from the repo root to regenerate `index.yml` — it isn't wired into CI, so this is a manual step you must remember.

### Stable ID and Version

**Always set both of these on every notebook you author.** They're specific to notebooks distributed through curriculum content (this repo, and `public/curriculum/courses/`) rather than general student-authored notebooks.

```json
"metadata": {
  "codetto": {
    "stable_id": "python-basics-lesson-04-variables",
    "stable_version": "1.0.0"
  }
}
```

- `stable_id` — a stable identifier, independent of the notebook's file path. When a student downloads this notebook, `stable_id` is the primary key used to detect "the student already has this" (`DuplicateMatchTier`, with `source_url` as a fallback tier for notebooks downloaded before this field existed) — it survives you later moving or renaming the file. Pick something unique and permanent (e.g. `<topic-slug>-<lesson-slug>`) and never reuse it for a different notebook or change it for an existing one.
- `stable_version` — a dot-separated numeric string (e.g. `"1.0.0"`). Bump it whenever you republish meaningful changes to the notebook. This drives real update detection now (`src/notebookVersioning/`): a student with an older copy sees an "update available" chip on the Explore tile, and updating merges in the new content — preserving any edited cells or answered CFUs by backing up the old copy rather than overwriting it, and carrying answered CFU answers forward onto matching questions in the new version.

A notebook in this repo missing `category`, `stable_id`, or `stable_version` fails the `generate:explore-index` build script outright (exit 1) rather than rendering as a dimmed tile — fix it before the index will regenerate.

### Embedded files (pre-attaching files to a notebook)

Files can be pre-embedded in a notebook by populating `notebook.metadata.codetto.files`. Each entry is a base64-encoded file object. When the notebook loads, all attached files are automatically mounted in the Pyodide filesystem at `/attachments/<name>` and are immediately available to Python code.

Students and teachers can also add and remove files themselves via the **Attachments dialog** (paperclip icon in the notebook's top app bar) — they do not need to edit the JSON.

**Schema:**

```json
"metadata": {
  "codetto": {
    "files": [
      {
        "name": "temperatures.csv",
        "mimeType": "text/csv",
        "size": 1024,
        "data": "<base64-encoded content>"
      }
    ]
  }
}
```

**Fields:**
- `name` — filename used as the path in `/attachments/`; must be unique within the notebook; use only alphanumeric characters, `.`, `_`, `-` (no spaces)
- `mimeType` — MIME type of the file (e.g. `"text/csv"`, `"image/png"`, `"audio/wav"`)
- `size` — raw byte count of the file **before** base64 encoding (used for the size display and limit checks)
- `data` — base64-encoded file content (**without** the `data:...;base64,` prefix)

**Limits:** 5 MB per file, 20 MB total across all files in the notebook.

**Supported types:** images (`image/jpeg`, `image/png`, `image/gif`, `image/svg+xml`, `image/webp`, `image/bmp`), audio (`audio/wav`, `audio/mpeg`, `audio/ogg`, `audio/mp4`, `audio/flac`, `audio/aac`), `text/csv`, `text/plain`, `application/json`.

**To generate the base64 string from a file:**

```bash
base64 -i mydata.csv | tr -d '\n'
```

**Accessing files in Python:**

```python
# Read a CSV
with open('/attachments/temperatures.csv') as f:
    print(f.read())

# Load with pandas
import pandas as pd
df = pd.read_csv('/attachments/temperatures.csv')

# Open an image
from PIL import Image
img = Image.open('/attachments/photo.jpg')
```

---

## Standard cell types

### Markdown cell

```json
{
  "cell_type": "markdown",
  "id": "cell-intro",
  "metadata": {},
  "source": [
    "## Welcome to Python\n",
    "\n",
    "In this lesson you will learn about **variables**."
  ]
}
```

### Code cell

```json
{
  "cell_type": "code",
  "execution_count": null,
  "id": "cell-hello",
  "metadata": {},
  "outputs": [],
  "source": [
    "name = 'World'\n",
    "print(f'Hello, {name}!')"
  ]
}
```

---

## Platform-specific cell types

These are activated by the `tags` array in `cell.metadata`.

### Invisible cell (`any cell type` + `"hidden"` tag)

A cell tagged `"hidden"` is completely absent from the rendered page — the student never sees it, even in edit mode. Use this for setup cells that run silently in the background (e.g. installing packages, defining helper functions) when you don't want even a collapsed editor visible.

```json
{
  "cell_type": "code",
  "execution_count": null,
  "id": "cell-setup-hidden",
  "metadata": {
    "tags": ["hidden"]
  },
  "outputs": [],
  "source": [
    "import micropip\n",
    "await micropip.install('some-package')"
  ]
}
```

Contrast with `collapse_code` and `hide_code` below: both of those keep the cell visible (Run button, output) but differ in whether the student can reveal the source; `hidden` removes the cell from the page entirely.

### Collapsible code cell (`code` + `"collapse_code"` tag)

A code cell tagged `"collapse_code"` starts with the editor collapsed — the student sees the Run button and output but not the source. They can reveal it with the "Hide code" toggle. Use this for setup code (imports, helper functions) that would distract from the lesson focus but that a curious student is allowed to inspect.

```json
{
  "cell_type": "code",
  "execution_count": null,
  "id": "cell-setup",
  "metadata": {
    "tags": ["collapse_code"]
  },
  "outputs": [],
  "source": [
    "import numpy as np\n",
    "import matplotlib.pyplot as plt"
  ]
}
```

### Permanently hidden code cell (`code` + `"hide_code"` tag)

A code cell tagged `"hide_code"` removes the code editor entirely — permanently, with **no** student-facing reveal toggle (unlike `collapse_code`). The code still executes; only `#@param`/`#@title` form fields and the cell's output are shown, alongside the Run/Stop controls. Use this for Colab-style hidden-code forms where the student should only ever see widgets and results, never the implementation.

```json
{
  "cell_type": "code",
  "execution_count": null,
  "id": "cell-hidden-form",
  "metadata": {
    "tags": ["hide_code"]
  },
  "outputs": [],
  "source": [
    "#@title Choose your settings\n",
    "difficulty = 'medium' #@param [\"easy\", \"medium\", \"hard\"]\n",
    "print(f'Difficulty set to {difficulty}')"
  ]
}
```

### Autorun code cell (`code` + `"autorun"` tag)

A code cell tagged `"autorun"` executes automatically the moment the notebook loads, before the student interacts with anything — no Run click needed. Autorun cells run in notebook order, one at a time. Combine with `"hidden"` (`["autorun", "hidden"]`) for setup code that should run silently with no DOM presence at all — the standard pattern for notebook setup (imports, helper functions, `micropip.install`). `["autorun"]` alone still runs automatically but stays visible, output and all. An error in any autorun cell cancels the rest of the autorun queue, so put the most failure-prone setup first if you want a clear signal.

```json
{
  "cell_type": "code",
  "execution_count": null,
  "id": "cell-setup-autorun",
  "metadata": {
    "tags": ["autorun", "hidden"]
  },
  "outputs": [],
  "source": [
    "import micropip\n",
    "await micropip.install('some-package')"
  ]
}
```

### Video cell (`raw` + `"video"` tag)

```json
{
  "cell_type": "raw",
  "id": "cell-intro-video",
  "metadata": {
    "tags": ["video"]
  },
  "source": [
    "{ \"url\": \"https://example.com/lesson.mp4\", \"controls\": true, \"autoplay\": false, \"loop\": false }"
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | Yes | Direct link to a video file (or a notebook attachment/`/attachments/<name>` path). No embedded YouTube/Vimeo — the app's COEP header for Pyodide blocks third-party iframes from loading at all, so only directly-hosted video files work. |
| `controls` | boolean | No | Shows the browser's native controls bar (play/pause/seek/volume/fullscreen). Defaults to `true`. Set `false` for a short looping background clip with no chrome — note there's currently no fullscreen path if you do this. |
| `autoplay` | boolean | No | Autoplay on load. Defaults to `false`. Per browser policy, autoplaying video is always forced muted regardless of this JSON. |
| `loop` | boolean | No | Loop playback. Defaults to `false`. |
| `title` | string | No | Optional label shown for this cell in the notebook minimap sidebar; falls back to "Video" if omitted. |

### Journal cell (`markdown` + `"journal"` tag)

A post-it style editable note where students write observations. Renders as markdown in read-only mode; double-click or pencil icon enters edit mode.

```json
{
  "cell_type": "markdown",
  "id": "cell-journal",
  "metadata": {
    "tags": ["journal"]
  },
  "source": [
    "Write your thoughts here..."
  ]
}
```

### CFU — Check for Understanding (`raw` + `"cfu"` tag)

Interactive quiz cells. Three question types: `freeform`, `multiple_choice`, `true_false`. Always initialise `submitted_answer` to `""`.

**Freeform** — case-insensitive, whitespace-trimmed comparison:

```json
{
  "cell_type": "raw",
  "id": "cell-cfu-1",
  "metadata": { "tags": ["cfu"] },
  "source": [
    "{\n",
    "  \"question_type\": \"freeform\",\n",
    "  \"question\": \"In what year was Python created?\",\n",
    "  \"answer\": \"1991\",\n",
    "  \"submitted_answer\": \"\"\n",
    "}"
  ]
}
```

**Multiple choice** — `answer` is the matching `key` value:

```json
{
  "cell_type": "raw",
  "id": "cell-cfu-2",
  "metadata": { "tags": ["cfu"] },
  "source": [
    "{\n",
    "  \"question_type\": \"multiple_choice\",\n",
    "  \"question\": \"Which is not a Python data type?\",\n",
    "  \"options\": [\n",
    "    { \"key\": \"a\", \"text\": \"int\" },\n",
    "    { \"key\": \"b\", \"text\": \"str\" },\n",
    "    { \"key\": \"c\", \"text\": \"char\" },\n",
    "    { \"key\": \"d\", \"text\": \"float\" }\n",
    "  ],\n",
    "  \"answer\": \"c\",\n",
    "  \"submitted_answer\": \"\"\n",
    "}"
  ]
}
```

**True/False** — `answer` is `"True"` or `"False"`:

```json
{
  "cell_type": "raw",
  "id": "cell-cfu-3",
  "metadata": { "tags": ["cfu"] },
  "source": [
    "{\n",
    "  \"question_type\": \"true_false\",\n",
    "  \"question\": \"Python is a compiled language.\",\n",
    "  \"answer\": \"False\",\n",
    "  \"submitted_answer\": \"\"\n",
    "}"
  ]
}
```

Optional CFU fields:
- `"animation": false` — suppresses confetti on correct answer (useful when many CFU cells appear close together)
- `"i18n"` — per-locale overrides for `question`, `options`, `answer` (see i18n section below)

### Presentation cell (`raw` + `"presentation"` tag)

A slide deck embedded directly in the notebook — teachers write slides in markdown, students navigate with prev/next/first/last controls plus a fullscreen "present mode". Unlike CFU/video (whose `source` is a single JSON value), a presentation cell's `source` is plain text: optional frontmatter followed by `---`-delimited markdown slides. Still write it as an array of one-line strings, same as any other cell — `parsePresentation()` reconstructs it with `.join("")`.

```json
{
  "cell_type": "raw",
  "id": "cell-presentation-intro",
  "metadata": { "tags": ["presentation"] },
  "source": [
    "---\n",
    "theme: light\n",
    "incremental: true\n",
    "---\n",
    "\n",
    "<!-- layout: title -->\n",
    "\n",
    "# Lesson 4: Variables\n",
    "\n",
    "A quick tour before we start coding\n",
    "\n",
    "---\n",
    "\n",
    "## What is a variable?\n",
    "\n",
    "- A named container for a value\n",
    "- Created the moment you assign to it\n",
    "- Can change value as the program runs"
  ]
}
```

**Frontmatter** — `key: value` lines between two lines that are each exactly `---`; all fields optional:
- `theme` — `light`, `dark`, `sunset`, `ocean`, `forest`, or `slate`. If omitted, the deck follows whatever theme the student/teacher currently has the app set to, rather than a fixed choice.
- `incremental` — `true`/`false`, default `false`. When `true`, each slide's first bullet/numbered list reveals one item per click of "Next" instead of appearing all at once.
- `logo` — filename of a file already attached to the notebook (see **Embedded files** above); shown bottom-right on every slide.
- `background` — a hex color (`#1e3a5f`), a CSS gradient (`linear-gradient(135deg, #4568DC, #B06AB3)`), or an attached image's filename; overrides just the theme's background.
- `color` — a hex/CSS color; overrides just the theme's text color.

`background`/`color` layer on top of `theme` rather than replacing it — pick a `theme` for the overall palette (accent/muted colors included), then optionally override just the background or just the text color on top of it.

**Slides** are separated by a line containing exactly `---` (not `***`, `___`, or longer dash runs — those render as a literal horizontal rule inside a slide instead). A slide's body can start with a directive comment on its own line, before any content:

```
<!-- layout: title -->
```

or combined:

```
<!-- layout: title, incremental: false -->
```

- `layout` — `title`, `section`, or `centered` all center the slide's content (use `title` for a deck's opening slide, `section` for a divider between topics, `centered` for something like a lone table); `columns` splits the slide into two side-by-side zones (see below); omit for the default left-aligned layout.
- `incremental: true`/`false` — overrides the deck-level `incremental` setting for just that one slide (e.g. to stop a title slide from requiring a click even when the deck default is `true`).
- `background`/`color` — overrides the deck's own `background`/`color` for just that one slide.

**Columns** (`layout: columns`) — put a line containing exactly `:::` inside the slide body to split it into two zones. The most common pattern is bullet points in the first zone and an image in the second — images fill their zone by default (see **Images** below), so this needs no extra sizing syntax:

```json
{
  "cell_type": "raw",
  "id": "cell-presentation-columns",
  "metadata": { "tags": ["presentation"] },
  "source": [
    "<!-- layout: columns -->\n",
    "\n",
    "## Photosynthesis\n",
    "\n",
    "- Converts light energy to chemical energy\n",
    "- Happens in the chloroplasts\n",
    "- Produces oxygen as a byproduct\n",
    "\n",
    ":::\n",
    "\n",
    "![Diagram of photosynthesis](photosynthesis.png)"
  ]
}
```

If the deck (or this slide) has `incremental: true`, the first zone's bullets reveal one at a time on "Next" and the second zone (the image, since it has no list) is visible from the start — the image doesn't wait for the bullets to finish.

Note the `## Photosynthesis` heading above: a heading (or a few consecutive heading lines) at the very start of a columns slide — before any other content — is automatically treated as the slide's title and rendered spanning both columns, not confined to the first zone. Only put a heading there if you want it to act as the slide title; a heading appearing later inside a zone's own content stays inside that zone as normal.

**Images** — standard markdown `![alt](filename.png)`, referencing a file already attached to the notebook (see **Embedded files** above) by its bare filename. No sizing syntax is needed for the common case: an image always expands to fill its slide or column, and centers itself automatically when it's the only thing in its paragraph. For a smaller, specifically-sized image, add a `{width=NN}` suffix directly after the image markdown — `NN` is a **percentage** of the available width, not pixels, so it stays proportional as the slide's own size changes:

```
![School logo](logo.png){width=25}
```

**Navigation behavior worth knowing when authoring:** clicking "Next" on an incremental slide reveals one bullet at a time before advancing to the next slide, but clicking "Previous" always jumps straight back a full slide — it never un-reveals bullets one at a time. Design decks with that in mind: "Previous" is for a teacher revisiting an earlier slide, not for stepping backward through the current one's build. Students can also jump directly to a slide number by clicking the "Slide N / M" label in the control bar.

**What's not supported yet** (a later phase): referencing another cell's code or output from a slide, a Python API for generating slides programmatically, PDF export, and custom theme authoring beyond the six built-in presets. Keep each slide (or each column, for a `columns` layout) to at most one top-level bullet/numbered list — a second list in the same zone won't get its own build steps.

---

## Form fields (Google Colab `#@param` compatible)

Interactive widgets in code cells. Students change values using sliders, dropdowns, or checkboxes without editing code.

```python
AGE = 51 #@param
TEMPERATURE = 1.0 #@param {type:"slider", min:0, max:2, step:0.1}
MODEL = "small" #@param ["small", "medium", "large"]
IS_ENABLED = True #@param {type:"boolean"}
```

A `#@title My Title` comment on the first non-blank line of a code cell renders as a heading above the form widgets. `#@title` is purely presentational — combine it with the `"hide_code"` tag (see **Permanently hidden code cell** above) for Colab-style hidden-code forms.

Add `"run_on_field_change"` to a code cell's `metadata.tags` to have it automatically re-run (debounced ~400ms) whenever a form field changes — useful for sliders students drag to see a live effect. Only field changes trigger the auto-rerun; editing the code text still needs a manual Run.

```json
{
  "cell_type": "code",
  "execution_count": null,
  "id": "cell-live-slider",
  "metadata": {
    "tags": ["run_on_field_change"]
  },
  "outputs": [],
  "source": [
    "SPEED = 5 #@param {type:\"slider\", min:1, max:10}\n",
    "print(f'Speed: {SPEED}')"
  ]
}
```

---

## Built-in Python modules

These modules are always available without `pip install`.

### `samples` — named constants for sample files

Files in `/sample_files/` are pre-loaded at startup (see the `audio` section below for the full list, grouped by category). Rather than typing raw path strings, use `codetto.samples` — it gives students editor autocomplete (`samples.Sounds.` → tab-completes every sound file) so they can discover what's available instead of needing to know filenames in advance or run `os.listdir`.

```python
from codetto import audio, samples

audio.play(samples.Sounds.Laser)          # -> "/sample_files/laser.wav"
audio.play(samples.Music.Bach)            # -> "/sample_files/bach.wav"
box.set_texture(samples.Images.Cat)       # -> "/sample_files/cat.jpg"
```

- `samples.Images`, `samples.Sounds`, `samples.Music` are namespace classes; their attributes are plain path strings, so they drop into any API that takes a file path (`audio.play()`, `graphics.draw_image()`, `set_texture()`, `open()`, …) exactly like a raw string would.
- Constant names are a PascalCase conversion of the filename stem, e.g. `coin_pickup.wav` → `samples.Sounds.CoinPickup`, `space_ambience.wav` → `samples.Sounds.SpaceAmbience`.
- Prefer `samples.*` constants over raw `/sample_files/...` strings in new lesson notebooks — raw strings still work, but the constants are what students see autocomplete for.

### `audio` — play sound files

Files in `/sample_files/` are pre-loaded at startup. Files attached to the notebook (via the Attachments dialog or embedded in `metadata.codetto.files`) are available at `/attachments/` — use them the same way.

- **Images:** `abstract.jpg`, `cat.jpg`, `city.jpg`, `codercub.jpg`, `dog.jpg`, `earth.jpg`, `fabric.jpg`, `forest.jpg`, `undersea.jpg`
- **Sounds:** `clang.wav`, `coin_pickup.wav`, `correct.wav`, `door.wav`, `gameover.wav`, `incorrect.wav`, `laser.wav`, `pop.wav`, `space_ambience.wav`, `thud.wav`, `wood.wav`, `zap.wav`
- **Music:** `ambience.wav`, `bach.wav`, `sibelius.wav`

```python
from codetto import audio, samples

audio.play(samples.Sounds.Correct)              # blocks until done — preferred over raw path strings
await audio.play_async('/sample_files/correct.wav')  # returns immediately (must use await); raw strings still work

# Note names: letter + optional accidental (# or b) + octave, e.g. "C4", "F#3", "Bb5"
audio.play_note('C4', 0.5)                   # single note, blocks until done
audio.play_note(['C4', 'E4', 'G4'], 1.0)     # chord (list of note names)
await audio.play_note_async('A4', 0.25)      # non-blocking

audio.play_notes([                           # sequence of (note, duration) tuples
    ('C4', 0.4), ('E4', 0.4), ('G4', 0.4),
    (['C4', 'E4', 'G4'], 1.0),               # chord in a sequence
])
await audio.play_notes_async(melody)         # non-blocking sequence

audio.speak("Hello, world!")                          # blocks until speech finishes
audio.speak("G'day!", voice=audio.Voice.EN_AU.FEMALE) # with a specific voice
await audio.speak_async("This doesn't block.")        # fire and forget

# Available Voice constants (all have .FEMALE and .MALE):
# Voice.EN_US  Voice.EN_GB  Voice.EN_AU
# Voice.FR_FR  Voice.DE_DE  Voice.ES_ES  Voice.IT_IT  Voice.PT_BR
# Voice.JA_JP  Voice.ZH_CN  Voice.KO_KR  Voice.HI_IN  Voice.AR_SA
```

Supported formats: WAV, MP3, OGG, M4A, FLAC.

### `graphics` — canvas drawing

```python
from codetto import graphics

c = graphics.canvas()               # auto-size (full cell width, 4:3)
c = graphics.canvas(640, 480)       # explicit pixels

# Draw an image file (scaled to fill the whole canvas)
graphics.draw_image(c, '/sample_files/cat.jpg')

# Access HTML Canvas 2D context methods via DOMProxy (snake_case → camelCase)
ctx = c.get_context('2d')
ctx.fill_style = 'red'
ctx.fill_rect(10, 10, 100, 50)
ctx.move_to(0, 0)
ctx.line_to(100, 100)
ctx.stroke()
```

Most standard Canvas2D methods work through the same generic proxy — `move_to`, `line_to`, `quadratic_curve_to`, `bezier_curve_to`, `arc`, `ellipse`, `save`/`restore`, `translate`/`rotate`/`scale`, `set_line_dash`, `close_path`, etc. — call them exactly as documented for HTML Canvas, just in snake_case. **These only accept positional arguments** (e.g. `ctx.fill_rect(10, 10, 100, 50)`, not `ctx.fill_rect(x=10, y=10, ...)`).

**Gradients and patterns:**

```python
gradient = ctx.create_linear_gradient(0, 0, 200, 0)   # also: create_radial_gradient, create_conic_gradient
gradient.add_color_stop(0, '#ff0000')
gradient.add_color_stop(1, '#0000ff')
ctx.fill_style = gradient
ctx.fill_rect(0, 0, 200, 100)

img = graphics.load_image('/sample_files/cat.jpg')    # file path, /attachments/, or a data: URL
pattern = ctx.create_pattern(img, 'repeat')
ctx.fill_style = pattern
ctx.fill_rect(0, 100, 200, 100)
```

**Exporting and displaying the canvas:**

```python
data_url = c.to_data_url()                                          # PNG; default composites drawing + camera feed
data_url = c.to_data_url(include_camera=False)                       # student's drawing only, no camera layer
data_url = c.to_data_url('image/jpeg', 0.85, include_camera=False)   # smaller payload for photo-like content

graphics.display_image(data_url)   # shows a data: URL in the cell output (click-to-zoom/save, like a displayed PIL image)
```

`to_data_url()` is the one method on `canvas` that accepts keyword arguments (`mime_type`, `quality`, `include_camera`) — everything else on `canvas`/`ctx` is positional-only. Prefer `mime_type="image/jpeg"` with a `quality` (e.g. `0.85`) for camera-derived or photographic content — PNG compresses it poorly and large canvases can hit the bridge's payload size limit.

**Click and key events:**

```python
def on_click(x, y):
    print(f'Clicked at {x}, {y}')

def on_space():
    ctx.clear_rect(0, 0, c.get_width(), c.get_height())

c.on_click(on_click)
c.on_key(' ', on_space)     # plain string, e.g. ' ', 'a', 'ArrowLeft'
c.run()                     # blocks in an event loop; Stop button works within ~250ms, same as scene3d.run()
```

### `cv` — webcam and computer vision

All detectors accept an optional `delegate="GPU"` argument (default). Falls back to CPU automatically with a printed warning if GPU is unavailable.

**Setup:**

```python
from codetto import cv
from codetto import graphics

canvas = graphics.canvas()           # auto-sized (full cell width, 4:3)
canvas = graphics.canvas(640, 480)   # explicit pixels
camera = cv.start_camera(canvas)               # starts webcam feed; canvas is optional (headless camera)
camera = cv.start_camera(canvas, mirror=True)  # flips the display (and detector coordinates) horizontally, like a mirror/video call
```

**Face detection** (BlazeFace):

```python
detector = cv.start_face_detector(camera)
detections = detector.get_detections()
# Each detection: {"type": "face", "x": int, "y": int, "w": int, "h": int, "confidence": float}
canvas.draw_bounding_boxes(detections)
detector.stop()
```

**Object detection** (EfficientDet-Lite0, 80 COCO classes):

```python
detector = cv.start_object_detector(camera)
detections = detector.get_detections()
# Each detection: {"type": "<label>", "x": int, "y": int, "w": int, "h": int, "confidence": float}
canvas.draw_bounding_boxes(detections)
detector.stop()
```

**Pose landmarker** (MediaPipe Pose, 33 landmarks):

```python
detector = cv.start_pose_detector(camera)              # num_poses=1 default
detector = cv.start_pose_detector(camera, num_poses=2) # detect up to 2 people
poses = detector.get_detections()
# poses is a list of poses; each pose is a list of 33 landmark dicts:
# {"x": int, "y": int, "z": float, "visibility": float}
# Index landmarks with cv.POSE constants:
left_elbow = poses[0][cv.POSE.LEFT_ELBOW]
canvas.draw_poses(poses)
detector.stop()
```

Available `cv.POSE` landmarks: `NOSE`, `LEFT_EYE_INNER`, `LEFT_EYE`, `LEFT_EYE_OUTER`, `RIGHT_EYE_INNER`, `RIGHT_EYE`, `RIGHT_EYE_OUTER`, `LEFT_EAR`, `RIGHT_EAR`, `MOUTH_LEFT`, `MOUTH_RIGHT`, `LEFT_SHOULDER`, `RIGHT_SHOULDER`, `LEFT_ELBOW`, `RIGHT_ELBOW`, `LEFT_WRIST`, `RIGHT_WRIST`, `LEFT_PINKY`, `RIGHT_PINKY`, `LEFT_INDEX`, `RIGHT_INDEX`, `LEFT_THUMB`, `RIGHT_THUMB`, `LEFT_HIP`, `RIGHT_HIP`, `LEFT_KNEE`, `RIGHT_KNEE`, `LEFT_ANKLE`, `RIGHT_ANKLE`, `LEFT_HEEL`, `RIGHT_HEEL`, `LEFT_FOOT_INDEX`, `RIGHT_FOOT_INDEX`.

**Gesture recognition** (MediaPipe Gesture Recognizer, 21 hand landmarks):

```python
detector = cv.start_gesture_detector(camera)               # num_hands=2 default
detector = cv.start_gesture_detector(camera, num_hands=1)
detections = detector.get_detections()
# Each detection: {"gesture": str, "confidence": float, "handedness": "Left"|"Right",
#                  "landmarks": [{"x": int, "y": int, "z": float}, ...]}  # 21 landmarks
# Gesture values: "None", "Closed_Fist", "Open_Palm", "Pointing_Up",
#                 "Thumb_Down", "Thumb_Up", "Victory", "ILoveYou"
thumb_tip = detections[0]["landmarks"][cv.HAND.THUMB_TIP]
canvas.draw_hands(detections)
detector.stop()
```

Available `cv.HAND` landmarks: `WRIST`, `THUMB_CMC`, `THUMB_MCP`, `THUMB_IP`, `THUMB_TIP`, `INDEX_FINGER_MCP`, `INDEX_FINGER_PIP`, `INDEX_FINGER_DIP`, `INDEX_FINGER_TIP`, `MIDDLE_FINGER_MCP`, `MIDDLE_FINGER_PIP`, `MIDDLE_FINGER_DIP`, `MIDDLE_FINGER_TIP`, `RING_FINGER_MCP`, `RING_FINGER_PIP`, `RING_FINGER_DIP`, `RING_FINGER_TIP`, `PINKY_MCP`, `PINKY_PIP`, `PINKY_DIP`, `PINKY_TIP`.

**Image segmentation** (MediaPipe Selfie Multi-Class):

```python
segmenter = cv.start_segmenter(camera)
segments = segmenter.get_segments()  # list of class names visible in the frame
# e.g. ["background", "hair", "clothes"]

# Paint a segment class with a solid colour
cv.color_segment(canvas, segmenter, cv.SEGMENT.HAIR, "#ff69b4", opacity=0.6)

# Replace a segment with an image, clipped to the segment shape
cv.apply_image_to_segment(canvas, segmenter, cv.SEGMENT.BACKGROUND, "/sample_files/cat.jpg", opacity=0.9)

segmenter.stop()
```

Available `cv.SEGMENT` classes: `BACKGROUND`, `HAIR`, `BODY_SKIN`, `FACE_SKIN`, `CLOTHES`, `OTHERS`.

**Capturing a still frame:**

```python
jpeg_data_url = cv.capture_frame(camera)
# Returns "data:image/jpeg;base64,..." — suitable for passing to a VLM API as an image input.
# The camera must have produced at least one frame before calling this.
```

**Stopping everything:**

```python
camera.stop()
```

### `scene3d` — interactive 3D scenes (BabylonJS)

```python
from codetto import scene3d
import math

scene = scene3d.Scene()          # creates canvas + BabylonJS engine, shows output immediately
scene.set_sky("#87CEEB")         # background colour
scene.set_sky(scene3d.Sky.CLOUDS)  # HDR environment skybox (also drives PBR reflections)

ground = scene.set_ground(length=20, width=20)  # returns a Mesh
ground.set_material(scene3d.Material.Grass.Bright)
ground.set_tiling(10)            # repeat texture 10× across the ground

box = scene3d.Shapes.Box(width=1, height=1, depth=1)
box.set_position(0, 0.5, 0)
box.set_rotation(y=45)           # degrees; any combination of x, y, z
box.set_color("#cc4400")
box.set_texture('/sample_files/cat.jpg')   # file path from Pyodide FS
box.set_texture('data:image/png;base64,…') # data URL (e.g. from AI model)
box.set_scale(1, 2, 1)           # scale on each axis
box.set_material(scene3d.Material.Bricks.DarkClay)  # PBR material
box.set_glossiness(0.3)          # 0.0 = matte, 1.0 = mirror-like (PBR only)
box.on_click(lambda: box.set_color("#ff0000"))
scene.add(box)

sphere = scene3d.Shapes.Sphere(diameter=1, segments=16)
scene.add(sphere)

cylinder = scene3d.Shapes.Cylinder(diameter=1, height=2, tessellation=16)
scene.add(cylinder)

# Collision detection — call on_collide after scene.add() for both meshes, before scene.run()
box.on_collide(sphere, lambda: box.set_color("#00ff00"))  # fires once when bounding boxes first overlap
# Multiple colliders on the same mesh are supported:
# box.on_collide(cylinder, lambda: print("hit cylinder"))

# Key handling — register on_key before scene.run()
# Camera arrow-key bindings are removed automatically when any on_key is registered.
# Canvas is auto-focused so keys work immediately without clicking.
scene.on_key(scene3d.Key.LEFT,  move_left)    # Key constants for special keys
scene.on_key(scene3d.Key.RIGHT, move_right)
scene.on_key(scene3d.Key.UP,    move_forward) # UP = +z (away from default camera)
scene.on_key(scene3d.Key.DOWN,  move_back)    # DOWN = -z
scene.on_key(scene3d.Key.SPACE, jump)
scene.on_key('w', move_forward)               # plain strings for letter keys
# Available Key constants: Key.LEFT, Key.RIGHT, Key.UP, Key.DOWN,
#                          Key.SPACE, Key.ENTER, Key.ESCAPE

ctx = scene.get_context('2d')    # 2D overlay canvas for HUD drawing (supports standard Canvas2D methods)

t = 0.0

@scene.on_frame                  # called each render tick; dt = seconds since last frame
def animate(dt):
    global t
    t += dt
    box.set_position(0, 0.5 + math.sin(t * 2), 0)
    ctx.clear()
    ctx.fill_style = '#ffffff'
    ctx.fill_text(f'Time: {t:.1f}s', 10, 24)

scene.run()                      # blocks Python in event loop; Stop button works
```

**Shapes:** `Shapes.Box(width, height, depth)`, `Shapes.Sphere(diameter, segments)`, `Shapes.Cylinder(diameter, height, tessellation)`, `Shapes.Plane(width, height)`, `Shapes.Cone(diameter, height, tessellation)`, `Shapes.Torus(diameter, thickness, tessellation)`, `Shapes.Text(text, size, depth, resolution)`.

**Mesh methods:** `set_position(x, y, z)`, `set_rotation(x, y, z)` (degrees), `set_scale(x, y, z)`, `set_color(hex)`, `set_texture(source)`, `set_material(constant)`, `set_glossiness(value)`, `set_tiling(u, v=None)`, `on_click(fn)`, `on_collide(other_mesh, fn)`. All keyword arguments default to 0 (or 1 for scale), so `set_rotation(y=45)` is valid. `set_ground` returns a `Mesh` so all these methods work on the ground too.

**Mesh getters:** `get_position()` → `(x, y, z)` tuple, `get_rotation()` → `(x, y, z)` tuple in degrees, `get_scale()` → `(x, y, z)` tuple, `get_color()` → hex string. Values are always in sync because every `set_*` call updates Python-side state immediately.

**`Group`:** groups multiple meshes so they move and rotate as a single unit. Child positions and rotations are relative to the group origin. Supports `set_position`, `set_rotation`, `set_scale`, `get_position`, `get_rotation`, `get_scale`. No appearance methods (`set_color`, `set_material`, etc.) — those belong on the individual child meshes.

```python
car = scene3d.Group()

body = scene3d.Shapes.Box(width=2, height=0.5, depth=1)
body.set_color('#cc2200')

wheel = scene3d.Shapes.Cylinder(diameter=0.4, height=0.15, tessellation=16)
wheel.set_rotation(z=90)
wheel.set_position(0.8, 0, 0.5)
wheel.set_color('#222222')

car.add(body)
car.add(wheel)
car.set_position(0, 0.5, 0)
scene.add(car)                   # adds the group + all children in one call

car.set_rotation(y=45)           # rotates the whole group
```

**`set_texture(source)`:** accepts a file path (e.g. `'/sample_files/cat.jpg'`), a `data:` URL, or a raw base64 string (assumed PNG). Setting a texture resets the color to white; call `set_color` after `set_texture` to apply a tint.

**`set_material(constant)`:** applies a PBR material (colour + normal + roughness) or simple diffuse texture. Available constants:

```python
# Bricks
box.set_material(scene3d.Material.Bricks.DarkClay)
box.set_material(scene3d.Material.Bricks.RoughStone)
# Carpet: BlueCheckerboard, BeigePattern
# Chip: CircuitGreen, CircuitRed, CircuitOrange, CircuitBlue
# Fabric: BurgundyRibbed, BlueQuilted, BlackTartan, RedBlueCheck, Denim
# Grass: Bright, Dark, Olive
# Gravel: LightGray, DarkGray
# Marble: Brown, Gray, Black, Charcoal
# Planets (simple): Earth, Jupiter, Mars, Mercury, Neptune, Saturn, Uranus, Venus, Moon
# Road: PatchedAsphalt, AsphaltEdges, Highway
# RoofingTiles: DarkSlate
# Snow: Fresh
# Sports (simple): Soccerball, Tennis
# Tiles: LimeGreen, GreenMosaic, WoodHexagon, Checkerboard
# Wood: Oak
# WoodFloor: PinePlanks
```

**`set_glossiness(value)`:** `0.0` = completely matte, `1.0` = mirror-like. Only affects PBR materials (set via `set_material`); no-ops on plain colour/texture meshes.

**`set_tiling(u, v=None)`:** repeats the texture `u` times horizontally and `v` vertically (`v` defaults to `u`). Persists across `set_material` calls. Essential for ground planes — without it a single tile stretches across the whole surface.

**`set_sky(color)`:** accepts a hex colour string (e.g. `"#87CEEB"`) or a `Sky` constant. When an env skybox is used, PBR materials automatically pick up IBL reflections.

```python
scene.set_sky(scene3d.Sky.CLOUDS)
scene.set_sky(scene3d.Sky.DEEP_SPACE)
scene.set_sky(scene3d.Sky.MODERN_BUILDINGS)
scene.set_sky(scene3d.Sky.ORLANDO_STADIUM)
scene.set_sky(scene3d.Sky.PURE_SKY)
```

**`scene.ambient` — world light control:**

```python
scene.ambient.set_brightness(50)     # dim the scene (0–100 scale; default 90; 0 = pitch black)
scene.ambient.set_color("#ffddcc")   # warm tint; "#cceeff" for cool/moonlight
```

**`scene.add_light(x, y, z)` — add a point light:**

```python
light = scene.add_light(0, 5, 0)     # point light overhead, returns a Light object
light.set_brightness(80)             # 0–100 scale; default 100; maps to 0–20 BabylonJS internally
light.set_color("#ff4400")           # warm orange; indicator sphere tint matches
light.set_visible(True)              # show a small glowing sphere at the light's position
light.set_position(3, 5, -2)        # move the light (and indicator) together
light.set_visible(False)             # hide indicator for the final scene
light.remove()                       # dispose the light entirely
```

`set_visible(True)` is the "discover" tool — it places a small emissive sphere exactly where the light is, making it easy to see and position lights while building a scene.

**`scene.camera` — camera control:**

```python
scene.camera.set_position(0, 10, -15)   # teleport camera to world position
scene.camera.move(dx=2, dy=0, dz=0)     # move by a relative amount
scene.camera.look_at(box)               # point at a mesh
scene.camera.look_at(0, 0, 0)          # point at world coordinates
scene.camera.set_distance(20)           # zoom (distance from target)
scene.camera.follow(box, distance=15)   # track a mesh every frame; optional distance
scene.camera.follow(None)               # stop following
scene.camera.reset()                    # return to default position and angle
# All methods return self, so chaining works:
scene.camera.set_position(5, 5, -10).set_distance(18).look_at(0, 1, 0)
```

The student can still use mouse orbit and scroll-wheel zoom on top of any camera call — those controls stay active throughout.

**`scene.import_meshes(meshes)`:** creates and adds meshes from a list of descriptors — ideal for LLM-generated scenes. Each descriptor is a plain dict or a Pydantic model instance. Supported fields:

| Field | Values | Default |
|---|---|---|
| `type` | `"Box"` \| `"Sphere"` \| `"Cylinder"` \| `"Plane"` \| `"Cone"` \| `"Torus"` \| `"Text"` | required |
| `position` | `[x, y, z]` | `[0, 0, 0]` |
| `rotation` | `[x, y, z]` degrees | `[0, 0, 0]` |
| `scale` | `[x, y, z]` | `[1, 1, 1]` |
| `color` | hex string | grey |
| `material` | dotted string e.g. `"Grass.Bright"` | none |
| `width` / `height` / `depth` | floats (Box) | 1 |
| `diameter` / `segments` | float / int (Sphere) | 1 / 16 |
| `diameter` / `height` / `tessellation` | floats / int (Cylinder / Cone) | 1 / 1 / 24 |
| `width` / `height` | floats (Plane) | 1 |
| `diameter` / `thickness` / `tessellation` | floats / int (Torus) | 1 / 0.5 / 16 |
| `text` / `size` / `depth` | string / floats (Text) | required / 1 / 0.2 |

Unknown `type` values and unrecognised `material` strings are silently skipped. Use with OpenAI structured output.

**Scene defaults:** ArcRotateCamera (mouse orbit/zoom), HemisphericLight, dark background. BabylonJS loads lazily the first time `scene3d` is used.

**`ctx.clear()`** is a custom method that clears the full 2D overlay; all other standard Canvas2D methods work normally.

**`scene.run()`** must be the last call — it blocks Python in an event loop. The Stop button interrupts it within ~250 ms.

### `hardware` — physical devices (BLE heart rate monitor)

```python
from codetto import hardware

hrm = hardware.HeartRateMonitor.connect()   # opens the browser's Bluetooth device picker; blocks until paired

reading = hrm.get_reading()   # -> HeartRateReading | None, returns instantly (no bridge wait)
if reading:
    print(reading.bpm, reading.contact_detected, reading.rr_intervals)

hrm.is_connected()   # False once the strap disconnects (explicit disconnect(), out of range, powered off)
hrm.disconnect()
```

**Important:** `connect()` requires an active, still-fresh user gesture — call it as one of the very first statements in the cell. A cell that runs several seconds of computation before calling `connect()` will fail with a security error, since the click that ran the cell is no longer considered "active" by then. Chrome/Edge only (no Safari, no Firefox by default).

### `keyboard` — key presses in canvas-less notebooks

For plain console-style cells with no canvas, camera, or 3D scene. (`graphics.Canvas` and `scene3d.Scene` each have their own canvas-scoped `on_key`/`run` — use `codetto.keyboard` only when there's no canvas to attach to.)

```python
from codetto import keyboard

def on_left():
    print("left!")

def on_escape():
    print("bye")
    keyboard.stop()

keyboard.on_key(keyboard.Key.LEFT, on_left)
keyboard.on_key(keyboard.Key.ESCAPE, on_escape)
keyboard.run()   # blocks, dispatching key presses; Stop button works within ~250ms
```

`Key` constants: `LEFT`, `RIGHT`, `UP`, `DOWN`, `SPACE`, `ENTER`, `ESCAPE`, `TAB` (letter/digit keys are passed as plain strings, e.g. `'a'`).

### `pygame` — real pygame-ce, for classic pygame-style games

`import pygame` works directly — no `micropip.install` needed, same as `numpy`/`pandas`. This is real `pygame-ce`, not a `codetto.*` module, so most existing pygame code and tutorials work unmodified: `Surface`, `draw`, `font`, `sprite`, `Rect`, `transform`, and `time.Clock` are all real, unmodified pygame-ce. Only `pygame.display`, `pygame.event`, `pygame.mixer`, and the `get_pressed()` functions on `pygame.key`/`pygame.mouse` are shimmed to work inside the browser — students never need to know this to write normal pygame code.

```python
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 480))   # creates a live canvas; size is fixed exactly as passed
clock = pygame.time.Clock()

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            print("jump!")

    screen.fill((30, 30, 60))
    pygame.draw.circle(screen, (255, 200, 0), (320, 240), 40)
    pygame.display.flip()   # or .update() — pushes the frame to the canvas

    clock.tick(60)          # real pygame Clock; also what lets Stop interrupt within ~1 frame
```

**Write it as a standard `while running:` loop**, exactly like any pygame tutorial — `pygame.event.get()` returns immediately every call (never blocks), and `clock.tick(fps)` provides real frame pacing. There's no `on_key`/`wait_event` callback pattern here, unlike `scene3d`/`graphics`/`keyboard`.

- **Canvas size is fixed to whatever you pass `set_mode()`** — it does not auto-fit to the cell width, unlike `graphics.canvas()`. Every boundary check in a game (`if x > 400:`) is written assuming that call fixed the coordinate space, so pick a size and treat it as final; it only scales down proportionally (`max-width: 100%`) on narrow viewports.
- **Keyboard capture is document-scoped** — no click-to-focus step needed, matching what real pygame tutorials expect. Arrow keys/Space/Page/Home/End stop scrolling the page once a display exists.
- **Mouse position** (`pygame.mouse.get_pos()`) is canvas-scoped, in the same logical pixel coordinates as your `set_mode()` size.
- **`pygame.mixer` plays through `codetto.audio` under the hood** — real SDL audio isn't available in this environment. `Sound.play()` and `music.load()`/`.play()`/`.stop()` work; there's only one implicit channel, so `Sound.stop()`/`set_volume()` are accepted but silently no-op, and looping/fading/panning/multiple channels aren't supported. Design games around one background track plus fire-and-forget sound effects.
- **`pygame.QUIT` never fires** — there's no window to close in a notebook cell. An unbounded game loop's only real exit is the student clicking Stop; if you want a loop that ends on its own, add your own condition (a max frame count, a win/lose state, an `ESCAPE` keypress) rather than relying on `QUIT`.
- Not yet supported: joystick/gamepad input, `pygame.camera`, touch input, and punctuation-key mapping (letters, digits, and named keys like arrows/space/enter map correctly; keys like comma/slash currently don't).

`pygame-ce`'s own upstream API docs apply directly for everything not called out above — this is a real, current version of the library, not a cut-down reimplementation. Editor autocomplete stubs currently reflect the real upstream API, so they may suggest a method the shim doesn't actually support (e.g. a truly-blocking `pygame.event.wait()`) — verify against the notes above before relying on autocomplete for `display`/`event`/`mixer`/`key`/`mouse`.

---

### Standard scientific libraries (available via Pyodide)

These do not need `micropip` — just `import` them:
- `numpy`, `pandas`, `matplotlib`, `scikit-learn`, `scipy`, `pygame` (`pygame-ce`, see **`pygame`** above)
- `openai` (via micropip if needed — check notebook context)

For any other package, use `import micropip; await micropip.install("package-name")` before importing.

---

## Localization (i18n)

Cell source can have per-locale overrides in `cell.metadata.i18n[locale]` — when the active locale matches, the renderer swaps in the localized source instead. Recommended for markdown cells only; using it on code cells risks overwriting a student's own edits when the locale changes.

```json
{
  "cell_type": "markdown",
  "id": "cell-intro",
  "metadata": {
    "i18n": {
      "ja-JP": {
        "source": ["## ようこそ Python へ\n", "\n", "この課では **変数** について学びます。"]
      }
    }
  },
  "source": [
    "## Welcome to Python\n",
    "\n",
    "In this lesson you will learn about **variables**."
  ]
}
```

CFU cells use their own `i18n` shape nested inside the CFU JSON payload (see the CFU **Optional fields** above) rather than `cell.metadata.i18n`. Global `{{VARIABLE}}` substitution (see **Globals** above) also resolves per-locale.

---

## Cell IDs

Always set a meaningful `id` on each cell. IDs must be unique within the notebook. Use kebab-case prefixed by type:
- `cell-intro`, `cell-instructions` — markdown
- `cell-hello`, `cell-exercise-1` — code
- `cell-video-intro` — video
- `cell-journal-1` — journal
- `cell-cfu-1`, `cell-cfu-variables` — CFU
- `cell-presentation-intro`, `cell-presentation-1` — presentation

---

## Typical lesson structure

A well-structured K-12 lesson notebook follows this pattern:

1. **Video cell** — short intro video (optional)
2. **Markdown** — learning objective(s) for the lesson
3. **Markdown + Code pairs** — concept explanation followed by a runnable example
4. **Journal cell** — student reflection prompt
5. **Form-field code cell** — interactive experiment where students tweak parameters
6. **CFU cells** — 2–4 check-for-understanding questions at the end

Keep code cells short (under 20 lines). Prefer multiple small cells over one large one so students can run incrementally and see output after each step.

---

## Key rules

- **Always use `Write` (never `NotebookEdit`)** when creating or editing notebooks
- `source` must be an **array of strings**, each line ending with `\n` except the last
- `submitted_answer` in CFU cells must be `""` (never omit it)
- Set `cell.id` on every cell — use descriptive kebab-case names
- Set `metadata.codetto.title` in the notebook metadata (all Codetto-specific metadata fields go under `metadata.codetto`, never as flat top-level keys)
- `outputs` must be `[]` and `execution_count` must be `null` in all code cells
- Do not include a `language_info` key; the platform doesn't use it
- Use `{{VARIABLE}}` globals for any content that varies by locale or student context
- Add i18n overrides to markdown cells when the notebook targets multilingual classrooms
