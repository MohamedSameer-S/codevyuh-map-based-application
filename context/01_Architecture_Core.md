# Architecture & Rendering Constraints

## 1. Zero-Asset Policy
No external assets (PNG, JPEG, WebP, SVG files) may be loaded. Every single visual element must be constructed procedurally via Javascript DOM manipulation in the `<svg>` namespace.

## 2. Global Z-Axis Projection (2.5D)
The entire world operates on a flat 2D SVG canvas that is visually projected into 2.5D.
- **The World Matrix**: The `worldGroup` MUST maintain a CSS transform of `scaleY(0.6)`. This compresses the Y-axis mathematically, creating the "drone view" tilt without breaking standard 2D mouse-hitbox coordinates.
- **The Inverse Matrix**: Any object that possesses physical height (Mountains, Landmarks, Trees, Text) MUST be injected with an inline SVG transform of `scale(1, 1.666)`. `1.666` is the exact inverse of `0.6` ($1 / 0.6 = 1.666$). This mathematically cancels the world squash, causing the object to stand perfectly vertical relative to the screen.

## 3. DOM Recycling Limit
To maintain 60fps on low-end machines, the total active DOM node count within the `<svg>` must not exceed `3,000`. 
- Implementation of the `SVG ViewBox Culling` algorithm is mandatory when region counts exceed 15.
- Off-screen objects must be detached from the DOM and held in the `GlobalStore` cache.

## 4. Pathfinding Boundaries
A* routing algorithms for rivers and roads must read the virtual collision grid stored in the `GlobalStore`. 
- **Region Hitboxes**: Cost = $\infty$ (Impassable)
- **Highlands**: Cost = $5$ (Difficult terrain)
- **Plains**: Cost = $1$ (Ideal routing)
