const fs = require('fs');
const path = require('path');
const locales = {
  en: 'Generate Canvas',
  fr: 'Générer le Canevas',
  pt: 'Gerar Tela',
  it: 'Genera Tela',
  ja: 'キャンバスを生成',
  de: 'Leinwand erstellen',
};
for (const [lang, text] of Object.entries(locales)) {
  const fpath = path.join('messages', lang + '.json');
  if (fs.existsSync(fpath)) {
     const data = JSON.parse(fs.readFileSync(fpath, 'utf8'));
     if (!data.editor_nav) data.editor_nav = {};
     data.editor_nav.generate_canvas = text;
     fs.writeFileSync(fpath, JSON.stringify(data, null, 2));
  }
}
