import fs from 'fs';

const fixDarkMode = (filePath: string) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    const replacements = [
        { search: /bg-white(?!\s*(?:[^\w-]|$)|\s+dark:bg)/g, replace: 'bg-white dark:bg-stone-900' },
        { search: /text-stone-900(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-stone-900 dark:text-white' },
        { search: /text-stone-800(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-stone-800 dark:text-stone-200' },
        { search: /border-stone-100(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-stone-100 dark:border-stone-800' },
        { search: /border-stone-200(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-stone-200 dark:border-stone-700' },
        { search: /bg-stone-50(?!\s*(?:[^\w-]|$)|\s+dark:bg)/g, replace: 'bg-stone-50 dark:bg-stone-800/50' },
        { search: /bg-stone-100(?!\s*(?:[^\w-]|$)|\s+dark:bg)/g, replace: 'bg-stone-100 dark:bg-stone-800' },
        { search: /hover:bg-stone-50(?!\s*(?:[^\w-]|$)|\s+dark:hover)/g, replace: 'hover:bg-stone-50 dark:hover:bg-stone-800/50' }
    ];

    replacements.forEach(rule => {
        content = content.replace(rule.search, rule.replace);
    });

    fs.writeFileSync(filePath, content);
    console.log(`Fixed dark mode in ${filePath}`);
};

fixDarkMode('views/AdminView.tsx');
fixDarkMode('views/MerchantView.tsx');
fixDarkMode('views/DriverView.tsx');
fixDarkMode('components/ui/SettingsOverlay.tsx');
