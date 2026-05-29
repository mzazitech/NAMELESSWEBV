import fs from 'fs';

export function parseCommandCategories(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/); // Kompatibel Windows dan Linux

  const categories = {};
  let currentCategory = 'Uncategorized';

  for (let line of lines) {
    // Hanya deteksi komentar kategori yang mengandung "Menu"
    const categoryMatch = line.match(/\/\/.*\s*(Menu.+?)\s*.*/i);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim(); // contoh: "Menu Ai"
      if (!categories[currentCategory]) categories[currentCategory] = [];
      continue;
    }

    // Deteksi case
    const caseMatch = line.match(/case\s+['"`](.+?)['"`]\s*:/);
    if (caseMatch) {
      const command = caseMatch[1].trim();
      if (!categories[currentCategory]) categories[currentCategory] = [];
      categories[currentCategory].push(command);
    }
  }

  return categories;
}
