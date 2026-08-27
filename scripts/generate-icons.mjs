// scripts/generate-icons.mjs
//
// Generates the extension icon set as pure-JS-rendered PNGs (no native
// deps, no network fetch): a rounded dark tile with the two-node "relay"
// mark used in the popup header — a teal node, an amber node, and a
// dashed connector between them.
import { PNG } from "pngjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public", "icons");

const BG = [16, 19, 26, 255]; // #10131a
const BORDER = [38, 44, 58, 255]; // #262c3a
const TEAL = [86, 214, 196, 255]; // #56d6c4
const AMBER = [255, 180, 84, 255]; // #ffb454

function makeCanvas(size) {
  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = BG[0];
    png.data[i + 1] = BG[1];
    png.data[i + 2] = BG[2];
    png.data[i + 3] = BG[3];
  }
  return png;
}

function setPixel(png, x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  if (alpha >= 1) {
    png.data[idx] = color[0];
    png.data[idx + 1] = color[1];
    png.data[idx + 2] = color[2];
    png.data[idx + 3] = color[3];
    return;
  }
  // simple alpha blend over existing pixel
  const inv = 1 - alpha;
  png.data[idx] = Math.round(color[0] * alpha + png.data[idx] * inv);
  png.data[idx + 1] = Math.round(color[1] * alpha + png.data[idx + 1] * inv);
  png.data[idx + 2] = Math.round(color[2] * alpha + png.data[idx + 2] * inv);
  png.data[idx + 3] = 255;
}

function fillRoundedRect(png, size, radius, color) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inCorner =
        (x < radius && y < radius) ||
        (x >= size - radius && y < radius) ||
        (x < radius && y >= size - radius) ||
        (x >= size - radius && y >= size - radius);

      if (!inCorner) {
        setPixel(png, x, y, color);
        continue;
      }

      const cx = x < radius ? radius : size - radius;
      const cy = y < radius ? radius : size - radius;
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        setPixel(png, x, y, color);
      }
      // else: leave transparent-ish background (already BG) — acceptable
      // for a small toolbar icon; Chrome masks/pads icons anyway.
    }
  }
}

function drawCircle(png, cx, cy, r, color) {
  const rSq = r * r;
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const dx = x - cx;
      const dy = y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq <= rSq) {
        setPixel(png, x, y, color);
      } else if (distSq <= (r + 1) * (r + 1)) {
        // 1px antialiasing ring
        const dist = Math.sqrt(distSq);
        const alpha = Math.max(0, 1 - (dist - r));
        setPixel(png, x, y, color, alpha);
      }
    }
  }
}

function drawDashedLine(png, x1, y, x2, thickness, color, dash, gap) {
  let x = x1;
  let drawing = true;
  while (x < x2) {
    const segEnd = Math.min(x + (drawing ? dash : gap), x2);
    if (drawing) {
      for (let px = x; px < segEnd; px++) {
        for (let t = -Math.floor(thickness / 2); t <= Math.floor(thickness / 2); t++) {
          setPixel(png, px, y + t, color);
        }
      }
    }
    x = segEnd;
    drawing = !drawing;
  }
}

function renderIcon(size) {
  const png = makeCanvas(size);
  const radius = Math.round(size * 0.22);
  fillRoundedRect(png, size, radius, BG);

  // subtle border for larger sizes only (keeps small sizes crisp)
  if (size >= 48) {
    for (let x = 0; x < size; x++) {
      setPixel(png, x, 0, BORDER, 0.4);
      setPixel(png, x, size - 1, BORDER, 0.4);
    }
  }

  const cy = size / 2;
  const nodeR = Math.max(1.4, size * 0.09);
  const leftX = size * 0.28;
  const rightX = size * 0.72;

  drawDashedLine(
    png,
    Math.round(leftX + nodeR + 1),
    Math.round(cy),
    Math.round(rightX - nodeR - 1),
    Math.max(1, Math.round(size * 0.045)),
    [154, 163, 184, 255],
    Math.max(2, Math.round(size * 0.06)),
    Math.max(2, Math.round(size * 0.05))
  );

  drawCircle(png, leftX, cy, nodeR, TEAL);
  drawCircle(png, rightX, cy, nodeR, AMBER);

  return png;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const sizes = [16, 32, 48, 128];
  for (const size of sizes) {
    const png = renderIcon(size);
    const buffer = PNG.sync.write(png);
    const file = path.join(outDir, `icon${size}.png`);
    await writeFile(file, buffer);
    console.log(`[generate-icons] wrote ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
