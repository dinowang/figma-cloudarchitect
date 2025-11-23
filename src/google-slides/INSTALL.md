# Google Slides Add-on - Installation Guide

Complete guide to building, testing, and deploying the Cloud Architect Kits Google Slides Add-on.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Building the Add-on](#building-the-add-on)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Google Apps Script CLI (clasp)**
  ```bash
  npm install -g @google/clasp
  ```

### Required Accounts

- **Google Account** - For creating and deploying Apps Script projects
- **Google Cloud Project** - For OAuth consent and API access (created automatically by clasp)

## Local Development

### 1. Install Dependencies

```bash
cd src/google-slides/addon
npm install
```

### 2. Build the Add-on

The build process copies UI templates from the prebuild system and assembles the add-on:

```bash
npm run build
```

This will:
1. Copy base UI templates from `../../prebuild/templates/`
2. Copy icons data from `../../prebuild/templates/icons-data.js`
3. Generate platform-specific HTML files:
   - `Sidebar.html` - Main UI container
   - `SidebarData.html` - Icons data include
   - `SidebarScript.html` - UI logic include
   - `SidebarPlatform.html` - Google Slides integration

### 3. Login to Google Apps Script

First time only:

```bash
clasp login
```

This will:
- Open a browser for Google authentication
- Save credentials to `~/.clasprc.json`
- Grant clasp access to manage your Apps Script projects

## Building the Add-on

### Full Build Process

From the project root, use the unified build script:

```bash
./scripts/build-and-release.sh
```

Or build only the Google Slides add-on:

```bash
cd src/google-slides/addon
npm run build
```

### Build Output

After building, you'll have:

```
src/google-slides/addon/
├── Code.gs                    # Server-side Apps Script code
├── Sidebar.html               # Main UI container
├── SidebarData.html           # Icons data (from prebuild)
├── SidebarScript.html         # UI logic (from prebuild)
├── SidebarPlatform.html       # Google Slides integration
├── appsscript.json           # Apps Script manifest
└── .clasp.json               # Clasp configuration (created on first push)
```

## Testing

### Create Apps Script Project

Create a new standalone Apps Script project:

```bash
cd src/google-slides/addon
clasp create --type standalone --title "Cloud Architect Kits"
```

This creates:
- `.clasp.json` - Project configuration with script ID
- Apps Script project in your Google Drive

**Note:** The `.clasp.json` file is ignored by Git. Each developer needs to create their own project.

### Push Code to Google

Push your local code to the Apps Script project:

```bash
clasp push
```

Or use the npm script:

```bash
npm run push
```

### Open in Apps Script Editor

```bash
clasp open
```

This opens the Apps Script editor in your browser.

### Test in Google Slides

1. Open Google Slides: https://slides.google.com
2. Create a new presentation
3. The add-on should appear under **Add-ons** menu
4. Click **Add-ons** → **Cloud Architect Kits** → **Show Icons**

**Note:** On first run, you'll need to authorize the add-on to access your presentations.

### View Logs

To see execution logs:

```bash
clasp logs
```

Or in the Apps Script editor: **View** → **Execution log**

## Deployment

### Development Deployment

For testing with a stable URL:

```bash
clasp deploy --description "Development v1.0.0"
```

### List Deployments

```bash
clasp deployments
```

### Update Existing Deployment

```bash
clasp deploy --deploymentId <deployment-id> --description "Update v1.0.1"
```

### Production Deployment

1. **Create a versioned deployment:**
   ```bash
   clasp deploy --description "Production v1.0.0"
   ```

2. **Get deployment ID:**
   ```bash
   clasp deployments
   ```

3. **Share with users:**
   - In Apps Script editor, click **Deploy** → **Test deployments**
   - Copy the deployment URL
   - Share with users

### Publish to Google Workspace Marketplace

For organization-wide or public distribution:

1. In Apps Script editor, click **Deploy** → **New deployment**
2. Select type: **Add-on**
3. Fill in the deployment configuration:
   - Add-on name
   - Description
   - Category
   - Support email
4. Click **Deploy**
5. Follow Google's review process

**Note:** Publishing to Marketplace requires:
- OAuth consent screen configuration
- Privacy policy and terms of service
- Icon assets (32x32, 64x64, 128x128)
- Store listing details

## Usage

### In Google Slides

1. Open a Google Slides presentation
2. Click **Add-ons** → **Cloud Architect Kits** → **Show Icons**
3. The sidebar opens with icon library
4. Use search to filter icons
5. Click an icon to insert it into the current slide
6. Adjust size using the size controls (16-512 pt)

### Keyboard Shortcuts

- **Ctrl+F / Cmd+F** - Focus search box (in sidebar)
- **Enter** - Insert first icon in search results

### Tips

- Icons are centered on the slide automatically
- Icons maintain aspect ratio
- Size applies to the longer dimension
- Search by icon name, source, or category

## Troubleshooting

### Clasp Login Issues

**Problem:** `clasp login` fails or times out

**Solutions:**
1. Clear cached credentials:
   ```bash
   rm ~/.clasprc.json
   clasp login
   ```
2. Use alternative login method:
   ```bash
   clasp login --creds <path-to-credentials.json>
   ```
3. Check firewall/proxy settings

### Push Fails

**Problem:** `clasp push` fails with permission error

**Solutions:**
1. Verify you're logged in: `clasp login --status`
2. Check `.clasp.json` exists with valid script ID
3. Ensure you have write permissions to the project
4. Try pulling first: `clasp pull` then `clasp push`

### Icons Not Loading

**Problem:** Sidebar shows "Loading icons..." forever

**Solutions:**
1. Verify build completed successfully:
   ```bash
   ls -lh SidebarData.html  # Should be ~26 MB
   ```
2. Rebuild the add-on:
   ```bash
   npm run build
   ```
3. Push updated code:
   ```bash
   clasp push
   ```
4. Hard refresh in Google Slides (Ctrl+Shift+R)

### Authorization Errors

**Problem:** "Authorization required" when opening add-on

**Solutions:**
1. Click **Authorize access** when prompted
2. Select your Google account
3. Review and accept permissions
4. If still fails, revoke and re-authorize:
   - Go to https://myaccount.google.com/permissions
   - Remove "Cloud Architect Kits"
   - Reopen the add-on and authorize again

### Insert Icon Fails

**Problem:** "Failed to insert icon" error

**Solutions:**
1. Ensure a slide is selected (click on slide thumbnail)
2. Check browser console for detailed errors (F12)
3. Verify SVG data is valid:
   - Check `SidebarData.html` contains base64 SVG data
   - Run `npm run build` to regenerate
4. Test with different icons to isolate issue

### Build Errors

**Problem:** `npm run build` fails

**Solutions:**
1. Verify prebuild icons exist:
   ```bash
   ls ../../prebuild/templates/icons-data.js
   ```
2. Check prebuild is up to date:
   ```bash
   cd ../../prebuild
   npm run build
   ```
3. Clean and rebuild:
   ```bash
   rm -rf node_modules
   npm install
   npm run build
   ```

### Quota Exceeded

**Problem:** "Script quota exceeded" error

**Solutions:**
- **Daily execution limit**: 90 minutes per day
- **Script runtime**: 6 minutes per execution
- **URL fetches**: 20,000 per day

If limits are exceeded:
1. Wait for quota reset (daily)
2. Optimize code to reduce execution time
3. Consider upgrading to Google Workspace (higher quotas)

## Development Tips

### Watch for Changes

During development, auto-push on file changes:

```bash
clasp push --watch
```

**Note:** This doesn't rebuild. Run `npm run build` separately when templates change.

### Testing Multiple Icons

Create a test script in Apps Script editor:

```javascript
function testMultipleIcons() {
  const presentation = SlidesApp.getActivePresentation();
  const slide = presentation.getSlides()[0];
  
  // Test data
  const testIcons = [
    { name: "Azure VM", svg: "<svg>...</svg>", size: 64 },
    { name: "Kubernetes", svg: "<svg>...</svg>", size: 128 }
  ];
  
  testIcons.forEach(icon => {
    const result = insertIcon(icon.svg, icon.name, icon.size);
    Logger.log(result);
  });
}
```

Run from Apps Script editor: **Run** → **testMultipleIcons**

### Debugging Client-Side Code

Add debug logging in `SidebarScript.html`:

```javascript
function insertIcon(icon) {
  console.log('Inserting icon:', icon.name);
  console.log('Icon size:', iconSize);
  console.log('SVG length:', icon.svg.length);
  
  google.script.run
    .withSuccessHandler(onInsertSuccess)
    .withFailureHandler(onInsertFailure)
    .insertIcon(icon.svg, icon.name, iconSize);
}
```

View logs in browser console (F12).

### Debugging Server-Side Code

Add logging in `Code.gs`:

```javascript
function insertIcon(svgXml, name, size) {
  Logger.log('insertIcon called');
  Logger.log('Icon name: ' + name);
  Logger.log('Icon size: ' + size);
  Logger.log('SVG length: ' + svgXml.length);
  
  // ... rest of code
}
```

View logs with `clasp logs` or in Apps Script editor.

## File Size Considerations

### Current Sizes

- `SidebarData.html`: ~26 MB (icons data)
- `Sidebar.html`: ~2 KB (UI structure)
- `SidebarScript.html`: ~5 KB (UI logic)
- `SidebarPlatform.html`: ~2 KB (integration)
- `Code.gs`: ~3 KB (server code)

**Total: ~26 MB** (within Apps Script 50 MB project limit)

### Optimization

If file size becomes an issue:
1. Split icons into multiple add-ons by source
2. Load icons from external URL (requires URL Fetch quota)
3. Compress SVG data more aggressively
4. Remove unused icon sources

## OAuth Scopes

The add-on requires these OAuth scopes (defined in `appsscript.json`):

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/presentations.currentonly",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

- `presentations.currentonly` - Access current presentation only
- `script.container.ui` - Show custom UI (sidebar)

**Note:** These are restrictive scopes that only access the current presentation, not all user presentations.

## Related Documentation

- **[README.md](README.md)** - Features and overview
- **[Prebuild System](../prebuild/README.md)** - Icon processing
- **[Google Apps Script Docs](https://developers.google.com/apps-script)** - Official documentation
- **[Clasp Documentation](https://github.com/google/clasp)** - Clasp CLI guide

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Build add-on: `npm run build`
3. ✅ Login to Google: `clasp login`
4. ✅ Create project: `clasp create`
5. ✅ Push code: `clasp push`
6. ✅ Test in Google Slides
7. ✅ (Optional) Deploy: `clasp deploy`

Happy diagramming! 🎨
