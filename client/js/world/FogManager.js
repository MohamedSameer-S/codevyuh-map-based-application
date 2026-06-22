class FogManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.initCloudDefs();
  }

  initCloudDefs() {
    // Combine Blur and Drop shadow into a single optimized filter pass
    // This prevents the browser from running 60+ heavy filter calculations per frame!
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "cloud-fx");
    // Expand filter bounds so it doesn't clip the heavy blur
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    filter.innerHTML = `
      <!-- First blur the raw shapes -->
      <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blurred" />
      <!-- Then add the drop shadow to the blurred cloud -->
      <feDropShadow in="blurred" dx="5" dy="15" stdDeviation="10" flood-color="#b8c7d3" flood-opacity="0.6" result="shadow" />
    `;
    this.renderer.defs.appendChild(filter);
  }

  generateFog(width, height, regions) {
    const layer = this.renderer.getLayer('fog');
    
    layer.innerHTML = '';

    const fogOfWarLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    fogOfWarLayer.setAttribute("id", "fogOfWarLayer");
    fogOfWarLayer.setAttribute("style", "pointer-events: none;");

    const colors = ["#ffffff", "#dfeaf2", "#f2f6f8"];

    regions.forEach(region => {
      if (region.locked) {
        const cloudGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        // Apply the combined, optimized filter ONLY to the parent group!
        // This is 60x faster than blurring every single circle!
        cloudGroup.setAttribute("filter", "url(#cloud-fx)");
        
        const targetRadius = Math.max(region.width, region.height) / 1.8;
        
        const coreBlob = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        coreBlob.setAttribute("cx", region.x);
        coreBlob.setAttribute("cy", region.y);
        coreBlob.setAttribute("rx", targetRadius * 0.9);
        coreBlob.setAttribute("ry", targetRadius * 0.6);
        coreBlob.setAttribute("fill", "#ffffff");
        coreBlob.setAttribute("opacity", "1");
        // Removed filter from individual element
        cloudGroup.appendChild(coreBlob);
        
        const numBlobs = 60; 
        
        for (let i = 0; i < numBlobs; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = (0.3 + Math.random() * 0.8) * targetRadius;
          
          const cx = region.x + Math.cos(angle) * dist;
          const cy = region.y + Math.sin(angle) * dist * 0.65; 
          
          const r = 100 + Math.random() * 150;
          
          const blob = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          blob.setAttribute("cx", cx);
          blob.setAttribute("cy", cy);
          blob.setAttribute("r", r);
          
          const color = colors[Math.floor(Math.random() * colors.length)];
          blob.setAttribute("fill", color);
          
          const opacity = 0.85 + Math.random() * 0.15;
          blob.setAttribute("opacity", opacity);
          
          // Removed individual filter, massively improving performance
          cloudGroup.appendChild(blob);
        }
        
        fogOfWarLayer.appendChild(cloudGroup);
      }
    });

    layer.appendChild(fogOfWarLayer);
  }
}

window.FogManager = FogManager;
