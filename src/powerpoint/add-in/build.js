const fs = require('fs');
const path = require('path');

console.log('Building PowerPoint Add-in...');

// Read templates from prebuild
const PREBUILD_TEMPLATES = path.join(__dirname, '../../prebuild/templates');

const baseHtml = fs.readFileSync(path.join(PREBUILD_TEMPLATES, 'ui-base.html'), 'utf8');
const baseCss = fs.readFileSync(path.join(PREBUILD_TEMPLATES, 'ui-base.css'), 'utf8');
const baseJs = fs.readFileSync(path.join(PREBUILD_TEMPLATES, 'ui-base.js'), 'utf8');

// Read the hash for cache busting
const hashFile = path.join(PREBUILD_TEMPLATES, 'icons-data.hash');
if (!fs.existsSync(hashFile)) {
  console.error('Error: icons-data.hash file not found in prebuild/templates');
  process.exit(1);
}

const hash = fs.readFileSync(hashFile, 'utf8').trim();
console.log(`Using icons data with hash: ${hash}`);

// Read platform-specific script
const platformJs = fs.readFileSync('taskpane-platform.js', 'utf8');

// Build taskpane.html with inline CSS and external JS
const platformHead = `
    <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
    <link rel="stylesheet" href="taskpane.css" />`;

const platformScripts = `
    <script src="icons-data.js?v=${hash}"></script>
    <script src="taskpane.js"></script>
    <script src="taskpane-platform.js"></script>`;

const html = baseHtml
  .replace('<!-- PLATFORM_HEAD_PLACEHOLDER -->', platformHead)
  .replace('<!-- SIZE_UNIT_PLACEHOLDER -->', 'pt')
  .replace('<!-- PLATFORM_SCRIPTS_PLACEHOLDER -->', platformScripts);

// Add PowerPoint-specific CSS variables
const css = `:root {
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --primary-color: #0078d4;
}

${baseCss}

.status-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: #323130;
  color: white;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 1000;
  pointer-events: none;
}

.status-message.show {
  opacity: 1;
}

.status-message.error {
  background: #a4262c;
}

.status-message.success {
  background: #107c10;
}`;

// Combine base.js with platform-specific additions
const js = `${baseJs}

// Setup on load
if (typeof Office !== 'undefined') {
  Office.onReady((info) => {
    if (info.host === Office.HostType.PowerPoint) {
      console.log('PowerPoint Add-in ready');
      initializeIcons();
      setupEventListeners();
    }
  });
}`;

// Write output files
fs.writeFileSync('taskpane.html', html, 'utf8');
fs.writeFileSync('taskpane.css', css, 'utf8');
fs.writeFileSync('taskpane.js', js, 'utf8');

// Copy icons-data file
fs.copyFileSync(
  path.join(PREBUILD_TEMPLATES, 'icons-data.js'),
  'icons-data.js'
);

console.log('Build complete!');
console.log('Generated files:');
console.log('  - taskpane.html');
console.log('  - taskpane.css');
console.log('  - taskpane.js');
console.log('  - taskpane-platform.js (kept as-is)');
console.log(`  - icons-data.js (copied from prebuild, hash: ${hash})`);
