const fs = require('fs');
const path = require('path');

// Файлы и папки, которые нужно удалить
const filesToDelete = [
  'server.js',
  'controllers/fuelController.js',
  'controllers/authController.js',
  'models/initModels.js',
  'middleware/auth.js'
];

// Сначала проверяем, что все файлы существуют и создаем резервные копии
console.log('Создание резервных копий...');
const backupDir = path.join(__dirname, 'backup-duplicates');

// Создаем папку для бэкапа, если её нет
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Создаем бэкап
filesToDelete.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    // Создаем структуру папок в backup
    const backupFilePath = path.join(backupDir, file);
    const backupFileDir = path.dirname(backupFilePath);
    
    if (!fs.existsSync(backupFileDir)) {
      fs.mkdirSync(backupFileDir, { recursive: true });
    }
    
    // Копируем файл
    fs.copyFileSync(filePath, backupFilePath);
    console.log(`✅ Резервная копия создана: ${file}`);
  } else {
    console.log(`⚠️ Файл не найден, пропускаем: ${file}`);
  }
});

// Удаляем файлы
console.log('\nУдаление дублирующихся файлов...');
filesToDelete.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Удален: ${file}`);
  } else {
    console.log(`⚠️ Файл не найден, пропускаем: ${file}`);
  }
});

console.log('\n✅ Готово! Удаление дублирующихся файлов завершено.');
console.log(`Резервные копии сохранены в папке: ${backupDir}`);
console.log('\nТеперь проект использует только файлы из папки server/'); 