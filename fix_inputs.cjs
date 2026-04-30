const fs = require('fs');
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

    // Apply to inputs and textareas
    // We match className="<content>" inside an <input or <textarea tag
    const tagRegex = /<(input|textarea)([^>]*?)className=["']([^"']*)["']([^>]*?)>/gi;
    
    content = content.replace(tagRegex, (match, tag, before, className, after) => {
        // Exclude specific types where text color doesn't matter as much or behaves differently
        if (match.includes('type="hidden"') || match.includes('type="checkbox"') || 
            match.includes('type="radio"') || match.includes('type="color"') || 
            match.includes('type="file"')) {
            return match;
        }

        let newClass = className;
        
        // Let's ensure text color works for both light and dark backgrounds
        if (!className.includes('dark:text-') && !className.includes('text-white') && !className.includes('text-transparent')) {
            newClass += ' dark:text-white';
        }
        
        if (!className.includes('text-stone-') && !className.includes('text-black') && !className.includes('text-white') && !className.includes('text-brand-') && !className.includes('text-red-') && !className.includes('text-green-') && !className.includes('text-blue-') && !className.includes('text-emerald-')) {
            newClass += ' text-stone-900';
        }
        
        // For inputs specifically, adding bg-transparent can help if they are on a custom background,
        // but it might break inputs that have their own bg set like bg-stone-50
        // Wait, if an input has bg-stone-50 dark:bg-stone-800, that's fine.
        
        if (newClass !== className) {
            return `<${tag}${before}className="${newClass}"${after}>`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFiles++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Updated ${updatedFiles} files.`);
