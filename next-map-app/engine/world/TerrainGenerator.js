import CodeVyuhRegions from '../config/regions.config';
export default class TerrainGenerator {
  constructor(renderer, bounds, centerX, centerY) {
    this.renderer = renderer;
    this.width = renderer.width;
    this.height = renderer.height;
    this.bounds = bounds || { minX: 0, maxX: 5000, minY: 0, maxY: 4000 };
    this.centerX = centerX || 2500;
    this.centerY = centerY || 2000;
    this.regionsConfig = CodeVyuhRegions || [];

    // Phase 4C: Organic Territory Boundary Polygons
    // Mapped exactly to the winding river networks and natural coastline.
    this.territoryPolygons = {
      logic: [
        [-3800, -3300], [-1500, -3300], [300, -2800], [1800, -1300], [2300, -500], [2500, -20],
        [2500, 1300], [1800, 2000], [1400, 2800], [500, 3300], [-1000, 3100], [-2600, 3500], [-3800, 3500]
      ],
      debug: [
        [8600, -3700], [-1500, -3700], [300, -3200], [1800, -1700], [2300, -900], [2700, -200], [3100, -20],
        [3100, 1300], [4000, 1600], [4500, 2300], [5500, 1800], [7000, 2800], [8600, 3800]
      ],
      systems: [
        [-3800, 4500], [-2600, 4500], [-1000, 4100], [500, 4300], [1400, 3700], [1800, 2800], [1800, 2000],
        [1500, 4000], [1900, 5200], [2200, 5400], [2700, 6000], [3200, 6500], [3200, 7700], [-3800, 7700]
      ],
      python: [
        [2800, 1700], [4000, 2000], [4500, 2700], [5500, 2200], [7000, 3200], [8600, 4200],
        [8600, 7700], [3700, 7700], [3700, 6500], [3200, 6000], [2700, 5400], [2400, 5200], [2000, 4000], [2200, 2000]
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

    // Check logic secondary buildings (Temple, Library, Dorm)
    if (this.logicCampusAnchors) {
      const lca = this.logicCampusAnchors;
      const checkDist = (pt, r) => pt && Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2) < r + radius;
      if (checkDist(lca.library, 400)) return false;
      if (checkDist(lca.temple, 600)) return false; // Increased to clear large pad completely
      if (checkDist(lca.dormA, 250)) return false;

      // Exclude the thick pathway connecting the Academy (central junction) and Temple
      const sqr = (val) => val * val;
      const dist2 = (v, w) => sqr(v.x - w.x) + sqr(v.y - w.y);
      const distToSegment = (p, v, w) => {
        const l2 = dist2(v, w);
        if (l2 === 0) return Math.sqrt(dist2(p, v));
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
      };

      const pt = { x, y };
      // Pathway is width 400, so we need at least 250 clearance from center line
      if (distToSegment(pt, lca.academy, lca.temple) < 250) return false;
    }

    // Check specific custom ruin clear zones (Python Wildlands ruins)
    const rootX = 6076;
    const rootY = 5342;
    const ruins = [
      { x: rootX - 1100, y: rootY - 200, scale: 5.5 }, // Far Left
      { x: rootX - 2000, y: rootY + 1100, scale: 6.0 }, // Bottom Left
      { x: rootX - 800, y: rootY - 600, scale: 3.0 }, // Top Left
      { x: rootX + 1300, y: rootY - 50, scale: 5.0 },  // Top Right
      { x: rootX - 430, y: rootY - 3000, scale: 7.5 },
      { x: rootX - 2500, y: rootY - 2700, scale: 4.5 }
    ];
    for (const r of ruins) {
      // Base scale was multiplied by 28.0 in placement, so visual scale is huge.
      // E.g., scale 6.0 * 28.0 = 168.0. A radius of ~120 * ruin.scale ensures a massive clear area.
      if (Math.sqrt((r.x - x) ** 2 + (r.y - y) ** 2) < (140 * r.scale) + radius) return false;
    }

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
        const normalizedDist = (dx * dx) / (islandRx * islandRx) + (dy * dy) / (islandRy * islandRy);
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
          // EXCLUSION ZONE: Prevent random props from hiding the Logic Dominion label
          if (this.logicCampusAnchors && this.logicCampusAnchors.academy) {
            const dxL = Math.abs(jitterX - this.logicCampusAnchors.academy.x);
            const dyL = Math.abs(jitterY - (this.logicCampusAnchors.academy.y + 900));
            if (dxL < 1600 && dyL < 400) continue;
          }
          if (r < 0.25) this.drawTreeGroup(jitterX, jitterY, 'logic');
          else if (r < 0.45) this.drawAcademyTree(jitterX, jitterY, 4.0);
          else if (r < 0.65) this.drawBush(jitterX, jitterY, 'logic');
          else if (r < 0.8) this.drawFlowerPatch(jitterX, jitterY, 4.0);
          else if (r < 0.9) this.drawStoneTile(jitterX, jitterY, 3.5);
          else this.drawGrassPatch(jitterX, jitterY, 4.5);
        } else if (biome === 'debug') {
          const dxD = jitterX - 6076;
          const dyD = jitterY - (-742);
          if (dxD * dxD + (dyD * 2) * (dyD * 2) < 1800 * 1800) continue;
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
          // EXCLUSION ZONE: Prevent random props from hiding the Python Wildlands label and temple area
          const dxP = Math.abs(jitterX - 6076);
          const dyP = Math.abs(jitterY - 5342);
          if (dxP < 1600 && dyP < 800) continue;

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
      for (let i = -40; i <= 40; i += 15) {
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

      // --- Animated Flow Lines overlay ---
      // Generate the exact centerline SVG path
      let centerlineD = "";
      combinedPoints.forEach((pt, i) => {
        centerlineD += (i === 0 ? `M ${pt.x},${pt.y}` : ` L ${pt.x},${pt.y}`);
      });

      // Create a unique clipPath using the riverCore polygon to strictly contain flow lines
      const uniqueId = 'river-clip-' + Math.floor(Math.random() * 1000000);
      const clipPathDef = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clipPathDef.setAttribute("id", uniqueId);

      const clipShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      clipShape.setAttribute("d", riverCore.getAttribute("d"));
      clipPathDef.appendChild(clipShape);

      const flowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      flowGroup.setAttribute("clip-path", `url(#${uniqueId})`);
      flowGroup.style.pointerEvents = "none"; // Ensure flow overlay doesn't block interaction

      const createFlowLine = (width, opacity, color, dashArray, duration) => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line.setAttribute("d", centerlineD);
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", width);
        line.setAttribute("opacity", opacity);
        line.setAttribute("stroke-dasharray", dashArray);

        // Ensure dash offset animation flows downstream (from DashLength down to 0)
        let dashLen = parseInt(dashArray.split(',')[0]) + parseInt(dashArray.split(',')[1]);
        const anim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        anim.setAttribute("attributeName", "stroke-dashoffset");
        anim.setAttribute("values", `${dashLen};0`);
        anim.setAttribute("dur", `${duration}s`);
        anim.setAttribute("repeatCount", "indefinite");

        line.appendChild(anim);
        return line;
      };

      // 1. Broad slow shimmer (subtle but visible)
      flowGroup.appendChild(createFlowLine(Math.max(4, taperConfigCore.startWidth * 0.7), 0.25, "#ffffff", "200, 500", 10));
      // 2. Medium highlight current
      flowGroup.appendChild(createFlowLine(Math.max(2, taperConfigCore.startWidth * 0.35), 0.35, "#a5f3fc", "80, 250", 6));
      // 3. Thin fast surface streak
      flowGroup.appendChild(createFlowLine(Math.max(1, taperConfigCore.startWidth * 0.15), 0.45, "#ffffff", "20, 100", 3.5));

      // Append to the DOM
      this.renderer.getLayer('rivers').appendChild(clipPathDef);
      this.renderer.getLayer('rivers').appendChild(flowGroup);
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

  generateLogicDominionCampus(academyX, academyY) {
    // -----------------------------------------
    // LOGIC DOMINION SPATIAL PLACEMENT CONTRACT
    // -----------------------------------------
    // Hero landmark positions must be computed from the Academy anchor using fixed relative offsets.

    // Library: Behind and slightly to the right (Target: 450-600). Using 600.
    // dx = 346, dy = -490 => dist = 599.8
    const libraryX = academyX + 346;
    const libraryY = academyY - 490;

    // Monument: Left-front (Target: 220-280). Using 280.
    // dx = -198, dy = 198 => dist = 280.0
    const monumentX = academyX - 198;
    const monumentY = academyY + 198;

    // Fountain: Right-front (Target: 180-220). Using 220.
    // dx = 155, dy = 155 => dist = 219.2
    const fountainX = academyX + 155;
    const fountainY = academyY + 155;

    return {
      academy: { x: academyX, y: academyY, scaleX: 15.5, scaleY: 43.0, rotation: 0 },
      grandLibrary: { x: libraryX, y: libraryY, scaleX: 11.2, scaleY: 17.6, rotation: 0 },
      monumentPlaza: { x: monumentX, y: monumentY, scaleX: 9.8, scaleY: 9.8, rotation: 0 },
      fountainPlaza: { x: fountainX, y: fountainY, scaleX: 9.0, scaleY: 9.0, rotation: 0 },
      courtyardAnchors: [
        { x: academyX - 800, y: academyY - 800 },
        { x: academyX + 800, y: academyY - 800 }
      ],
      gardenZoneAnchors: [
        { x: academyX - 1500, y: academyY + 500 },
        { x: academyX + 1500, y: academyY + 500 }
      ],
      futureRoadNodes: [
        { x: academyX, y: academyY + 2000 }
      ]
    };
  }

  renderLogicDominionVerticalSlice(bounds) {
    // 1. Anchor on exactly the same coordinate as LandmarkManager logic building (-476, -742)
    const rootX = -476;
    const rootY = -742;

    // Layering base priorities for strict Z-sorting
    const zBasePatch = rootY - 1500;
    const zRiver = rootY - 1400;
    const zRoads = rootY - 1300;
    const zPlaza = rootY - 100;

    // 1. Terrain Base Patch
    // (Removed per user request)




    // 3. Roads
    const bridgeX = rootX - 800;
    const bridgeY = rootY + 550; // Previously riverY - 50
    const plazaX = rootX;
    const plazaY = rootY;

    /* Removed per user request:
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
    */



    // 4. Old Organic Plaza removed for Checkpoint 3A Campus Integration

    // 5. Canopy Masses
    // (Removed per user request)

    // 6. Secondary Buildings (Distinct stylized types)
    // Note: Main Academy is NOT drawn here; LandmarkManager draws it at (rootX, rootY)!

    // 4. Logic Dominion Fixed Campus Zone Anchors (Checkpoint 4E.4 Final Spacing)
    const logicCampusAnchors = {
      academy: { x: plazaX, y: plazaY },
      // Library Zone: Pushed further down and slightly right
      library: { x: plazaX + 230, y: plazaY + 2100 },
      // Temple Zone: Moved down slightly again along strict 0.5 isometric pathway
      temple: { x: plazaX + 1900, y: plazaY + 1350 },
      // Dorm Zone A: Pushed slightly further down and to the left to create a gap with the Library
      dormA: { x: plazaX - 1300, y: plazaY + 1750 }
    };
    this.logicCampusAnchors = logicCampusAnchors;

    // [NEW] Campus Marble Walkway Network (Checkpoint 4C)
    // Fixed explicit render layer ensuring it renders above roads/rivers but below buildings
    const zWalkways = rootY - 1200;

    const drawWalkway = (p1, p2, width) => {
      const pathGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

      // Outer thin cyan accent border
      const border = document.createElementNS("http://www.w3.org/2000/svg", "path");
      border.setAttribute("d", `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`);
      border.setAttribute("stroke", "#00cfe8"); // Visible cyan outline
      border.setAttribute("stroke-width", width + 24);
      border.setAttribute("stroke-linecap", "square");
      border.setAttribute("fill", "none");
      pathGroup.appendChild(border);

      // Light grey side edge for geometric depth
      const edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
      edge.setAttribute("d", `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`);
      edge.setAttribute("stroke", "#b7edf2"); // Light cyan edge
      edge.setAttribute("stroke-width", width + 12);
      edge.setAttribute("stroke-linecap", "square");
      edge.setAttribute("fill", "none");
      pathGroup.appendChild(edge);

      // White marble / pale stone walkway base
      const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
      base.setAttribute("d", `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`);
      base.setAttribute("stroke", "#f8ffff"); // Pale marble path fill
      base.setAttribute("stroke-width", width);
      base.setAttribute("stroke-linecap", "square");
      base.setAttribute("fill", "none");
      pathGroup.appendChild(base);

      // Subtle internal tile lines on walkways (dashed cyan lines)
      const tiles = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tiles.setAttribute("d", `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`);
      tiles.setAttribute("stroke", "#d5edf0");
      tiles.setAttribute("stroke-width", width - 20);
      tiles.setAttribute("stroke-linecap", "square");
      tiles.setAttribute("stroke-dasharray", "20, 40");
      tiles.setAttribute("fill", "none");
      pathGroup.appendChild(tiles);

      this.renderQueue.push({ y: zWalkways, element: pathGroup });
    };

    const drawCurvedWalkway = (p1, p2, cp, width) => {
      const pathGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

      // Outer thin cyan accent border
      const border = document.createElementNS("http://www.w3.org/2000/svg", "path");
      border.setAttribute("d", `M ${p1.x},${p1.y} Q ${cp.x},${cp.y} ${p2.x},${p2.y}`);
      border.setAttribute("stroke", "#00cfe8");
      border.setAttribute("stroke-width", width + 24);
      border.setAttribute("stroke-linecap", "square");
      border.setAttribute("fill", "none");
      pathGroup.appendChild(border);

      // Light grey side edge for geometric depth
      const edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
      edge.setAttribute("d", `M ${p1.x},${p1.y} Q ${cp.x},${cp.y} ${p2.x},${p2.y}`);
      edge.setAttribute("stroke", "#b7edf2");
      edge.setAttribute("stroke-width", width + 12);
      edge.setAttribute("stroke-linecap", "square");
      edge.setAttribute("fill", "none");
      pathGroup.appendChild(edge);

      // White marble / pale stone walkway base
      const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
      base.setAttribute("d", `M ${p1.x},${p1.y} Q ${cp.x},${cp.y} ${p2.x},${p2.y}`);
      base.setAttribute("stroke", "#f8ffff");
      base.setAttribute("stroke-width", width);
      base.setAttribute("stroke-linecap", "square");
      base.setAttribute("fill", "none");
      pathGroup.appendChild(base);

      // Subtle internal tile lines on walkways (dashed cyan lines)
      const tiles = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tiles.setAttribute("d", `M ${p1.x},${p1.y} Q ${cp.x},${cp.y} ${p2.x},${p2.y}`);
      tiles.setAttribute("stroke", "#d5edf0");
      tiles.setAttribute("stroke-width", width - 20);
      tiles.setAttribute("stroke-linecap", "square");
      tiles.setAttribute("stroke-dasharray", "20, 40");
      tiles.setAttribute("fill", "none");
      pathGroup.appendChild(tiles);

      this.renderQueue.push({ y: zWalkways, element: pathGroup });
    };

    const drawCleanPad = (cx, cy, rw, rh) => {
      const padGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

      // Cyan border
      const trim = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      trim.setAttribute("points", `${cx},${cy - rh - 12} ${cx + rw + 12},${cy} ${cx},${cy + rh + 12} ${cx - rw - 12},${cy}`);
      trim.setAttribute("fill", "#00cfe8");
      padGroup.appendChild(trim);

      // Light grey/blue side edge
      const edge = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      edge.setAttribute("points", `${cx},${cy - rh - 6} ${cx + rw + 6},${cy} ${cx},${cy + rh + 6} ${cx - rw - 6},${cy}`);
      edge.setAttribute("fill", "#b7edf2");
      padGroup.appendChild(edge);

      // Marble surface
      const top = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      top.setAttribute("points", `${cx},${cy - rh} ${cx + rw},${cy} ${cx},${cy + rh} ${cx - rw},${cy}`);
      top.setAttribute("fill", "#f8ffff");
      padGroup.appendChild(top);

      // 3-5 simple tile divider lines inside the plaza
      const grid = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let d = "";
      for (let i = 1; i < 4; i++) { // 3 dividers each way
        let p = i / 4;
        d += `M ${cx - rw + rw * p},${cy - rh * p} L ${cx + rw * p},${cy + rh - rh * p} `;
        d += `M ${cx - rw * p},${cy + rh - rh * p} L ${cx + rw - rw * p},${cy - rh * p} `;
      }
      grid.setAttribute("d", d);
      grid.setAttribute("stroke", "#d5edf0");
      grid.setAttribute("stroke-width", "4");
      padGroup.appendChild(grid);

      this.renderQueue.push({ y: zWalkways + 10, element: padGroup });
    };

    // Central junction point (front of Academy)
    const centralJunction = { x: logicCampusAnchors.academy.x, y: logicCampusAnchors.academy.y + 400 };

    // High Contrast Walkway specifically for Academy-to-Library to ensure visibility
    const drawHighContrastWalkway = (p1, p2, width) => {
      const pathGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

      const border = document.createElementNS("http://www.w3.org/2000/svg", "path");
      border.setAttribute("d", `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`);
      border.setAttribute("stroke", "#00cfe8");
      border.setAttribute("stroke-width", width + 32); // 16px outer stroke
      border.setAttribute("stroke-linecap", "square");
      border.setAttribute("fill", "none");
      pathGroup.appendChild(border);

      const edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
      edge.setAttribute("d", `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`);
      edge.setAttribute("stroke", "#b7edf2");
      edge.setAttribute("stroke-width", width + 16); // 8px edge
      edge.setAttribute("stroke-linecap", "square");
      edge.setAttribute("fill", "none");
      pathGroup.appendChild(edge);

      const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
      base.setAttribute("d", `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`);
      base.setAttribute("stroke", "#f8ffff");
      base.setAttribute("stroke-width", width);
      base.setAttribute("stroke-linecap", "square");
      base.setAttribute("fill", "none");
      pathGroup.appendChild(base);

      const tiles = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tiles.setAttribute("d", `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`);
      tiles.setAttribute("stroke", "#cceff2");
      tiles.setAttribute("stroke-width", width - 20);
      tiles.setAttribute("stroke-linecap", "square");
      const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      tiles.setAttribute("stroke-dasharray", `6, ${dist / 4}`); // 4-5 dividers
      tiles.setAttribute("fill", "none");
      pathGroup.appendChild(tiles);

      this.renderQueue.push({ y: zWalkways + 1, element: pathGroup });
    };

    // Draw connecting marble walkways (Increased widths for visible campus connections)
    // 2-segment pathway from Academy front/right base to Library front/left base
    const libPathStart = { x: logicCampusAnchors.academy.x + 220, y: logicCampusAnchors.academy.y + 520 };
    const libPathJunction = { x: logicCampusAnchors.academy.x + 200, y: logicCampusAnchors.academy.y + 900 };
    const libPathEnd = { x: logicCampusAnchors.library.x + 20, y: logicCampusAnchors.library.y - 220 };

    drawHighContrastWalkway(libPathStart, libPathJunction, 300);
    drawHighContrastWalkway(libPathJunction, libPathEnd, 300);
    drawCleanPad(libPathJunction.x, libPathJunction.y, 180, 90); // clean junction corner smoothing

    drawWalkway(centralJunction, logicCampusAnchors.temple, 400);
    drawCurvedWalkway(logicCampusAnchors.temple, { x: 2390, y: -380 }, { x: 2100, y: 1000 }, 200); // Curved path to nearest grey bridge (adjusted)
    drawWalkway(centralJunction, logicCampusAnchors.dormA, 300);
    drawWalkway(centralJunction, logicCampusAnchors.academy, 500);

    // Draw clean geometric pads for each building anchor (Increased scale)
    drawCleanPad(centralJunction.x, centralJunction.y, 500, 250);
    drawCleanPad(logicCampusAnchors.academy.x, logicCampusAnchors.academy.y, 700, 350);
    drawCleanPad(logicCampusAnchors.library.x, logicCampusAnchors.library.y, 600, 300);
    drawCleanPad(logicCampusAnchors.temple.x, logicCampusAnchors.temple.y, 500, 250);
    drawCleanPad(logicCampusAnchors.dormA.x, logicCampusAnchors.dormA.y, 400, 200);

    // [NEW] Curated Campus Boundary Greenery (Checkpoint 4D)
    const drawHedge = (cx, cy, radius) => {
      const hedgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      shadow.setAttribute("cx", cx); shadow.setAttribute("cy", cy + radius * 0.2);
      shadow.setAttribute("rx", radius * 1.1); shadow.setAttribute("ry", radius * 0.6);
      shadow.setAttribute("fill", "rgba(0,0,0,0.15)");
      hedgeGroup.appendChild(shadow);

      const body = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      body.setAttribute("cx", cx); body.setAttribute("cy", cy);
      body.setAttribute("rx", radius); body.setAttribute("ry", radius * 0.7);
      body.setAttribute("fill", "#2e7d32"); // Curated dark green
      hedgeGroup.appendChild(body);

      const highlight = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      highlight.setAttribute("cx", cx); highlight.setAttribute("cy", cy - radius * 0.25);
      highlight.setAttribute("rx", radius * 0.8); highlight.setAttribute("ry", radius * 0.5);
      highlight.setAttribute("fill", "#4caf50"); // Trimmed bright green top
      hedgeGroup.appendChild(highlight);

      this.renderQueue.push({ y: cy + radius, element: hedgeGroup });
    };

    const drawGardenPatch = (cx, cy, rw, rh) => {
      const patchGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

      const trim = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      trim.setAttribute("points", `${cx},${cy - rh - 4} ${cx + rw + 4},${cy} ${cx},${cy + rh + 4} ${cx - rw - 4},${cy}`);
      trim.setAttribute("fill", "#15d4e8"); // Match campus outline
      patchGroup.appendChild(trim);

      const grass = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      grass.setAttribute("points", `${cx},${cy - rh} ${cx + rw},${cy} ${cx},${cy + rh} ${cx - rw},${cy}`);
      grass.setAttribute("fill", "#a5d6a7"); // Soft academic garden green
      patchGroup.appendChild(grass);

      this.renderQueue.push({ y: zWalkways + 5, element: patchGroup });
    };

    // 1. Small green garden patches around empty campus edges
    drawGardenPatch(logicCampusAnchors.academy.x - 350, logicCampusAnchors.academy.y + 300, 120, 60);
    drawGardenPatch(logicCampusAnchors.academy.x + 350, logicCampusAnchors.academy.y + 300, 120, 60);

    // [NEW] Decorative Water Fountains
    const drawVisibleLogicFountain = (baseCx, baseCy, scale = 1.0) => {
      const fountainGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      // Apply the scale and position via SVG transform!
      fountainGroup.setAttribute("transform", `translate(${baseCx}, ${baseCy}) scale(${scale})`);

      // Draw relative to 0,0 so the transform handles everything
      const cx = 0;
      const cy = 0;

      const addPoly = (d, fill, stroke, sw, opacity, animateFlow = false, dur = 1, dashSize = 40) => {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", d);
        if (fill) p.setAttribute("fill", fill);
        if (stroke) p.setAttribute("stroke", stroke);
        if (sw) p.setAttribute("stroke-width", sw);
        if (opacity) p.setAttribute("opacity", opacity);
        p.setAttribute("stroke-linecap", "round");

        if (animateFlow) {
          p.setAttribute("stroke-dasharray", `${dashSize} ${dashSize * 0.8}`);
          const anim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
          anim.setAttribute("attributeName", "stroke-dashoffset");
          anim.setAttribute("values", `${dashSize * 1.8};0`);
          anim.setAttribute("dur", `${dur}s`);
          anim.setAttribute("repeatCount", "indefinite");
          p.appendChild(anim);
        }

        fountainGroup.appendChild(p);
      };

      const addEllipse = (ex, ey, rx, ry, fill, stroke, sw, opacity) => {
        const e = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        e.setAttribute("cx", ex); e.setAttribute("cy", ey);
        e.setAttribute("rx", rx); e.setAttribute("ry", ry);
        if (fill) e.setAttribute("fill", fill);
        if (stroke) e.setAttribute("stroke", stroke);
        if (sw) e.setAttribute("stroke-width", sw);
        if (opacity) e.setAttribute("opacity", opacity);
        fountainGroup.appendChild(e);
      };

      const drawCylinder = (bx, by, brx, bry, h, sideCol, topCol) => {
        addEllipse(bx, by, brx, bry, sideCol);
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", bx - brx); rect.setAttribute("y", by - h);
        rect.setAttribute("width", brx * 2); rect.setAttribute("height", h);
        rect.setAttribute("fill", sideCol);
        fountainGroup.appendChild(rect);
        addEllipse(bx, by - h, brx, bry, topCol);
      };

      // 1. Ground Shadow
      addEllipse(cx, cy + 10, 360, 170, "rgba(0,0,0,0.22)");

      // 2. Main Basin (Tier 1)
      drawCylinder(cx, cy, 340, 160, 48, "#b0bec5", "#ffffff");
      addEllipse(cx, cy - 48, 312, 144, "#cfd8dc");
      addEllipse(cx, cy - 28, 308, 142, "#26c6da"); // Water surface

      // 3. Central Pedestal
      drawCylinder(cx, cy - 28, 80, 40, 60, "#90a4ae", "#ffffff");

      // 4. Middle Basin (Tier 2)
      drawCylinder(cx, cy - 88, 170, 80, 32, "#b0bec5", "#ffffff");
      addEllipse(cx, cy - 120, 150, 68, "#cfd8dc");
      addEllipse(cx, cy - 108, 146, 66, "#26c6da"); // Tier 2 water surface

      // 5. Top Spout Pedestal
      drawCylinder(cx, cy - 108, 36, 16, 44, "#90a4ae", "#ffffff");
      addEllipse(cx, cy - 152, 44, 22, "#ffffff");

      // 6. Animated Water Ripples
      const addRipple = (ex, ey, maxRx, maxRy, dur, delay) => {
        const e = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        e.setAttribute("cx", ex); e.setAttribute("cy", ey);
        e.setAttribute("fill", "none");
        e.setAttribute("stroke", "#ffffff");
        e.setAttribute("stroke-width", "4");
        e.setAttribute("opacity", "0");

        const animRx = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animRx.setAttribute("attributeName", "rx");
        animRx.setAttribute("values", `${maxRx * 0.4};${maxRx}`);
        animRx.setAttribute("dur", `${dur}s`);
        animRx.setAttribute("begin", `${delay}s`);
        animRx.setAttribute("repeatCount", "indefinite");
        e.appendChild(animRx);

        const animRy = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animRy.setAttribute("attributeName", "ry");
        animRy.setAttribute("values", `${maxRy * 0.4};${maxRy}`);
        animRy.setAttribute("dur", `${dur}s`);
        animRy.setAttribute("begin", `${delay}s`);
        animRy.setAttribute("repeatCount", "indefinite");
        e.appendChild(animRy);

        const animOp = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animOp.setAttribute("attributeName", "opacity");
        animOp.setAttribute("values", "0;0.5;0"); // Fade in and out
        animOp.setAttribute("dur", `${dur}s`);
        animOp.setAttribute("begin", `${delay}s`);
        animOp.setAttribute("repeatCount", "indefinite");
        e.appendChild(animOp);

        fountainGroup.appendChild(e);
      };

      addRipple(cx, cy - 28, 260, 120, 3.0, 0);
      addRipple(cx, cy - 28, 180, 80, 2.5, 1.2);
      addRipple(cx, cy - 108, 110, 50, 2.0, 0.5);

      // 7. Animated Cascading Waterfalls
      const addWaterfall = (d, w) => {
        addPoly(d, "none", "#80f7ff", w, "0.95"); // solid base flow
        addPoly(d, "none", "#ffffff", (parseInt(w) / 2).toString(), "0.8", true, 0.6, 40); // animated splashes
      };
      addWaterfall(`M ${cx - 150} ${cy - 120} Q ${cx - 220} ${cy - 74} ${cx - 290} ${cy - 28}`, "20");
      addWaterfall(`M ${cx + 150} ${cy - 120} Q ${cx + 220} ${cy - 74} ${cx + 290} ${cy - 28}`, "20");
      addWaterfall(`M ${cx} ${cy - 40} Q ${cx} ${cy} ${cx} ${cy + 110}`, "24");
      addWaterfall(`M ${cx - 120} ${cy - 65} Q ${cx - 160} ${cy - 20} ${cx - 210} ${cy + 70}`, "16");
      addWaterfall(`M ${cx + 120} ${cy - 65} Q ${cx + 160} ${cy - 20} ${cx + 210} ${cy + 70}`, "16");

      // 8. Animated Top Water Jets
      const addJet = (d, w) => {
        addPoly(d, "none", "#80f7ff", w, "1.0");
        addPoly(d, "none", "#ffffff", (parseInt(w) / 2.5).toString(), "1.0", true, 0.5, 30);
      };
      addJet(`M ${cx} ${cy - 152} Q ${cx} ${cy - 280} ${cx} ${cy - 330}`, "24"); // Center
      addJet(`M ${cx} ${cy - 152} Q ${cx - 90} ${cy - 260} ${cx - 130} ${cy - 190}`, "20"); // Left
      addJet(`M ${cx} ${cy - 152} Q ${cx + 90} ${cy - 260} ${cx + 130} ${cy - 190}`, "20"); // Right
      addJet(`M ${cx} ${cy - 152} Q ${cx - 40} ${cy - 220} ${cx - 70} ${cy - 140}`, "16"); // Front-Left
      addJet(`M ${cx} ${cy - 152} Q ${cx + 40} ${cy - 220} ${cx + 70} ${cy - 140}`, "16"); // Front-Right

      // 9. Animated Sparkle Drops (Splashing)
      const addDrop = (dx, dy, r, delay, speed) => {
        const d = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        d.setAttribute("cx", dx); d.setAttribute("cy", dy);
        d.setAttribute("r", r); d.setAttribute("fill", "#ffffff");

        const animCy = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animCy.setAttribute("attributeName", "cy");
        animCy.setAttribute("values", `${dy};${dy + 30}`); // Fall downwards
        animCy.setAttribute("dur", `${speed}s`);
        animCy.setAttribute("begin", `${delay}s`);
        animCy.setAttribute("repeatCount", "indefinite");
        d.appendChild(animCy);

        const animOp = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animOp.setAttribute("attributeName", "opacity");
        animOp.setAttribute("values", "1;0"); // Fade out
        animOp.setAttribute("dur", `${speed}s`);
        animOp.setAttribute("begin", `${delay}s`);
        animOp.setAttribute("repeatCount", "indefinite");
        d.appendChild(animOp);

        fountainGroup.appendChild(d);
      };

      addDrop(cx, cy - 350, 12, 0, 0.6);
      addDrop(cx - 136, cy - 180, 10, 0.2, 0.5);
      addDrop(cx + 136, cy - 180, 10, 0.1, 0.5);
      addDrop(cx - 76, cy - 130, 8, 0.4, 0.4);
      addDrop(cx + 76, cy - 130, 8, 0.3, 0.4);

      // Splashes in main basin
      addDrop(cx - 200, cy + 50, 8, 0.1, 0.7);
      addDrop(cx + 200, cy + 50, 8, 0.5, 0.7);
      addDrop(cx, cy + 120, 10, 0.2, 0.6);
      addDrop(cx - 260, cy - 20, 8, 0.6, 0.8);
      addDrop(cx + 260, cy - 20, 8, 0.3, 0.8);

      // Render sort order perfectly matched to the visual bottom of the scaled cylinder
      this.renderQueue.push({ y: baseCy + 160 * scale, element: fountainGroup });
    };

    // Make all fountains MUCH larger by passing a 1.6 scale factor
    drawVisibleLogicFountain(plazaX - 1400, plazaY + 2950, 2.2);
    drawVisibleLogicFountain(plazaX + 1880, plazaY + 350, 1.5);
    drawVisibleLogicFountain(plazaX + 2000, plazaY + 2550, 1.4);
    drawVisibleLogicFountain(plazaX + 900, plazaY - 1200, 1.6);

    const drawSmallLogicLamp = (cx, cy) => {
      const lampGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      shadow.setAttribute("cx", cx);
      shadow.setAttribute("cy", cy + 20);
      shadow.setAttribute("rx", "35");
      shadow.setAttribute("ry", "14");
      shadow.setAttribute("fill", "rgba(0,0,0,0.18)");
      lampGroup.appendChild(shadow);

      const base = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      base.setAttribute("points", `${cx},${cy + 20} ${cx + 32},${cy + 36} ${cx},${cy + 52} ${cx - 32},${cy + 36}`);
      base.setAttribute("fill", "#f8ffff");
      base.setAttribute("stroke", "#00cfe8");
      base.setAttribute("stroke-width", "5");
      lampGroup.appendChild(base);

      const pole = document.createElementNS("http://www.w3.org/2000/svg", "line");
      pole.setAttribute("x1", cx);
      pole.setAttribute("y1", cy + 30);
      pole.setAttribute("x2", cx);
      pole.setAttribute("y2", cy - 45);
      pole.setAttribute("stroke", "#b7edf2");
      pole.setAttribute("stroke-width", "10");
      pole.setAttribute("stroke-linecap", "round");
      lampGroup.appendChild(pole);

      const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glow.setAttribute("cx", cx);
      glow.setAttribute("cy", cy - 55);
      glow.setAttribute("r", "28");
      glow.setAttribute("fill", "#80f7ff");
      glow.setAttribute("opacity", "0.35");
      lampGroup.appendChild(glow);

      const crystal = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      crystal.setAttribute("points", `${cx},${cy - 90} ${cx + 22},${cy - 55} ${cx},${cy - 20} ${cx - 22},${cy - 55}`);
      crystal.setAttribute("fill", "#00cfe8");
      crystal.setAttribute("stroke", "#ffffff");
      crystal.setAttribute("stroke-width", "5");
      lampGroup.appendChild(crystal);

      this.renderQueue.push({ y: cy + 60, element: lampGroup });
    };

    drawSmallLogicLamp(plazaX - 400, plazaY + 300);
    drawSmallLogicLamp(plazaX + 400, plazaY + 300);
    drawSmallLogicLamp(plazaX - 1100, plazaY + 1300);
    drawSmallLogicLamp(plazaX + 1100, plazaY + 1200);

    const drawVisibleKnowledgeProp = (cx, cy, type = "book") => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      shadow.setAttribute("cx", cx - 5);
      shadow.setAttribute("cy", cy + 80);
      shadow.setAttribute("rx", "110");
      shadow.setAttribute("ry", "45");
      shadow.setAttribute("fill", "rgba(0,0,0,0.25)");
      group.appendChild(shadow);

      if (type === "book") {
        const drawBook = (ox, oy, color, pageColor) => {
          // Top Cover
          const top = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          top.setAttribute("points", `${cx + ox},${cy + oy - 30} ${cx + ox + 105},${cy + oy + 22} ${cx + ox - 15},${cy + oy + 82} ${cx + ox - 120},${cy + oy + 30}`);
          top.setAttribute("fill", color);
          top.setAttribute("stroke", "#ffffff");
          top.setAttribute("stroke-width", "4");
          group.appendChild(top);

          // Left Spine
          const spine = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          spine.setAttribute("points", `${cx + ox - 120},${cy + oy + 30} ${cx + ox - 15},${cy + oy + 82} ${cx + ox - 15},${cy + oy + 105} ${cx + ox - 120},${cy + oy + 52}`);
          spine.setAttribute("fill", color);
          spine.setAttribute("stroke", "#ffffff");
          spine.setAttribute("stroke-width", "4");
          group.appendChild(spine);

          // Right Pages
          const pages = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          pages.setAttribute("points", `${cx + ox - 15},${cy + oy + 82} ${cx + ox + 105},${cy + oy + 22} ${cx + ox + 105},${cy + oy + 45} ${cx + ox - 15},${cy + oy + 105}`);
          pages.setAttribute("fill", pageColor);
          pages.setAttribute("stroke", "#00cfe8");
          pages.setAttribute("stroke-width", "4");
          group.appendChild(pages);

          // Page Line
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", cx + ox - 15);
          line.setAttribute("y1", cy + oy + 93);
          line.setAttribute("x2", cx + ox + 105);
          line.setAttribute("y2", cy + oy + 33);
          line.setAttribute("stroke", "#80f7ff");
          line.setAttribute("stroke-width", "3");
          group.appendChild(line);
        };

        // Stack 4 isometric books perfectly on top of each other
        drawBook(0, 0, "#ffffff", "#dffcff");
        drawBook(10, -25, "#00cfe8", "#ffffff");
        drawBook(-5, -50, "#b7edf2", "#ffffff");
        drawBook(5, -70, "#00cfe8", "#ffffff");

      } else {
        // Scroll Stand Base
        const sbase = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        sbase.setAttribute("cx", cx);
        sbase.setAttribute("cy", cy + 60);
        sbase.setAttribute("rx", "50");
        sbase.setAttribute("ry", "25");
        sbase.setAttribute("fill", "#b7edf2");
        sbase.setAttribute("stroke", "#ffffff");
        sbase.setAttribute("stroke-width", "5");
        group.appendChild(sbase);

        // Pole
        const pole = document.createElementNS("http://www.w3.org/2000/svg", "line");
        pole.setAttribute("x1", cx);
        pole.setAttribute("y1", cy + 60);
        pole.setAttribute("x2", cx);
        pole.setAttribute("y2", cy - 40);
        pole.setAttribute("stroke", "#00cfe8");
        pole.setAttribute("stroke-width", "16");
        pole.setAttribute("stroke-linecap", "round");
        group.appendChild(pole);

        // Scroll Background (The paper)
        const scroll = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        scroll.setAttribute("points", `${cx},${cy - 80} ${cx + 90},${cy - 35} ${cx},${cy + 10} ${cx - 90},${cy - 35}`);
        scroll.setAttribute("fill", "#ffffff");
        scroll.setAttribute("stroke", "#00cfe8");
        scroll.setAttribute("stroke-width", "6");
        group.appendChild(scroll);

        // Rolled ends
        const rollL = document.createElementNS("http://www.w3.org/2000/svg", "line");
        rollL.setAttribute("x1", cx - 90);
        rollL.setAttribute("y1", cy - 35);
        rollL.setAttribute("x2", cx);
        rollL.setAttribute("y2", cy - 80);
        rollL.setAttribute("stroke", "#b7edf2");
        rollL.setAttribute("stroke-width", "18");
        rollL.setAttribute("stroke-linecap", "round");
        group.appendChild(rollL);

        const rollR = document.createElementNS("http://www.w3.org/2000/svg", "line");
        rollR.setAttribute("x1", cx);
        rollR.setAttribute("y1", cy + 10);
        rollR.setAttribute("x2", cx + 90);
        rollR.setAttribute("y2", cy - 35);
        rollR.setAttribute("stroke", "#b7edf2");
        rollR.setAttribute("stroke-width", "18");
        rollR.setAttribute("stroke-linecap", "round");
        group.appendChild(rollR);

        // Text lines on the scroll
        const text1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        text1.setAttribute("x1", cx - 40);
        text1.setAttribute("y1", cy - 30);
        text1.setAttribute("x2", cx + 20);
        text1.setAttribute("y2", cy);
        text1.setAttribute("stroke", "#80f7ff");
        text1.setAttribute("stroke-width", "5");
        group.appendChild(text1);

        const text2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        text2.setAttribute("x1", cx - 20);
        text2.setAttribute("y1", cy - 40);
        text2.setAttribute("x2", cx + 40);
        text2.setAttribute("y2", cy - 10);
        text2.setAttribute("stroke", "#80f7ff");
        text2.setAttribute("stroke-width", "5");
        group.appendChild(text2);
      }

      this.renderQueue.push({ y: cy + 90, element: group });
    };

    // Book Stack 1: Placed dead-center in front of the Library's bottom staircase
    drawVisibleKnowledgeProp(logicCampusAnchors.library.x, logicCampusAnchors.library.y + 380, "book");
    // Book Stack 2: Placed safely in the open grass to the left of the Library
    drawVisibleKnowledgeProp(logicCampusAnchors.library.x - 600, logicCampusAnchors.library.y + 290, "book");
    // Scroll Stand: Placed safely in the open grass to the right of the Library
    drawVisibleKnowledgeProp(logicCampusAnchors.library.x + 40, logicCampusAnchors.library.y + 1000, "scroll");
    // Book Stack 3: Placed near Dorm A on the right side
    drawVisibleKnowledgeProp(logicCampusAnchors.dormA.x + 300, logicCampusAnchors.dormA.y + 200, "book");
    drawVisibleKnowledgeProp(logicCampusAnchors.dormA.x + 15, logicCampusAnchors.dormA.y + 300, "scroll");

    // NEW HELPER: Stone Knowledge Tablets (Ancient civilization monoliths)
    const drawStoneKnowledgeTablet = (cx, cy, scale = 1.0, flip = false) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const s = scale;

      // Ground Shadow
      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      shadow.setAttribute("cx", cx - 12 * s);
      shadow.setAttribute("cy", cy + 5 * s);
      shadow.setAttribute("rx", 35 * s);
      shadow.setAttribute("ry", 15 * s);
      shadow.setAttribute("fill", "rgba(0,0,0,0.3)");
      group.appendChild(shadow);

      // We use an explicit polygon array for the face so we can offset it for 3D walls
      const f = [
        [0, 0], [10, -30], [12, -65], [0, -90],
        [-25, -95], [-40, -75], [-35, -35], [-25, -5]
      ];

      // Convert to absolute coords
      const pts = f.map(p => ({ x: cx + p[0] * s, y: cy + p[1] * s }));

      // Offset vector for isometric depth (thickness)
      const dx = flip ? -12 * s : 15 * s;
      const dy = -10 * s;
      const bpts = pts.map(p => ({ x: p.x + dx, y: p.y + dy }));

      // Draw Side Wall (Thickness)
      const wall = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      let wallPoints = "";
      if (!flip) {
        // Right side thickness
        wallPoints = `${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y} ${pts[3].x},${pts[3].y} ` +
          `${bpts[3].x},${bpts[3].y} ${bpts[2].x},${bpts[2].y} ${bpts[1].x},${bpts[1].y} ${bpts[0].x},${bpts[0].y}`;
      } else {
        // Left side thickness
        wallPoints = `${pts[3].x},${pts[3].y} ${pts[4].x},${pts[4].y} ${pts[5].x},${pts[5].y} ${pts[6].x},${pts[6].y} ${pts[7].x},${pts[7].y} ` +
          `${bpts[7].x},${bpts[7].y} ${bpts[6].x},${bpts[6].y} ${bpts[5].x},${bpts[5].y} ${bpts[4].x},${bpts[4].y} ${bpts[3].x},${bpts[3].y}`;
      }
      wall.setAttribute("points", wallPoints);
      wall.setAttribute("fill", "#90a4ae"); // Dark grey stone
      wall.setAttribute("stroke", "#546e7a");
      wall.setAttribute("stroke-width", 3 * s);
      group.appendChild(wall);

      // Draw Top Wall
      const topWall = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      topWall.setAttribute("points", `${pts[3].x},${pts[3].y} ${pts[4].x},${pts[4].y} ${bpts[4].x},${bpts[4].y} ${bpts[3].x},${bpts[3].y}`);
      topWall.setAttribute("fill", "#b0bec5"); // Medium grey stone
      topWall.setAttribute("stroke", "#546e7a");
      topWall.setAttribute("stroke-width", 3 * s);
      group.appendChild(topWall);

      // Draw Front Face
      const face = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      face.setAttribute("points", pts.map(p => `${p.x},${p.y}`).join(" "));
      face.setAttribute("fill", "#cfd8dc"); // Light pale stone
      face.setAttribute("stroke", "#78909c");
      face.setAttribute("stroke-width", 3 * s);
      group.appendChild(face);

      // Glowing Runes / Engravings
      const addRune = (rx, ry, color) => {
        const rune = document.createElementNS("http://www.w3.org/2000/svg", "path");
        rune.setAttribute("d", `M ${rx} ${ry} L ${rx - 6 * s} ${ry - 5 * s} L ${rx + 4 * s} ${ry - 10 * s} L ${rx - 4 * s} ${ry - 15 * s}`);
        rune.setAttribute("fill", "none");
        rune.setAttribute("stroke", color);
        rune.setAttribute("stroke-width", 2.5 * s);
        rune.setAttribute("stroke-linecap", "round");
        group.appendChild(rune);
      };

      const addLine = (lx, ly, w) => {
        const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
        ln.setAttribute("x1", lx);
        ln.setAttribute("y1", ly);
        ln.setAttribute("x2", lx - w);
        ln.setAttribute("y2", ly - w * 0.3); // Slight tilt to follow perspective
        ln.setAttribute("stroke", "#00e5ff"); // Cyan text glow
        ln.setAttribute("stroke-width", 2 * s);
        ln.setAttribute("stroke-linecap", "round");
        group.appendChild(ln);
      };

      // Add rune engravings on front face
      addRune(cx - 10 * s, cy - 65 * s, "#00e5ff"); // Cyan rune
      addRune(cx - 20 * s, cy - 45 * s, "#00e676"); // Emerald rune
      addLine(cx - 8 * s, cy - 30 * s, 15 * s);
      addLine(cx - 12 * s, cy - 20 * s, 12 * s);
      addLine(cx - 15 * s, cy - 12 * s, 8 * s);

      this.renderQueue.push({ y: cy + 15 * s, element: group });
    };

    // ----------------------------------------------------
    // PLACEMENT: Stone Knowledge Tablets
    // ----------------------------------------------------
    // Tablet Cluster 1 (Academy Left - empty open space)
    drawStoneKnowledgeTablet(logicCampusAnchors.academy.x - 850, logicCampusAnchors.academy.y - 560, 1.8, false);
    drawStoneKnowledgeTablet(logicCampusAnchors.academy.x - 900, logicCampusAnchors.academy.y - 600, 2.0, false);
    drawStoneKnowledgeTablet(logicCampusAnchors.academy.x - 1000, logicCampusAnchors.academy.y - 640, 1.6, true);
    drawStoneKnowledgeTablet(logicCampusAnchors.academy.x - 850, logicCampusAnchors.academy.y - 670, 1.8, false);
    drawStoneKnowledgeTablet(logicCampusAnchors.academy.x - 850, logicCampusAnchors.academy.y - 670, 1.8, false);

    // Tablet Cluster 2 (Library Right - empty open space)
    drawStoneKnowledgeTablet(plazaX - 2300, plazaY + 3550, 2.2, true);
    drawStoneKnowledgeTablet(plazaX - 2200, plazaY + 3590, 1.7, false);
    drawStoneKnowledgeTablet(plazaX - 2300, plazaY + 3650, 1.5, true);
    drawStoneKnowledgeTablet(plazaX - 2200, plazaY + 3630, 1.5, true);

    // ====================================================
    // NEW HELPER: Mini Library Shelters / Scroll Kiosks
    // ====================================================
    const drawMiniLibraryShelter = (cx, cy, scale = 1.0, variant = 0) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const s = scale;

      // Ground shadow
      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      shadow.setAttribute("cx", cx);
      shadow.setAttribute("cy", cy + 15 * s);
      shadow.setAttribute("rx", 50 * s);
      shadow.setAttribute("ry", 25 * s);
      shadow.setAttribute("fill", "rgba(0,0,0,0.2)");
      group.appendChild(shadow);

      // Base pad
      const base = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      base.setAttribute("points", `${cx},${cy + 10 * s} ${cx + 40 * s},${cy + 30 * s} ${cx},${cy + 50 * s} ${cx - 40 * s},${cy + 30 * s}`);
      base.setAttribute("fill", "#f8ffff");
      base.setAttribute("stroke", "#b7edf2");
      base.setAttribute("stroke-width", 3 * s);
      group.appendChild(base);

      // Columns helper
      const drawColumn = (px, py) => {
        const col = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        col.setAttribute("x", px - 4 * s);
        col.setAttribute("y", py - 40 * s);
        col.setAttribute("width", 8 * s);
        col.setAttribute("height", 40 * s);
        col.setAttribute("fill", "#cfd8dc");
        col.setAttribute("stroke", "#90a4ae");
        col.setAttribute("stroke-width", 2 * s);
        group.appendChild(col);
      };

      if (variant === 0) {
        // Roofed scroll stand
        drawColumn(cx - 20 * s, cy + 20 * s);
        drawColumn(cx + 20 * s, cy + 20 * s);
        drawColumn(cx - 20 * s, cy + 40 * s);
        drawColumn(cx + 20 * s, cy + 40 * s);

        const stand = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        stand.setAttribute("points", `${cx},${cy + 5 * s} ${cx + 15 * s},${cy + 12 * s} ${cx},${cy + 20 * s} ${cx - 15 * s},${cy + 12 * s}`);
        stand.setAttribute("fill", "#ffffff");
        stand.setAttribute("stroke", "#00cfe8");
        stand.setAttribute("stroke-width", 2 * s);
        group.appendChild(stand);

        const roof = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        roof.setAttribute("points", `${cx},${cy - 30 * s} ${cx + 35 * s},${cy - 10 * s} ${cx},${cy + 10 * s} ${cx - 35 * s},${cy - 10 * s}`);
        roof.setAttribute("fill", "#00cfe8");
        roof.setAttribute("stroke", "#80f7ff");
        roof.setAttribute("stroke-width", 3 * s);
        group.appendChild(roof);
      } else if (variant === 1) {
        // Mini open pavilion with books
        const arch = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arch.setAttribute("d", `M ${cx - 25 * s},${cy + 20 * s} Q ${cx},${cy - 20 * s} ${cx + 25 * s},${cy + 20 * s}`);
        arch.setAttribute("fill", "none");
        arch.setAttribute("stroke", "#b7edf2");
        arch.setAttribute("stroke-width", 8 * s);
        group.appendChild(arch);

        drawColumn(cx - 15 * s, cy + 35 * s);
        drawColumn(cx + 15 * s, cy + 35 * s);

        const book = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        book.setAttribute("points", `${cx - 5 * s},${cy + 20 * s} ${cx + 10 * s},${cy + 25 * s} ${cx + 5 * s},${cy + 32 * s} ${cx - 10 * s},${cy + 27 * s}`);
        book.setAttribute("fill", "#00cfe8");
        book.setAttribute("stroke", "#ffffff");
        book.setAttribute("stroke-width", 2 * s);
        group.appendChild(book);
      } else if (variant === 2) {
        // Compact study shelter
        const wall = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        wall.setAttribute("points", `${cx - 20 * s},${cy - 20 * s} ${cx},${cy - 30 * s} ${cx + 20 * s},${cy - 20 * s} ${cx + 20 * s},${cy + 15 * s} ${cx},${cy + 25 * s} ${cx - 20 * s},${cy + 15 * s}`);
        wall.setAttribute("fill", "#eceff1");
        wall.setAttribute("stroke", "#90a4ae");
        wall.setAttribute("stroke-width", 2 * s);
        group.appendChild(wall);

        const awning = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        awning.setAttribute("points", `${cx - 25 * s},${cy - 10 * s} ${cx + 25 * s},${cy - 10 * s} ${cx},${cy + 5 * s}`);
        awning.setAttribute("fill", "#00cfe8");
        awning.setAttribute("stroke", "#ffffff");
        awning.setAttribute("stroke-width", 2 * s);
        group.appendChild(awning);

        const slab = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        slab.setAttribute("points", `${cx},${cy + 15 * s} ${cx + 12 * s},${cy + 20 * s} ${cx},${cy + 25 * s} ${cx - 12 * s},${cy + 20 * s}`);
        slab.setAttribute("fill", "#ffffff");
        slab.setAttribute("stroke", "#b7edf2");
        slab.setAttribute("stroke-width", 2 * s);
        group.appendChild(slab);
      }

      this.renderQueue.push({ y: cy + 30 * s, element: group });
    };

