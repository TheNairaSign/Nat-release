import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const current = String(pkg.dependencies.expo).replace(/[^\d.]/g, "");
const currentMajor = Number(current.split(".")[0]);

const res = await fetch("https://registry.npmjs.org/expo/latest");
if (!res.ok) {
  console.log("Could not reach npm; skipping staleness check.");
  process.exit(0);
}
const latest = await res.json();
const latestMajor = Number(String(latest.version).split(".")[0]);
const behind = latestMajor - currentMajor;

if (behind > 1) {
  console.error(
    `Expo SDK is ${behind} majors behind (project ${current}, npm latest ${latest.version}). Upgrade.`,
  );
  process.exit(1);
}

console.log(`Expo OK — project ${current}, latest ${latest.version}.`);
