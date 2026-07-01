const fs = require('fs');

let tgContent = fs.readFileSync('engine/world/TerrainGenerator.js', 'utf-8');
tgContent = tgContent.replace(/import .*;/g, '').replace(/export default class/g, 'class');

const script = `
  const document = { 
    createElementNS: (ns, t) => {
      return { 
        setAttribute: () => {}, 
        appendChild: () => {}, 
        style: {} 
      };
    } 
  };
  const window = { rng: { next: () => 0.5 } };
  const CodeVyuhRegions = [];
  
  ${tgContent}
  
  const tg = new TerrainGenerator({ getLayer: () => ({ appendChild: () => {} }) }, { minX: 0, maxX: 100, minY: 0, maxY: 100 }, 0, 0);
  tg.renderQueue = [];
  try {
    tg.renderLogicDominionVerticalSlice({ minX: 0, maxX: 100, minY: 0, maxY: 100 });
    console.log('SUCCESS. renderQueue size:', tg.renderQueue.length);
  } catch (e) {
    console.log('CRASH:', e.stack);
  }
`;

fs.writeFileSync('test_render_eval2.js', script);
