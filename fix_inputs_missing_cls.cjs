const fs = require('fs');
const glob = require('glob');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = [...walkDir('./views'), ...walkDir('./components')];

let updatedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Add dark:bg-stone-900 or dark:bg-stone-800 to bg-white or bg-stone-50 if it does not have a dark bg.
    // Ensure all inputs with type="number" have proper text and background
    const tagRegex = /<(input|textarea)([^>]*?)>/gi;
    
    content = content.replace(tagRegex, (match, tag, rest) => {
        if (match.includes('type="hidden"') || match.includes('type="checkbox"') || 
            match.includes('type="radio"') || match.includes('type="color"') || 
            match.includes('type="file"')) {
            return match;
        }

        // If no className, add one
        if (!rest.includes('className=')) {
            return `<${tag} className="text-stone-900 dark:text-white bg-transparent" ${rest}>`;
        }
        
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFiles++;
        console.log(`Updated ${file} (missing className added)`);
    }
});

console.log(`Updated ${updatedFiles} files without className.`);
