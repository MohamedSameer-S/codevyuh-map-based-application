function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

class CameraController {
  constructor(svg, worldGroup, container) {
    this.svg = svg;
    this.worldGroup = worldGroup;
    this.container = container;

    this.scale = 0.4;
    this.translateX = -500;
    this.translateY = -300;
    
    this.targetScale = this.scale;
    this.targetTx = this.translateX;
    this.targetTy = this.translateY;

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.initialTargetTx = 0;
    this.initialTargetTy = 0;

    this.activeAnimation = null;
    this.smoothing = 0.12;

    this.setupListeners();
    this.startLoop();
  }

  startLoop() {
    const tick = () => {
      if (this.activeAnimation) {
        const now = performance.now();
        const elapsed = now - this.activeAnimation.startTime;
        let progress = elapsed / this.activeAnimation.duration;
        
        if (progress >= 1) {
          progress = 1;
          this.scale = this.targetScale = this.activeAnimation.endScale;
          this.translateX = this.targetTx = this.activeAnimation.endTx;
          this.translateY = this.targetTy = this.activeAnimation.endTy;
          
          if (this.activeAnimation.callback) {
            this.activeAnimation.callback();
          }
          this.activeAnimation = null;
        } else {
          const eased = easeOutCubic(progress);
          this.scale = this.targetScale = lerp(this.activeAnimation.startScale, this.activeAnimation.endScale, eased);
          this.translateX = this.targetTx = lerp(this.activeAnimation.startTx, this.activeAnimation.endTx, eased);
          this.translateY = this.targetTy = lerp(this.activeAnimation.startTy, this.activeAnimation.endTy, eased);
        }
      } else {
        this.scale = lerp(this.scale, this.targetScale, this.smoothing);
        this.translateX = lerp(this.translateX, this.targetTx, this.smoothing);
        this.translateY = lerp(this.translateY, this.targetTy, this.smoothing);
      }
      
      this.updateTransform();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  setBounds(minX, maxX, minY, maxY) {
    this.boundMinX = minX;
    this.boundMaxX = maxX;
    this.boundMinY = minY;
    this.boundMaxY = maxY;
    this.clampTargets();
  }

  clampTargets(isUserGesture = false) {
    if (this.boundMinX === undefined) return;

    const viewportWidth = this.container.clientWidth;
    const viewportHeight = this.container.clientHeight;

    const fullWorldWidth = 5000;
    const fullWorldHeight = 4000;
    const fitScaleX = viewportWidth / fullWorldWidth;
    const fitScaleY = viewportHeight / (fullWorldHeight * 0.6); 
    this.minScale = Math.max(fitScaleX, fitScaleY) * 1.05;

    this.targetScale = Math.max(this.minScale, Math.min(this.targetScale, 2.5));

    const rawMinTx = viewportWidth - (this.boundMaxX * this.targetScale);
    const rawMaxTx = - (this.boundMinX * this.targetScale);
    const rawMinTy = (viewportHeight / 0.6) - (this.boundMaxY * this.targetScale);
    const rawMaxTy = - (this.boundMinY * this.targetScale);

    let minTx = Math.min(rawMinTx, rawMaxTx);
    let maxTx = Math.max(rawMinTx, rawMaxTx);
    if (rawMinTx > rawMaxTx) {
      const centerTx = (rawMinTx + rawMaxTx) / 2;
      minTx = centerTx; maxTx = centerTx;
    }

    let minTy = Math.min(rawMinTy, rawMaxTy);
    let maxTy = Math.max(rawMinTy, rawMaxTy);
    if (rawMinTy > rawMaxTy) {
      const centerTy = (rawMinTy + rawMaxTy) / 2;
      minTy = centerTy; maxTy = centerTy;
    }

    if (maxTx - minTx < 60) {
      const centerTx = (minTx + maxTx) / 2;
      minTx = centerTx - 30; maxTx = centerTx + 30;
    }
    if (maxTy - minTy < 60) {
      const centerTy = (minTy + maxTy) / 2;
      minTy = centerTy - 30; maxTy = centerTy + 30;
    }

    let hitBoundary = false;

    if (isUserGesture) {
      if (this.targetTx < minTx) { this.targetTx = minTx + (this.targetTx - minTx) * 0.2; hitBoundary = true; }
      if (this.targetTx > maxTx) { this.targetTx = maxTx + (this.targetTx - maxTx) * 0.2; hitBoundary = true; }
      if (this.targetTy < minTy) { this.targetTy = minTy + (this.targetTy - minTy) * 0.2; hitBoundary = true; }
      if (this.targetTy > maxTy) { this.targetTy = maxTy + (this.targetTy - maxTy) * 0.2; hitBoundary = true; }
    } else {
      if (this.targetTx < minTx) { this.targetTx = minTx; hitBoundary = true; }
      if (this.targetTx > maxTx) { this.targetTx = maxTx; hitBoundary = true; }
      if (this.targetTy < minTy) { this.targetTy = minTy; hitBoundary = true; }
      if (this.targetTy > maxTy) { this.targetTy = maxTy; hitBoundary = true; }
    }

    if (hitBoundary && isUserGesture && window.showLockedMessage) {
       window.showLockedMessage();
    }
  }

  setupListeners() {
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('#ui-layer')) return;
      
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.initialTargetTx = this.targetTx;
      this.initialTargetTy = this.targetTy;
      
      this.activeAnimation = null;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const dx = (e.clientX - this.startX);
      const dy = (e.clientY - this.startY) / 0.6;
      
      this.targetTx = this.initialTargetTx + dx;
      this.targetTy = this.initialTargetTy + dy;
      
      this.clampTargets(true);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.clampTargets(false);
      }
    });

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      this.activeAnimation = null;
      let isPanning = false;

      if (e.ctrlKey) {
        const zoomDelta = -e.deltaY * 0.01;
        const zoomFactor = Math.exp(zoomDelta);
        
        let newScale = this.targetScale * zoomFactor;
        newScale = Math.max(0.1, Math.min(newScale, 2.0));

        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleRatio = newScale / this.targetScale;
        this.targetTx = mouseX - (mouseX - this.targetTx) * scaleRatio;
        
        const unmappedMouseY = mouseY / 0.6;
        this.targetTy = unmappedMouseY - (unmappedMouseY - this.targetTy) * scaleRatio;
        
        this.targetScale = newScale;
      } else {
        this.targetTx -= e.deltaX;
        this.targetTy -= e.deltaY / 0.6;
        isPanning = true;
      }
      
      this.clampTargets(isPanning);
    }, { passive: false });

    window.addEventListener('resize', () => {
      this.clampTargets(false);
    });
  }

  updateTransform() {
    this.worldGroup.style.willChange = 'transform';
    // Math.round limits sub-pixel thrashing which causes massive lag in SVG recalculation
    // Using translate instead of translate3d prevents hardware-compositing bugs on massive SVG groups
    const tx = Math.round(this.translateX * 10) / 10;
    const ty = Math.round(this.translateY * 10) / 10;
    this.worldGroup.style.transform = `scaleY(0.6) translate(${tx}px, ${ty}px) scale(${this.scale})`;
  }

  animateCameraTo(x, y, targetScale = 1, duration = 900, callback = null) {
    const viewportWidth = this.container.clientWidth;
    const viewportHeight = this.container.clientHeight;

    this.targetScale = targetScale;
    this.targetTx = (viewportWidth / 2) - (x * targetScale);
    this.targetTy = (viewportHeight / 2 / 0.6) - (y * targetScale);
    
    this.clampTargets(false);

    this.activeAnimation = {
      startTime: performance.now(),
      duration: duration,
      startScale: this.scale,
      startTx: this.translateX,
      startTy: this.translateY,
      endScale: this.targetScale,
      endTx: this.targetTx,
      endTy: this.targetTy,
      callback: callback
    };
  }

  startIntroAnimation() {
    this.scale = this.targetScale = 0.2;
    this.translateX = this.targetTx = 0;
    this.translateY = this.targetTy = 0;
    this.updateTransform();

    setTimeout(() => {
      this.animateCameraTo(window.engineCenterX || 2500, window.engineCenterY || 2000, 0.4, 1500);
    }, 500);
  }

  reset() {
    this.animateCameraTo(window.engineCenterX || 2500, window.engineCenterY || 2000, 0.4, 900);
  }
}

window.CameraController = CameraController;
