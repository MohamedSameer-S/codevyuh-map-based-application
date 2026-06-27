window.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

window.CAMERA_ANIMATION = {
  introDuration: window.prefersReducedMotion ? 0 : 800,
  zoomDuration: window.prefersReducedMotion ? 0 : 250,
  panDamping: 0.35, 
  clampDuration: window.prefersReducedMotion ? 0 : 220,
  enableIntroAnimation: !window.prefersReducedMotion,
  introDelay: window.prefersReducedMotion ? 0 : 150
};

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
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

    // Inertia state
    this.velocityX = 0;
    this.velocityY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.lastTime = 0;

    // Zoom state
    this.zoomFocalX = 0;
    this.zoomFocalY = 0;

    // Touch pinch state
    this.isPinching = false;
    this.initialPinchDistance = 0;
    this.initialPinchScale = 1;

    this.activeAnimation = null;
    this.smoothing = window.CAMERA_ANIMATION.panDamping;

    // Cache dimensions to prevent Layout Thrashing (which causes lag)
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.containerRect = null;

    // Trackpad vs Mouse detection (frequency-based)
    this._lastWheelTime = 0;
    this._wheelEventCount = 0;
    this._isTrackpadUser = false;
    this._trackpadResetTimer = null;

    this.updateDimensions();
    this.setupListeners();
    this.startLoop();
  }

  updateDimensions() {
    if (!this.container) return;
    this.viewportWidth = this.container.clientWidth;
    this.viewportHeight = this.container.clientHeight;
    this.containerRect = this.container.getBoundingClientRect();
  }

  startLoop() {
    let lastTime = performance.now();
    
    const tick = (time) => {
      // Calculate delta time to make animations framerate-independent (perfectly smooth on any monitor)
      const now = time || performance.now();
      let dt = now - lastTime;
      if (dt > 50) dt = 16.666; // Prevent massive jumps if tab was inactive
      lastTime = now;
      
      // Calculate a time scale factor (1.0 at 60fps)
      const timeScale = dt / 16.666;

      if (this.activeAnimation) {
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
          const eased = easeOutExpo(progress);
          this.scale = this.targetScale = lerp(this.activeAnimation.startScale, this.activeAnimation.endScale, eased);
          this.translateX = this.targetTx = lerp(this.activeAnimation.startTx, this.activeAnimation.endTx, eased);
          this.translateY = this.targetTy = lerp(this.activeAnimation.startTy, this.activeAnimation.endTy, eased);
        }
      } else {
        // 1. Inertia coasting for panning (framerate independent decay)
        if (!this.isDragging && !this.isPinching) {
          if (Math.abs(this.velocityX) > 0.05 || Math.abs(this.velocityY) > 0.05) {
            this.targetTx += this.velocityX * timeScale;
            this.targetTy += this.velocityY * timeScale;
            // 0.92 per frame at 60fps -> Math.pow(0.92, timeScale)
            const friction = Math.pow(0.92, timeScale);
            this.velocityX *= friction;
            this.velocityY *= friction;
          } else {
            this.velocityX = 0;
            this.velocityY = 0;
          }
        }

        // 2. Smooth zoom interpolation with strict focal point locking
        if (Math.abs(this.targetScale - this.scale) > 0.0001) {
          const oldScale = this.scale;
          
          // Framerate-independent exponential decay for zooming
          // 0.12 per frame at 60fps
          const zoomLerpFactor = 1 - Math.pow(1 - 0.12, timeScale);
          this.scale = lerp(this.scale, this.targetScale, zoomLerpFactor); 
          
          const scaleRatio = this.scale / oldScale;
          
          // Shift targetTx and targetTy to mathematically lock the focal point under cursor
          this.targetTx = this.zoomFocalX - (this.zoomFocalX - this.targetTx) * scaleRatio;
          this.targetTy = this.zoomFocalY - (this.zoomFocalY - this.targetTy) * scaleRatio;
          
          // Shift the current translation instantly to eliminate any visual drift/lag
          this.translateX = this.zoomFocalX - (this.zoomFocalX - this.translateX) * scaleRatio;
          this.translateY = this.zoomFocalY - (this.zoomFocalY - this.translateY) * scaleRatio;
        } else {
          this.scale = this.targetScale;
        }

        // 3. Smooth pan following (framerate independent)
        const panLerpFactor = 1 - Math.pow(1 - this.smoothing, timeScale);
        this.translateX = lerp(this.translateX, this.targetTx, panLerpFactor);
        this.translateY = lerp(this.translateY, this.targetTy, panLerpFactor);
        
        // Bounds are enforced in the wheel and pan event handlers directly.
        // Do NOT call clampTargets here — it fights the focal-point zoom and drags the map to center.
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

    const viewportWidth = this.viewportWidth;
    const viewportHeight = this.viewportHeight;

    const fullWorldWidth = 16000; 
    const fullWorldHeight = 14000;
    const fitScaleX = viewportWidth / fullWorldWidth;
    const fitScaleY = viewportHeight / (fullWorldHeight * 0.6); 
    this.minScale = Math.min(fitScaleX, fitScaleY) * 0.8;

    // Clamp scale
    const clampedScale = Math.max(this.minScale, Math.min(this.targetScale, 2.5));
    if (clampedScale !== this.targetScale) {
      this.targetScale = clampedScale;
      this.scale = clampedScale;
    }

    const s = this.targetScale;
    const rawMinTx = viewportWidth - (this.boundMaxX * s);
    const rawMaxTx = -(this.boundMinX * s);
    const rawMinTy = (viewportHeight / 0.6) - (this.boundMaxY * s);
    const rawMaxTy = -(this.boundMinY * s);

    let minTx, maxTx, minTy, maxTy;

    // If the entire world fits within the viewport at this zoom, allow free positioning
    // instead of force-centering (which was stealing the focal point)
    if (rawMinTx > rawMaxTx) {
      // World is narrower than viewport — give generous freedom
      minTx = rawMaxTx - 200;
      maxTx = rawMinTx + 200;
    } else {
      minTx = rawMinTx;
      maxTx = rawMaxTx;
    }

    if (rawMinTy > rawMaxTy) {
      minTy = rawMaxTy - 200;
      maxTy = rawMinTy + 200;
    } else {
      minTy = rawMinTy;
      maxTy = rawMaxTy;
    }

    let hitBoundary = false;

    if (isUserGesture) {
      // Elastic rubber-band
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

    // CRITICAL: Also sync translateX/Y so instant-apply zooms don't get dragged back
    if (hitBoundary) {
      this.translateX = this.targetTx;
      this.translateY = this.targetTy;
    }

    if (hitBoundary && isUserGesture && window.showLockedMessage) {
       window.showLockedMessage();
    }
  }

  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getCenter(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  setupListeners() {
    window.addEventListener('mousemove', (e) => {
      if (this.containerRect) {
        this.zoomFocalX = e.clientX - this.containerRect.left;
        // The transform is: scaleY(0.6) translate3d(tx,ty,0) scale(s)
        // scaleY(0.6) squashes the rendered output, so to find where the cursor
        // maps in the pre-scaleY translate space, we divide by 0.6
        this.zoomFocalY = (e.clientY - this.containerRect.top) / 0.6;
      }
    });

    window.addEventListener('resize', () => {
      this.updateDimensions();
      this.clampTargets(false);
    });
    
    window.addEventListener('scroll', () => {
      this.updateDimensions();
    });

    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('#ui-layer')) return;
      
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastTime = performance.now();
      this.initialTargetTx = this.targetTx;
      this.initialTargetTy = this.targetTy;
      this.velocityX = 0;
      this.velocityY = 0;
      
      this.activeAnimation = null;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const dx = (e.clientX - this.startX);
      const dy = (e.clientY - this.startY) / 0.6;
      
      this.targetTx = this.initialTargetTx + dx;
      this.targetTy = this.initialTargetTy + dy;
      
      const now = performance.now();
      const dt = now - this.lastTime;
      if (dt > 0) {
        const timeScale = 16.666 / dt;
        this.velocityX = (e.clientX - this.lastX) * timeScale;
        this.velocityY = ((e.clientY - this.lastY) / 0.6) * timeScale;
      }
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastTime = now;

      this.clampTargets(true);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
      }
    });

    this.container.addEventListener('touchstart', (e) => {
      if (e.target.closest('#ui-layer')) return;
      
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.isPinching = false;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;
        this.lastTime = performance.now();
        this.initialTargetTx = this.targetTx;
        this.initialTargetTy = this.targetTy;
        this.velocityX = 0;
        this.velocityY = 0;
      } else if (e.touches.length === 2) {
        this.isPinching = true;
        this.isDragging = false;
        this.initialPinchDistance = this.getDistance(e.touches[0], e.touches[1]);
        this.initialPinchScale = this.targetScale;
        
        const center = this.getCenter(e.touches[0], e.touches[1]);
        this.startX = center.x;
        this.startY = center.y;
        this.initialTargetTx = this.targetTx;
        this.initialTargetTy = this.targetTy;
      }
      this.activeAnimation = null;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = (e.touches[0].clientX - this.startX);
        const dy = (e.touches[0].clientY - this.startY) / 0.6;
        
        this.targetTx = this.initialTargetTx + dx;
        this.targetTy = this.initialTargetTy + dy;
        
        const now = performance.now();
        const dt = now - this.lastTime;
        if (dt > 0) {
          const timeScale = 16.666 / dt;
          this.velocityX = (e.touches[0].clientX - this.lastX) * timeScale;
          this.velocityY = ((e.touches[0].clientY - this.lastY) / 0.6) * timeScale;
        }
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;
        this.lastTime = now;
        
        this.clampTargets(true);
      } else if (e.touches.length === 2 && this.isPinching) {
        e.preventDefault(); 
        
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const center = this.getCenter(e.touches[0], e.touches[1]);
        
        const zoomFactor = currentDistance / this.initialPinchDistance;
        let newScale = this.initialPinchScale * zoomFactor;
        
        const fullWorldWidth = 16000; 
        const fullWorldHeight = 14000;
        const fitScaleX = this.viewportWidth / fullWorldWidth;
        const fitScaleY = this.viewportHeight / (fullWorldHeight * 0.6); 
        const tempMinScale = Math.min(fitScaleX, fitScaleY) * 0.8;
        
        newScale = Math.max(tempMinScale, Math.min(newScale, 2.5));
        
        const mouseX = center.x - (this.containerRect ? this.containerRect.left : 0);
        const mouseY = center.y - (this.containerRect ? this.containerRect.top : 0);
        const unmappedMouseY = mouseY / 0.6;

        const scaleRatio = newScale / this.scale;
        
        this.targetTx = mouseX - (mouseX - this.targetTx) * scaleRatio;
        this.targetTy = unmappedMouseY - (unmappedMouseY - this.targetTy) * scaleRatio;
        
        this.targetScale = newScale;
        this.scale = this.targetScale;
        this.translateX = this.targetTx;
        this.translateY = this.targetTy;
        
        this.clampTargets(true);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        this.isDragging = false;
        this.isPinching = false;
      } else if (e.touches.length === 1) {
        this.isPinching = false;
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;
        this.initialTargetTx = this.targetTx;
        this.initialTargetTy = this.targetTy;
        this.velocityX = 0;
        this.velocityY = 0;
      }
    });

    // --- WHEEL / TRACKPAD ---
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      this.activeAnimation = null;

      // Update focal point fresh from this exact event
      if (this.containerRect) {
        this.zoomFocalX = e.clientX - this.containerRect.left;
        this.zoomFocalY = (e.clientY - this.containerRect.top) / 0.6;
      }

      // --- INSTANT INPUT DETECTION (no warm-up needed) ---
      // On Windows, physical mouse wheels ALWAYS produce:
      //   deltaY = exact multiple of 100 (Chrome/Edge) or 120 (Firefox)
      //   deltaX = 0
      // Trackpads produce irregular deltaY values and often have deltaX.
      const isMouseWheel = !e.ctrlKey && 
        e.deltaX === 0 && 
        e.deltaY !== 0 &&
        Number.isInteger(e.deltaY) && 
        (e.deltaY % 100 === 0 || e.deltaY % 120 === 0);

      if (e.ctrlKey) {
        // --- TRACKPAD PINCH: ZOOM ---
        const zoomDelta = -e.deltaY * 0.008;
        const zoomFactor = Math.exp(zoomDelta);
        
        let newScale = this.targetScale * zoomFactor;
        const fitScaleX = this.viewportWidth / 16000;
        const fitScaleY = this.viewportHeight / (14000 * 0.6); 
        const tempMinScale = Math.min(fitScaleX, fitScaleY) * 0.8;
        newScale = Math.max(tempMinScale, Math.min(newScale, 2.5));

        const scaleRatio = newScale / this.scale;
        const newTx = this.zoomFocalX - (this.zoomFocalX - this.translateX) * scaleRatio;
        const newTy = this.zoomFocalY - (this.zoomFocalY - this.translateY) * scaleRatio;
        
        this.scale = this.targetScale = newScale;
        this.translateX = this.targetTx = newTx;
        this.translateY = this.targetTy = newTy;

      } else if (isMouseWheel) {
        // --- MOUSE WHEEL: ZOOM ---
        const speed = Math.abs(e.deltaY);
        const speedBoost = 1 + Math.log2(1 + speed / 30) * 0.4;
        const zoomDelta = -e.deltaY * 0.0006 * speedBoost;
        const zoomFactor = Math.exp(zoomDelta);
        
        let newScale = this.targetScale * zoomFactor;
        const fitScaleX = this.viewportWidth / 16000;
        const fitScaleY = this.viewportHeight / (14000 * 0.6); 
        const tempMinScale = Math.min(fitScaleX, fitScaleY) * 0.8;
        newScale = Math.max(tempMinScale, Math.min(newScale, 2.5));

        const scaleRatio = newScale / this.scale;
        const newTx = this.zoomFocalX - (this.zoomFocalX - this.translateX) * scaleRatio;
        const newTy = this.zoomFocalY - (this.zoomFocalY - this.translateY) * scaleRatio;
        
        this.scale = this.targetScale = newScale;
        this.translateX = this.targetTx = newTx;
        this.translateY = this.targetTy = newTy;

      } else {
        // --- TRACKPAD TWO-FINGER SWIPE: PAN in all 4 directions ---
        const panSpeed = 1.5;
        this.targetTx -= e.deltaX * panSpeed;
        this.targetTy -= (e.deltaY * panSpeed) / 0.6;
        this.translateX = this.targetTx;
        this.translateY = this.targetTy;
      }
    }, { passive: false });
  }

  updateTransform() {
    this.worldGroup.style.willChange = 'transform';
    this.worldGroup.style.transform = `scaleY(0.6) translate3d(${this.translateX.toFixed(2)}px, ${this.translateY.toFixed(2)}px, 0px) scale(${this.scale})`;
  }

  animateCameraTo(x, y, targetScale = 1, duration = window.CAMERA_ANIMATION?.zoomDuration || 250, callback = null) {
    const viewportWidth = this.viewportWidth;
    const viewportHeight = this.viewportHeight;

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

    const targetX = window.engineCenterX || 2500;
    const targetY = window.engineCenterY || 2000;

    // 1. INSTANTLY set the scale to its final, correct value. 
    // This completely eliminates any "zooming in or zooming out" effect.
    this.scale = this.targetScale = this.minScale;
    
    // 2. Start the camera slightly below the target center to create a "sliding up" effect
    this.translateX = this.targetTx = (this.viewportWidth / 2) - (targetX * this.minScale);
    this.translateY = this.targetTy = (this.viewportHeight / 2 / 0.6) - ((targetY + 800) * this.minScale);
    this.updateTransform();

    // 3. Smoothly PAN (no zoom) to the exact center instantly
    // Removed the 50ms delay so it starts immediately. 
    // Reduced duration from 600ms to 350ms for a very snappy, fast load.
    requestAnimationFrame(() => {
      this.clampTargets(false);
      this.animateCameraTo(
        targetX, 
        targetY, 
        this.minScale, 
        350 
      );
    });
  }

  reset() {
    this.clampTargets(false);
    this.animateCameraTo(window.engineCenterX || 2500, window.engineCenterY || 2000, 0.4, window.CAMERA_ANIMATION?.zoomDuration || 250);
  }
}

window.CameraController = CameraController;
