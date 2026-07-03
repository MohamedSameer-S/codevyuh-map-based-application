import SVGRenderer from './SVGRenderer';
import CameraController from './CameraController';
import TerrainGenerator from './TerrainGenerator';
import LandmarkManager from './LandmarkManager';
import FogManager from './FogManager';
import RegionManager from './RegionManager';
import CodeVyuhRegions from '../config/regions.config';

export default class WorldEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    // 1. Dynamic Bounding Box Engine
    let minX = 1500, maxX = 4100, minY = 1200, maxY = 3400; // Frozen original bounds
    const regionsConfig = CodeVyuhRegions || [];
    
    if (regionsConfig.length > 0) {
      // Intentionally bypassed dynamic bound generation to lock the map size perfectly.
      // Regions can now be freely repositioned outward without enlarging the world.
    } else {
      // Fallback if no regions exist
      minX = 2000; maxX = 3000; minY = 2000; maxY = 3000;
    }

    // Add generous padding around the outermost regions
    const paddingX = 1500;
    const paddingY = 1500;
    
    this.bounds = {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY
    };

    // Width and height of the theoretical world canvas
    this.width = this.bounds.maxX - this.bounds.minX;
    this.height = this.bounds.maxY - this.bounds.minY;

    // Center point of the entire region cluster
    this.centerX = minX + (maxX - minX) / 2;
    this.centerY = minY + (maxY - minY) / 2;
    window.engineCenterX = this.centerX;
    window.engineCenterY = this.centerY;

    // Initialize subsystems
    this.renderer = new SVGRenderer(this.container, this.width, this.height);
    this.camera = new CameraController(this.renderer.svg, this.renderer.worldGroup, this.container);
    this.terrain = new TerrainGenerator(this.renderer, this.bounds, this.centerX, this.centerY);
    this.landmarks = new LandmarkManager(this.renderer);
    this.fog = new FogManager(this.renderer);
    this.ui = {
      tooltip: { 
        show: (region, e) => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('showTooltip', {detail: {region, x: e?.clientX || 0, y: e?.clientY || 0}})) }, 
        hide: () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('hideTooltip')) } 
      },
      regionView: { 
        show: (region) => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('showRegionView', {detail: {region}})) }, 
        hide: () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('hideRegionView')) } 
      }
    };
    this.regions = new RegionManager(this, regionsConfig);
  }

  init() {
    console.log("Initializing WorldEngine...");
    
    // Create global queue for depth-sensitive objects (Z-Sorting)
    this.renderQueue = [];

    // 1. Generate base terrain (Ocean is default SVG background)
    this.terrain.generateBaseLandmass(this.renderQueue);
    
    // 2. Generate regions and paths
    this.regions.generateRegions();
    
    // 3. Generate landmarks for each region
    this.regions.regions.forEach(region => {
      this.landmarks.generateLandmark(region, this.renderQueue);
    });

    // 4. Sort all depth-sensitive items by Y-coordinate and render them
    this.renderQueue.sort((a, b) => a.y - b.y);
    this.renderQueue.forEach(item => {
      this.renderer.getLayer('terrain').appendChild(item.element);
    });

    // 5. Generate Fog of War
    this.fog.generateFog(this.width, this.height, this.regions.regions);

    // 6. Setup event listeners
    this.setupEvents();

    // 7. Calculate playable area boundary based on unlocked regions
    this.updateCameraBounds();

    // 8. Intro animation
    this.camera.startIntroAnimation();
  }

  setupEvents() {
    this.regions.on('regionHover', (region, e) => {
      this.ui.tooltip.show(region, e);
    });

    this.regions.on('regionOut', () => {
      this.ui.tooltip.hide();
    });

    this.regions.on('regionClick', (region) => {
      this.ui.tooltip.hide();
      window.focusRegion(region.id);
    });
  }

  resetView() {
    this.camera.reset();
  }

  updateCameraBounds() {
    // Restrict panning strictly to the bounding box of UNLOCKED regions
    // This creates an "invisible wall" that triggers the error popup if the user drags into the dark locked areas
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let hasUnlocked = false;

    this.regions.regions.forEach(r => {
      if (!r.locked) {
        hasUnlocked = true;
        if (r.x < minX) minX = r.x;
        if (r.x > maxX) maxX = r.x;
        if (r.y < minY) minY = r.y;
        if (r.y > maxY) maxY = r.y;
      }
    });

    if (!hasUnlocked) {
      minX = 2000; maxX = 3000; minY = 1500; maxY = 2500; // Fallback
    }

    // Add 600px padding so the user can comfortably see around the unlocked regions
    // Remove the hardcoded 0 to 5000 limits because regions exist at negative coordinates
    minX = minX - 600;
    maxX = maxX + 600;
    minY = minY - 600;
    maxY = maxY + 600;

    this.camera.setBounds(minX, maxX, minY, maxY);
  }
}

