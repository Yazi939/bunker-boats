const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(__dirname, 'data', 'database.sqlite');

// Create a backup before making changes
function createBackup() {
  const backupDir = path.join(__dirname, 'backup');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 14);
  const backupPath = path.join(backupDir, `database_backup_${timestamp}.sqlite`);
  
  console.log(`Creating database backup to ${backupPath}...`);
  fs.copyFileSync(dbPath, backupPath);
  console.log('Backup created successfully!');
}

// Function to add missing columns to the FuelTransactions table
async function fixFuelTransactionsTable() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    // Get the current schema
    db.all("PRAGMA table_info(FuelTransactions)", (err, columns) => {
      if (err) {
        db.close();
        return reject(err);
      }
      
      console.log('Current FuelTransactions columns:', columns.map(c => c.name).join(', '));
      
      // Columns that need to be in the table
      const requiredColumns = [
        { name: 'supplier', type: 'VARCHAR(255)' },
        { name: 'customer', type: 'VARCHAR(255)' },
        { name: 'vessel', type: 'VARCHAR(255)' },
        { name: 'paymentMethod', type: 'VARCHAR(255)' },
        { name: 'key', type: 'VARCHAR(255)' },
        { name: 'frozen', type: 'BOOLEAN DEFAULT 0' },
        { name: 'edited', type: 'BOOLEAN DEFAULT 0' }
      ];
      
      // Identify which columns need to be added
      const missingColumns = requiredColumns.filter(col => 
        !columns.some(existingCol => existingCol.name === col.name)
      );
      
      if (missingColumns.length === 0) {
        console.log('All required columns already exist. No changes needed.');
        db.close();
        return resolve();
      }
      
      console.log('Missing columns to add:', missingColumns.map(c => c.name).join(', '));
      
      // Start transaction
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        // Add each missing column
        let completedColumns = 0;
        
        for (const col of missingColumns) {
          const query = `ALTER TABLE FuelTransactions ADD COLUMN ${col.name} ${col.type}`;
          console.log(`Adding ${col.name} column to FuelTransactions table...`);
          
          db.run(query, err => {
            if (err) {
              console.error(`Error adding column ${col.name}:`, err);
              db.run("ROLLBACK");
              db.close();
              return reject(err);
            }
            
            console.log(`${col.name} column added successfully!`);
            completedColumns++;
            
            // If all columns have been added, commit and resolve
            if (completedColumns === missingColumns.length) {
              db.run("COMMIT", err => {
                if (err) {
                  console.error('Error committing transaction:', err);
                  db.run("ROLLBACK");
                  db.close();
                  return reject(err);
                }
                
                console.log('Database fix completed!');
                console.log('Important: Restart the server to apply the changes.');
                db.close();
                resolve();
              });
            }
          });
        }
      });
    });
  });
}

// Main function
async function main() {
  console.log('Starting database fix script...');
  
  try {
    // Backup database first
    createBackup();
    
    // Fix the FuelTransactions table
    await fixFuelTransactionsTable();
    
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

// Run the script
main(); 