#!/usr/bin/env node
// Structural validator for Mermaid `.mmd` files.
//
// Catches common syntax breakage before posting to GitHub:
//   - missing/unrecognized diagram type opener
//   - unbalanced subgraph/end blocks
//   - unbalanced [ ] node-label brackets
//   - unbalanced ( ) and { } node shape brackets
//
// Not a full Mermaid parser. The official @mermaid-js/parser only covers
// specialty types (pie, info, packet, gitGraph, architecture, ...) and not
// flowchart/graph, which is what this skill produces. Structural checks are
// good enough to catch the typos that actually break GitHub rendering.

import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: validate-mermaid.mjs <file.mmd>');
  process.exit(2);
}

const text = readFileSync(file, 'utf8');

const firstLine = text
  .split('\n')
  .find((l) => l.trim() && !l.trim().startsWith('%%'));

if (!firstLine) {
  console.error('Empty diagram (no non-comment content).');
  process.exit(1);
}

const KNOWN_TYPES =
  /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|gitGraph|requirementDiagram|mindmap|timeline|quadrantChart|xychart|sankey|block-beta|kanban|architecture-beta|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|info|packet-beta)\b/;

if (!KNOWN_TYPES.test(firstLine.trim())) {
  console.error(
    `Unrecognized diagram type. First non-comment line: ${JSON.stringify(firstLine.trim().slice(0, 80))}`,
  );
  process.exit(1);
}

const lines = text.split('\n');
let openSubgraphs = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith('%%')) continue;
  if (/^subgraph\b/.test(line)) openSubgraphs++;
  else if (line === 'end') {
    openSubgraphs--;
    if (openSubgraphs < 0) {
      console.error(`line ${i + 1}: unmatched 'end'`);
      process.exit(1);
    }
  }
}
if (openSubgraphs !== 0) {
  console.error(`${openSubgraphs} unclosed subgraph(s) at end of file`);
  process.exit(1);
}

const pairs = [
  ['[', ']'],
  ['(', ')'],
  ['{', '}'],
];
for (const [open, close] of pairs) {
  const opens = (text.match(new RegExp(`\\${open}`, 'g')) ?? []).length;
  const closes = (text.match(new RegExp(`\\${close}`, 'g')) ?? []).length;
  if (opens !== closes) {
    console.error(
      `unbalanced ${open} ${close}: ${opens} '${open}' vs ${closes} '${close}'`,
    );
    process.exit(1);
  }
}

// Empty quoted strings in `click` directives break mermaid's parser on GitHub
// (e.g. `click foo "" "bar"` -> "Expecting STR, got SPACE"), even though the
// surrounding structure is balanced.
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line.startsWith('click ')) continue;
  if (/""/.test(line)) {
    console.error(
      `line ${i + 1}: click directive has an empty quoted string; ` +
        `use \`click NODE "<path>" "<path>"\` or omit the line`,
    );
    process.exit(1);
  }
}

process.exit(0);
