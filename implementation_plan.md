# Implementation Plan - CircularGallery Integration & Spider Line Interactions

We will integrate the React Bits `<CircularGallery />` component into the work/portfolio page (`work.html`), replacing the static projects grid. Additionally, we will add matching dashed borders to the bottom of the navbar and the bottom of the hero section, and update `spider-canvas.js` to allow the spider to land and stand on the new bottom dashed border.

## Proposed Changes

### 1. Project Dependencies
- Install the `ogl` library required by `CircularGallery`.
  - Command: `npm install ogl`

### 2. CircularGallery React Component
#### [NEW] [CircularGallery.jsx](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/src/components/CircularGallery.jsx)
- Implement the `<CircularGallery />` WebGL carousel component.
- Add mouse click/touch tap detection that maps viewport coordinates to check plane intersections, allowing users to click/tap a card to open its respective project link in a new tab.
- Modify event listeners to bind `wheel` and `mousedown`/`touchstart` to the gallery container instead of `window`. This allows normal vertical scrolling on other parts of the page, while scrolling inside the gallery controls it horizontally.

#### [NEW] [CircularGallery.css](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/src/components/CircularGallery.css)
- Implement the styles for the gallery wrapper and hover states.

### 3. Work Gallery Integration
#### [NEW] [work-gallery.jsx](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/src/work-gallery.jsx)
- Create a React entry point that fetches projects from `/api/projects`.
- Implement category filters (`all`, `landing`, `corporate`, `ecommerce`) with the styling from `style.css`.
- Render the `<CircularGallery />` populated with the filtered projects.

#### [MODIFY] [work.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/work.html)
- Replace the static HTML filter buttons and projects grid with `<div id="work-gallery-root"></div>`.
- Include `<script type="module" src="/src/work-gallery.jsx"></script>` to mount the React gallery.

#### [MODIFY] [work.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/work.js)
- Comment out the call to `loadProjects()` in `init()`, as projects are now fetched and rendered by the React component.

### 4. Dashed Lines Style & Spider Interaction
#### [MODIFY] [style.css](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/style.css)
- Add `border-bottom: 3px dashed var(--ink-blue);` to the `nav` selector.
- Add `border-bottom: 3px dashed var(--ink-blue);` to the `.hero` selector.

#### [MODIFY] [spider-canvas.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/spider-canvas.js)
- Add a row of pinned particles along the bottom of the canvas (`y = height - 12`) to the `spiderweb` composite.
- Adjust the `resize` listener to dynamically reposition the bottom pinned particles when the viewport size changes.
- Update `spiderweb.drawParticles` to skip drawing dots for the bottom physics line particles, keeping them invisible.
- The spider will now automatically find the bottom pinned particles and attach its legs to them when dragged or crawling near the bottom, landing perfectly on the dashed border line.

---

## Verification Plan

### Automated Verification
- Run `npm run build` to verify the React bundles and CSS compile without errors.

### Manual Verification
- **Dashed Lines**: Verify that a dashed line appears at the bottom of the navbar and at the bottom of the hero section.
- **Spider Interaction**: Open the homepage, drag the spider to the bottom border line, and verify that it lands and stands on the dashed line with its legs attached. Resize the screen and verify the line and spider behavior scale correctly.
- **CircularGallery**: Open the recent works page (`work.html`), verify the projects load in a 3D curved gallery, scroll it using mouse wheel/drag, filter by categories, and click a project card to verify it opens the project link in a new tab.

