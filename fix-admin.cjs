const fs = require('fs');

let content = fs.readFileSync('views/AdminView.tsx', 'utf8');

// Replace hover:bg-stone-50 without dark version
content = content.replace(/hover:bg-stone-50(?! dark:hover:bg-)/g, 'hover:bg-stone-50 dark:hover:bg-stone-800/30');

// Replace specific bg-white inside ternaries with their dark versions
content = content.replace(/'bg-white text-stone-900/g, "'bg-white dark:bg-stone-900 text-stone-900 dark:text-white");
content = content.replace(/'bg-white text-stone-600/g, "'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300");
content = content.replace(/'bg-white text-stone-500/g, "'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400");
content = content.replace(/'bg-brand-500 text-brand-950/g, "'bg-brand-500 dark:bg-brand-600 text-brand-950 dark:text-stone-900");
content = content.replace(/'bg-white text-stone-950/g, "'bg-white dark:bg-stone-900 text-stone-950 dark:text-white");

fs.writeFileSync('views/AdminView.tsx', content);
console.log('Fixed AdminView.tsx');
