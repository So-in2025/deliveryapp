import fs from 'fs';

const fixDarkModeColors = (filePath: string) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    const replacements = [
        { search: /bg-amber-50(?!\s*(?:[^\w-]|$)|\s+dark:bg)/g, replace: 'bg-amber-50 dark:bg-amber-900/20' },
        { search: /border-amber-100(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-amber-100 dark:border-amber-800/50' },
        { search: /border-amber-200(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-amber-200 dark:border-amber-800/50' },
        { search: /text-amber-800(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-amber-800 dark:text-amber-200' },
        
        { search: /bg-blue-50(?!\s*(?:[^\w-]|$)|\s+dark:bg)/g, replace: 'bg-blue-50 dark:bg-blue-900/20' },
        { search: /border-blue-100(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-blue-100 dark:border-blue-800/50' },
        { search: /border-blue-200(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-blue-200 dark:border-blue-800/50' },
        { search: /text-blue-700(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-blue-700 dark:text-blue-300' },
        { search: /text-blue-500(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-blue-500 dark:text-blue-400' },
        
        { search: /bg-red-50(?!\s*(?:[^\w-]|$)|\s+dark:bg)/g, replace: 'bg-red-50 dark:bg-red-900/20' },
        { search: /border-red-100(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-red-100 dark:border-red-800/50' },
        { search: /border-red-200(?!\s*(?:[^\w-]|$)|\s+dark:border)/g, replace: 'border-red-200 dark:border-red-800/50' },
        { search: /text-red-600(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-red-600 dark:text-red-400' },
        { search: /text-red-700(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-red-700 dark:text-red-300' },
        { search: /text-red-800(?!\s*(?:[^\w-]|$)|\s+dark:text)/g, replace: 'text-red-800 dark:text-red-300' },
    ];

    replacements.forEach(rule => {
        content = content.replace(rule.search, rule.replace);
    });

    fs.writeFileSync(filePath, content);
    console.log(`Fixed color dark mode in ${filePath}`);
};

['views/AdminView.tsx', 'views/MerchantView.tsx', 'views/DriverView.tsx', 'components/ui/SettingsOverlay.tsx', 'views/ClientView.tsx'].forEach(fixDarkModeColors);
