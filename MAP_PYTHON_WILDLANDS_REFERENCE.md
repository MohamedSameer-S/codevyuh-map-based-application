# MAP PYTHON WILDLANDS REFERENCE

This document establishes the approved visual architecture for the Python Wildlands ecosystem vertical slice (V1), defining the standards that must be preserved and reused across the map.

## 1. Approved Python Wildlands V1 Approach

### What Made the Scene Better
The previous iteration relied on random scatter, creating an unreadable visual noise composed of tiny green dots across the territory. The new approach replaced the scatter with a massive, hand-authored ecosystem slice. By using a 2000px wide mossy stone terrace as a base, massive dense canopy clusters framing the borders, a winding organic stream, and highly readable ruins, the territory instantly communicates a cohesive ancient jungle civilization rather than a flat green map icon.

### Visual Principles to Reuse
* **Temple as Focal Landmark:** The central temple remains perfectly visible and unobstructed, anchoring the entire region.
* **Mossy Jungle Foundation:** An organic, cracked stone terrace (`rL = 1000px`) using muted greys and deep moss greens grounds the temple.
* **Grouped Canopy Masses:** Instead of scattered tiny trees, huge overlapping dark green canopy clusters frame the outer boundaries.
* **Controlled Jungle Density:** The jungle feels dense but strictly contained to perimeter framing.
* **Organic Water/Stream Detail:** The water feature uses sweeping curves, darker banks, and bright dashed ripples to feel organic.
* **Ruins/Shrines/Stone Paths:** Ancient mossy shrines, broken pillars, and cracked stone paths support the civilization's story at a highly readable scale (18-24).
* **Deterministic Authored Placement:** Coordinate-based anchoring (`rootX`, `rootY`) ensures perfect spacing and composition.
* **No Tiny Random Scatter:** Tiny, unreadable props are completely banned.

### Implementation Patterns to Preserve
* **Dedicated Vertical Slice Function:** `renderPythonWildlandsVerticalSlice` handles perfect Z-sorting for all ecosystem elements.
* **Label Adjustments:** `labelOffsetY: 1000` is used to gracefully drop the territory label below the heavy southern stream and canopy mass.
* **Isolated Disabling of Scatter:** Old random generation is gracefully turned off (`clusterTargets.python = 0`) to avoid contaminating the vertical slice.
* **Unlocked Clarity:** Because Python is unlocked, no fog rendering occurs, allowing its complex ecosystem to shine without interference.

### Mistakes That Must Not Be Repeated
* **Covering the Temple:** Never place canopy masses directly over the central focal landmark.
* **Thin Water Lines:** Never draw rivers or streams as thin, hard-edged geometric lines.
* **Cluttering the Jungle:** Never scatter hundreds of tiny trees; stick to 3-5 massive canopy shapes.
* **Ocean Label Collisions:** Never push `labelOffsetY` so far that the text renders out in the ocean map border.
* **Cross-Contamination:** Never edit or refactor multiple region slices at the same time. Maintain strict isolation.
