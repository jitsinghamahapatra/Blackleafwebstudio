# Implementation Plan - Admin Panel Expansion, Portfolio Rename, Loader Optimization & Build Configuration

We will expand the admin dashboard to enable full-page editing and image uploads, rename all references of "Portfolio" to "Work", optimize the DB connection loading screen to fade out immediately upon connection, and include all subpages in the production build.

## Proposed Changes

### 1. Server-Side Image Uploads & Static Routes
#### [MODIFY] [`server.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js)
- Import `fs` module to handle filesystem writes.
- Serve uploaded files statically at route `/uploads` from the local `public/uploads/` directory.
- Add an authenticated admin route `POST /api/upload` that decodes base64 data URLs, saves them as image files inside `public/uploads/`, and returns the static URL `/uploads/upload_timestamp.extension`.

### 2. Build Configuration & Page Inclusion
#### [MODIFY] [`vite.config.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/vite.config.js)
- Update `rollupOptions.input` to compile `privacy.html`, `terms.html`, and `refund.html` into the production `dist` directory.
- Rename the input entry `portfolio: 'portfolio.html'` to `work: 'work.html'`.

### 3. File Renaming (Portfolio to Work)
- Rename `portfolio.html` to `work.html` and `portfolio.js` to `work.js`.
- Recreate the portfolio content under `work.html` and `work.js` with all text/titles changed from "Portfolio" to "Work".
- Set the data loading key to `page-work` instead of `page-portfolio`.

### 4. Navigation & Footer Updates
#### [MODIFY] Navigation Links in All Pages
- Update footer and header links from `portfolio.html` to `work.html` and labels from "Portfolio" to "Work" in:
  - [`index.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/index.html)
  - [`services.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/services.html)
  - [`contact.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.html)
  - [`profile.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/profile.html)
  - [`privacy.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/privacy.html)
  - [`terms.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/terms.html)
  - [`refund.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/refund.html)
  - [`admin.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.html)
- Ensure all footers have the `Socials` column block with elements matching IDs `social-linkedin` and `social-github`.

### 5. Admin Dashboard Features
#### [MODIFY] [`admin.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.html)
- Add upload file inputs next to the image URL fields in:
  - Hero Content form
  - Pricing Packages form
  - Recent Works form
- Add a new option `<option value="socials">Social Links</option>` to the page selector dropdown under the "Edit Pages" tab.
- Rename "Portfolio Page" option to "Work Page" (value `page-work`).
#### [MODIFY] [`admin.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.js)
- Add a global event listener to handle file selection, convert it to base64, send it to `POST /api/upload`, and set the returned URL to the respective form input.
- Customize the page selector change handler so that when `socials` is selected, the page form inputs adapt to LinkedIn URL (Title) and GitHub URL (Content) with updated label names.
- Update references of `page-portfolio` to `page-work`.

### 6. Loader Speed & Smooth Zoom Animations
#### [MODIFY] [`db-check.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/db-check.js)
- Add a dynamic `loadSocialLinks` function that fetches `/api/content/socials` and populates the links in the footer.
- Trigger `loadSocialLinks` automatically in `hideLoadingScreen()`.
#### [MODIFY] [`style.css`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/style.css)
- Add smooth transitions (`transform` and `opacity` over `0.5s`) to `.loading-overlay`.
- Apply a slight zoom-out/fade-out animation (`transform: scale(1.05); opacity: 0;`) to `.loading-overlay.fade-out` for a premium transition effect.
#### [MODIFY] Init Methods in Page Scripts
- In [`app.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/app.js), [`services.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/services.js), [`work.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/work.js), [`contact.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.js), [`profile.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/profile.js), and [`policy.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/policy.js):
  - Call `hideLoadingScreen()` immediately after `checkDB()` returns `true` so the loader disappears instantly.
  - Load the page content concurrently (using parallel promises or async processes) so the page visual layout is interactive immediately.

---

## Verification Plan

### Automated Build Verification
- Run `npm run build` to confirm all html pages compile successfully and exist in `dist/`.

### Manual Testing
- **Loader Speed**: Open the homepage and subpages, verify the loader dismisses immediately once connected, fading out with a smooth zoom transition.
- **Image Uploader**: Open Admin Panel, upload an image in Hero Content, verify the URL is auto-filled (e.g. `/uploads/upload_...png`) and saves correctly.
- **Edit Pages & Socials**: Change the Services page content and the Social links. Confirm the updates appear on the frontend footer and Services page in real-time.
- **Work Page**: Open the new `work.html` page and verify it renders portfolio projects under the "Work" naming system.
