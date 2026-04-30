const fs = require('fs');

const file = 'views/AdminView.tsx';
let content = fs.readFileSync(file, 'utf8');

const safeDateCode = `
// Safe Date parser
const safeParseDate = (val: any): Date => {
  if (!val) return new Date();
  if (val.toDate) return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};
`;

if (!content.includes('safeParseDate')) {
    content = content.replace(/export const AdminView: React\.FC = \(\) => \{/, safeDateCode + '\nexport const AdminView: React.FC = () => {');
}

content = content.replace(/new Date\(o\.createdAt\)/g, 'safeParseDate(o.createdAt)');
content = content.replace(/new Date\(b\.createdAt\)\.getTime\(\) - new Date\(a\.createdAt\)\.getTime\(\)/g, 'safeParseDate(b.createdAt).getTime() - safeParseDate(a.createdAt).getTime()');
content = content.replace(/new Date\(selectedStore\.createdAt\)/g, 'safeParseDate(selectedStore.createdAt)');
content = content.replace(/new Date\(order\.createdAt\)/g, 'safeParseDate(order.createdAt)');

fs.writeFileSync(file, content);
console.log('Fixed dates in AdminView.tsx');