    const kioskPlacements = [];
    if (this.logicCampusAnchors) {
      kioskPlacements.push({ x: this.logicCampusAnchors.library.x + 1520, y: this.logicCampusAnchors.library.y - 2960, scale: 7.0, variant: 0 });
      kioskPlacements.push({ x: this.logicCampusAnchors.library.x + 760, y: this.logicCampusAnchors.library.y + 1600, scale: 8.0, variant: 1 });
      kioskPlacements.push({ x: this.logicCampusAnchors.academy.x - 480, y: this.logicCampusAnchors.academy.y - 1700, scale: 4.2, variant: 0 });
      kioskPlacements.push({ x: this.logicCampusAnchors.dormA.x - 460, y: this.logicCampusAnchors.dormA.y + 2120, scale: 5.5, variant: 0 });
      kioskPlacements.push({ x: this.logicCampusAnchors.temple.x + 720, y: this.logicCampusAnchors.temple.y + 600, scale: 6.5, variant: 1 });
    }

    const validKiosks = [];
    const _sqr = (v) => v * v;
    const calcDist = (x1, y1, x2, y2) => Math.sqrt(_sqr(x1 - x2) + _sqr(y1 - y2));

    const isKioskPosValid = (kx, ky) => {
      if (this.logicCampusAnchors) {
        if (calcDist(kx, ky, this.logicCampusAnchors.academy.x, this.logicCampusAnchors.academy.y) < 220) return false;
        if (calcDist(kx, ky, this.logicCampusAnchors.library.x, this.logicCampusAnchors.library.y) < 220) return false;
        if (calcDist(kx, ky, this.logicCampusAnchors.dormA.x, this.logicCampusAnchors.dormA.y) < 220) return false;
        if (calcDist(kx, ky, this.logicCampusAnchors.temple.x, this.logicCampusAnchors.temple.y) < 220) return false;
      }

      const fountains = [
        { x: plazaX - 1400, y: plazaY + 2950 },
        { x: plazaX + 1880, y: plazaY + 350 },
        { x: plazaX + 2000, y: plazaY + 2550 },
        { x: plazaX + 900, y: plazaY - 1200 }
      ];
      for (let f of fountains) if (calcDist(kx, ky, f.x, f.y) < 180) return false;

      const tablets = [
        { x: logicCampusAnchors.academy.x - 850, y: logicCampusAnchors.academy.y - 560 },
        { x: logicCampusAnchors.academy.x - 900, y: logicCampusAnchors.academy.y - 600 },
        { x: logicCampusAnchors.academy.x - 1000, y: logicCampusAnchors.academy.y - 640 },
        { x: logicCampusAnchors.academy.x - 850, y: logicCampusAnchors.academy.y - 670 },
        { x: plazaX - 2300, y: plazaY + 3550 },
        { x: plazaX - 2200, y: plazaY + 3590 },
        { x: plazaX - 2300, y: plazaY + 3650 },
        { x: plazaX - 2200, y: plazaY + 3630 }
      ];
      for (let t of tablets) if (calcDist(kx, ky, t.x, t.y) < 160) return false;

      const distToSeg = (p, v, w) => {
        const l2 = _sqr(v.x - w.x) + _sqr(v.y - w.y);
        if (l2 === 0) return Math.sqrt(_sqr(p.x - v.x) + _sqr(p.y - v.y));
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(_sqr(p.x - (v.x + t * (w.x - v.x))) + _sqr(p.y - (v.y + t * (w.y - v.y))));
      };

      if (this.logicCampusAnchors) {
        const cJunction = { x: this.logicCampusAnchors.academy.x, y: this.logicCampusAnchors.academy.y + 400 };
        const libPathStart = { x: this.logicCampusAnchors.academy.x + 220, y: this.logicCampusAnchors.academy.y + 520 };
        const libPathJunction = { x: this.logicCampusAnchors.academy.x + 200, y: this.logicCampusAnchors.academy.y + 900 };
        const libPathEnd = { x: this.logicCampusAnchors.library.x + 20, y: this.logicCampusAnchors.library.y - 220 };

        const walkways = [
          [libPathStart, libPathJunction],
          [libPathJunction, libPathEnd],
          [cJunction, this.logicCampusAnchors.temple],
          [cJunction, this.logicCampusAnchors.dormA],
          [cJunction, this.logicCampusAnchors.academy]
        ];
        for (let w of walkways) if (distToSeg({ x: kx, y: ky }, w[0], w[1]) < 160) return false;

        const dxL = Math.abs(kx - this.logicCampusAnchors.academy.x);
        const dyL = Math.abs(ky - (this.logicCampusAnchors.academy.y + 900));
        if (dxL < 1600 + 120 && dyL < 400 + 120) return false;
      }

      if (!this.isValidEnvironmentPoint(kx, ky, 140)) return false;

      for (let vk of validKiosks) if (calcDist(kx, ky, vk.x, vk.y) < 180) return false;

      return true;
    };

