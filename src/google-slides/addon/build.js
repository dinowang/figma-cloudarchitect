const fs = require('fs');
const path = require('path');

console.log('Building Google Slides Add-on...');

// Read template files from prebuild
const templatesDir = path.join(__dirname, '../../prebuild/templates');
const baseHtml = fs.readFileSync(path.join(templatesDir, 'ui-base.html'), 'utf8');
const baseCss = fs.readFileSync(path.join(templatesDir, 'ui-base.css'), 'utf8');
const baseJs = fs.readFileSync(path.join(templatesDir, 'ui-base.js'), 'utf8');
const iconsDataJs = fs.readFileSync(path.join(templatesDir, 'icons-data.js'), 'utf8');

// Read hash for cache busting info (not used in Apps Script but good for logging)
const hash = fs.readFileSync(path.join(templatesDir, 'icons-data.hash'), 'utf8').trim();

console.log(`Templates loaded from prebuild (hash: ${hash})`);

// Create platform-specific script for Google Slides
const platformScript = `
// Google Slides Add-on specific logic
$(function() {
  initializeIcons();
  setupEventListeners();
});

// Override handleIconClick for Google Slides
function handleIconClick(icon) {
  const iconSize = parseInt($('#icon-size').val()) || 64;
  insertIcon(icon, iconSize);
}

function insertIcon(icon, size) {
  try {
    // Decode SVG from base64
    const svgXml = atob(icon.svg);
    
    // Show loading status
    showStatus('Inserting icon...', 'info');
    
    // Call server-side function to insert icon
    google.script.run
      .withSuccessHandler(onInsertSuccess)
      .withFailureHandler(onInsertFailure)
      .insertIcon(svgXml, icon.name, size);
    
  } catch (error) {
    console.error('Error inserting icon:', error);
    showStatus('Error: ' + error.message, 'error');
  }
}

function onInsertSuccess(result) {
  if (result.success) {
    showStatus('Icon inserted successfully!', 'success');
  } else {
    showStatus('Error: ' + result.error, 'error');
  }
}

function onInsertFailure(error) {
  console.error('Server error:', error);
  showStatus('Server error: ' + error.message, 'error');
}

function showStatus(message, type) {
  const statusEl = $('#status-message');
  statusEl
    .removeClass('show success error info')
    .addClass(type + ' show')
    .text(message);
  
  setTimeout(() => {
    statusEl.removeClass('show');
  }, 3000);
}

// Override setupEventListeners to use jQuery
function setupEventListeners() {
  $('#search').on('input', function() {
    const query = $(this).val();
    $('#icons-container').scrollTop(0);
    renderIcons(query);
  });
  
  $('.size-preset-btn').on('click', function() {
    const size = $(this).data('size');
    $('#icon-size').val(size);
  });
}

// Override renderIcons to use jQuery for better compatibility
const _baseRenderIcons = renderIcons;
renderIcons = function(query = '') {
  if (renderTimeout) clearTimeout(renderTimeout);
  
  renderTimeout = setTimeout(() => {
    const container = $('#icons-container');
    container.empty();
    
    const sources = Object.keys(organizedIcons).sort();
    let totalShown = 0;
    const MAX_INITIAL_ICONS = query ? 500 : 100;
    
    sources.forEach(source => {
      const sourceSection = $('<div>').addClass('source-section');
      const sourceHeader = $('<div>').addClass('source-header');
      const sourceTitle = $('<div>').addClass('source-header-title').text(source);
      const sourceCount = $('<span>').addClass('source-header-count').text(sourceIconCounts[source] + ' icons');
      
      sourceHeader.append(sourceTitle).append(sourceCount);
      sourceSection.append(sourceHeader);
      
      const categories = Object.keys(organizedIcons[source]).sort();
      let sourceHasIcons = false;
      
      categories.forEach(category => {
        const categorySection = $('<div>').addClass('category-section');
        const categoryHeader = $('<div>').addClass('category-header').text(category);
        categorySection.append(categoryHeader);
        
        const icons = organizedIcons[source][category];
        let categoryHasIcons = false;
        
        icons.forEach((icon, idx) => {
          if (totalShown >= MAX_INITIAL_ICONS && !query) return;
          
          if (query) {
            const searchTerm = query.toLowerCase();
            const matchName = icon.name.toLowerCase().includes(searchTerm);
            const matchCategory = category.toLowerCase().includes(searchTerm);
            const matchSource = source.toLowerCase().includes(searchTerm);
            
            if (!matchName && !matchCategory && !matchSource) return;
          }
          
          const item = $('<div>').addClass('icon-item');
          
          const imageContainer = $('<div>').addClass('icon-item-image');
          const img = $('<img>')
            .attr('data-src', 'data:image/svg+xml;base64,' + icon.svg)
            .attr('alt', icon.name)
            .attr('loading', 'lazy');
          
          if (idx < 20 || query) {
            img.attr('src', img.attr('data-src'));
          } else {
            setTimeout(() => {
              if (img.attr('data-src')) img.attr('src', img.attr('data-src'));
            }, 100);
          }
          
          imageContainer.append(img);
          
          const name = $('<div>').addClass('icon-item-name').text(icon.name);
          
          item.append(imageContainer).append(name);
          item.on('click', () => handleIconClick(icon));
          
          categorySection.append(item);
          categoryHasIcons = true;
          totalShown++;
        });
        
        if (categoryHasIcons) {
          sourceSection.append(categorySection);
          sourceHasIcons = true;
        }
      });
      
      if (sourceHasIcons) {
        container.append(sourceSection);
      }
    });
    
    if (totalShown === 0) {
      container.html('<div class="no-results">No icons found</div>');
    }
  }, 150);
};
`;

