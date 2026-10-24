import fs from "fs";
import path from "path";

// collect named exports from data-model/lib/index.js recursively (static re-exports)
const dmDir = "node_modules/@mlightcad/data-model/lib/";
const seen = new Set();
const exports_ = new Set();
function walk(file) {
  if (seen.has(file)) return;
  seen.add(file);
  let src;
  try { src = fs.readFileSync(file, "utf8"); } catch { return; }
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (let part of m[1].split(",")) {
      part = part.trim();
      if (!part) continue;
      const name = part.split(/\s+as\s+/).pop().trim();
      if (name) exports_.add(name);
    }
  }
  for (const m of src.matchAll(/export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g)) {
    const p = path.join(dmDir, m[1]) + ".js";
    walk(p);
  }
  for (const m of src.matchAll(/export\s+\*\s+as\s+\w+\s+from/g)) {
    /* namespace exports: skip */
  }
}
walk(path.join(dmDir, "index.js"));
const names = [...exports_];

const dxfDir = "node_modules/@mlightcad/dxf-json-converter/lib/";
const imports = new Set();
for (const f of fs.readdirSync(dxfDir)) {
  if (!f.endsWith(".js")) continue;
  const src = fs.readFileSync(dxfDir + f, "utf8");
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@mlightcad\/data-model['"]/g)) {
    m[1].split(",").forEach((x) => {
      const n = x.trim().split(/\s+as\s+/)[0].trim();
      if (n) imports.add(n);
    });
  }
}
const missing = [...imports].filter((i) => !names.includes(i)).sort();
console.log("total data-model exports:", names.length);
console.log("dxf imports:", imports.size);
console.log("MISSING:", JSON.stringify(missing));
