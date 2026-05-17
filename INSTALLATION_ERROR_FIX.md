# ⚠️ Installation Error Fix

## The Problem

You typed: `npm install jspdf jstotable` ❌

Should be: `npm install jspdf jspdf-autotable` ✅

## Correct Command

```bash
npm install jspdf jspdf-autotable
```

**Note the difference:**
- ❌ `jstotable` (wrong)
- ✅ `jspdf-autotable` (correct - with hyphen)

## Quick Fix

### Option 1: Manual Command
Open PowerShell in the project folder and run:
```powershell
npm install jspdf jspdf-autotable
```

### Option 2: Use Fixed Batch File
Double-click: `install-export-fixed.bat`

### Option 3: Copy-Paste
Copy this exact command:
```
npm install jspdf jspdf-autotable
```

## Verify Installation

After successful installation, check `package.json`:

```json
"dependencies": {
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4",
  ...
}
```

## Then Run Dev Server

```bash
npm run dev
```

## Common Mistakes to Avoid

1. ❌ `jstotable` - Missing "pdf" and hyphen
2. ❌ `jspdf autotable` - Missing hyphen
3. ❌ `jspdfautotable` - Missing hyphen
4. ✅ `jspdf-autotable` - CORRECT!

## If Still Having Issues

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall:**
   ```bash
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   npm install jspdf jspdf-autotable
   ```

3. **Check npm version:**
   ```bash
   npm --version
   ```
   Should be 8.0.0 or higher

4. **Update npm if needed:**
   ```bash
   npm install -g npm@latest
   ```

## Success Indicators

You'll know it worked when:
- ✅ No error messages
- ✅ "added 2 packages" message appears
- ✅ Packages appear in package.json
- ✅ Packages appear in node_modules folder

## Next Steps

Once installed successfully:

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Test export features:
   - Go to Admin → Reports
   - Click "Export PDF" button
   - Click "Export CSV" button

3. Verify files download correctly

## Need Help?

If you continue to have issues:
1. Check your internet connection
2. Try using a different terminal (CMD instead of PowerShell)
3. Run as Administrator
4. Check if antivirus is blocking npm

---

**Remember:** The correct package name is `jspdf-autotable` with a hyphen! 🎯
