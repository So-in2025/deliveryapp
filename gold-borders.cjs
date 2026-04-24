const fs = require('fs');
const path = require('path');

const filePatterns = [
  'views',
  'components/ui',
  'components/layouts'
];

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      files.push(filePath);
    }
  }
  return files;
}

let allFiles = [];
for (const pattern of filePatterns) {
  allFiles = getFiles(path.join(process.cwd(), pattern), allFiles);
}

let totalChanges = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We want to replace border-stone-100 with border-amber-200
  // But we want to make sure we don't duplicate dark classes.
  // Actually, replacing `border-stone-100` with `border-amber-200` 
  content = content.replace(/border-stone-100/g, 'border-amber-200');
  content = content.replace(/border-stone-200/g, 'border-amber-300');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    totalChanges++;
  }
}

console.log('Total files updated:', totalChanges);