// Create CSS variables for Google Slides
const platformCss = `
:root {
  --font-family: 'Roboto', 'Arial', sans-serif;
  --primary-color: #4285f4;
  --header-bg: #e8f0fe;
  --hover-bg: #e8f0fe;
}
`;

// Generate Sidebar.html (main UI file)
const sidebarHtml = baseHtml
  .replace('<!-- PLATFORM_HEAD_PLACEHOLDER -->', `
    <base target="_top">
    <style>
      ${platformCss}
      ${baseCss}
    </style>`)
  .replace('<!-- SIZE_UNIT_PLACEHOLDER -->', 'pt')
  .replace('<!-- PLATFORM_SCRIPTS_PLACEHOLDER -->', `
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script>
      <?!= include('SidebarData'); ?>
    </script>
    <script>
      <?!= include('SidebarScript'); ?>
    </script>
    <script>
      <?!= include('SidebarPlatform'); ?>
    </script>
  `);

fs.writeFileSync('Sidebar.html', sidebarHtml, 'utf8');
console.log('Created: Sidebar.html');

// Generate SidebarData.html (icons data)
fs.writeFileSync('SidebarData.html', `<script>\n${iconsDataJs}\n</script>`, 'utf8');
console.log('Created: SidebarData.html');

// Generate SidebarScript.html (base UI logic)
fs.writeFileSync('SidebarScript.html', `<script>\n${baseJs}\n</script>`, 'utf8');
console.log('Created: SidebarScript.html');

// Generate SidebarPlatform.html (platform-specific logic)
fs.writeFileSync('SidebarPlatform.html', `<script>\n${platformScript}\n</script>`, 'utf8');
console.log('Created: SidebarPlatform.html');

// File size info
const sidebarSize = (fs.statSync('Sidebar.html').size / 1024).toFixed(2);
const dataSize = (fs.statSync('SidebarData.html').size / 1024 / 1024).toFixed(2);

console.log(`\nGenerated files:`);
console.log(`  Sidebar.html: ${sidebarSize} KB`);
console.log(`  SidebarData.html: ${dataSize} MB`);
console.log(`  SidebarScript.html`);
console.log(`  SidebarPlatform.html`);
console.log('\nBuild complete!');
console.log('\nNext steps:');
console.log('1. Run: clasp login (if not logged in)');
console.log('2. Run: clasp create --type standalone --title "Cloud Architect Kits"');
console.log('3. Run: clasp push');
console.log('4. Open the Apps Script editor: clasp open');
console.log('5. Test the add-on in Google Slides');
