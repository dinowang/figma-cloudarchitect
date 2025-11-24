const fs = require('fs');
const path = require('path');

const prebuildDir = path.resolve(__dirname, '..', '..', 'prebuild');
const templatesDir = path.join(prebuildDir, 'templates');
const outDir = path.resolve(__dirname, 'out');

console.log('Building Google Slides Add-on...');

// Create out directory
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read icons-data.js
const iconsDataContent = fs.readFileSync(path.join(templatesDir, 'icons-data.js'), 'utf-8');
const hashMatch = iconsDataContent.match(/\/\/ Hash: ([a-f0-9]+)/);
const hash = hashMatch ? hashMatch[1] : 'unknown';
console.log(`Using icons data with hash: ${hash}`);

// Build Sidebar.html
const uiBaseHtml = fs.readFileSync(path.join(templatesDir, 'ui-base.html'), 'utf-8');
const uiBaseCss = fs.readFileSync(path.join(templatesDir, 'ui-base.css'), 'utf-8');
const uiBaseJs = fs.readFileSync(path.join(templatesDir, 'ui-base.js'), 'utf-8');

let html = uiBaseHtml;

// Replace PLATFORM_HEAD_PLACEHOLDER
html = html.replace(
  '<!-- PLATFORM_HEAD_PLACEHOLDER -->',
  `<?!= include('SidebarStyle'); ?>`
);

// Replace SIZE_UNIT_PLACEHOLDER
html = html.replace('<!-- SIZE_UNIT_PLACEHOLDER -->', 'pt');

// Replace PLATFORM_SCRIPTS_PLACEHOLDER
html = html.replace(
  '<!-- PLATFORM_SCRIPTS_PLACEHOLDER -->',
  `<?!= include('SidebarData'); ?>
  <?!= include('SidebarScript'); ?>
  <?!= include('SidebarPlatform'); ?>`
);

fs.writeFileSync(path.join(outDir, 'Sidebar.html'), html);
console.log('✓ Built: Sidebar.html');

// Create SidebarStyle.html
const sidebarStyle = `<style>
:root {
  --font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --primary-color: #1a73e8;
  --header-bg: #e8f0fe;
  --hover-bg: #e8f0fe;
}

${uiBaseCss}
</style>`;
fs.writeFileSync(path.join(outDir, 'SidebarStyle.html'), sidebarStyle);
console.log('✓ Built: SidebarStyle.html');

// Create SidebarData.html
fs.writeFileSync(path.join(outDir, 'SidebarData.html'), `<script>\n${iconsDataContent}\n</script>`);
console.log('✓ Built: SidebarData.html');

// Create SidebarScript.html
fs.writeFileSync(path.join(outDir, 'SidebarScript.html'), `<script>\n${uiBaseJs}\n</script>`);
console.log('✓ Built: SidebarScript.html');

// Copy SidebarPlatform.html from source
const platformSource = fs.readFileSync(path.join(__dirname, 'SidebarPlatform-source.html'), 'utf-8');
fs.writeFileSync(path.join(outDir, 'SidebarPlatform.html'), platformSource);
console.log('✓ Copied: SidebarPlatform.html');

// Copy Code.gs and appsscript.json
fs.copyFileSync(path.join(__dirname, 'Code.gs'), path.join(outDir, 'Code.gs'));
fs.copyFileSync(path.join(__dirname, 'appsscript.json'), path.join(outDir, 'appsscript.json'));
console.log('✓ Copied: Code.gs, appsscript.json');

console.log('Build complete!');
