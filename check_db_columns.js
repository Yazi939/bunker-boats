const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Check multiple possible database locations
const possibleDbPaths = [
  path.join(__dirname, 'server', 'data', 'fuel.db'),
  path.join(__dirname, 'server', 'data', 'database.sqlite')
];

// Find the first existing database file
let dbPath = null;
for (const path of possibleDbPaths) {
  if (fs.existsSync(path)) {
    dbPath = path;
    console.log(`Found database at: ${dbPath}`);
    break;
  }
}

if (!dbPath) {
  console.error('No database file found in any of the expected locations');
  process.exit(1);
}

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Database connection established');
});

// Check the tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('Error getting table list:', err.message);
    return;
  }
  
  console.log('Tables in database:', tables.map(t => t.name));
  
  if (tables.length === 0) {
    console.log('No tables found in the database.');
    db.close();
    return;
  }
  
  // Check if FuelTransactions exists
  const fuelTransactionsTable = tables.find(t => t.name === 'FuelTransactions');
  if (!fuelTransactionsTable) {
    console.error('FuelTransactions table not found in the database');
    db.close();
    return;
  }
  
  // Check the FuelTransactions table structure
  db.all("PRAGMA table_info(FuelTransactions)", [], (err, columns) => {
    if (err) {
      console.error('Error getting table structure:', err.message);
      return;
    }
    
    console.log('Columns in FuelTransactions table:');
    columns.forEach(column => {
      console.log(`- ${column.name} (${column.type})`);
    });
    
    // Check for missing columns
    const missingColumns = ['volume', 'frozen', 'edited', 'timestamp', 'supplier', 'customer', 'vessel', 'paymentMethod', 'key'];
    const existingColumns = columns.map(c => c.name);
    
    const actualMissingColumns = missingColumns.filter(col => !existingColumns.includes(col));
    
    if (actualMissingColumns.length > 0) {
      console.log('\nMissing columns that need to be added:', actualMissingColumns);
    } else {
      console.log('\nAll required columns are present in the database.');
    }
    
    // Close the database connection
    db.close();
  });
}); 