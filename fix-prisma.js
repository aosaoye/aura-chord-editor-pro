const fs = require('fs');
const files = [
  'app/u/[id]/page.tsx',
  'app/dashboard/marketplace/page.tsx',
  'app/dashboard/page.tsx',
  'app/community/page.tsx',
  'app/api/notifications/route.ts',
  'app/api/users/[id]/follow/route.ts',
  'app/api/songs/[id]/visibility/route.ts',
  'app/api/songs/route.ts',
  'app/api/songs/[id]/rate/route.ts',
  'app/api/marketplace/connect/route.ts',
  'app/api/marketplace/purchase/route.ts'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // Replace usage
  content = content.replace(/const prisma = new PrismaClient\(\);/g, 'const prisma = db;');

  // Handle single and double quotes
  let imported = false;
  if (/import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@prisma\/client['"];?/.test(content)) {
    content = content.replace(/import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@prisma\/client['"];?/, 'import { db } from "@/lib/db";');
    imported = true;
  }
  else if (/import\s*\{[^}]*PrismaClient[^}]*\}\s*from\s*['"]@prisma\/client['"];?/.test(content)) {
    content = content.replace(/import\s*\{([^}]*)PrismaClient([^}]*)\}\s*from\s*['"]@prisma\/client['"];?/, (match, p1, p2) => {
      const rest = [p1.trim(), p2.trim()].filter(Boolean).join(', ').replace(/,\s*,/g, ',');
      if (rest) {
        return `import { db } from "@/lib/db";\nimport { ${rest} } from '@prisma/client';`;
      }
      return `import { db } from "@/lib/db";`;
    });
    imported = true;
  }

  // If we already replaced it to db, but db isn't imported
  if (!content.includes('import { db }') && content.includes('const prisma = db;')) {
    content = 'import { db } from "@/lib/db";\n' + content;
  }

  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
