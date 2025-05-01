const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Путь к базе данных
const dbPath = path.join(__dirname, 'data', 'database.sqlite');

// Функция для создания резервной копии базы данных
function createBackup() {
  const backupDir = path.join(__dirname, 'backup');
  
  // Создать директорию для бэкапов, если она не существует
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 14);
  const backupPath = path.join(backupDir, `database_backup_${timestamp}.sqlite`);
  
  console.log(`Creating database backup to ${backupPath}...`);
  fs.copyFileSync(dbPath, backupPath);
  console.log('Backup created successfully!');
}

// Функция для добавления колонок
function addColumns() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем наличие колонок
    db.get("PRAGMA table_info(FuelTransactions)", (err, rows) => {
      if (err) {
        db.close();
        return reject(err);
      }
      
      // Получаем схему таблицы для анализа
      db.all("PRAGMA table_info(FuelTransactions)", (err, columns) => {
        if (err) {
          db.close();
          return reject(err);
        }
        
        console.log('Current FuelTransactions columns:', columns.map(c => c.name).join(', '));
        
        // Проверяем наличие колонок
        const hasFrozen = columns.some(c => c.name === 'frozen');
        const hasEdited = columns.some(c => c.name === 'edited');
        
        let queries = [];
        
        if (!hasFrozen) {
          console.log('Adding frozen column to FuelTransactions table...');
          queries.push("ALTER TABLE FuelTransactions ADD COLUMN frozen BOOLEAN DEFAULT 0");
        } else {
          console.log('Column frozen already exists in FuelTransactions table.');
        }
        
        if (!hasEdited) {
          console.log('Adding edited column to FuelTransactions table...');
          queries.push("ALTER TABLE FuelTransactions ADD COLUMN edited BOOLEAN DEFAULT 0");
        } else {
          console.log('Column edited already exists in FuelTransactions table.');
        }
        
        // Если нечего добавлять, завершаем
        if (queries.length === 0) {
          console.log('All required columns already exist. No changes needed.');
          db.close();
          return resolve();
        }
        
        // Начинаем транзакцию
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
          
          queries.forEach(query => {
            db.run(query, err => {
              if (err) {
                console.error(`Error executing query: ${query}`, err);
                db.run("ROLLBACK");
                db.close();
                return reject(err);
              }
            });
          });
          
          db.run("COMMIT", err => {
            if (err) {
              console.error('Error committing transaction', err);
              db.run("ROLLBACK");
              db.close();
              return reject(err);
            }
            
            console.log('Columns added successfully!');
            db.close();
            resolve();
          });
        });
      });
    });
  });
}

// Главная функция
async function main() {
  console.log('Starting database update script...');
  
  try {
    // Создаем резервную копию
    createBackup();
    
    // Добавляем колонки
    await addColumns();
    
    console.log('Database update completed successfully!');
    console.log('Important: Restart the server to apply the changes.');
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

// Запускаем скрипт
main(); 