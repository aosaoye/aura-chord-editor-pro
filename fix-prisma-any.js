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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir('app');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  if (content.includes('(prisma as any)')) {
    content = content.replace(/\(prisma as any\)/g, 'db');
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
});
