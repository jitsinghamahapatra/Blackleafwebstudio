# Implementation Plan - Forgot Password Flow

We will implement the forgot password functionality for Blackleaf Studio. Because no SMTP or third-party SMS gateway is configured in the environment variables, we will use a secure, self-contained method: verifying both the user's **Email Address** and **Registered Phone Number** to reset their password.

## User Review Required

> [!NOTE]
> Since we do not have an active SMTP server configured, password resets will be verified against the registered **Email Address** and **Phone Number** combination in the database.

## Proposed Changes

---

### Backend Components

#### [MODIFY] [server.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js)
- Add a new POST route at `/api/auth/forgot-password` that:
  - Accepts `email`, `phone`, and `newPassword`.
  - Searches for the user by `email`.
  - Normalizes and compares the input phone number with the registered user's phone number to verify identity.
  - Hashes the `newPassword` and saves it.

---

### Frontend Components

#### [MODIFY] [db-check.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/db-check.js)
- Implement an `initForgotPassword` function that dynamically binds to `#forgotPassword` links on any page.
- On click, it will:
  - Dynamically inject a styled "Reset Password" modal overlay/box into the DOM if it doesn't already exist.
  - Auto-close the login modal.
  - Present fields for: Email, Registered Phone Number, and New Password.
  - Submit the inputs to the `/api/auth/forgot-password` endpoint.
  - Show success/error toasts using the existing `window.customAlert` helper and transition back to the login modal on success.
- Call `initForgotPassword()` at the end of the `hideLoadingScreen()` function to ensure it automatically initializes on all client pages.

---

## Verification Plan

### Automated Tests
- Create a lightweight test script `scratch/test-reset.js` using `node` to verify the reset logic against a local/test database.

### Manual Verification
1. Open the homepage or any other page.
2. Trigger the login modal and click the **Forgot Password?** link.
3. Verify that the "Reset Password" modal is dynamically injected and displays correctly.
4. Try submitting an incorrect phone number or non-existent email (should show error toast).
5. Input the correct registered email and phone number, and type a new password. Submit to reset.
6. Verify the login modal is displayed again, and attempt logging in with the new password.
