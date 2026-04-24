const fs = require('fs');

const views = ['views/AdminView.tsx', 'views/AuthView.tsx', 'views/ClientView.tsx', 'views/DriverView.tsx', 'views/MerchantView.tsx'];

for (const view of views) {
    console.log(`Checking ${view}...`);
    const content = fs.readFileSync(view, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if ((line.includes('className="') || line.includes('className={')) && 
            (line.includes('bg-white ') || line.includes('bg-stone-50 ') || line.includes('bg-white"') || line.includes('bg-stone-50"'))) {
            if (!line.includes('dark:bg-')) {
                console.log(`Missing dark bg in ${view} Line ${i+1}: ${line.trim()}`);
            }
        }
        if ((line.includes('className="') || line.includes('className={')) && 
            (line.includes('text-stone-900 ') || line.includes('text-stone-900"'))) {
            if (!line.includes('dark:text-')) {
                console.log(`Missing dark text in ${view} Line ${i+1}: ${line.trim()}`);
            }
        }
    });
}
