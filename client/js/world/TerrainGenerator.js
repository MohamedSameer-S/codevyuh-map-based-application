class TerrainGenerator {
  constructor(renderer, bounds, centerX, centerY) {
    this.renderer = renderer;
    this.width = renderer.width;
    this.height = renderer.height;
    this.bounds = bounds || { minX: 0, maxX: 5000, minY: 0, maxY: 4000 };
    this.centerX = centerX || 2500;
    this.centerY = centerY || 2000;
    this.regionsConfig = window.CodeVyuhRegions || [];
  }

  generateBaseLandmass(renderQueue) {
    // We are delegating the Ocean background to pure CSS to avoid Chromium 
    // rendering limits on massive SVG gradients (>32768px). 
    // The #world-container will handle the deep ocean styling.

    // Calculate dynamic island radius
    // We want the island to encompass all regions, plus a generous padding 
    // so the green grass extends out further.
    const rx = (this.bounds.maxX - this.bounds.minX) / 2 * 1.3;
    const ry = (this.bounds.maxY - this.bounds.minY) / 2 * 1.3;

    // 0. Biome Halos (Ground Blending)
    const haloGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    haloGroup.setAttribute("id", "biome-halos");
    haloGroup.style.mixBlendMode = "overlay"; // Blend into grass
    
    this.regionsConfig.forEach(r => {
      // Ensure the theme exists and matches our halo gradients
      const theme = r.theme || 'plains';
      const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      halo.setAttribute("cx", r.x);
      halo.setAttribute("cy", r.y);
      halo.setAttribute("r", Math.max(r.width, r.height) * 2.5); // Massive soft bleed
      halo.setAttribute("fill", `url(#halo-${theme})`);
      haloGroup.appendChild(halo);
    });

    // 1. Generate Procedural Coastline (Base Layer)
    // Multiplied rx and ry by 2.2 to push the coastline out of the 5000x4000 bounds
    const baseLayerPath = this.generateIslandPath(this.centerX, this.centerY, rx * 2.2, ry * 2.2, 0.4);
    const landBase = document.createElementNS("http://www.w3.org/2000/svg", "path");
    landBase.setAttribute("d", baseLayerPath);
    landBase.setAttribute("fill", "#668c4a"); 
    landBase.setAttribute("stroke", "#cca25c"); // beach outline
    landBase.setAttribute("stroke-width", "30");
    landBase.setAttribute("filter", "url(#drop-shadow)");

    // Add inner beach
    const innerBeach = document.createElementNS("http://www.w3.org/2000/svg", "path");
    innerBeach.setAttribute("d", baseLayerPath);
    innerBeach.setAttribute("fill", "transparent");
    innerBeach.setAttribute("stroke", "#e5c58a");
    innerBeach.setAttribute("stroke-width", "12");

    // 2. Mid Elevation (Plains)
    // Multiplied by 1.8 to ensure plains also extend to the bounds
    const plainsPath = this.generateIslandPath(this.centerX, this.centerY, rx * 1.8, ry * 1.8, 0.3);
    const landPlains = document.createElementNS("http://www.w3.org/2000/svg", "path");
    landPlains.setAttribute("d", plainsPath);
    landPlains.setAttribute("fill", "#7b9e59");
    landPlains.setAttribute("filter", "drop-shadow(0px 10px 5px rgba(0,0,0,0.3))");

    // 3. High Elevation (Highlands)
    const highlandsPath = this.generateIslandPath(this.centerX, this.centerY, rx * 0.5, ry * 0.5, 0.5);
    const landHighlands = document.createElementNS("http://www.w3.org/2000/svg", "path");
    landHighlands.setAttribute("d", highlandsPath);
    landHighlands.setAttribute("fill", "#8dae6b");
    landHighlands.setAttribute("filter", "drop-shadow(0px 15px 10px rgba(0,0,0,0.4))");

    // 4. Strategy Grid
    const gridOverlay = this.generateStrategyGrid(baseLayerPath);

    this.renderer.getLayer('landmass').appendChild(landBase);
    this.renderer.getLayer('landmass').appendChild(haloGroup); // Halos bleed onto base
    this.renderer.getLayer('landmass').appendChild(innerBeach);
    this.renderer.getLayer('landmass').appendChild(landPlains);
    this.renderer.getLayer('landmass').appendChild(landHighlands);
    this.renderer.getLayer('landmass').appendChild(gridOverlay);

    // 5. Inland Lakes (Randomly scattered within plains radius)
    this.generateLakes(rx * 0.7, ry * 0.7);
    
    this.generateRivers();
    this.generateRoads(); // MST Roads
    
    // We now use a unified ecology generation with Z-Sorting
    this.renderQueue = renderQueue || [];
    this.generateEcology(rx, ry);
    
    // If we own the queue, render it immediately. Otherwise defer to WorldEngine.
    if (!renderQueue) {
      this.renderQueue.sort((a, b) => a.y - b.y);
      this.renderQueue.forEach(item => {
        this.renderer.getLayer('terrain').appendChild(item.element);
      });
    }
  }

  generateIslandPath(cx, cy, rx, ry, roughness) {
    let path = "";
    const steps = 60; // How many points along the perimeter
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      // Procedural noise combining a few sine waves
      let noise = Math.sin(angle * 5) * 0.3 + Math.cos(angle * 8) * 0.2 + Math.sin(angle * 13) * 0.1;
      // Random jitter
      noise += (window.rng.next() * 0.2 - 0.1);
      
      const radX = rx * (1 + noise * roughness);
      const radY = ry * (1 + noise * roughness);
      
      const px = cx + Math.cos(angle) * radX;
      const py = cy + Math.sin(angle) * radY;
      
      if (i === 0) {
        path += `M ${px},${py} `;
      } else {
        path += `L ${px},${py} `;
      }
    }
    path += "Z";
    return path;
  }

  generateLakes() {
    // Specifically placed lakes to act as hubs for rivers
    const lakes = [
      { cx: 1200, cy: 900, rx: 300, ry: 150 },   // Top Left Lake
      { cx: 2500, cy: 1900, rx: 400, ry: 200 },  // Center Lake
      { cx: 3800, cy: 3000, rx: 350, ry: 180 },  // Bottom Right Lake
      { cx: 600, cy: 2550, rx: 280, ry: 140 }    // Left Lake (Systems Republic)
    ];

    lakes.forEach(lake => {
      const lakePath = this.generateIslandPath(lake.cx, lake.cy, lake.rx, lake.ry, 0.4);
      const lakeSvg = document.createElementNS("http://www.w3.org/2000/svg", "path");
      lakeSvg.setAttribute("d", lakePath);
      lakeSvg.setAttribute("fill", "#3b8eb5");
      lakeSvg.setAttribute("stroke", "#e5c58a");
      lakeSvg.setAttribute("stroke-width", "5");
      lakeSvg.setAttribute("filter", "drop-shadow(inset 0px 5px 10px rgba(0,0,0,0.5))");
      this.renderer.getLayer('rivers').appendChild(lakeSvg);
    });
  }

  generateStrategyGrid(clipPathD) {
    // We create a faint grid, but clip it to the base landmass
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Create a clip path
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", "landmass-clip");
    const clipPoly = document.createElementNS("http://www.w3.org/2000/svg", "path");
    clipPoly.setAttribute("d", clipPathD);
    clipPath.appendChild(clipPoly);
    defs.appendChild(clipPath);
    g.appendChild(defs);

    const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gridGroup.setAttribute("clip-path", "url(#landmass-clip)");
    
    // Draw grid lines
    const step = 100;
    // Draw vertical lines spanning the bounds
    for (let x = this.bounds.minX; x <= this.bounds.maxX; x += step) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x);
      line.setAttribute("y1", this.bounds.minY);
      line.setAttribute("x2", x);
      line.setAttribute("y2", this.bounds.maxY);
      line.setAttribute("stroke", "rgba(0,0,0,0.05)");
      line.setAttribute("stroke-width", "2");
      gridGroup.appendChild(line);
    }
    // Draw horizontal lines
    for (let y = this.bounds.minY; y <= this.bounds.maxY; y += step) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", this.bounds.minX);
      line.setAttribute("y1", y);
      line.setAttribute("x2", this.bounds.maxX);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "rgba(0,0,0,0.05)");
      line.setAttribute("stroke-width", "2");
      gridGroup.appendChild(line);
    }

    g.appendChild(gridGroup);
    return g;
  }

  generateRivers() {
    // Curated rivers that connect lakes and regions WITHOUT going under regions and breaking
    const riverPaths = [
      // River 1: Top Left Lake to Logic Dominion to Center Lake
      "M 1300,1000 C 1600,1100 1700,1300 1800,1400 C 1900,1500 2200,1700 2400,1850",
      
      // River 2: Debug Wasteland to Center Lake
      "M 3000,1400 C 2900,1500 2800,1700 2600,1850",
      
      // River 3: Center Lake down between Systems & Python to Bottom Right Lake
      "M 2400,1950 C 2200,2100 1800,2200 1800,2300 C 1800,2500 2500,2500 2800,2600 C 3100,2700 3500,2900 3700,3000",
      
      // River 4: Systems Republic to left boundary
      "M 1300,2400 C 1000,2500 800,2550 600,2550"
    ];

    riverPaths.forEach(d => {
      const river = document.createElementNS("http://www.w3.org/2000/svg", "path");
      river.setAttribute("d", d);
      river.setAttribute("fill", "transparent");
      river.setAttribute("stroke", "#3b8eb5");
      river.setAttribute("stroke-width", "30");
      river.setAttribute("stroke-linecap", "round");
      river.setAttribute("stroke-linejoin", "round");
      this.renderer.getLayer('rivers').appendChild(river);
    });
  }

  generateRoads() {
    if (this.regionsConfig.length < 2) return;

    // Prim's Algorithm for Minimum Spanning Tree (MST)
    const unvisited = [...this.regionsConfig];
    const visited = [unvisited.shift()];
    
    while (unvisited.length > 0) {
      let minDist = Infinity;
      let closestVisited = null;
      let closestUnvisitedIdx = -1;

      for (let i = 0; i < visited.length; i++) {
        for (let j = 0; j < unvisited.length; j++) {
          const dx = visited[i].x - unvisited[j].x;
          const dy = visited[i].y - unvisited[j].y;
          const dist = dx*dx + dy*dy;
          if (dist < minDist) {
            minDist = dist;
            closestVisited = visited[i];
            closestUnvisitedIdx = j;
          }
        }
      }

      const closestUnvisited = unvisited.splice(closestUnvisitedIdx, 1)[0];
      
      // Calculate angle between the two regions to find edge coordinates
      const angle = Math.atan2(closestUnvisited.y - closestVisited.y, closestUnvisited.x - closestVisited.x);
      
      // Assume a territory radius of about width/2.2 (matches hitbox from RegionManager)
      const r1 = Math.max(closestVisited.width, closestVisited.height) / 2.2;
      const r2 = Math.max(closestUnvisited.width, closestUnvisited.height) / 2.2;

      // Start at the edge of the visited region
      const startX = closestVisited.x + Math.cos(angle) * r1;
      const startY = closestVisited.y + Math.sin(angle) * r1;
      
      // End at the edge of the unvisited region
      const endX = closestUnvisited.x - Math.cos(angle) * r2;
      const endY = closestUnvisited.y - Math.sin(angle) * r2;

      // Draw road
      const cx = (startX + endX) / 2 + (window.rng.next() * 300 - 150);
      const cy = (startY + endY) / 2 + (window.rng.next() * 300 - 150);
      
      const d = `M ${startX},${startY} Q ${cx},${cy} ${endX},${endY}`;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#8d6e63");
      path.setAttribute("stroke-width", "12");
      path.setAttribute("stroke-dasharray", "20 15");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("filter", "url(#drop-shadow)");
      
      this.renderer.getLayer('roads').appendChild(path);
      visited.push(closestUnvisited);
    }
  }

  isCollision(x, y, radius) {
    for (let r of this.regionsConfig) {
      const dx = r.x - x;
      const dy = r.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Region plates have a radius of roughly width / 2.2
      // We want ecology to spawn right at the edge of the plate, so padding is small
      const safeZone = Math.max(r.width, r.height) / 2.2 + 50; 
      if (dist < safeZone + radius) return true;
    }
    return false;
  }

  generateEcology(rx, ry) {
    const step = 150; // Grid spacing for Poisson-like distribution
    for (let x = this.bounds.minX; x < this.bounds.maxX; x += step) {
      for (let y = this.bounds.minY; y < this.bounds.maxY; y += step) {
        // Randomly skip to create organic clusters
        if (window.rng.next() > 0.45) continue;

        const jitterX = x + (window.rng.next() * 100 - 50);
        const jitterY = y + (window.rng.next() * 100 - 50);

        // Normalized distance to check if we are on the elliptical island grass
        const dx = jitterX - this.centerX;
        const dy = jitterY - this.centerY;
        const normalizedDist = (dx*dx)/(rx*rx) + (dy*dy)/(ry*ry);
        if (normalizedDist > 0.8) continue; // Keep away from the beach edge

        if (!this.isCollision(jitterX, jitterY, 150)) {
          // Euclidean proximity check for Endemic Ecology
          let nearestRegion = null;
          let minDist = Infinity;
          for (let r of this.regionsConfig) {
            const rdx = r.x - jitterX;
            const rdy = r.y - jitterY;
            const dist = Math.sqrt(rdx*rdx + rdy*rdy);
            if (dist < minDist) {
              minDist = dist;
              nearestRegion = r;
            }
          }

          // If within regional influence, inherit biome
          const theme = nearestRegion && minDist < (Math.max(nearestRegion.width, nearestRegion.height) * 2) 
                        ? nearestRegion.theme : 'plains';

          if (theme === 'debug') {
            if (window.rng.next() > 0.6) this.drawCrystal(jitterX, jitterY);
            else this.drawMountain(jitterX, jitterY, '#37474f');
          } else if (theme === 'python') {
            if (window.rng.next() > 0.3) this.drawPalmTree(jitterX, jitterY);
            else this.drawTreeGroup(jitterX, jitterY, theme);
          } else {
            if (window.rng.next() > 0.85) this.drawMountain(jitterX, jitterY);
            else this.drawTreeGroup(jitterX, jitterY, theme);
          }
        }
      }
    }
  }

  drawCrystal(x, y) {
    const size = window.rng.next() * 40 + 60;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1, 1.666)`);
    g.setAttribute("class", "landmark-shadow");

    const base = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    base.setAttribute("points", `0,-${size} -${size*0.3},0 0,${size*0.2} ${size*0.3},0`);
    base.setAttribute("fill", "#7b1fa2");

    const core = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    core.setAttribute("points", `0,-${size*0.9} -${size*0.15},0 0,${size*0.1} ${size*0.15},0`);
    core.setAttribute("fill", "#e040fb");
    
    // Glowing animation
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    glow.setAttribute("attributeName", "opacity");
    glow.setAttribute("values", "0.6;1;0.6");
    glow.setAttribute("dur", "3s");
    glow.setAttribute("repeatCount", "indefinite");
    core.appendChild(glow);

    g.appendChild(base);
    g.appendChild(core);
    this.renderQueue.push({ y: y, element: g });
  }

  drawPalmTree(x, y) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1.5)`);
    g.setAttribute("filter", "url(#drop-shadow)");

    const trunk = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trunk.setAttribute("d", "M -2,0 Q -5,-15 0,-30 Q 5,-15 2,0 Z");
    trunk.setAttribute("fill", "#6d4c41");

    // Leaves
    const leaves = document.createElementNS("http://www.w3.org/2000/svg", "path");
    leaves.setAttribute("d", "M 0,-30 Q -20,-40 -25,-20 Q -10,-25 0,-30 M 0,-30 Q 20,-40 25,-20 Q 10,-25 0,-30 M 0,-30 Q 0,-55 -15,-45 Q 0,-40 0,-30 M 0,-30 Q 0,-55 15,-45 Q 0,-40 0,-30");
    leaves.setAttribute("stroke", "#2e7d32");
    leaves.setAttribute("stroke-width", "4");
    leaves.setAttribute("fill", "none");
    leaves.setAttribute("stroke-linecap", "round");

    g.appendChild(trunk);
    g.appendChild(leaves);
    this.renderQueue.push({ y: y, element: g });
  }

  drawMountain(x, y, theme = 'plains') {
    const size = window.rng.next() * 60 + 100; // 100 to 160
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1, 1.666)`);
    g.setAttribute("class", "mountain-shadow");

    const baseColor = theme === 'debug' ? '#263238' : '#455a64';

    // Base mountain shape
    const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
    base.setAttribute("d", `M 0,-${size} L -${size*0.4},-${size*0.3} L -${size*0.6},0 L -${size*0.3},${size*0.2} L 0,${size*0.3} L ${size*0.3},${size*0.2} L ${size*0.6},0 L ${size*0.4},-${size*0.3} Z`);
    base.setAttribute("fill", baseColor);

    // Lit side
    const litSide = document.createElementNS("http://www.w3.org/2000/svg", "path");
    litSide.setAttribute("d", `M 0,-${size} L -${size*0.4},-${size*0.3} L -${size*0.6},0 L -${size*0.3},${size*0.2} L 0,${size*0.3} L -${size*0.1},-${size*0.1} L 0,-${size*0.4} Z`);
    litSide.setAttribute("fill", "url(#mountain-grad)");

    // Snow cap
    const snowColor = theme === 'debug' ? '#b0bec5' : '#ffffff';
    const snow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    snow.setAttribute("d", `M 0,-${size} L -${size*0.2},-${size*0.5} L -${size*0.1},-${size*0.4} L 0,-${size*0.45} L ${size*0.1},-${size*0.35} L ${size*0.2},-${size*0.5} Z`);
    snow.setAttribute("fill", snowColor);

    g.appendChild(base);
    g.appendChild(litSide);
    g.appendChild(snow);

    this.renderQueue.push({ y: y, element: g });
  }

  drawTreeGroup(x, y, theme = 'plains') {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1, 1.666)`);
    g.setAttribute("filter", "url(#drop-shadow)");

    // Draw 3 detailed overlapping trees
    const offsets = [[0, -10, 1], [-15, 5, 0.8], [15, 10, 0.9]];
    offsets.sort((a, b) => a[1] - b[1]);

    const leafLeftColor = theme === 'python' ? '#1b5e20' : '#2e7d32';
    const leafRightColor = theme === 'python' ? '#003300' : '#1b5e20';
    const leafMidColor = theme === 'python' ? '#33691e' : '#43a047';

    offsets.forEach(offset => {
      const treeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      treeG.setAttribute("transform", `translate(${offset[0]}, ${offset[1]}) scale(${offset[2]})`);

      const trunk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      trunk.setAttribute("x", "-4");
      trunk.setAttribute("y", "0");
      trunk.setAttribute("width", "8");
      trunk.setAttribute("height", "15");
      trunk.setAttribute("fill", "#5d4037");
      
      const leavesLeft = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      leavesLeft.setAttribute("points", "0,-40 -20,5 0,5");
      leavesLeft.setAttribute("fill", leafLeftColor);

      const leavesRight = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      leavesRight.setAttribute("points", "0,-40 20,5 0,5");
      leavesRight.setAttribute("fill", leafRightColor);

      const midLeft = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      midLeft.setAttribute("points", "0,-25 -15, -5 0,-5");
      midLeft.setAttribute("fill", leafMidColor);

      const midRight = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      midRight.setAttribute("points", "0,-25 15, -5 0,-5");
      midRight.setAttribute("fill", leafLeftColor);

      treeG.appendChild(trunk);
      treeG.appendChild(leavesRight);
      treeG.appendChild(leavesLeft);
      treeG.appendChild(midLeft);
      treeG.appendChild(midRight);

      g.appendChild(treeG);
    });

    this.renderQueue.push({ y: y, element: g });
  }
}

window.TerrainGenerator = TerrainGenerator;
