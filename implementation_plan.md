# Implementation Plan - Cohesive Dragging & Mobile Image Hiding

We will finalize the spider interaction physics and mobile layout:
1. **Fix Spider Drag Lag (Physics Pullback)**: Keep the dragged spider body exactly at the cursor position by overriding its coordinate after constraints relaxation, preventing constraints from pulling it back and making it feel locked or unmovable.
2. **Robust Selection & Coordinate Mapping**: Robustly search for the spider composite dynamically (checking for the `.thorax` property) and safeguard the canvas size ratios against division-by-zero to prevent NaN coords.
3. **Hide Hero Image on Mobile**: Hide the developer image container (`.hero-image`) entirely on mobile screens (viewport width <= 512px) using CSS.

## Proposed Changes

### CSS Layout

#### [MODIFY] [style.css](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/style.css)
- Inside the `@media screen and (max-width: 512px)` media query, update `.hero-image` styling to `display: none;`. This hides the developer image and offset border on mobile layouts.

### JavaScript Physics & Grab logic

#### [MODIFY] [spider-canvas.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/spider-canvas.js)
- **Override Position After Physics**:
  - In the animation `loop` runner, set `sim.draggedEntity.pos.mutableSet(sim.mouse)` *after* calling `sim.frame(16)` and *before* `sim.draw()`. This ensures the dragged spider follows the cursor perfectly.
- **Robust Spider Detection**:
  - In `sim.nearestEntity`, search the composites array dynamically for the one containing `.thorax`, avoiding hardcoded array indexes.
- **Coordinate Safeguards**:
  - Update pointer and touch event handlers to safeguard against `rect.width === 0` or `rect.height === 0` to prevent coordinates from turning into `NaN`.

## Verification Plan

### Manual Verification
1. Load the page on desktop and drag the spider from any leg/body part. Verify it follows the cursor cleanly without lag or lockup.
2. Resize the browser to a mobile layout (width <= 512px) and verify the developer image container disappears.
3. Verify that scrolling the page on mobile works by dragging on empty space, and the spider remains draggable.
