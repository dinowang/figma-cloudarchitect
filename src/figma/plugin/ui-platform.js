// Figma Plugin Platform Script

function handleIconClick(icon) {
  const size = document.getElementById('icon-size').value;
  
  // Decode base64 SVG data
  const svgData = atob(icon.svg);
  
  parent.postMessage({
    pluginMessage: {
      type: 'insert-icon',
      svgData: svgData,
      name: icon.name,
      size: parseInt(size) || 64
    }
  }, '*');
}

window.addEventListener('DOMContentLoaded', () => {
  initializeIcons();
  setupEventListeners();
});
