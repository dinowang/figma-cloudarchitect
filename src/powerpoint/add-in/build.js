const fs = require('fs');
const path = require('path');

const prebuildDir = path.resolve(__dirname, '..', '..', 'prebuild');
const templatesDir = path.join(prebuildDir, 'templates');
const outDir = path.resolve(__dirname, 'out');

console.log('Building PowerPoint Add-in...');

// Create out directory
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read icons-data.js
const iconsDataContent = fs.readFileSync(path.join(templatesDir, 'icons-data.js'), 'utf-8');
const hashMatch = iconsDataContent.match(/\/\/ Hash: ([a-f0-9]+)/);
const hash = hashMatch ? hashMatch[1] : 'unknown';
console.log(`Using icons data with hash: ${hash}`);

// Build taskpane.html
const uiBaseHtml = fs.readFileSync(path.join(templatesDir, 'ui-base.html'), 'utf-8');
const uiBaseCss = fs.readFileSync(path.join(templatesDir, 'ui-base.css'), 'utf-8');
const uiBaseJs = fs.readFileSync(path.join(templatesDir, 'ui-base.js'), 'utf-8');

let html = uiBaseHtml;

// Replace PLATFORM_HEAD_PLACEHOLDER
html = html.replace(
  '<!-- PLATFORM_HEAD_PLACEHOLDER -->',
  `<link rel="stylesheet" href="taskpane.css">`
);

// Replace SIZE_UNIT_PLACEHOLDER
html = html.replace('<!-- SIZE_UNIT_PLACEHOLDER -->', 'pt');

// Replace PLATFORM_SCRIPTS_PLACEHOLDER
html = html.replace(
  '<!-- PLATFORM_SCRIPTS_PLACEHOLDER -->',
  `<script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
  <script src="icons-data.js"></script>
  <script src="taskpane.js"></script>
  <script src="taskpane-platform.js"></script>`
);

fs.writeFileSync(path.join(outDir, 'taskpane.html'), html);
console.log('✓ Built: taskpane.html');

// Copy taskpane.css (write uiBaseCss with Office-specific variables)
const taskpaneCss = `:root {
  --font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  --primary-color: #d83b01;
  --header-bg: #fff4ed;
  --hover-bg: #fff4ed;
}

${uiBaseCss}`;
fs.writeFileSync(path.join(outDir, 'taskpane.css'), taskpaneCss);
console.log('✓ Built: taskpane.css');

// Copy taskpane.js (write uiBaseJs)
fs.writeFileSync(path.join(outDir, 'taskpane.js'), uiBaseJs);
console.log('✓ Built: taskpane.js');

// Copy icons-data.js
fs.copyFileSync(path.join(templatesDir, 'icons-data.js'), path.join(outDir, 'icons-data.js'));
console.log('✓ Copied: icons-data.js');

// Copy taskpane-platform.js
fs.copyFileSync(path.join(__dirname, 'taskpane-platform.js'), path.join(outDir, 'taskpane-platform.js'));
console.log('✓ Copied: taskpane-platform.js');

// Copy other files
fs.copyFileSync(path.join(__dirname, 'manifest.xml'), path.join(outDir, 'manifest.xml'));
fs.copyFileSync(path.join(__dirname, 'commands.html'), path.join(outDir, 'commands.html'));
fs.copyFileSync(path.join(__dirname, 'staticwebapp.config.json'), path.join(outDir, 'staticwebapp.config.json'));
console.log('✓ Copied: manifest.xml, commands.html, staticwebapp.config.json');

// Copy assets directory
const assetsSource = path.join(__dirname, 'assets');
const assetsDest = path.join(outDir, 'assets');
if (fs.existsSync(assetsSource)) {
  if (fs.existsSync(assetsDest)) {
    fs.rmSync(assetsDest, { recursive: true });
  }
  fs.cpSync(assetsSource, assetsDest, { recursive: true });
  console.log('✓ Copied: assets/');
}

console.log('Build complete!');
