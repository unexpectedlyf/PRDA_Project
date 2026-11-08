# PRDA Profile Manager — Technical Setup (Mac)

## Download and extract
Download `PRDA_Profile_Manager_REGENERATED.zip`, then double-click it in Finder. Open the `PRDA_Project` folder in VS Code. Do not open only a single JavaScript file.

## Install prerequisites
Install Node.js LTS from https://nodejs.org/en/download and VS Code from https://code.visualstudio.com/. Use MongoDB Atlas (https://www.mongodb.com/products/platform/atlas-database) or a local MongoDB server. MongoDB Compass alone does not run a database.

Check installation in VS Code Terminal:
```bash
node -v
npm -v
```

## Install and configure
```bash
cd /path/to/PRDA_Project
npm install
cp .env.example .env
openssl rand -hex 32
```
Open `.env`. Replace `MONGODB_URI` with your actual MongoDB connection string. Replace `JWT_SECRET` with the random hex string printed by openssl. Keep `PORT=3000` and `NODE_ENV=development`. If using Atlas, create a database user, configure network access, and URL-encode any special characters in the database password. Never upload `.env`.

## Test and run
```bash
npm test
npm start
```
Open http://localhost:3000/register.html to create a test user, then http://localhost:3000/ to log in. On successful login, edit email, numeric phone and date of birth on the profile page and save. Use Ctrl+C in Terminal to stop the server.

## Evidence and marks
Q1 (100): design interpretation (10), functioning code (80), clear comments (10). Capture screenshots of login, profile, saved changes, validation errors, mobile responsive view.
Q2 (50): test cases (10), execution (15), error findings (10), fixes/retest (15). Run `npm test` and manually exercise wrong password, bad email, nonnumeric phone, saved changes and unauthenticated access. Record actual outcomes; the supplied assessment does not include the promised buggy source snippet.
Q3 (50): deployment platform (10), tools (10), live deployment (15), UAT (15). Deploy to a Node-compatible host (for example Render) with MongoDB Atlas, configure environment variables and HTTPS, record real deployment logs/URL and actual user feedback. These cannot be claimed complete until you perform them.

## Troubleshooting
- `npm: command not found`: install Node.js LTS and reopen Terminal.
- `Cannot find module`: run `npm install` from `PRDA_Project`.
- `Set MONGODB_URI and a strong JWT_SECRET`: check `.env` in project root and secret length >= 32.
- `ECONNREFUSED 127.0.0.1:27017`: start local MongoDB or use Atlas URI.
- Atlas authentication or timeout: check DB username/password, IP access and URI.
- `EADDRINUSE 3000`: stop the existing server or change `PORT`.

