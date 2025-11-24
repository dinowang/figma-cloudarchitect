const fs = require('fs');
const path = require('path');

const prebuildDir = path.resolve(__dirname, '..', '..', 'prebuild');
const outDir = path.resolve(__dirname, 'out');
const webviewDir = path.join(outDir, 'webview');

console.log('Building VSCode extension resources...');

// Create out/webview directory
if (!fs.existsSync(webviewDir)) {
  fs.mkdirSync(webviewDir, { recursive: true });
}

const templatesDir = path.join(prebuildDir, 'templates');

// Copy ui-base files
['ui-base.html', 'ui-base.css', 'ui-base.js'].forEach(file => {
  const src = path.join(templatesDir, file);
  const dest = path.join(webviewDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  }
});

// Copy icons-data.js
const iconsDataSrc = path.join(templatesDir, 'icons-data.js');
const iconsDataDest = path.join(webviewDir, 'icons-data.js');
fs.copyFileSync(iconsDataSrc, iconsDataDest);
console.log('✓ Copied icons-data.js');

console.log('Build complete!');
