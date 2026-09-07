#!/usr/bin/env node
// Turn an image file into the `metadata.codetto.image` value for a Codetto
// notebook (the index-card background image).
//
// Standalone port of the teacher-facing upload pipeline so this repo can be
// used on its own, without the main `codetto/core` checkout. It reproduces the
// same three steps as core's `src/utils/imageResize.ts`:
//
//   1. downscale so the longest side is <= 800px (never upscale)
//   2. re-encode as JPEG, trying quality 0.82 / 0.70 / 0.55 in order
//   3. take the first result whose data URL is under 400 KB
//
// The one difference from the app: encoding goes through jimp rather than a
// browser <canvas>, so the JPEG bytes differ slightly from what a teacher's
// upload would produce. Dimensions, quality ladder and size cap are identical.
//
// >>> Keep the three constants below in sync with core's src/utils/imageResize.ts. <<<
//
// Usage:
//   npm install                                   # first time only
//   node scripts/notebook-image.mjs cover.png      # prints the data: URL to stdout
//   node scripts/notebook-image.mjs cover.png --json   # prints {"image": "data:..."}
//
// Progress / size info goes to stderr, so stdout is safe to capture:
//   IMG=$(node scripts/notebook-image.mjs cover.png)

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { Jimp } from "jimp";

// --- must match core/src/utils/imageResize.ts ------------------------------
const MAX_DIMENSION = 800;
const JPEG_QUALITIES = [82, 70, 55]; // jimp takes 0-100; the app uses 0.82 / 0.70 / 0.55
const MAX_IMAGE_DATA_URL_BYTES = 400 * 1024;
// -------------------------------------------------------------------------

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
};

// Don't crash with a stack trace when stdout is closed early (e.g. piped to `head`).
process.stdout.on("error", (err) => {
  if (err.code === "EPIPE") process.exit(0);
  throw err;
});

function fail(message) {
  console.error(`notebook-image: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const inputPath = args.find((a) => !a.startsWith("--"));

if (!inputPath) fail("no image path given.\n  usage: node scripts/notebook-image.mjs <image> [--json]");
if (!existsSync(inputPath)) fail(`file not found: ${inputPath}`);

const ext = path.extname(inputPath).toLowerCase();
if (!MIME_BY_EXT[ext]) {
  fail(`unsupported image type "${ext}". Use one of: ${Object.keys(MIME_BY_EXT).join(", ")}`);
}

// base64 inflates a payload by ~4/3; this mirrors core's dataUrlByteSize().
function dataUrlByteSize(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((base64.length * 3) / 4);
}

let image;
try {
  image = await Jimp.read(await readFile(inputPath));
} catch {
  fail(`could not decode ${inputPath} as an image`);
}

const srcWidth = image.width;
const srcHeight = image.height;

const scale = Math.min(1, MAX_DIMENSION / Math.max(srcWidth, srcHeight));
if (scale < 1) {
  image.resize({ w: Math.round(srcWidth * scale), h: Math.round(srcHeight * scale) });
}

let result = null;
let resultBytes = 0;
for (const quality of JPEG_QUALITIES) {
  const buffer = await image.getBuffer("image/jpeg", { quality });
  const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  if (dataUrlByteSize(dataUrl) <= MAX_IMAGE_DATA_URL_BYTES) {
    result = dataUrl;
    resultBytes = dataUrlByteSize(dataUrl);
    break;
  }
}

if (!result) {
  fail(
    `could not compress this image under ${Math.round(MAX_IMAGE_DATA_URL_BYTES / 1024)} KB ` +
      `even at the lowest quality. Try a simpler or smaller source image.`,
  );
}

const scaled = Math.max(srcWidth, srcHeight) > MAX_DIMENSION;
console.error(
  `notebook-image: ${srcWidth}x${srcHeight}` +
    `${scaled ? ` -> downscaled to <= ${MAX_DIMENSION}px` : " (no downscale needed)"}` +
    `, JPEG ${(resultBytes / 1024).toFixed(0)} KB (limit ${Math.round(MAX_IMAGE_DATA_URL_BYTES / 1024)} KB)`,
);

process.stdout.write((asJson ? JSON.stringify({ image: result }) : result) + "\n");
