const logicAnchors = { academy: { x: -476, y: -742 } };
const dist = (p1, p2) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
const obstacles = [];
const rootX = -476; const rootY = -742;
const forest1X = rootX - 1600; const forest1Y = rootY - 600;
const forest2X = rootX + 1500; const forest2Y = rootY + 300;
const forest3X = rootX + 800; const forest3Y = rootY - 900;
obstacles.push({ name: 'Academy', x: logicAnchors.academy.x, y: logicAnchors.academy.y, radius: 800 });
obstacles.push({ name: 'Forest1', x: forest1X, y: forest1Y, radius: 450 });
obstacles.push({ name: 'Forest2', x: forest2X, y: forest2Y, radius: 450 });
obstacles.push({ name: 'Forest3', x: forest3X, y: forest3Y, radius: 400 });
obstacles.push({ name: 'River', isLine: true, yLine: logicAnchors.academy.y + 500, thickness: 250 });
obstacles.push({ name: 'RoadV', isLine: true, xLine: logicAnchors.academy.x, thickness: 150 });
obstacles.push({ name: 'RoadH', isLine: true, yLine: logicAnchors.academy.y, thickness: 100 });

const findSafePlacement = (name, minDist, maxDist, prefAngle, rad) => {
    for (let d = minDist; d <= maxDist; d += 50) {
        // NO SWEEPING. Only try prefAngle.
        const angle = prefAngle;
        const cand = { x: logicAnchors.academy.x + Math.cos(angle) * d, y: logicAnchors.academy.y + Math.sin(angle) * d };
        
        let collision = false;
        for (let obs of obstacles) {
            if (obs.isLine) {
                if (obs.yLine !== undefined && Math.abs(cand.y - obs.yLine) < (obs.thickness + rad)) { collision = obs.name; }
                if (obs.xLine !== undefined && Math.abs(cand.x - obs.xLine) < (obs.thickness + rad)) { collision = obs.name; }
            } else {
                let reqGap = 0;
                if (obs.name !== 'Academy' && !obs.name.startsWith('Forest')) reqGap = 300;
                if (dist(cand, obs) < (obs.radius + rad + reqGap)) { collision = obs.name; }
            }
            if (collision) break;
        }
        if (!collision) {
            console.log(`Found ${name} at d=${d}, angleOff=0`);
            return cand;
        }
    }
    return null;
};

// Library: North-West (-3*Math.PI/4)
let lib = findSafePlacement('Lib', 900, 2000, -3*Math.PI/4, 250);
if(lib) obstacles.push({name: 'Lib', x: lib.x, y: lib.y, radius: 250});

// Temple: South-East (Math.PI/4) - 45 deg
let temple = findSafePlacement('Temple', 900, 2000, Math.PI/4, 200);
if(temple) obstacles.push({name: 'Temple', x: temple.x, y: temple.y, radius: 200});

// Dorm A: South-West (5*Math.PI/8) - 112.5 deg
let dormA = findSafePlacement('DormA', 900, 2000, 5*Math.PI/8, 150);
if(dormA) obstacles.push({name: 'DormA', x: dormA.x, y: dormA.y, radius: 150});

// Dorm B: South-East (3*Math.PI/16) - 33.75 deg
let dormB = findSafePlacement('DormB', 900, 2000, 3*Math.PI/16, 150);
if(dormB) obstacles.push({name: 'DormB', x: dormB.x, y: dormB.y, radius: 150});

console.log('Library: ', lib, ' Dist: ', lib ? Math.round(dist(lib, logicAnchors.academy)) : 'null');
console.log('Temple: ', temple, ' Dist: ', temple ? Math.round(dist(temple, logicAnchors.academy)) : 'null');
console.log('DormA: ', dormA, ' Dist: ', dormA ? Math.round(dist(dormA, logicAnchors.academy)) : 'null');
console.log('DormB: ', dormB, ' DOnepist: ', dormB ? Math.round(dist(dormB, logicAnchors.academy)) : 'null');
