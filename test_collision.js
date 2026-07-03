const fs = require('fs');
const code = fs.readFileSync('client/js/world/TerrainGenerator.js', 'utf8');

global.document = {
    createElementNS: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} })
};
global.window = { rng: { next: () => 0.5 } };
global.console = { log: function() {} };

let mockContext = {
    renderQueue: [],
    renderer: { getLayer: () => ({}) },
    createPoly: () => ({}),
    createVerticalSliceCanopy: () => ({}),
    createVerticalSliceBridge: () => ({ setAttribute: () => {} }),
    drawAcademyLibrary: function(x, y, scale) { process.stdout.write('LIBRARY: ' + x.toFixed(1) + ', ' + y.toFixed(1) + '\n'); },
    drawAcademyTemple: function() {},
    drawAcademyDorm: function() {},
    drawStoneTile: function() {},
    renderAcademyTreeCustom: function() {}
};

const funcStr = code.substring(code.indexOf('renderLogicDominionVerticalSlice(bounds) {'), code.indexOf('renderDebugWastelandVerticalSlice(bounds) {'));
const modifiedFunc = funcStr.replace('if (collision) break;', 'if (collision) { process.stdout.write("COLLISION at " + (angle * 180 / Math.PI).toFixed(1) + " deg with obs " + JSON.stringify(obs) + "\\n"); break; }');
const wrapped = 'mockContext.render = function(bounds) { ' + modifiedFunc.substring(modifiedFunc.indexOf('{')+1, modifiedFunc.lastIndexOf('}')) + ' };';
eval(wrapped);

mockContext.render({ minX: -2000, maxX: 2000, minY: -2000, maxY: 2000 });
