# Fuel Management Application

This application is designed to track fuel expenses, sales, and salary expenses for a fuel management business. The application has been stabilized and optimized for server deployment with a focus on reliability.

## Features

- Dashboard with fuel and salary expenses statistics
- Fuel transactions management (purchases, sales)
- Expense tracking
- User management with role-based access control
- Automatic database maintenance and health checks

## System Requirements

- Node.js 16+ (LTS recommended)
- SQLite 3
- PM2 (for production deployment)
- Cron (for automated maintenance)

## Project Structure

- **server/**: Backend code
  - **controllers/**: API controllers
  - **models/**: Database models
  - **routes/**: API routes
  - **middleware/**: Express middleware
  - **config/**: Configuration files
  - **data/**: Database files
  - **logs/**: Server logs
- **src/**: Frontend code
  - **components/**: React components
  - **services/**: API services
  - **hooks/**: React hooks
  - **utils/**: Utility functions

## Installation

### Development Environment

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

### Production Environment

1. Clone the repository
2. Install dependencies:

```bash
npm install --production
```

3. Build the application:

```bash
npm run build
```

4. Configure PM2:

```bash
npm install pm2 -g
pm2 start ecosystem.config.js
```

5. Setup maintenance scripts:

```bash
cd server
chmod +x setup_cron_jobs.sh
./setup_cron_jobs.sh
```

## Database Maintenance

The application includes several tools to ensure database integrity:

- **fix_database.sh**: Adds missing columns and fixes database structure
- **check_health.sh**: Monitors application health and database status
- **setup_cron_jobs.sh**: Sets up automated maintenance

To manually fix database issues:

```bash
cd server
./fix_database.sh
```

## Dashboard

The dashboard has been optimized to focus solely on fuel expenses and salary statistics, showing:

- Financial statistics for fuel (purchases, sales, profit)
- Expense statistics (salary, repairs, other expenses)
- Visual charts for expense structure and financial balance

## Server Stability

Several improvements have been made to ensure server stability:

1. Robust error handling in controllers
2. Database transaction support for critical operations
3. Automatic column synchronization (volume/amount)
4. Automatic database health checks
5. Cron jobs for regular maintenance
6. Comprehensive logging

## Troubleshooting

### Missing Columns Error

If you encounter a "column does not exist" error:

1. Stop the server
2. Run the database fix script:

```bash
cd server
./fix_database.sh
```

3. Restart the server

### Connection Issues

If the application can't connect to the database:

1. Check the logs in `server/logs/`
2. Run the health check:

```bash
cd server
./check_health.sh
```

3. Ensure the database file exists in `server/data/`

## License

MIT 