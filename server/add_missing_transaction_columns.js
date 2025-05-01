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
    
    // Получаем схему таблицы для анализа
    db.all("PRAGMA table_info(FuelTransactions)", (err, columns) => {
      if (err) {
        db.close();
        return reject(err);
      }
      
      console.log('Current FuelTransactions columns:', columns.map(c => c.name).join(', '));
      
      // Создаем список колонок для добавления
      const columnsToCheck = [
        { name: 'frozen', type: 'BOOLEAN DEFAULT 0' },
        { name: 'edited', type: 'BOOLEAN DEFAULT 0' },
        { name: 'supplier', type: 'VARCHAR(255)' },
        { name: 'customer', type: 'VARCHAR(255)' },
        { name: 'vessel', type: 'VARCHAR(255)' },
        { name: 'paymentMethod', type: 'VARCHAR(255)' },
        { name: 'key', type: 'VARCHAR(255)' },
        { name: 'timestamp', type: 'BIGINT' }
      ];
      
      // Список колонок, которые нужно добавить
      const missingColumns = columnsToCheck.filter(col => 
        !columns.some(existingCol => existingCol.name === col.name)
      );
      
      if (missingColumns.length === 0) {
        console.log('All required columns already exist. No changes needed.');
        db.close();
        return resolve();
      }
      
      console.log('Missing columns to add:', missingColumns.map(c => c.name).join(', '));
      
      // Начинаем транзакцию
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        // Добавляем каждую колонку
        for (const col of missingColumns) {
          const query = `ALTER TABLE FuelTransactions ADD COLUMN ${col.name} ${col.type}`;
          console.log(`Adding column ${col.name}...`);
          
          db.run(query, err => {
            if (err) {
              console.error(`Error adding column ${col.name}:`, err);
              db.run("ROLLBACK");
              db.close();
              return reject(err);
            }
          });
        }
        
        // Если добавляем timestamp, заполняем его значения на основе поля date
        if (missingColumns.some(col => col.name === 'timestamp')) {
          console.log('Generating timestamp values from date column...');
          
          db.run(`
            UPDATE FuelTransactions 
            SET timestamp = strftime('%s', date) * 1000 
            WHERE timestamp IS NULL
          `, err => {
            if (err) {
              console.error('Error generating timestamp values:', err);
              db.run("ROLLBACK");
              db.close();
              return reject(err);
            }
            console.log('Successfully added timestamp values!');
          });
        }
        
        db.run("COMMIT", err => {
          if (err) {
            console.error('Error committing transaction:', err);
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