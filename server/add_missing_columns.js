/**
 * Script to add missing columns to the database.
 * This script is a cross-platform alternative to fix_database.sh
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { sequelize } = require('./models/initModels');

// Constants
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backup');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
const TIMESTAMP = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const BACKUP_FILE = path.join(BACKUP_DIR, `database_backup_${TIMESTAMP}.sqlite`);

// Functions
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m%s\x1b[0m',    // Cyan
    success: '\x1b[32m%s\x1b[0m',  // Green
    warning: '\x1b[33m%s\x1b[0m',  // Yellow
    error: '\x1b[31m%s\x1b[0m'     // Red
  };
  
  console.log(colors[type] || colors.info, message);
};

const createBackup = () => {
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Create backup
  log(`Creating backup: ${BACKUP_FILE}`, 'info');
  fs.copyFileSync(DB_FILE, BACKUP_FILE);
  log('Backup created successfully', 'success');
};

const getTables = async () => {
  try {
    const [results] = await sequelize.query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
    return results.map(r => r.name);
  } catch (error) {
    log(`Error getting tables: ${error.message}`, 'error');
    throw error;
  }
};

const getTableSchema = async (tableName) => {
  try {
    const [results] = await sequelize.query(`PRAGMA table_info(${tableName})`);
    return results;
  } catch (error) {
    log(`Error getting schema for ${tableName}: ${error.message}`, 'error');
    throw error;
  }
};

const addColumnIfMissing = async (tableName, columnName, columnType, defaultValue) => {
  try {
    const schema = await getTableSchema(tableName);
    const columnExists = schema.some(col => col.name.toLowerCase() === columnName.toLowerCase());
    
    if (columnExists) {
      log(`Column ${columnName} already exists in ${tableName}`, 'success');
      return;
    }
    
    let query = `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType}`;
    
    if (defaultValue !== undefined) {
      if (typeof defaultValue === 'string') {
        query += ` DEFAULT '${defaultValue}'`;
      } else {
        query += ` DEFAULT ${defaultValue}`;
      }
    }
    
    log(`Adding column ${columnName} to ${tableName}...`, 'info');
    await sequelize.query(query);
    log(`Added column ${columnName} to ${tableName}`, 'success');
    
    return true;
  } catch (error) {
    log(`Error adding column ${columnName} to ${tableName}: ${error.message}`, 'error');
    throw error;
  }
};

const updateFromColumn = async (tableName, sourceColumn, targetColumn) => {
  try {
    log(`Copying values from ${sourceColumn} to ${targetColumn} in ${tableName}...`, 'info');
    await sequelize.query(`UPDATE "${tableName}" SET "${targetColumn}" = "${sourceColumn}" WHERE "${sourceColumn}" IS NOT NULL`);
    log(`Values copied successfully`, 'success');
  } catch (error) {
    log(`Error copying values: ${error.message}`, 'error');
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    log('Starting database fix process...', 'info');
    
    // Check if database file exists
    if (!fs.existsSync(DB_FILE)) {
      log(`Database file not found: ${DB_FILE}`, 'error');
      process.exit(1);
    }
    
    // Create backup
    createBackup();
    
    // Find tables
    const tables = await getTables();
    log(`Found tables: ${tables.join(', ')}`, 'info');
    
    // Find fuel transactions table
    let fuelTable = null;
    if (tables.includes('FuelTransactions')) {
      fuelTable = 'FuelTransactions';
    } else if (tables.includes('Fuel')) {
      fuelTable = 'Fuel';
    } else {
      // Try to find a table with 'fuel' in the name
      fuelTable = tables.find(t => t.toLowerCase().includes('fuel'));
    }
    
    if (!fuelTable) {
      log('Could not find fuel transactions table', 'error');
      process.exit(1);
    }
    
    log(`Using table: ${fuelTable}`, 'info');
    
    // Add missing columns
    let addedVolume = await addColumnIfMissing(fuelTable, 'volume', 'REAL', 0);
    await addColumnIfMissing(fuelTable, 'totalCost', 'REAL', 0);
    await addColumnIfMissing(fuelTable, 'timestamp', 'BIGINT', null);
    await addColumnIfMissing(fuelTable, 'fuelType', 'TEXT', 'diesel');
    await addColumnIfMissing(fuelTable, 'key', 'TEXT', null);
    
    // Update values if needed
    const schema = await getTableSchema(fuelTable);
    
    // Copy amount to volume if needed
    if (addedVolume && schema.some(col => col.name.toLowerCase() === 'amount')) {
      await updateFromColumn(fuelTable, 'amount', 'volume');
    }
    
    // Generate timestamp from date if needed
    if (schema.some(col => col.name.toLowerCase() === 'date')) {
      await sequelize.query(`UPDATE "${fuelTable}" SET timestamp = strftime('%s', date) * 1000 WHERE date IS NOT NULL AND (timestamp IS NULL OR timestamp = 0)`);
      log('Generated timestamps from dates', 'success');
    }
    
    log('Database fix completed successfully!', 'success');
    log('Please restart the server for changes to take effect.', 'warning');
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
  }
};

// Run the main function
main(); 