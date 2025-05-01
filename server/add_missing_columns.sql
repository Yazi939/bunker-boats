-- Script to add missing columns to FuelTransactions table
-- Run this script using: sqlite3 data/fuel.db < add_missing_columns.sql

-- Add volume column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN volume FLOAT DEFAULT 0;

-- Copy amount value to volume
UPDATE FuelTransactions SET volume = amount WHERE volume IS NULL OR volume = 0;

-- Add frozen column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN frozen BOOLEAN DEFAULT 0;

-- Add edited column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN edited BOOLEAN DEFAULT 0;

-- Add timestamp column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN timestamp BIGINT;

-- Calculate timestamp from date
UPDATE FuelTransactions SET timestamp = strftime('%s', date) * 1000 WHERE timestamp IS NULL AND date IS NOT NULL;

-- Add supplier column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN supplier TEXT;

-- Add customer column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN customer TEXT;

-- Add vessel column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN vessel TEXT;

-- Add paymentMethod column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN paymentMethod TEXT;

-- Add key column if it doesn't exist
ALTER TABLE FuelTransactions ADD COLUMN key TEXT;

-- Create keys for transactions that don't have one
UPDATE FuelTransactions SET key = 'tx-' || id || '-' || timestamp WHERE key IS NULL;

-- Display the updated table structure
PRAGMA table_info(FuelTransactions);

-- Show a message to indicate completion
SELECT 'All missing columns have been added successfully' AS Message; 