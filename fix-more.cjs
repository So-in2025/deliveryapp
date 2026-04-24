const fs = require('fs');

const views = ['views/AdminView.tsx', 'views/AuthView.tsx', 'views/ClientView.tsx', 'views/DriverView.tsx', 'views/MerchantView.tsx', 'components/ui/Button.tsx', 'components/layouts/ClientLayout.tsx'];

views.forEach(view => {
    if(!fs.existsSync(view)) return;
    let content = fs.readFileSync(view, 'utf8');
    
    // Add dark modes for bg-white and bg-stone-50 in single quotes
    content = content.replace(/'bg-white(.*?)'/g, (m, c) => {
        if (!c.includes('dark:bg-')) {
            return `'bg-white dark:bg-stone-900${c}'`;
        }
        return m;
    });
    
    content = content.replace(/'bg-stone-50(.*?)'/g, (m, c) => {
        if (!c.includes('dark:bg-') && !c.includes('dark:hover:bg-')) {
            return `'bg-stone-50 dark:bg-stone-800/30${c}'`;
        }
        return m;
    });

    fs.writeFileSync(view, content);
});
console.log('Fixed more views');
