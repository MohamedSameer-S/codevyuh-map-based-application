# MAP ARCHITECTURE AUDIT

This document evaluates the current CodeVyuh map rendering architecture against the goals established in `MAP_ART_DIRECTION.md`.

## 1. Systems Supporting the Art Direction

*   **Z-Sorting / Layering Engine:** The `renderQueue` system in `TerrainGenerator.js` successfully allows for precise back-to-front rendering (`y` coordinate sorting). This directly supports the 2.5D top-down illusion and the strict layering rules.
*   **Camera Constraints:** `CameraController.js` already effectively handles bounding-box panning and bounded zoom levels without 3D rotation, fulfilling the "Camera and View Rules".
*   **Territory Boundaries:** The `territoryPolygons` and robust ray-casting `isPointInPolygon` logic provide a strong mathematical foundation for maintaining Region Identity.
*   **Decoupled Engine:** `WorldEngine.js` cleanly separates interaction logic (`RegionManager`) from visual rendering (`TerrainGenerator`), allowing visual overhauls without breaking game mechanics.

## 2. Systems Fighting the Art Direction

*   **Randomized Placement Over Design:** Functions like `generateEcology()`, `generateRivers()`, and `generateRoads()` are fundamentally built on RNG (`Math.random()`, noise functions, and random offsets). This directly opposes the rule "Props must belong to scene clusters, not random scatter".
*   **Line-Based Rivers:** `generateRivers()` draws rivers as basic SVG `<path>` strokes on top of the terrain. This violates the rule: "Rivers must shape the land, not look like lines drawn on top." They look like blue ink lines rather than geological features.
*   **Component-Based Nature:** Trees and mountains are drawn by looping over identical helper functions (`drawMountain()`, `drawTreeGroup()`) hundreds of times. This creates the forbidden "isolated repeated icons" look instead of unified "connected ranges" or "canopy masses".
*   **Monolithic God Object:** `TerrainGenerator.js` is over 1400 lines long and handles everything from island generation to drawing tiny gears. It is difficult to art-direct a single region without affecting the entire map pipeline.

## 3. Systems That Are Too Random, Scattered, Small, or Isolated

*   **Ecosystem Prop Spawning:** Even with the Phase 4G updates, `renderEcosystemZone` uses a `trySpawn` loop with random radial offsets (`offsetX: randomOffset(radius)`). This guarantees that scenes will always look somewhat haphazard rather than carefully authored.
*   **Mountain Ridges:** The `generateMountainRidges` function calculates splines and scatters individual mountain SVGs along them. They do not blend together to form a cohesive range.
*   **Light Filler Rework:** The fallback loop that scatters 17 random prop clusters across the map is the literal definition of random scatter and causes isolated dots.
*   **Roads:** Current road generation calculates basic splines from the center to the edges, ignoring terrain topography and regional logic. They "stab directly into centers".

## 4. Files That Should Be Modified Later

*   `client/js/world/TerrainGenerator.js`: This file requires a massive paradigm shift. It must stop using loops with random offsets and instead rely on composed, unified SVG paths (e.g., a single large SVG path for a forest canopy, a polygon for a river basin).
*   *(Recommended Architecture Change)*: `TerrainGenerator.js` should ideally be split or refactored so that each region's visuals (e.g., `renderLogicDominion`, `renderDebugWasteland`) can be authored and maintained as separate logical blocks or classes.

## 5. Files That Should NOT Be Touched

*   `client/js/world/CameraController.js`: The camera rules are already met.
*   `client/js/world/RegionManager.js`: UI logic, clicking, and unlocking work perfectly.
*   `client/js/ui/Tooltip.js`: Overlay UI is not part of the terrain ecosystem.
*   `client/js/world/WorldEngine.js`: The core orchestration loop works well.

## 6. Recommended Next Step: The Vertical Slice Strategy

**Do not attempt to fix all regions at once.**

The recommended next step is to build a **High-Quality Vertical Slice of the Logic Dominion**.
1.  **Isolate Logic Dominion:** Strip out the randomized trees, simple rivers, and scatter props specifically for the Logic Dominion territory.
2.  **Canopy Masses & River Polygons:** Implement a true SVG canopy mass for the forest (one continuous blobular path with highlight/shadow layers) and a true river polygon that cuts through the land mass.
3.  **Fixed Composition:** Hand-author the exact `x, y` coordinates for the Academy village, bridges, and temples without any `window.rng.next()` randomization.
4.  **Acceptance Test:** Validate this single region against the `Visual Acceptance Checklist` (e.g., readability at default zoom, beautiful terrain shapes).
5.  **Expand:** Once the visual pipeline for Logic Dominion is perfected and approved, apply the same unified-rendering architecture to Debug, Systems, and Python.
