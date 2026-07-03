# MAP SYSTEMS REPUBLIC REFERENCE

This document establishes the approved visual architecture for the Systems Republic ecosystem vertical slice (V1), defining the standards that must be preserved and reused across the map.

## 1. Approved Systems Republic V1 Approach

### What Made the Scene Better
The previous random-scatter approach failed because tiny, disconnected SVG machinery icons were unreadable and lacked context at default zoom. The new approach succeeds by using a massive, hand-authored, geometrically structured industrial platform (`2000px` wide) that acts as a cohesive foundation. Machinery is clustered intentionally at the perimeters, framing the central focus area. The lock cloud scale was explicitly reduced to allow the outer edges of the industrial zone to be fully visible, clearly communicating the region's identity even while locked.

### Visual Principles to Reuse
* **Focal Point Preservation:** The factory/cloud area is preserved as the central focal point.
* **Structural Foundation:** A strong, dark metallic/industrial base sits underneath the landmark to ground it.
* **Controlled Cloud Overrides:** Smaller, per-region cloud scales (`cloudScale` override) are used to pull the fog back just enough to reveal the ecosystem edges.
* **Visible Perimeters:** Machinery is intentionally placed around the cloud perimeter to be clearly visible.
* **Color Language:** Steel, concrete, dark grating, and amber/orange glowing accents define the technological aesthetic.
* **Intentional Grouping:** Pipes, gears, and tanks are grouped into massive infrastructure clusters (e.g., Gear Yard, Tank Farm) rather than scattered individually.
* **Deterministic Placement:** Authored, coordinate-based placement (`rootX`, `rootY`) guarantees perfect composition.
* **No Random Scatter:** Tiny scattered props are explicitly avoided.

### Implementation Patterns to Reuse
* **Per-Region Cloud Support:** `FogManager.js` supports a `cloudScale` multiplier to safely resize lock clouds per region.
* **Label Adjustments:** `labelOffsetY` in `regions.config.js` is used to push text away from heavy visual elements safely.
* **Authored Vertical Slices:** A dedicated rendering function (`renderSystemsRepublicVerticalSlice`) handles the exact SVG generation and Z-sorting pushes (`renderQueue`).
* **Controlled Visibility:** The lock cloud overlay is respected, but the ecosystem is framed around it rather than buried underneath it.

### Mistakes That Must Not Be Repeated
* **Cloud Dominance:** Never let the white lock cloud swallow the entire ecosystem platform.
* **Tiny Scale:** Never make machinery too small to be read clearly at default zoom.
* **Neon Cables:** Pipes must look like heavy infrastructure with dark outlines, not thin, bright neon lines.
* **Terrain Mismatch:** The industrial base must look like engineered steel grating, not organic cracked Debug terrain.
* **Endless Un-Diagnosed Scaling:** Never blindly enlarge machinery without first diagnosing Z-sorting or fog layer overlaps.
* **Cross-Contamination:** Never change multiple region slices simultaneously; work strictly in isolated vertical slices.

---

# Python Wildlands Vertical Slice Planning

**Goal:** Transform the Python Wildlands from a basic green temple icon into a rich, dense jungle/ancient-temple ecosystem using the established vertical slice methodology.

### 1. Main Jungle Temple Focal Area
The central `rootX`, `rootY` will serve as the anchor for the existing Temple landmark, ensuring it remains the primary focal point of the region.

### 2. Ancient Mossy Stone Foundation
A broad, organic stone terrace will serve as the foundation beneath the temple. It will use muted greys and deep mossy greens, broken by cracked paving lines to suggest ancient architecture rather than a sheer metal or perfectly flat base.

### 3. Dense Jungle Canopy Masses
Using the canopy blob generators perfected in Logic Dominion, we will frame the temple with massive, overlapping dark green canopy clusters. These will sit at the outer perimeters (e.g., `±800px`), framing the temple without blocking it.

### 4. Water Integration
A stylized stream or small pond will wrap around or emerge from beneath the stone foundation, utilizing the `createVerticalSliceCanopy` techniques to shape organic water banks in vibrant teal/cyan, contrasting with the dark jungle floor.

### 5. Vine-Covered Ruins and Stone Paths
Paths will lead up to the temple from the outer perimeter, flanked by half-buried, vine-covered stone blocks. 

### 6. Ancient Shrines & Broken Pillars
At the perimeter clusters (acting as counterparts to Systems' Gear Yards), we will place small auxiliary shrines, broken stone arches, and fallen pillars, scaled to be clearly readable (Scale 20-24).

### 7. Readable Nature Accents
Wildlife/nature accents (e.g., giant stylized fern clusters or glowing flora) will be used sparingly as hero elements, completely avoiding tiny, cluttered scatter.

### 8. Label Positioning
The `labelOffsetY` will be reviewed. If the jungle canopy pushes too far north or south, the label will be adjusted to sit cleanly in the negative space.

### 9. Unlocked Visibility Rule
Because Python Wildlands is currently configured as `locked: false` in `regions.config.js`, no lock cloud will be generated. The entire ancient ecosystem will be cleanly visible from the start.

### 10. Default Zoom Readability
Following the Systems Republic fix, the base footprint will be wide enough (e.g., 1000px radius) to ensure all elements (paths, pools, canopy clusters) are massive and recognizable at default zoom without overlapping the central road system.

### Files Required for Implementation
*   `client/js/world/TerrainGenerator.js` (To add `renderPythonWildlandsVerticalSlice()`, foundation generators, and ruin/canopy helpers).
*   `client/js/config/regions.config.js` (To adjust `labelOffsetY` if the new scene blocks the label).
