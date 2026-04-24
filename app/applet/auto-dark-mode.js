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

const mapping = {
  'bg-white': 'dark:bg-stone-900',
  'bg-stone-50': 'dark:bg-stone-950',
  'bg-stone-100': 'dark:bg-stone-800',
  'bg-stone-200': 'dark:bg-stone-700',
  'text-stone-900': 'dark:text-white',
  'text-stone-800': 'dark:text-stone-100',
  'text-stone-700': 'dark:text-stone-300',
  'text-stone-600': 'dark:text-stone-400',
  'text-stone-500': 'dark:text-stone-400',
  'border-stone-100': 'dark:border-stone-800',
  'border-stone-200': 'dark:border-stone-800',
  'border-stone-300': 'dark:border-stone-700',
  'border-white': 'dark:border-stone-800'
};

let totalChanges = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  const classRegex = /className=(?:(["'])(.*?)\1|\{`([^`]*?)`\}|\{(.*?) \})/g;
  
  content = content.replace(classRegex, (match, quote, p1, p2, p3) => {
    let classes = p1 || p2; 
    if (!classes) return match; 
    
    let tokens = classes.split(/\s+/);
    let changed = false;

    for (const [lightClass, darkClass] of Object.entries(mapping)) {
        if (tokens.includes(lightClass)) {
            // Check for existing dark prefix for the property. 
            // e.g. if darkClass is dark:bg-stone-900, property is dark:bg
            const propPrefix = darkClass.split('-').slice(0, 2).join('-');
            const hasPropDark = tokens.some(t => t.startsWith(propPrefix));
            if (!hasPropDark) {
                // Also check if any dark: class exists that overrides this specific behaviour
                // Just to be safe, exact match checking
                if (!tokens.includes(darkClass)) {
                    tokens.push(darkClass);
                    changed = true;
                }
            }
        }
    }
    
    if (changed) {
        if (p1) return `className=${quote}${tokens.join(' ')}${quote}`;
        if (p2) return `className={\`${tokens.join(' ')}\`}`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    totalChanges++;
  }
}

console.log('Total files updated:', totalChanges);
