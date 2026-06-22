class Tooltip {
  constructor() {
    this.el = document.getElementById('tooltip');
    this.title = document.getElementById('tooltip-title');
    this.progress = document.getElementById('tooltip-progress');
    this.isVisible = false;
  }

  show(region, event) {
    if (this.isVisible && this.currentRegion === region.id) {
      this.updatePosition(event);
      return;
    }

    this.currentRegion = region.id;
    this.title.textContent = region.name;
    
    if (region.locked) {
      this.progress.innerHTML = `<span style="color:#ff3232;">Locked</span><br><small>${region.unlockCondition}</small>`;
      this.title.style.color = '#888';
    } else {
      this.progress.textContent = `Progress: ${region.progress}%`;
      this.title.style.color = '#fff';
    }

    this.el.classList.remove('hidden');
    this.isVisible = true;
    this.updatePosition(event);
  }

  updatePosition(event) {
    if (!this.isVisible) return;
    this.el.style.left = `${event.clientX}px`;
    this.el.style.top = `${event.clientY}px`;
  }

  hide() {
    if (!this.isVisible) return;
    this.el.classList.add('hidden');
    this.isVisible = false;
    this.currentRegion = null;
  }
}

window.Tooltip = Tooltip;
