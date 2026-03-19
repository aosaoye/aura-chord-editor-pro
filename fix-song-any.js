const fs = require('fs');
const files = [
  'app/editor/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  content = content.replace(/\(song as any\)/g, 'song');
  content = content.replace(/\(s as any\)/g, 's');

  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
