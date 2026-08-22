# Walkthrough - Editable Contact Details, Map Section, & homepage Message Notifications

We have successfully implemented editable contact details, a styled map container on the contact page, and a glassmorphic toast notification system for new messages on the homepage.

## Changes Made

### 1. Database & Server
- Modified `GET /api/messages/unread-count` in [`server.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js) to dynamically return counts of unread messages based on the client role (counting `readByAdmin: false` for Admins and `readByUser: false` for Users).
- Added `PUT /api/messages/read-all` in [`server.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js) to mark all unread messages as read when the toast notification is dismissed or clicked.

### 2. Contact Page Integration
- Added dynamic IDs `contact-email`, `contact-phone`, and `contact-address` to the contact details container in [`contact.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.html).
- Added a map container (`#contact-map-container`) with a Google Maps iframe (`#contact-map`) in [`contact.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.html) below the form grid.
- Implemented `loadContactInfo()` in [`contact.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.js) to fetch values under key `contact-info` and update details (and toggles map/phone block visibility dynamically if values are provided).

### 3. Admin Panel Integration
- Added the `Contact Details` page editor option to the selector dropdown inside [`admin.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.html).
- Grouped the standard Page title/content fields and added custom fields (`#contactInfoFields`) for Email, Phone, Address, and Maps link inside [`admin.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.html).
- Programmed form visibility toggling, input loading, and POST body compiling for the `contact-info` key in [`admin.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.js).

### 4. Homepage Message Notifications
- Implemented styled glassmorphic popup rules (`background: rgba(25, 25, 25, 0.9); backdrop-filter: blur(12px)`) for `.toast-notification` with entrada slide-up and dismissal exit transitions in [`style.css`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/style.css).
- Redesigned `#unreadNotificationBanner` inside [`index.html`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/index.html) to map to the new toast notification system, complete with a bouncing bell icon (`fa-bell fa-bounce`).
- Programmed `checkUnreadMessages()` in [`app.js`](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/app.js) to fetch unread message counts on homepage load. If messages exist, it updates notification text (tailoring to user/admin role), triggers the toast after a 1.5s delay, and wires dismissal clicks to `/api/messages/read-all`.

---

## Verification Results

### Automated Production Build
Running `npm run build`:
```bash
vite v8.0.3 building client environment for production...
transforming...✓ 23 modules transformed.
rendering chunks...
dist/refund.html                                               9.25 kB
dist/privacy.html                                              9.25 kB
dist/terms.html                                                9.26 kB
dist/work.html                                                11.83 kB
dist/contact.html                                             14.13 kB
dist/admin.html                                               17.03 kB
dist/services.html                                            19.77 kB
dist/profile.html                                             21.87 kB
dist/index.html                                               27.25 kB
✓ built in 255ms
```
The project compiles correctly with zero errors and successfully outputs all dynamic page updates.
