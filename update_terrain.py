import re

with open("client/js/world/TerrainGenerator.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Constructor
constructor_old = """  constructor(renderer, bounds, centerX, centerY) {
    this.renderer = renderer;
    this.width = renderer.width;
    this.height = renderer.height;
    this.bounds = bounds || { minX: 0, maxX: 5000, minY: 0, maxY: 4000 };
    this.centerX = centerX || 2500;
    this.centerY = centerY || 2000;
    this.regionsConfig = window.CodeVyuhRegions || [];
  }"""

constructor_new = """  constructor(renderer, bounds, centerX, centerY) {
    this.renderer = renderer;
    this.width = renderer.width;
    this.height = renderer.height;
    this.bounds = bounds || { minX: 0, maxX: 5000, minY: 0, maxY: 4000 };
    this.centerX = centerX || 2500;
    this.centerY = centerY || 2000;
    this.regionsConfig = window.CodeVyuhRegions || [];

    // --- NEW PROCEDURAL CONFIG ---
    this.terrainConfig = {
      mountainRanges: [
        { id: "logic_spine", points: [ {x:1000, y:1500}, {x:1800, y:1100}, {x:2600, y:1000}, {x:3400, y:1100}, {x:4200, y:1400} ], density: 50, scaleRange: [1.2, 4.0], theme: 'plains' },
        { id: "debug_cliffs", points: [ {x:800, y:2300}, {x:1000, y:2100}, {x:1400, y:2200} ], density: 15, scaleRange: [0.8, 2.2], theme: 'debug' },
        { id: "python_ridge", points: [ {x:2800, y:3000}, {x:3400, y:3200}, {x:4000, y:3100} ], density: 20, scaleRange: [1.0, 2.5], theme: 'python' }
      ],
      forestClusters: [
        { x: 2000, y: 1500, radius: 400, density: 45, theme: 'plains' },
        { x: 3200, y: 1600, radius: 350, density: 35, theme: 'plains' },
        { x: 2500, y: 2200, radius: 450, density: 60, theme: 'plains' },
        { x: 1500, y: 2900, radius: 250, density: 20, theme: 'debug' },
        { x: 3800, y: 2400, radius: 350, density: 40, theme: 'python' },
        { x: 2800, y: 2800, radius: 300, density: 30, theme: 'python' }
      ]
    };
  }"""
content = content.replace(constructor_old, constructor_new)

# 2. generateBaseLandmass
landmass_old = """    // We now use a unified ecology generation with Z-Sorting
    this.renderQueue = renderQueue || [];
    this.generateEcology(rx, ry);
    
    // If we own the queue, render it immediately. Otherwise defer to WorldEngine."""

landmass_new = """    // We now use a unified ecology generation with Z-Sorting
    this.renderQueue = renderQueue || [];
    
    this.generateMountainRanges();
    this.generateForestClusters();
    this.generateEcology(rx, ry);
    
    // If we own the queue, render it immediately. Otherwise defer to WorldEngine."""
content = content.replace(landmass_old, landmass_new)

# 3. Add Mountain Ranges and Forest Clusters after generateRoads
insert_marker = """  isCollision(x, y, radius) {"""

new_methods = """  getPointOnPath(points, t) {
    if (points.length < 2) return points[0];
    const maxIdx = points.length - 1;
    const scaledT = t * maxIdx;
    const idx = Math.floor(scaledT);
    if (idx >= maxIdx) return points[maxIdx];
    
    const p1 = points[idx];
    const p2 = points[idx + 1];
    const localT = scaledT - idx;
    
    const easeT = (Math.sin((localT - 0.5) * Math.PI) + 1) / 2;
    return {
      x: p1.x + (p2.x - p1.x) * easeT,
      y: p1.y + (p2.y - p1.y) * easeT
    };
  }

  generateMountainRanges() {
    this.terrainConfig.mountainRanges.forEach(range => {
      for (let i = 0; i < range.density; i++) {
        let t = i / (range.density - 1);
        const pt = this.getPointOnPath(range.points, t);
        
        const jitterX = window.rng.next() * 150 - 75;
        const jitterY = window.rng.next() * 80 - 40;
        
        const edgeFactor = Math.sin(t * Math.PI); 
        const scale = range.scaleRange[0] + (range.scaleRange[1] - range.scaleRange[0]) * edgeFactor * (0.6 + window.rng.next()*0.4);
        
        this.drawMountain(pt.x + jitterX, pt.y + jitterY, range.theme, scale);
      }
    });
  }

  generateForestClusters() {
    this.terrainConfig.forestClusters.forEach(cluster => {
      for (let i = 0; i < cluster.density; i++) {
        const angle = window.rng.next() * Math.PI * 2;
        const dist = Math.sqrt(window.rng.next()) * cluster.radius; 
        const x = cluster.x + Math.cos(angle) * dist;
        const y = cluster.y + Math.sin(angle) * dist * 0.6; 
        
        if (!this.isCollision(x, y, 50)) {
          this.drawTreeGroup(x, y, cluster.theme);
        }
      }
    });
  }

"""
content = content.replace(insert_marker, new_methods + insert_marker)

# 4. generateEcology
ecology_old_regex = r"  generateEcology\(rx, ry\) \{.*?\n  drawCrystal"
ecology_new = """  generateEcology(rx, ry) {
    const step = 150; 
    for (let x = this.bounds.minX; x < this.bounds.maxX; x += step) {
      for (let y = this.bounds.minY; y < this.bounds.maxY; y += step) {
        if (window.rng.next() > 0.45) continue;

        const jitterX = x + (window.rng.next() * 100 - 50);
        const jitterY = y + (window.rng.next() * 100 - 50);

        const dx = jitterX - this.centerX;
        const dy = jitterY - this.centerY;
        const normalizedDist = (dx*dx)/(rx*rx) + (dy*dy)/(ry*ry);
        if (normalizedDist > 0.8) continue; 

        if (!this.isCollision(jitterX, jitterY, 150)) {
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

          const theme = nearestRegion && minDist < (Math.max(nearestRegion.width, nearestRegion.height) * 2) 
                        ? nearestRegion.theme : 'plains';

          // Heavily reduced random scattering. Focus mostly on tiny details or sparse trees.
          if (theme === 'debug') {
            if (window.rng.next() > 0.8) this.drawCrystal(jitterX, jitterY);
          } else if (theme === 'python') {
            if (window.rng.next() > 0.7) this.drawPalmTree(jitterX, jitterY);
            else if (window.rng.next() > 0.6) this.drawTreeGroup(jitterX, jitterY, theme);
          } else {
            if (window.rng.next() > 0.8) this.drawTreeGroup(jitterX, jitterY, theme);
          }
        }
      }
    }
  }

  drawCrystal"""
content = re.sub(ecology_old_regex, ecology_new, content, flags=re.DOTALL)

# 5. drawMountain
mountain_old_regex = r"  drawMountain\(x, y, theme = 'plains'\) \{.*?\n  drawTreeGroup"
mountain_new = """  drawMountain(x, y, theme = 'plains', scaleMultiplier = 1.0) {
    const baseSize = window.rng.next() * 40 + 80; 
    const size = baseSize * scaleMultiplier;
    
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1, 1.666)`);
    g.setAttribute("class", "mountain-shadow");

    const baseColor = theme === 'debug' ? '#263238' : '#455a64';

    const variant = Math.floor(window.rng.next() * 3);
    
    const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const litSide = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const snow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    let pathBase, pathLit, pathSnow;

    if (variant === 0) {
      pathBase = `M 0,-${size} L -${size*0.4},-${size*0.3} L -${size*0.6},0 L -${size*0.3},${size*0.2} L 0,${size*0.3} L ${size*0.3},${size*0.2} L ${size*0.6},0 L ${size*0.4},-${size*0.3} Z`;
      pathLit = `M 0,-${size} L -${size*0.4},-${size*0.3} L -${size*0.6},0 L -${size*0.3},${size*0.2} L 0,${size*0.3} L -${size*0.1},-${size*0.1} L 0,-${size*0.4} Z`;
      pathSnow = `M 0,-${size} L -${size*0.2},-${size*0.5} L -${size*0.1},-${size*0.4} L 0,-${size*0.45} L ${size*0.1},-${size*0.35} L ${size*0.2},-${size*0.5} Z`;
    } else if (variant === 1) {
      pathBase = `M -${size*0.2},-${size*0.9} L 0,-${size*0.6} L ${size*0.3},-${size*0.8} L ${size*0.6},0 L ${size*0.2},${size*0.2} L -${size*0.3},${size*0.2} L -${size*0.6},0 Z`;
      pathLit = `M -${size*0.2},-${size*0.9} L -${size*0.6},0 L -${size*0.3},${size*0.2} L -${size*0.1},-${size*0.2} L 0,-${size*0.6} Z M ${size*0.3},-${size*0.8} L 0,-${size*0.6} L -${size*0.1},-${size*0.2} L ${size*0.2},${size*0.2} L ${size*0.1},-${size*0.3} Z`;
      pathSnow = `M -${size*0.2},-${size*0.9} L -${size*0.35},-${size*0.5} L -${size*0.2},-${size*0.6} L -${size*0.05},-${size*0.5} Z M ${size*0.3},-${size*0.8} L ${size*0.15},-${size*0.5} L ${size*0.3},-${size*0.55} L ${size*0.45},-${size*0.5} Z`;
    } else {
      pathBase = `M 0,-${size*1.2} L -${size*0.3},-${size*0.2} L -${size*0.5},0 L -${size*0.2},${size*0.2} L 0,${size*0.3} L ${size*0.2},${size*0.2} L ${size*0.5},0 L ${size*0.3},-${size*0.2} Z`;
      pathLit = `M 0,-${size*1.2} L -${size*0.3},-${size*0.2} L -${size*0.5},0 L -${size*0.2},${size*0.2} L 0,${size*0.3} L -${size*0.1},-${size*0.1} L 0,-${size*0.5} Z`;
      pathSnow = `M 0,-${size*1.2} L -${size*0.15},-${size*0.6} L -${size*0.05},-${size*0.5} L 0,-${size*0.6} L ${size*0.05},-${size*0.5} L ${size*0.15},-${size*0.6} Z`;
    }

    base.setAttribute("d", pathBase);
    base.setAttribute("fill", baseColor);
    
    litSide.setAttribute("d", pathLit);
    litSide.setAttribute("fill", "url(#mountain-grad)");

    g.appendChild(base);
    g.appendChild(litSide);

    if (scaleMultiplier > 1.4) {
      const snowColor = theme === 'debug' ? '#b0bec5' : '#ffffff';
      snow.setAttribute("d", pathSnow);
      snow.setAttribute("fill", snowColor);
      g.appendChild(snow);
    }

    this.renderQueue.push({ y: y, element: g });
  }

  drawTreeGroup"""
content = re.sub(mountain_old_regex, mountain_new, content, flags=re.DOTALL)

# 6. drawTreeGroup
tree_old_regex = r"  drawTreeGroup\(x, y, theme = 'plains'\) \{.*?\n\}"
tree_new = """  drawTreeGroup(x, y, theme = 'plains') {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x}, ${y}) scale(1, 1.666)`);
    g.setAttribute("filter", "url(#drop-shadow)");

    const numTrees = 2 + Math.floor(window.rng.next() * 4); // 2 to 5 trees

    const trees = [];
    for (let i = 0; i < numTrees; i++) {
      const tx = window.rng.next() * 40 - 20;
      const ty = window.rng.next() * 30 - 15;
      const tscale = 0.6 + window.rng.next() * 0.6;
      trees.push({ tx, ty, tscale });
    }
    trees.sort((a, b) => a.ty - b.ty);

    const leafLeftColor = theme === 'python' ? '#1b5e20' : '#2e7d32';
    const leafRightColor = theme === 'python' ? '#003300' : '#1b5e20';
    const leafMidColor = theme === 'python' ? '#33691e' : '#43a047';

    trees.forEach(t => {
      const colorJitter = window.rng.next() > 0.5 ? 'brightness(1.1)' : 'brightness(0.9)';

      const treeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      treeG.setAttribute("transform", `translate(${t.tx}, ${t.ty}) scale(${t.tscale})`);
      treeG.style.filter = colorJitter;

      const trunk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      trunk.setAttribute("x", "-4");
      trunk.setAttribute("y", "0");
      trunk.setAttribute("width", "8");
      trunk.setAttribute("height", "15");
      trunk.setAttribute("fill", "#5d4037");
      
      const variant = Math.floor(window.rng.next() * 2);
      
      let pLeft, pRight, pMidL, pMidR;
      if (variant === 0) {
        pLeft = "0,-40 -20,5 0,5";
        pRight = "0,-40 20,5 0,5";
        pMidL = "0,-25 -15,-5 0,-5";
        pMidR = "0,-25 15,-5 0,-5";
      } else {
        pLeft = "0,-50 -15,5 0,5";
        pRight = "0,-50 15,5 0,5";
        pMidL = "0,-30 -12,-5 0,-5";
        pMidR = "0,-30 12,-5 0,-5";
      }

      const leavesLeft = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      leavesLeft.setAttribute("points", pLeft);
      leavesLeft.setAttribute("fill", leafLeftColor);

      const leavesRight = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      leavesRight.setAttribute("points", pRight);
      leavesRight.setAttribute("fill", leafRightColor);

      const midLeft = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      midLeft.setAttribute("points", pMidL);
      midLeft.setAttribute("fill", leafMidColor);

      const midRight = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      midRight.setAttribute("points", pMidR);
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
}"""
content = re.sub(tree_old_regex, tree_new, content, flags=re.DOTALL)

with open("client/js/world/TerrainGenerator.js", "w", encoding="utf-8") as f:
    f.write(content)
