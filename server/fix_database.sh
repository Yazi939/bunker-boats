#!/bin/bash

# Script for fixing and maintaining the database structure
# This script will add missing columns and ensure database consistency

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database fix script...${NC}"

# Database file path
DB_FILE="./data/database.sqlite"
BACKUP_DIR="./backup"
BACKUP_FILE="${BACKUP_DIR}/database_backup_$(date +%Y%m%d_%H%M%S).sqlite"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}Error: Database file $DB_FILE not found!${NC}"
    exit 1
fi

# Create backup
echo -e "Creating database backup to $BACKUP_FILE..."
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backup created successfully!${NC}"
else
    echo -e "${RED}Failed to create backup. Aborting.${NC}"
  exit 1
fi

# Check the tables in the database
echo -e "Checking database tables..."
TABLES=$(sqlite3 "$DB_FILE" ".tables")
echo -e "Found tables: $TABLES"

# Check if FuelTransactions table exists
if echo "$TABLES" | grep -q "FuelTransactions"; then
    TABLE_NAME="FuelTransactions"
elif echo "$TABLES" | grep -q "Fuel"; then
    TABLE_NAME="Fuel"
else
    echo -e "${RED}Warning: Neither FuelTransactions nor Fuel table found!${NC}"
    # Try to find any table with 'fuel' in the name (case insensitive)
    FUEL_TABLE=$(echo "$TABLES" | grep -i "fuel")
    if [ -n "$FUEL_TABLE" ]; then
        TABLE_NAME=$FUEL_TABLE
        echo -e "${YELLOW}Using table: $TABLE_NAME${NC}"
    else
        echo -e "${RED}No fuel-related table found. Aborting.${NC}"
        exit 1
    fi
fi

# Check table schema
echo -e "Checking $TABLE_NAME table schema..."
SCHEMA=$(sqlite3 "$DB_FILE" ".schema $TABLE_NAME")
echo "$SCHEMA"

# Check if volume column exists
if echo "$SCHEMA" | grep -q "volume"; then
    echo -e "${GREEN}Volume column already exists in $TABLE_NAME table.${NC}"
else
    echo -e "${YELLOW}Adding volume column to $TABLE_NAME table...${NC}"
    
    # Add volume column
    sqlite3 "$DB_FILE" "ALTER TABLE $TABLE_NAME ADD COLUMN volume REAL DEFAULT 0;"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully added volume column!${NC}"
        
        # Update volume column from amount if amount exists
        if echo "$SCHEMA" | grep -q "amount"; then
            echo -e "Copying values from amount column to volume column..."
            sqlite3 "$DB_FILE" "UPDATE $TABLE_NAME SET volume = amount WHERE amount IS NOT NULL;"
            
if [ $? -eq 0 ]; then
                echo -e "${GREEN}Successfully copied amount values to volume column!${NC}"
            else
                echo -e "${RED}Failed to copy values from amount to volume.${NC}"
            fi
else
            echo -e "${YELLOW}Warning: amount column not found. volume column added with default values.${NC}"
        fi
    else
        echo -e "${RED}Failed to add volume column!${NC}"
    fi
fi

# Check other essential columns
ESSENTIAL_COLUMNS=("totalCost" "timestamp" "fuelType")
for column in "${ESSENTIAL_COLUMNS[@]}"; do
    if echo "$SCHEMA" | grep -qi "$column"; then
        echo -e "${GREEN}Column $column exists in $TABLE_NAME table.${NC}"
    else
        echo -e "${YELLOW}Adding $column column to $TABLE_NAME table...${NC}"
        
        # Add column with appropriate type
        if [ "$column" == "totalCost" ]; then
            sqlite3 "$DB_FILE" "ALTER TABLE $TABLE_NAME ADD COLUMN totalCost REAL DEFAULT 0;"
        elif [ "$column" == "timestamp" ]; then
            sqlite3 "$DB_FILE" "ALTER TABLE $TABLE_NAME ADD COLUMN timestamp BIGINT;"
            # Update timestamp from date if date exists
            if echo "$SCHEMA" | grep -q "date"; then
                echo -e "Generating timestamp values from date column..."
                sqlite3 "$DB_FILE" "UPDATE $TABLE_NAME SET timestamp = strftime('%s', date) * 1000 WHERE date IS NOT NULL;"
            fi
        elif [ "$column" == "fuelType" ]; then
            sqlite3 "$DB_FILE" "ALTER TABLE $TABLE_NAME ADD COLUMN fuelType TEXT DEFAULT 'diesel';"
        fi
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Successfully added $column column!${NC}"
        else
            echo -e "${RED}Failed to add $column column!${NC}"
        fi
    fi
done

echo -e "${GREEN}Database fix completed!${NC}"
echo -e "${YELLOW}Important: Restart the server to apply the changes.${NC}"

exit 0 