# Implementation Plan - Editable Contact Info, Map integration, & Homepage Message Notifications

We will make the contact page details (email, phone, address, and map iframe) fully editable in the Admin panel, integrate a styled Map section on the Contact page, and build a glassmorphic toast notification on the homepage for new unread messages that disappears after being seen.

## Proposed Changes

### 1. Database & Server (server.js)
#### [MODIFY] [`server.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js)
- Update `GET /api/messages/unread-count` to check user roles:
  - If admin: return count of all messages where `readByAdmin: false`.
  - If user: return count of user's messages where `readByUser: false`.
- Add `PUT /api/messages/read-all` endpoint to mark all unread messages as read for the logged-in user or admin.

### 2. Contact Page Integration
#### [MODIFY] [`contact.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.html)
- Add IDs `contact-email`, `contact-phone`, and `contact-address` to the contact details column.
- Insert a hidden phone item container (`#contact-phone-container`) that displays when a phone number is set.
- Insert a map container (`#contact-map-container`) with a Google Maps iframe (`#contact-map`) below the main contact forms grid.

#### [MODIFY] [`contact.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.js)
- Add a `loadContactInfo()` function to fetch `contact-info` Content from the backend.
- Dynamically populate email text, phone number (toggling container visibility), address, and the map iframe src.
- Trigger `loadContactInfo()` concurrently inside `init()` alongside the page intro loader.

### 3. Admin Content Editors
#### [MODIFY] [`admin.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.html)
- Add a new option `<option value="contact-info">Contact Details (Email, Phone, Address, Map)</option>` to the page selector dropdown.
- Group the standard title/content forms inside a wrapper div (`#standardPageFields`).
- Add a new inputs wrapper div (`#contactInfoFields`) containing form fields for Contact Email, Contact Phone, Contact Address, and Google Maps Embed URL.

#### [MODIFY] [`admin.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.js)
- Handle selection of the `contact-info` key:
  - Hide standard textfields and show custom contact textfields.
  - Disable standard validation required properties.
- Update page content loading and save handlers to populate and submit email/phone/address/map URL values under the single `contact-info` DB key mapping.

### 4. Homepage Message Notifications
#### [MODIFY] [`style.css`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/style.css)
- Implement CSS classes for `.toast-notification` with glassmorphic styling (`backdrop-filter: blur(10px)`), borders, entrance slide-up/fade-in, and dismissal exit animations.

#### [MODIFY] [`app.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/app.js)
- Add a `checkMessageNotifications()` function that queries `/api/messages/unread-count` if a user is authenticated.
- If `unreadCount > 0`, create a floating glassmorphic toast notification component at the bottom-right of the screen after 1.5 seconds delay.
- Display custom text:
  - Admin: "You have X new messages from clients."
  - User: "You have X new replies on your threads."
- Wire click handlers for the CTA link (redirecting to admin/profile) and close button. Both actions trigger `PUT /api/messages/read-all` so the notifications disappear permanently until new messages are received.

---

## Verification Plan

### Automated Verification
- Run `npm run build` to confirm compiling is successful.

### Manual Verification
- **Admin Edit Contact Details**: Go to the Admin dashboard, edit Contact details under the selector tab, save, and confirm changes show up on the Contact page immediately.
- **Contact Map**: Verify the Google Map iframe is shown on `contact.html` with the custom admin-configured link.
- **Unread Notification**:
  - Send a message from contact page as guest.
  - Log in as admin, check if a notification toast appears on the homepage saying "You have 1 new messages from clients."
  - Dismiss/close the toast, reload the page, and verify the notification does not show again.
