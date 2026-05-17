# MediSmart Installation Troubleshooting Guide

## Problem: npm install fails with "Exit handler never called" error

This error indicates npm cache corruption or Node.js installation issues.

---

## Solution 1: Run INSTALL_FIX.bat (Recommended)
1. Double-click `INSTALL_FIX.bat` in the project folder
2. Wait for it to complete (2-3 minutes)
3. Run `npm run dev`

---

## Solution 2: Use Yarn Instead
1. Double-click `INSTALL_WITH_YARN.bat`
2. Wait for installation
3. Run `yarn dev` or `npm run dev`

---

## Solution 3: Manual PowerShell Commands
Open PowerShell as Administrator and run:

```powershell
# Navigate to project
cd "C:\Users\king computer\Downloads\medismart_stage7_final"

# Clear npm cache
npm cache clean --force

# Verify cache
npm cache verify

# Remove old files
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Install with legacy peer deps
npm install --legacy-peer-deps

# If above fails, try with force
npm install --force
```

---

## Solution 4: Reinstall Node.js
If all above fail, your Node.js installation may be corrupted:

1. Uninstall Node.js from Windows Settings
2. Download latest LTS from: https://nodejs.org/
3. Install Node.js
4. Restart computer
5. Run `INSTALL_FIX.bat` again

---

## Solution 5: Use Different npm Registry
Sometimes the default registry has issues:

```powershell
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install
```

---

## Solution 6: Check Antivirus/Firewall
Some antivirus software blocks npm:

1. Temporarily disable antivirus
2. Run `INSTALL_FIX.bat`
3. Re-enable antivirus after installation

---

## Verify Installation Success
After successful installation, you should see:
- `node_modules` folder created
- `package-lock.json` file created
- No error messages

Then run:
```
npm run dev
```

The app should start on http://localhost:3000

---

## Still Having Issues?
Check the error log at:
`C:\Users\king computer\AppData\Local\npm-cache\_logs\`

Look for the most recent log file and check for specific errors.

---

## Quick Test Commands
```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if npm is working
npm list --depth=0
```

Expected versions:
- Node.js: v18.x or higher
- npm: v9.x or higher
