class TerrainGenerator {
  constructor(renderer, bounds, centerX, centerY) {
    this.renderer = renderer;
    this.width = renderer.width;
    this.height = renderer.height;
    this.bounds = bounds || { minX: 0, maxX: 5000, minY: 0, maxY: 4000 };
    this.centerX = centerX || 2500;
    this.centerY = centerY || 2000;
    this.regionsConfig = window.CodeVyuhRegions || [];

    // Phase 4C: Organic Territory Boundary Polygons
    // Mapped exactly to the winding river networks and natural coastline.
    this.territoryPolygons = {
      logic: [
        [-3000, -3100], [2500, -3100], [2500, -200], [2700, 600], [2920, 1500],
        [2000, 1500], [1000, 1000], [600, 400], [0, 0], [-3000, 0]
      ],
      debug: [
        [2500, -3100], [8600, -3100], [8600, 3500], 
        [5000, 4400], [4500, 3500], [3500, 3500], [2500, 3000],
        [3500, 2000], [2700, 600], [2500, -200]
      ],
      systems: [
        [-3000, 0], [0, 0], [600, 400], [1000, 1000], [2000, 1500], [2920, 1500],
        [2500, 3000], [1500, 4000], [1000, 4500], [-500, 4500], [-1000, 5000],
        [-1000, 7700], [-3000, 7700]
      ],
      python: [
        [2500, 3000], [3500, 3500], [4500, 3500], [5000, 4400], [8600, 4400],
        [8600, 7700], [-1000, 7700], [-1000, 5000], [-500, 4500], [1000, 4500], [1500, 4000]
      ]
    };

    // Phase 4E Recovery: Zone Templates with fractional offsets from territory centroid
    this.ecosystemZoneTemplates = [
      // Logic Dominion - 4 zones
      { id: "logic-campus-village", theme: "logic", offX: 0.05, offY: -0.2, radius: 220, sceneType: "academyVillage" },
      { id: "logic-garden", theme: "logic", offX: -0.2, offY: -0.15, radius: 180, sceneType: "gardenCampus" },
      { id: "logic-riverside", theme: "logic", offX: 0.15, offY: 0.05, radius: 160, sceneType: "riversideStudy" },
      { id: "logic-forest-edge", theme: "logic", offX: -0.15, offY: -0.05, radius: 180, sceneType: "forestEdge" },
      // Debug Wasteland - 4 zones
      { id: "debug-crystal-field", theme: "debug", offX: 0, offY: -0.2, radius: 250, sceneType: "crystalField" },
      { id: "debug-scar-zone", theme: "debug", offX: 0.2, offY: 0.1, radius: 200, sceneType: "scarZone" },
      { id: "debug-ruined-stone", theme: "debug", offX: -0.1, offY: 0.15, radius: 180, sceneType: "ruinedStone" },
      { id: "debug-rocky-border", theme: "debug", offX: -0.2, offY: -0.05, radius: 180, sceneType: "rockyBorder" },
      // Systems Republic - 4 zones
      { id: "systems-pipe-yard", theme: "systems", offX: -0.1, offY: -0.1, radius: 250, sceneType: "pipeYard" },
      { id: "systems-gear-cluster", theme: "systems", offX: 0.15, offY: 0.1, radius: 200, sceneType: "gearCluster" },
      { id: "systems-rail-zone", theme: "systems", offX: 0.1, offY: -0.15, radius: 180, sceneType: "railZone" },
      { id: "systems-industrial-outpost", theme: "systems", offX: -0.1, offY: 0.15, radius: 220, sceneType: "industrialOutpost" },
      // Python Wildlands - 5 zones
      { id: "python-dense-jungle", theme: "python", offX: 0.15, offY: 0.2, radius: 300, sceneType: "denseJungle" },
      { id: "python-overgrown-ruins", theme: "python", offX: -0.05, offY: 0.05, radius: 250, sceneType: "overgrownRuins" },
      { id: "python-vine-cluster", theme: "python", offX: 0.1, offY: -0.05, radius: 200, sceneType: "vineCluster" },
      { id: "python-tropical-edge", theme: "python", offX: -0.15, offY: -0.05, radius: 220, sceneType: "tropicalEdge" },
      { id: "python-temple-support", theme: "python", offX: 0.05, offY: 0.25, radius: 250, sceneType: "templeSupport" }
    ];

    this.DEBUG_ECOSYSTEM_ZONES = false;
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
    // Phase 4E Recovery: Computed ecosystem zones with robust fallback
    
    // 1. Natural Mountain Ridges
    this.generateMountainRidges(islandRx, islandRy);

    // 2. Compute territory bounds for all territories
    const territoryBounds = {};
    for (const [theme, polygon] of Object.entries(this.territoryPolygons)) {
      territoryBounds[theme] = this.computeTerritoryBounds(polygon);
    }

    // 3. Resolve and render authored ecosystem zones
    const zoneReport = [];
    let validZones = 0;
    let skippedZones = 0;
    const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];

