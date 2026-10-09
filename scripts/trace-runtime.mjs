import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { nodeFileTrace } from "@vercel/nft";

const root = process.cwd();
const out = path.join(root, ".runtime");

const { fileList, warnings } = await nodeFileTrace([path.join(root, "dist/server/entry.mjs")], { base: root });

for (const warning of warnings) {
  if (!String(warning.message).includes("Failed to resolve dependency")) continue;
  console.warn(`trace: ${warning.message}`);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

let count = 0;
for (const file of fileList) {
  if (!file.startsWith("node_modules/") && !file.startsWith("node_modules\\")) continue;
  const target = path.join(out, file);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(root, file), target, { dereference: true });
  count += 1;
}

await cp(path.join(root, "dist"), path.join(out, "dist"), { recursive: true });
await cp(path.join(root, "package.json"), path.join(out, "package.json"));
console.log(`trace: copied ${count} dependency files to .runtime`);
