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

    // Cache of road/river points for environment details collision detection
    this.infrastructurePoints = [];
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
    this.generateAuthoredRoads(); // Phase 4M-D: Authored Road Network
    this.generateAuthoredBridges(); // Phase 6A: Bridge Generation
    
    // 9. Ecology (Unified generation with Z-Sorting)
    this.renderQueue = renderQueue || [];
    console.log("Generating ecology overlay...");
    this.generateEcology(rx * 1.8, ry * 1.8);

    // Phase 5A: Procedural Environment Layer
    console.log("Generating environment details...");
    this.generateEnvironmentDetails(rx * 1.8, ry * 1.8);

    console.log("Map generation complete.");
    
    // If we own the queue, render it immediately. Otherwise defer to WorldEngine.
    if (!renderQueue) {
      this.renderQueue.sort((a, b) => a.y - b.y);
      this.renderQueue.forEach(item => {
        this.renderer.getLayer('terrain').appendChild(item.element);
      });
    }
  }

  isValidEnvironmentPoint(x, y, radius) {
    // Check civilization landmarks
    if (this.isCollision(x, y, radius)) return false;

    // Check roads and rivers (infrastructure)
    if (this.infrastructurePoints) {
      for (let i = 0; i < this.infrastructurePoints.length; i++) {
        const pt = this.infrastructurePoints[i];
        const dx = pt.x - x;
        const dy = pt.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Ensure a decent margin from any road/river
        if (dist < radius + 110) {
          return false;
        }
      }
    }
    return true;
  }

  generateEnvironmentDetails(islandRx, islandRy) {
    const layer = this.renderer.getLayer('environmentDetails');
    if (!layer) return;

    const originalQueue = this.renderQueue;
    this.renderQueue = [];

    const step = 200;
    for (let x = this.playableBounds.minX; x < this.playableBounds.maxX; x += step) {
      for (let y = this.playableBounds.minY; y < this.playableBounds.maxY; y += step) {
        
        const jitterX = x + (window.rng.next() * 150 - 75);
        const jitterY = y + (window.rng.next() * 150 - 75);

        const dx = jitterX - this.centerX;
        const dy = jitterY - this.centerY;
        const normalizedDist = (dx*dx)/(islandRx*islandRx) + (dy*dy)/(islandRy*islandRy);
        if (normalizedDist > 0.8) continue;

        if (!this.isValidEnvironmentPoint(jitterX, jitterY, 80)) continue;
        if (window.rng.next() > 0.5) continue;

        let biome = 'plains';
        if (this.isPointInPolygon(jitterX, jitterY, this.territoryPolygons.logic)) biome = 'logic';
        else if (this.isPointInPolygon(jitterX, jitterY, this.territoryPolygons.debug)) biome = 'debug';
        else if (this.isPointInPolygon(jitterX, jitterY, this.territoryPolygons.systems)) biome = 'systems';
        else if (this.isPointInPolygon(jitterX, jitterY, this.territoryPolygons.python)) biome = 'python';

        const r = window.rng.next();
        if (biome === 'logic') {
           if (r < 0.25) this.drawTreeGroup(jitterX, jitterY, 'logic');
           else if (r < 0.45) this.drawAcademyTree(jitterX, jitterY, 4.0);
           else if (r < 0.65) this.drawBush(jitterX, jitterY, 'logic');
           else if (r < 0.8) this.drawFlowerPatch(jitterX, jitterY, 4.0);
           else if (r < 0.9) this.drawStoneTile(jitterX, jitterY, 3.5);
           else this.drawGrassPatch(jitterX, jitterY, 4.5);
        } else if (biome === 'debug') {
           if (r < 0.25) this.drawDeadTree(jitterX, jitterY, 5.0);
           else if (r < 0.5) this.drawCorruptCrystal(jitterX, jitterY, 4.0);
           else if (r < 0.7) this.drawGroundCrack(jitterX, jitterY, 4.5);
           else if (r < 0.85) this.drawBurnedRock(jitterX, jitterY, 4.0);
           else this.drawDeadTree(jitterX, jitterY, 3.5);
        } else if (biome === 'systems') {
           if (r < 0.2) this.drawRockPile(jitterX, jitterY, 4.0);
           else if (r < 0.4) this.drawScrapMetal(jitterX, jitterY, 4.5);
           else if (r < 0.6) this.drawStorageCrate(jitterX, jitterY, 4.0);
           else if (r < 0.8) this.drawSmallGear(jitterX, jitterY, 4.5);
           else this.drawPipe(jitterX - 30, jitterY - 30, jitterX + 30, jitterY + 30);
        } else if (biome === 'python') {
           if (r < 0.25) this.drawJungleBush(jitterX, jitterY, 5.5);
           else if (r < 0.5) this.drawPalmTree(jitterX, jitterY);
           else if (r < 0.7) this.drawVine(jitterX, jitterY, 4.5);
           else if (r < 0.85) this.drawAncientRuin(jitterX, jitterY, 5.0);
           else this.drawRockPile(jitterX, jitterY, 4.5);
        } else {
           if (r < 0.6) this.drawTreeGroup(jitterX, jitterY, 'plains');
           else this.drawGrassPatch(jitterX, jitterY, 4.0);
        }
      }
    }

    this.renderQueue.sort((a, b) => a.y - b.y);
    this.renderQueue.forEach(item => {
      layer.appendChild(item.element);
    });

    this.renderQueue = originalQueue;
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
    const layer = this.renderer.getLayer('landmass');
    
    // 1. Coastline Depth/Shadow (Behind everything)
    const depthShadow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    depthShadow.setAttribute("d", baseLayerPath);
    depthShadow.setAttribute("fill", "none");
    depthShadow.setAttribute("stroke", "#003366");
    depthShadow.setAttribute("stroke-width", "360");
    depthShadow.setAttribute("stroke-linejoin", "round");
    depthShadow.setAttribute("stroke-linecap", "round");
    depthShadow.setAttribute("opacity", "0.65");
    layer.appendChild(depthShadow);

    // 2. Shallow Water Edge
    const shallowWater = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shallowWater.setAttribute("d", baseLayerPath);
    shallowWater.setAttribute("fill", "none");
    shallowWater.setAttribute("stroke", "#00acc1");
    shallowWater.setAttribute("stroke-width", "240");
    shallowWater.setAttribute("stroke-linejoin", "round");
    shallowWater.setAttribute("stroke-linecap", "round");
    shallowWater.setAttribute("opacity", "0.85");
    layer.appendChild(shallowWater);

    // 3. Wet Sand Edge
    const wetSand = document.createElementNS("http://www.w3.org/2000/svg", "path");
    wetSand.setAttribute("d", baseLayerPath);
    wetSand.setAttribute("fill", "none");
    wetSand.setAttribute("stroke", "#a1887f");
    wetSand.setAttribute("stroke-width", "90");
    wetSand.setAttribute("stroke-linejoin", "round");
    wetSand.setAttribute("stroke-linecap", "round");
    wetSand.setAttribute("opacity", "0.8");
    layer.appendChild(wetSand);

    // 4. Actual Beach Base
    const beach = document.createElementNS("http://www.w3.org/2000/svg", "path");
    beach.setAttribute("d", baseLayerPath);
    beach.setAttribute("fill", "#eecfa1"); // Sand
    beach.setAttribute("stroke", "#4dd0e1"); 
    beach.setAttribute("stroke-width", "24");
    beach.setAttribute("stroke-linejoin", "round");
    beach.setAttribute("stroke-linecap", "round");
    layer.appendChild(beach);
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
    const drawOrganicRiver = (riverConfig) => {
      let combinedPoints = [];
      riverConfig.segments.forEach(seg => {
        const pts = this.sampleBezierPath(seg.path, 150); // High res for organic meanders
        if (combinedPoints.length > 0) {
          // Avoid duplicate points at segment joins
          combinedPoints = combinedPoints.concat(pts.slice(1));
        } else {
          combinedPoints = pts;
        }
      });

      const taperConfigBase = {
        riverMode: true,
        startWidth: riverConfig.startWidth / 2,
        endWidth: riverConfig.endWidth / 2
      };

      const taperConfigCore = {
        riverMode: true,
        startWidth: (riverConfig.startWidth * 0.7) / 2,
        endWidth: (riverConfig.endWidth * 0.7) / 2
      };

      const riverBase = document.createElementNS("http://www.w3.org/2000/svg", "path");
      // Add a small noise amplitude (3) for natural, irregular shorelines
      riverBase.setAttribute("d", this.buildRoadPolygon(combinedPoints, 0, taperConfigBase, 3));
      riverBase.setAttribute("fill", riverConfig.baseColor);
      riverBase.setAttribute("stroke", "none");
      riverBase.setAttribute("opacity", riverConfig.baseOpacity);

      const riverCore = document.createElementNS("http://www.w3.org/2000/svg", "path");
      riverCore.setAttribute("d", this.buildRoadPolygon(combinedPoints, 0, taperConfigCore, 2));
      riverCore.setAttribute("fill", riverConfig.coreColor);
      riverCore.setAttribute("stroke", "none");
      riverCore.setAttribute("opacity", riverConfig.coreOpacity);
      
      this.renderer.getLayer('rivers').appendChild(riverBase);
      this.renderer.getLayer('rivers').appendChild(riverCore);
    };

    const drawLake = (cx, cy, rx, ry, baseColor, coreColor) => {
      const lakePath = this.generateIslandPath(cx, cy, rx, ry, 0.4);
      const lakeSvg = document.createElementNS("http://www.w3.org/2000/svg", "path");
      lakeSvg.setAttribute("d", lakePath);
      lakeSvg.setAttribute("fill", baseColor);
      lakeSvg.setAttribute("opacity", "0.75");
      
      const corePath = this.generateIslandPath(cx, cy, rx * 0.6, ry * 0.6, 0.3);
      const coreSvg = document.createElementNS("http://www.w3.org/2000/svg", "path");
      coreSvg.setAttribute("d", corePath);
      coreSvg.setAttribute("fill", coreColor);
      coreSvg.setAttribute("opacity", "0.9");
      coreSvg.setAttribute("filter", "drop-shadow(inset 0px 5px 10px rgba(0,0,0,0.3))");
      
      this.renderer.getLayer('rivers').appendChild(lakeSvg);
      this.renderer.getLayer('rivers').appendChild(coreSvg);
    };

    const drawNaturalRiverSystem = () => {
      // Natural Source and Confluence Lakes
      drawLake(2800, -20, 90, 60, "#00695c", "#26c6da"); // Highland Spring
      drawLake(2800, 1500, 220, 160, "#00695c", "#26c6da"); // Confluence Blending Bay

      // North-West River (Formerly Tributary 1): Flows from the central highlands to the NW ocean
      drawOrganicRiver({
        startWidth: 120, endWidth: 450,
        baseColor: "#00695c", coreColor: "#26c6da", baseOpacity: 0.75, coreOpacity: 0.9,
        segments: [
          { path: "M 2800,-20 C 2700,-200 2600,-400 2500,-700" },
          { path: "M 2500,-700 C 2400,-1000 2200,-1200 2000,-1500" }, // North Bridge crossing
          { path: "M 2000,-1500 C 1600,-1800 1200,-2200 800,-2500" },
          { path: "M 800,-2500 C 400,-2800 0,-3300 -500,-3800" }, // Extended to beach
          { path: "M -500,-3800 C -1000,-4300 -1500,-4600 -2000,-4800" } // Deep into ocean
        ]
      });

      // South-West Branch (Formerly Tributary 2): Flows from the West River down to the South ocean
      drawOrganicRiver({
        startWidth: 120, endWidth: 450,
        baseColor: "#00695c", coreColor: "#26c6da", baseOpacity: 0.75, coreOpacity: 0.9,
        segments: [
          { path: "M 2000,2000 C 2200,2800 2200,3400 1800,4000" }, // Splits far upstream from West River
          { path: "M 1800,4000 C 2000,4500 2200,5200 2500,5400" },
          { path: "M 2500,5400 C 2800,5600 3000,6000 3500,6500" }, // South Bridge crossing
          { path: "M 3500,6500 C 3800,7000 4000,7500 4300,8000" }, // Extended to beach
          { path: "M 4300,8000 C 4600,8500 4800,9000 5200,9500" }  // Deep into ocean
        ]
      });

      // The Great Divide (West River) - The Southern river reaching the ocean
      drawOrganicRiver({
        startWidth: 150, endWidth: 500,
        baseColor: "#00695c", coreColor: "#26c6da", baseOpacity: 0.75, coreOpacity: 0.9,
        segments: [
          { path: "M 2800,-20 C 2600,300 2400,500 2600,900" },
          { path: "M 2600,900 C 2800,1200 2900,1300 2800,1500" },
          { path: "M 2800,1500 C 2500,1800 2000,2000 1800,2400" },
          { path: "M 1800,2400 C 1600,2800 1500,3000 1400,3250" }, // GW Bridge intersection
          { path: "M 1400,3250 C 1300,3400 1000,3800 500,3800" },
          { path: "M 500,3800 C 0,3800 -500,3600 -1000,3600" },
          { path: "M -1000,3600 C -1800,3600 -2000,4200 -2600,4000" }, // Gentle meander added before ocean
          { path: "M -2600,4000 C -3200,3800 -3400,3800 -3800,4000" },
          // Final segment extending into the ocean
          { path: "M -3800,4000 C -4200,4300 -4800,4500 -5500,4800" }
        ]
      });

      // Eastern Basin (East River)
      drawOrganicRiver({
        startWidth: 200, endWidth: 500,
        baseColor: "#00695c", coreColor: "#26c6da", baseOpacity: 0.75, coreOpacity: 0.9,
        segments: [
          { path: "M 2800,1500 C 3000,1800 3500,1500 4000,1800" },
          { path: "M 4000,1800 C 4500,2100 4200,2500 4500,2500" },
          { path: "M 4500,2500 C 4800,2500 5200,2200 5500,2000" },
          { path: "M 5500,2000 C 6000,1800 6500,2500 7000,3000" },
          { path: "M 7000,3000 C 7500,3500 7800,4000 8300,4000" },
          { path: "M 8300,4000 C 8500,4000 8500,4300 8800,4200" }, // Gentle meander added before ocean
          // Final segment extending into the ocean
          { path: "M 8800,4200 C 9200,4400 9500,4600 9800,4800" }
        ]
      });
    };

    drawNaturalRiverSystem();
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

  renderLogicDominionVerticalSlice(bounds) {
    // 1. Anchor on exactly the same coordinate as LandmarkManager logic building (-476, -742)
    const rootX = -476;
    const rootY = -742;

    // Layering base priorities for strict Z-sorting
    const zBasePatch = rootY - 1500;
    const zRiver = rootY - 1400;
    const zRoads = rootY - 1300;
    const zPlaza = rootY - 100;
    
    // 1. Terrain Base Patch (Soft blur for better blending)
    const patchLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const patchShadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    patchShadow.setAttribute("cx", rootX); patchShadow.setAttribute("cy", rootY + 200);
    patchShadow.setAttribute("rx", 2400); patchShadow.setAttribute("ry", 1200);
    patchShadow.setAttribute("fill", "#64ffda"); // Soft cyan-green
    patchShadow.setAttribute("opacity", "0.15");
    patchShadow.setAttribute("filter", "blur(50px)");
    patchShadow.style.mixBlendMode = "multiply";
    patchLayer.appendChild(patchShadow);
    this.renderQueue.push({ y: zBasePatch, element: patchLayer });

    // 2. Natural River Meander (Multi-segment Bezier)
    const riverY = rootY + 600;
    const startX = rootX - 2500;
    const startY = riverY - 300;
    const endX = rootX + 2500;
    const endY = riverY + 100;
    
    const riverGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Smooth snaking river curves using bezier paths
    const makeRiverPath = (width) => `
      M ${startX}, ${startY - width/2}
      C ${rootX - 1000}, ${riverY - 800} ${rootX}, ${riverY + 600} ${rootX + 1500}, ${endY - width/4}
      C ${endX}, ${endY - width/6} ${endX}, ${endY + width/6} ${rootX + 1500}, ${endY + width/4}
      C ${rootX}, ${riverY + 1200} ${rootX - 1000}, ${riverY - 200} ${startX}, ${startY + width/2}
      Z
    `;
    
    const riverBanks = document.createElementNS("http://www.w3.org/2000/svg", "path");
    riverBanks.setAttribute("d", makeRiverPath(500));
    riverBanks.setAttribute("fill", "#006064");
    
    const riverWater = document.createElementNS("http://www.w3.org/2000/svg", "path");
    riverWater.setAttribute("d", makeRiverPath(380));
    riverWater.setAttribute("fill", "#00bcd4");
    
    const riverHigh = document.createElementNS("http://www.w3.org/2000/svg", "path");
    riverHigh.setAttribute("d", makeRiverPath(180));
    riverHigh.setAttribute("fill", "#80deea");

    riverGroup.appendChild(riverBanks);
    riverGroup.appendChild(riverWater);
    riverGroup.appendChild(riverHigh);
    this.renderQueue.push({ y: zRiver, element: riverGroup });

    // 3. Roads & Bridge
    const bridgeX = rootX - 800;
    const bridgeY = riverY - 50; 
    
    const plazaX = rootX;
    const plazaY = rootY; 
    
    const roadGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const dRoad = `
      M ${bridgeX - 1200}, ${bridgeY + 300}
      Q ${bridgeX - 400}, ${bridgeY + 200} ${bridgeX}, ${bridgeY}
      Q ${plazaX - 300}, ${plazaY + 200} ${plazaX}, ${plazaY + 400}
    `;
    const dirtRoad = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dirtRoad.setAttribute("d", dRoad);
    dirtRoad.setAttribute("fill", "none");
    dirtRoad.setAttribute("stroke", "#a1887f");
    dirtRoad.setAttribute("stroke-width", "140");
    dirtRoad.setAttribute("stroke-linecap", "round");
    
    const stoneRoad = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stoneRoad.setAttribute("d", dRoad);
    stoneRoad.setAttribute("fill", "none");
    stoneRoad.setAttribute("stroke", "#d7ccc8");
    stoneRoad.setAttribute("stroke-width", "70");
    stoneRoad.setAttribute("stroke-linecap", "round");
    
    roadGroup.appendChild(dirtRoad);
    roadGroup.appendChild(stoneRoad);
    this.renderQueue.push({ y: zRoads, element: roadGroup });

    // The bridge object
    const bridgeObj = this.createVerticalSliceBridge(bridgeX, bridgeY, -30);
    bridgeObj.setAttribute("transform", `translate(${bridgeX}, ${bridgeY}) rotate(-30) scale(3.5)`);
    this.renderQueue.push({ y: bridgeY, element: bridgeObj });

    // 4. Organic Plaza (Intersecting Diamonds)
    const plazaGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const drawDiamond = (cx, cy, rw, rh, thick) => {
      plazaGroup.appendChild(this.createPoly(`${cx},${cy + rh} ${cx + rw},${cy} ${cx + rw},${cy + thick} ${cx},${cy + rh + thick}`, "#90a4ae"));
      plazaGroup.appendChild(this.createPoly(`${cx},${cy + rh} ${cx - rw},${cy} ${cx - rw},${cy + thick} ${cx},${cy + rh + thick}`, "#b0bec5"));
      plazaGroup.appendChild(this.createPoly(`${cx},${cy - rh} ${cx + rw},${cy} ${cx},${cy + rh} ${cx - rw},${cy}`, "#eceff1"));
    };

    // Shadow for entire plaza group
    const plazaShadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    plazaShadow.setAttribute("cx", plazaX); plazaShadow.setAttribute("cy", plazaY + 150);
    plazaShadow.setAttribute("rx", 1400); plazaShadow.setAttribute("ry", 700);
    plazaShadow.setAttribute("fill", "rgba(0,0,0,0.3)");
    plazaShadow.setAttribute("filter", "blur(20px)");
    plazaGroup.appendChild(plazaShadow);

    // North wing
    drawDiamond(plazaX + 300, plazaY - 200, 700, 350, 100);
    // West wing
    drawDiamond(plazaX - 400, plazaY + 200, 800, 400, 120);
    // Main central plaza
    drawDiamond(plazaX, plazaY, 1000, 500, 150);
    
    this.renderQueue.push({ y: zPlaza, element: plazaGroup });

    // 5. Canopy Masses (Radius 600-800)
    const forest1X = rootX - 1600;
    const forest1Y = rootY - 600;
    const canopy1 = this.createVerticalSliceCanopy(forest1X, forest1Y, 800, 500);
    this.renderQueue.push({ y: forest1Y + 200, element: canopy1 });

    const forest2X = rootX + 1500;
    const forest2Y = rootY + 300;
    const canopy2 = this.createVerticalSliceCanopy(forest2X, forest2Y, 700, 450);
    this.renderQueue.push({ y: forest2Y + 200, element: canopy2 });

    const forest3X = rootX + 800;
    const forest3Y = rootY - 900;
    const canopy3 = this.createVerticalSliceCanopy(forest3X, forest3Y, 600, 400);
    this.renderQueue.push({ y: forest3Y + 200, element: canopy3 });

    // 6. Secondary Buildings (Distinct stylized types)
    // Note: Main Academy is NOT drawn here; LandmarkManager draws it at (rootX, rootY)!
    
    // Library (North-East wing)
    this.drawAcademyLibrary(plazaX + 600, plazaY - 150, 16.0);
    
    // Temple (North-West wing)
    this.drawAcademyTemple(plazaX - 300, plazaY - 200, 14.0);
    
    // Dormitories (West/South-West wing)
    this.drawAcademyDorm(plazaX - 600, plazaY + 150, 12.0);
    this.drawAcademyDorm(plazaX - 300, plazaY + 300, 12.0);

    // 7. Ground Details and Edge Trees
    for (let i = 0; i < 20; i++) {
        const tx = plazaX - 800 + window.rng.next() * 1600;
        const ty = plazaY - 300 + window.rng.next() * 600;
        const tempG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const ogLayer = this.renderer.getLayer.bind(this.renderer);
        this.renderer.getLayer = () => tempG;
        this.drawStoneTile(tx, ty, 8.0 + window.rng.next() * 4);
        this.renderer.getLayer = ogLayer;
        const finalTile = tempG.firstChild;
        if(finalTile) this.renderQueue.push({ y: ty, element: finalTile });
    }

    // Edge framing trees (Large, Scale 18)
    this.renderAcademyTreeCustom(forest1X + 600, forest1Y + 300, 18.0, forest1Y + 300);
    this.renderAcademyTreeCustom(forest1X - 600, forest1Y + 200, 18.0, forest1Y + 200);
    this.renderAcademyTreeCustom(forest2X - 500, forest2Y + 350, 18.0, forest2Y + 350);
    this.renderAcademyTreeCustom(plazaX, plazaY + 700, 20.0, plazaY + 700); // Front focal tree
  }

  renderDebugWastelandVerticalSlice(bounds) {
    // 1. Anchor on explicitly hardcoded Debug Wasteland Landmark center
    const rootX = 6076;
    const rootY = -742;

    // Layering base priorities for strict Z-sorting
    const zBasePatch = rootY - 1500;
    const zScar = rootY - 1400;
    const zRoads = rootY - 1300;
    const zFoundation = rootY - 100;
    
    // 1. Cracked Dark Terrain Base (Radius 1600px)
    // Deep purple/grey blend to visually poison the grass
    const patchLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const patchShadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    patchShadow.setAttribute("cx", rootX); patchShadow.setAttribute("cy", rootY + 200);
    patchShadow.setAttribute("rx", 1600); patchShadow.setAttribute("ry", 800);
    patchShadow.setAttribute("fill", "#311b92"); // Deep purple
    patchShadow.setAttribute("opacity", "0.25");
    patchShadow.setAttribute("filter", "blur(40px)");
    patchShadow.style.mixBlendMode = "multiply";
    patchLayer.appendChild(patchShadow);
    this.renderQueue.push({ y: zBasePatch, element: patchLayer });

    // 2. Corruption Fissures (Radiating outwards like cracked glass)
    const scarGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Crack helper
    const drawFissure = (dPath, widthOuter, widthInner) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const rim = document.createElementNS("http://www.w3.org/2000/svg", "path");
      rim.setAttribute("d", dPath);
      rim.setAttribute("fill", "none");
      rim.setAttribute("stroke", "#1a1a1a");
      rim.setAttribute("stroke-width", widthOuter);
      rim.setAttribute("stroke-linejoin", "miter");
      
      const mid = document.createElementNS("http://www.w3.org/2000/svg", "path");
      mid.setAttribute("d", dPath);
      mid.setAttribute("fill", "none");
      mid.setAttribute("stroke", "#311b92");
      mid.setAttribute("stroke-width", widthInner);
      mid.setAttribute("stroke-linejoin", "miter");
      
      const core = document.createElementNS("http://www.w3.org/2000/svg", "path");
      core.setAttribute("d", dPath);
      core.setAttribute("fill", "none");
      core.setAttribute("stroke", "#e91e63");
      core.setAttribute("stroke-width", "40"); // thin neon core
      core.setAttribute("stroke-linejoin", "miter");
      core.setAttribute("filter", "blur(4px)");
      
      g.appendChild(rim); g.appendChild(mid); g.appendChild(core);
      return g;
    };

    // West crack
    const dWest = `M ${rootX},${rootY} L ${rootX - 500},${rootY + 100} L ${rootX - 900},${rootY - 150} L ${rootX - 1400},${rootY + 50}`;
    scarGroup.appendChild(drawFissure(dWest, 250, 100));

    // South crack
    const dSouth = `M ${rootX},${rootY} L ${rootX + 200},${rootY + 600} L ${rootX - 100},${rootY + 1000} L ${rootX + 300},${rootY + 1300}`;
    scarGroup.appendChild(drawFissure(dSouth, 200, 80));

    // East crack
    const dEast = `M ${rootX},${rootY} L ${rootX + 600},${rootY - 100} L ${rootX + 1100},${rootY + 200} L ${rootX + 1500},${rootY - 50}`;
    scarGroup.appendChild(drawFissure(dEast, 180, 70));

    this.renderQueue.push({ y: zScar, element: scarGroup });

    // 3. Broken Roads (Entering from the West/Logic Bridge)
    const roadX = rootX - 1600;
    const roadY = rootY - 100;
    const roadGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const dRoad = `
      M ${roadX}, ${roadY}
      L ${rootX - 1000}, ${rootY + 100}
      L ${rootX - 500}, ${rootY + 50}
      L ${rootX - 200}, ${rootY + 300}
    `;
    
    const dirtRoad = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dirtRoad.setAttribute("d", dRoad);
    dirtRoad.setAttribute("fill", "none");
    dirtRoad.setAttribute("stroke", "#3e2723"); // Dark dirt
    dirtRoad.setAttribute("stroke-width", "120");
    dirtRoad.setAttribute("stroke-linecap", "square"); // sharp cracked breaks
    
    const brokenPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    brokenPath.setAttribute("d", dRoad);
    brokenPath.setAttribute("fill", "none");
    brokenPath.setAttribute("stroke", "#424242"); // Cracked stone
    brokenPath.setAttribute("stroke-width", "60");
    brokenPath.setAttribute("stroke-linecap", "square");
    brokenPath.setAttribute("stroke-dasharray", "80, 40"); // Gives a broken, shattered look
    
    roadGroup.appendChild(dirtRoad);
    roadGroup.appendChild(brokenPath);
    this.renderQueue.push({ y: zRoads, element: roadGroup });

    // 4. Ruined Foundation (Width 1400px)
    const foundationGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const plazaX = rootX;
    const plazaY = rootY;
    
    const foundationShadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    foundationShadow.setAttribute("cx", plazaX); foundationShadow.setAttribute("cy", plazaY + 100);
    foundationShadow.setAttribute("rx", 800); foundationShadow.setAttribute("ry", 400);
    foundationShadow.setAttribute("fill", "rgba(0,0,0,0.5)");
    foundationShadow.setAttribute("filter", "blur(20px)");
    foundationGroup.appendChild(foundationShadow);

    const rw = 700; // Total width 1400
    const rh = 350;
    const thick = 80;
    
    // Jagged ruined foundation
    foundationGroup.appendChild(this.createPoly(`${plazaX},${plazaY + rh} ${plazaX + rw},${plazaY} ${plazaX + rw - 100},${plazaY + thick} ${plazaX},${plazaY + rh + thick}`, "#1a1a1a"));
    foundationGroup.appendChild(this.createPoly(`${plazaX},${plazaY + rh} ${plazaX - rw},${plazaY} ${plazaX - rw + 150},${plazaY + thick} ${plazaX},${plazaY + rh + thick}`, "#333333"));
    foundationGroup.appendChild(this.createPoly(`${plazaX},${plazaY - rh} ${plazaX + rw},${plazaY} ${plazaX},${plazaY + rh} ${plazaX - rw},${plazaY}`, "#424242"));
    
    this.renderQueue.push({ y: zFoundation, element: foundationGroup });

    // 5. Dead Tree Masses (Radius ~400px)
    const deadForest1X = rootX - 1000;
    const deadForest1Y = rootY - 400;
    const deadForest1 = this.createDeadTreeMass(deadForest1X, deadForest1Y, 400, 250);
    this.renderQueue.push({ y: deadForest1Y + 100, element: deadForest1 });

    const deadForest2X = rootX + 900;
    const deadForest2Y = rootY + 200;
    const deadForest2 = this.createDeadTreeMass(deadForest2X, deadForest2Y, 450, 280);
    this.renderQueue.push({ y: deadForest2Y + 100, element: deadForest2 });

    // 6. Grouped Crystal Fields (Distributed to Perimeter)
    // NW Field
    this.drawCorruptedCrystalCluster(rootX - 500, rootY - 200, 14.0);
    this.drawCorruptedCrystalCluster(rootX - 600, rootY - 300, 18.0);
    // East Field
    this.drawCorruptedCrystalCluster(rootX + 650, rootY + 100, 16.0);
    this.drawCorruptedCrystalCluster(rootX + 800, rootY + 250, 18.0);
    this.drawCorruptedCrystalCluster(rootX + 950, rootY + 150, 14.0);
    // South Field
    this.drawCorruptedCrystalCluster(rootX - 100, rootY + 450, 15.0);
    this.drawCorruptedCrystalCluster(rootX + 150, rootY + 550, 20.0); // Hero crystal peeking out
    
    // 7. Small Ruined Buildings (Scale 10 to 14)
    // Note: Main Tower is drawn by LandmarkManager at (rootX, rootY)
    this.drawRuinedBuilding(plazaX + 300, plazaY - 100, 14.0);
    this.drawRuinedBuilding(plazaX - 250, plazaY - 150, 12.0);
    this.drawRuinedBuilding(plazaX - 400, plazaY + 150, 10.0);
  }

  renderSystemsRepublicVerticalSlice(bounds) {
    // 1. Anchor on explicitly hardcoded Systems Republic Landmark center
    const rootX = -476;
    const rootY = 5342;

    // Layering base priorities for strict Z-sorting
    const zBasePatch = rootY - 1500;
    const zRoads = rootY - 1400;
    const zPipes = rootY - 1300;
    const zFoundation = rootY - 100;
    
    // 1. Industrial Base Platform
    const foundationGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Isometric Metal Octagon Base
    // Scaled to a massive 1000px radius to perfectly frame the 1700px wide fog-of-war lock cloud!
    const rL = 1000; // long radius
    const rS = 500;  // short radius
    const rhL = 500; // long height
    const rhS = 250; // short height
    const thick = 60;
    
    // Octagon Top Face (#78909c)
    const baseOct = `
      ${rootX - rS},${rootY - rhL} 
      ${rootX + rS},${rootY - rhL}
      ${rootX + rL},${rootY - rhS}
      ${rootX + rL},${rootY + rhS}
      ${rootX + rS},${rootY + rhL}
      ${rootX - rS},${rootY + rhL}
      ${rootX - rL},${rootY + rhS}
      ${rootX - rL},${rootY - rhS}
    `;
    foundationGroup.appendChild(this.createPoly(baseOct, "#78909c"));

    // Deep Drop Edges (Thickness)
    const edge1 = `${rootX + rL},${rootY + rhS} ${rootX + rS},${rootY + rhL} ${rootX + rS},${rootY + rhL + thick} ${rootX + rL},${rootY + rhS + thick}`;
    const edge2 = `${rootX + rS},${rootY + rhL} ${rootX - rS},${rootY + rhL} ${rootX - rS},${rootY + rhL + thick} ${rootX + rS},${rootY + rhL + thick}`;
    const edge3 = `${rootX - rS},${rootY + rhL} ${rootX - rL},${rootY + rhS} ${rootX - rL},${rootY + rhS + thick} ${rootX - rS},${rootY + rhL + thick}`;
    
    foundationGroup.appendChild(this.createPoly(edge1, "#37474f"));
    foundationGroup.appendChild(this.createPoly(edge2, "#455a64"));
    foundationGroup.appendChild(this.createPoly(edge3, "#263238"));

    // High-Contrast Grating Strips across the floor to make it clearly engineered
    const stripe1 = `${rootX - 600},${rootY + 300} ${rootX + 600},${rootY - 300} ${rootX + 650},${rootY - 275} ${rootX - 550},${rootY + 325}`;
    const stripe2 = `${rootX - 700},${rootY + 250} ${rootX + 500},${rootY - 350} ${rootX + 550},${rootY - 325} ${rootX - 650},${rootY + 275}`;
    foundationGroup.appendChild(this.createPoly(stripe1, "#263238"));
    foundationGroup.appendChild(this.createPoly(stripe2, "#263238"));

    this.renderQueue.push({ y: zFoundation, element: foundationGroup });

    // 2. Mechanical Road Connection
    const roadGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const dRoad = `
      M ${rootX}, ${rootY - 500}
      L ${rootX - 400}, ${rootY - 1100}
      L ${rootX - 300}, ${rootY - 1600}
    `;
    const steelRoad = document.createElementNS("http://www.w3.org/2000/svg", "path");
    steelRoad.setAttribute("d", dRoad);
    steelRoad.setAttribute("fill", "none");
    steelRoad.setAttribute("stroke", "#455a64"); // Dark metal
    steelRoad.setAttribute("stroke-width", "120");
    steelRoad.setAttribute("stroke-linejoin", "bevel");
    
    const railLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    railLine.setAttribute("d", dRoad);
    railLine.setAttribute("fill", "none");
    railLine.setAttribute("stroke", "#ffb300"); // caution yellow/amber stripe
    railLine.setAttribute("stroke-width", "10");
    railLine.setAttribute("stroke-dasharray", "40, 20");
    
    roadGroup.appendChild(steelRoad);
    roadGroup.appendChild(railLine);
    this.renderQueue.push({ y: zRoads, element: roadGroup });

    // 3. Structured Pipe Network
    // Bridging from the central safe zone all the way out to ±1000px bounds
    const pipeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const makePipe = (x1, y1, x2, y2, width) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const pipe = document.createElementNS("http://www.w3.org/2000/svg", "line");
      pipe.setAttribute("x1", x1); pipe.setAttribute("y1", y1);
      pipe.setAttribute("x2", x2); pipe.setAttribute("y2", y2);
      pipe.setAttribute("stroke", "#102027");
      pipe.setAttribute("stroke-width", width);
      pipe.setAttribute("stroke-linecap", "round");
      
      const highlight = document.createElementNS("http://www.w3.org/2000/svg", "line");
      highlight.setAttribute("x1", x1); highlight.setAttribute("y1", y1);
      highlight.setAttribute("x2", x2); highlight.setAttribute("y2", y2);
      highlight.setAttribute("stroke", "#78909c");
      highlight.setAttribute("stroke-width", width * 0.4);
      highlight.setAttribute("stroke-linecap", "round");

      // Glowing valve/joint (small)
      const joint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      joint.setAttribute("cx", x2); joint.setAttribute("cy", y2);
      joint.setAttribute("r", width * 0.4);
      joint.setAttribute("fill", "#ff9800"); 
      
      g.appendChild(pipe);
      g.appendChild(highlight);
      g.appendChild(joint);
      return g;
    };

    // Right Pipe (Eastwards to Tanks)
    pipeGroup.appendChild(makePipe(rootX + 400, rootY + 200, rootX + 1000, rootY + 500, 120));
    
    // Left Pipe (Westwards to Gears)
    pipeGroup.appendChild(makePipe(rootX - 400, rootY + 200, rootX - 1000, rootY + 500, 120));
    
    // South Pipe (Down to Energy Core)
    pipeGroup.appendChild(makePipe(rootX, rootY + 400, rootX, rootY + 800, 120));

    this.renderQueue.push({ y: zPipes, element: pipeGroup });

    // 4. Perimeter Machinery Clusters
    // Hugging the massive cloud tightly at ±1000px limits to ensure perfect visibility
    
    // East Sector (Cooling & Tanks)
    this.drawSystemsCoolingTower(rootX + 1000, rootY + 100, 24.0);
    this.drawSystemsTank(rootX + 1150, rootY + 200, 24.0);
    this.drawSystemsTank(rootX + 850, rootY + 250, 20.0);
    
    // West Sector (Gear Yards)
    this.drawSystemsGearCluster(rootX - 1000, rootY + 200, 24.0);
    this.drawSystemsGearCluster(rootX - 1200, rootY + 300, 20.0);
    
    // South Sector (Energy Core - Hero piece)
    this.drawSystemsEnergyCore(rootX, rootY + 800, 28.0);
  }

  renderPythonWildlandsVerticalSlice(bounds) {
    // 1. Anchor on explicitly hardcoded Python Wildlands Landmark center
    const rootX = 6076;
    const rootY = 5342;

    // Layering base priorities for strict Z-sorting
    const zBasePatch = rootY - 1500;
    const zWater = rootY - 1400;
    const zRoads = rootY - 1300;
    const zFoundation = rootY - 100;
    
    // 1. Ancient Mossy Stone Foundation
    const foundationGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Isometric Stone Base (1000px radius to perfectly frame the temple)
    const rL = 1000; // long radius
    const rS = 500;  // short radius
    const rhL = 500; // long height
    const rhS = 250; // short height
    const thick = 80;
    
    // Base Face (Mossy grey-green)
    const baseOct = `
      ${rootX - rS},${rootY - rhL} 
      ${rootX + rS},${rootY - rhL}
      ${rootX + rL},${rootY - rhS}
      ${rootX + rL},${rootY + rhS}
      ${rootX + rS},${rootY + rhL}
      ${rootX - rS},${rootY + rhL}
      ${rootX - rL},${rootY + rhS}
      ${rootX - rL},${rootY - rhS}
    `;
    foundationGroup.appendChild(this.createPoly(baseOct, "#607d8b"));

    // Drop Edges (Darker mossy stone thickness)
    const edge1 = `${rootX + rL},${rootY + rhS} ${rootX + rS},${rootY + rhL} ${rootX + rS},${rootY + rhL + thick} ${rootX + rL},${rootY + rhS + thick}`;
    const edge2 = `${rootX + rS},${rootY + rhL} ${rootX - rS},${rootY + rhL} ${rootX - rS},${rootY + rhL + thick} ${rootX + rS},${rootY + rhL + thick}`;
    const edge3 = `${rootX - rS},${rootY + rhL} ${rootX - rL},${rootY + rhS} ${rootX - rL},${rootY + rhS + thick} ${rootX - rS},${rootY + rhL + thick}`;
    
    foundationGroup.appendChild(this.createPoly(edge1, "#37474f"));
    foundationGroup.appendChild(this.createPoly(edge2, "#263238"));
    foundationGroup.appendChild(this.createPoly(edge3, "#1c313a"));

    // Cracked Paving & Moss Overlays
    const paving1 = `${rootX - 400},${rootY + 100} ${rootX + 300},${rootY - 250} ${rootX + 350},${rootY - 200} ${rootX - 350},${rootY + 150}`;
    const paving2 = `${rootX + 400},${rootY + 100} ${rootX - 300},${rootY - 250} ${rootX - 250},${rootY - 200} ${rootX + 450},${rootY + 150}`;
    foundationGroup.appendChild(this.createPoly(paving1, "#455a64"));
    foundationGroup.appendChild(this.createPoly(paving2, "#2e7d32")); // Deep moss stripe

    this.renderQueue.push({ y: zFoundation, element: foundationGroup });

    // 2. Organic Jungle Stream (crossing the southern edge)
    const streamGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const dStream = `
      M ${rootX - 1100}, ${rootY + 400}
      Q ${rootX - 600}, ${rootY + 600} ${rootX}, ${rootY + 700}
      Q ${rootX + 600}, ${rootY + 800} ${rootX + 1100}, ${rootY + 500}
    `;
    const streamBase = document.createElementNS("http://www.w3.org/2000/svg", "path");
    streamBase.setAttribute("d", dStream);
    streamBase.setAttribute("fill", "none");
    streamBase.setAttribute("stroke", "#004d40"); // dark teal bank
    streamBase.setAttribute("stroke-width", "160");
    streamBase.setAttribute("stroke-linecap", "round");
    
    const streamWater = document.createElementNS("http://www.w3.org/2000/svg", "path");
    streamWater.setAttribute("d", dStream);
    streamWater.setAttribute("fill", "none");
    streamWater.setAttribute("stroke", "#00897b"); // bright cyan/teal water
    streamWater.setAttribute("stroke-width", "100");
    streamWater.setAttribute("stroke-linecap", "round");
    
    const streamHighlight = document.createElementNS("http://www.w3.org/2000/svg", "path");
    streamHighlight.setAttribute("d", dStream);
    streamHighlight.setAttribute("fill", "none");
    streamHighlight.setAttribute("stroke", "#4db6ac");
    streamHighlight.setAttribute("stroke-width", "20");
    streamHighlight.setAttribute("stroke-dasharray", "80, 40");
    streamHighlight.setAttribute("stroke-linecap", "round");
    
    streamGroup.appendChild(streamBase);
    streamGroup.appendChild(streamWater);
    streamGroup.appendChild(streamHighlight);
    this.renderQueue.push({ y: zWater, element: streamGroup });

    // 3. Cracked Stone Path
    const pathGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const dPath = `
      M ${rootX}, ${rootY - 200}
      L ${rootX - 100}, ${rootY + 200}
      L ${rootX + 50}, ${rootY + 600}
      L ${rootX - 200}, ${rootY + 1100}
    `;
    const stonePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stonePath.setAttribute("d", dPath);
    stonePath.setAttribute("fill", "none");
    stonePath.setAttribute("stroke", "#78909c");
    stonePath.setAttribute("stroke-width", "80");
    stonePath.setAttribute("stroke-linejoin", "round");
    
    const pathMoss = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathMoss.setAttribute("d", dPath);
    pathMoss.setAttribute("fill", "none");
    pathMoss.setAttribute("stroke", "#1b5e20");
    pathMoss.setAttribute("stroke-width", "20");
    pathMoss.setAttribute("stroke-dasharray", "30, 50");
    
    pathGroup.appendChild(stonePath);
    pathGroup.appendChild(pathMoss);
    this.renderQueue.push({ y: zRoads, element: pathGroup });

    // 4. Massive Dense Jungle Canopy Masses (Framing the temple)
    // Placed at perimeters so the center is 100% visible
    const canopy1 = this.createVerticalSliceCanopy(rootX - 800, rootY - 100, 600, 400); // West massive
    const canopy2 = this.createVerticalSliceCanopy(rootX + 850, rootY - 50, 550, 350);  // East massive
    const canopy3 = this.createVerticalSliceCanopy(rootX - 500, rootY - 500, 450, 250); // NW fill
    const canopy4 = this.createVerticalSliceCanopy(rootX + 500, rootY + 600, 400, 250); // SE corner near water
    
    this.renderQueue.push({ y: rootY - 100, element: canopy1 });
    this.renderQueue.push({ y: rootY - 50, element: canopy2 });
    this.renderQueue.push({ y: rootY - 500, element: canopy3 });
    this.renderQueue.push({ y: rootY + 600, element: canopy4 });

    // 5. Perimeter Shrines, Pillars, and Flora (Scale 16-24)
    this.drawPythonShrine(rootX - 900, rootY + 300, 20.0);
    this.drawPythonShrine(rootX + 800, rootY + 250, 18.0);
    this.drawPythonRuinPillar(rootX - 400, rootY + 350, 22.0);
    this.drawPythonRuinPillar(rootX + 350, rootY + 400, 20.0);
    this.drawPythonRuinPillar(rootX - 100, rootY + 850, 24.0); // Next to stream

    this.drawPythonHeroFlora(rootX - 600, rootY + 500, 20.0);
    this.drawPythonHeroFlora(rootX + 500, rootY + 700, 24.0);
    this.drawPythonHeroFlora(rootX + 900, rootY + 100, 20.0);
  }

  // --- VERTICAL SLICE HELPERS ---
  createVerticalSliceCanopy(cx, cy, rx, ry) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.style.pointerEvents = "none";
    
    // Drop shadow base
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", cx); shadow.setAttribute("cy", cy);
    shadow.setAttribute("rx", rx); shadow.setAttribute("ry", ry);
    shadow.setAttribute("fill", "rgba(0,0,0,0.5)");
    shadow.setAttribute("filter", "blur(15px)");
    group.appendChild(shadow);

    const layers = [
      { rx: rx, ry: ry, fill: "#1b5e20", dy: 0 },
      { rx: rx * 0.85, ry: ry * 0.85, fill: "#2e7d32", dy: -25 },
      { rx: rx * 0.7, ry: ry * 0.7, fill: "#388e3c", dy: -50 },
      { rx: rx * 0.5, ry: ry * 0.5, fill: "#4caf50", dy: -75 }
    ];

    layers.forEach(layer => {
      let path = "";
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        // Fluffy blob effect (sine waves along the edge)
        const blobFactor = Math.sin(angle * 6) * 0.2;
        const radX = layer.rx * (1 + blobFactor);
        const radY = layer.ry * (1 + blobFactor);
        const px = cx + Math.cos(angle) * radX;
        const py = cy + layer.dy + Math.sin(angle) * radY;
        
        if (i === 0) path += `M ${px},${py} `;
        else {
           const prevAngle = ((i - 0.5) / steps) * Math.PI * 2;
           const pBlob = Math.sin(prevAngle * 6) * 0.2;
           const ctrlX = cx + Math.cos(prevAngle) * (layer.rx * (1 + pBlob)) * 1.15;
           const ctrlY = cy + layer.dy + Math.sin(prevAngle) * (layer.ry * (1 + pBlob)) * 1.15;
           path += `Q ${ctrlX},${ctrlY} ${px},${py} `;
        }
      }
      path += "Z";
      
      const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      svgPath.setAttribute("d", path);
      svgPath.setAttribute("fill", layer.fill);
      group.appendChild(svgPath);
    });
    
    return group;
  }

  createVerticalSliceBridge(cx, cy, angle) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform", `translate(${cx}, ${cy}) rotate(${angle})`);
    group.style.pointerEvents = "none";

    // Massive stone base
    const bridge = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bridge.setAttribute("x", "-100"); bridge.setAttribute("y", "-70");
    bridge.setAttribute("width", "200"); bridge.setAttribute("height", "140");
    bridge.setAttribute("fill", "#cfd8dc");
    bridge.setAttribute("rx", "20");
    bridge.setAttribute("filter", "drop-shadow(0px 20px 15px rgba(0,0,0,0.5))");
    group.appendChild(bridge);

    // Stone railings
    const p1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    p1.setAttribute("x", "-100"); p1.setAttribute("y", "-70"); p1.setAttribute("width", "200"); p1.setAttribute("height", "25"); p1.setAttribute("fill", "#90a4ae");
    const p2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    p2.setAttribute("x", "-100"); p2.setAttribute("y", "45"); p2.setAttribute("width", "200"); p2.setAttribute("height", "25"); p2.setAttribute("fill", "#90a4ae");
    group.appendChild(p1); group.appendChild(p2);

    return group;
  }

  renderAcademyHouseCustom(cx, cy, scale, zIndex) {
    const tempGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const originalGetLayer = this.renderer.getLayer.bind(this.renderer);
    this.renderer.getLayer = () => tempGroup; // intercept draw
    
    this.drawAcademyHouse(cx, cy, scale);
    
    this.renderer.getLayer = originalGetLayer; // restore
    
    const finalGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    finalGroup.style.pointerEvents = "none";
    while (tempGroup.firstChild) {
      finalGroup.appendChild(tempGroup.firstChild);
    }
    this.renderQueue.push({ y: zIndex, element: finalGroup });
  }

  renderAcademyTreeCustom(cx, cy, scale, zIndex) {
    const tempGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const originalGetLayer = this.renderer.getLayer.bind(this.renderer);
    this.renderer.getLayer = () => tempGroup; 
    
    this.drawAcademyTree(cx, cy, scale);
    
    this.renderer.getLayer = originalGetLayer;
    
    const finalGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    finalGroup.style.pointerEvents = "none";
    while (tempGroup.firstChild) {
      finalGroup.appendChild(tempGroup.firstChild);
    }
    this.renderQueue.push({ y: zIndex, element: finalGroup });
  }

  // --- Road Surface Renderer Math Helpers (Phase 4N-B) ---

  sampleBezierPath(pathString, resolution = 20) {
    const points = [];
    const commands = pathString.match(/[a-zA-Z][^a-zA-Z]*/g);
    if (!commands) return points;

    let currentX = 0, currentY = 0;

    commands.forEach(cmd => {
      const type = cmd[0];
      const args = cmd.substring(1).trim().split(/[\s,]+/).map(parseFloat);

      if (type === 'M' || type === 'm') {
        currentX = type === 'M' ? args[0] : currentX + args[0];
        currentY = type === 'M' ? args[1] : currentY + args[1];
        points.push({ x: currentX, y: currentY });
      } else if (type === 'C' || type === 'c') {
        const p0 = { x: currentX, y: currentY };
        const p1 = { 
          x: type === 'C' ? args[0] : currentX + args[0], 
          y: type === 'C' ? args[1] : currentY + args[1] 
        };
        const p2 = { 
          x: type === 'C' ? args[2] : currentX + args[2], 
          y: type === 'C' ? args[3] : currentY + args[3] 
        };
        const p3 = { 
          x: type === 'C' ? args[4] : currentX + args[4], 
          y: type === 'C' ? args[5] : currentY + args[5] 
        };

        for (let i = 1; i <= resolution; i++) {
          const t = i / resolution;
          const u = 1 - t;
          const u3 = u * u * u;
          const u2t = 3 * u * u * t;
          const ut2 = 3 * u * t * t;
          const t3 = t * t * t;

          const x = u3 * p0.x + u2t * p1.x + ut2 * p2.x + t3 * p3.x;
          const y = u3 * p0.y + u2t * p1.y + ut2 * p2.y + t3 * p3.y;
          
          points.push({ x, y });
        }
        
        currentX = p3.x;
        currentY = p3.y;
      }
    });

    return points;
  }

  calculateNormals(points) {
    const normals = [];
    if (points.length < 2) return normals;

    for (let i = 0; i < points.length; i++) {
      let pPrev = points[i - 1];
      let pNext = points[i + 1];

      // Handle endpoints
      if (i === 0) pPrev = points[i];
      if (i === points.length - 1) pNext = points[i];

      let dx = pNext.x - pPrev.x;
      let dy = pNext.y - pPrev.y;

      if (dx === 0 && dy === 0) {
        if (i === 0 && points.length > 1) {
          dx = points[1].x - points[0].x;
          dy = points[1].y - points[0].y;
        } else if (i === points.length - 1 && points.length > 1) {
          dx = points[i].x - points[i - 1].x;
          dy = points[i].y - points[i - 1].y;
        }
      }

      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        dx /= length;
        dy /= length;
      }

      // Normal is perpendicular to tangent (-dy, dx)
      normals.push({ nx: -dy, ny: dx });
    }

    return normals;
  }

  buildRoadPolygon(points, width, taperConfig = {}, noiseAmplitude = 0) {
    if (!points || points.length < 2) return "";

    // Cache points for collision detection later
    if (this.infrastructurePoints) {
      // Sub-sample to save memory, pushing every 5th point is enough for collision
      for (let i = 0; i < points.length; i += 5) {
        this.infrastructurePoints.push({ x: points[i].x, y: points[i].y });
      }
    }

    const normals = this.calculateNormals(points);
    const leftPoints = [];
    const rightPoints = [];
    const total = points.length;

    for (let i = 0; i < total; i++) {
      const p = points[i];
      const n = normals[i];
      
      let currentWidth = width / 2;

      // Apply tapering
      if (taperConfig.riverMode) {
        const lastP = points[total - 1];
        const distFromEnd = Math.hypot(p.x - lastP.x, p.y - lastP.y);
        
        let flare = 0;
        if (distFromEnd < 120) {
          // Exponential flare for the last 120 units to create a natural fan shape
          flare = Math.pow((120 - distFromEnd) / 120, 2);
        }
        
        const t = i / (total - 1);
        // Linear growth for the river body, up to 1.5x startWidth
        const linearWidth = taperConfig.startWidth + (taperConfig.startWidth * 0.5) * t; 
        
        // Final width is linear body + flare to the endWidth
        currentWidth = linearWidth + (taperConfig.endWidth - linearWidth) * flare;
      } else if (taperConfig.wilderness) {
        const mid = total / 2;
        const distFromMid = Math.abs(i - mid);
        const normalized = distFromMid / mid;
        currentWidth *= (taperConfig.wilderness + (1 - taperConfig.wilderness) * normalized);
      } else if (taperConfig.start && i < taperConfig.start) {
        currentWidth *= (i / taperConfig.start);
      } else if (taperConfig.end && i > total - 1 - taperConfig.end) {
        currentWidth *= ((total - 1 - i) / taperConfig.end);
      }
      // Apply noise variation
      if (noiseAmplitude > 0) {
        const noise = Math.sin(i * 0.5) * Math.cos(i * 0.3) * noiseAmplitude;
        currentWidth += noise;
      }

      currentWidth = Math.max(0, currentWidth);

      // Generate boundary points
      leftPoints.push({
        x: p.x + n.nx * currentWidth,
        y: p.y + n.ny * currentWidth
      });
      
      rightPoints.push({
        x: p.x - n.nx * currentWidth,
        y: p.y - n.ny * currentWidth
      });
    }

    // Assemble closed SVG path
    let pathString = `M ${leftPoints[0].x.toFixed(2)},${leftPoints[0].y.toFixed(2)}`;
    for (let i = 1; i < leftPoints.length; i++) {
      pathString += ` L ${leftPoints[i].x.toFixed(2)},${leftPoints[i].y.toFixed(2)}`;
    }

    if (taperConfig.riverMode) {
      // Generate a naturally bulging, fan-shaped river mouth cap (smooth semi-circle)
      const pL = leftPoints[leftPoints.length - 1];
      const pR = rightPoints[rightPoints.length - 1];
      const steps = 12;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const ix = pL.x + (pR.x - pL.x) * t;
        const iy = pL.y + (pR.y - pL.y) * t;
        const bulge = Math.sin(t * Math.PI) * (taperConfig.endWidth * 0.5);
        const dx = pR.x - pL.x;
        const dy = pR.y - pL.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        pathString += ` L ${(ix + nx * bulge).toFixed(2)},${(iy + ny * bulge).toFixed(2)}`;
      }
    }

    for (let i = rightPoints.length - 1; i >= 0; i--) {
      pathString += ` L ${rightPoints[i].x.toFixed(2)},${rightPoints[i].y.toFixed(2)}`;
    }
    pathString += " Z";

    return pathString;
  }

  generateAuthoredRoads() {
    this.authoredBridgeAnchors = [];

    // --- Create filters safely ---
    if (!this.renderer.defs.querySelector('#road-weathering-filter')) {
      const createFilter = (id, html) => {
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", id);
        filter.setAttribute("x", "-20%");
        filter.setAttribute("y", "-20%");
        filter.setAttribute("width", "140%");
        filter.setAttribute("height", "140%");
        filter.innerHTML = html;
        this.renderer.defs.appendChild(filter);
      };
      
      createFilter('road-weathering-filter', `
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="2.5" result="blurred" />
      `);
      
      createFilter('road-core-filter', `
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
      `);
    }

    const drawRoad = (roadData) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("id", `road-${roadData.id}`);
      group.style.pointerEvents = "none";

      const baseGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      if (roadData.baseOpacity !== undefined) baseGroup.setAttribute("opacity", roadData.baseOpacity);
      // baseGroup.setAttribute("filter", "url(#road-weathering-filter)"); // Temp disabled for visibility test

      const coreGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      if (roadData.coreOpacity !== undefined) coreGroup.setAttribute("opacity", roadData.coreOpacity);
      // coreGroup.setAttribute("filter", "url(#road-core-filter)"); // Temp disabled for visibility test

      const segments = roadData.segments || [roadData];
      let allPoints = [];

      segments.forEach(seg => {
        // 1. Convert Bezier to Point Array with increased resolution
        const points = this.sampleBezierPath(seg.path, 100);
        if (points.length < 2) return;

        // Prevent duplicate points where segments connect
        if (allPoints.length > 0) {
          const lastPoint = allPoints[allPoints.length - 1];
          const firstPoint = points[0];
          if (Math.abs(lastPoint.x - firstPoint.x) < 0.1 && Math.abs(lastPoint.y - firstPoint.y) < 0.1) {
            points.shift();
          }
        }
        allPoints = allPoints.concat(points);
      });

      if (allPoints.length < 2) return;

      // 2. Resolve Widths
      const baseWidth = roadData.baseWidth || 260;
      const coreWidth = roadData.coreWidth || 140;

      // 3. Generate exactly ONE continuous base polygon
      const basePolygon = this.buildRoadPolygon(allPoints, baseWidth, { wilderness: 0.4 }, 2);
      
      // 4. Generate exactly ONE continuous core polygon
      const corePolygon = this.buildRoadPolygon(allPoints, coreWidth, { wilderness: 0.4 }, 1);

      // 5. Append Base Surface
      const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
      base.setAttribute("d", basePolygon);
      base.setAttribute("fill", roadData.baseColor);
      base.setAttribute("stroke", "none");
      baseGroup.appendChild(base);

      // 6. Append Core Surface
      const core = document.createElementNS("http://www.w3.org/2000/svg", "path");
      core.setAttribute("d", corePolygon);
      core.setAttribute("fill", roadData.coreColor);
      core.setAttribute("stroke", "none");
      coreGroup.appendChild(core);

      group.appendChild(baseGroup);
      group.appendChild(coreGroup);
      
      this.renderer.getLayer('roads').appendChild(group);

      if (roadData.bridgeAnchors) {
        this.authoredBridgeAnchors.push(...roadData.bridgeAnchors);
      }
    };

    const roadsConfig = [
      {
        id: 'great-western-trade-route',
        type: 'main-trade-route',
        baseColor: '#4A2F1B', 
        coreColor: '#E8D2A8', 
        baseOpacity: 0.75, 
        coreOpacity: 1.0,
        baseWidth: 260,
        coreWidth: 140,
        segments: [
          { path: 'M -550,-1000 C -450,-850 -350,-750 -300,-700' },
          { path: 'M -300,-700 C -150,-400 0,-200 200,100' },
          { path: 'M 150,50 C 300,300 450,700 600,1200' },
          { path: 'M 550,1100 C 700,1600 850,2000 1100,2600' },
          { path: 'M 1050,2500 C 1200,2800 1350,3000 1400,3250' },
          { path: 'M 1400,3250 C 1250,3800 800,4300 400,4700' },
          { path: 'M 450,4650 C 200,4900 0,5050 -200,5200' },
          { path: 'M -200,5200 C -300,5350 -400,5500 -500,5650' }
        ],
        bridgeAnchors: [{ id: 'west-delta-crossing', x: 1400, y: 3250, type: 'mechanical', rotation: 80 }]
      },
      {
        id: 'northern-trade-route',
        type: 'main-trade-route',
        baseColor: '#4A2F1B', 
        coreColor: '#E8D2A8', 
        baseOpacity: 0.75, 
        coreOpacity: 1.0,
        baseWidth: 260,
        coreWidth: 140,
        segments: [
          { path: 'M -550,-1000 C 0,-1100 1000,-1100 1800,-900' },
          { path: 'M 1800,-900 C 2200,-800 2400,-700 2500,-700' },
          { path: 'M 2500,-700 C 3500,-700 4500,-300 5500,0' }
        ],
        bridgeAnchors: [{ id: 'north-river-crossing', x: 2500, y: -700, type: 'stone', rotation: 10 }]
      },
      {
        id: 'southern-trade-route',
        type: 'main-trade-route',
        baseColor: '#4A2F1B', 
        coreColor: '#E8D2A8', 
        baseOpacity: 0.75, 
        coreOpacity: 1.0,
        baseWidth: 260,
        coreWidth: 140,
        segments: [
          { path: 'M -500,5650 C 0,5700 1000,5700 1800,5500' },
          { path: 'M 1800,5500 C 2200,5400 2400,5400 2500,5400' },
          { path: 'M 2500,5400 C 3500,5400 4500,5500 5500,5500' }
        ],
        bridgeAnchors: [{ id: 'south-river-crossing', x: 2500, y: 5400, type: 'wooden', rotation: 0 }]
      },
      {
        id: 'eastern-trade-route',
        type: 'main-trade-route',
        baseColor: '#4A2F1B', 
        coreColor: '#E8D2A8', 
        baseOpacity: 0.75, 
        coreOpacity: 1.0,
        baseWidth: 260,
        coreWidth: 140,
        segments: [
          { path: 'M 5500,0 C 6500,1000 7000,1500 7500,2500' },
          { path: 'M 7500,2500 C 8000,3500 7500,4500 6500,5000' },
          { path: 'M 6500,5000 C 6000,5200 5800,5300 5500,5500' }
        ]
      }
    ];

    roadsConfig.forEach(road => drawRoad(road));

    const internalRoads = [
      // Logic Dominion (Elegant, gentle curves)
      {
        id: 'logic-campus-path',
        type: 'internal-road',
        baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
        baseWidth: 160, coreWidth: 80,
        segments: [
          { path: 'M -550,-1000 C -700,-1100 -800,-1300 -1000,-1400' },
          { path: 'M -1000,-1400 C -1200,-1500 -1300,-1500 -1400,-1300' }
        ]
      },
      {
        id: 'logic-garden-path',
        type: 'internal-road',
        baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
        baseWidth: 120, coreWidth: 60,
        segments: [
          { path: 'M -550,-1000 C -800,-800 -1000,-600 -1200,-700' }
        ]
      },

      // Systems Republic (Engineered, sharper angles)
      {
        id: 'systems-factory-line',
        type: 'internal-road',
        baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
        baseWidth: 160, coreWidth: 80,
        segments: [
          { path: 'M -500,5650 C -600,5600 -700,5500 -900,5300' },
          { path: 'M -900,5300 C -1100,5100 -1150,5100 -1300,5100' }
        ]
      },
      {
        id: 'systems-rail-access',
        type: 'internal-road',
        baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
        baseWidth: 120, coreWidth: 60,
        segments: [
          { path: 'M -500,5650 C -400,5800 -300,6000 -400,6200' }
        ]
      },

      // Python Wildlands (Organic, winding)
      {
        id: 'python-temple-trail',
        type: 'internal-road',
        baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
        baseWidth: 160, coreWidth: 80,
        segments: [
          { path: 'M 5500,5500 C 5300,5700 5600,6000 5400,6300' },
          { path: 'M 5400,6300 C 5200,6600 5500,6800 5300,7000' }
        ]
      },
      {
        id: 'python-village-trail',
        type: 'internal-road',
        baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
        baseWidth: 120, coreWidth: 60,
        segments: [
          { path: 'M 5500,5500 C 5800,5300 6000,5600 6200,5500' }
        ]
      },

      // Debug Wasteland (Fractured, irregular)
      {
        id: 'debug-crystal-path',
        type: 'internal-road',
        baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
        baseWidth: 160, coreWidth: 80,
        segments: [
          { path: 'M 5500,0 C 5700,-100 5600,-400 5800,-500' },
          { path: 'M 5800,-500 C 6000,-600 5900,-800 6200,-800' }
        ]
      },
      {
        id: 'debug-ruin-access',
        type: 'internal-road',
        baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
        baseWidth: 120, coreWidth: 60,
        segments: [
          { path: 'M 5500,0 C 5300,200 5200,100 5000,300' }
        ]
      }
    ];

    internalRoads.forEach(road => drawRoad(road));
  }

  generateAuthoredBridges() {
    if (!this.authoredBridgeAnchors || this.authoredBridgeAnchors.length === 0) return;

    // Bridge config maps to visual rendering styles for the SVG bridge geometry
    const bridgeConfig = {
      stone: {
        width: 900,
        height: 450, // wide enough to cover the river
        baseColor: '#cfd8dc', // Light gray masonry
        accentColor: '#90a4ae', 
        deckColor: '#78909c'
      },
      mechanical: {
        width: 900,
        height: 450,
        baseColor: '#37474f', // Dark metal
        accentColor: '#d32f2f', // Red mechanical accents
        deckColor: '#263238'
      },
      wooden: {
        width: 900,
        height: 450,
        baseColor: '#5d4037', // Natural timber
        accentColor: '#d7ccc8', // Rope railings
        deckColor: '#795548'
      },
      corrupted: {
        width: 900,
        height: 450,
        baseColor: '#424242', // Broken stone
        accentColor: '#9c27b0', // Purple crystal growth
        deckColor: '#212121'
      }
    };

    this.authoredBridgeAnchors.forEach(anchor => {
      const config = bridgeConfig[anchor.type] || bridgeConfig['stone'];
      let bridgeGroup;
      
      switch (anchor.type) {
        case 'mechanical':
          bridgeGroup = this.drawMechanicalBridge(anchor, config);
          break;
        case 'wooden':
          bridgeGroup = this.drawWoodenBridge(anchor, config);
          break;
        case 'corrupted':
          bridgeGroup = this.drawCorruptedBridge(anchor, config);
          break;
        case 'stone':
        default:
          bridgeGroup = this.drawStoneBridge(anchor, config);
          break;
      }

      if (bridgeGroup) {
        this.renderer.getLayer('bridges').appendChild(bridgeGroup);
      }
    });
  }

  drawStoneBridge(anchor, config) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rotation = anchor.rotation || 0;
    g.setAttribute("transform", `translate(${anchor.x}, ${anchor.y}) rotate(${rotation})`);
    g.setAttribute("class", `bridge-stone`);

    const w = config.width;
    const h = config.height;
    const roadWidth = 400; 

    // Base foundation (elegant rounded stone)
    const foundation = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    foundation.setAttribute("x", -w/2);
    foundation.setAttribute("y", -h/2);
    foundation.setAttribute("width", w);
    foundation.setAttribute("height", h);
    foundation.setAttribute("fill", config.baseColor);
    foundation.setAttribute("rx", 40);
    foundation.setAttribute("ry", 40);
    g.appendChild(foundation);

    // Cyan decorative trim
    const trim = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    trim.setAttribute("x", -w/2 + 10);
    trim.setAttribute("y", -h/2 + 10);
    trim.setAttribute("width", w - 20);
    trim.setAttribute("height", h - 20);
    trim.setAttribute("fill", "none");
    trim.setAttribute("stroke", "#00bcd4"); // cyan trim
    trim.setAttribute("stroke-width", "4");
    trim.setAttribute("rx", 30);
    g.appendChild(trim);

    // Deck
    const deck = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    deck.setAttribute("x", -w/2 + 40);
    deck.setAttribute("y", -h/2);
    deck.setAttribute("width", w - 80);
    deck.setAttribute("height", h);
    deck.setAttribute("fill", config.deckColor);
    g.appendChild(deck);

    // Small side parapets
    [-roadWidth/2 - 10, roadWidth/2].forEach(yPos => {
      const parapet = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      parapet.setAttribute("x", -w/2);
      parapet.setAttribute("y", yPos);
      parapet.setAttribute("width", w);
      parapet.setAttribute("height", 10);
      parapet.setAttribute("fill", config.accentColor);
      parapet.setAttribute("rx", 5);
      g.appendChild(parapet);
    });

    return g;
  }

  drawMechanicalBridge(anchor, config) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rotation = anchor.rotation || 0;
    g.setAttribute("transform", `translate(${anchor.x}, ${anchor.y}) rotate(${rotation})`);
    g.setAttribute("class", `bridge-mechanical`);

    const w = config.width;
    const h = config.height;
    const roadWidth = 400;

    // Thick steel deck
    const deck = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    deck.setAttribute("x", -w/2);
    deck.setAttribute("y", -h/2);
    deck.setAttribute("width", w);
    deck.setAttribute("height", h);
    deck.setAttribute("fill", config.baseColor);
    g.appendChild(deck);

    // Industrial orange accents and rails
    [-roadWidth/2 - 30, roadWidth/2 + 10].forEach(yPos => {
      const rail = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rail.setAttribute("x", -w/2);
      rail.setAttribute("y", yPos);
      rail.setAttribute("width", w);
      rail.setAttribute("height", 20);
      rail.setAttribute("fill", "#ff9800"); // orange accent
      g.appendChild(rail);
      
      // Rivets on the rail
      for (let i = -w/2 + 20; i < w/2; i += 40) {
        const rivet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        rivet.setAttribute("cx", i);
        rivet.setAttribute("cy", yPos + 10);
        rivet.setAttribute("r", 3);
        rivet.setAttribute("fill", "#000");
        g.appendChild(rivet);
      }
    });

    // Mechanical support beams crossing the road
    for (let i = -w/2 + 40; i < w/2; i += 80) {
      const beam = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      beam.setAttribute("x", i);
      beam.setAttribute("y", -h/2);
      beam.setAttribute("width", 20);
      beam.setAttribute("height", h);
      beam.setAttribute("fill", config.deckColor);
      g.appendChild(beam);
      
      // X bracing
      const brace1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      brace1.setAttribute("x1", i);
      brace1.setAttribute("y1", -h/2);
      brace1.setAttribute("x2", i + 20);
      brace1.setAttribute("y2", h/2);
      brace1.setAttribute("stroke", "#ff9800");
      brace1.setAttribute("stroke-width", "4");
      g.appendChild(brace1);

      const brace2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      brace2.setAttribute("x1", i + 20);
      brace2.setAttribute("y1", -h/2);
      brace2.setAttribute("x2", i);
      brace2.setAttribute("y2", h/2);
      brace2.setAttribute("stroke", "#ff9800");
      brace2.setAttribute("stroke-width", "4");
      g.appendChild(brace2);
    }
    
    return g;
  }

  drawWoodenBridge(anchor, config) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rotation = anchor.rotation || 0;
    g.setAttribute("transform", `translate(${anchor.x}, ${anchor.y}) rotate(${rotation})`);
    g.setAttribute("class", `bridge-wooden`);

    const w = config.width;
    const h = config.height;
    const roadWidth = 400;

    // Foundation
    const foundation = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    foundation.setAttribute("x", -w/2);
    foundation.setAttribute("y", -h/2);
    foundation.setAttribute("width", w);
    foundation.setAttribute("height", h);
    foundation.setAttribute("fill", config.baseColor);
    g.appendChild(foundation);

    // Layered timber planks
    for (let i = -w/2 + 5; i < w/2; i += 15) {
      const plankLength = h - (window.rng.next() * 20); // slight organic variation
      const plankY = -plankLength / 2;
      const plank = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      plank.setAttribute("x", i);
      plank.setAttribute("y", plankY);
      plank.setAttribute("width", 12);
      plank.setAttribute("height", plankLength);
      plank.setAttribute("fill", config.deckColor);
      plank.setAttribute("rx", 2);
      g.appendChild(plank);
    }

    // Rope railings
    [-roadWidth/2 - 20, roadWidth/2 + 10].forEach(yPos => {
      // Posts
      for (let i = -w/2 + 20; i < w/2; i += 60) {
        const post = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        post.setAttribute("cx", i);
        post.setAttribute("cy", yPos + 5);
        post.setAttribute("r", 6);
        post.setAttribute("fill", "#3e2723");
        g.appendChild(post);
      }
      
      // The rope (a wavy line)
      let d = `M ${-w/2 + 20} ${yPos + 5}`;
      for (let i = -w/2 + 20 + 60; i < w/2; i += 60) {
         d += ` Q ${i - 30} ${yPos + 20} ${i} ${yPos + 5}`;
      }
      const rope = document.createElementNS("http://www.w3.org/2000/svg", "path");
      rope.setAttribute("d", d);
      rope.setAttribute("fill", "none");
      rope.setAttribute("stroke", config.accentColor); // Rope color
      rope.setAttribute("stroke-width", "4");
      g.appendChild(rope);
    });

    return g;
  }

  drawCorruptedBridge(anchor, config) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rotation = anchor.rotation || 0;
    g.setAttribute("transform", `translate(${anchor.x}, ${anchor.y}) rotate(${rotation})`);
    g.setAttribute("class", `bridge-corrupted`);

    const w = config.width;
    const h = config.height;
    const roadWidth = 400;

    // Broken stone deck (uneven silhouette)
    const deck = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let d = `M ${-w/2},${-h/2} `;
    // Top edge uneven
    for (let i = -w/2; i <= w/2; i += 40) {
      d += `L ${i},${-h/2 + window.rng.next() * 20 - 10} `;
    }
    // Right edge
    d += `L ${w/2},${h/2} `;
    // Bottom edge uneven
    for (let i = w/2; i >= -w/2; i -= 40) {
      d += `L ${i},${h/2 + window.rng.next() * 20 - 10} `;
    }
    d += `Z`;
    deck.setAttribute("d", d);
    deck.setAttribute("fill", config.baseColor);
    g.appendChild(deck);

    // Inner deck cracks
    for (let i = 0; i < 5; i++) {
      const crack = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const startX = (window.rng.next() - 0.5) * w;
      const startY = (window.rng.next() - 0.5) * h;
      crack.setAttribute("d", `M ${startX},${startY} L ${startX + window.rng.next()*40 - 20},${startY + window.rng.next()*40 - 20} L ${startX + window.rng.next()*40 - 20},${startY + window.rng.next()*40 - 20}`);
      crack.setAttribute("fill", "none");
      crack.setAttribute("stroke", config.deckColor);
      crack.setAttribute("stroke-width", "3");
      g.appendChild(crack);
    }

    // Purple crystal formations
    for (let i = 0; i < 8; i++) {
      const crystal = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      const cx = (window.rng.next() - 0.5) * w;
      // Clustered near the edges
      const cy = (window.rng.next() > 0.5 ? 1 : -1) * (roadWidth/2 - window.rng.next() * 30);
      
      const sizeX = 15 + window.rng.next() * 20;
      const sizeY = 25 + window.rng.next() * 30;
      
      crystal.setAttribute("points", `${cx},${cy} ${cx+sizeX/2},${cy-sizeY} ${cx+sizeX},${cy}`);
      crystal.setAttribute("fill", config.accentColor);
      g.appendChild(crystal);
      
      // Crystal core
      const core = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      core.setAttribute("points", `${cx+sizeX/4},${cy} ${cx+sizeX/2},${cy-sizeY*0.8} ${cx+sizeX*0.75},${cy}`);
      core.setAttribute("fill", "#e1bee7"); // light purple core
      g.appendChild(core);
    }

    return g;
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

          /* 
          // Disabled as per user request to remove small scatter props
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
          */
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
      if (template.theme === 'logic' || template.theme === 'python') return; // Handled by Vertical Slices
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
    const clusterTargets = { logic: 0, debug: 0, systems: 0, python: 0 }; // Handled by Vertical Slices
    const clusterCounts = { logic: 0, debug: 0, systems: 0, python: 0 };
    let totalAttempts = 0;
    const maxAttempts = 3000;
    let targetsMet = false;

    /*
    // Disabled as per user request to remove random filler
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
    */

    // 5. Render Hand-Authored Vertical Slices
    this.renderLogicDominionVerticalSlice(territoryBounds['logic']);
    this.renderDebugWastelandVerticalSlice(territoryBounds['debug']);
    this.renderSystemsRepublicVerticalSlice(territoryBounds['systems']);
    this.renderPythonWildlandsVerticalSlice(territoryBounds['python']);

    // 6. Console report
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
    } else if (sceneType === 'gardenCampus') {
      trySpawn(this.drawAcademyTree, [7.0], 0, 0); setAnchor('AcademyTree', 7.0);
    } else if (sceneType === 'riversideStudy') {
      trySpawn(this.drawAcademyHouse, [7.0], 0, 0); setAnchor('AcademyHouse', 7.0);
    } else if (sceneType === 'forestEdge') {
      trySpawn(this.drawTreeGroup, [theme], 0, 0); setAnchor('TreeGroup', 6.0); // base scale inside function
    }
    
    // DEBUG SCENES
    else if (sceneType === 'crystalField') {
      // Intentionally left blank as per user request to remove scatter props
    } else if (sceneType === 'scarZone') {
      // Intentionally left blank
    } else if (sceneType === 'ruinedStone') {
      // Intentionally left blank
    } else if (sceneType === 'rockyBorder') {
      // Intentionally left blank
    }

    // SYSTEMS SCENES
    else if (sceneType === 'pipeYard') {
      // Intentionally left blank
    } else if (sceneType === 'gearCluster') {
      // Intentionally left blank
    } else if (sceneType === 'railZone') {
      // Intentionally left blank
    } else if (sceneType === 'industrialOutpost') {
      // Intentionally left blank
    }

    // PYTHON SCENES
    else if (sceneType === 'denseJungle') {
      // Intentionally left blank
    } else if (sceneType === 'overgrownRuins') {
      // Intentionally left blank
    } else if (sceneType === 'vineCluster') {
      // Intentionally left blank
    } else if (sceneType === 'tropicalEdge') {
      // Intentionally left blank
    } else if (sceneType === 'templeSupport') {
      // Intentionally left blank
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

  drawAcademyLibrary(x, y, scale = 1.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    // Shadow
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 35); shadow.setAttribute("ry", 15);
    shadow.setAttribute("fill", "rgba(0,0,0,0.3)");
    shadow.setAttribute("filter", "blur(4px)");
    g.appendChild(shadow);

    // Wide base
    g.appendChild(this.createPoly("-30,0 0,-15 30,0 0,15", "#b2ebf2"));
    g.appendChild(this.createPoly("-30,0 0,15 0,-10 -30,-25", "#80deea"));
    g.appendChild(this.createPoly("30,0 0,15 0,-10 30,-25", "#e0f7fa"));
    
    // Central tier
    g.appendChild(this.createPoly("-15,-20 0,-30 15,-20 0,-10", "#4dd0e1"));
    g.appendChild(this.createPoly("-15,-20 0,-10 0,-35 -15,-45", "#26c6da"));
    g.appendChild(this.createPoly("15,-20 0,-10 0,-35 15,-45", "#b2ebf2"));

    // Roof
    g.appendChild(this.createPoly("-20,-40 0,-55 20,-40 0,-25", "#00bcd4"));
    g.appendChild(this.createPoly("-20,-40 0,-25 -2,-32 -22,-47", "#00acc1"));
    
    this.renderQueue.push({ y: y, element: g });
  }

  drawAcademyTemple(x, y, scale = 1.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    // Shadow
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 25); shadow.setAttribute("ry", 12);
    shadow.setAttribute("fill", "rgba(0,0,0,0.3)");
    shadow.setAttribute("filter", "blur(4px)");
    g.appendChild(shadow);

    // Octagonal/Pillar base (simplified to 3 vertical faces)
    g.appendChild(this.createPoly("-15,-5 -5,0 5,-5 -5,-10", "#e0f7fa")); // Top of base
    g.appendChild(this.createPoly("-15,-5 -5,0 -5,-35 -15,-40", "#80deea"));
    g.appendChild(this.createPoly("5,-5 -5,0 -5,-35 5,-40", "#b2ebf2"));
    g.appendChild(this.createPoly("5,-5 15,-10 15,-45 5,-40", "#e0f7fa")); // Right side face

    // Glowing Dome
    const dome = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dome.setAttribute("d", "M -18,-38 Q 0,-65 18,-43 Q 0,-25 -18,-38 Z");
    dome.setAttribute("fill", "#00bcd4");
    dome.setAttribute("opacity", "0.85");
    g.appendChild(dome);

    this.renderQueue.push({ y: y, element: g });
  }

  drawAcademyDorm(x, y, scale = 1.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";

    // Shadow
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 20); shadow.setAttribute("ry", 10);
    shadow.setAttribute("fill", "rgba(0,0,0,0.3)");
    shadow.setAttribute("filter", "blur(3px)");
    g.appendChild(shadow);

    // Main house
    g.appendChild(this.createPoly("0,0 -15,-8 -15,-25 0,-17", "#b2ebf2"));
    g.appendChild(this.createPoly("0,0 15,-8 15,-25 0,-17", "#ffffff"));
    g.appendChild(this.createPoly("-18,-20 0,-32 18,-20 0,-8", "#00bcd4")); 

    // Attached L-wing
    g.appendChild(this.createPoly("-10,5 -20,0 -20,-15 -10,-10", "#80deea"));
    g.appendChild(this.createPoly("-10,5 5,-2 5,-17 -10,-10", "#e0f7fa"));
    g.appendChild(this.createPoly("-22,-12 -8,-20 7,-12 -7,-4", "#00acc1")); 

    this.renderQueue.push({ y: y, element: g });
  }

  createDeadTreeMass(cx, cy, rx, ry) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.style.pointerEvents = "none";
    
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", cx); shadow.setAttribute("cy", cy);
    shadow.setAttribute("rx", rx * 1.1); shadow.setAttribute("ry", ry * 1.1);
    shadow.setAttribute("fill", "rgba(0,0,0,0.3)");
    shadow.setAttribute("filter", "blur(15px)");
    group.appendChild(shadow);

    const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `
      M ${cx - rx}, ${cy}
      Q ${cx - rx/2}, ${cy - ry*1.2} ${cx}, ${cy - ry}
      Q ${cx + rx/2}, ${cy - ry*1.1} ${cx + rx}, ${cy}
      Q ${cx + rx/2}, ${cy + ry*0.8} ${cx}, ${cy + ry}
      Q ${cx - rx/2}, ${cy + ry*1.1} ${cx - rx}, ${cy}
      Z
    `;
    base.setAttribute("d", d);
    base.setAttribute("fill", "#3e2723"); // Dark dead brown
    group.appendChild(base);
    
    // Sharp thorny highlights
    const highlight = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dh = `
      M ${cx - rx*0.8}, ${cy - 20}
      L ${cx - rx*0.5}, ${cy - ry*0.8} L ${cx - rx*0.3}, ${cy - 10}
      L ${cx}, ${cy - ry*0.9} L ${cx + rx*0.4}, ${cy - 30}
      L ${cx + rx*0.7}, ${cy - ry*0.6}
    `;
    highlight.setAttribute("d", dh);
    highlight.setAttribute("stroke", "#4e342e");
    highlight.setAttribute("stroke-width", "30");
    highlight.setAttribute("fill", "none");
    highlight.setAttribute("stroke-linejoin", "miter");
    group.appendChild(highlight);
    
    return group;
  }

  drawCorruptedCrystalCluster(x, y, scale = 1.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 30); shadow.setAttribute("ry", 15);
    shadow.setAttribute("fill", "rgba(0,0,0,0.4)");
    shadow.setAttribute("filter", "blur(4px)");
    g.appendChild(shadow);

    // Large center crystal
    g.appendChild(this.createPoly("0,0 -15,-40 0,-70 15,-35", "#8e24aa"));
    g.appendChild(this.createPoly("0,0 15,-35 8,-55", "#e040fb"));
    g.appendChild(this.createPoly("0,0 -18,-25 -5,-45", "#4a148c"));

    // Left leaning crystal
    g.appendChild(this.createPoly("-10,5 -30,-20 -25,-40 -15,-15", "#7b1fa2"));
    g.appendChild(this.createPoly("-10,5 -15,-15 -5,-25", "#d500f9"));

    // Right leaning crystal
    g.appendChild(this.createPoly("10,2 25,-15 35,-35 20,-10", "#9c27b0"));
    g.appendChild(this.createPoly("10,2 20,-10 15,-25", "#ea80fc"));

    this.renderQueue.push({ y: y, element: g });
  }

  // --- SYSTEMS REPUBLIC HELPERS ---
  drawSystemsCoolingTower(x, y, scale) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    // Shadow
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 25); shadow.setAttribute("ry", 12);
    shadow.setAttribute("fill", "rgba(0,0,0,0.4)");
    shadow.setAttribute("filter", "blur(3px)");
    g.appendChild(shadow);

    // Base
    g.appendChild(this.createPoly("0,0 -20,-10 -20,-30 0,-20", "#546e7a"));
    g.appendChild(this.createPoly("0,0 20,-10 20,-30 0,-20", "#78909c"));
    g.appendChild(this.createPoly("-20,-30 0,-40 20,-30 0,-20", "#37474f")); // Inner dark rim
    
    // Smoke Puff
    const smoke = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    smoke.setAttribute("cx", "0"); smoke.setAttribute("cy", "-45");
    smoke.setAttribute("r", "15");
    smoke.setAttribute("fill", "#eceff1");
    smoke.setAttribute("opacity", "0.2");
    smoke.setAttribute("filter", "blur(4px)");
    g.appendChild(smoke);

    this.renderQueue.push({ y: y, element: g });
  }

  drawSystemsTank(x, y, scale) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 20); shadow.setAttribute("ry", 10);
    shadow.setAttribute("fill", "rgba(0,0,0,0.4)");
    shadow.setAttribute("filter", "blur(3px)");
    g.appendChild(shadow);

    // Base cylinder (hexagonal)
    g.appendChild(this.createPoly("0,0 -15,-8 -15,-35 0,-27", "#455a64"));
    g.appendChild(this.createPoly("0,0 15,-8 15,-35 0,-27", "#607d8b"));
    
    // Glowing fluid band
    g.appendChild(this.createPoly("0,-15 -15,-23 -15,-28 0,-20", "#f57c00"));
    g.appendChild(this.createPoly("0,-15 15,-23 15,-28 0,-20", "#ff9800"));
    
    // Dome top
    g.appendChild(this.createPoly("-15,-35 0,-43 15,-35 0,-27", "#b0bec5"));

    this.renderQueue.push({ y: y, element: g });
  }

  drawSystemsGearCluster(x, y, scale) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 35); shadow.setAttribute("ry", 15);
    shadow.setAttribute("fill", "rgba(0,0,0,0.4)");
    shadow.setAttribute("filter", "blur(4px)");
    g.appendChild(shadow);

    const drawHalfGear = (ox, oy, rot) => {
      const gear = document.createElementNS("http://www.w3.org/2000/svg", "path");
      // Stylized gear teeth isometric projection
      gear.setAttribute("d", `M -15,0 L -12,-8 L -5,-10 L 0,-18 L 5,-10 L 12,-8 L 15,0 Z`);
      gear.setAttribute("fill", "#546e7a");
      gear.setAttribute("stroke", "#263238");
      gear.setAttribute("stroke-width", "2");
      gear.setAttribute("transform", `translate(${ox}, ${oy}) scale(1, 0.5) rotate(${rot})`);
      return gear;
    };

    g.appendChild(drawHalfGear(-10, -5, 0));
    g.appendChild(drawHalfGear(15, -10, 45));
    g.appendChild(drawHalfGear(0, 5, 20));

    this.renderQueue.push({ y: y, element: g });
  }

  drawSystemsEnergyCore(x, y, scale) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 30); shadow.setAttribute("ry", 15);
    shadow.setAttribute("fill", "rgba(0,0,0,0.5)");
    shadow.setAttribute("filter", "blur(5px)");
    g.appendChild(shadow);

    // Heavy housing
    g.appendChild(this.createPoly("-25,0 0,-15 25,0 0,15", "#263238")); // Base pad
    g.appendChild(this.createPoly("-15,-5 0,-12 15,-5 0,-2", "#455a64"));
    g.appendChild(this.createPoly("-15,-5 0,-2 0,-30 -15,-35", "#37474f"));
    g.appendChild(this.createPoly("15,-5 0,-2 0,-30 15,-35", "#546e7a"));

    // Glowing core
    const core = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    core.setAttribute("cx", 0); core.setAttribute("cy", -20);
    core.setAttribute("rx", 10); core.setAttribute("ry", 15);
    core.setAttribute("fill", "#00bcd4"); // Bright cyan energy
    core.setAttribute("filter", "blur(2px)");
    g.appendChild(core);

    this.renderQueue.push({ y: y, element: g });
  }

  drawRuinedBuilding(x, y, scale = 1.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 20); shadow.setAttribute("ry", 10);
    shadow.setAttribute("fill", "rgba(0,0,0,0.4)");
    shadow.setAttribute("filter", "blur(3px)");
    g.appendChild(shadow);

    // Base ruined walls
    g.appendChild(this.createPoly("0,0 -20,-10 -20,-20 0,-10", "#424242"));
    g.appendChild(this.createPoly("0,0 20,-10 20,-15 5,-5", "#616161")); // broken right wall

    // Shattered dome/roof pieces
    g.appendChild(this.createPoly("-15,-15 -5,-30 0,-10", "#212121"));
    g.appendChild(this.createPoly("0,-10 5,-25 15,-12", "#757575"));

    // Debris
    g.appendChild(this.createPoly("15,5 25,-5 20,-10 10,0", "#424242"));
    g.appendChild(this.createPoly("-25,2 -15,-5 -20,-10 -30,0", "#212121"));

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

  drawPythonShrine(x, y, scale = 20.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    // Mossy stone base
    g.appendChild(this.createPoly("-1.5,0 1.5,0 1.5,1 -1.5,1", "#455a64"));
    g.appendChild(this.createPoly("-1.2,1 1.2,1 1.2,2 -1.2,2", "#37474f"));
    
    // Shrine body
    g.appendChild(this.createPoly("-1,-3 1,-3 1,0 -1,0", "#546e7a"));
    
    // Ancient glowing core
    const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    core.setAttribute("cx", "0"); core.setAttribute("cy", "-1.5");
    core.setAttribute("r", "0.4");
    core.setAttribute("fill", "#64ffda"); // Cyan/Teal glow
    g.appendChild(core);
    
    // Moss overlay
    g.appendChild(this.createPoly("-1,-3 -0.5,-3 -0.8,-1", "#1b5e20"));
    g.appendChild(this.createPoly("0.5,0 1,0 1,-1", "#2e7d32"));

    // Roof
    g.appendChild(this.createPoly("-1.5,-3 1.5,-3 0,-4.5", "#263238"));

    this.renderQueue.push({ y: y, element: g });
  }

  drawPythonRuinPillar(x, y, scale = 20.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    // Broken pillar base
    g.appendChild(this.createPoly("-1,0 1,0 1,1 -1,1", "#37474f"));
    
    // Pillar shaft
    g.appendChild(this.createPoly("-0.8,-4 0.8,-3 0.8,0 -0.8,0", "#546e7a"));
    
    // Moss and cracks
    g.appendChild(this.createPoly("-0.8,-4 0,-3.5 -0.5,-1", "#2e7d32"));
    g.appendChild(this.createPoly("-0.5,-2 0.5,-1.5 0.2,0", "#1b5e20"));
    
    this.renderQueue.push({ y: y, element: g });
  }

  drawPythonHeroFlora(x, y, scale = 20.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    // Giant stylized fern/glowing plant
    g.appendChild(this.createPoly("0,0 -2,-3 -0.5,-1.5", "#00c853"));
    g.appendChild(this.createPoly("0,0 -1,-4 -0.2,-2", "#64dd17"));
    g.appendChild(this.createPoly("0,0 1,-4 0.2,-2", "#00e676"));
    g.appendChild(this.createPoly("0,0 2,-3 0.5,-1.5", "#1de9b6"));
    
    this.renderQueue.push({ y: y, element: g });
  }

  // Phase 5A: Environment Details Specific Props
  drawFlowerPatch(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    
    // Flowers
    g.appendChild(this.createPoly("-0.5,0 -1,-0.5 -0.5,-1 0,-0.5", "#f48fb1"));
    g.appendChild(this.createPoly("0.5,0.2 0,-0.3 0.5,-0.8 1,-0.3", "#ce93d8"));
    g.appendChild(this.createPoly("-0.2,-0.8 -0.7,-1.3 -0.2,-1.8 0.3,-1.3", "#ffcc80"));
    
    this.renderQueue.push({ y: y, element: g });
  }

  drawBurnedRock(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.setAttribute("filter", "url(#drop-shadow)");
    
    // Burned jagged rock
    g.appendChild(this.createPoly("-1,0.5 -2,-0.5 -1,-2 0,-1.5", "#212121"));
    g.appendChild(this.createPoly("0,-1.5 1,-2.5 1.5,-1 0.5,0", "#424242"));
    
    this.renderQueue.push({ y: y, element: g });
  }

  drawScrapMetal(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.setAttribute("filter", "url(#drop-shadow)");
    
    // Twisted scrap plates
    g.appendChild(this.createPoly("-1,0.5 -2,-1 0,-1.5 1,-0.5", "#546e7a"));
    g.appendChild(this.createPoly("-0.5,-1 0.5,-2.5 2,-1.5 1,0", "#78909c"));
    // Rust accent
    g.appendChild(this.createPoly("0,-1 1,-2 1.5,-1.2 0.5,-0.2", "#d84315"));
    
    this.renderQueue.push({ y: y, element: g });
  }

  drawStorageCrate(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.setAttribute("filter", "url(#drop-shadow)");
    
    // Small industrial crate (isometric cube)
    g.appendChild(this.createPoly("0,0 -1,-0.5 0,-1 1,-0.5", "#ffb300")); // Top
    g.appendChild(this.createPoly("-1,-0.5 -1,0.5 0,1 0,0", "#ff8f00")); // Left
    g.appendChild(this.createPoly("1,-0.5 1,0.5 0,1 0,0", "#ff6f00")); // Right
    
    this.renderQueue.push({ y: y, element: g });
  }

  drawRockPile(x, y, scale = 4.0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";
    g.setAttribute("filter", "url(#drop-shadow)");
    
    g.appendChild(this.createPoly("-1.5,0.5 -2.5,-0.5 -1,-1.5 -0.5,0", "#795548"));
    g.appendChild(this.createPoly("-0.5,0 -1,-1.5 0.5,-2 1,-0.5", "#8d6e63"));
    g.appendChild(this.createPoly("0.5,0.5 1,-0.5 2,0 1.5,1.5", "#5d4037"));
    
    this.renderQueue.push({ y: y, element: g });
  }
}

window.TerrainGenerator = TerrainGenerator;
