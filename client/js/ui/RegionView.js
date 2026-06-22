class RegionView {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('region-view');
    this.title = document.getElementById('region-view-title');
    this.progress = document.getElementById('region-view-progress');
    
    this.btnBack = document.getElementById('btn-back-world');
    this.btnEnter = document.getElementById('btn-enter-region');

    this.setupListeners();
  }

  setupListeners() {
    this.btnBack.addEventListener('click', () => {
      window.closeRegionModal();
    });

    this.btnEnter.addEventListener('click', () => {
      // In a real app, this would route to the track page
      console.log(`Entering region: ${this.currentRegion.name}`);
      alert(`Navigating to ${this.currentRegion.name} track... (To be implemented)`);
    });
  }

  show(region) {
    this.currentRegion = region;
    this.title.textContent = region.name;
    
    // Set theme color for title
    let themeColor = '#00ffcc';
    if(region.theme === 'debug') themeColor = '#ff3232';
    if(region.theme === 'systems') themeColor = '#3296ff';
    if(region.theme === 'python') themeColor = '#ffc832';
    
    this.title.style.background = `linear-gradient(90deg, ${themeColor}, #fff)`;
    this.title.style.webkitBackgroundClip = 'text';

    if (region.locked) {
      this.progress.textContent = `Locked - ${region.unlockCondition}`;
      this.btnEnter.disabled = true;
      this.btnEnter.style.opacity = '0.5';
      this.btnEnter.style.cursor = 'not-allowed';
    } else {
      this.progress.textContent = `Overall Progress: ${region.progress}%`;
      this.btnEnter.disabled = false;
      this.btnEnter.style.opacity = '1';
      this.btnEnter.style.cursor = 'pointer';
    }

    this.el.classList.remove('hidden');
  }

  hide() {
    this.el.classList.add('hidden');
    this.currentRegion = null;
  }
}

window.RegionView = RegionView;