    const fallbacks = [
      { dx: 120, dy: 0 },
      { dx: -120, dy: 0 },
      { dx: 0, dy: 120 },
      { dx: 0, dy: -120 },
      { dx: 150, dy: 100 }
    ];

    kioskPlacements.forEach(k => {
      if (isKioskPosValid(k.x, k.y)) {
        validKiosks.push({ x: k.x, y: k.y });
        drawMiniLibraryShelter(k.x, k.y, k.scale, k.variant);
      } else {
        for (let f of fallbacks) {
          const nx = k.x + f.dx;
          const ny = k.y + f.dy;
          if (isKioskPosValid(nx, ny)) {
            validKiosks.push({ x: nx, y: ny });
            drawMiniLibraryShelter(nx, ny, k.scale, k.variant);
            break;
          }
        }
      }
    });

    // 2. Small trimmed hedge clusters around the outer edges of the campus (10 clusters)
    // Left boundary hedges
    // (Removed centralJunction hedges to clear the region label area)
    drawHedge(logicCampusAnchors.library.x - 250, logicCampusAnchors.library.y + 150, 50);
    drawHedge(logicCampusAnchors.dormA.x - 200, logicCampusAnchors.dormA.y + 100, 45);

    // Right boundary hedges
    // (Removed centralJunction hedges to clear the region label area)
    drawHedge(logicCampusAnchors.temple.x + 200, logicCampusAnchors.temple.y + 120, 50);

