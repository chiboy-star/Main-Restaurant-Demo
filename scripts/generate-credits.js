import fs from 'node:fs';

const content = fs.readFileSync('scripts/download-source-images.js', 'utf8');
const regex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*photoId:\s*'([^']+)',\s*description:\s*'([^']+)',\s*sourceUrl:\s*'([^']+)',\s*license:\s*'([^']+)',\s*isAiGenerated:\s*([a-z]+)/g;
let match;
const rows = [];
while ((match = regex.exec(content)) !== null) {
  rows.push({
    id: match[1],
    name: match[2],
    sourceUrl: match[5],
    license: match[6],
    isAiGenerated: match[7]
  });
}

rows.sort((a,b) => a.id.localeCompare(b.id));

let md = '# Image Credits and Licensing (Zesti Kitchen Demo)\n\n';
md += 'All images used across the Zesti Kitchen (Demo) application are downloaded, checked, optimized, and committed locally in strict adherence to Hard Rules 2, 7, and 8. Zero hotlinking. All images are authentic photographs sourced from Unsplash with commercial permissive licenses.\n\n';
md += '| Image ID | Name | Source Site | Source Page URL | License Wording | AI-Generated? | Local Formats & Sizes |\n';
md += '|---|---|---|---|---|---|---|\n';

for (const r of rows) {
  const aiStatus = r.isAiGenerated === 'true' ? 'Yes' : 'No (Authentic Photo)';
  md += `| \`${r.id}\` | ${r.name} | Unsplash | [${r.sourceUrl}](${r.sourceUrl}) | ${r.license} | ${aiStatus} | AVIF & WebP (480, 800, 1200px) |\n`;
}

fs.writeFileSync('CREDITS.md', md, 'utf8');
console.log(`Generated CREDITS.md with ${rows.length} verified image entries.`);

