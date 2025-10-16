#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const markers = [/<<<<<<<\s/, />>>>>>>\s/];
const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['.git', 'node_modules']);
const offenders = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (markers.some((marker) => marker.test(content))) {
    offenders.push(path.relative(root, filePath));
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

walk(root);

if (offenders.length > 0) {
  console.error('Konflikt-Markierungen gefunden in:');
  offenders.forEach((file) => console.error(` - ${file}`));
  process.exit(1);
} else {
  console.log('Keine Git-Konflikt-Markierungen gefunden.');
}