    this.ecosystemZoneTemplates.forEach(template => {
      const polygon = this.territoryPolygons[template.theme];
      const bounds = territoryBounds[template.theme];
      const report = { id: template.id, theme: template.theme, rendered: false, propCount: 0, fallback: 'none', usedRadius10: false, reason: null, cx: 0, cy: 0 };

      // Compute candidate position: centroid + fractional offset of territory dimensions
      const candidateX = bounds.cx + bounds.width * template.offX;
      const candidateY = bounds.cy + bounds.height * template.offY;

      let finalX = null, finalY = null;

      // Attempt 1: Direct candidate (collision radius reduced to 20)
      if (this.validateEcosystemPoint(candidateX, candidateY, polygon, 20)) {
        finalX = candidateX;
        finalY = candidateY;
      } else {
        // Attempt 2: Ring search around candidate (80, 160, 240, 320px)
        const rings = [80, 160, 240, 320];
        let found = false;
        for (const r of rings) {
          for (const a of angles) {
            const tx = candidateX + Math.cos(a) * r;
            const ty = candidateY + Math.sin(a) * r;
            if (this.validateEcosystemPoint(tx, ty, polygon, 20)) {
              finalX = tx;
              finalY = ty;
              report.fallback = `ring(r=${r})`;
              found = true;
              break;
            }
          }
          if (found) break;
        }

        // Attempt 3: Centroid fallback
        if (!found) {
          if (this.validateEcosystemPoint(bounds.cx, bounds.cy, polygon, 20)) {
            finalX = bounds.cx;
            finalY = bounds.cy;
            report.fallback = 'centroid';
            found = true;
          }
        }

        // Attempt 4: Ring search around centroid
        if (!found) {
          for (const r of [100, 200, 300, 400]) {
            for (const a of angles) {
              const tx = bounds.cx + Math.cos(a) * r;
              const ty = bounds.cy + Math.sin(a) * r;
              if (this.validateEcosystemPoint(tx, ty, polygon, 20)) {
                finalX = tx;
                finalY = ty;
                report.fallback = `centroid-ring(r=${r})`;
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      }

      if (finalX !== null && finalY !== null) {
        report.rendered = true;
        report.cx = Math.round(finalX);
        report.cy = Math.round(finalY);
        const result = this.renderEcosystemZone(finalX, finalY, template.theme, polygon, template.radius, template.sceneType);
        report.propCount = result.propCount;
        report.usedRadius10 = result.usedRadius10;
        validZones++;
      } else {
        report.rendered = false;
        report.cx = Math.round(candidateX);
        report.cy = Math.round(candidateY);
        report.reason = 'All validation failed (candidate, ring, centroid)';
        skippedZones++;
      }

      // Debug visualization (only when flag is true)
      if (this.DEBUG_ECOSYSTEM_ZONES) {
        const cx = report.cx;
        const cy = report.cy;
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.style.pointerEvents = "none";
        
        let color = "white";
        if (template.theme === 'logic') color = "cyan";
        else if (template.theme === 'debug') color = "magenta"; // standard purple is hard to see, use magenta
        else if (template.theme === 'systems') color = "orange";
        else if (template.theme === 'python') color = "lime"; // standard green is hard to see, use lime

        // Circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", template.radius);
        circle.setAttribute("fill", report.rendered ? color : "red");
        circle.setAttribute("fill-opacity", "0.08");
        circle.setAttribute("stroke", report.rendered ? color : "red");
        circle.setAttribute("stroke-width", "3");
        if (!report.rendered) {
           circle.setAttribute("stroke-dasharray", "10,10");
        }
        g.appendChild(circle);

        // Center crosshair
        const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hLine.setAttribute("x1", cx - 15); hLine.setAttribute("y1", cy);
        hLine.setAttribute("x2", cx + 15); hLine.setAttribute("y2", cy);
        hLine.setAttribute("stroke", report.rendered ? color : "red");
        hLine.setAttribute("stroke-width", "3");
        g.appendChild(hLine);
        const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        vLine.setAttribute("x1", cx); vLine.setAttribute("y1", cy - 15);
        vLine.setAttribute("x2", cx); vLine.setAttribute("y2", cy + 15);
        vLine.setAttribute("stroke", report.rendered ? color : "red");
        vLine.setAttribute("stroke-width", "3");
        g.appendChild(vLine);

        // Text background and text
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", cx);
        text.setAttribute("y", cy - 25);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-family", "monospace");
        text.setAttribute("font-size", "24px");
        text.setAttribute("font-weight", "bold");
        text.setAttribute("fill", report.rendered ? "white" : "red");
        text.style.textShadow = "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000";
        
        const statusStr = report.rendered ? "✓ VALID" : "✗ INVALID";
        const extraInfo = report.rendered ? `[Props: ${report.propCount}]` : `[Reason: ${report.reason}]`;
        text.textContent = `${template.id} (${template.theme}) | ${statusStr} ${extraInfo}`;
        
        g.appendChild(text);

        // Add the group to the very front so it's not hidden by mountains
        // Using a high y-value for the Z-sorter
        this.renderQueue.push({ y: 999999, element: g });
      }

      zoneReport.push(report);
    });

    // 4. Light territory filler (only if territory looks sparse)
    const clusterTargets = { logic: 4, debug: 4, systems: 4, python: 5 };
    const clusterCounts = { logic: 0, debug: 0, systems: 0, python: 0 };
    let totalAttempts = 0;
    const maxAttempts = 3000;
    let targetsMet = false;

    while (!targetsMet && totalAttempts < maxAttempts) {
      totalAttempts++;
      const cx = this.playableBounds.minX + window.rng.next() * (this.playableBounds.maxX - this.playableBounds.minX);
      const cy = this.playableBounds.minY + window.rng.next() * (this.playableBounds.maxY - this.playableBounds.minY);
      
      if (this.isCollision(cx, cy, 20)) continue;

      let theme = null;
      let activePolygon = null;
      if (this.isPointInPolygon(cx, cy, this.territoryPolygons.logic)) { theme = 'logic'; activePolygon = this.territoryPolygons.logic; }
      else if (this.isPointInPolygon(cx, cy, this.territoryPolygons.debug)) { theme = 'debug'; activePolygon = this.territoryPolygons.debug; }
      else if (this.isPointInPolygon(cx, cy, this.territoryPolygons.systems)) { theme = 'systems'; activePolygon = this.territoryPolygons.systems; }
      else if (this.isPointInPolygon(cx, cy, this.territoryPolygons.python)) { theme = 'python'; activePolygon = this.territoryPolygons.python; }
      if (!theme || this.isNearPolygonEdge(cx, cy, activePolygon, 80)) continue;

      if (clusterCounts[theme] < clusterTargets[theme]) {
        clusterCounts[theme]++;
        for (let j = 0; j < 3; j++) {
          const jx = cx + (window.rng.next() * 160 - 80);
          const jy = cy + (window.rng.next() * 160 - 80);
          if (!this.isCollision(jx, jy, 20) && this.isPointInPolygon(jx, jy, activePolygon) && !this.isNearPolygonEdge(jx, jy, activePolygon, 40)) {
            if (theme === 'logic') this.drawTreeGroup(jx, jy, theme);
            else if (theme === 'python') this.drawTreeGroup(jx, jy, theme);
            else this.drawMountain(jx, jy, theme);
          }
        }
      }
      targetsMet = Object.keys(clusterTargets).every(k => clusterCounts[k] >= clusterTargets[k]);
    }

    // 5. Console report
    console.log(`=== ECOSYSTEM REPORT (PHASE 4G) ===`);
    console.log(`Total Zones Configured: ${this.ecosystemZoneTemplates.length}`);
    console.log(`Valid Zones Rendered: ${validZones}`);
    console.log(`Debug Overlay: ${this.DEBUG_ECOSYSTEM_ZONES ? 'ON' : 'OFF'}`);
    zoneReport.forEach(r => {
      if (r.rendered) {
        console.log(`  [${r.id}] -> Anchor: ${r.anchorType || 'none'} (Scale: ${r.anchorScale || 0}), Props: ${r.propCount}`);
      }
    });
    console.log(`===================================`);

    if (this.DEBUG_ECOSYSTEM_ZONES) {
      console.log(`=== ECOSYSTEM DEBUG VERBOSE ===`);
      zoneReport.forEach(r => {
        if (!r.rendered) console.log(`  [${r.id}] SKIPPED: ${r.reason}`);
      });
      console.log(`===============================`);
    }
  }
  
  generateMountainRidges(islandRx, islandRy) {
    const ridges = [
      // Central mountain ridges removed as requested
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

  renderEcosystemZone(cx, cy, theme, polygon, radius, sceneType) {
    let propsRendered = 0;
    let usedRadius10 = false;
    let mainAnchorType = 'none';
    let mainAnchorScale = 0;

    // Draw the subtle organic base patch (drawn beneath all props via renderQueue)
    this.drawOrganicPatch(cx, cy, radius, theme);

    // Per-prop collision fallback: try radius 20 first, then radius 10 if rejected
    const trySpawn = (spawnFn, argsArr, offsetX, offsetY) => {
      const jx = cx + offsetX;
      const jy = cy + offsetY;
      // Polygon and edge checks remain strict
      if (!this.isPointInPolygon(jx, jy, polygon) || this.isNearPolygonEdge(jx, jy, polygon, 40)) return;
      // Try collision radius 20 first
      if (!this.isCollision(jx, jy, 20)) {
        spawnFn.apply(this, [jx, jy, ...argsArr]);
        propsRendered++;
        return;
      }
      // Fallback to collision radius 10 if radius 20 rejected
      if (!this.isCollision(jx, jy, 10)) {
        spawnFn.apply(this, [jx, jy, ...argsArr]);
        propsRendered++;
        usedRadius10 = true;
      }
    };

    const randomOffset = (rad) => (window.rng.next() * rad * 2 - rad);
    const setAnchor = (type, scale) => { mainAnchorType = type; mainAnchorScale = scale; };

    // Scales: Anchor (7.5), Medium (6.0), Small (4.5)

    // LOGIC SCENES
    if (sceneType === 'academyVillage') {
      trySpawn(this.drawAcademyHouse, [7.5], 0, 0); setAnchor('AcademyHouse', 7.5);
      trySpawn(this.drawAcademyHouse, [6.0], randomOffset(radius*0.5), randomOffset(radius*0.5));
      for(let i=0; i<3; i++) trySpawn(this.drawStoneTile, [4.5], randomOffset(radius), randomOffset(radius));
      for(let i=0; i<2; i++) trySpawn(this.drawAcademyTree, [6.0], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'gardenCampus') {
      trySpawn(this.drawAcademyTree, [7.0], 0, 0); setAnchor('AcademyTree', 7.0);
      for(let i=0; i<4; i++) trySpawn(this.drawAcademyTree, [5.5], randomOffset(radius), randomOffset(radius));
      for(let i=0; i<3; i++) trySpawn(this.drawGrassPatch, [4.5], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'riversideStudy') {
      trySpawn(this.drawAcademyHouse, [7.0], 0, 0); setAnchor('AcademyHouse', 7.0);
      for(let i=0; i<3; i++) trySpawn(this.drawStoneTile, [4.5], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'forestEdge') {
      trySpawn(this.drawTreeGroup, [theme], 0, 0); setAnchor('TreeGroup', 6.0); // base scale inside function
      for(let i=0; i<4; i++) trySpawn(this.drawTreeGroup, [theme], randomOffset(radius), randomOffset(radius));
    }
    
    // DEBUG SCENES
    else if (sceneType === 'crystalField') {
      trySpawn(this.drawCrystal, [], 0, 0); setAnchor('Crystal', 8.0); // massive base scale inside
      for(let i=0; i<3; i++) trySpawn(this.drawCorruptCrystal, [6.0], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'scarZone') {
      trySpawn(this.drawDeadTree, [7.0], 0, 0); setAnchor('DeadTree', 7.0);
      for(let i=0; i<2; i++) trySpawn(this.drawGroundCrack, [6.0], randomOffset(radius), randomOffset(radius));
      trySpawn(this.drawDeadTree, [5.5], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'ruinedStone') {
      trySpawn(this.drawMountain, [theme], 0, 0); setAnchor('Stone/Mountain', 7.0);
      for(let i=0; i<3; i++) trySpawn(this.drawMountain, [theme], randomOffset(radius), randomOffset(radius));
      trySpawn(this.drawDeadTree, [5.5], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'rockyBorder') {
      trySpawn(this.drawMountain, [theme], 0, 0); setAnchor('Stone/Mountain', 7.0);
      for(let i=0; i<3; i++) trySpawn(this.drawMountain, [theme], randomOffset(radius), randomOffset(radius));
    }

    // SYSTEMS SCENES
    else if (sceneType === 'pipeYard') {
      trySpawn(this.drawTank, [7.5], 0, 0); setAnchor('Tank', 7.5);
      trySpawn(this.drawTank, [6.0], randomOffset(radius*0.5), randomOffset(radius*0.5));
      trySpawn(this.drawPipe, [cx + randomOffset(radius), cy + randomOffset(radius)], 0, 0);
      trySpawn(this.drawPipe, [cx + randomOffset(radius), cy + randomOffset(radius)], randomOffset(radius*0.5), randomOffset(radius*0.5));
    } else if (sceneType === 'gearCluster') {
      trySpawn(this.drawSmallGear, [7.0], 0, 0); setAnchor('LargeGear', 7.0);
      for(let i=0; i<3; i++) trySpawn(this.drawSmallGear, [5.0], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'railZone') {
      trySpawn(this.drawIndustrialProp, [7.0], 0, 0); setAnchor('IndustrialProp', 7.0);
      trySpawn(this.drawIndustrialProp, [5.5], randomOffset(radius), randomOffset(radius));
      for(let i=0; i<2; i++) trySpawn(this.drawSmallGear, [4.5], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'industrialOutpost') {
      trySpawn(this.drawTank, [7.0], 0, 0); setAnchor('Tank', 7.0);
      trySpawn(this.drawIndustrialProp, [5.5], randomOffset(radius), randomOffset(radius));
      trySpawn(this.drawSmallGear, [4.5], randomOffset(radius), randomOffset(radius));
    }

    // PYTHON SCENES
    else if (sceneType === 'denseJungle') {
      trySpawn(this.drawJungleBush, [7.5], 0, 0); setAnchor('JungleBush', 7.5);
      for(let i=0; i<3; i++) trySpawn(this.drawJungleBush, [6.0], randomOffset(radius), randomOffset(radius));
      for(let i=0; i<2; i++) trySpawn(this.drawVine, [5.5], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'overgrownRuins') {
      trySpawn(this.drawAncientRuin, [7.5], 0, 0); setAnchor('AncientRuin', 7.5);
      for(let i=0; i<2; i++) trySpawn(this.drawVine, [5.5], randomOffset(radius), randomOffset(radius));
      trySpawn(this.drawJungleBush, [5.5], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'vineCluster') {
      trySpawn(this.drawVine, [7.0], 0, 0); setAnchor('Vine', 7.0);
      for(let i=0; i<3; i++) trySpawn(this.drawVine, [5.5], randomOffset(radius), randomOffset(radius));
      trySpawn(this.drawAncientRuin, [6.0], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'tropicalEdge') {
      trySpawn(this.drawPalmTree, [], 0, 0); setAnchor('PalmTree', 7.0); // base scale inside
      for(let i=0; i<4; i++) trySpawn(this.drawTreeGroup, [theme], randomOffset(radius), randomOffset(radius));
    } else if (sceneType === 'templeSupport') {
      trySpawn(this.drawAncientRuin, [7.0], 0, 0); setAnchor('AncientRuin', 7.0);
      trySpawn(this.drawJungleBush, [6.0], randomOffset(radius), randomOffset(radius));
      trySpawn(this.drawVine, [5.0], randomOffset(radius), randomOffset(radius));
    }

    return { propCount: propsRendered, usedRadius10, anchorType: mainAnchorType, anchorScale: mainAnchorScale };
  }

  drawOrganicPatch(cx, cy, radius, theme) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    // Generate organic blob shape
    let d = "";
    const points = 10;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius * (0.8 + window.rng.next() * 0.2); // slight noise, not perfect circle
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) d += `M ${x},${y} `;
      else d += `L ${x},${y} `;
    }
    g.setAttribute("d", d + "Z");
    
    // SVG-safe hex fills with opacity attribute
    if (theme === 'logic') { g.setAttribute("fill", "#00bfa5"); g.setAttribute("opacity", "0.15"); }
    else if (theme === 'debug') { g.setAttribute("fill", "#6a1b9a"); g.setAttribute("opacity", "0.15"); }
    else if (theme === 'systems') { g.setAttribute("fill", "#4e342e"); g.setAttribute("opacity", "0.2"); }
    else if (theme === 'python') { g.setAttribute("fill", "#1b5e20"); g.setAttribute("opacity", "0.2"); }
    
    g.style.pointerEvents = "none";
    // Draw far beneath props, but above base terrain
    this.renderQueue.push({ y: cy - radius, element: g });
  }

  drawCrystal(x, y) {
    const size = window.rng.next() * 40 + 80; // Scaled up
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1.5, 2.5)`); // Made larger and taller
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
    g.setAttribute("transform", `translate(${x}, ${y}) scale(2.5)`); // Scaled up
    g.setAttribute("filter", "url(#drop-shadow)");
    g.style.pointerEvents = "none";

    const trunk = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trunk.setAttribute("d", "M -3,0 Q -8,-25 0,-50 Q 8,-25 3,0 Z"); // Thicker trunk
    trunk.setAttribute("fill", "#6d4c41");

    // Leaves
    const leaves = document.createElementNS("http://www.w3.org/2000/svg", "path");
    leaves.setAttribute("d", "M 0,-50 Q -30,-60 -40,-30 Q -15,-40 0,-50 M 0,-50 Q 30,-60 40,-30 Q 15,-40 0,-50 M 0,-50 Q 0,-85 -25,-70 Q 0,-60 0,-50 M 0,-50 Q 0,-85 25,-70 Q 0,-60 0,-50");
    leaves.setAttribute("stroke", "#2e7d32");
    leaves.setAttribute("stroke-width", "6");
    leaves.setAttribute("fill", "none");
    leaves.setAttribute("stroke-linecap", "round");

    g.appendChild(trunk);
    g.appendChild(leaves);
    this.renderQueue.push({ y: y, element: g });
  }

  drawMountain(x, y, theme = 'plains') {
    // Add slight natural variation to scale for ridges
    const baseScale = 1.2 + window.rng.next() * 0.4; // Scaled up
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
    g.setAttribute("transform", `translate(${x}, ${y}) scale(2.0, 3.3)`); // Scaled up significantly
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

  drawDeadTree(x, y, scale = 5.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.setAttribute("filter", "url(#drop-shadow)");
    g.style.pointerEvents = "none";

    const trunk = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // Twisted, sharp barren branches (simple stroke)
    trunk.setAttribute("d", "M -2,0 Q -5,-15 0,-25 L -10,-35 M 0,-25 L 8,-30 L 15,-25 M 5,-15 L 12,-10");
    trunk.setAttribute("stroke", "#453c5c");
    trunk.setAttribute("stroke-width", "6"); // Thicker
    trunk.setAttribute("stroke-linecap", "round");
    trunk.setAttribute("fill", "none");

    g.appendChild(trunk);
    this.renderQueue.push({ y: y, element: g });
  }

  drawIndustrialProp(x, y, scale = 5.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.setAttribute("filter", "url(#drop-shadow)");
    g.style.pointerEvents = "none";

    const type = window.rng.next();
    if (type > 0.5) {
      // Small yellow/orange bent pipe
      const pipe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pipe.setAttribute("d", "M -16,0 L -16,-20 L 16,-20 L 16,0");
      pipe.setAttribute("stroke", "#ff8f00");
      pipe.setAttribute("stroke-width", "8"); // Thicker pipe
      pipe.setAttribute("fill", "none");
      g.appendChild(pipe);
    } else {
      // Grey metal block
      const block = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      block.setAttribute("x", "-15");
      block.setAttribute("y", "-20");
      block.setAttribute("width", "30");
      block.setAttribute("height", "20");
      block.setAttribute("fill", "#546e7a");
      block.setAttribute("stroke", "#37474f");
      block.setAttribute("stroke-width", "4"); // Thicker stroke
      g.appendChild(block);
    }

    this.renderQueue.push({ y: y, element: g });
  }

  drawBush(x, y, theme = 'python') {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const scale = 3.5 + window.rng.next() * 1.5;
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

  drawGroundCrack(x, y, scale = 5.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";

    const crack = document.createElementNS("http://www.w3.org/2000/svg", "path");
    crack.setAttribute("d", "M -10,10 L -5,5 L 0,15 L 10,0 L 5,-5");
    crack.setAttribute("stroke", "#352f44"); // Dark purple/grey
    crack.setAttribute("stroke-width", "4"); // Thicker crack
    crack.setAttribute("fill", "none");
    crack.setAttribute("stroke-linecap", "round");
    crack.setAttribute("stroke-linejoin", "round");

    g.appendChild(crack);
    this.renderQueue.push({ y: y, element: g });
  }

  drawSmallGear(x, y, scale = 4.5) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.setAttribute("filter", "url(#drop-shadow)");
    g.style.pointerEvents = "none";

    // A simple gear shape (circle with teeth)
    const gear = document.createElementNS("http://www.w3.org/2000/svg", "path");
    gear.setAttribute("d", "M -5,-5 L -2,-8 L 2,-8 L 5,-5 L 8,-2 L 8,2 L 5,5 L 2,8 L -2,8 L -5,5 L -8,2 L -8,-2 Z M 0,-3 A 3 3 0 1 0 0,3 A 3 3 0 1 0 0,-3");
    gear.setAttribute("fill", "#78909c"); // Light metallic
    gear.setAttribute("stroke", "#455a64");
    gear.setAttribute("stroke-width", "2.5"); // Thicker stroke

    g.appendChild(gear);
    this.renderQueue.push({ y: y, element: g });
  }

  drawGrassPatch(x, y, scale = 4.5) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";

    const grass = document.createElementNS("http://www.w3.org/2000/svg", "path");
    grass.setAttribute("d", "M -5,5 Q -3,0 0,5 M 0,5 Q 3,-2 5,5 M 5,5 Q 7,1 10,5");
    grass.setAttribute("stroke", "#8bc34a");
    grass.setAttribute("stroke-width", "3"); // Thicker stroke
    grass.setAttribute("fill", "none");
    grass.setAttribute("stroke-linecap", "round");

    g.appendChild(grass);
    this.renderQueue.push({ y: y, element: g });
  }

  // --- NEW PHASE 4 REWORK TERRITORY-WIDE ECOSYSTEM HELPERS ---

  drawAcademyHouse(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.appendChild(this.createPoly("0,0 -20,-10 -20,-30 0,-20", "#b2ebf2"));
    g.appendChild(this.createPoly("0,0 20,-10 20,-30 0,-20", "#ffffff"));
    g.appendChild(this.createPoly("-25,-25 0,-40 25,-25 0,-15", "#00bcd4")); // Roof
    this.renderQueue.push({ y: y, element: g });
  }

  drawAcademyTree(x, y, scale = 3.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.appendChild(this.createPoly("-2,0 -2,-15 2,-15 2,0", "#795548")); // Trunk
    const canopy = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    canopy.setAttribute("cx", "0"); canopy.setAttribute("cy", "-20"); canopy.setAttribute("r", "15");
    canopy.setAttribute("fill", "#00bcd4");
    canopy.setAttribute("opacity", "0.8");
    g.appendChild(canopy);
    this.renderQueue.push({ y: y, element: g });
  }

  drawStoneTile(x, y, scale = 2.5) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    const tile = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    tile.setAttribute("points", "0,10 -15,0 0,-10 15,0");
    tile.setAttribute("fill", "#e0f7fa");
    tile.setAttribute("opacity", "0.6");
    g.appendChild(tile);
    this.renderQueue.push({ y: y, element: g });
  }

  drawCorruptCrystal(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.appendChild(this.createPoly("0,0 -10,-30 0,-50 10,-25", "#aa00ff"));
    g.appendChild(this.createPoly("0,0 10,-25 5,-40", "#ea80fc"));
    g.appendChild(this.createPoly("0,0 -12,-20 -5,-35", "#6a1b9a"));
    this.renderQueue.push({ y: y, element: g });
  }

  drawPipe(x, y, x2, y2) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.pointerEvents = "none";
    const pipe = document.createElementNS("http://www.w3.org/2000/svg", "line");
    pipe.setAttribute("x1", x); pipe.setAttribute("y1", y);
    pipe.setAttribute("x2", x2); pipe.setAttribute("y2", y2);
    pipe.setAttribute("stroke", "#78909c");
    pipe.setAttribute("stroke-width", "28"); // Very thick for readability
    g.appendChild(pipe);
    
    const joint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    joint.setAttribute("cx", x2); joint.setAttribute("cy", y2);
    joint.setAttribute("r", "20"); // Thicker joint
    joint.setAttribute("fill", "#ff8f00");
    g.appendChild(joint);
    this.renderQueue.push({ y: Math.max(y, y2), element: g });
  }

  drawTank(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.appendChild(this.createPoly("-15,0 15,0 15,-40 -15,-40", "#546e7a"));
    g.appendChild(this.createPoly("-15,-40 15,-40 0,-50", "#ffb300")); // Orange cap
    this.renderQueue.push({ y: y, element: g });
  }

  drawJungleBush(x, y, scale = 3.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    const c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c1.setAttribute("cx", "0"); c1.setAttribute("cy", "0"); c1.setAttribute("r", "20"); c1.setAttribute("fill", "#1b5e20");
    const c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c2.setAttribute("cx", "-10"); c2.setAttribute("cy", "10"); c2.setAttribute("r", "15"); c2.setAttribute("fill", "#33691e");
    const c3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c3.setAttribute("cx", "12"); c3.setAttribute("cy", "8"); c3.setAttribute("r", "18"); c3.setAttribute("fill", "#558b2f");
    g.appendChild(c1); g.appendChild(c2); g.appendChild(c3);
    this.renderQueue.push({ y: y, element: g });
  }

  drawAncientRuin(x, y, scale = 5.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.appendChild(this.createPoly("-20,0 20,0 20,-15 -20,-15", "#33691e")); // Mossy base
    g.appendChild(this.createPoly("-15,-15 5,-15 5,-40 -15,-40", "#558b2f")); // Broken pillar
    this.renderQueue.push({ y: y, element: g });
  }

  drawVine(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    const vine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    vine.setAttribute("d", "M -30,0 Q -15,15 0,0 T 30,0");
    vine.setAttribute("stroke", "#1b5e20");
    vine.setAttribute("stroke-width", "4");
    vine.setAttribute("fill", "none");
    g.appendChild(vine);
    this.renderQueue.push({ y: y, element: g });
  }

  // --- PHASE 4E RECOVERY HELPERS ---

  computeTerritoryBounds(polygon) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;
    polygon.forEach(([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      sumX += x; sumY += y;
    });
    return {
      minX, maxX, minY, maxY,
      cx: sumX / polygon.length,
      cy: sumY / polygon.length,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  validateEcosystemPoint(x, y, polygon, collisionRadius) {
    if (!this.isPointInPolygon(x, y, polygon)) return false;
    if (this.isNearPolygonEdge(x, y, polygon, 80)) return false;
    if (this.isCollision(x, y, collisionRadius)) return false;
    return true;
  }

  // --- PHASE 4C MATH CONTAINMENT HELPERS ---

  isPointInPolygon(x, y, polygon) {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }

  isNearPolygonEdge(x, y, polygon, padding) {
    const sqr = (v) => v * v;
    const dist2 = (v, w) => sqr(v[0] - w[0]) + sqr(v[1] - w[1]);
    const distToSegmentSquared = (p, v, w) => {
      const l2 = dist2(v, w);
      if (l2 === 0) return dist2(p, v);
      let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
      t = Math.max(0, Math.min(1, t));
      return dist2(p, [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]);
    };

    const paddingSq = padding * padding;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (distToSegmentSquared([x, y], polygon[i], polygon[j]) < paddingSq) {
        return true;
      }
    }
    return false;
  }

  createPoly(points, color) {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    p.setAttribute("points", points);
    p.setAttribute("fill", color);
    return p;
  }
}

window.TerrainGenerator = TerrainGenerator;
