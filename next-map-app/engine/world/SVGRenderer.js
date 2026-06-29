export default class SVGRenderer {
  constructor(container, width, height) {
    this.container = container;
    this.width = width;
    this.height = height;
    
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("id", "world-svg");
    // Removed viewBox to allow 1:1 pixel mapping for the CameraController
    this.svg.style.width = "100%";
    this.svg.style.height = "100%";
    
    this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this.svg.appendChild(this.defs);
    
    this.setupFilters();

    // The main group that gets transformed (panned/zoomed)
    this.worldGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.worldGroup.setAttribute("id", "world-group");
    
    // Apply a 2.5D pseudo-isometric transformation to the base map elements.
    // We will counter-transform landmarks and texts so they stand upright.
    // this.worldGroup.style.transform = "rotateX(50deg) rotateZ(-30deg)";
    // ACTUALLY: Let's keep it simple. We can achieve 2.5D by drawing things in an isometric style 
    // or by applying the transform to the wrapper. Let's start with a flat map and apply CSS perspective if needed, 
    // or just draw 2.5D shapes. Given the constraints, 2.5D shapes/shadows work best.

    this.layers = {
      ocean: this.createGroup("layer-ocean"),
      landmass: this.createGroup("layer-landmass"),
      rivers: this.createGroup("layer-rivers"),
      roads: this.createGroup("layer-roads"),
      bridges: this.createGroup("layer-bridges"),
      regions: this.createGroup("layer-regions"),
      terrain: this.createGroup("layer-terrain"),
      environmentDetails: this.createGroup("layer-environment-details"),
      landmarks: this.createGroup("layer-landmarks"),
      fog: this.createGroup("layer-fog"),
      interaction: this.createGroup("layer-interaction")
    };

    // Append layers in exact order for Z-indexing
    Object.values(this.layers).forEach(layer => {
      this.worldGroup.appendChild(layer);
    });

    this.svg.appendChild(this.worldGroup);
    this.container.appendChild(this.svg);
  }

  createGroup(id) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", id);
    return g;
  }

  getLayer(name) {
    return this.layers[name];
  }

  setupFilters() {
    // Drop shadow filter for terrain/landmarks
    this.defs.innerHTML += `
      <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="15" stdDeviation="10" flood-color="#000000" flood-opacity="0.4"/>
      </filter>
      
      <filter id="landmark-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="-10" dy="20" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
      </filter>

      <!-- Organic Ocean Pattern/Gradient -->
      <radialGradient id="ocean-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#3b8eb5" />
        <stop offset="100%" stop-color="#1a4b6b" />
      </radialGradient>

      <!-- Terrain Gradients -->
      <linearGradient id="plains-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#8bc34a" />
        <stop offset="100%" stop-color="#558b2f" />
      </linearGradient>

      <linearGradient id="rocky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#78909c" />
        <stop offset="100%" stop-color="#455a64" />
      </linearGradient>

      <linearGradient id="coastal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#aed581" />
        <stop offset="100%" stop-color="#689f38" />
      </linearGradient>

      <linearGradient id="jungle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#33691e" />
        <stop offset="100%" stop-color="#1b5e20" />
      </linearGradient>

      <linearGradient id="mountain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#cfd8dc" />
        <stop offset="50%" stop-color="#90a4ae" />
        <stop offset="100%" stop-color="#546e7a" />
      </linearGradient>
      <!-- Civilization Zone Gradients -->
      <radialGradient id="logic-zone-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#aed581" stop-opacity="0.8" />
        <stop offset="70%" stop-color="#8bc34a" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#8bc34a" stop-opacity="0" />
      </radialGradient>
      
      <radialGradient id="debug-zone-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#5c5470" stop-opacity="0.6" />
        <stop offset="70%" stop-color="#453c5c" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#352f44" stop-opacity="0" />
      </radialGradient>

      <radialGradient id="systems-zone-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#8d6e63" stop-opacity="0.7" />
        <stop offset="70%" stop-color="#6d4c41" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#5d4037" stop-opacity="0" />
      </radialGradient>

      <radialGradient id="python-zone-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#33691e" stop-opacity="0.8" />
        <stop offset="70%" stop-color="#1b5e20" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#1b5e20" stop-opacity="0" />
      </radialGradient>
      
      <!-- Fog Filter with Animation -->
      <filter id="fog-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="noise">
          <animate attributeName="baseFrequency" values="0.015;0.012;0.015" dur="20s" repeatCount="indefinite" />
        </feTurbulence>
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" in="noise" result="coloredNoise" />
        <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
      </filter>
    `;
  }
}

