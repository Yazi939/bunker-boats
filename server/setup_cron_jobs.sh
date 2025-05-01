#!/bin/bash

# Setup script for cron jobs
# This script sets up periodic health checks and database maintenance

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up cron jobs for server maintenance...${NC}"

# Get the current directory (where the server files are located)
SERVER_DIR=$(dirname "$(readlink -f "$0")")
echo "Server directory: $SERVER_DIR"

# Make health check script executable
chmod +x "$SERVER_DIR/check_health.sh"
chmod +x "$SERVER_DIR/fix_database.sh"

# Create a temporary file for the crontab
TEMP_CRON=$(mktemp)

# Export current crontab
crontab -l > "$TEMP_CRON" 2>/dev/null || echo "# Fuel management application cron jobs" > "$TEMP_CRON"

# Check if health check job already exists
if ! grep -q "check_health.sh" "$TEMP_CRON"; then
    # Add hourly health check
    echo "# Hourly health check for fuel management application" >> "$TEMP_CRON"
    echo "0 * * * * cd $SERVER_DIR && ./check_health.sh >> $SERVER_DIR/logs/cron.log 2>&1" >> "$TEMP_CRON"
    echo -e "${GREEN}Added hourly health check job${NC}"
else
    echo -e "${YELLOW}Health check job already exists in crontab${NC}"
fi

# Check if weekly database maintenance job already exists
if ! grep -q "fix_database.sh" "$TEMP_CRON"; then
    # Add weekly database maintenance (Sunday at 2 AM)
    echo "# Weekly database maintenance for fuel management application" >> "$TEMP_CRON"
    echo "0 2 * * 0 cd $SERVER_DIR && ./fix_database.sh >> $SERVER_DIR/logs/db_maintenance.log 2>&1" >> "$TEMP_CRON"
    echo -e "${GREEN}Added weekly database maintenance job${NC}"
else
    echo -e "${YELLOW}Database maintenance job already exists in crontab${NC}"
fi

# Install the updated crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

# Verify cron installation
if crontab -l | grep -q "check_health.sh"; then
    echo -e "${GREEN}Cron jobs successfully installed!${NC}"
else
    echo -e "${RED}Failed to install cron jobs!${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating log directories...${NC}"
mkdir -p "$SERVER_DIR/logs"

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${YELLOW}Cron jobs will run:${NC}"
echo "- Health check: Every hour"
echo "- Database maintenance: Every Sunday at 2 AM"

exit 0 