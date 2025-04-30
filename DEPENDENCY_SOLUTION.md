# Dependency Issue Solutions

## Current Issues

1. **Node.js Version Mismatch**:
   - Server is using Node.js v18.19.1
   - Local development is using Node.js v22.14.0
   - react-router-dom v7.5.2 requires Node.js v20+

2. **SQLite Native Dependencies**:
   - SQLite packages (sqlite3, better-sqlite3) require native compilation or prebuilt binaries
   - Current environment lacks Visual Studio C++ build tools needed for compilation
   - Prebuilt binaries for Node.js v22 are not available

## Recommended Solutions

### Option 1: Match the Server Environment (Recommended)

1. Install Node.js v18.19.1 to match the server environment
   - Download from [Node.js official site](https://nodejs.org/download/release/v18.19.1/)
   - Or use NVM for Windows to manage multiple Node.js versions

2. After installing Node.js v18.19.1, run:
   ```
   npm uninstall react-router-dom
   npm install react-router-dom@6.20.1 --save
   npm uninstall sqlite3 better-sqlite3
   npm install sqlite3@5.1.6 better-sqlite3@8.6.0 --save
   ```

### Option 2: Install Build Tools

1. Install Visual Studio 2022 Community Edition with "Desktop development with C++" workload
   - Download from [Visual Studio website](https://visualstudio.microsoft.com/vs/community/)
   - During installation, select "Desktop development with C++" workload
   - Also ensure you install a Windows SDK

2. After installing Visual Studio, reinstall the SQLite packages:
   ```
   npm uninstall sqlite3 better-sqlite3
   npm install sqlite3 better-sqlite3 --build-from-source
   ```

### Option 3: Use Docker for Development

Create a Docker development environment that matches the server configuration exactly.

## Other Notes

- Several packages are showing as deprecated in npm warnings. These can be addressed later with `npm audit fix` after resolving the critical issues.
- If you continue developing with Node.js v22, you'll need to ensure all your dependencies are compatible with this version, and you'll need to install build tools for native modules. 