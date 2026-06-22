import re

with open("client/js/world/TerrainGenerator.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update config
config_old = """    // --- NEW PROCEDURAL CONFIG ---
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
    };"""

config_new = """    // --- NEW PROCEDURAL CONFIG ---
    this.terrainConfig = {
      mountainRanges: [
        { id: "logic_spine", points: [ {x:1200, y:900}, {x:1800, y:700}, {x:2500, y:700}, {x:3200, y:800}, {x:3800, y:1000} ], density: 30, scaleRange: [0.8, 2.2], theme: 'plains' },
        { id: "debug_cliffs", points: [ {x:800, y:2300}, {x:1100, y:2200}, {x:1400, y:2300} ], density: 10, scaleRange: [0.7, 1.6], theme: 'debug' },
        { id: "python_ridge", points: [ {x:2800, y:3300}, {x:3400, y:3400}, {x:4000, y:3200} ], density: 12, scaleRange: [0.7, 1.8], theme: 'python' }
      ],
      forestClusters: [
        { x: 1900, y: 1500, radius: 250, density: 25, theme: 'plains' },
        { x: 2200, y: 1600, radius: 200, density: 15, theme: 'plains' },
        { x: 3100, y: 1500, radius: 200, density: 15, theme: 'plains' },
        { x: 2500, y: 2200, radius: 300, density: 35, theme: 'plains' },
        { x: 2200, y: 2300, radius: 150, density: 10, theme: 'plains' },
        { x: 1500, y: 2900, radius: 200, density: 12, theme: 'debug' },
        { x: 3800, y: 2400, radius: 250, density: 25, theme: 'python' },
        { x: 2900, y: 2800, radius: 200, density: 15, theme: 'python' }
      ]
    };"""
content = content.replace(config_old, config_new)

# 2. Update generateMountainRanges
mountain_ranges_old = """  generateMountainRanges() {
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
  }"""

mountain_ranges_new = """  generateMountainRanges() {
    this.terrainConfig.mountainRanges.forEach(range => {
      for (let i = 0; i < range.density; i++) {
        let t = i / (range.density - 1);
        const pt = this.getPointOnPath(range.points, t);
        
        const jitterX = window.rng.next() * 120 - 60;
        const jitterY = window.rng.next() * 60 - 30;
        
        const isMajor = window.rng.next() > 0.75;
        const edgeFactor = Math.sin(t * Math.PI); 
        
        let scale = range.scaleRange[0] + window.rng.next() * 0.3;
        if (isMajor) {
          scale += (range.scaleRange[1] - range.scaleRange[0]) * edgeFactor * (0.8 + window.rng.next() * 0.4);
        }
        
        this.drawMountain(pt.x + jitterX, pt.y + jitterY, range.theme, scale);
      }
    });
  }"""
content = content.replace(mountain_ranges_old, mountain_ranges_new)

# 3. Update generateForestClusters
forest_old = """  generateForestClusters() {
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
  }"""

forest_new = """  generateForestClusters() {
    this.terrainConfig.forestClusters.forEach(cluster => {
      for (let i = 0; i < cluster.density; i++) {
        const angle = window.rng.next() * Math.PI * 2;
        const r1 = window.rng.next();
        const r2 = window.rng.next();
        const dist = cluster.radius * (r1 * r2); // Center-weighted
        const x = cluster.x + Math.cos(angle) * dist;
        const y = cluster.y + Math.sin(angle) * dist * 0.6; 
        
        if (!this.isCollision(x, y, 40)) {
          this.drawTreeGroup(x, y, cluster.theme);
        }
      }
    });
  }"""
content = content.replace(forest_old, forest_new)

# 4. Update generateEcology scattering
ecology_old = """          // Heavily reduced random scattering. Focus mostly on tiny details or sparse trees.
          if (theme === 'debug') {
            if (window.rng.next() > 0.8) this.drawCrystal(jitterX, jitterY);
          } else if (theme === 'python') {
            if (window.rng.next() > 0.7) this.drawPalmTree(jitterX, jitterY);
            else if (window.rng.next() > 0.6) this.drawTreeGroup(jitterX, jitterY, theme);
          } else {
            if (window.rng.next() > 0.8) this.drawTreeGroup(jitterX, jitterY, theme);
          }"""

ecology_new = """          // Restore sparse random scattering of background elements
          if (theme === 'debug') {
            const r = window.rng.next();
            if (r > 0.95) this.drawMountain(jitterX, jitterY, theme, 0.6 + window.rng.next()*0.3);
            else if (r > 0.8) this.drawCrystal(jitterX, jitterY);
          } else if (theme === 'python') {
            const r = window.rng.next();
            if (r > 0.95) this.drawMountain(jitterX, jitterY, theme, 0.6 + window.rng.next()*0.3);
            else if (r > 0.7) this.drawPalmTree(jitterX, jitterY);
            else if (r > 0.6) this.drawTreeGroup(jitterX, jitterY, theme);
          } else {
            const r = window.rng.next();
            if (r > 0.95) this.drawMountain(jitterX, jitterY, theme, 0.6 + window.rng.next()*0.3);
            else if (r > 0.8) this.drawTreeGroup(jitterX, jitterY, theme);
          }"""
content = content.replace(ecology_old, ecology_new)

# 5. Update drawMountain variants
mountain_variants_old = """    if (variant === 0) {
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

    if (scaleMultiplier > 1.4) {"""

mountain_variants_new = """    if (variant === 0) {
      pathBase = `M 0,-${size} L -${size*0.4},-${size*0.3} L -${size*0.6},0 L -${size*0.3},${size*0.2} L 0,${size*0.3} L ${size*0.3},${size*0.2} L ${size*0.6},0 L ${size*0.4},-${size*0.3} Z`;
      pathLit = `M 0,-${size} L -${size*0.4},-${size*0.3} L -${size*0.6},0 L -${size*0.3},${size*0.2} L 0,${size*0.3} L -${size*0.1},-${size*0.1} L 0,-${size*0.4} Z`;
      pathSnow = `M 0,-${size} L -${size*0.2},-${size*0.5} L -${size*0.1},-${size*0.4} L 0,-${size*0.45} L ${size*0.1},-${size*0.35} L ${size*0.2},-${size*0.5} Z`;
    } else if (variant === 1) {
      pathBase = `M -${size*0.2},-${size*0.8} L 0,-${size*0.5} L ${size*0.3},-${size*0.7} L ${size*0.6},0 L ${size*0.2},${size*0.2} L -${size*0.3},${size*0.2} L -${size*0.6},0 Z`;
      pathLit = `M -${size*0.2},-${size*0.8} L -${size*0.6},0 L -${size*0.3},${size*0.2} L -${size*0.1},-${size*0.2} L 0,-${size*0.5} Z M ${size*0.3},-${size*0.7} L 0,-${size*0.5} L -${size*0.1},-${size*0.2} L ${size*0.2},${size*0.2} L ${size*0.1},-${size*0.3} Z`;
      pathSnow = `M -${size*0.2},-${size*0.8} L -${size*0.35},-${size*0.45} L -${size*0.2},-${size*0.5} L -${size*0.05},-${size*0.45} Z M ${size*0.3},-${size*0.7} L ${size*0.15},-${size*0.45} L ${size*0.3},-${size*0.5} L ${size*0.45},-${size*0.45} Z`;
    } else {
      pathBase = `M 0,-${size*0.9} L -${size*0.4},-${size*0.2} L -${size*0.7},0 L -${size*0.3},${size*0.2} L 0,${size*0.3} L ${size*0.3},${size*0.2} L ${size*0.7},0 L ${size*0.4},-${size*0.2} Z`;
      pathLit = `M 0,-${size*0.9} L -${size*0.4},-${size*0.2} L -${size*0.7},0 L -${size*0.3},${size*0.2} L 0,${size*0.3} L -${size*0.1},-${size*0.1} L 0,-${size*0.5} Z`;
      pathSnow = `M 0,-${size*0.9} L -${size*0.15},-${size*0.5} L -${size*0.05},-${size*0.4} L 0,-${size*0.5} L ${size*0.05},-${size*0.4} L ${size*0.15},-${size*0.5} Z`;
    }

    base.setAttribute("d", pathBase);
    base.setAttribute("fill", baseColor);
    
    litSide.setAttribute("d", pathLit);
    litSide.setAttribute("fill", "url(#mountain-grad)");

    g.appendChild(base);
    g.appendChild(litSide);

    if (scaleMultiplier > 1.2) {"""
content = content.replace(mountain_variants_old, mountain_variants_new)

with open("client/js/world/TerrainGenerator.js", "w", encoding="utf-8") as f:
    f.write(content)