    // 3. A few small academy trees near the campus boundary (5 trees, scaled up for visibility)
    this.renderAcademyTreeCustom(logicCampusAnchors.academy.x - 700, logicCampusAnchors.academy.y + 250, 16.0, logicCampusAnchors.academy.y + 250);
    this.renderAcademyTreeCustom(logicCampusAnchors.academy.x + 700, logicCampusAnchors.academy.y + 250, 16.0, logicCampusAnchors.academy.y + 250);
    this.renderAcademyTreeCustom(logicCampusAnchors.library.x - 420, logicCampusAnchors.library.y + 180, 14.0, logicCampusAnchors.library.y + 180);
    this.renderAcademyTreeCustom(logicCampusAnchors.temple.x + 380, logicCampusAnchors.temple.y + 150, 14.0, logicCampusAnchors.temple.y + 150);
    this.renderAcademyTreeCustom(centralJunction.x, centralJunction.y + 350, 18.0, centralJunction.y + 350);

    // [NEW] Hard Visibility Identity Markers (Checkpoint 4H.1)
    const drawMediumCyanArchive = (cx, cy) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", `translate(${cx}, ${cy}) scale(3.0)`);

      const base = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      base.setAttribute("points", `0,0 50,25 0,50 -50,25`);
      base.setAttribute("fill", "#b7edf2");
      base.setAttribute("stroke", "#00cfe8");
      base.setAttribute("stroke-width", "3");
      group.appendChild(base);

      const book = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      book.setAttribute("points", `0,-80 70,-48 0,-16 -70,-48`);
      book.setAttribute("fill", "#ffffff");
      book.setAttribute("stroke", "#00cfe8");
      book.setAttribute("stroke-width", "8");
      group.appendChild(book);

