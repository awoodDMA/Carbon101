# Model Translation Testing Guide

This document explains how to test the new Autodesk model translation workflow that fixes the "Model data is corrupted or incomplete" error.

## What Was Fixed

The issue was that Revit models weren't being properly translated through the Autodesk Model Derivative API before being displayed in the viewer. This caused error code 5: "Model data is corrupted or incomplete."

### Key Changes Made:

1. **New Translation API** (`/api/autodesk/translate`):
   - Handles the complete translation workflow
   - Gets storage URN from version ID
   - Submits translation job to Model Derivative API
   - Checks translation status
   - Returns proper viewer URN

2. **Updated Model Linker Components**:
   - `ModelLinker.tsx` - Now uses translation API before linking
   - `ModelLinkerSimple.tsx` - Same translation workflow
   - `AutodeskFileBrowser.tsx` - Fixed URN generation

3. **Translation Workflow**:
   ```
   Version ID → Storage URN → Translation Job → Viewer URN
   ```

## Testing the Fix

### Step 1: Test Translation API Access
```bash
# Test if you have proper API access
curl http://localhost:3000/api/test-translation
```
Expected response: Should indicate if you have proper scopes (`code:all`) for Model Derivative API.

### Step 2: Test Model Linking
1. Navigate to any project page (e.g., `/projects/p1/option-A`)
2. Click "Link Model" 
3. Browse to select a Revit model (.rvt file)
4. Select a version and click "Link Model"

### Expected Behavior:
- Console should show translation API calls
- Model should be submitted for translation
- If translation is in progress, status will show "processing"
- If translation is complete, status will show "ready"
- Viewer should load without "Model data is corrupted" error

### Step 3: Check Translation Status
```bash
# Check translation status for a specific URN
curl "http://localhost:3000/api/autodesk/translate?urn=YOUR_URN_HERE"
```

## Common Issues & Solutions

### "Not authenticated" Error
- Ensure you're logged in to Autodesk in Settings
- Check that cookies contain `aps_access_token`

### "Permission denied" Error
- App needs `code:all` scope for Model Derivative API
- Re-authenticate with proper scopes

### "Translation failed" Error
- File format may not be supported
- File may be corrupted
- Network issues during upload

## Translation Status Messages

- **"submitted"**: Translation job queued
- **"inprogress"**: Model being processed (can take several minutes)
- **"success"**: Ready for viewing
- **"failed"**: Translation failed
- **"timeout"**: Processing took too long

## Debugging

Check browser console for detailed logs:
- `🚀` - Translation API calls
- `✅` - Successful operations  
- `❌` - Errors
- `⏳` - In progress operations

## API Endpoints

- `POST /api/autodesk/translate` - Submit model for translation
- `GET /api/autodesk/translate?urn=X` - Check translation status
- `GET /api/test-translation` - Test API permissions