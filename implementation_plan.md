# Implementation Plan - Redesign & System Updates

This plan outlines the changes required to satisfy the design and system updates requested for Blackleaf Studio.

## Proposed Changes

---

### 1. Database & Server Core

#### [MODIFY] [`Request.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/models/Request.js)
- Update the `Request` schema:
  - Add `paymentStatus` field with enum `['Not Paid', 'Paid']`, defaulting to `'Not Paid'`.
  - Add `'Delivered'` to the `status` enum list.

#### [MODIFY] [`server.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js)
- Update the PUT `/api/orders/:id` route to support updating the `paymentStatus` field.
- Redesign the GET `/api/orders/track/:id` tracking query to be string-safe and support both 24-character full `_id` inputs and 8-character partial ID inputs using MongoDB `$expr` string matching.

---

### 2. Styling Accent Update

#### [MODIFY] [`style.css`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/style.css)
- Change `--accent-pink` globally to `#ff758f` (a more vibrant and premium pink color).

---

### 3. Theme Settings Removal

#### [MODIFY] [`admin.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.html)
- Remove the "Theme Settings" tab selector from the sidebar (`.sidebar .nav-list`).
- Remove the "Theme Settings" tab selector from the mobile navigation (`.mobile-tabs`).
- Delete the `<section id="tab-settings" class="tab-pane">` containing the color picker form.

#### [MODIFY] [`admin.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.js)
- Remove `loadThemeSettingsAdmin()` call on page load.
- Delete the `loadThemeSettingsAdmin` function and color picker event handlers.

#### [MODIFY] [HTML Pages] (index, services, contact, portfolio, profile, admin)
- Remove the dynamic `loadThemeSettings` block in the `<head>` of all pages so they rely strictly on static CSS colors.

---

### 4. Admin Requests Panel Updates

#### [MODIFY] [`admin.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.html)
- Add a new "Payment" header column to the Web Requests table (`<thead>`).

#### [MODIFY] [`admin.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.js)
- Update `loadOrders()` to render a `select` dropdown for Payment Status ("Paid" / "Not Paid") for both desktop rows and mobile cards.
- Add `'Delivered'` as an option in the Status dropdown.
- Implement the `updateOrderPaymentStatus()` handler.

---

### 5. Client Dashboard & Stepper Updates

#### [MODIFY] [`profile.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/profile.js)
- Remove the "Download Invoice" button from the requests list item template.
- Remove the click event listener wiring for `.btn-download-invoice`.
- Update the progress stepper step mapping to support 6 steps (including "Delivered").

#### [MODIFY] [`services.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/services.js)
#### [MODIFY] [`portfolio.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/portfolio.js)
#### [MODIFY] [`contact.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.js)
#### [MODIFY] [`app.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/app.js)
- Update the Track Order progress stepper mappings to support 6 steps (including "Delivered").

---

### 6. Invoice PDF Redesign

#### [MODIFY] [`index.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/index.html)
#### [MODIFY] [`services.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/services.html)
#### [MODIFY] [`profile.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/profile.html)
- Redesign the `window.downloadInvoicePDF` function:
  - Remove the website link `"https://blackleaf.web.app"`.
  - Fix the solid black block by explicitly setting fill color to white (`255, 255, 255`) before rendering the metadata box.
  - Set the header fill color to the new static pink (`255, 117, 143` corresponding to `#ff758f`).
  - Update the "TOTAL DUE AMOUNT:" text to "TOTAL AMOUNT:".
  - Change the total box fill color to a light pink shade `#fff0f3` (`255, 240, 243`).
  - Standardize fonts to Courier.

---

## Verification Plan

### Automated Verification
- Verify database connection and check if server boots up correctly using `npm run dev`.
- Ensure there are no runtime compilation/linting errors.

### Manual Verification
1. **Invoice Download**: Submit a new request on the Services page. Verify that it auto-downloads a redesigned PDF with a pink header, white metadata box (no black block), no website link, and "TOTAL AMOUNT:".
2. **Dashboard Requests**: Log into the Client Dashboard. Verify that:
   - There is NO "Download Invoice" button under the requests.
   - The status stepper shows up to 6 steps if status is "Delivered".
3. **Admin Panel**:
   - Verify the "Theme Settings" section is completely gone.
   - Verify the Requests list has a new "Payment" status column with "Paid" / "Not Paid" dropdown options.
   - Verify the Status dropdown has the "Delivered" option.
   - Change a request's status to "Delivered" and payment status to "Paid", verify it updates.
4. **Order Tracking**: Search using the Track Order search modal with the first 8 characters of an Invoice ID. Verify that the stepper is updated to 6 steps and loads the status correctly.