      this.renderQueue.push({ y: cy, element: group });
    };

    const drawMediumKnowledgePillar = (cx, cy) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", `translate(${cx}, ${cy}) scale(4.5)`);
      const base = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      base.setAttribute("points", `0,0 60,32 0,64 -60,32`);
      base.setAttribute("fill", "#b7edf2");
      base.setAttribute("stroke", "#00cfe8");
      base.setAttribute("stroke-width", "3");
      group.appendChild(base);
      const pillar = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      pillar.setAttribute("points", `-40,-80 40,-80 40,40 -40,40`);
      pillar.setAttribute("fill", "#f8ffff");
      pillar.setAttribute("stroke", "#00cfe8");
      pillar.setAttribute("stroke-width", "4");
      group.appendChild(pillar);
      const top = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      top.setAttribute("points", `0,-120 60,-88 0,-56 -60,-88`);
      top.setAttribute("fill", "#00cfe8");
      top.setAttribute("stroke", "#ffffff");
      top.setAttribute("stroke-width", "5");
      group.appendChild(top);
      this.renderQueue.push({ y: cy, element: group });
    };

    const drawMediumCrystalLamp = (cx, cy) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", `translate(${cx}, ${cy}) scale(4.5)`);
      const post = document.createElementNS("http://www.w3.org/2000/svg", "line");
      post.setAttribute("x1", "0"); post.setAttribute("y1", "0"); post.setAttribute("x2", "0"); post.setAttribute("y2", "-120");
      post.setAttribute("stroke", "#b7edf2"); post.setAttribute("stroke-width", "20");
      group.appendChild(post);
      const crystal = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      crystal.setAttribute("points", `0,-180 35,-120 0,-60 -35,-120`);
      crystal.setAttribute("fill", "#00cfe8");
      crystal.setAttribute("stroke", "#ffffff");
      crystal.setAttribute("stroke-width", "8");
      group.appendChild(crystal);
      this.renderQueue.push({ y: cy, element: group });
    };

    const drawMediumArchivePedestal = (cx, cy) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", `translate(${cx}, ${cy}) scale(4.5)`);
      const base = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      base.setAttribute("points", `0,0 80,40 0,80 -80,40`);
      base.setAttribute("fill", "#b7edf2");
      base.setAttribute("stroke", "#00cfe8");
      base.setAttribute("stroke-width", "3");
      group.appendChild(base);
      const top = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      top.setAttribute("points", `0,-30 70,5 0,40 -70,5`);
      top.setAttribute("fill", "#ffffff");
      top.setAttribute("stroke", "#00cfe8");
      top.setAttribute("stroke-width", "6");
      group.appendChild(top);
      this.renderQueue.push({ y: cy, element: group });
    };

    // 4. Draw Exactly 4 Visible Markers

    // 1 medium cyan book symbol near the main connector path (moved out of Academy pad)
    drawMediumCyanArchive(centralJunction.x - 850, centralJunction.y - 150);

    // 1 medium marble knowledge pillar near the Library side
    drawMediumKnowledgePillar(logicCampusAnchors.library.x + 500, logicCampusAnchors.library.y + 300);

    // 1 medium cyan crystal lamp near the Academy side
    drawMediumCrystalLamp(logicCampusAnchors.academy.x + 600, logicCampusAnchors.academy.y + 150);

    // 5. Final Draw Calls (Strictly from District Anchors)
    this.drawAcademyLibrary({
      x: logicCampusAnchors.library.x,
      y: logicCampusAnchors.library.y,
      scaleX: 11.2,
      scaleY: 17.6,
      rotation: 0
    });
    this.drawAcademyTemple({
      x: logicCampusAnchors.temple.x,
      y: logicCampusAnchors.temple.y,
      scaleX: 14.0,
      scaleY: 14.0,
      rotation: 0
    });
    this.drawAcademyDorm({
      x: logicCampusAnchors.dormA.x,
      y: logicCampusAnchors.dormA.y,
      scaleX: 12.0,
      scaleY: 12.0,
      rotation: 0
    });



    // 7. Ground Details and Edge Trees (Decoration Ring: 1300px+)
    // Edge framing trees (Large, Scale 18)
    this.renderAcademyTreeCustom(rootX - 1600 + 600, rootY - 600 + 300, 18.0, rootY - 600 + 300);
    this.renderAcademyTreeCustom(rootX - 1600 - 600, rootY - 600 + 200, 18.0, rootY - 600 + 200);
    this.renderAcademyTreeCustom(rootX + 1500 - 500, rootY + 300 + 350, 18.0, rootY + 300 + 350);
    this.renderAcademyTreeCustom(plazaX, plazaY + 700, 20.0, plazaY + 700); // Front focal tree

    // =========================================================================
    // [NEW] Checkpoint 5A - Logic Dominion Terrain & Campus Environment Upgrade
    // =========================================================================

    const drawCampusRock = (cx, cy) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", `translate(${cx}, ${cy}) scale(2.0)`);
      const rock = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      rock.setAttribute("points", "-15,5 0,-15 20,0 5,15");
      rock.setAttribute("fill", "#e0e0e0"); // pale stone
      rock.setAttribute("stroke", "#bdbdbd");
      rock.setAttribute("stroke-width", "2");
      group.appendChild(rock);
      this.renderQueue.push({ y: cy, element: group });
    };

    const drawSmallTreeCluster = (cx, cy) => {
      // Render 4 small trees (scale 10 to 14 -> 60px to 84px width each)
      // This ensures the cluster doesn't exceed 250px total width
      this.renderAcademyTreeCustom(cx, cy, 14.0, cy);
      this.renderAcademyTreeCustom(cx + 40, cy + 30, 11.0, cy + 30);
      this.renderAcademyTreeCustom(cx - 50, cy + 40, 12.0, cy + 40);
      this.renderAcademyTreeCustom(cx + 10, cy + 60, 10.0, cy + 60);
    };

    // 1. Add small curated tree clusters around outer Logic Dominion campus boundary
    // Removed all large blobs/patches to keep campus clean and buildings readable
    const smallTreeClusterLocs = [
      { x: plazaX - 1800, y: plazaY - 200 }, { x: plazaX + 2400, y: plazaY - 300 },
      { x: plazaX - 1000, y: plazaY - 1400 }, { x: plazaX + 1500, y: plazaY - 1200 },
      { x: plazaX - 1800, y: plazaY + 800 }, { x: plazaX + 1000, y: plazaY + 1600 },
      { x: plazaX - 700, y: plazaY - 400 }, { x: plazaX - 1100, y: plazaY - 600 },
      // Removed clusters that were placed near the center intersecting the label
      { x: plazaX - 1200, y: plazaY + 1000 },
      { x: plazaX + 1000, y: plazaY + 200 }, { x: plazaX + 1600, y: plazaY + 400 }
    ];
    smallTreeClusterLocs.forEach(loc => {
      drawSmallTreeCluster(loc.x, loc.y);
    });

    // 2. Add 5 small pale stone rock clusters in empty terrain areas
    const rockClusterLocs = [
      { x: plazaX - 900, y: plazaY - 1200 }, { x: plazaX + 1400, y: plazaY - 800 },
      { x: plazaX - 1600, y: plazaY + 300 }, { x: plazaX + 1800, y: plazaY - 100 },
      { x: plazaX - 400, y: plazaY + 1300 }
    ];
    rockClusterLocs.forEach(loc => {
      drawCampusRock(loc.x, loc.y);
      drawCampusRock(loc.x + 30, loc.y + 15);
      drawCampusRock(loc.x - 20, loc.y + 10);
    });

    // =========================================================================
    // [NEW] Checkpoint 5B - Logic Dominion Outer Forest Belt
    // =========================================================================

    const drawOuterForestCluster = (cx, cy) => {
      // 4 small trees per cluster. Canopy width 70 to 110px -> scales 12.0 to 18.0
      this.renderAcademyTreeCustom(cx, cy, 18.0, cy);
      this.renderAcademyTreeCustom(cx + 60, cy + 30, 15.0, cy + 30);
      this.renderAcademyTreeCustom(cx - 70, cy + 50, 16.0, cy + 50);
      this.renderAcademyTreeCustom(cx + 30, cy + 80, 14.0, cy + 80);
    };

    const drawGrassDetail = (cx, cy) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", `translate(${cx}, ${cy})`);
      const blade = document.createElementNS("http://www.w3.org/2000/svg", "path");
      blade.setAttribute("d", "M -10,0 Q -15,-20 -25,-30 M 0,0 Q 5,-25 10,-35 M 10,0 Q 20,-15 30,-25");
      blade.setAttribute("stroke", "#7b9e59");
      blade.setAttribute("stroke-width", "3");
      blade.setAttribute("fill", "none");
      blade.setAttribute("opacity", "0.7");
      group.appendChild(blade);
      this.renderQueue.push({ y: rootY - 1400, element: group });
    };

    // Add 9 curated tree clusters to the outer left, upper-left, and lower-left bounds
    const outerForestLocs = [
      // Upper-Left
      { x: plazaX - 1500, y: plazaY - 1600 },
      { x: plazaX - 2100, y: plazaY - 1200 },
      { x: plazaX - 2400, y: plazaY - 700 },
      // Left
      { x: plazaX - 2600, y: plazaY - 200 },
      { x: plazaX - 2500, y: plazaY + 400 },
      { x: plazaX - 2200, y: plazaY + 900 },
      // Lower-Left
      { x: plazaX - 1800, y: plazaY + 1400 },
      { x: plazaX - 2000, y: plazaY + 1800 },
      { x: plazaX - 1400, y: plazaY + 2000 }
    ];

    outerForestLocs.forEach((loc, index) => {
      drawOuterForestCluster(loc.x, loc.y);
      drawGrassDetail(loc.x - 40, loc.y + 20);
      drawGrassDetail(loc.x + 60, loc.y - 10);
      // Add stones near 4 clusters
      if (index % 2 === 0 && index < 8) {
        drawCampusRock(loc.x + 100, loc.y + 40);
        drawCampusRock(loc.x - 90, loc.y + 10);
      }
    });

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

    // 1. Cracked Dark Terrain Base (Purple Ground Effects)
    const patchLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const patchShadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    patchShadow.setAttribute("cx", rootX); patchShadow.setAttribute("cy", rootY + 600);
    patchShadow.setAttribute("rx", 1900); patchShadow.setAttribute("ry", 1000);
    patchShadow.setAttribute("fill", "#311b92");
    patchShadow.setAttribute("opacity", "0.25");
    patchShadow.setAttribute("filter", "blur(40px)");
    patchShadow.style.mixBlendMode = "multiply";
    patchLayer.appendChild(patchShadow);
    this.renderQueue.push({ y: zBasePatch, element: patchLayer });

    // 2. Corruption Fissures (Removed per user request)

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

    // 5. Procedural Spawn Rings
    const numObjects = 80;
    for (let i = 0; i < numObjects; i++) {
      // Deterministic random for consistent layout
      const r1 = window.rng ? window.rng.next() : Math.random();
      const r2 = window.rng ? window.rng.next() : Math.random();
      const r3 = window.rng ? window.rng.next() : Math.random();

      const angle = r1 * Math.PI * 2;

      // Sprint 1: Hero Exclusion Zone
      // Inner Ring (0 - 1400): Empty
      // Middle Ring (1400 - 1800): Reserved for future placement
      // Outer & Edge Rings (1800 - 2800): Redistributed props
      const radius = 1800 + (r2 * 1000);

      const tx = rootX + Math.cos(angle) * radius;
      const ty = rootY + Math.sin(angle) * radius * 0.5;

      // Ensure components only spawn inside the Debug Wasteland polygon
      if (this.territoryPolygons && this.territoryPolygons.debug) {
        if (!this.isPointInPolygon(tx, ty, this.territoryPolygons.debug)) {
          continue;
        }
      }

      // Ensure components do not spawn in the ocean, off the island, or on roads
      if (!this.isValidEnvironmentPoint(tx, ty, 80)) {
        continue;
      }

      // Strictly enforce the global island boundaries to prevent beach/ocean clipping
      const dxIsland = tx - this.centerX;
      const dyIsland = ty - this.centerY;
      const globalRx = (this.bounds.maxX - this.bounds.minX) / 2 * 1.15 * 1.8;
      const globalRy = (this.bounds.maxY - this.bounds.minY) / 2 * 1.15 * 1.8;
      const normalizedDist = (dxIsland * dxIsland) / (globalRx * globalRx) + (dyIsland * dyIsland) / (globalRy * globalRy);
      if (normalizedDist > 0.75) {
        continue;
      }

      if (radius < 2300) {
        // Outer Ring: dead trees, bushes, crystal fields, debris, corruption patches
        if (r3 < 0.25) {
          const forest = this.createDeadTreeMass(tx, ty, 60 + r1 * 40, 30 + r2 * 20);
          this.renderQueue.push({ y: ty + 10, element: forest });
        } else if (r3 < 0.5) {
          this.drawCorruptedCrystalCluster(tx, ty, 2.0 + r1 * 2.0);
        } else if (r3 < 0.75) {
          this.drawRuinedBuilding(tx, ty, 2.5 + r2 * 2.0);
        } else {
          this.drawGroundCrack(tx, ty, 4.0 + r1 * 2.0);
        }
      } else {
        // Edge Ring: mountains, cliffs, giant crystal formations
        let scaleMultiplier = (ty > rootY) ? 0.6 : 1.0;

        if (r3 < 0.4) {
          this.drawCorruptedCrystalCluster(tx, ty, (5.0 + r1 * 3.0) * scaleMultiplier);
        } else if (r3 < 0.7) {
          this.drawRuinedBuilding(tx, ty, (6.0 + r2 * 3.0) * scaleMultiplier);
        } else {
          this.drawCorruptCrystal(tx, ty, (4.5 + r1 * 3.0) * scaleMultiplier);
        }
      }
    }

    // Sprint 2: Corrupted Architecture
    // 1. Broken Watch Towers (2) - Placed using explicit X/Y coordinates relative to the root
    const towerPlacements = [
      { x: rootX - 1870, y: rootY - 475, scale: 9.0 }, // Top-Left Watch Tower
      { x: rootX - 950, y: rootY + 1055, scale: 9.0 },
      { x: rootX - 3500, y: rootY - 1075, scale: 6.0 },
      { x: rootX + 2100, y: rootY + 3515, scale: 6.0 }, // Top-Left Watch Tower // Top-Left Watch Tower
    ];

    // ALWAYS consume exactly 12 random numbers here to preserve the seeded determinism 
    // of the entire outer ring generation that happens afterwards!
    for (let i = 0; i < 12; i++) {
      if (window.rng) window.rng.next(); else Math.random();
    }

    // Render the towers at their exact hardcoded positions
    for (let i = 0; i < towerPlacements.length; i++) {
      let tower = towerPlacements[i];
      let variant = i % 2; // Alternates between the two crystal scattering patterns
      // Collision checks completely REMOVED for these towers to GUARANTEE they spawn exactly where requested.
      this.drawDebugWatchTower(tower.x, tower.y, tower.scale, 0, variant);
    }

    // 2. Corrupted Obelisks - Placed using explicit X/Y coordinates relative to the root
    const obeliskPlacements = [
      { x: rootX - 2400, y: rootY + 1800, scale: 5.5, rotation: 5 },
    ];

    // BURN RNGs to preserve seed determinism! The original code used a random number of loops,
    // so we must calculate that same random loop count and consume exactly the right amount of RNGs.
    const rngObelisksToBurn = 2 + Math.floor((window.rng ? window.rng.next() : Math.random()) * 3);
    for (let i = 0; i < rngObelisksToBurn; i++) {
      if (window.rng) {
        window.rng.next(); // angle
        window.rng.next(); // radius
        window.rng.next(); // scale
        window.rng.next(); // rotation
      } else {
        Math.random(); Math.random(); Math.random(); Math.random();
      }
    }

    // Render the obelisks at their exact hardcoded positions
    for (let obelisk of obeliskPlacements) {
      this.drawDebugObelisk(obelisk.x, obelisk.y, obelisk.scale, obelisk.rotation);
    }

    // 3. Giant Crystal Pillars (5) - Placed using explicit X/Y coordinates relative to the root
    const crystalPlacements = [
      { x: rootX + 950, y: rootY + 300, scale: 5.0, rotation: 2, type: 1 },
      { x: rootX + 460, y: rootY + 710, scale: 5.5, rotation: -1, type: 2 },
      { x: rootX - 1210, y: rootY + 440, scale: 7.0, rotation: 3, type: 3 },
      { x: rootX - 1010, y: rootY - 40, scale: 6.5, rotation: -2, type: 1 },
      { x: rootX - 1260, y: rootY + 2200, scale: 9.0, rotation: 0, type: 2 },
    ];

    // ALWAYS consume exactly 26 random numbers here to preserve the seeded determinism 
    // of the entire outer ring generation that happens afterwards!
    for (let i = 0; i < 26; i++) {
      if (window.rng) window.rng.next(); else Math.random();
    }

    // Render the giant crystals at their exact hardcoded positions
    for (let crystal of crystalPlacements) {
      // Collision checks completely REMOVED for these crystals to GUARANTEE they spawn exactly where requested.
      this.drawDebugGiantCrystal(crystal.x, crystal.y, crystal.scale, crystal.rotation, crystal.type);

    }

    // Sprint 3A: Debug Wasteland Ground Ecology
    // Ecological foundation: Corruption patches, dead trees, cracks, scatter. No ruins!
    const sprint3Items = 800; // Massively increased loop count for density
    for (let i = 0; i < sprint3Items; i++) {
      // ALWAYS consume exactly 5 RNG calls per iteration to strictly preserve global deterministic state for subsequent biomes!
      const r1 = window.rng ? window.rng.next() : Math.random();
      const r2 = window.rng ? window.rng.next() : Math.random();
      const r3 = window.rng ? window.rng.next() : Math.random();
      const r4 = window.rng ? window.rng.next() : Math.random();
      const r5 = window.rng ? window.rng.next() : Math.random();

      // Target generation specifically within a 4000x4000 box around the fortress to guarantee high hit rate in the biome polygon
      const tx = rootX + (r1 - 0.5) * 4000;
      const ty = rootY + (r2 - 0.5) * 3500;

      // Hero exclusion zone (keep immediate fortress clear)
      const dx = tx - rootX;
      const dy = ty - rootY;
      const distFromFortress = Math.sqrt(dx * dx + dy * dy);
      if (distFromFortress < 1300) continue;

      if (this.territoryPolygons && this.territoryPolygons.debug && !this.isPointInPolygon(tx, ty, this.territoryPolygons.debug)) continue;
      if (!this.isValidEnvironmentPoint(tx, ty, 50)) continue;

      const dxIsland = tx - this.centerX;
      const dyIsland = ty - this.centerY;
      const globalRx = (this.bounds.maxX - this.bounds.minX) / 2 * 1.15 * 1.8;
      const globalRy = (this.bounds.maxY - this.bounds.minY) / 2 * 1.15 * 1.8;
      const normalizedDist = (dxIsland * dxIsland) / (globalRx * globalRx) + (dyIsland * dyIsland) / (globalRy * globalRy);
      if (normalizedDist > 0.65) continue;

      const itemType = Math.floor(r3 * 4); // 0 to 3 (No Ruins)
      const rotation = r4 * 360;

      switch (itemType) {
        case 0: // Corruption patches (massive scale to hit 20-30% coverage)
          this.drawDebugGroundPatch(tx, ty, 3.0 + (r5 * 5.0), rotation, Math.floor(r5 * 3));
          break;
        case 1: // Dead Trees
          this.drawDebugDeadTree(tx, ty, 0.8 + (r5 * 1.5), rotation);
          break;
        case 2: // Ground Cracks
          this.drawDebugGroundCrack(tx, ty, 1.5 + (r5 * 2.0), rotation);
          break;
        case 3: // Scatter debris
          this.drawDebugScatter(tx, ty, Math.floor(r5 * 3) + 1);
          break;
      }
    }

    // Sprint 3C: Final Ruins Polish (Fallen Civilization)
    // Preserve deterministic state from previous Sprint 3B (156 RNG calls)
    for (let i = 0; i < 156; i++) {
      if (window.rng) window.rng.next();
    }

    // Site 1: Upper-Left Ruin Site (Collapsed Gateway)
    // Tucked safely behind the top-left broken tower, far from the bridge
    const s1X = rootX - 1800;
    const s1Y = rootY - 850;
    // Blend with corruption
    this.drawDebugGroundPatch(s1X, s1Y, 7.0, 0, 1); // Purple stain
    this.drawDebugGroundCrack(s1X, s1Y, 5.0, 15);
    // Cohesive architectural cluster
    this.drawDebugRuinsExtended(s1X, s1Y, 5.5, 0, 4); // Collapsed Gateway
    this.drawDebugRuinsExtended(s1X - 80, s1Y + 30, 5.0, 15, 0); // Broken wall
    this.drawDebugRuinsExtended(s1X + 90, s1Y + 20, 4.0, -25, 1); // Fallen pillar
    this.drawDebugRuinsExtended(s1X - 40, s1Y + 60, 6.0, 0, 3); // Cracked foundation
    this.drawDebugRuinsExtended(s1X + 50, s1Y + 50, 4.0, 0, 2); // Rubble pile

    // Site 2: Lower-Left Ruin Site (Stone Walls & Pillars)
    // Placed deep in the lower-left grassy field, far from the road
    const s2X = rootX - 1800;
    const s2Y = rootY + 850;
    // Blend with corruption
    this.drawDebugGroundPatch(s2X, s2Y, 6.5, 0, 1); // Purple stain
    this.drawDebugGroundCrack(s2X, s2Y, 4.5, -30);
    // Cohesive architectural cluster
    this.drawDebugRuinsExtended(s2X, s2Y - 20, 5.5, 0, 0); // Broken wall
    this.drawDebugRuinsExtended(s2X + 60, s2Y + 10, 4.5, 45, 1); // Fallen pillar
    this.drawDebugRuinsExtended(s2X - 50, s2Y + 40, 5.5, 0, 3); // Cracked foundation
    this.drawDebugRuinsExtended(s2X + 30, s2Y + 50, 4.5, 0, 2); // Rubble pile

    // Subtle Road Damage (cracks and small rubble next to the main pathway)
    this.drawDebugGroundCrack(rootX - 1600, rootY + 30, 4.0, 25);
    this.drawDebugRuinsExtended(rootX - 1600, rootY - 40, 2.5, 0, 2); // Small rubble beside road

    this.drawDebugGroundCrack(rootX - 2600, rootY + 60, 5.0, -15);
    this.drawDebugRuinsExtended(rootX - 2600, rootY + 120, 2.5, 45, 1); // Small pillar beside road

    // Final Polish Filler Spaces
    // 1. Far Left (Upper-Left empty field near river - Image 2)
    // Base: rootX - 2600, rootY - 1000 (Perfect placement)
    const farLeftSpots = [
      { x: rootX - 2600, y: rootY - 1000 },
      { x: rootX - 2700, y: rootY - 950 },
      { x: rootX - 2500, y: rootY - 1050 },
      { x: rootX - 2800, y: rootY - 1100 },
      { x: rootX - 2400, y: rootY - 900 },
      { x: rootX - 2650, y: rootY - 1150 },
      { x: rootX - 2550, y: rootY - 850 },
      { x: rootX - 2900, y: rootY - 1000 }
    ];

    farLeftSpots.forEach(spot => {
      this.drawDebugCrystalCluster(spot.x, spot.y, 2.0);
      this.drawDebugCrystalCluster(spot.x + 30, spot.y + 20, 1.5);
      this.drawDebugCrystalCluster(spot.x - 20, spot.y + 30, 1.7);
    });
    // Drop a tiny watch tower right in the middle of this far-left cluster
    this.drawDebugWatchTower(rootX - 2600, rootY - 1000, 3.5, 0);

    // 2. Bottom Right (near coast/road curve - Image 3)
    // Base: rootX + 1400, rootY + 1100 (Perfect placement)
    const bottomRightSpots = [
      { x: rootX + 1400, y: rootY + 1100 },
      { x: rootX + 1500, y: rootY + 1150 },
      { x: rootX + 1300, y: rootY + 1050 },
      { x: rootX + 1600, y: rootY + 1200 },
      { x: rootX + 1200, y: rootY + 1000 },
      { x: rootX + 1450, y: rootY + 1000 },
      { x: rootX + 1350, y: rootY + 1200 }
    ];

    bottomRightSpots.forEach(spot => {
      this.drawDebugCrystalCluster(spot.x, spot.y, 2.0);
      this.drawDebugCrystalCluster(spot.x - 30, spot.y + 20, 1.5);
      this.drawDebugCrystalCluster(spot.x + 25, spot.y - 15, 1.7);
    });
    // Add one tiny watch tower to anchor it
    this.drawDebugWatchTower(rootX + 1400, rootY + 1100, 3.5, 0);
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

    // 1. Ancient Mossy Stone Foundation (REMOVED per user request)
    // const foundationGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // this.renderQueue.push({ y: zFoundation, element: foundationGroup });

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
    // const canopy1 = this.createVerticalSliceCanopy(rootX - 800, rootY - 100, 600, 400); // West massive
    // const canopy2 = this.createVerticalSliceCanopy(rootX + 850, rootY - 50, 550, 350);  // East massive
    // const canopy3 = this.createVerticalSliceCanopy(rootX - 500, rootY - 500, 450, 250); // NW fill
    // const canopy4 = this.createVerticalSliceCanopy(rootX + 500, rootY + 600, 400, 250); // SE corner near water

    // this.renderQueue.push({ y: rootY - 100, element: canopy1 });
    // this.renderQueue.push({ y: rootY - 50, element: canopy2 });
    // this.renderQueue.push({ y: rootY - 500, element: canopy3 });
    // this.renderQueue.push({ y: rootY + 600, element: canopy4 });

    // 5. Perimeter Shrines, Pillars, and Flora (Scale 16-24)
    this.drawPythonShrine(rootX - 900, rootY + 300, 20.0);
    this.drawPythonShrine(rootX + 800, rootY + 250, 18.0);
    this.drawPythonRuinPillar(rootX - 400, rootY + 350, 22.0);
    this.drawPythonRuinPillar(rootX + 350, rootY + 400, 20.0);
    this.drawPythonRuinPillar(rootX - 100, rootY + 850, 24.0); // Next to stream

    this.drawPythonHeroFlora(rootX - 600, rootY + 500, 20.0);
    this.drawPythonHeroFlora(rootX + 500, rootY + 700, 24.0);
    this.drawPythonHeroFlora(rootX + 900, rootY + 100, 20.0);

    // 6. Ancient Jungle Ruins / Mossy Rune Stones
    const ruinPlacements = [
      { x: rootX - 1100, y: rootY - 200, scale: 5.5, variant: 0 }, // Far Left
      { x: rootX - 2000, y: rootY + 1100, scale: 6.0, variant: 2 }, // Bottom Left (above stream)
      { x: rootX - 800, y: rootY - 600, scale: 3.0, variant: 1 }, // Top Left
      { x: rootX + 1300, y: rootY - 50, scale: 5.0, variant: 2 },  // Top Right
      { x: rootX - 430, y: rootY - 3000, scale: 7.5, variant: 2 },
      { x: rootX - 2500, y: rootY - 2700, scale: 4.5, variant: 2 }, // Bottom Left (above stream)
    ];

    ruinPlacements.forEach(ruin => {
      // PER USER REQUEST: Place EXACTLY at specified positions only.
      // No fallback shifts, no overlap safety rules.
      const px = ruin.x;
      const py = ruin.y;

      // Ensure ruins placed 'behind' the temple's Y origin still render on top of its sprawling base
      const zSort = py < rootY ? rootY + 1 : py;
      // Doubled the scale multiplier from 14.0 to 28.0 to make them much more visible
      this.drawPythonJungleRuin(px, py, ruin.scale * 28.0, ruin.variant, zSort);
    });

    // 7. Dense Jungle Clusters + Hanging Vines (Step 2)
    const pythonAnchor = { x: rootX, y: rootY }; 
    const plannedClusters = [
      { x: pythonAnchor.x - 720, y: pythonAnchor.y - 420, scale: 1.7, variant: 0 },
      { x: pythonAnchor.x - 420, y: pythonAnchor.y - 620, scale: 1.6, variant: 1 },
      { x: pythonAnchor.x + 520, y: pythonAnchor.y - 360, scale: 1.55, variant: 0 },
      { x: pythonAnchor.x + 720, y: pythonAnchor.y + 120, scale: 1.45, variant: 1 },
      { x: pythonAnchor.x - 780, y: pythonAnchor.y + 260, scale: 1.5, variant: 2 },
      { x: pythonAnchor.x - 300, y: pythonAnchor.y + 520, scale: 1.4, variant: 0 },
      { x: pythonAnchor.x + 220, y: pythonAnchor.y + 470, scale: 1.35, variant: 2 },
      { x: pythonAnchor.x + 180, y: pythonAnchor.y - 760, scale: 1.45, variant: 1 }
    ];

    const placedClusters = [];
    const minDists = { temple: 400, infra: 180, label: 170, ruin: 130, cluster: 160 };
    // Approx label position based on typical placement
    const labelPos = { x: pythonAnchor.x, y: pythonAnchor.y + 250 }; 

    for (const cluster of plannedClusters) {
      const tryPlace = (testX, testY) => {
        // Distance to temple
        if (Math.sqrt((testX - pythonAnchor.x)**2 + (testY - pythonAnchor.y)**2) < minDists.temple) return false;
        // Distance to label
        if (Math.sqrt((testX - labelPos.x)**2 + (testY - labelPos.y)**2) < minDists.label) return false;

        // Distance to roads/rivers (infra)
        if (this.infrastructurePoints) {
           for (const pt of this.infrastructurePoints) {
             if (Math.sqrt((pt.x - testX)**2 + (pt.y - testY)**2) < minDists.infra) return false;
           }
        }

        // Distance to ruins
        for (const r of ruinPlacements) {
           if (Math.sqrt((r.x - testX)**2 + (r.y - testY)**2) < minDists.ruin) return false;
        }

        // Distance to other clusters
        for (const c of placedClusters) {
           if (Math.sqrt((c.x - testX)**2 + (c.y - testY)**2) < minDists.cluster) return false;
        }

        return true;
      };

      let validPos = null;
      const fallbacks = [
        { dx: 0, dy: 0 },
        { dx: 150, dy: 0 },
        { dx: -150, dy: 0 },
        { dx: 0, dy: 150 },
        { dx: 0, dy: -150 },
        { dx: 180, dy: 100 },
        { dx: -180, dy: 100 }
      ];

      for (const offset of fallbacks) {
        if (tryPlace(cluster.x + offset.dx, cluster.y + offset.dy)) {
          validPos = { x: cluster.x + offset.dx, y: cluster.y + offset.dy };
          break;
        }
      }

      if (validPos) {
        placedClusters.push(validPos);
        const zSort = validPos.y < rootY ? rootY + 1 : validPos.y;
        this.drawPythonJungleCluster(validPos.x, validPos.y, cluster.scale * 15.0, cluster.variant, zSort); 
      }
    }
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
    return;
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
          { path: 'M 7500,2500 C 8000,3500 7500,4500 6500,5000' }
          // { path: 'M 6500,5000 C 6000,5200 5800,5300 5500,5500' }
        ]
      }
    ];

    roadsConfig.forEach(road => drawRoad(road));

    const internalRoads = [
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
      // {
      //   id: 'python-village-trail',
      //   type: 'internal-road',
      //   baseColor: '#4A2F1B', coreColor: '#E8D2A8', baseOpacity: 0.75, coreOpacity: 1.0,
      //   baseWidth: 120, coreWidth: 60,
      //   segments: [
      //     { path: 'M 5500,5500 C 5800,5300 6000,5600 6200,5500' }
      //   ]
      // },

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
    foundation.setAttribute("x", -w / 2);
    foundation.setAttribute("y", -h / 2);
    foundation.setAttribute("width", w);
    foundation.setAttribute("height", h);
    foundation.setAttribute("fill", config.baseColor);
    foundation.setAttribute("rx", 40);
    foundation.setAttribute("ry", 40);
    g.appendChild(foundation);

    // Cyan decorative trim
    const trim = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    trim.setAttribute("x", -w / 2 + 10);
    trim.setAttribute("y", -h / 2 + 10);
    trim.setAttribute("width", w - 20);
    trim.setAttribute("height", h - 20);
    trim.setAttribute("fill", "none");
    trim.setAttribute("stroke", "#00bcd4"); // cyan trim
    trim.setAttribute("stroke-width", "4");
    trim.setAttribute("rx", 30);
    g.appendChild(trim);

    // Deck
    const deck = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    deck.setAttribute("x", -w / 2 + 40);
    deck.setAttribute("y", -h / 2);
    deck.setAttribute("width", w - 80);
    deck.setAttribute("height", h);
    deck.setAttribute("fill", config.deckColor);
    g.appendChild(deck);

    // Small side parapets
    [-roadWidth / 2 - 10, roadWidth / 2].forEach(yPos => {
      const parapet = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      parapet.setAttribute("x", -w / 2);
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
    deck.setAttribute("x", -w / 2);
    deck.setAttribute("y", -h / 2);
    deck.setAttribute("width", w);
    deck.setAttribute("height", h);
    deck.setAttribute("fill", config.baseColor);
    g.appendChild(deck);

    // Industrial orange accents and rails
    [-roadWidth / 2 - 30, roadWidth / 2 + 10].forEach(yPos => {
      const rail = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rail.setAttribute("x", -w / 2);
      rail.setAttribute("y", yPos);
      rail.setAttribute("width", w);
      rail.setAttribute("height", 20);
      rail.setAttribute("fill", "#ff9800"); // orange accent
      g.appendChild(rail);

      // Rivets on the rail
      for (let i = -w / 2 + 20; i < w / 2; i += 40) {
        const rivet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        rivet.setAttribute("cx", i);
        rivet.setAttribute("cy", yPos + 10);
        rivet.setAttribute("r", 3);
        rivet.setAttribute("fill", "#000");
        g.appendChild(rivet);
      }
    });

    // Mechanical support beams crossing the road
    for (let i = -w / 2 + 40; i < w / 2; i += 80) {
      const beam = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      beam.setAttribute("x", i);
      beam.setAttribute("y", -h / 2);
      beam.setAttribute("width", 20);
      beam.setAttribute("height", h);
      beam.setAttribute("fill", config.deckColor);
      g.appendChild(beam);

      // X bracing
      const brace1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      brace1.setAttribute("x1", i);
      brace1.setAttribute("y1", -h / 2);
      brace1.setAttribute("x2", i + 20);
      brace1.setAttribute("y2", h / 2);
      brace1.setAttribute("stroke", "#ff9800");
      brace1.setAttribute("stroke-width", "4");
      g.appendChild(brace1);

      const brace2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      brace2.setAttribute("x1", i + 20);
      brace2.setAttribute("y1", -h / 2);
      brace2.setAttribute("x2", i);
      brace2.setAttribute("y2", h / 2);
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
    foundation.setAttribute("x", -w / 2);
    foundation.setAttribute("y", -h / 2);
    foundation.setAttribute("width", w);
    foundation.setAttribute("height", h);
    foundation.setAttribute("fill", config.baseColor);
    g.appendChild(foundation);

    // Layered timber planks
    for (let i = -w / 2 + 5; i < w / 2; i += 15) {
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
    [-roadWidth / 2 - 20, roadWidth / 2 + 10].forEach(yPos => {
      // Posts
      for (let i = -w / 2 + 20; i < w / 2; i += 60) {
        const post = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        post.setAttribute("cx", i);
        post.setAttribute("cy", yPos + 5);
        post.setAttribute("r", 6);
        post.setAttribute("fill", "#3e2723");
        g.appendChild(post);
      }

      // The rope (a wavy line)
      let d = `M ${-w / 2 + 20} ${yPos + 5}`;
      for (let i = -w / 2 + 20 + 60; i < w / 2; i += 60) {
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
    let d = `M ${-w / 2},${-h / 2} `;
    // Top edge uneven
    for (let i = -w / 2; i <= w / 2; i += 40) {
      d += `L ${i},${-h / 2 + window.rng.next() * 20 - 10} `;
    }
    // Right edge
    d += `L ${w / 2},${h / 2} `;
    // Bottom edge uneven
    for (let i = w / 2; i >= -w / 2; i -= 40) {
      d += `L ${i},${h / 2 + window.rng.next() * 20 - 10} `;
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
      crack.setAttribute("d", `M ${startX},${startY} L ${startX + window.rng.next() * 40 - 20},${startY + window.rng.next() * 40 - 20} L ${startX + window.rng.next() * 40 - 20},${startY + window.rng.next() * 40 - 20}`);
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
      const cy = (window.rng.next() > 0.5 ? 1 : -1) * (roadWidth / 2 - window.rng.next() * 30);

      const sizeX = 15 + window.rng.next() * 20;
      const sizeY = 25 + window.rng.next() * 30;

      crystal.setAttribute("points", `${cx},${cy} ${cx + sizeX / 2},${cy - sizeY} ${cx + sizeX},${cy}`);
      crystal.setAttribute("fill", config.accentColor);
      g.appendChild(crystal);

      // Crystal core
      const core = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      core.setAttribute("points", `${cx + sizeX / 4},${cy} ${cx + sizeX / 2},${cy - sizeY * 0.8} ${cx + sizeX * 0.75},${cy}`);
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
          const dist = dx * dx + dy * dy;
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
        const normalizedDist = (dx * dx) / (islandRx * islandRx) + (dy * dy) / (islandRy * islandRy);
        if (normalizedDist > 0.8) continue; // Keep away from the beach edge

        if (!this.isCollision(jitterX, jitterY, 150)) {
          // Euclidean proximity check for Endemic Ecology
          let nearestRegion = null;
          let minDist = Infinity;
          for (let r of this.regionsConfig) {
            const rdx = r.x - jitterX;
            const rdy = r.y - jitterY;
            const dist = Math.sqrt(rdx * rdx + rdy * rdy);
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
    const angles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];

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
      for (let i = 0; i < ridge.count; i++) {
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
    base.setAttribute("points", `0,-${size} -${size * 0.3},0 0,${size * 0.2} ${size * 0.3},0`);
    base.setAttribute("fill", "#7b1fa2");

    const core = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    core.setAttribute("points", `0,-${size * 0.9} -${size * 0.15},0 0,${size * 0.1} ${size * 0.15},0`);
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

  drawDebugGroundPatch(x, y, scale, rotation, type) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`);
    g.style.pointerEvents = "none";

    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if (type === 0) {
      // Deep burnt black/gray soil
      p.setAttribute("d", "M -20,-10 C -10,-25 15,-15 25,-5 C 35,10 20,25 0,15 C -20,10 -35,5 -20,-10 Z");
      p.setAttribute("fill", "rgba(20, 22, 25, 0.45)");
    } else if (type === 1) {
      // Purple corruption stain
      p.setAttribute("d", "M -15,-5 C -5,-20 20,-10 25,5 C 30,15 10,30 -10,15 C -25,5 -25,-5 -15,-5 Z");
      p.setAttribute("fill", "rgba(150, 0, 255, 0.2)");
    } else {
      // Ash fields
      p.setAttribute("d", "M -30,0 C -20,-15 10,-25 25,0 C 40,25 0,35 -20,20 C -35,10 -40,15 -30,0 Z");
      p.setAttribute("fill", "rgba(50, 50, 55, 0.3)");
    }
    p.setAttribute("filter", "blur(12px)");
    g.appendChild(p);

    // Z-sort at y - 2000 so ground patches physically lay under all other 3D geometry
    this.renderQueue.push({ y: y - 2000, element: g });
  }

  drawDebugDeadTree(x, y, scale, rotation) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`);
    g.style.pointerEvents = "none";

    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 2);
    shadow.setAttribute("rx", 10); shadow.setAttribute("ry", 5);
    shadow.setAttribute("fill", "rgba(0,0,0,0.4)");
    shadow.setAttribute("filter", "blur(2px)");
    g.appendChild(shadow);

    // Twisted dead trunk
    g.appendChild(this.createPoly("-3,0 3,0 1,-35 -2,-35", "#181a1c"));

    // Jagged dead branches
    g.appendChild(this.createPoly("0,-15 12,-22 14,-19 1,-12", "#222529"));
    g.appendChild(this.createPoly("0,-25 -10,-33 -8,-35 2,-25", "#181a1c"));
    g.appendChild(this.createPoly("8,-20 12,-30 14,-28 10,-19", "#222529"));

    this.renderQueue.push({ y: y, element: g });
  }

  drawDebugGroundCrack(x, y, scale, rotation) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`);
    g.style.pointerEvents = "none";

    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", "M 0,0 L 5,-10 L 2,-15 L 10,-25 M 5,-10 L 15,-5");
    p.setAttribute("stroke", "#1e1e1e");
    p.setAttribute("stroke-width", "2");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    p.setAttribute("fill", "none");
    p.setAttribute("opacity", "0.8");
    g.appendChild(p);

    this.renderQueue.push({ y: y - 1000, element: g });
  }

  drawDebugScatter(x, y, type) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y})`);
    g.style.pointerEvents = "none";

    if (type === 1) {
      g.appendChild(this.createPoly("-4,-2 4,2 6,0 -2,-4", "#1e1e1e"));
    } else if (type === 2) {
      g.appendChild(this.createPoly("-2,-1 2,1 3,0 -1,-2", "#7f8c8d"));
    } else {
      g.appendChild(this.createPoly("-1,-1 1,1 2,-1 0,-3", "#d35400"));
    }

    this.renderQueue.push({ y: y, element: g });
  }

  drawDebugRuinsExtended(x, y, scale, rotation, type) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`);
    g.style.pointerEvents = "none";

    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 5);
    shadow.setAttribute("rx", 25); shadow.setAttribute("ry", 12);
    shadow.setAttribute("fill", "rgba(10, 12, 15, 0.7)");
    shadow.setAttribute("filter", "blur(4px)");
    g.appendChild(shadow);

    // Subtle purple corruption glow bleeding from the ruins
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    glow.setAttribute("cx", 0); glow.setAttribute("cy", 0);
    glow.setAttribute("rx", 20); glow.setAttribute("ry", 15);
    glow.setAttribute("fill", "rgba(150, 0, 255, 0.15)");
    glow.setAttribute("filter", "blur(8px)");
    g.appendChild(glow);

    // Colors blended to match the corrupted wasteland (dark purplish-grey)
    const c1 = "#2a2833";
    const c2 = "#353140";
    const c3 = "#1a1820";

    if (type === 0) { // Broken stone wall
      g.appendChild(this.createPoly("-15,5 -5,10 -5,-15 -15,-25", c2));
      g.appendChild(this.createPoly("-5,10 15,0 15,-10 -5,-15", c1));
      // Jagged top
      g.appendChild(this.createPoly("-5,-15 -10,-20 0,-18 5,-12", c3));
    } else if (type === 1) { // Fallen pillar
      g.appendChild(this.createPoly("-20,5 -15,10 20,-5 15,-10", c1));
      g.appendChild(this.createPoly("-20,5 -25,0 -20,-5 -15,0", c2));
    } else if (type === 2) { // Rubble pile / barricade
      g.appendChild(this.createPoly("-10,5 0,10 12,2 0,-5", "#3a3f44"));
      g.appendChild(this.createPoly("0,10 15,5 10,-8 2,-2", c1));
      g.appendChild(this.createPoly("-5,0 5,2 3,-10 -8,-5", c3));
    } else if (type === 3) { // Cracked stone slab / Half buried foundation
      g.appendChild(this.createPoly("-18,0 0,12 25,-2 5,-15", c1));
      g.appendChild(this.createPoly("-18,-2 0,10 25,-4 5,-17", c2));
      // Crack overlay
      const crack = document.createElementNS("http://www.w3.org/2000/svg", "path");
      crack.setAttribute("d", "M -10,-5 L 0,0 L 5,-8 L 15,-2");
      crack.setAttribute("stroke", c3);
      crack.setAttribute("stroke-width", "1.5");
      crack.setAttribute("fill", "none");
      g.appendChild(crack);
    } else if (type === 4) { // Collapsed Gateway (Exclusive to Site 1)
      g.appendChild(this.createPoly("-25,10 -15,15 -15,-25 -25,-35", c2)); // Left standing pillar
      g.appendChild(this.createPoly("15,15 25,10 25,-10 15,-5", c2)); // Right broken pillar
      g.appendChild(this.createPoly("-25,-30 10,-5 0,5 -35,-20", c1)); // Fallen massive archway piece
      g.appendChild(this.createPoly("-5,-5 20,5 25,-10 -5,-15", c3)); // Rubble underneath arch
    }

    this.renderQueue.push({ y: y, element: g });
  }

  drawDebugCrystalCluster(x, y, scale) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";

    // Ground glow
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    glow.setAttribute("cx", 0); glow.setAttribute("cy", 5);
    glow.setAttribute("rx", 15); glow.setAttribute("ry", 8);
    glow.setAttribute("fill", "rgba(170, 0, 255, 0.6)"); // Increased base opacity to 0.6 for stronger glow
    glow.setAttribute("filter", "blur(4px)");

    // Pulsing animation for the glow when the application opens
    const glowAnim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    glowAnim.setAttribute("attributeName", "opacity");
    glowAnim.setAttribute("values", "0.2;1.0;0.2");

    // Add a random delay so they don't all pulse at the exact same time
    const animDelay = (Math.random() * 2).toFixed(1);
    glowAnim.setAttribute("begin", `${animDelay}s`);
    glowAnim.setAttribute("dur", "3s");
    glowAnim.setAttribute("repeatCount", "indefinite");
    glow.appendChild(glowAnim);

    g.appendChild(glow);

    // Main crystal
    g.appendChild(this.createPoly("-5,5 0,-15 5,5 0,10", "#d500f9"));
    g.appendChild(this.createPoly("0,-15 5,5 0,10 -1,-5", "#aa00ff")); // Darker side

    // Broken peripheral shards
    g.appendChild(this.createPoly("-10,8 -15,0 -12,-5 -8,-2", "#e040fb"));
    g.appendChild(this.createPoly("10,12 8,5 12,2 15,8", "#d500f9"));
    g.appendChild(this.createPoly("-2,15 2,12 5,18 0,20", "#aa00ff"));

    this.renderQueue.push({ y: y, element: g });
  }

  drawPalmTree(x, y) {
    return;
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
    base.setAttribute("d", `M 0,-${size} L -${size * 0.4},-${size * 0.3} L -${size * 0.6},0 L -${size * 0.3},${size * 0.2} L 0,${size * 0.3} L ${size * 0.3},${size * 0.2} L ${size * 0.6},0 L ${size * 0.4},-${size * 0.3} Z`);
    base.setAttribute("fill", baseColor);

    // Lit side
    const litSide = document.createElementNS("http://www.w3.org/2000/svg", "path");
    litSide.setAttribute("d", `M 0,-${size} L -${size * 0.4},-${size * 0.3} L -${size * 0.6},0 L -${size * 0.3},${size * 0.2} L 0,${size * 0.3} L -${size * 0.1},-${size * 0.1} L 0,-${size * 0.4} Z`);
    litSide.setAttribute("fill", "url(#mountain-grad)");

    // Snow cap
    const snowColor = theme === 'debug' ? '#b0bec5' : '#ffffff';
    const snow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    snow.setAttribute("d", `M 0,-${size} L -${size * 0.2},-${size * 0.5} L -${size * 0.1},-${size * 0.4} L 0,-${size * 0.45} L ${size * 0.1},-${size * 0.35} L ${size * 0.2},-${size * 0.5} Z`);
    snow.setAttribute("fill", snowColor);

    g.appendChild(base);
    g.appendChild(litSide);
    g.appendChild(snow);

    this.renderQueue.push({ y: y, element: g });
  }

  drawTreeGroup(x, y, theme = 'plains') {
    return;
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
    return;
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

  drawCampusDistricts(layout) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Isometric helpers
    const drawEllipse = (x, y, rx, ry, fill, opacity = 1.0) => {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      el.setAttribute("cx", x); el.setAttribute("cy", y);
      el.setAttribute("rx", rx); el.setAttribute("ry", ry);
      el.setAttribute("fill", fill);
      if (opacity < 1.0) el.setAttribute("opacity", opacity);
      g.appendChild(el);
    };

    const drawIsoRect = (cx, cy, w, h, fill) => {
      const hw = w / 2;
      const hh = h / 2;
      const p1 = `${cx},${cy - hh}`;
      const p2 = `${cx + hw},${cy}`;
      const p3 = `${cx},${cy + hh}`;
      const p4 = `${cx - hw},${cy}`;
      g.appendChild(this.createPoly(`${p1} ${p2} ${p3} ${p4}`, fill));
    };

    // 1. Academy District
    const ax = layout.academy.x;
    const ay = layout.academy.y;
    drawEllipse(ax, ay, 900, 450, "#e0f2f1", 0.6); // Wide pedestrian circulation space
    drawIsoRect(ax, ay + 100, 700, 400, "#ffffff"); // Large marble civic plaza
    drawIsoRect(ax, ay + 100, 660, 360, "#f5f5f5"); // Inner paving
    drawIsoRect(ax - 500, ay - 150, 250, 150, "#eeeeee"); // Secondary courtyard left
    drawIsoRect(ax + 500, ay - 150, 250, 150, "#eeeeee"); // Secondary courtyard right
    drawEllipse(ax - 650, ay + 100, 200, 100, "#a5d6a7", 0.7); // Garden zone left
    drawEllipse(ax + 650, ay + 100, 200, 100, "#a5d6a7", 0.7); // Garden zone right

    // 2. Library District
    const lx = layout.grandLibrary.x;
    const ly = layout.grandLibrary.y;
    drawIsoRect(lx, ly, 500, 300, "#cfd8dc"); // Stone paving
    drawIsoRect(lx, ly + 80, 380, 220, "#eceff1"); // Reading courtyard
    drawEllipse(lx - 280, ly - 50, 160, 80, "#81c784", 0.6); // Small open garden
    drawIsoRect(lx + 220, ly + 120, 120, 70, "#b0bec5"); // Reserved bench areas

    // 3. Monument District
    const mx = layout.monumentPlaza.x;
    const my = layout.monumentPlaza.y;
    drawEllipse(mx, my, 400, 200, "#e0e0e0"); // Open gathering area
    drawEllipse(mx, my, 280, 140, "#eeeeee"); // Circular ceremonial plaza
    drawEllipse(mx, my, 180, 90, "#ffffff"); // Marble platform
    drawIsoRect(mx - 180, my + 120, 100, 60, "#cfd8dc"); // Flag court reservation

    // 4. Fountain District
    const fx = layout.fountainPlaza.x;
    const fy = layout.fountainPlaza.y;
    drawEllipse(fx, fy, 320, 160, "#e1f5fe", 0.8); // Decorative paving outer
    drawEllipse(fx, fy, 220, 110, "#b3e5fc", 0.6); // Circular fountain court
    drawEllipse(fx + 180, fy - 80, 140, 70, "#c8e6c9", 0.8); // Garden reservation
    drawIsoRect(fx - 140, fy + 140, 120, 70, "#d7ccc8"); // Seating reservation

    // Push layer below structures but above base layer
    this.renderQueue.push({ y: ay - 1350, element: g });
  }

  drawAcademyLibrary(layoutData) {
    const { x, y, scaleX, scaleY, rotation } = layoutData;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Controlled landmark-scale transform perfectly synchronized with Layout Engine
    g.setAttribute("transform", `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`);
    g.style.pointerEvents = "none";

    // 1. Base Clearance Pad (No dark shadow, clean separation)
    g.appendChild(this.createPoly("-85,27.5 0,-15 85,27.5 0,70", "#f5f5f5"));
    g.appendChild(this.createPoly("-85,27.5 0,70 0,73 -85,30.5", "#00bcd4"));
    g.appendChild(this.createPoly("85,27.5 0,70 0,73 85,30.5", "#0097a7"));

    // 2. Wide Rectangular Base (White Marble)
    g.appendChild(this.createPoly("-70,20 0,0 70,20 0,40", "#ffffff"));
    g.appendChild(this.createPoly("-70,20 0,40 0,48 -70,28", "#cfd8dc"));
    g.appendChild(this.createPoly("70,20 0,40 0,48 70,28", "#b0bec5"));

    // 3. Clear Front Entrance with Marble Staircase
    g.appendChild(this.createPoly("-18,41 0,35 18,41 0,47", "#f5f5f5"));
    g.appendChild(this.createPoly("-18,41 0,47 0,51 -18,45", "#cfd8dc"));
    g.appendChild(this.createPoly("18,41 0,47 0,51 18,45", "#b0bec5"));

    g.appendChild(this.createPoly("-14,39 0,33 14,39 0,45", "#eeeeee"));
    g.appendChild(this.createPoly("-14,39 0,45 0,49 -14,43", "#cfd8dc"));
    g.appendChild(this.createPoly("14,39 0,45 0,49 14,43", "#b0bec5"));

    g.appendChild(this.createPoly("-10,37 0,31 10,37 0,43", "#ffffff"));
    g.appendChild(this.createPoly("-10,37 0,43 0,47 -10,41", "#cfd8dc"));
    g.appendChild(this.createPoly("10,37 0,43 0,47 10,41", "#b0bec5"));

    // 4. Rectangular Reading Hall (Stronger Silhouette)
    g.appendChild(this.createPoly("-60,14 0,-4 60,14 0,32", "#fafafa"));
    g.appendChild(this.createPoly("-60,14 0,32 0,-15 -60,-33", "#b0bec5"));
    g.appendChild(this.createPoly("0,32 60,14 60,-33 0,-15", "#eceff1"));

    // 5. Archive Symbol (Glowing Pedestal)
    g.appendChild(this.createPoly("-6,28 0,26 6,28 0,30", "#455a64"));
    g.appendChild(this.createPoly("-6,28 0,30 0,36 -6,34", "#263238"));
    g.appendChild(this.createPoly("6,28 0,30 0,36 6,34", "#37474f"));

    g.appendChild(this.createPoly("-4,25 0,23 4,25 0,27", "#e0f7fa"));
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    glow.setAttribute("cx", 0); glow.setAttribute("cy", 25);
    glow.setAttribute("rx", 10); glow.setAttribute("ry", 5);
    glow.setAttribute("fill", "#00e5ff");
    glow.setAttribute("opacity", "0.85");
    glow.setAttribute("filter", "blur(2px)");
    g.appendChild(glow);

    // 6. Visible Columns
    for (let px = -54; px <= -18; px += 12) {
      let py = 32 + px * 0.3;
      let topY = -15 + Math.abs(px) * 0.3;
      g.appendChild(this.createPoly(`${px},${py} ${px + 3},${py - 1} ${px + 3},${topY - 1} ${px},${topY}`, "#ffffff"));
      g.appendChild(this.createPoly(`${px + 3},${py - 1} ${px + 6},${py} ${px + 6},${topY} ${px + 3},${topY - 1}`, "#cfd8dc"));
      g.appendChild(this.createPoly(`${px},${topY + 2} ${px + 3},${topY + 1} ${px + 6},${topY + 2} ${px + 3},${topY + 3}`, "#00bcd4"));
    }
    for (let px = 18; px <= 54; px += 12) {
      let py = 32 - px * 0.3;
      let topY = -15 + Math.abs(px) * 0.3;
      g.appendChild(this.createPoly(`${px},${py} ${px - 3},${py - 1} ${px - 3},${topY - 1} ${px},${topY}`, "#ffffff"));
      g.appendChild(this.createPoly(`${px - 3},${py - 1} ${px - 6},${py} ${px - 6},${topY} ${px - 3},${topY - 1}`, "#cfd8dc"));
      g.appendChild(this.createPoly(`${px},${topY + 2} ${px - 3},${topY + 1} ${px - 6},${topY + 2} ${px - 3},${topY + 3}`, "#00bcd4"));
    }

    // 7. Gently sloped cyan roof
    g.appendChild(this.createPoly("-65,-18 0,-33 0,-40 -65,-25", "#00bcd4")); // Left Roof
    g.appendChild(this.createPoly("-65,-18 0,-33 0,-30 -65,-15", "#00838f")); // Left Edge

    g.appendChild(this.createPoly("0,-33 65,-18 65,-25 0,-40", "#4dd0e1"));  // Right Roof
    g.appendChild(this.createPoly("0,-33 65,-18 65,-15 0,-30", "#0097a7"));  // Right Edge

    // Flat roof ridge
    g.appendChild(this.createPoly("-62,-25 0,-40 62,-25 0,-10", "#e0f7fa"));

    this.renderQueue.push({ y: y, element: g });
  }

  drawAcademyTemple(layoutData) {
    const { x, y, scaleX, scaleY, rotation } = layoutData;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Controlled landmark-scale transform perfectly synchronized with Layout Engine
    g.setAttribute("transform", `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`);
    g.style.pointerEvents = "none";

    // 1. Light marble clearance pad
    g.appendChild(this.createPoly("-55,17.5 0,-10 55,17.5 0,45", "#f5f5f5"));
    g.appendChild(this.createPoly("-55,17.5 0,45 0,48 -55,20.5", "#00bcd4"));
    g.appendChild(this.createPoly("55,17.5 0,45 0,48 55,20.5", "#0097a7"));

    // 2. Hexagonal Base
    g.appendChild(this.createPoly("-30,10 0,-5 30,10 30,25 0,40 -30,25", "#ffffff"));
    g.appendChild(this.createPoly("-30,25 0,40 0,44 -30,29", "#cfd8dc"));
    g.appendChild(this.createPoly("30,25 0,40 0,44 30,29", "#b0bec5"));

    // 3. Rotunda Curved Walls (Pale cyan to distinguish from Academy's white)
    g.appendChild(this.createPoly("-25,12 0,-0.5 25,12 25,17 0,29.5 -25,17", "#e0f7fa")); // Inner floor

    // Left Arc Wall
    g.appendChild(this.createPoly("-25,17 0,29.5 0,-10 -25,-22.5", "#80deea")); // Left Wall 
    g.appendChild(this.createPoly("0,29.5 25,17 25,-22.5 0,-10", "#b2ebf2")); // Right Wall

    // 4. Perimeter Columns
    const rotCols = [
      { x: -25, y: 17 }, { x: -12.5, y: 23.25 }, { x: 0, y: 29.5 },
      { x: 12.5, y: 23.25 }, { x: 25, y: 17 }
    ];
    rotCols.forEach(c => {
      g.appendChild(this.createPoly(`${c.x - 2},${c.y} ${c.x + 2},${c.y - 2} ${c.x + 2},${c.y - 29} ${c.x - 2},${c.y - 27}`, "#ffffff"));
      g.appendChild(this.createPoly(`${c.x + 2},${c.y - 2} ${c.x + 4},${c.y} ${c.x + 4},${c.y - 27} ${c.x + 2},${c.y - 29}`, "#cfd8dc"));
    });

    // 5. Distinct Cyan Dome (Rounder, smaller than Academy)
    g.appendChild(this.createPoly("-28,-21 0,-35 28,-21 0,-7", "#00bcd4")); // Dome architrave
    g.appendChild(this.createPoly("-28,-21 0,-7 0,0 -28,-14", "#00838f"));
    g.appendChild(this.createPoly("28,-21 0,-7 0,0 28,-14", "#0097a7"));

    const dome = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dome.setAttribute("d", "M -25,-19 C -25,-48 25,-48 25,-19 C 15,-5 -15,-5 -25,-19 Z");
    dome.setAttribute("fill", "#00acc1");
    g.appendChild(dome);

    // 6. Spire
    g.appendChild(this.createPoly("-2,-42 0,-57 2,-42", "#ffc107"));
    g.appendChild(this.createPoly("-2,-42 2,-42 0,-37", "#ff8f00"));

    this.renderQueue.push({ y: y, element: g });
  }

  drawAcademyDorm(layoutData) {
    const { x, y, scaleX, scaleY, rotation } = layoutData;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Controlled landmark-scale transform perfectly synchronized with Layout Engine
    g.setAttribute("transform", `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`);
    g.style.pointerEvents = "none";

    // 1. Base Clearance Pad (No dark shadow)
    g.appendChild(this.createPoly("-45,17.5 0,-5 45,17.5 0,40", "#f5f5f5"));
    g.appendChild(this.createPoly("-45,17.5 0,40 0,43 -45,20.5", "#00bcd4"));
    g.appendChild(this.createPoly("45,17.5 0,40 0,43 45,20.5", "#0097a7"));

    // --- BLOCK 2 (Rear Long Block, drawn first for Z-sorting) ---
    g.appendChild(this.createPoly("-10,5 30,-15 40,-10 0,10", "#eceff1")); // Floor
    g.appendChild(this.createPoly("-10,5 0,10 0,-20 -10,-25", "#b0bec5")); // Left Wall
    g.appendChild(this.createPoly("0,10 40,-10 40,-35 0,-15", "#cfd8dc")); // Right Wall

    // Windows Block 2
    g.appendChild(this.createPoly("10,-5 15,-7.5 15,-15 10,-12.5", "#00bcd4"));
    g.appendChild(this.createPoly("25,-12.5 30,-15 30,-22.5 25,-20", "#00bcd4"));

    // Cyan Roof Block 2
    g.appendChild(this.createPoly("-12,-26 28,-46 42,-39 -2,-19", "#00acc1")); // Roof Top
    g.appendChild(this.createPoly("-12,-26 -2,-19 -2,-15 -12,-22", "#00838f")); // Edge L
    g.appendChild(this.createPoly("42,-39 -2,-19 -2,-15 42,-35", "#0097a7")); // Edge R

    // --- BLOCK 1 (Forward Block, creates L-shape) ---
    g.appendChild(this.createPoly("-30,15 0,0 10,5 -20,20", "#ffffff")); // Floor
    g.appendChild(this.createPoly("-30,15 -20,20 -20,-10 -30,-15", "#90a4ae")); // Left Wall
    g.appendChild(this.createPoly("-20,20 10,5 10,-20 -20,-5", "#eceff1")); // Right Wall

    // Windows Block 1
    g.appendChild(this.createPoly("-26,5 -22,7 -22,-3 -26,-5", "#00acc1"));
    g.appendChild(this.createPoly("-14,11 -10,13 -10,3 -14,1", "#00acc1"));
    g.appendChild(this.createPoly("-8,14 -4,16 -4,6 -8,4", "#00acc1"));

    // Cyan Roof Block 1
    g.appendChild(this.createPoly("-32,-16 -2,-31 12,-24 -18,-9", "#4dd0e1"));
    g.appendChild(this.createPoly("-32,-16 -18,-9 -18,-5 -32,-12", "#00838f"));
    g.appendChild(this.createPoly("12,-24 -18,-9 -18,-5 12,-20", "#0097a7"));

    this.renderQueue.push({ y: y, element: g });
  }

  createDeadTreeMass(cx, cy, rx, ry) {
    return document.createElementNS("http://www.w3.org/2000/svg", "g");
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
      Q ${cx - rx / 2}, ${cy - ry * 1.2} ${cx}, ${cy - ry}
      Q ${cx + rx / 2}, ${cy - ry * 1.1} ${cx + rx}, ${cy}
      Q ${cx + rx / 2}, ${cy + ry * 0.8} ${cx}, ${cy + ry}
      Q ${cx - rx / 2}, ${cy + ry * 1.1} ${cx - rx}, ${cy}
      Z
    `;
    base.setAttribute("d", d);
    base.setAttribute("fill", "#3e2723"); // Dark dead brown
    group.appendChild(base);

    // Sharp thorny highlights
    const highlight = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dh = `
      M ${cx - rx * 0.8}, ${cy - 20}
      L ${cx - rx * 0.5}, ${cy - ry * 0.8} L ${cx - rx * 0.3}, ${cy - 10}
      L ${cx}, ${cy - ry * 0.9} L ${cx + rx * 0.4}, ${cy - 30}
      L ${cx + rx * 0.7}, ${cy - ry * 0.6}
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

  drawDebugWatchTower(x, y, scale = 1.0, rotation = 0, variant = 0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`);
    g.style.pointerEvents = "none";

    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 0);
    shadow.setAttribute("rx", 60); shadow.setAttribute("ry", 30);
    shadow.setAttribute("fill", "rgba(0,0,0,0.6)");
    shadow.setAttribute("filter", "blur(8px)");
    g.appendChild(shadow);

    // Scattered foundation debris
    g.appendChild(this.createPoly("0,25 -35,10 -25,-5 10,-10", "#1e272e"));
    g.appendChild(this.createPoly("0,25 40,5 25,-10 10,-10", "#2d3436"));
    g.appendChild(this.createPoly("-20,15 -45,0 -30,-15 -10,-5", "#111417"));

    // Base Tier (Intact)
    g.appendChild(this.createPoly("0,20 -30,5 -30,-40 0,-60", "#181d22"));
    g.appendChild(this.createPoly("0,20 30,5 30,-50 0,-60", "#2a3236"));

    // Mid Tier (Fractured and leaning)
    // Left side mostly intact
    g.appendChild(this.createPoly("0,-60 -25,-45 -25,-100 -5,-120 0,-90", "#181d22"));
    // Right side completely sheared off/broken
    g.appendChild(this.createPoly("0,-60 25,-45 20,-80 5,-100 0,-90", "#2a3236"));

    // High jagged shards protruding from the broken side
    g.appendChild(this.createPoly("-5,-120 -15,-105 -20,-140 -10,-150", "#14171a"));
    g.appendChild(this.createPoly("5,-100 15,-85 10,-115 0,-120", "#1c2124"));

    // Exposed glowing corruption core bursting from the fracture
    const core = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    core.setAttribute("points", "0,-85 -10,-100 -5,-115 5,-105");
    core.setAttribute("fill", "#d500f9");
    core.setAttribute("filter", "blur(3px)");
    g.appendChild(core);
    g.appendChild(this.createPoly("0,-85 -10,-100 -5,-115 5,-105", "#e040fb")); // sharp inner core

    // Glowing corrupted veins creeping down the base
    const vein1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    vein1.setAttribute("points", "-10,-95 -15,-65 -5,-35 -10,-10");
    vein1.setAttribute("fill", "none");
    vein1.setAttribute("stroke", "#aa00ff");
    vein1.setAttribute("stroke-width", "2");
    g.appendChild(vein1);

    const vein2 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    vein2.setAttribute("points", "5,-95 10,-60 20,-40 15,-15");
    vein2.setAttribute("fill", "none");
    vein2.setAttribute("stroke", "#d500f9");
    vein2.setAttribute("stroke-width", "1.5");
    g.appendChild(vein2);

    // Floating fractured chunks (anti-gravity wasteland feel)
    g.appendChild(this.createPoly("-25,-125 -35,-120 -30,-140 -20,-135", "#181d22"));
    g.appendChild(this.createPoly("15,-130 25,-120 20,-145 10,-140", "#2a3236"));

    // Custom small floating crystals around the tower
    const addSmallCrystal = (cx, cy, s) => {
      g.appendChild(this.createPoly(`${cx},${cy + 15 * s} ${cx - 10 * s},${cy} ${cx},${cy - 35 * s}`, "#d500f9"));
      g.appendChild(this.createPoly(`${cx},${cy + 15 * s} ${cx + 10 * s},${cy} ${cx},${cy - 35 * s}`, "#aa00ff"));
    };

    if (variant === 0) {
      addSmallCrystal(-55, -80, 0.6); // High left
      addSmallCrystal(-45, -20, 0.5); // Mid left
      addSmallCrystal(60, -10, 0.7);  // Far right
    } else {
      addSmallCrystal(-45, -70, 0.5); // High left
      addSmallCrystal(-35, 0, 0.6);   // Low left
      addSmallCrystal(45, -10, 0.6);  // Mid right
      addSmallCrystal(65, 30, 0.5);   // Low right
    }

    this.renderQueue.push({ y: y, element: g });
  }

  drawDebugObelisk(x, y, scale = 1.0, rotation = 0) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`);
    g.style.pointerEvents = "none";

    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 0);
    shadow.setAttribute("rx", 40); shadow.setAttribute("ry", 20);
    shadow.setAttribute("fill", "rgba(0,0,0,0.6)");
    shadow.setAttribute("filter", "blur(8px)");
    g.appendChild(shadow);

    g.appendChild(this.createPoly("0,10 -20,0 -10,-120 0,-140", "#0a0a0a"));
    g.appendChild(this.createPoly("0,10 20,0 10,-120 0,-140", "#141414"));

    const crack1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    crack1.setAttribute("points", "-10,0 -5,-30 -12,-60 -2,-90");
    crack1.setAttribute("fill", "none");
    crack1.setAttribute("stroke", "#aa00ff");
    crack1.setAttribute("stroke-width", "2");
    crack1.setAttribute("filter", "blur(1px)");
    g.appendChild(crack1);

    const crack2 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    crack2.setAttribute("points", "10,-10 2,-40 8,-70 0,-100");
    crack2.setAttribute("fill", "none");
    crack2.setAttribute("stroke", "#e91e63");
    crack2.setAttribute("stroke-width", "1.5");
    crack2.setAttribute("filter", "blur(1px)");
    g.appendChild(crack2);

    this.renderQueue.push({ y: y, element: g });
  }

  drawDebugGiantCrystal(x, y, scale = 1.0, rotation = 0, type = 1) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`);
    g.style.pointerEvents = "none";

    // Reduced glow (20% less intense shadow blur/opacity)
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", 0); shadow.setAttribute("cy", 0);
    shadow.setAttribute("rx", 35); shadow.setAttribute("ry", 15);
    shadow.setAttribute("fill", "rgba(170,0,255,0.2)");
    shadow.setAttribute("filter", "blur(6px)");
    g.appendChild(shadow);

    if (type === 1) {
      // Tall Spear Crystal (80% Purple, 20% Magenta)
      g.appendChild(this.createPoly("0,15 -20,0 0,-200 20,0", "#d500f9"));
      g.appendChild(this.createPoly("0,15 -20,0 0,-200", "#aa00ff"));

      // Magenta base highlights
      g.appendChild(this.createPoly("-10,5 -20,0 -15,-40", "#e91e63"));
      g.appendChild(this.createPoly("10,5 20,0 15,-30", "#e91e63"));

      // Side shards
      g.appendChild(this.createPoly("15,10 30,0 20,-50", "#aa00ff"));
      g.appendChild(this.createPoly("15,10 30,0 25,-10", "#311b92"));
    } else if (type === 2) {
      // Medium Crystal Cluster
      g.appendChild(this.createPoly("0,10 -25,-5 0,-120 25,-5", "#d500f9"));
      g.appendChild(this.createPoly("0,10 -25,-5 0,-120", "#aa00ff"));

      g.appendChild(this.createPoly("-15,15 -35,5 -20,-80", "#aa00ff"));
      g.appendChild(this.createPoly("-15,15 -35,5 -25,-10", "#7c4dff"));

      g.appendChild(this.createPoly("15,12 35,2 25,-90", "#b388ff"));

      // Magenta base highlight
      g.appendChild(this.createPoly("0,10 -15,-5 -5,-30", "#e91e63"));
    } else {
      // Broken Shard / Tilted
      g.appendChild(this.createPoly("0,15 -30,0 20,-90 30,0", "#aa00ff"));
      g.appendChild(this.createPoly("0,15 -30,0 20,-90", "#7c4dff"));
      g.appendChild(this.createPoly("-15,5 -40,-10 -20,-50", "#d500f9"));
      g.appendChild(this.createPoly("-15,5 -20,-50 -10,-10", "#311b92"));

      // Magenta base highlight
      g.appendChild(this.createPoly("20,5 30,0 25,-20", "#e91e63"));
    }

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
    return;
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

    const animDelay = (Math.random() * 2).toFixed(1);

    // High-visibility pulsing ground halo WITH BLUR for soft light effect
    const halo = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    halo.setAttribute("cx", 0); halo.setAttribute("cy", 0);
    halo.setAttribute("rx", 24); halo.setAttribute("ry", 12); // Reduced radius
    halo.setAttribute("fill", "#ea80fc"); // Bright pink light
    halo.setAttribute("filter", "blur(6px)"); // Soften into a glowing aura
    halo.setAttribute("opacity", "0");
    const haloAnim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    haloAnim.setAttribute("attributeName", "opacity");
    haloAnim.setAttribute("values", "0;0.8;0"); // Pulses to 80% opacity
    haloAnim.setAttribute("dur", "2.5s");
    haloAnim.setAttribute("begin", `${animDelay}s`);
    haloAnim.setAttribute("repeatCount", "indefinite");
    halo.appendChild(haloAnim);
    g.appendChild(halo);

    const mainBody = this.createPoly("0,0 -10,-30 0,-50 10,-25", "#aa00ff");
    const mainAnim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    mainAnim.setAttribute("attributeName", "fill");
    mainAnim.setAttribute("values", "#aa00ff;#ff40ff;#aa00ff"); // Brighter magenta pulse
    mainAnim.setAttribute("dur", "2.5s");
    mainAnim.setAttribute("begin", `${animDelay}s`);
    mainAnim.setAttribute("repeatCount", "indefinite");
    mainBody.appendChild(mainAnim);
    g.appendChild(mainBody);

    const highlight = this.createPoly("0,0 10,-25 5,-40", "#ea80fc");
    const highAnim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    highAnim.setAttribute("attributeName", "fill");
    highAnim.setAttribute("values", "#ea80fc;#ffffff;#ea80fc"); // Pulse to pure blinding white
    highAnim.setAttribute("dur", "2.5s");
    highAnim.setAttribute("begin", `${animDelay}s`);
    highAnim.setAttribute("repeatCount", "indefinite");
    highlight.appendChild(highAnim);
    g.appendChild(highlight);

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

  drawPythonJungleRuin(x, y, scale = 1.0, variant = 0, zSort = null) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";

    // Subtle ground shadow (darker and slightly larger to feel grounded)
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", "0"); shadow.setAttribute("cy", "0");
    shadow.setAttribute("rx", variant === 2 ? "2.5" : "3.0");
    shadow.setAttribute("ry", variant === 2 ? "1.2" : "1.5");
    shadow.setAttribute("fill", "rgba(0,0,0,0.5)"); // Stronger shadow
    shadow.setAttribute("filter", "blur(2px)");
    g.appendChild(shadow);

    if (variant === 0) {
      // VARIANT 0: ORGANIC BROKEN PILLAR RUINS (2-4 uneven broken pillars)
      
      const addRoundedPoly = (pts, fill) => {
        const p = this.createPoly(pts, fill);
        p.setAttribute("stroke", fill);
        p.setAttribute("stroke-width", "0.2");
        p.setAttribute("stroke-linejoin", "round");
        g.appendChild(p);
      };

      const addLeaf = (cx, cy, rx, ry, r, fill) => {
        const leaf = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        leaf.setAttribute("cx", cx); leaf.setAttribute("cy", cy);
        leaf.setAttribute("rx", rx); leaf.setAttribute("ry", ry);
        leaf.setAttribute("fill", fill);
        leaf.setAttribute("transform", `rotate(${r} ${cx} ${cy})`);
        g.appendChild(leaf);
      };

      // Pillar 1 (Tall, center left)
      addRoundedPoly("-1.5,0 -0.5,0.5 -0.5,-2.5 -1.5,-3.0", "#607d8b"); // left face
      addRoundedPoly("-0.5,0.5 0.5,0 0.5,-2.8 -0.5,-2.5", "#546e7a"); // right face
      addRoundedPoly("-1.5,-3.0 -0.5,-2.5 0.2,-2.2 -0.8,-2.7", "#78909c"); // cracked top

      // Pillar 2 (Short, front right)
      addRoundedPoly("0.5,0.8 1.5,0.2 1.5,-1.2 0.5,-0.6", "#607d8b"); // left face
      addRoundedPoly("1.5,0.2 2.2,-0.2 2.2,-1.4 1.5,-1.2", "#455a64"); // right face
      addRoundedPoly("0.5,-0.6 1.5,-1.2 2.0,-1.5 1.0,-0.9", "#78909c"); // cracked top

      // Pillar 3 (Medium, back right)
      addRoundedPoly("1.0,-0.5 1.8,-1.0 1.8,-2.5 1.0,-2.0", "#546e7a"); // left face
      addRoundedPoly("1.8,-1.0 2.4,-1.4 2.4,-2.8 1.8,-2.5", "#37474f"); // right face
      addRoundedPoly("1.0,-2.0 1.8,-2.5 2.2,-2.9 1.4,-2.4", "#607d8b"); // cracked top

      // Broken base stones
      addRoundedPoly("-2.5,0 -1.5,0.5 -1.0,-0.2 -2.0,-0.5", "#455a64");
      addRoundedPoly("2.0,0.5 3.0,0 2.5,-0.5 1.5,0", "#546e7a");

      // Glowing Magical Rune on Pillar 1
      const p1Cutout = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p1Cutout.setAttribute("d", "M -1.0,-1.0 L -1.0,-1.8 C -0.8,-2.0 -0.2,-2.0 0.0,-1.8 L 0.0,-1.0 C -0.2,-0.8 -0.8,-0.8 -1.0,-1.0 Z");
      p1Cutout.setAttribute("fill", "#1b5e20");
      p1Cutout.setAttribute("stroke", "#37474f");
      p1Cutout.setAttribute("stroke-width", "0.1");
      g.appendChild(p1Cutout);

      const rune = document.createElementNS("http://www.w3.org/2000/svg", "path");
      rune.setAttribute("d", "M -0.5,-1.6 L -0.3,-1.4 M -0.7,-1.4 L -0.5,-1.6 M -0.5,-1.4 L -0.5,-1.1");
      rune.setAttribute("stroke", "#00e676");
      rune.setAttribute("stroke-width", "0.1");
      rune.setAttribute("stroke-linecap", "round");
      rune.setAttribute("fill", "none");
      g.appendChild(rune);

      const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glow.setAttribute("cx", "-0.5"); glow.setAttribute("cy", "-1.4");
      glow.setAttribute("r", "0.4");
      glow.setAttribute("fill", "rgba(100,221,23,0.3)");
      glow.setAttribute("filter", "blur(1px)");
      g.appendChild(glow);

      // Thick organic vines
      const vine = document.createElementNS("http://www.w3.org/2000/svg", "path");
      vine.setAttribute("d", "M -1.5,-1.0 Q -0.5,-0.5 0.5,-1.5 T 2.0,-1.0");
      vine.setAttribute("stroke", "#1b5e20");
      vine.setAttribute("stroke-width", "0.25");
      vine.setAttribute("fill", "none");
      vine.setAttribute("stroke-linecap", "round");
      g.appendChild(vine);

      // Organic moss caps & base bushes
      addLeaf("-1.0", "-2.9", "0.6", "0.3", -15, "#33691e"); // P1 top
      addLeaf("-0.5", "-3.1", "0.5", "0.25", 10, "#558b2f"); 
      addLeaf("1.2", "-1.0", "0.5", "0.25", -20, "#2e7d32"); // P2 top
      addLeaf("1.6", "-2.3", "0.5", "0.25", 15, "#1b5e20"); // P3 top
      addLeaf("-1.5", "0.8", "0.8", "0.4", 0, "#1b5e20");    // Base left
      addLeaf("0.0", "1.1", "0.9", "0.45", -10, "#2e7d32");  // Base mid
      addLeaf("1.5", "1.0", "0.7", "0.35", 15, "#33691e");   // Base right

    } else if (variant === 1) {
      // VARIANT 1: ORGANIC COLLAPSED STONE BLOCK RUIN
      
      const addRoundedPoly = (pts, fill) => {
        const p = this.createPoly(pts, fill);
        p.setAttribute("stroke", fill);
        p.setAttribute("stroke-width", "0.25");
        p.setAttribute("stroke-linejoin", "round");
        g.appendChild(p);
      };

      const addLeaf = (cx, cy, rx, ry, r, fill) => {
        const leaf = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        leaf.setAttribute("cx", cx); leaf.setAttribute("cy", cy);
        leaf.setAttribute("rx", rx); leaf.setAttribute("ry", ry);
        leaf.setAttribute("fill", fill);
        leaf.setAttribute("transform", `rotate(${r} ${cx} ${cy})`);
        g.appendChild(leaf);
      };

      // Base wide block
      addRoundedPoly("-2.0,0.5 0.0,1.5 1.5,0.5 -0.5,-0.5", "#546e7a"); // top
      addRoundedPoly("-2.0,0.5 0.0,1.5 0.0,2.0 -2.0,1.0", "#455a64"); // left side
      addRoundedPoly("0.0,1.5 1.5,0.5 1.5,0.0 0.0,1.0", "#37474f"); // right side

      // Stacked block
      addRoundedPoly("-1.0,-0.5 0.5,0.5 1.5,-0.5 0.0,-1.5", "#607d8b"); // top
      addRoundedPoly("-1.0,-0.5 0.5,0.5 0.5,1.2 -1.0,0.2", "#546e7a"); // left side
      addRoundedPoly("0.5,0.5 1.5,-0.5 1.5,0.2 0.5,1.2", "#455a64"); // right side

      // Side chunk
      addRoundedPoly("-2.5,0.0 -1.0,0.5 -1.5,-0.5 -2.8,-0.8", "#37474f"); 

      // Small debris front
      addRoundedPoly("-0.5,1.8 0.5,2.2 1.0,1.6 0.0,1.2", "#607d8b");
      addRoundedPoly("-0.5,1.8 0.5,2.2 0.5,2.5 -0.5,2.1", "#546e7a");

      // Deep cracks (Organic path)
      const crack = document.createElementNS("http://www.w3.org/2000/svg", "path");
      crack.setAttribute("d", "M -1.0,-0.5 Q -0.5,0.0 0.5,-0.2 M -2.0,0.5 Q -1.5,0.8 -1.0,1.0 M 1.5,0.0 Q 2.0,0.5 2.5,0.0");
      crack.setAttribute("stroke", "#263238");
      crack.setAttribute("stroke-width", "0.15");
      crack.setAttribute("fill", "none");
      g.appendChild(crack);

      // Organic thick vines
      const vine = document.createElementNS("http://www.w3.org/2000/svg", "path");
      vine.setAttribute("d", "M -2.5,-0.5 Q -1.0,1.5 0.5,-0.5 T 2.5,-0.5");
      vine.setAttribute("stroke", "#1b5e20");
      vine.setAttribute("stroke-width", "0.25");
      vine.setAttribute("fill", "none");
      vine.setAttribute("stroke-linecap", "round");
      g.appendChild(vine);

      // Organic moss caps & base bushes
      addLeaf("-1.0", "-1.0", "0.6", "0.3", -15, "#2e7d32"); // Top moss
      addLeaf("-0.2", "-1.2", "0.5", "0.25", 25, "#558b2f"); 
      addLeaf("1.2", "-0.8", "0.5", "0.3", -30, "#33691e");  // Right block moss
      addLeaf("-2.2", "0.2", "0.6", "0.3", 10, "#1b5e20");   // Left block moss
      addLeaf("-1.5", "1.5", "0.9", "0.45", -5, "#1b5e20");  // Base bushes
      addLeaf("0.0", "1.9", "1.0", "0.5", 15, "#2e7d32");
      addLeaf("1.5", "1.3", "0.8", "0.4", -10, "#1b5e20");
      addLeaf("2.5", "0.5", "0.6", "0.3", 20, "#33691e");

    } else {
      // VARIANT 2: BEAUTIFUL ROUNDED MOSSY RUNE STONE

      // Base back shape (darker shadow/side)
      g.appendChild(this.createPoly("-1.5,0.5 -1.0,-4.5 0.5,-5.0 1.8,-4.0 1.8,0.2", "#78909c"));

      // Main curved face (lighter stone gray)
      const stoneFace = document.createElementNS("http://www.w3.org/2000/svg", "path");
      stoneFace.setAttribute("d", "M -1.2,0.5 C -1.0,-2.0 -0.8,-4.0 -0.5,-4.5 C 0.0,-5.0 0.8,-4.8 1.2,-4.2 C 1.5,-3.5 1.5,-1.5 1.2,0.5 Z");
      stoneFace.setAttribute("fill", "#b0bec5");
      g.appendChild(stoneFace);

      // Inner hollow cutout (dark recess)
      const cutout = document.createElementNS("http://www.w3.org/2000/svg", "path");
      cutout.setAttribute("d", "M -0.5,-1.5 L -0.5,-2.8 C -0.2,-3.2 0.4,-3.2 0.6,-2.8 L 0.6,-1.5 C 0.4,-1.0 -0.2,-1.0 -0.5,-1.5 Z");
      cutout.setAttribute("fill", "#1b5e20"); // Deep dark green/black
      cutout.setAttribute("stroke", "#37474f");
      cutout.setAttribute("stroke-width", "0.1");
      g.appendChild(cutout);

      // Glowing magical core
      const coreGlow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      coreGlow.setAttribute("cx", "0.05"); coreGlow.setAttribute("cy", "-2.15");
      coreGlow.setAttribute("r", "0.6");
      coreGlow.setAttribute("fill", "rgba(100, 221, 23, 0.4)");
      coreGlow.setAttribute("filter", "blur(1px)");
      g.appendChild(coreGlow);

      const core = document.createElementNS("http://www.w3.org/2000/svg", "path");
      core.setAttribute("d", "M 0,-2.4 Q 0.3,-2.4 0.3,-2.1 Q 0.3,-1.9 0.0,-1.8 Q -0.3,-1.9 -0.3,-2.1 Q -0.3,-2.4 0,-2.4 Z M -0.1,-1.7 L -0.2,-1.4 M 0.2,-1.7 L 0.3,-1.4");
      core.setAttribute("fill", "#00e676");
      core.setAttribute("stroke", "#b2ff59");
      core.setAttribute("stroke-width", "0.05");
      g.appendChild(core);

      // Thick organic vines (left side)
      const leftVine = document.createElementNS("http://www.w3.org/2000/svg", "path");
      leftVine.setAttribute("d", "M -1.5,0.5 Q -1.0,-1.0 -1.2,-2.5 T -0.5,-4.0");
      leftVine.setAttribute("stroke", "#2e7d32");
      leftVine.setAttribute("stroke-width", "0.2");
      leftVine.setAttribute("fill", "none");
      leftVine.setAttribute("stroke-linecap", "round");
      g.appendChild(leftVine);

      // Thick organic vines (right side)
      const rightVine = document.createElementNS("http://www.w3.org/2000/svg", "path");
      rightVine.setAttribute("d", "M 1.5,0.0 Q 0.8,-1.5 1.0,-3.0 T 0.5,-4.2");
      rightVine.setAttribute("stroke", "#33691e");
      rightVine.setAttribute("stroke-width", "0.18");
      rightVine.setAttribute("fill", "none");
      rightVine.setAttribute("stroke-linecap", "round");
      g.appendChild(rightVine);

      // Leaf clusters (overlapping green ellipses/polygons to match the reference)
      const addLeaf = (cx, cy, rx, ry, r, fill) => {
        const leaf = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        leaf.setAttribute("cx", cx); leaf.setAttribute("cy", cy);
        leaf.setAttribute("rx", rx); leaf.setAttribute("ry", ry);
        leaf.setAttribute("fill", fill);
        leaf.setAttribute("transform", `rotate(${r} ${cx} ${cy})`);
        g.appendChild(leaf);
      };

      // Top moss/leaves
      addLeaf("-0.5", "-4.5", "0.6", "0.3", -20, "#558b2f");
      addLeaf("0.2", "-4.7", "0.5", "0.25", 15, "#33691e");

      // Left vine leaves
      addLeaf("-1.2", "-2.8", "0.3", "0.15", 45, "#7cb342");
      addLeaf("-0.9", "-2.4", "0.35", "0.15", 20, "#558b2f");
      addLeaf("-1.0", "-1.5", "0.4", "0.2", 60, "#33691e");

      // Right vine leaves
      addLeaf("1.2", "-3.5", "0.3", "0.15", -45, "#558b2f");
      addLeaf("1.0", "-2.5", "0.3", "0.15", -20, "#7cb342");
      addLeaf("1.1", "-1.2", "0.4", "0.2", -70, "#33691e");

      // Base bushes
      addLeaf("-1.0", "0.5", "0.8", "0.4", 0, "#1b5e20");
      addLeaf("0.0", "0.8", "0.9", "0.45", -5, "#2e7d32");
      addLeaf("1.2", "0.4", "0.7", "0.35", 10, "#1b5e20");
    }

    this.renderQueue.push({ y: zSort !== null ? zSort : y, element: g });
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

  drawPythonJungleCluster(x, y, scale = 1.0, variant = 0, zSort = null) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    g.style.pointerEvents = "none";

    const shadow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shadow.setAttribute("cx", "0"); shadow.setAttribute("cy", "0");
    shadow.setAttribute("rx", "3.0"); shadow.setAttribute("ry", "1.2");
    shadow.setAttribute("fill", "rgba(0,0,0,0.4)");
    g.appendChild(shadow);

    const addLeaf = (cx, cy, rx, ry, r, fill) => {
      const leaf = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      leaf.setAttribute("cx", cx); leaf.setAttribute("cy", cy);
      leaf.setAttribute("rx", rx); leaf.setAttribute("ry", ry);
      leaf.setAttribute("fill", fill);
      leaf.setAttribute("transform", `rotate(${r} ${cx} ${cy})`);
      g.appendChild(leaf);
    };

    const addVineStroke = (d) => {
      const vine = document.createElementNS("http://www.w3.org/2000/svg", "path");
      vine.setAttribute("d", d);
      vine.setAttribute("stroke", "#004d40");
      vine.setAttribute("stroke-width", "0.15");
      vine.setAttribute("fill", "none");
      vine.setAttribute("stroke-linecap", "round");
      g.appendChild(vine);
    };

    if (variant === 0) {
      addLeaf("0", "-1.5", "1.8", "1.2", 0, "#1b5e20");
      addLeaf("-1.0", "-1.2", "1.5", "1.0", -15, "#2e7d32");
      addLeaf("1.2", "-0.8", "1.2", "0.8", 20, "#33691e");
      addLeaf("-0.2", "-2.2", "1.4", "0.9", 5, "#2e7d32");
      addLeaf("-0.5", "-2.5", "0.8", "0.4", 10, "#558b2f"); 
      addLeaf("-1.2", "-1.6", "0.7", "0.3", -10, "#558b2f");
      addLeaf("0.8", "-1.2", "0.6", "0.3", 15, "#558b2f");
      addVineStroke("M -0.5,-1.5 Q -0.8,-0.5 -1.5,0.0");
      addVineStroke("M 0.5,-2.0 Q 1.0,-1.0 1.2,0.5");
      addLeaf("-1.5", "0.2", "0.8", "0.4", -10, "#1b5e20");
      addLeaf("1.5", "0.5", "0.7", "0.3", 15, "#1b5e20");
      addLeaf("0.0", "0.5", "1.0", "0.4", 0, "#2e7d32");
    } else if (variant === 1) {
      const trunk1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      trunk1.setAttribute("d", "M -0.5,0.5 C -0.2,-1.0 -0.8,-3.0 -0.5,-4.0 C -0.3,-4.0 -0.1,-3.0 -0.2,0.5 Z");
      trunk1.setAttribute("fill", "#4e342e");
      g.appendChild(trunk1);
      
      const trunk2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      trunk2.setAttribute("d", "M 0.8,0.2 C 0.5,-1.0 1.0,-2.5 0.8,-3.2 C 1.0,-3.2 1.2,-2.5 1.1,0.2 Z");
      trunk2.setAttribute("fill", "#3e2723");
      g.appendChild(trunk2);

      addLeaf("-0.5", "-4.5", "1.8", "1.2", -10, "#1b5e20");
      addLeaf("0.8", "-3.5", "1.5", "1.0", 15, "#1b5e20");
      addLeaf("-1.2", "-4.0", "1.5", "0.9", -25, "#2e7d32");
      addLeaf("0.0", "-5.0", "1.4", "0.8", 5, "#33691e");
      addLeaf("1.4", "-3.2", "1.2", "0.7", 30, "#2e7d32");
      addLeaf("-0.5", "-5.2", "0.8", "0.4", 0, "#558b2f");
      addLeaf("-1.5", "-4.2", "0.6", "0.3", -15, "#558b2f");
      addLeaf("1.5", "-3.5", "0.7", "0.3", 25, "#558b2f");
      addVineStroke("M -1.0,-4.0 Q -1.2,-2.0 -0.8,-0.5");
      addVineStroke("M 0.2,-4.5 Q 0.5,-2.5 0.0,-1.0");
      addLeaf("-1.0", "0.2", "0.9", "0.4", -5, "#1b5e20");
      addLeaf("0.5", "0.4", "1.1", "0.5", 10, "#2e7d32");
    } else {
      addLeaf("0", "-0.5", "2.5", "1.0", 0, "#1b5e20");
      addLeaf("-1.5", "-1.0", "1.5", "0.8", -20, "#2e7d32");
      addLeaf("1.5", "0.0", "1.8", "0.9", 15, "#33691e");
      addLeaf("-0.5", "-1.5", "1.6", "0.9", -5, "#2e7d32");
      addLeaf("-1.8", "-1.2", "0.7", "0.3", -15, "#558b2f");
      addLeaf("-0.8", "-1.8", "0.8", "0.4", -5, "#558b2f");
      addLeaf("0.5", "-1.0", "0.6", "0.3", 10, "#558b2f");
      addVineStroke("M -2.0,-0.5 Q -1.0,-1.5 0.5,-1.0 T 2.0,0.5");
      addVineStroke("M -1.0,0.0 Q 0.0,-0.5 1.0,0.5");
      addLeaf("-2.0", "0.5", "1.0", "0.4", -10, "#1b5e20");
      addLeaf("0.0", "0.8", "1.2", "0.5", 0, "#2e7d32");
      addLeaf("2.0", "0.8", "0.9", "0.4", 10, "#1b5e20");
    }

    this.renderQueue.push({ y: zSort !== null ? zSort : y, element: g });
  }
}
