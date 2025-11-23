const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../../prebuild/templates');
const outputDir = __dirname;

console.log('Building Figma plugin UI...');

// Read base templates
const htmlTemplate = fs.readFileSync(path.join(templatesDir, 'ui-base.html'), 'utf-8');
const cssTemplate = fs.readFileSync(path.join(templatesDir, 'ui-base.css'), 'utf-8');
const jsTemplate = fs.readFileSync(path.join(templatesDir, 'ui-base.js'), 'utf-8');
const iconsDataJs = fs.readFileSync(path.join(templatesDir, 'icons-data.js'), 'utf-8');

// Read hash for logging
const hash = fs.readFileSync(path.join(templatesDir, 'icons-data.hash'), 'utf-8').trim();
console.log(`Using icons data with hash: ${hash}`);

// Create Figma-specific platform script
const platformJs = `
// Figma-specific platform implementation
function handleIconClick(icon) {
  const sizeInput = document.getElementById('icon-size');
  const size = parseInt(sizeInput ? sizeInput.value : 64);
  const svgData = atob(icon.svg);
  
  parent.postMessage({ 
    pluginMessage: { 
      type: 'insert-icon',
      svgData: svgData,
      name: icon.name,
      size: size
    } 
  }, '*');
  
  showStatusMessage(\`Inserting \${icon.name}...\`, 'success');
}

function showStatusMessage(message, type = 'success') {
  const statusEl = document.getElementById('status-message');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = 'status-message show ' + type;
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initializeIcons();
    setupEventListeners();
  });
} else {
  initializeIcons();
  setupEventListeners();
}
`;

// Figma-specific CSS variables
const platformCss = `
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --primary-color: #18a0fb;
  --header-bg: #e5f4ff;
  --hover-bg: #e5f4ff;
}
`;

// Build standalone HTML file (all in one)
let standaloneHtml = htmlTemplate;

// Replace placeholders
standaloneHtml = standaloneHtml.replace('<!-- PLATFORM_HEAD_PLACEHOLDER -->', `<style>${platformCss}\n${cssTemplate}</style>`);
standaloneHtml = standaloneHtml.replace('<!-- SIZE_UNIT_PLACEHOLDER -->', 'px');
standaloneHtml = standaloneHtml.replace(
  '<!-- PLATFORM_SCRIPTS_PLACEHOLDER -->',
  `<script>\n${iconsDataJs}\n${jsTemplate}\n${platformJs}\n</script>`
);

// Write output file
const outputPath = path.join(outputDir, 'ui.html');
fs.writeFileSync(outputPath, standaloneHtml);

console.log(`✓ Built: ui.html`);
console.log(`  Size: ${(standaloneHtml.length / 1024 / 1024).toFixed(2)} MB`);
console.log('Build complete!');
