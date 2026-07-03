# Debug Wasteland V1 Reference

This document captures the visual principles, implementation patterns, and lessons learned from the successful "Debug Wasteland V1 Vertical Slice" implementation. It serves as the standard blueprint for handling corrupted, dangerous, or locked regions.

## 1. Why V1 Succeeded Over Random-Scatter
The scene transitioned from a messy scattering of tiny crystals to a compelling, broken civilization because:
- **Exact Landmark Anchoring:** Instead of using the geometric center of the voronoi territory (which caused extreme horizontal drift), the entire scene was strictly anchored to the specific coordinates of the main landmark (`6076, -742`).
- **Composed Danger:** Massive, jagged perimeter crystal fields and radiating organic fissures communicate danger much better than a single bright magenta slab or tiny sprinkled dots.
- **Cloud Compatibility:** By keeping the center flat under the tower and pushing crystals to the edges, the white UI lock cloud was preserved cleanly while the corrupted ecosystem identity subtly peaked out from underneath.

## 2. Visual Principles to Reuse
- **Corrupted Focal Landmark Area:** The main tower must have an explicitly ruined or corrupted footprint to ground it.
- **Dark Cracked Terrain Foundation:** Use deep, bruised colors (`#311b92`, `#1a1a1a`) with a multiply blend to visually poison the grass, rather than solid blocks of neon.
- **Grouped Crystal Fields:** Replace random crystal scatter with dense, authored clusters of massive jagged crystals (Scale 14.0 - 20.0) emerging like geological teeth from the perimeter.
- **Jagged Fissures Instead of Straight Neon Lines:** Corruption scars should radiate organically and use heavily dark, scorched rims with only a small (e.g., 40px) glowing neon core.
- **Ruined Base/Courtyard Under the Tower:** Provide a base layer (shattered isometric stone) so the tower does not float.
- **Lock Cloud Preserved and Readable:** Always ensure the vertical slice layers behind the UI, keeping the center clean enough that lock statuses remain highly readable.
- **Deterministic Authored Placement:** Explicit `rootX, rootY` anchoring to the landmark coordinates.
- **No Random Tiny Scatter:** Discard all micro-details (e.g., `clusterTargets.debug = 0`) that vanish or look like noise at default zoom.

## 3. Implementation Patterns
- **Explicit Hardcoded Anchors:** Use the exact `x, y` from `regions.config.js` for the root coordinates, ignoring `bounds.cx/cy`.
- **Radiating Paths:** To draw cracks or fissures, create helper functions (`drawFissure`) that stack a thick dark stroke under a medium purple stroke, capped with a thin glowing core stroke (`blur`).
- **Shadow Blending:** Use `<ellipse>` nodes with `filter="blur(20px)"` and `rgba(0,0,0,0.5)` to ground massive ruin foundations into the poisoned terrain patch.
- **Stylized Ruins:** Author specific destroyed secondary structures (shattered domes, collapsed walls) rather than generic rubble.

## 4. Mistakes to Never Repeat
- **Placing the Scene Using Broad Territory Center:** Using `bounds.cx` can cause the scene to misalign by hundreds of pixels if the territory polygon is oddly shaped.
- **Giant Magenta Platform/Slab:** Using bright neon for the entire floor makes it look like an artificial sci-fi UI element, not corrupted land.
- **One Huge Crystal Pile:** Stacking all crystals in the dead center destroys readability and obscures the tower.
- **Crystals Aggressively Piercing the Cloud:** Overly tall elements in the direct center will visually destroy the white lock cloud.
- **Disconnected Ecosystem:** Building the ruin too far away from the actual landmark tower.
- **Changing Multiple Regions at Once:** Stay focused on one isolated Vertical Slice function at a time.

---

# Systems Republic Vertical Slice Planning

## Goal
Transform the Systems Republic from a generic factory icon into a **dense, engineering and industrial civilization ecosystem**. It should feel like a heavily mechanical, gear-driven district.

## Planned Elements
1. **Main Factory/Power-Plant Focal Area:** The main Landmark will act as the central engineering hub. We will construct a heavy industrial foundation around it.
2. **Industrial Foundation/Platform:** A massive metallic/concrete geometric base layer (e.g., intersecting octagons or heavy grates) anchoring the factory to the coastal/plains terrain.
3. **Pipe Network / Energy Conduits:** Instead of water rivers or organic dirt paths, thick metal pipes with glowing orange/blue joints running through the territory.
4. **Railway or Mechanical Road:** The connection toward Logic Dominion will be a heavy paved/metal-plated road or rail line, distinct from Logic's smooth stone.
5. **Gear Yard / Machinery Clusters:** Replace generic cluster generation with grouped yards of massive gears, tanks, and structural pylons.
6. **Subtle Smoke/Steam Accents:** Soft, blurred white/grey overlapping circles (`opacity: 0.2`) grouped above certain secondary buildings to imply active machinery, keeping it clean and SVG-based.
7. **Small Industrial Buildings:** Author specific geometric secondary structures (e.g., cooling towers, warehouses, silos) around the main factory.
8. **Energy Core / Dam:** Since Systems Republic is coastal, integrating a hydro-dam edge or glowing power node where the land meets the water.
9. **Label Offset:** Apply a custom `labelOffsetY` to ensure the banner does not obscure the sprawling industrial base.
10. **Scale Legibility:** All elements (pipes, gears, silos) must be scaled massively (e.g., 1800px foundation, 150px thick pipes) to be immediately readable at default zoom.
