// scripts/build-extension.mjs
//
// Bundles the background service worker and content script into single,
// dependency-free IIFE files (Manifest V3 content scripts can't rely on
// ES module imports the way the popup can), then copies manifest.json
// and the icon set into dist/. Run after `vite build` has produced the
// popup bundle.
import { build } from "esbuild";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");

async function bundle(entry, outfile, name) {
  await build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    outfile: path.join(dist, outfile),
    format: "iife",
    target: "chrome110",
    platform: "browser",
    sourcemap: true,
    logLevel: "info",
  });
  console.log(`[build-extension] ${name} -> dist/${outfile}`);
}

async function main() {
  if (!existsSync(dist)) await mkdir(dist, { recursive: true });

  await bundle("src/background/index.ts", "background.js", "background");
  await bundle("src/content/index.ts", "content.js", "content");

  // Copy manifest.json
  await cp(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));

  // Copy icons
  const iconsSrc = path.join(root, "public", "icons");
  const iconsDest = path.join(dist, "icons");
  if (existsSync(iconsSrc)) {
    await cp(iconsSrc, iconsDest, { recursive: true });
  }

  // Sanity check: make sure the manifest's referenced files all exist.
  const manifest = JSON.parse(await readFile(path.join(dist, "manifest.json"), "utf-8"));
  const mustExist = [
    manifest.action?.default_popup,
    manifest.background?.service_worker,
    ...(manifest.content_scripts?.flatMap((c) => c.js ?? []) ?? []),
  ].filter(Boolean);

  for (const rel of mustExist) {
    const p = path.join(dist, rel);
    if (!existsSync(p)) {
      throw new Error(`[build-extension] manifest references missing file: ${rel}`);
    }
  }

  console.log("[build-extension] dist/ is ready to load as an unpacked extension.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
