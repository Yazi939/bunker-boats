#!/bin/bash

# Script for fixing and maintaining the database structure
# This script will add missing columns and ensure database consistency

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database fix script...${NC}"

# Path to the database file
DB_FILE="./data/database.sqlite"

# Create a backup directory if it doesn't exist
mkdir -p ./backup

# Get current date and time for backup filename
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backup/database_backup_${BACKUP_DATE}.sqlite"

# Create a backup of the database
echo -e "Creating database backup to ${BACKUP_FILE}..."
if cp "${DB_FILE}" "${BACKUP_FILE}"; then
    echo -e "${GREEN}Backup created successfully!${NC}"
else
    echo -e "${RED}Failed to create backup. Aborting.${NC}"
    exit 1
fi

# Check the database tables
echo -e "Checking database tables..."
TABLES=$(sqlite3 "${DB_FILE}" ".tables")
echo -e "Found tables: ${TABLES}"

# Check and modify FuelTransactions table
echo -e "Checking FuelTransactions table schema..."
TABLE_SCHEMA=$(sqlite3 "${DB_FILE}" ".schema FuelTransactions")
echo "${TABLE_SCHEMA}"

# Check if the volume column exists
if [[ $TABLE_SCHEMA == *"volume FLOAT"* ]]; then
    echo -e "${GREEN}Volume column already exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding volume column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN volume FLOAT;"
    echo -e "${GREEN}Volume column added successfully!${NC}"
fi

# Check if totalCost column exists
if [[ $TABLE_SCHEMA == *"totalCost"* ]]; then
    echo -e "${GREEN}Column totalCost exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding totalCost column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN totalCost FLOAT DEFAULT 0;"
    echo -e "${GREEN}totalCost column added successfully!${NC}"
fi

# Check if timestamp column exists
if [[ $TABLE_SCHEMA == *"timestamp"* ]]; then
    echo -e "${GREEN}Column timestamp exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding timestamp column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN timestamp INTEGER;"
    
    # Generate timestamp values based on the date column
    echo -e "Generating timestamp values from date column..."
    sqlite3 "${DB_FILE}" "UPDATE FuelTransactions SET timestamp = strftime('%s', date) * 1000 WHERE timestamp IS NULL;"
    echo -e "${GREEN}Successfully added timestamp column!${NC}"
fi

# Check if fuelType column exists
if [[ $TABLE_SCHEMA == *"fuelType"* ]]; then
    echo -e "${GREEN}Column fuelType exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding fuelType column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN fuelType TEXT DEFAULT 'diesel';"
    echo -e "${GREEN}fuelType column added successfully!${NC}"
fi

# Check and add supplier column
if [[ $TABLE_SCHEMA == *"supplier"* ]]; then
    echo -e "${GREEN}Column supplier exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding supplier column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN supplier TEXT;"
    echo -e "${GREEN}supplier column added successfully!${NC}"
fi

# Check and add customer column
if [[ $TABLE_SCHEMA == *"customer"* ]]; then
    echo -e "${GREEN}Column customer exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding customer column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN customer TEXT;"
    echo -e "${GREEN}customer column added successfully!${NC}"
fi

# Check and add vessel column
if [[ $TABLE_SCHEMA == *"vessel"* ]]; then
    echo -e "${GREEN}Column vessel exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding vessel column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN vessel TEXT;"
    echo -e "${GREEN}vessel column added successfully!${NC}"
fi

# Check and add paymentMethod column
if [[ $TABLE_SCHEMA == *"paymentMethod"* ]]; then
    echo -e "${GREEN}Column paymentMethod exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding paymentMethod column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN paymentMethod TEXT;"
    echo -e "${GREEN}paymentMethod column added successfully!${NC}"
fi

# Check and add key column
if [[ $TABLE_SCHEMA == *"key"* ]]; then
    echo -e "${GREEN}Column key exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding key column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN key TEXT;"
    # Generate unique keys for existing transactions
    sqlite3 "${DB_FILE}" "UPDATE FuelTransactions SET key = 'tx-' || id || '-' || (CASE WHEN timestamp IS NULL THEN strftime('%s', 'now') * 1000 ELSE timestamp END) WHERE key IS NULL;"
    echo -e "${GREEN}key column added successfully!${NC}"
fi

# Check and add frozen column
if [[ $TABLE_SCHEMA == *"frozen"* ]]; then
    echo -e "${GREEN}Column frozen exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding frozen column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN frozen BOOLEAN DEFAULT 0;"
    echo -e "${GREEN}frozen column added successfully!${NC}"
fi

# Check and add edited column
if [[ $TABLE_SCHEMA == *"edited"* ]]; then
    echo -e "${GREEN}Column edited exists in FuelTransactions table.${NC}"
else
    echo -e "${YELLOW}Adding edited column to FuelTransactions table...${NC}"
    sqlite3 "${DB_FILE}" "ALTER TABLE FuelTransactions ADD COLUMN edited BOOLEAN DEFAULT 0;"
    echo -e "${GREEN}edited column added successfully!${NC}"
fi

echo -e "${GREEN}Database fix completed!${NC}"
echo -e "${YELLOW}Important: Restart the server to apply the changes.${NC}"

exit 0 