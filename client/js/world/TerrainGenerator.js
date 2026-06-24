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
    // Calculate dynamic island radius (slightly reduced to 1.15 to reveal surrounding ocean)
    const rx = (this.bounds.maxX - this.bounds.minX) / 2 * 1.15;
    const ry = (this.bounds.maxY - this.bounds.minY) / 2 * 1.15;

    // Define playable bounds that encompass the entire plains area (1.8 scale)
    this.playableBounds = {
      minX: this.centerX - (rx * 1.8),
      maxX: this.centerX + (rx * 1.8),
      minY: this.centerY - (ry * 1.8),
      maxY: this.centerY + (ry * 1.8)
    };

    // 0. Ocean depth layers
    this.drawOceanDepth(rx, ry);

    // 1. Coastline / Shoreline
    const baseLayerPath = this.generateIslandPath(this.centerX, this.centerY, rx * 2.2, ry * 2.2, 0.4);
    this.drawShoreline(baseLayerPath);

    // 2. Mid Elevation (Plains)
    const plainsPath = this.generateIslandPath(this.centerX, this.centerY, rx * 1.8, ry * 1.8, 0.3);
    const landPlains = document.createElementNS("http://www.w3.org/2000/svg", "path");
    landPlains.setAttribute("d", plainsPath);
    landPlains.setAttribute("fill", "#7b9e59");
    landPlains.setAttribute("filter", "drop-shadow(0px 10px 5px rgba(0,0,0,0.3))");
    this.renderer.getLayer('landmass').appendChild(landPlains);

    // 3. Terrain Patches for variation
    // Removed old terrain patches


    // 4. High Elevation (Highlands)
    // Removed because it creates a muddy dark boundary outline in the center
    /*
    const highlandsPath = this.generateIslandPath(this.centerX, this.centerY, rx * 0.5, ry * 0.5, 0.5);
    const landHighlands = document.createElementNS("http://www.w3.org/2000/svg", "path");
    landHighlands.setAttribute("d", highlandsPath);
    landHighlands.setAttribute("fill", "#8dae6b");
    landHighlands.setAttribute("filter", "drop-shadow(0px 15px 10px rgba(0,0,0,0.4))");
    this.renderer.getLayer('landmass').appendChild(landHighlands);
    */

    // 5. Strategy Grid
    // Removed to eliminate the technical pathfinding/quadrant guide lines
    /*
    const gridOverlay = this.generateStrategyGrid(baseLayerPath);
    this.renderer.getLayer('landmass').appendChild(gridOverlay);
    */

    // 6. Civilization Zones (Ground Blending)
    this.drawCivilizationZones(rx, ry, plainsPath);

    // 7. Water Network & Regional Separation
    this.generateWaterNetwork();
    
    // 8. Roads
    // Removed to eliminate the straight brown divider paths
    // this.generateRoads(); // MST Roads
    
    // 9. Ecology (Unified generation with Z-Sorting)
    this.renderQueue = renderQueue || [];
    this.generateEcology(rx * 1.8, ry * 1.8);
    
    // If we own the queue, render it immediately. Otherwise defer to WorldEngine.
    if (!renderQueue) {
      this.renderQueue.sort((a, b) => a.y - b.y);
      this.renderQueue.forEach(item => {
        this.renderer.getLayer('terrain').appendChild(item.element);
      });
    }
  }

  drawOceanDepth(rx, ry) {
    const shelfPath = this.generateIslandPath(this.centerX, this.centerY, rx * 2.8, ry * 2.8, 0.3);
    const shelf = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shelf.setAttribute("d", shelfPath);
    shelf.setAttribute("fill", "#235a7a");
    
    const coastalPath = this.generateIslandPath(this.centerX, this.centerY, rx * 2.4, ry * 2.4, 0.35);
    const coastal = document.createElementNS("http://www.w3.org/2000/svg", "path");
    coastal.setAttribute("d", coastalPath);
    coastal.setAttribute("fill", "#2c7299");
    
    this.renderer.getLayer('ocean').appendChild(shelf);
    this.renderer.getLayer('ocean').appendChild(coastal);
  }

  drawShoreline(baseLayerPath) {
    const beach = document.createElementNS("http://www.w3.org/2000/svg", "path");
    beach.setAttribute("d", baseLayerPath);
    beach.setAttribute("fill", "#eecfa1"); // Sand
    beach.setAttribute("stroke", "#4bb5c1"); // Shallow turquoise border
    beach.setAttribute("stroke-width", "30");
    beach.setAttribute("filter", "drop-shadow(0px 8px 12px rgba(0,0,0,0.3))");
    
    this.renderer.getLayer('landmass').appendChild(beach);
  }

  drawCivilizationZones(rx, ry, plainsPath) {
    const zones = [
      { id: 'logic', theme: 'plains', cx: this.centerX - rx * 0.6, cy: this.centerY - ry * 0.6, grad: 'url(#logic-zone-grad)' },
      { id: 'debug', theme: 'debug', cx: this.centerX + rx * 0.6, cy: this.centerY - ry * 0.6, grad: 'url(#debug-zone-grad)' },
      { id: 'systems', theme: 'systems', cx: this.centerX - rx * 0.6, cy: this.centerY + ry * 0.6, grad: 'url(#systems-zone-grad)' },
      { id: 'python', theme: 'python', cx: this.centerX + rx * 0.6, cy: this.centerY + ry * 0.6, grad: 'url(#python-zone-grad)' }
    ];

    if (this.regionsConfig && this.regionsConfig.length > 0) {
      zones.forEach(zone => {
        const themeRegions = this.regionsConfig.filter(r => r.theme === zone.theme || (zone.theme === 'plains' && !r.theme));
        if (themeRegions.length > 0) {
          const sumX = themeRegions.reduce((sum, r) => sum + r.x, 0);
          const sumY = themeRegions.reduce((sum, r) => sum + r.y, 0);
          zone.cx = sumX / themeRegions.length;
          zone.cy = sumY / themeRegions.length;
        }
      });
    }

    const zoneGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    zoneGroup.setAttribute("id", "civilization-zones");

    // Apply clipping mask so zones don't overflow the base island
    if (plainsPath) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clipPath.setAttribute("id", "island-clip-path");
      const clipPoly = document.createElementNS("http://www.w3.org/2000/svg", "path");
      clipPoly.setAttribute("d", plainsPath);
      clipPath.appendChild(clipPoly);
      defs.appendChild(clipPath);
      zoneGroup.appendChild(defs);
      zoneGroup.setAttribute("clip-path", "url(#island-clip-path)");
    }

    zones.forEach(zone => {
      // Create large, overlapping, organic shapes for each zone
      const zoneRx = rx * 1.2;
      const zoneRy = ry * 1.2;
      const pathData = this.generateIslandPath(zone.cx, zone.cy, zoneRx, zoneRy, 0.45);
      
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("fill", zone.grad);
      // Using multiply blend mode enhances the organic integration with the base green
      path.style.mixBlendMode = "multiply"; 
      
      zoneGroup.appendChild(path);
    });

    this.renderer.getLayer('landmass').appendChild(zoneGroup);
  }

  // Preserved for rollback safety per Phase 1A rules
  drawTerrainPatches(rx, ry) {
    const numPatches = 80;
    const colors = ["#85b060", "#6d914d", "#76a156", "#8bba62"];
    for (let i = 0; i < numPatches; i++) {
      const angle = window.rng.next() * Math.PI * 2;
      const dist = window.rng.next() * rx * 1.8;
      const cx = this.centerX + Math.cos(angle) * dist;
      const cy = this.centerY + Math.sin(angle) * dist * 0.8;
      
      const prx = 150 + window.rng.next() * 350;
      const pry = 100 + window.rng.next() * 250;
      
      const patchPath = this.generateIslandPath(cx, cy, prx, pry, 0.4);
      const patch = document.createElementNS("http://www.w3.org/2000/svg", "path");
      patch.setAttribute("d", patchPath);
      patch.setAttribute("fill", colors[Math.floor(window.rng.next() * colors.length)]);
      patch.setAttribute("opacity", "0.7");
      
      this.renderer.getLayer('landmass').appendChild(patch);
    }
  }

  // Preserved for rollback safety per Phase 1A rules
  drawBiomeHalos() {
    const haloGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    haloGroup.setAttribute("id", "biome-halos");
    haloGroup.style.mixBlendMode = "overlay"; 
    
    this.regionsConfig.forEach(r => {
      const theme = r.theme || 'plains';
      const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      halo.setAttribute("cx", r.x);
      halo.setAttribute("cy", r.y);
      halo.setAttribute("r", Math.max(r.width, r.height) * 2.5);
      halo.setAttribute("fill", `url(#halo-${theme})`);
      haloGroup.appendChild(halo);
    });
    this.renderer.getLayer('landmass').appendChild(haloGroup);
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

  drawBridgeHint(cx, cy, type, angle = 0) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform", `translate(${cx}, ${cy}) rotate(${angle})`);

    // Road goes left to right crossing the river
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M -120,0 L 120,0");
    path.setAttribute("stroke", "#8d6e63");
    path.setAttribute("stroke-width", "12");
    path.setAttribute("stroke-dasharray", "20 15");
    group.appendChild(path);

    if (type === 'stone') {
      const bridge = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bridge.setAttribute("x", "-40"); bridge.setAttribute("y", "-30");
      bridge.setAttribute("width", "80"); bridge.setAttribute("height", "60");
      bridge.setAttribute("fill", "#90a4ae");
      bridge.setAttribute("rx", "10");
      group.appendChild(bridge);
      const p1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      p1.setAttribute("x", "-40"); p1.setAttribute("y", "-30"); p1.setAttribute("width", "80"); p1.setAttribute("height", "8"); p1.setAttribute("fill", "#607d8b");
      const p2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      p2.setAttribute("x", "-40"); p2.setAttribute("y", "22"); p2.setAttribute("width", "80"); p2.setAttribute("height", "8"); p2.setAttribute("fill", "#607d8b");
      group.appendChild(p1); group.appendChild(p2);
    } else if (type === 'broken') {
      const b1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      b1.setAttribute("d", "M -40,-20 L -10,-10 L -20,20 L -40,20 Z");
      b1.setAttribute("fill", "#455a64");
      const b2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      b2.setAttribute("d", "M 40,-20 L 20,5 L 40,10 Z");
      b2.setAttribute("fill", "#455a64");
      const d1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      d1.setAttribute("cx", "0"); d1.setAttribute("cy", "0"); d1.setAttribute("r", "6"); d1.setAttribute("fill", "#37474f");
      group.appendChild(b1); group.appendChild(b2); group.appendChild(d1);
    } else if (type === 'mechanical') {
      const bridge = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bridge.setAttribute("x", "-50"); bridge.setAttribute("y", "-25");
      bridge.setAttribute("width", "100"); bridge.setAttribute("height", "50");
      bridge.setAttribute("fill", "#37474f");
      const pipe = document.createElementNS("http://www.w3.org/2000/svg", "line");
      pipe.setAttribute("x1", "-50"); pipe.setAttribute("y1", "0"); pipe.setAttribute("x2", "50"); pipe.setAttribute("y2", "0");
      pipe.setAttribute("stroke", "#ffb300"); pipe.setAttribute("stroke-width", "6");
      group.appendChild(bridge); group.appendChild(pipe);
    } else if (type === 'vine') {
      const v1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      v1.setAttribute("d", "M -50,-15 Q 0,-25 50,-15");
      v1.setAttribute("stroke", "#558b2f"); v1.setAttribute("stroke-width", "6"); v1.setAttribute("fill", "none");
      const v2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      v2.setAttribute("d", "M -50,15 Q 0,25 50,15");
      v2.setAttribute("stroke", "#33691e"); v2.setAttribute("stroke-width", "6"); v2.setAttribute("fill", "none");
      for(let i=-40; i<=40; i+=15) {
        const plank = document.createElementNS("http://www.w3.org/2000/svg", "line");
        plank.setAttribute("x1", i); plank.setAttribute("y1", "-12"); plank.setAttribute("x2", i); plank.setAttribute("y2", "12");
        plank.setAttribute("stroke", "#795548"); plank.setAttribute("stroke-width", "6");
        group.appendChild(plank);
      }
      group.appendChild(v1); group.appendChild(v2);
    }
    
    group.setAttribute("filter", "url(#drop-shadow)");
    this.renderer.getLayer('roads').appendChild(group);
  }

  generateWaterNetwork() {
    const drawRiver = (pathString, baseColor, coreColor, baseWidth, coreWidth, isJagged = false, highlightColor = null) => {
      const riverBase = document.createElementNS("http://www.w3.org/2000/svg", "path");
      riverBase.setAttribute("d", pathString);
      riverBase.setAttribute("fill", "none");
      riverBase.setAttribute("stroke", baseColor);
      riverBase.setAttribute("stroke-width", baseWidth);
      riverBase.setAttribute("stroke-linecap", isJagged ? "square" : "round");
      riverBase.setAttribute("stroke-linejoin", isJagged ? "miter" : "round");

      const riverCore = document.createElementNS("http://www.w3.org/2000/svg", "path");
      riverCore.setAttribute("d", pathString);
      riverCore.setAttribute("fill", "none");
      riverCore.setAttribute("stroke", coreColor);
      riverCore.setAttribute("stroke-width", coreWidth);
      riverCore.setAttribute("stroke-linecap", isJagged ? "square" : "round");
      riverCore.setAttribute("stroke-linejoin", isJagged ? "miter" : "round");

      this.renderer.getLayer('rivers').appendChild(riverBase);
      this.renderer.getLayer('rivers').appendChild(riverCore);
    };

    const drawLake = (cx, cy, rx, ry, baseColor, coreColor) => {
      const lakePath = this.generateIslandPath(cx, cy, rx, ry, 0.4);
      const lakeSvg = document.createElementNS("http://www.w3.org/2000/svg", "path");
      lakeSvg.setAttribute("d", lakePath);
      lakeSvg.setAttribute("fill", baseColor);
      
      const corePath = this.generateIslandPath(cx, cy, rx * 0.6, ry * 0.6, 0.3);
      const coreSvg = document.createElementNS("http://www.w3.org/2000/svg", "path");
      coreSvg.setAttribute("d", corePath);
      coreSvg.setAttribute("fill", coreColor);
      coreSvg.setAttribute("filter", "drop-shadow(inset 0px 5px 10px rgba(0,0,0,0.3))");
      
      this.renderer.getLayer('rivers').appendChild(lakeSvg);
      this.renderer.getLayer('rivers').appendChild(coreSvg);
    };

    const drawJunctionBay = (cx, cy, radius, baseColor, coreColor) => {
      // Creates a smooth widening effect where rivers meet lakes
      const bayBase = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      bayBase.setAttribute("cx", cx);
      bayBase.setAttribute("cy", cy);
      bayBase.setAttribute("r", radius);
      bayBase.setAttribute("fill", baseColor);
      
      const bayCore = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      bayCore.setAttribute("cx", cx);
      bayCore.setAttribute("cy", cy);
      bayCore.setAttribute("r", radius * 0.65);
      bayCore.setAttribute("fill", coreColor);
      bayCore.setAttribute("filter", "drop-shadow(inset 0px 5px 10px rgba(0,0,0,0.3))");

      this.renderer.getLayer('rivers').appendChild(bayBase);
      this.renderer.getLayer('rivers').appendChild(bayCore);
    };

    const catmullRom2bezier = (points) => {
      let d = `M ${points[0].x},${points[0].y} `;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = i === 0 ? points[0] : points[i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i + 2 < points.length ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
      }
      return d;
    };

    // --- RENDER CLEAN CURATED RIVERS ---
    
    // 1. Curated Lakes
    // Logic Pond (NW)
    drawLake(600, 400, 350, 200, "#80deea", "#00bcd4");
    drawJunctionBay(600, 400, 110, "#80deea", "#00bcd4");
    
    // Python Lake (SE)
    drawLake(5000, 4400, 320, 200, "#4db6ac", "#00695c");
    drawJunctionBay(5000, 4400, 110, "#4bb5c1", "#2c7299");

    // 2. Curated Rivers Configuration
    const curatedRivers = [
      {
        id: "main-river",
        type: "main",
        // Clean sweeping S-curve from top center down to lower-left (Systems Frontier)
        path: "M 2500,-200 C 2500,1000 3500,2000 2500,3000 C 1500,4000 1000,4500 -500,4500",
        baseColor: "#4bb5c1",
        coreColor: "#2c7299",
        baseWidth: 240,
        coreWidth: 100,
        highlightColor: null,
        isJagged: false
      },
      {
        id: "logic-branch",
        type: "tributary",
        // Smooth curve branching from main river to Logic Pond
        path: "M 2920,1500 C 2000,1500 1000,1000 600,400",
        baseColor: "#80deea",
        coreColor: "#00bcd4",
        baseWidth: 120,
        coreWidth: 50,
        highlightColor: null,
        isJagged: false
      },
      {
        id: "python-branch",
        type: "tributary",
        // Smooth curve branching to Python Lake
        path: "M 2500,3000 C 3500,3500 4500,3500 5000,4400",
        baseColor: "#4bb5c1",
        coreColor: "#2c7299",
        baseWidth: 120,
        coreWidth: 50,
        highlightColor: null,
        isJagged: false
      }
    ];

    // Draw junction points to smooth the river forks
    drawJunctionBay(2920, 1500, 110, "#4bb5c1", "#2c7299"); // Logic branch fork
    drawJunctionBay(2500, 3000, 110, "#4bb5c1", "#2c7299"); // Python branch fork

    // Render the rivers
    curatedRivers.forEach(river => {
      drawRiver(river.path, river.baseColor, river.coreColor, river.baseWidth, river.coreWidth, river.isJagged, river.highlightColor);
    });

    // Bridges
    this.drawBridgeHint(2800, 2500, 'stone', -30);
    this.drawBridgeHint(1200, 4500, 'mechanical', 0);
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
    for (let x = this.playableBounds.minX; x <= this.playableBounds.maxX; x += step) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x);
      line.setAttribute("y1", this.playableBounds.minY);
      line.setAttribute("x2", x);
      line.setAttribute("y2", this.playableBounds.maxY);
      line.setAttribute("stroke", "rgba(255, 255, 255, 0.08)");
      line.setAttribute("stroke-width", "2");
      gridGroup.appendChild(line);
    }
    // Draw horizontal lines spanning the bounds
    for (let y = this.playableBounds.minY; y <= this.playableBounds.maxY; y += step) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", this.playableBounds.minX);
      line.setAttribute("y1", y);
      line.setAttribute("x2", this.playableBounds.maxX);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "rgba(255, 255, 255, 0.08)");
      line.setAttribute("stroke-width", "2");
      gridGroup.appendChild(line);
    }

    g.appendChild(gridGroup);
    return g;
  }

  // Old generateRivers was removed in favor of generateWaterNetwork

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
      // Adjusted safe zone (Phase 1B.2 Fix): large enough for landmarks, but reduced from 220 to 150
      // so the map has rich clearings without mathematically starving the generator.
      const safeZone = Math.max(r.width, r.height) / 2.2 + 150; 
      if (dist < safeZone + radius) return true;
    }
    return false;
  }

  // Preserved for rollback safety per Phase 1B rules
  generateEcologyOld(islandRx, islandRy) {
    const step = 150; // Grid spacing for Poisson-like distribution
    for (let x = this.playableBounds.minX; x < this.playableBounds.maxX; x += step) {
      for (let y = this.playableBounds.minY; y < this.playableBounds.maxY; y += step) {
        // Randomly skip to create organic clusters
        if (window.rng.next() > 0.45) continue;

        const jitterX = x + (window.rng.next() * 100 - 50);
        const jitterY = y + (window.rng.next() * 100 - 50);

        // Normalized distance to check if we are on the elliptical island grass
        const dx = jitterX - this.centerX;
        const dy = jitterY - this.centerY;
        const normalizedDist = (dx*dx)/(islandRx*islandRx) + (dy*dy)/(islandRy*islandRy);
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

  generateEcology(islandRx, islandRy) {
    // New Cluster-Based Ecology (Phase 1B.2)
    // We achieve organic boundaries by determining the theme based on the nearest region.
    
    // 1. Natural Mountain Ridges
    this.generateMountainRidges(islandRx, islandRy);

    // 2. Thematic Forest & Prop Clusters with exact controlled density
    const clusterTargets = {
      plains: 7,   // Logic Dominion
      debug: 10,   // Debug Realm
      systems: 10, // Systems Frontier
      python: 15   // Python Wildlands
    };

    const clusterCounts = { plains: 0, debug: 0, systems: 0, python: 0 };
    let totalAttempts = 0;
    const maxAttempts = 3000;
    let targetsMet = false;

    // Phase 1B.2 Debug Counters
    let rejectedBounds = 0;
    let rejectedCollision = 0;
    let totalGroups = 0;

    while (!targetsMet && totalAttempts < maxAttempts) {
      totalAttempts++;
      
      const cx = this.playableBounds.minX + window.rng.next() * (this.playableBounds.maxX - this.playableBounds.minX);
      const cy = this.playableBounds.minY + window.rng.next() * (this.playableBounds.maxY - this.playableBounds.minY);
      
      const dx = cx - this.centerX;
      const dy = cy - this.centerY;
      const normalizedDist = (dx*dx)/(islandRx*islandRx) + (dy*dy)/(islandRy*islandRy);
      
      if (normalizedDist > 0.85) {
        rejectedBounds++;
      } else if (this.isCollision(cx, cy, 40)) {
        rejectedCollision++;
      } else {
        // Find nearest region to organically assign this cluster's theme
        let nearestRegion = null;
        let minDist = Infinity;
        for (let r of this.regionsConfig) {
          const dist = Math.sqrt(Math.pow(r.x - cx, 2) + Math.pow(r.y - cy, 2));
          if (dist < minDist) {
            minDist = dist;
            nearestRegion = r;
          }
        }
        
        const theme = nearestRegion && minDist < 2000 ? (nearestRegion.theme || 'plains') : 'plains';
        
        // Only spawn if we need more clusters for this territory
        if (clusterCounts[theme] < clusterTargets[theme]) {
          clusterCounts[theme]++;
          
          let itemsInCluster = 3 + Math.floor(window.rng.next() * 4);
          // Adjust density strictly per rules
          if (theme === 'python') itemsInCluster += 2; // Densest
          else if (theme === 'plains') itemsInCluster -= 1; // Cleanest
          
          for(let j = 0; j < itemsInCluster; j++) {
             const jx = cx + (window.rng.next() * 160 - 80);
             const jy = cy + (window.rng.next() * 160 - 80);
             
             if (!this.isCollision(jx, jy, 40)) {
               this.spawnDecoration(jx, jy, theme);
               totalGroups++;
             }
          }
        }
      }
      
      targetsMet = Object.keys(clusterTargets).every(k => clusterCounts[k] >= clusterTargets[k]);
    }

    // Temporary debug summary for Phase 1B.2 density fix
    console.log(`=== ECOLOGY GENERATION SUMMARY ===`);
    console.log(`Attempts: ${totalAttempts}`);
    console.log(`Accepted Clusters: Logic=${clusterCounts.plains}, Debug=${clusterCounts.debug}, Systems=${clusterCounts.systems}, Python=${clusterCounts.python}`);
    console.log(`Rejected by Bounds: ${rejectedBounds}`);
    console.log(`Rejected by Collision: ${rejectedCollision}`);
    console.log(`Total Decoration Items Rendered: ${totalGroups}`);
    console.log(`==================================`);
  }
  
  generateMountainRidges(islandRx, islandRy) {
    // Add 2-3 more ridge groups, especially top-center and top-right per rule 10
    const ridges = [
      { startX: 1200, startY: 1000, endX: 1900, endY: 700, count: 9, theme: 'plains' },
      { startX: 2100, startY: 600, endX: 2800, endY: 850, count: 11, theme: 'plains' },
      { startX: 3200, startY: 600, endX: 4200, endY: 1400, count: 14, theme: 'debug' },
      { startX: 3600, startY: 1500, endX: 4500, endY: 1900, count: 12, theme: 'debug' }
    ];
    
    ridges.forEach(ridge => {
      for(let i=0; i<ridge.count; i++) {
        const t = i / (ridge.count - 1);
        const curveY = Math.sin(t * Math.PI) * 150; // Curve the ridge naturally
        let x = ridge.startX + (ridge.endX - ridge.startX) * t + (window.rng.next() * 60 - 30);
        let y = ridge.startY + (ridge.endY - ridge.startY) * t + curveY + (window.rng.next() * 60 - 30);
        
        if (!this.isCollision(x, y, 100)) {
           this.drawMountain(x, y, ridge.theme);
        }
      }
    });
  }

  spawnDecoration(x, y, theme) {
    if (theme === 'debug') {
      const roll = window.rng.next();
      if (roll < 0.25) this.drawCrystal(x, y);
      else if (roll < 0.5) this.drawDeadTree(x, y);
      else if (roll < 0.75) this.drawMountain(x, y, theme);
      else this.drawGroundCrack(x, y);
    } else if (theme === 'systems') {
      const roll = window.rng.next();
      if (roll < 0.6) this.drawIndustrialProp(x, y);
      else if (roll < 0.8) this.drawMountain(x, y, theme);
      else this.drawSmallGear(x, y);
    } else if (theme === 'python') {
      const roll = window.rng.next();
      if (roll < 0.35) this.drawPalmTree(x, y);
      else if (roll < 0.7) this.drawBush(x, y, theme);
      else this.drawTreeGroup(x, y, theme);
    } else {
      // Logic Dominion (Plains) - Keep it clean, low density
      const roll = window.rng.next();
      if (roll < 0.6) this.drawTreeGroup(x, y, theme);
      else if (roll < 0.8) this.drawBush(x, y, theme);
      else this.drawGrassPatch(x, y);
    }
  }

  drawCrystal(x, y) {
    const size = window.rng.next() * 40 + 60;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1, 1.666)`);
    g.setAttribute("class", "landmark-shadow");
    g.style.pointerEvents = "none"; // Safety rule 11

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
    g.style.pointerEvents = "none";

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
    // Add slight natural variation to scale for ridges
    const baseScale = 0.8 + window.rng.next() * 0.4;
    const size = window.rng.next() * 50 + 90; // 90 to 140
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${baseScale}, ${baseScale * 1.666})`);
    g.setAttribute("class", "mountain-shadow");
    g.style.pointerEvents = "none";

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
    g.style.pointerEvents = "none";

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

  drawDeadTree(x, y) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1.5)`);
    g.setAttribute("filter", "url(#drop-shadow)");
    g.style.pointerEvents = "none";

    const trunk = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // Twisted, sharp barren branches (simple stroke)
    trunk.setAttribute("d", "M -2,0 Q -5,-15 0,-25 L -10,-35 M 0,-25 L 8,-30 L 15,-25 M 5,-15 L 12,-10");
    trunk.setAttribute("stroke", "#453c5c");
    trunk.setAttribute("stroke-width", "4");
    trunk.setAttribute("stroke-linecap", "round");
    trunk.setAttribute("fill", "none");

    g.appendChild(trunk);
    this.renderQueue.push({ y: y, element: g });
  }

  drawIndustrialProp(x, y) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1.5)`);
    g.setAttribute("filter", "url(#drop-shadow)");
    g.style.pointerEvents = "none";

    const type = window.rng.next();
    if (type > 0.5) {
      // Small yellow/orange bent pipe
      const pipe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pipe.setAttribute("d", "M -12,0 L -12,-15 L 12,-15 L 12,0");
      pipe.setAttribute("stroke", "#ff8f00");
      pipe.setAttribute("stroke-width", "5");
      pipe.setAttribute("fill", "none");
      g.appendChild(pipe);
    } else {
      // Grey metal block
      const block = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      block.setAttribute("x", "-10");
      block.setAttribute("y", "-14");
      block.setAttribute("width", "20");
      block.setAttribute("height", "14");
      block.setAttribute("fill", "#546e7a");
      block.setAttribute("stroke", "#37474f");
      block.setAttribute("stroke-width", "2");
      g.appendChild(block);
    }

    this.renderQueue.push({ y: y, element: g });
  }

  drawBush(x, y, theme = 'python') {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const scale = 1 + window.rng.next() * 0.5;
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.setAttribute("filter", "url(#drop-shadow)");
    g.style.pointerEvents = "none";

    const bush = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // Simple 3-bump bush
    bush.setAttribute("d", "M -15,0 Q -20,-15 -5,-20 Q 0,-35 10,-20 Q 25,-15 15,0 Z");
    const color = theme === 'python' ? '#2e7d32' : '#8bc34a';
    bush.setAttribute("fill", color);

    g.appendChild(bush);
    this.renderQueue.push({ y: y, element: g });
  }

  drawGroundCrack(x, y) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1.5)`);
    g.style.pointerEvents = "none";

    const crack = document.createElementNS("http://www.w3.org/2000/svg", "path");
    crack.setAttribute("d", "M -10,10 L -5,5 L 0,15 L 10,0 L 5,-5");
    crack.setAttribute("stroke", "#352f44"); // Dark purple/grey
    crack.setAttribute("stroke-width", "2");
    crack.setAttribute("fill", "none");
    crack.setAttribute("stroke-linecap", "round");
    crack.setAttribute("stroke-linejoin", "round");

    g.appendChild(crack);
    this.renderQueue.push({ y: y, element: g });
  }

  drawSmallGear(x, y) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1.5)`);
    g.setAttribute("filter", "url(#drop-shadow)");
    g.style.pointerEvents = "none";

    // A simple gear shape (circle with teeth)
    const gear = document.createElementNS("http://www.w3.org/2000/svg", "path");
    gear.setAttribute("d", "M -5,-5 L -2,-8 L 2,-8 L 5,-5 L 8,-2 L 8,2 L 5,5 L 2,8 L -2,8 L -5,5 L -8,2 L -8,-2 Z M 0,-3 A 3 3 0 1 0 0,3 A 3 3 0 1 0 0,-3");
    gear.setAttribute("fill", "#78909c"); // Light metallic
    gear.setAttribute("stroke", "#455a64");
    gear.setAttribute("stroke-width", "1.5");

    g.appendChild(gear);
    this.renderQueue.push({ y: y, element: g });
  }

  drawGrassPatch(x, y) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1.5)`);
    g.style.pointerEvents = "none";

    const grass = document.createElementNS("http://www.w3.org/2000/svg", "path");
    grass.setAttribute("d", "M -5,5 Q -3,0 0,5 M 0,5 Q 3,-2 5,5 M 5,5 Q 7,1 10,5");
    grass.setAttribute("stroke", "#8bc34a");
    grass.setAttribute("stroke-width", "2");
    grass.setAttribute("fill", "none");
    grass.setAttribute("stroke-linecap", "round");

    g.appendChild(grass);
    this.renderQueue.push({ y: y, element: g });
  }
}

window.TerrainGenerator = TerrainGenerator;
