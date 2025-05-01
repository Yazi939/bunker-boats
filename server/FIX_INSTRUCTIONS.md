# Fixing Database Error: Missing Columns

This package addresses the error: `no such column: FuelTransaction.supplier` and other similar missing column errors in the FuelTransactions table.

## Problem

The database schema doesn't match the model definition. The server is trying to query columns that don't exist in the database table.

## Solution

We've created two solutions:

1. A script that adds the missing columns to the database
2. Updated controllers to properly handle the columns

## Instructions

1. Run the fix script to add the missing columns:

```bash
cd server
node fix_sqlite_columns.js
```

2. After the script completes successfully, restart the server:

```bash
pm2 restart fuel-server
```

3. Check the logs to verify that the error is resolved:

```bash
pm2 logs
```

## What the Fix Does

The script performs the following actions:

1. Creates a backup of your database in case of issues
2. Adds the following columns to the FuelTransactions table if they're missing:
   - supplier
   - customer
   - vessel
   - paymentMethod
   - key
   - frozen
   - edited

## Troubleshooting

If you still encounter issues after running the fix:

1. Check if the database has been updated successfully by running:
   ```
   sqlite3 data/database.sqlite ".schema FuelTransactions"
   ```

2. If the columns are still missing, you may need to manually modify the database or restore from a clean backup.

3. Contact support for additional assistance. 