// Global functions as requested for external or internal use
if (typeof window !== 'undefined') {
window.animateCameraTo = (targetX, targetY, targetScale, duration = window.CAMERA_ANIMATION?.zoomDuration || 250) => {
  const engine = window.worldEngineInstance;
  if (!engine) return Promise.resolve();

  return new Promise((resolve) => {
    engine.camera.animateCameraTo(targetX, targetY, targetScale, duration, () => {
      resolve();
    });
  });
};

window.getRegionBounds = (regionId) => {
  const engine = window.worldEngineInstance;
  if (!engine) return null;
  return engine.regions.regions.find(r => r.id === regionId);
};

window.openRegionModal = (regionId) => {
  const engine = window.worldEngineInstance;
  if (!engine) return;
  const region = window.getRegionBounds(regionId);
  if (region) {
    engine.ui.regionView.show(region);
  }
};

window.closeRegionModal = () => {
  const engine = window.worldEngineInstance;
  if (!engine) return;
  
  // Close the popup smoothly, then wait slightly before zooming out
  engine.ui.regionView.hide();
  setTimeout(() => {
    window.resetWorldView();
  }, 100);
};

window.resetWorldView = () => {
  const engine = window.worldEngineInstance;
  if (engine) {
    // Animate to the dynamic minScale so the entire island perfectly fits on the screen again
    engine.camera.animateCameraTo(
      window.engineCenterX || 2500, 
      window.engineCenterY || 2000, 
      engine.camera.minScale, 
      window.CAMERA_ANIMATION?.zoomDuration || 250
    );
  }
};

window.focusRegion = (regionId) => {
  const region = window.getRegionBounds(regionId);
  if (region) {
    // Reduced scale to match the comfortable zoom level requested by user
    const maxDim = Math.max(region.width, region.height);
    const targetScale = maxDim > 900 ? 0.8 : 0.95;
    
    window.animateCameraTo(region.x, region.y, targetScale, window.CAMERA_ANIMATION?.zoomDuration || 250).then(() => {
      window.openRegionModal(regionId);
    });
  }
};



window.showLockedMessage = () => {
  const now = Date.now();
  // Throttle toasts to avoid spamming while dragging
  if (window.lastToastTime && now - window.lastToastTime < 2000) return;
  window.lastToastTime = now;

  const messages = [
    "Complete this stage to unlock the next region",
    "This region is still locked",
    "Finish your current quest first",
    "Complete Logic Dominion to move forward",
    "New territory unlocks after this stage"
  ];
  
  const toast = document.getElementById('locked-toast');
  const msgElement = document.getElementById('locked-toast-msg');
  
  if (toast && msgElement) {
    msgElement.textContent = messages[Math.floor(Math.random() * messages.length)];
    
    // Add the "show" class to trigger the CSS animation
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500); // 2.5 seconds before fading out
  }
};

// Global unlock function for simulation/backend connection
window.completeCurrentStage = () => {
  const engine = window.worldEngineInstance; // Assumes app.js sets this
  if (!engine) return;

  const nextRegion = engine.regions.regions.find(r => r.locked);
  if (nextRegion) {
    nextRegion.locked = false;
    
    // Remove the localized fog cloud
    const cloud = document.getElementById(`fog-cloud-anim-${nextRegion.id}`);
    if (cloud) {
       cloud.parentNode.removeChild(cloud);
    }
    
    // Restore real name
    const landmarkGrp = document.getElementById(`landmark-${nextRegion.id}`);
    if (landmarkGrp) {
       const textNode = landmarkGrp.querySelector('text');
       if (textNode) {
          textNode.textContent = nextRegion.name;
          textNode.setAttribute('opacity', '1');
       }
    }

    engine.updateCameraBounds();
    engine.camera.flyTo(nextRegion.x, nextRegion.y, 1.2);
    
    const toast = document.getElementById('locked-toast');
    const msg = document.getElementById('locked-toast-msg');
    msg.textContent = `${nextRegion.name} Unlocked!`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  } else {
    const toast = document.getElementById('locked-toast');
    const msg = document.getElementById('locked-toast-msg');
    msg.textContent = `All regions are already unlocked!`;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 500);
    }, 2000);
  }
};
}
