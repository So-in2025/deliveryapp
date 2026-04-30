const fs = require('fs');

const filesToFix = [
    'views/ClientView.tsx',
    'views/AdminView.tsx',
    'views/MerchantView.tsx',
    'components/client/CheckoutView.tsx',
    'components/client/ProfileView.tsx',
    'components/client/StoreList.tsx',
    'components/ui/ChatOverlay.tsx',
    'components/ui/Input.tsx',
    'components/ui/SettingsOverlay.tsx',
    'views/AuthView.tsx'
];

filesToFix.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/className="text-stone-900 dark:text-white bg-transparent"\s+/g, '');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
    } catch(e) {
        console.log('Skip ' + file);
    }
});
