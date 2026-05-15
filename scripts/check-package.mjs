import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [, , packageDirArg] = process.argv;

if (packageDirArg === undefined) {
  console.error("Usage: node scripts/check-package.mjs <package-dir>");
  process.exit(1);
}

const packageDir = resolve(packageDirArg);
const packageJsonPath = join(packageDir, "package.json");
const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const missing = [];

function checkPath(label, value) {
  if (typeof value !== "string" || !value.startsWith("./")) return;
  const diskPath = join(packageDir, value);
  if (!existsSync(diskPath)) missing.push(`${label}: ${value}`);
}

function walkExports(node, label) {
  if (typeof node === "string") {
    checkPath(label, node);
    return;
  }
  if (node === null || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    walkExports(value, `${label}.${key}`);
  }
}

checkPath("main", pkg.main);
checkPath("module", pkg.module);
checkPath("types", pkg.types);
checkPath("react-native", pkg["react-native"]);
walkExports(pkg.exports, "exports");

if (missing.length > 0) {
  console.error(`Package ${pkg.name} references files that do not exist:`);
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Package ${pkg.name} references existing entry files.`);
