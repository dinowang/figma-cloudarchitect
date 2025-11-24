// Figma Plugin Platform Script

function handleIconClick(icon) {
  const size = document.getElementById('icon-size').value;
  parent.postMessage({
    pluginMessage: {
      type: 'insert-icon',
      icon: icon,
      size: parseInt(size) || 64
    }
  }, '*');
}

window.addEventListener('DOMContentLoaded', () => {
  initializeIcons();
  setupEventListeners();
});
