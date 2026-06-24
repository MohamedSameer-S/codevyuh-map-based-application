window.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

window.CAMERA_ANIMATION = {
  introDuration: window.prefersReducedMotion ? 0 : 400,
  zoomDuration: window.prefersReducedMotion ? 0 : 250,
  panDamping: 0.18, // Smoother velocity curve
  clampDuration: window.prefersReducedMotion ? 0 : 220,
  enableIntroAnimation: !window.prefersReducedMotion,
  introDelay: window.prefersReducedMotion ? 0 : 100
};

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
    this.smoothing = window.CAMERA_ANIMATION.panDamping;

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

    // The procedural island generation uses rx * 2.2 which makes the actual visual map massive.
    // Setting these to 16000 and 14000 ensures minScale accounts for the entire shoreline.
    const fullWorldWidth = 16000; 
    const fullWorldHeight = 14000;
    const fitScaleX = viewportWidth / fullWorldWidth;
    const fitScaleY = viewportHeight / (fullWorldHeight * 0.6); 
    // Use Math.min to allow zooming out until the longest dimension fits on screen, with some padding
    this.minScale = Math.min(fitScaleX, fitScaleY) * 0.8;

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
    // Use raw values with translate3d to force GPU hardware acceleration for buttery smooth 60fps
    this.worldGroup.style.transform = `scaleY(0.6) translate3d(${this.translateX.toFixed(2)}px, ${this.translateY.toFixed(2)}px, 0px) scale(${this.scale})`;
  }

  animateCameraTo(x, y, targetScale = 1, duration = window.CAMERA_ANIMATION?.zoomDuration || 250, callback = null) {
    const viewportWidth = this.container.clientWidth;
    const viewportHeight = this.container.clientHeight;

    this.targetScale = targetScale;
    this.targetTx = (viewportWidth / 2) - (x * targetScale);
    this.targetTy = (viewportHeight / 2 / 0.6) - (y * targetScale);
    
    this.clampTargets(false);

    if (duration <= 0) {
      this.scale = this.targetScale;
      this.translateX = this.targetTx;
      this.translateY = this.targetTy;
      if (callback) callback();
      return;
    }

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
    if (!window.CAMERA_ANIMATION.enableIntroAnimation) {
      this.clampTargets(false);
      this.animateCameraTo(window.engineCenterX || 2500, window.engineCenterY || 2000, this.minScale, 0);
      return;
    }

    this.scale = this.targetScale = 0.1;
    this.translateX = this.targetTx = 0;
    this.translateY = this.targetTy = 0;
    this.updateTransform();

    setTimeout(() => {
      // Ensure we have minScale calculated
      this.clampTargets(false);
      // Settle the intro animation on the fully zoomed-out map view
      this.animateCameraTo(window.engineCenterX || 2500, window.engineCenterY || 2000, this.minScale, window.CAMERA_ANIMATION.introDuration);
    }, window.CAMERA_ANIMATION.introDelay);
  }

  reset() {
    this.clampTargets(false);
    // Reset to the same 0.4 default zoom
    this.animateCameraTo(window.engineCenterX || 2500, window.engineCenterY || 2000, 0.4, window.CAMERA_ANIMATION?.zoomDuration || 250);
  }
}

window.CameraController = CameraController;
