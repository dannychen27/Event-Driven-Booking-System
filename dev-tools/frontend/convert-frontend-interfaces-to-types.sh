#!/bin/bash
set -euo pipefail

ROOT="3. frontend"
SRC="$ROOT/src"
BACKUP="$ROOT/src-interface-conversion-backup"

printf '%s\n' "=== Converting frontend interfaces to type aliases ==="

if [ ! -d "$SRC" ]; then
  printf 'Error: Cannot find %s. Run this script from the repository root.\n' "$SRC" >&2
  exit 1
fi

if [ ! -f "$ROOT/node_modules/typescript/lib/typescript.js" ]; then
  printf '%s\n' "Error: TypeScript is not installed in the frontend."
  printf '%s\n' "Run npm install in '$ROOT' first."
  exit 1
fi

if [ -e "$BACKUP" ]; then
  printf 'Error: Backup already exists: %s\n' "$BACKUP" >&2
  printf '%s\n' "Review or rename it before running this script again."
  exit 1
fi

cp -R "$SRC" "$BACKUP"

export SRC
export TS_PATH="$PWD/$ROOT/node_modules/typescript"

node <<'NODE'
const fs = require("fs");
const path = require("path");
const ts = require(process.env.TS_PATH);

const root = process.env.SRC;
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;

    const file = path.join(dir, entry.name);

    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(file);
    }
  }
}

walk(root);

const declarations = new Map();
const sources = new Map();

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file, text, ts.ScriptTarget.Latest, true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  sources.set(file, { text, source });

  function visit(node) {
    if (ts.isInterfaceDeclaration(node)) {
      const key = node.name.text;
      if (!declarations.has(key)) declarations.set(key, []);
      declarations.get(key).push({ file, node });
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
}

let converted = 0;
let skipped = 0;

for (const [file, data] of sources) {
  const edits = [];

  function visit(node) {
    if (ts.isInterfaceDeclaration(node)) {
      const name = node.name.text;
      const reason =
        node.heritageClauses?.length ? "uses extends/implements" :
        declarations.get(name).length > 1 ? "duplicate interface name" :
        node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)
          ? "default export needs manual handling" :
        null;

      if (reason) {
        console.log(`SKIP ${file}: ${name} (${reason})`);
      } else {
        const start = node.getStart(data.source);
        const end = node.end;
        const modifiers = node.modifiers
          ? node.modifiers.map(m => m.getText(data.source)).join(" ") + " "
          : "";
        const typeParams = node.typeParameters
          ? node.typeParameters.map(p => p.getText(data.source)).join(", ")
          : "";
        const generic = node.typeParameters ? `<${typeParams}>` : "";
        const members = node.members
          .map(m => m.getText(data.source))
          .join("\n");

        edits.push({
          start,
          end,
          replacement: `${modifiers}type ${name}${generic} = {\n${members}\n};`
        });

        console.log(`CONVERT ${file}: ${name}`);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(data.source);

  if (edits.length) {
    let result = data.text;

    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      result =
        result.slice(0, edit.start) +
        edit.replacement +
        result.slice(edit.end);
    }

    fs.writeFileSync(file, result);
    converted += edits.length;
  }
}

console.log(`\nConverted: ${converted}`);
console.log("Backup: " + process.env.SRC.replace(/src$/, "src-interface-conversion-backup"));
console.log("Skipped declarations should be reviewed manually.");
NODE
