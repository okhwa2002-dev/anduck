import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "src", "mapper");
const target = resolve(root, "dist", "mapper");

if (!existsSync(source)) {
  throw new Error(`Mapper directory not found: ${source}`);
}

mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
