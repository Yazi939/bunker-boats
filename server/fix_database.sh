#!/bin/bash

# Script to fix the database on the server
# Run this script with: bash fix_database.sh

echo "Starting database fix process..."

# Go to the server directory
cd "$(dirname "$0")"

# Backup the database first
echo "Creating backup of the current database..."
cp data/fuel.db data/fuel.db.backup
echo "Database backup created at data/fuel.db.backup"

# Run the SQL script to add missing columns
echo "Adding missing columns to the database..."
sqlite3 data/fuel.db < add_missing_columns.sql

# Check if the SQL execution was successful
if [ $? -eq 0 ]; then
  echo "Database successfully updated with all missing columns."
else
  echo "Error occurred while updating the database."
  echo "Restoring from backup..."
  cp data/fuel.db.backup data/fuel.db
  echo "Backup restored. Please check your database and try again."
  exit 1
fi

# Restart the PM2 service
echo "Restarting the fuel-server service..."
pm2 restart fuel-server

# Check if PM2 restart was successful
if [ $? -eq 0 ]; then
  echo "Service successfully restarted."
else
  echo "Warning: Could not restart the service automatically."
  echo "Please restart your server manually with: pm2 restart fuel-server"
fi

echo "Database fix process completed successfully!"
echo "Please check the server logs with: pm2 logs fuel-server" 