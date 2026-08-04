// Use the ESM icons data to extract path 'd' for each needed icon
const fs = require('fs');
const path = require('path');

const iconsDir = path.join('node_modules', 'lucide', 'dist', 'esm', 'icons');
const files = fs.readdirSync(iconsDir);

// Need to map our names to file paths. Files are like: chevron-right.mjs, check-circle-2.mjs, building-2.mjs, x-circle.mjs, map-pin-off.mjs, more-vertical.mjs, triangle-alert.mjs, list-checks.mjs
const needed = [
  'chevron-right','help-circle','plus','map-pin','check-circle-2','wrench','x-circle',
  'search','filter','download','building-2','eye','more-vertical','map-pin-off',
  'chevron-left','info','list-checks','arrow-left','alert-circle','pencil','power',
  'copy','archive','anchor','key','triangle-alert','printer'
];

const fileMap = {};
for (const f of files) {
  const base = f.replace(/\.mjs$/, '');
  fileMap[base] = path.join(iconsDir, f);
}

for (const name of needed) {
  // try exact, and also alias variants
  const candidates = [name, name.replace(/-/g, '_')];
  let content = null;
  let usedName = null;
  for (const c of candidates) {
    if (fileMap[c]) { content = fs.readFileSync(fileMap[c], 'utf8'); usedName = c; break; }
  }
  if (!content) { console.log('===== ' + name + ' ===== NOT FOUND'); continue; }
  // extract the d value
  const m = content.match(/d:\s*("([^"]*)"|'([^']*)'|`([^`]*)`)/);
  let d = null;
  if (m) { d = m[2] || m[3] || m[4]; }
  console.log('===== ' + name + ' (' + usedName + ') =====');
  console.log(d);
}
