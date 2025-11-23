#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const ICONS_JSON = path.join(__dirname, '../../prebuild/icons.json');
const ICONS_DIR = path.join(__dirname, '../../prebuild/icons');
const OUTPUT_DIR = path.join(__dirname, '../../../dist/drawio-iconlib');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Loading icon metadata...');
const icons = JSON.parse(fs.readFileSync(ICONS_JSON, 'utf8'));

console.log(`Processing ${icons.length} icons...`);

// Group icons by source
const iconsBySource = {};
icons.forEach(icon => {
  if (!iconsBySource[icon.source]) {
    iconsBySource[icon.source] = [];
  }
  iconsBySource[icon.source].push(icon);
});

// Generate library for each source
Object.keys(iconsBySource).forEach(source => {
  const sourceIcons = iconsBySource[source];
  console.log(`\nGenerating library for ${source} (${sourceIcons.length} icons)...`);
  
  const libraryItems = [];
  let successCount = 0;
  let errorCount = 0;
  
  sourceIcons.forEach(icon => {
    try {
      const iconPath = path.join(ICONS_DIR, icon.file);
      
      if (!fs.existsSync(iconPath)) {
        console.error(`  ⚠️  Missing file: ${icon.file}`);
        errorCount++;
        return;
      }
      
      const svgContent = fs.readFileSync(iconPath, 'utf8');
      
      // Parse SVG to get dimensions
      let width = 64;
      let height = 64;
      
      const widthMatch = svgContent.match(/width="(\d+)"/);
      const heightMatch = svgContent.match(/height="(\d+)"/);
      const viewBoxMatch = svgContent.match(/viewBox="[^"]*\s+(\d+)\s+(\d+)"/);
      
      if (widthMatch && heightMatch) {
        width = parseInt(widthMatch[1]);
        height = parseInt(heightMatch[1]);
      } else if (viewBoxMatch) {
        width = parseInt(viewBoxMatch[1]);
        height = parseInt(viewBoxMatch[2]);
      }
      
      // Convert SVG to base64 data URI
      const base64 = Buffer.from(svgContent).toString('base64');
      const dataUri = `data:image/svg+xml;base64,${base64}`;
      
      // Create library item
      libraryItems.push({
        data: dataUri,
        w: width,
        h: height,
        title: icon.name,
        aspect: 'fixed'
      });
      
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error processing ${icon.name}: ${error.message}`);
      errorCount++;
    }
  });
  
  // Generate XML library file
  const libraryJson = JSON.stringify(libraryItems);
  const xmlContent = `<mxlibrary>${libraryJson}</mxlibrary>`;
  
  // Sanitize source name for filename
  const sanitizedSource = source.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const outputFile = path.join(OUTPUT_DIR, `cloud-architect-${sanitizedSource}.xml`);
  
  fs.writeFileSync(outputFile, xmlContent, 'utf8');
  
  console.log(`  ✅ Generated: ${path.basename(outputFile)}`);
  console.log(`  📊 Success: ${successCount}, Errors: ${errorCount}`);
  console.log(`  📦 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
});

// Generate combined library
console.log(`\n\nGenerating combined library (all sources)...`);
const allLibraryItems = [];
let totalSuccess = 0;
let totalErrors = 0;

icons.forEach(icon => {
  try {
    const iconPath = path.join(ICONS_DIR, icon.file);
    
    if (!fs.existsSync(iconPath)) {
      totalErrors++;
      return;
    }
    
    const svgContent = fs.readFileSync(iconPath, 'utf8');
    
    // Parse SVG to get dimensions
    let width = 64;
    let height = 64;
    
    const widthMatch = svgContent.match(/width="(\d+)"/);
    const heightMatch = svgContent.match(/height="(\d+)"/);
    const viewBoxMatch = svgContent.match(/viewBox="[^"]*\s+(\d+)\s+(\d+)"/);
    
    if (widthMatch && heightMatch) {
      width = parseInt(widthMatch[1]);
      height = parseInt(heightMatch[1]);
    } else if (viewBoxMatch) {
      width = parseInt(viewBoxMatch[1]);
      height = parseInt(viewBoxMatch[2]);
    }
    
    // Convert SVG to base64 data URI
    const base64 = Buffer.from(svgContent).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64}`;
    
    // Create library item with source prefix
    allLibraryItems.push({
      data: dataUri,
      w: width,
      h: height,
      title: `${icon.source} - ${icon.name}`,
      aspect: 'fixed'
    });
    
    totalSuccess++;
  } catch (error) {
    totalErrors++;
  }
});

const allLibraryJson = JSON.stringify(allLibraryItems);
const allXmlContent = `<mxlibrary>${allLibraryJson}</mxlibrary>`;
const allOutputFile = path.join(OUTPUT_DIR, 'cloud-architect-all.xml');

fs.writeFileSync(allOutputFile, allXmlContent, 'utf8');

console.log(`  ✅ Generated: ${path.basename(allOutputFile)}`);
console.log(`  📊 Success: ${totalSuccess}, Errors: ${totalErrors}`);
console.log(`  📦 File size: ${(fs.statSync(allOutputFile).size / 1024 / 1024).toFixed(2)} MB`);

// Generate README with library URLs
console.log('\n\nGenerating library index...');
const sources = Object.keys(iconsBySource).sort();

let readmeContent = `# Cloud Architect Kits - Draw.io Icon Libraries

Generated ${new Date().toISOString().split('T')[0]}

## Libraries by Source

`;

sources.forEach(source => {
  const sanitizedSource = source.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `cloud-architect-${sanitizedSource}.xml`;
  const count = iconsBySource[source].length;
  
  readmeContent += `### ${source} (${count} icons)\n\n`;
  readmeContent += `- **File:** \`${filename}\`\n`;
  readmeContent += `- **Icons:** ${count}\n\n`;
});

readmeContent += `## Combined Library

### All Sources (${icons.length} icons)

- **File:** \`cloud-architect-all.xml\`
- **Icons:** ${icons.length}
- **Note:** This file is large and may take time to load in Draw.io

## How to Use

### Method 1: Load from URL (if hosted)

1. Open Draw.io (https://app.diagrams.net)
2. Go to **File** > **Open Library from** > **URL**
3. Enter the library URL
4. Click **Open**

### Method 2: Load from Local File

1. Download the \`.xml\` file you want to use
2. Open Draw.io (https://app.diagrams.net)
3. Go to **File** > **Open Library from** > **Device**
4. Select the downloaded \`.xml\` file
5. Click **Open**

### Method 3: Load Multiple Libraries

Open Draw.io with multiple libraries pre-loaded:

\`\`\`
https://app.diagrams.net/?splash=0&clibs=U<URL1>;U<URL2>;U<URL3>
\`\`\`

## Library Files

`;

const files = fs.readdirSync(OUTPUT_DIR)
  .filter(f => f.endsWith('.xml'))
  .sort();

files.forEach(file => {
  const stats = fs.statSync(path.join(OUTPUT_DIR, file));
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  readmeContent += `- \`${file}\` (${sizeMB} MB)\n`;
});

readmeContent += `
## Icon Sources

This library includes icons from:

`;

sources.forEach(source => {
  const count = iconsBySource[source].length;
  readmeContent += `- **${source}**: ${count} icons\n`;
});

readmeContent += `
**Total:** ${icons.length} icons

## Notes

- All icons maintain their aspect ratio (aspect="fixed")
- Default size is 64x64 pixels (actual size varies by icon)
- Icons are embedded as base64-encoded SVG data URIs
- Large libraries may take time to load in Draw.io
- Consider using source-specific libraries for better performance

## Related Projects

- [Figma Plugin](../figma/) - Figma version of icon library
- [PowerPoint Add-in](../powerpoint/) - PowerPoint version
- [Google Slides Add-on](../google-slides/) - Google Slides version
- [Prebuild System](../prebuild/) - Unified icon processing
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeContent, 'utf8');

console.log('\n✅ Library generation complete!');
console.log(`📁 Output directory: ${OUTPUT_DIR}`);
console.log(`📚 Generated ${files.length} library files`);
console.log(`📖 Generated README.md`);
