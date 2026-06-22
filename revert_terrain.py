import re

with open("client/js/world/TerrainGenerator.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Constructor
constructor_old_regex = r"  constructor\(renderer, bounds, centerX, centerY\) \{.*?\};\n  \}"
constructor_new = """  constructor(renderer, bounds, centerX, centerY) {
    this.renderer = renderer;
    this.width = renderer.width;
    this.height = renderer.height;
    this.bounds = bounds || { minX: 0, maxX: 5000, minY: 0, maxY: 4000 };
    this.centerX = centerX || 2500;
    this.centerY = centerY || 2000;
    this.regionsConfig = window.CodeVyuhRegions || [];
  }"""
content = re.sub(constructor_old_regex, constructor_new, content, flags=re.DOTALL)

# 2. generateBaseLandmass
landmass_old = """    // We now use a unified ecology generation with Z-Sorting
    this.renderQueue = renderQueue || [];
    
    this.generateMountainRanges();
    this.generateForestClusters();
    this.generateEcology(rx, ry);
    
    // If we own the queue, render it immediately. Otherwise defer to WorldEngine."""
landmass_new = """    // We now use a unified ecology generation with Z-Sorting
    this.renderQueue = renderQueue || [];
    this.generateEcology(rx, ry);
    
    // If we own the queue, render it immediately. Otherwise defer to WorldEngine."""
content = content.replace(landmass_old, landmass_new)

# 3. Remove new methods
methods_regex = r"  getPointOnPath\(points, t\) \{.*?\n  isCollision"
methods_new = """  isCollision"""
content = re.sub(methods_regex, methods_new, content, flags=re.DOTALL)

# 4. generateEcology
ecology_old_regex = r"  generateEcology\(rx, ry\) \{.*?\n  drawCrystal"
ecology_new = """  generateEcology(rx, ry) {
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

  drawCrystal"""
content = re.sub(ecology_old_regex, ecology_new, content, flags=re.DOTALL)

# 5. drawMountain
mountain_old_regex = r"  drawMountain\(x, y, theme = 'plains', scaleMultiplier = 1\.0\) \{.*?\n  drawTreeGroup"
mountain_new = """  drawMountain(x, y, theme = 'plains') {
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

  drawTreeGroup"""
content = re.sub(mountain_old_regex, mountain_new, content, flags=re.DOTALL)

# 6. drawTreeGroup
tree_old_regex = r"  drawTreeGroup\(x, y, theme = 'plains'\) \{.*?\n\}"
tree_new = """  drawTreeGroup(x, y, theme = 'plains') {
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
}"""
content = re.sub(tree_old_regex, tree_new, content, flags=re.DOTALL)

with open("client/js/world/TerrainGenerator.js", "w", encoding="utf-8") as f:
    f.write(content)
