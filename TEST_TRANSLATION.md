# Testing Translation API - Updated Fix

## Latest Fixes Applied

### Issue 1: Main page bypassing translation API ✅ FIXED
### Issue 2: URN format error in Data Management API ✅ FIXED

The latest error "Urn is not in the proper format" was caused by incorrectly formatted URNs being passed to the Autodesk Data Management API.

### What Was Fixed:

1. **ModelPickerPopup.tsx**: 
   - Removed invalid URN generation (`btoa(node.id)`)
   - Now passes empty `viewerUrn` to be filled during translation

2. **Project Page**: 
   - Added translation API call in `handleModelSelect`
   - Now gets proper storage URN and submits for translation
   - Uses translated URN for viewer

3. **Enhanced URN Handling** (`lib/autodesk-aps.ts`):
   - Added URN format validation
   - Added fallback for different URN patterns
   - Added proper error handling for API URN format issues
   - Added `deriveStorageUrnFromVersion` fallback method

4. **Enhanced Logging**:
   - Added detailed console logging to track URN generation
   - Can now see the exact URN being passed to AutodeskViewer

## Current Workflow

```
User Selects Model → Translation API → URN Validation → Storage URN → Model Derivative API → Viewer URN → AutodeskViewer
```

## Debug Steps

1. **Debug URN Formats First**:
   ```bash
   # Test what URN formats we're receiving
   curl -X POST http://localhost:3000/api/debug/urn-format \
     -H "Content-Type: application/json" \
     -d '{"projectId":"YOUR_PROJECT_ID","versionId":"YOUR_VERSION_ID"}'
   ```

2. **Test the full workflow**:
   - Go to any project page (e.g., `/projects/p1/option-A`)
   - Click "Link Model"
   - Select a Revit model
   - Watch browser console for logs

3. **Expected Console Output**:
   ```
   🔗 Project Page: Starting model linking process for: [Model Name]
   🚀 Project Page: Requesting model translation via API...
   📁 Translation API: Input versionId: [Version URN]
   📁 Translation API: Input projectId: [Project ID]
   🔍 APS: Getting version details for: [Version URN]
   ✅ Translation API: Storage URN obtained: [Storage URN]
   🎯 Translation API: Viewer URN generated: [Base64 URN]
   ✅ Project Page: Translation API response: [API Response]
   🔍 AutodeskViewer: urn: [Final URN]
   ✅ AutodeskViewer: All requirements met, initializing viewer with URN: [URN]
   ```

4. **Check URN Formats**:
   - Project ID: Should start with `b.` or `urn:`
   - Version ID: Should start with `urn:adsk.wipprod:dm.version:`
   - Storage URN: Should start with `urn:adsk.objects:` or be version URN
   - Viewer URN: Should be base64 encoded storage URN (~50+ characters)

## If Still Failing

1. **Check Authentication**:
   ```bash
   curl http://localhost:3000/api/test-translation
   ```

2. **Check Translation API Directly**:
   ```bash
   curl -X POST http://localhost:3000/api/autodesk/translate \
     -H "Content-Type: application/json" \
     -d '{"projectId":"YOUR_PROJECT_ID","versionId":"YOUR_VERSION_ID"}'
   ```

3. **Verify URN in Browser**:
   - Open browser dev tools
   - Look for `🔍 AutodeskViewer: urn:` logs
   - URN should be from translation API, not direct base64

## Known Issues

- If translation is still in progress (`status: 'inprogress'`), model will show as "processing"
- Translation can take several minutes for large Revit files
- Check translation status with GET `/api/autodesk/translate?urn=[URN]`