# Implementation Plan - Dynamic Pages, Admin Content Editors & DB Status Loading Screen

We will add Terms & Conditions, Privacy Policy, and Refund Policy pages, make them editable in the Admin panel, and integrate a database connection loading screen across all live pages.

## User Review Required

> [!NOTE]
> - **Fallback Default Texts**: If the DB has no values for Terms, Privacy, or Refund policies, the system will automatically show formatted, legal-ready fallback contents. When the admin edits and saves them, it will populate in the MongoDB collection and update dynamically.
> - **Database Failure Screen**: If MongoDB is down or disconnected, a full-screen block displays: "Error: Database connection failed. Please reload the page." with a prominent, styled retry button.

## Proposed Changes

### Database & Server

#### [MODIFY] [server.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js)
- Add the `GET /api/db-status` endpoint that checks `mongoose.connection.readyState === 1` and returns `{ connected: true/false }`.
- Ensure Content schema routes `POST /api/content/:key` allow saving page contents dynamically.

### CSS Styling

#### [MODIFY] [style.css](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/style.css)
- Implement rules for the dynamic `.loading-overlay` blocking screen, loading spinners, leaf icons, and custom `.btn-retry` styling.
- Style `.policy-wrapper` and `.policy-content` blocks for nice readable headings and paragraph heights.

### Shared Frontend Utilities

#### [NEW] [db-check.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/db-check.js)
- Define `checkDB()`: queries `/api/db-status`. If disconnected or fetch fails, displays the error state and reload button.
- Define `hideLoadingScreen()`: adds the `.fade-out` class to hide the screen once page setup and DB calls are done.

#### [NEW] [policy.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/policy.js)
- Handles dynamic page text loading for the three policy subpages by parsing the current filename (`terms.html`, `privacy.html`, `refund.html`) and calling the backend `/api/content/:key` endpoint. Falls back to default HTML policies if the DB is unpopulated.

### Dynamic Policy Pages

#### [NEW] [terms.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/terms.html)
- Standard navbar + footer, database loading screen overlay, content text container, importing `app.js` and `policy.js`.

#### [NEW] [privacy.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/privacy.html)
- Dynamic Privacy Policy layout.

#### [NEW] [refund.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/refund.html)
- Dynamic Refund Policy layout.

### Admin Dashboard Content Editors

#### [MODIFY] [admin.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.html)
- Add `<li class="nav-item" data-target="tab-pages">` to Sidebar, and `mobile-tab` to Mobile Tab bar.
- Add `<section id="tab-pages" class="tab-pane">` containing page selector dropdown, input for title, and textarea for rich policy body text.
- Insert the standard DB loading screen div inside the body.

#### [MODIFY] [admin.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.js)
- Run `checkDB` and `hideLoadingScreen` on initialization.
- Implement selection change listeners for `adminPageSelect` to fetch corresponding policy contents.
- Implement form submission listeners for `adminPageForm` to POST title/description changes to the database.

### Public Subpages

#### [MODIFY] [index.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/index.html)
#### [MODIFY] [services.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/services.html)
#### [MODIFY] [portfolio.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/portfolio.html)
#### [MODIFY] [contact.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.html)
#### [MODIFY] [profile.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/profile.html)
- Add the DB loading screen markup right after the opening `<body>` tag.
- Update footer `Legal` links to direct to `privacy.html`, `terms.html`, and `refund.html`.

#### [MODIFY] [app.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/app.js)
#### [MODIFY] [services.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/services.js)
#### [MODIFY] [portfolio.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/portfolio.js)
#### [MODIFY] [contact.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.js)
#### [MODIFY] [profile.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/profile.js)
- Import `checkDB` and `hideLoadingScreen` from `./db-check.js`.
- Prevent execution at the top of `init()` if `checkDB()` returns false.
- Trigger `hideLoadingScreen()` at the end of the `init()` sequence.

## Verification Plan

### Automated/Staging Tests
- Run database connection check: stop local MongoDB server and load the site. Verify the error loading screen is displayed with the retry button.
- Start MongoDB server. Verify that the loading screen fades out immediately.
- Test editing in Admin: change Terms & Conditions, click Save, and verify the live `terms.html` page updates in real-time.
