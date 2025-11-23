#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../../dist/drawio-iconlib');

console.log('Validating Draw.io libraries...\n');

if (!fs.existsSync(OUTPUT_DIR)) {
  console.error('❌ Output directory does not exist:', OUTPUT_DIR);
  process.exit(1);
}

const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.xml'));

if (files.length === 0) {
  console.error('❌ No library files found');
  process.exit(1);
}

let allValid = true;

files.forEach(file => {
  const filePath = path.join(OUTPUT_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`Validating ${file}...`);
  
  // Check XML structure
  if (!content.startsWith('<mxlibrary>') || !content.endsWith('</mxlibrary>')) {
    console.error(`  ❌ Invalid XML structure`);
    allValid = false;
    return;
  }
  
  // Extract and parse JSON
  const jsonStr = content.substring(11, content.length - 12);
  
  try {
    const items = JSON.parse(jsonStr);
    
    if (!Array.isArray(items)) {
      console.error(`  ❌ Content is not an array`);
      allValid = false;
      return;
    }
    
    console.log(`  ✅ ${items.length} items`);
    
    // Validate each item
    let validItems = 0;
    let invalidItems = 0;
    
    items.forEach((item, index) => {
      if (!item.data || !item.data.startsWith('data:image/svg+xml;base64,')) {
        console.error(`  ⚠️  Item ${index}: Invalid data URI`);
        invalidItems++;
      } else if (!item.w || !item.h) {
        console.error(`  ⚠️  Item ${index}: Missing dimensions`);
        invalidItems++;
      } else if (!item.title) {
        console.error(`  ⚠️  Item ${index}: Missing title`);
        invalidItems++;
      } else if (item.aspect !== 'fixed') {
        console.error(`  ⚠️  Item ${index}: Invalid aspect (should be "fixed")`);
        invalidItems++;
      } else {
        validItems++;
      }
    });
    
    if (invalidItems > 0) {
      console.log(`  ⚠️  ${invalidItems} invalid items`);
    }
    
    console.log(`  ✅ ${validItems} valid items`);
    
    const stats = fs.statSync(filePath);
    console.log(`  📦 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error(`  ❌ JSON parse error: ${error.message}`);
    allValid = false;
  }
  
  console.log();
});

if (allValid) {
  console.log('✅ All libraries are valid!');
  process.exit(0);
} else {
  console.error('❌ Some libraries have errors');
  process.exit(1);
}
