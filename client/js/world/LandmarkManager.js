class LandmarkManager {
  constructor(renderer) {
    this.renderer = renderer;
  }

  generateLandmark(region, renderQueue) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "landmark-element landmark-shadow");
    g.setAttribute("id", `landmark-${region.id}`);
    g.style.pointerEvents = "none"; // Safety rule 8: Never block pan/zoom/click
    
    // Position landmark perfectly centered
    const x = region.x;
    const y = region.y;
    g.setAttribute("transform", `translate(${x}, ${y})`);

    // Draw dirt path below the landmark
    const dirt = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    dirt.setAttribute("cx", x);
    dirt.setAttribute("cy", y);
    dirt.setAttribute("rx", 260); // Scaled up dirt path for massive landmark
    dirt.setAttribute("ry", 150);
    dirt.setAttribute("fill", "#5d4037");
    dirt.setAttribute("opacity", "0.4");
    dirt.setAttribute("filter", "blur(5px)");
    dirt.style.pointerEvents = "none";
    this.renderer.getLayer('landmass').appendChild(dirt);

    // Create a dedicated group for isometric shapes so text is NOT distorted!
    const buildingGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    buildingGroup.setAttribute("transform", `scale(5.5, 9.16)`);
    g.appendChild(buildingGroup);

    // Let's create SVG shapes for the specific landmarks based on type
    switch (region.landmarkType) {
      case 'academy':
        this.buildAcademy(buildingGroup);
        break;
      case 'fortress':
        this.buildFortress(buildingGroup);
        break;
      case 'industrial':
        this.buildIndustrialCity(buildingGroup);
        break;
      case 'temple':
        this.buildJungleTemple(buildingGroup);
        break;
      default:
        this.buildGenericCastle(buildingGroup);
    }

    // Attach text label right below the landmark (Decoupled from the isometric stretch!)
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", 0);
    text.setAttribute("y", 190); // Absolute pixels below the center
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#ffffff");
    text.setAttribute("font-size", "40px"); // Crisp, readable, unsquished font
    text.setAttribute("font-weight", "bold");
    text.setAttribute("filter", "drop-shadow(0px 3px 3px rgba(0,0,0,0.8))");
    text.style.pointerEvents = "none";
    
    // Obfuscate text if locked so it looks mysterious under the clouds
    if (region.locked) {
      text.textContent = "??? (Locked)";
      text.setAttribute("opacity", "0.6");
    } else {
      text.textContent = region.name;
    }
    
    g.appendChild(text);

    // Push into the Global Z-Sorting RenderQueue
    if (renderQueue) {
      renderQueue.push({ y: y, element: g });
    } else {
      this.renderer.getLayer('landmarks').appendChild(g);
    }
  }

  buildAcademy(g) {
    // Logic Dominion: Peaceful, Bright, Knowledge Citadel
    // Base platform
    g.appendChild(this.createPoly("-45,15 -60,0 45,0 60,15", "#e0f7fa"));

    // Left Wing
    g.appendChild(this.createPoly("-35,5 -45,-3 -45,-15 -35,-7", "#b2ebf2")); 
    g.appendChild(this.createPoly("-35,5 -15,5 -15,-7 -35,-7", "#e0f7fa"));   
    g.appendChild(this.createPoly("-35,-7 -45,-15 -25,-15 -15,-7", "#ffffff"));
    
    // Right Wing
    g.appendChild(this.createPoly("15,5 5,-3 5,-15 15,-7", "#b2ebf2"));
    g.appendChild(this.createPoly("15,5 35,5 35,-7 15,-7", "#e0f7fa"));
    g.appendChild(this.createPoly("15,-7 5,-15 25,-15 35,-7", "#ffffff"));

    // Main Citadel Block
    g.appendChild(this.createPoly("-20,10 -35,0 -35,-30 -20,-20", "#b2ebf2"));
    g.appendChild(this.createPoly("-20,10 20,10 20,-20 -20,-20", "#ffffff"));
    g.appendChild(this.createPoly("-20,-20 -35,-30 5,-30 20,-20", "#e0f7fa"));

    // Entrance Columns
    for(let i=0; i<4; i++) {
        g.appendChild(this.createPoly(`${-12 + i*8},10 ${-10 + i*8},10 ${-10 + i*8},-20 ${-12 + i*8},-20`, "#b2ebf2"));
    }

    // Cyan Dome
    const dome = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dome.setAttribute("d", "M -15,-20 A 15 12 0 0 1 15,-20 Z");
    dome.setAttribute("fill", "#00bcd4");
    g.appendChild(dome);

    // Golden Spire
    g.appendChild(this.createPoly("-2,-32 0,-45 2,-32", "#ffca28"));
  }

  buildFortress(g) {
    // Debug Realm: Corrupted Tower
    // Cracked Dark Base
    g.appendChild(this.createPoly("-40,15 -55,0 40,0 55,15", "#263238"));
    const crack = document.createElementNS("http://www.w3.org/2000/svg", "path");
    crack.setAttribute("d", "M -20,10 L -10,5 L -5,8 L 10,2 L 15,5");
    crack.setAttribute("stroke", "#aa00ff"); 
    crack.setAttribute("fill", "none"); 
    crack.setAttribute("stroke-width", "1");
    g.appendChild(crack);

    // Main Tower Base
    g.appendChild(this.createPoly("-20,10 -35,0 -35,-20 -20,-10", "#1a232e")); 
    g.appendChild(this.createPoly("-20,10 20,10 20,-10 -20,-10", "#37474f")); 
    g.appendChild(this.createPoly("-20,-10 -35,-20 5,-20 20,-10", "#455a64")); 
    
    // Crooked Upper Tower
    g.appendChild(this.createPoly("-15,-10 -25,-16 -25,-40 -15,-34", "#1a232e"));
    g.appendChild(this.createPoly("-15,-10 10,-10 10,-30 -15,-34", "#37474f")); 
    
    // Dark Spikes
    g.appendChild(this.createPoly("-15,-34 -25,-40 -10,-45", "#263238"));
    g.appendChild(this.createPoly("-15,-34 10,-30 -2,-42", "#455a64"));

    // Purple Crystals (No animation)
    g.appendChild(this.createPoly("-30,5 -40,-2 -35,-15", "#aa00ff"));
    g.appendChild(this.createPoly("-30,5 -20,-2 -35,-15", "#d500f9"));
    g.appendChild(this.createPoly("25,8 15,2 20,-12", "#6a1b9a"));
    g.appendChild(this.createPoly("25,8 35,2 20,-12", "#aa00ff"));

    // Glowing Core
    const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    core.setAttribute("cx", "-2"); 
    core.setAttribute("cy", "-25"); 
    core.setAttribute("r", "3.5");
    core.setAttribute("fill", "#ea80fc");
    g.appendChild(core);
  }

  buildIndustrialCity(g) {
    // Systems Frontier: Engineering Factory
    // Metal Base
    g.appendChild(this.createPoly("-50,15 -60,5 40,5 50,15", "#455a64"));
    
    // Main Factory Block
    g.appendChild(this.createPoly("-30,10 -45,0 -45,-20 -30,-10", "#37474f"));
    g.appendChild(this.createPoly("-30,10 30,10 30,-10 -30,-10", "#546e7a"));
    g.appendChild(this.createPoly("-30,-10 -45,-20 15,-20 30,-10", "#78909c"));

    // Chimneys
    g.appendChild(this.createPoly("-15,-15 -20,-18 -20,-45 -15,-42", "#263238"));
    g.appendChild(this.createPoly("-15,-15 -10,-15 -10,-42 -15,-42", "#455a64"));
    g.appendChild(this.createPoly("-15,-42 -20,-45 -15,-45 -10,-42", "#1a232e"));

    g.appendChild(this.createPoly("5,-12 0,-15 0,-35 5,-32", "#263238"));
    g.appendChild(this.createPoly("5,-12 10,-12 10,-32 5,-32", "#455a64"));

    // Static Smoke puffs (No animation)
    const puff1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    puff1.setAttribute("cx", "-15"); puff1.setAttribute("cy", "-52"); puff1.setAttribute("r", "5"); puff1.setAttribute("fill", "#90a4ae");
    const puff2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    puff2.setAttribute("cx", "-10"); puff2.setAttribute("cy", "-57"); puff2.setAttribute("r", "7"); puff2.setAttribute("fill", "#b0bec5");
    g.appendChild(puff1); g.appendChild(puff2);

    // Factory Details (Pipes & Gears)
    g.appendChild(this.createPoly("-20,5 -20,15 -15,15 -15,5", "#ff8f00")); 
    g.appendChild(this.createPoly("10,2 10,12 15,12 15,2", "#ffb300")); 
    
    // Simplified Gear
    const gear = document.createElementNS("http://www.w3.org/2000/svg", "path");
    gear.setAttribute("d", "M 0,5 A 4 4 0 1 1 0,4.9 Z M 0,3 A 2 2 0 1 0 0,3.1 Z");
    gear.setAttribute("fill", "#cfd8dc");
    g.appendChild(gear);
  }

  buildJungleTemple(g) {
    // Python Wildlands: Overgrown Jungle Temple
    // Mossy Ground Base
    g.appendChild(this.createPoly("-45,15 -55,5 45,5 55,15", "#33691e"));

    // Stepped Tiers
    const tiers = [
      { y: 10, w: 70, h: 10, d: 40, c1: "#558b2f", c2: "#33691e", c3: "#7cb342" },
      { y: 0, w: 50, h: 12, d: 30, c1: "#558b2f", c2: "#33691e", c3: "#7cb342" },
      { y: -12, w: 30, h: 15, d: 20, c1: "#558b2f", c2: "#33691e", c3: "#7cb342" }
    ];

    tiers.forEach(t => {
      const front = this.createPoly(`${-t.w/2},${t.y} ${t.w/2},${t.y} ${t.w/2},${t.y-t.h} ${-t.w/2},${t.y-t.h}`, t.c1);
      const left = this.createPoly(`${-t.w/2},${t.y} ${-t.w/2 - t.d/2},${t.y - t.d/2} ${-t.w/2 - t.d/2},${t.y - t.h - t.d/2} ${-t.w/2},${t.y-t.h}`, t.c2);
      const top = this.createPoly(`${-t.w/2},${t.y-t.h} ${-t.w/2 - t.d/2},${t.y - t.h - t.d/2} ${t.w/2 - t.d/2},${t.y - t.h - t.d/2} ${t.w/2},${t.y-t.h}`, t.c3);
      g.appendChild(left); 
      g.appendChild(front); 
      g.appendChild(top);
    });

    // Golden Shrine Top
    g.appendChild(this.createPoly("-5,-27 -10,-32 -10,-37 -5,-32", "#f57f17"));
    g.appendChild(this.createPoly("-5,-27 5,-27 5,-32 -5,-32", "#fbc02d"));
    g.appendChild(this.createPoly("-5,-32 -10,-37 0,-37 5,-32", "#fff59d"));

    // Overgrown Vines
    const vine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    vine.setAttribute("d", "M -15,-12 Q -10,-5 -15,0 T -10,10 M 15,-12 Q 12,-5 18,0");
    vine.setAttribute("stroke", "#1b5e20"); 
    vine.setAttribute("stroke-width", "2"); 
    vine.setAttribute("fill", "none");
    g.appendChild(vine);

    // Front Doorway
    g.appendChild(this.createPoly("-8,10 8,10 8,0 -8,0", "#1b5e20"));
  }

  createPoly(points, color) {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    p.setAttribute("points", points);
    p.setAttribute("fill", color);
    return p;
  }

  buildGenericCastle(g) {
    const base = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    base.setAttribute("x", "-50");
    base.setAttribute("y", "-50");
    base.setAttribute("width", "100");
    base.setAttribute("height", "100");
    base.setAttribute("fill", "#999");
    g.appendChild(base);
  }
}

window.LandmarkManager = LandmarkManager;
