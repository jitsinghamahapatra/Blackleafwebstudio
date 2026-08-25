# Implementation Plan - Custom Email Link Password Reset

We will implement a secure password reset system using an email link. The system will send a unique reset link to the user's email address and prompt them to check their spam folder. When clicked, the link will open a password update modal on the site.

## Proposed Changes

---

### Project Dependencies

- Install `nodemailer` to handle email dispatch from the backend.
  - Command: `npm install nodemailer`

---

### Backend Components

#### [MODIFY] [User.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/models/User.js)
- Add two fields to `UserSchema`:
  - `resetPasswordToken`: { type: String, default: null }
  - `resetPasswordExpires`: { type: Date, default: null }

#### [MODIFY] [server.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js)
- Set up a `nodemailer` transport using environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
- Create endpoint `/api/auth/forgot-password` (POST):
  - Accepts `{ email }`.
  - Searches for user. If not found, return an error.
  - Generates a secure random 32-byte token using `crypto.randomBytes(32).toString('hex')`.
  - Sets `resetPasswordToken` and `resetPasswordExpires` (valid for 1 hour).
  - Sends a reset email containing the link: `http://localhost:5173/index.html?resetToken=TOKEN_HERE` (or dynamically detect the host from the request headers).
  - Tells the user to check their spam folder.
  - Fallback: If SMTP variables are missing in `.env`, print the reset link to the server console for easy testing/development.
- Create endpoint `/api/auth/reset-password-with-token` (POST):
  - Accepts `{ token, newPassword }`.
  - Finds the user by `resetPasswordToken` and checks that `resetPasswordExpires` is in the future.
  - Updates the user's password, clears the token fields, and saves the user.

---

### Frontend Components

#### [MODIFY] [db-check.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/db-check.js)
- Update `initForgotPassword` function:
  - Add helper function `checkResetToken()` that:
    - Checks the page URL for a `resetToken` query parameter.
    - If found, dynamically injects and displays a "Set New Password" modal.
    - Submits the new password and token to `/api/auth/reset-password-with-token`.
    - On success, alerts the user, removes the `resetToken` query parameter from the URL, and opens the login modal.
  - Update the "Forgot Password?" click listener:
    - Dynamically injects and opens a "Request Password Reset" modal asking for the user's email.
    - Submits to `/api/auth/forgot-password`.
    - Shows an alert: "Password reset link sent! Please check your email (and check your spam folder) to complete the reset."

---

## Verification Plan

### Automated/Local Tests
- Create a test script `scratch/test-email-link.js` to simulate requesting a reset token, retrieving the link from the database, and updating the password.

### Manual Verification
1. Launch the dev server.
2. Click "Forgot Password?" and submit the email.
3. Verify that the link is generated (check server console logs).
4. Navigate to the link in the browser.
5. Verify that the "Set New Password" modal automatically displays.
6. Enter a new password and submit.
7. Attempt logging in with the new password.
