#!/bin/bash

# Health check script for the fuel management application
# This script checks the server status and database health

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log file
LOG_DIR="./logs"
LOG_FILE="${LOG_DIR}/health_check_$(date +%Y%m%d).log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log_message() {
  local level=$1
  local message=$2
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Check if the server is running (using PM2)
check_server() {
  log_message "INFO" "Checking server status..."
  
  if command -v pm2 >/dev/null 2>&1; then
    # Get server status from PM2
    local status=$(pm2 jlist | grep -i "fuel" | grep -o '"status":"[^"]*"' | grep -o '[^"]*$')
    
    if [ -z "$status" ]; then
      log_message "ERROR" "${RED}Server is not running under PM2.${NC}"
      return 1
    elif [ "$status" = "online" ]; then
      log_message "INFO" "${GREEN}Server is running (PM2 status: $status).${NC}"
      return 0
    else
      log_message "WARN" "${YELLOW}Server has an unusual status: $status${NC}"
      return 2
    fi
  else
    # Try to check if server is running by port
    if netstat -tuln | grep -q ":3000\|:5000\|:8080"; then
      log_message "INFO" "${GREEN}Server seems to be running (port open).${NC}"
      return 0
    else
      log_message "WARN" "${YELLOW}Could not confirm server status.${NC}"
      return 2
    fi
  fi
}

# Check database health
check_database() {
  log_message "INFO" "Checking database health..."
  
  local DB_FILE="./data/database.sqlite"
  if [ ! -f "$DB_FILE" ]; then
    log_message "ERROR" "${RED}Database file not found at $DB_FILE${NC}"
    return 1
  fi
  
  # Check if the database is readable
  if sqlite3 "$DB_FILE" "PRAGMA integrity_check;" >/dev/null 2>&1; then
    log_message "INFO" "${GREEN}Database is readable and passed integrity check.${NC}"
    
    # Check tables and count records
    log_message "INFO" "Checking database tables..."
    local tables=$(sqlite3 "$DB_FILE" ".tables")
    log_message "INFO" "Tables: $tables"
    
    # Find fuel transactions table
    local fuel_table=""
    if echo "$tables" | grep -q "FuelTransactions"; then
      fuel_table="FuelTransactions"
    elif echo "$tables" | grep -q "Fuel"; then
      fuel_table="Fuel"
    elif echo "$tables" | grep -qi "fuel"; then
      fuel_table=$(echo "$tables" | grep -i "fuel" | head -1)
    fi
    
    if [ -n "$fuel_table" ]; then
      local count=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM \"$fuel_table\";")
      log_message "INFO" "Found $count records in $fuel_table table."
      
      # Check for required columns
      local schema=$(sqlite3 "$DB_FILE" ".schema \"$fuel_table\"")
      local missing_columns=""
      
      for column in "volume" "amount" "totalCost" "timestamp" "fuelType"; do
        if ! echo "$schema" | grep -qi "$column"; then
          missing_columns="${missing_columns}${column}, "
        fi
      done
      
      if [ -n "$missing_columns" ]; then
        missing_columns=${missing_columns%, }
        log_message "WARN" "${YELLOW}Missing columns in $fuel_table: $missing_columns${NC}"
        log_message "INFO" "Recommend running fix_database.sh to add missing columns."
      else
        log_message "INFO" "${GREEN}All required columns are present.${NC}"
      fi
    else
      log_message "ERROR" "${RED}Could not find fuel transactions table.${NC}"
      return 1
    fi
    
    return 0
  else
    log_message "ERROR" "${RED}Database integrity check failed.${NC}"
    return 1
  fi
}

# Check API health
check_api() {
  log_message "INFO" "Checking API health..."
  
  # Check if curl is available
  if ! command -v curl >/dev/null 2>&1; then
    log_message "WARN" "${YELLOW}curl command not found, skipping API health check.${NC}"
    return 2
  fi
  
  # Try to call the health endpoint
  local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "failed")
  
  if [ "$response" = "200" ]; then
    log_message "INFO" "${GREEN}API is responding properly (status 200).${NC}"
    return 0
  elif [ "$response" = "failed" ]; then
    log_message "ERROR" "${RED}Failed to connect to API.${NC}"
    return 1
  else
    log_message "WARN" "${YELLOW}API responded with unexpected status: $response${NC}"
    return 2
  fi
}

# Main health check
main() {
  log_message "INFO" "========================================"
  log_message "INFO" "Starting health check at $(date)"
  log_message "INFO" "========================================"
  
  # Check server
  check_server
  local server_status=$?
  
  # Check database
  check_database
  local db_status=$?
  
  # Check API
  check_api
  local api_status=$?
  
  # Output summary
  log_message "INFO" "========================================"
  log_message "INFO" "Health check summary:"
  
  if [ $server_status -eq 0 ]; then
    log_message "INFO" "${GREEN}✓ Server: OK${NC}"
  elif [ $server_status -eq 2 ]; then
    log_message "INFO" "${YELLOW}⚠ Server: WARNING${NC}"
  else
    log_message "INFO" "${RED}✗ Server: FAIL${NC}"
  fi
  
  if [ $db_status -eq 0 ]; then
    log_message "INFO" "${GREEN}✓ Database: OK${NC}"
  else
    log_message "INFO" "${RED}✗ Database: FAIL${NC}"
  fi
  
  if [ $api_status -eq 0 ]; then
    log_message "INFO" "${GREEN}✓ API: OK${NC}"
  elif [ $api_status -eq 2 ]; then
    log_message "INFO" "${YELLOW}⚠ API: WARNING${NC}"
  else
    log_message "INFO" "${RED}✗ API: FAIL${NC}"
  fi
  
  # Final verdict
  if [ $server_status -eq 0 ] && [ $db_status -eq 0 ] && [ $api_status -eq 0 ]; then
    log_message "INFO" "${GREEN}Overall health: GOOD${NC}"
  elif [ $server_status -gt 1 ] || [ $api_status -gt 1 ]; then
    log_message "INFO" "${YELLOW}Overall health: WARNING${NC}"
  else
    log_message "INFO" "${RED}Overall health: BAD${NC}"
  fi
  
  log_message "INFO" "========================================"
}

# Run the health check
main

exit 0 