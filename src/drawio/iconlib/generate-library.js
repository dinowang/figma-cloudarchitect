const fs = require('fs');
const path = require('path');

const prebuildDir = path.resolve(__dirname, '..', '..', 'prebuild');
const iconsJsonPath = path.join(prebuildDir, 'icons.json');
const iconsSrcDir = path.join(prebuildDir, 'icons');
const outDir = path.resolve(__dirname, 'out');

console.log('Generating Draw.io icon libraries...');

// Create out directory
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read icons.json
const icons = JSON.parse(fs.readFileSync(iconsJsonPath, 'utf-8'));

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
  const libraryName = `cloud-architect-${source.toLowerCase().replace(/\s+/g, '-')}`;
  
  let xml = `<mxlibrary>[`;
  
  sourceIcons.forEach((icon, index) => {
    const svgPath = path.join(iconsSrcDir, icon.file);
    if (fs.existsSync(svgPath)) {
      const svgContent = fs.readFileSync(svgPath, 'utf-8')
        .replace(/\n/g, '')
        .replace(/"/g, '\\"');
      
      const entry = {
        xml: svgContent,
        w: 64,
        h: 64,
        title: icon.name,
        aspect: 'fixed'
      };
      
      xml += JSON.stringify(entry);
      if (index < sourceIcons.length - 1) {
        xml += ',';
      }
    }
  });
  
  xml += `]</mxlibrary>`;
  
  const outputPath = path.join(outDir, `${libraryName}.xml`);
  fs.writeFileSync(outputPath, xml);
  console.log(`✓ Generated: ${libraryName}.xml (${sourceIcons.length} icons)`);
});

console.log('Library generation complete!');
