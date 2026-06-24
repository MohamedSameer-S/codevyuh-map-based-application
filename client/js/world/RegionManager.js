class RegionManager {
  constructor(engine, regionData) {
    this.engine = engine;
    this.regions = regionData;
    this.events = {};
  }

  on(event, callback) {
    this.events[event] = callback;
  }

  trigger(event, ...args) {
    if (this.events[event]) {
      this.events[event](...args);
    }
  }

  generateRegions() {
    this.regions.forEach(region => {
      this.drawRegion(region);
    });
  }

  drawRegion(region) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", `region-group theme-${region.theme}`);
    g.setAttribute("id", `region-${region.id}`);
    
    const radius = region.width / 2.2;
    const pathData = this.generateOrganicPath(region.x, region.y, radius);

    // 1. Base Shadow Plate (Physical thickness)
    const basePlate = document.createElementNS("http://www.w3.org/2000/svg", "path");
    basePlate.setAttribute("d", pathData);
    basePlate.setAttribute("transform", "translate(0, 20)"); // shifted down
    basePlate.setAttribute("fill", this.getBaseColor(region.theme));

    // 2. Raised Land Plate (Top surface)
    const topPlate = document.createElementNS("http://www.w3.org/2000/svg", "path");
    topPlate.setAttribute("d", pathData);
    topPlate.setAttribute("fill", this.getSurfaceColor(region.theme));
    topPlate.setAttribute("stroke", this.getBorderColor(region.theme));
    topPlate.setAttribute("stroke-width", "8");
    topPlate.setAttribute("class", "region-plate");
    topPlate.setAttribute("filter", "url(#drop-shadow)");

    g.appendChild(basePlate);
    g.appendChild(topPlate);

    // 3. Biome Decorations
    this.drawDecorations(region, g);

    // 4. Hitbox for Interactivity
    const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitbox.setAttribute("d", pathData);
    hitbox.setAttribute("class", "region-hitbox");
    hitbox.setAttribute("fill", "transparent");

    // Set transform-origin to the exact center for clean scaling
    g.style.transformOrigin = `${region.x}px ${region.y}px`;

    hitbox.addEventListener("mouseenter", (e) => {
      if (!region.locked) {
        g.classList.add('region-hover');
        document.body.style.cursor = 'pointer';
        
        const landmarkG = document.getElementById(`landmark-${region.id}`);
        if (landmarkG) {
          // Clean uniform scale on hover, no longer multiplying against the old isometric values!
          landmarkG.style.transform = `translate(${region.x}px, ${region.y}px) scale(1.05)`;
        }
      } else {
        document.body.style.cursor = 'not-allowed';
      }
      
      this.trigger('regionHover', region, e);
    });
    
    hitbox.addEventListener("mouseleave", (e) => {
      g.classList.remove('region-hover');
      document.body.style.cursor = 'default';
      
      const landmarkG = document.getElementById(`landmark-${region.id}`);
      if (landmarkG) {
        landmarkG.style.transform = `translate(${region.x}px, ${region.y}px) scale(1)`;
      }
      
      this.trigger('regionOut', region, e);
    });
    
    hitbox.addEventListener("click", () => {
      if (region.locked) {
        if (window.showLockedMessage) window.showLockedMessage();
      } else {
        this.trigger('regionClick', region);
      }
    });

    g.appendChild(hitbox);
    this.engine.renderer.getLayer('regions').appendChild(g);
  }

  generateOrganicPath(cx, cy, radius) {
    const points = 12;
    let d = "";
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius + (window.rng.next() * radius * 0.4 - radius * 0.2); // +/- 20% jitter
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) {
        d += `M ${px},${py} `;
      } else {
        const prevAngle = ((i - 1) / points) * Math.PI * 2;
        const ctrlAngle = prevAngle + (Math.PI * 2) / points / 2;
        const ctrlR = radius + (window.rng.next() * radius * 0.4 - radius * 0.2);
        const ctrlX = cx + Math.cos(ctrlAngle) * ctrlR;
        const ctrlY = cy + Math.sin(ctrlAngle) * ctrlR;
        d += `Q ${ctrlX},${ctrlY} ${px},${py} `;
      }
    }
    return d;
  }

  getBaseColor(theme) {
    switch(theme) {
      case 'debug': return '#1a232e';
      case 'python': return '#1b5e20';
      case 'systems': return '#37474f';
      default: return '#558b2f'; // logic/plains
    }
  }

  getSurfaceColor(theme) {
    switch(theme) {
      case 'debug': return '#37474f'; // Cracked stone
      case 'python': return '#2e7d32'; // Deep grass
      case 'systems': return '#546e7a'; // Metallic/Factory floor
      default: return '#7cb342'; // Bright academy grass
    }
  }

  getBorderColor(theme) {
    switch(theme) {
      case 'debug': return '#b71c1c'; // Red corrupted
      case 'python': return '#004d40'; // Deep vine
      case 'systems': return '#ff8f00'; // Industrial orange/yellow
      default: return '#0277bd'; // Academy blue
    }
  }

  drawDecorations(region, g) {
    const decorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // Scale decorations up by 3x and translate them to the center of the region
    decorGroup.setAttribute("transform", `translate(${region.x}, ${region.y}) scale(3)`);

    if (region.theme === 'debug') {
      // Cracked ground lines
      const crack = document.createElementNS("http://www.w3.org/2000/svg", "path");
      crack.setAttribute("d", `M -40,10 Q -20,20 0,10 T 30,30`);
      crack.setAttribute("stroke", "#1a232e");
      crack.setAttribute("stroke-width", "3");
      crack.setAttribute("fill", "none");
      decorGroup.appendChild(crack);
    } else if (region.theme === 'systems') {
      // Metal grates / hazard lines
      const grate = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      grate.setAttribute("x", "-40");
      grate.setAttribute("y", "-50");
      grate.setAttribute("width", "30");
      grate.setAttribute("height", "20");
      grate.setAttribute("fill", "#455a64");
      grate.setAttribute("stroke", "#ff8f00");
      grate.setAttribute("stroke-width", "2");
      grate.setAttribute("stroke-dasharray", "5,2.5");
      decorGroup.appendChild(grate);
    } else if (region.theme === 'python') {
      // Overgrown vines on the edge
      const vine = document.createElementNS("http://www.w3.org/2000/svg", "path");
      vine.setAttribute("d", `M 30,-20 Q 40,0 35,25`);
      vine.setAttribute("stroke", "#1b5e20");
      vine.setAttribute("stroke-width", "6");
      vine.setAttribute("stroke-linecap", "round");
      vine.setAttribute("fill", "none");
      decorGroup.appendChild(vine);
    } else {
      // Logic (Academy Puzzle Tiles)
      const tile = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      tile.setAttribute("x", "-50");
      tile.setAttribute("y", "20");
      tile.setAttribute("width", "15");
      tile.setAttribute("height", "15");
      tile.setAttribute("fill", "#8bc34a");
      tile.setAttribute("stroke", "#0277bd");
      tile.setAttribute("stroke-width", "1.5");
      decorGroup.appendChild(tile);
    }

    g.appendChild(decorGroup);
  }


}

window.RegionManager = RegionManager;
