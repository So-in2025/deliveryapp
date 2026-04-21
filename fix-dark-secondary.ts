import fs from 'fs';

const fixDarkModeSecondary = (filePath: string) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    const replacements = [
        { search: /text-stone-700(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-stone-700 dark:text-stone-300' },
        { search: /text-stone-600(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-stone-600 dark:text-stone-400' },
        { search: /text-stone-500(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-stone-500 dark:text-stone-400' },
        { search: /border-stone-50(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-stone-50 dark:border-stone-800/50' },
        { search: /bg-stone-200(?!\s*(?:[^\w-]|$)|\s+dark:bg)/g, replace: 'bg-stone-200 dark:bg-stone-700' },
        { search: /text-stone-400(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-stone-400 dark:text-stone-500' }
    ];

    replacements.forEach(rule => {
        content = content.replace(rule.search, rule.replace);
    });

    fs.writeFileSync(filePath, content);
    console.log(`Fixed secondary dark mode in ${filePath}`);
};

['views/AdminView.tsx', 'views/MerchantView.tsx', 'views/DriverView.tsx', 'components/ui/SettingsOverlay.tsx'].forEach(fixDarkModeSecondary);
