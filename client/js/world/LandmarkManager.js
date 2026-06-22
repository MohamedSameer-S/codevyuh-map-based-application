class LandmarkManager {
  constructor(renderer) {
    this.renderer = renderer;
  }

  generateLandmark(region, renderQueue) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "landmark-element landmark-shadow");
    g.setAttribute("id", `landmark-${region.id}`);
    
    // Position landmark perfectly centered
    const x = region.x;
    const y = region.y;

    // Draw dirt path below the landmark
    const dirt = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    dirt.setAttribute("cx", x);
    dirt.setAttribute("cy", y);
    dirt.setAttribute("rx", 140); // Scaled up dirt path
    dirt.setAttribute("ry", 80);
    dirt.setAttribute("fill", "#5d4037");
    dirt.setAttribute("opacity", "0.4");
    dirt.setAttribute("filter", "blur(5px)");
    this.renderer.getLayer('landmass').appendChild(dirt);

    // Scale up 2x from previous 1.4 -> 2.8, 2.333 -> 4.666
    g.setAttribute("transform", `translate(${x}, ${y}) scale(2.8, 4.666)`);

    // Let's create SVG shapes for the specific landmarks based on type
    switch (region.landmarkType) {
      case 'academy':
        this.buildAcademy(g);
        break;
      case 'fortress':
        this.buildFortress(g);
        break;
      case 'industrial':
        this.buildIndustrialCity(g);
        break;
      case 'temple':
        this.buildJungleTemple(g);
        break;
      default:
        this.buildGenericCastle(g);
    }

    // Attach text label right below the landmark
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", 0);
    text.setAttribute("y", 60); // Adjusted for new scale
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#ffffff");
    text.setAttribute("font-size", "20px"); // adjusted for scale
    text.setAttribute("font-weight", "bold");
    text.setAttribute("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.8))");
    
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
    // 3D Isometric Academy (Logic)
    // Central main block
    const baseFront = this.createPoly("-30,0 30,0 30,-40 -30,-40", "#e0f7fa");
    const baseLeft = this.createPoly("-30,0 -50,-15 -50,-55 -30,-40", "#b2ebf2");
    const baseTop = this.createPoly("-30,-40 -50,-55 10,-55 30,-40", "#ffffff");
    
    // Dome
    const dome = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dome.setAttribute("d", "M -10,-45 A 20 20 0 0 1 30,-45 Z");
    dome.setAttribute("fill", "#00bcd4");
    
    // Spire
    const spireLeft = this.createPoly("10,-65 5,-100 10,-110", "#ffb300");
    const spireRight = this.createPoly("10,-65 15,-100 10,-110", "#ff8f00");

    g.appendChild(baseLeft);
    g.appendChild(baseFront);
    g.appendChild(baseTop);
    g.appendChild(dome);
    g.appendChild(spireLeft);
    g.appendChild(spireRight);
  }

  buildFortress(g) {
    // 3D Ruined Fortress (Debug)
    // Left Tower
    const tlFront = this.createPoly("-40,0 -20,10 -20,-30 -40,-40", "#37474f");
    const tlLeft = this.createPoly("-40,0 -60,-10 -60,-50 -40,-40", "#263238");
    const tlTop = this.createPoly("-40,-40 -60,-50 -40,-60 -20,-50", "#455a64");

    // Right Tower
    const trFront = this.createPoly("20,10 40,0 40,-40 20,-30", "#37474f");
    const trRight = this.createPoly("40,0 60,-10 60,-50 40,-40", "#1a232e");
    const trTop = this.createPoly("20,-30 40,-40 60,-50 40,-40", "#455a64"); // Ruined

    // Connecting Wall
    const wallFront = this.createPoly("-20,10 20,10 20,-10 -20,-10", "#263238");

    // Crystals with pulsing glow animation
    const c1Left = this.createPoly("0,-5 -15,-20 -5,-35", "#d500f9");
    const c1Right = this.createPoly("0,-5 10,-25 -5,-35", "#aa00ff");

    const glow = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    glow.setAttribute("attributeName", "opacity");
    glow.setAttribute("values", "0.5;1;0.5");
    glow.setAttribute("dur", "2.5s");
    glow.setAttribute("repeatCount", "indefinite");
    
    c1Left.appendChild(glow.cloneNode());
    c1Right.appendChild(glow);

    g.appendChild(tlLeft);
    g.appendChild(tlFront);
    g.appendChild(tlTop);
    g.appendChild(trRight);
    g.appendChild(trFront);
    g.appendChild(wallFront);
    g.appendChild(c1Left);
    g.appendChild(c1Right);
  }

  buildIndustrialCity(g) {
    // 3D Factories (Systems)
    // Main Building
    const b1Front = this.createPoly("-20,20 20,20 20,-20 -20,-20", "#546e7a");
    const b1Left = this.createPoly("-20,20 -40,10 -40,-30 -20,-20", "#37474f");
    const b1Top = this.createPoly("-20,-20 -40,-30 0,-30 20,-20", "#78909c");

    // Stacks
    const s1Front = this.createPoly("0,-25 10,-25 10,-60 0,-60", "#263238");
    const s1Left = this.createPoly("0,-25 -5,-27 -5,-62 0,-60", "#1a232e");
    
    const s2Front = this.createPoly("-15,-25 -5,-25 -5,-50 -15,-50", "#263238");
    const s2Left = this.createPoly("-15,-25 -20,-27 -20,-52 -15,-50", "#1a232e");

    // Animated Smoke
    const smokeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const smokeBubbles = [
      { x: 5, y: -60, dur: "2s", delay: "0s" },
      { x: -10, y: -50, dur: "2.5s", delay: "0.5s" }
    ];

    smokeBubbles.forEach(b => {
      const smoke = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      smoke.setAttribute("cx", b.x);
      smoke.setAttribute("cy", b.y);
      smoke.setAttribute("r", "8");
      smoke.setAttribute("fill", "#b0bec5");
      smoke.setAttribute("opacity", "0.6");
      smoke.style.mixBlendMode = "screen";

      const animY = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
      animY.setAttribute("attributeName", "transform");
      animY.setAttribute("type", "translate");
      animY.setAttribute("from", "0,0");
      animY.setAttribute("to", "0,-40");
      animY.setAttribute("dur", b.dur);
      animY.setAttribute("begin", b.delay);
      animY.setAttribute("repeatCount", "indefinite");

      const animOpacity = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animOpacity.setAttribute("attributeName", "opacity");
      animOpacity.setAttribute("values", "0.6;0");
      animOpacity.setAttribute("dur", b.dur);
      animOpacity.setAttribute("begin", b.delay);
      animOpacity.setAttribute("repeatCount", "indefinite");

      smoke.appendChild(animY);
      smoke.appendChild(animOpacity);
      smokeGroup.appendChild(smoke);
    });

    g.appendChild(b1Left);
    g.appendChild(b1Front);
    g.appendChild(b1Top);
    g.appendChild(s1Left);
    g.appendChild(s1Front);
    g.appendChild(s2Front);
    g.appendChild(s2Left);
    g.appendChild(smokeGroup);
  }

  buildJungleTemple(g) {
    // 3D Step Pyramid (Python)
    const tiers = [
      { y: 10, w: 80, h: 15, d: 40 },
      { y: -5, w: 60, h: 15, d: 30 },
      { y: -20, w: 40, h: 15, d: 20 }
    ];

    tiers.forEach(t => {
      const front = this.createPoly(`${-t.w/2},${t.y} ${t.w/2},${t.y} ${t.w/2},${t.y-t.h} ${-t.w/2},${t.y-t.h}`, "#558b2f");
      const left = this.createPoly(`${-t.w/2},${t.y} ${-t.w/2 - t.d/2},${t.y - t.d/2} ${-t.w/2 - t.d/2},${t.y - t.h - t.d/2} ${-t.w/2},${t.y-t.h}`, "#33691e");
      const top = this.createPoly(`${-t.w/2},${t.y-t.h} ${-t.w/2 - t.d/2},${t.y - t.h - t.d/2} ${t.w/2 - t.d/2},${t.y - t.h - t.d/2} ${t.w/2},${t.y-t.h}`, "#7cb342");
      g.appendChild(left);
      g.appendChild(front);
      g.appendChild(top);
    });
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
