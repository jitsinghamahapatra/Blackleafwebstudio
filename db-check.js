export async function checkDB() {
  const statusEl = document.getElementById('db-loading-status');
  const overlayEl = document.getElementById('db-loading-screen');
  const retryBtn = document.getElementById('db-retry-btn');
  
  try {
    const res = await fetch('/api/db-status');
    const data = await res.json();
    if (data && data.connected) {
      return true;
    } else {
      throw new Error('Disconnected');
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Error: Database connection failed. Please reload the page.';
    if (overlayEl) overlayEl.classList.add('error-state');
    if (retryBtn) retryBtn.style.display = 'inline-block';
    return false;
  }
}

export async function loadSocialLinks() {
  try {
    const res = await fetch('/api/content/socials');
    if (res.ok) {
      const data = await res.json();
      const linkedinEl = document.getElementById('social-linkedin');
      const githubEl = document.getElementById('social-github');
      if (linkedinEl && data.title) linkedinEl.href = data.title;
      if (githubEl && data.desc) githubEl.href = data.desc;
    }
  } catch (err) {
    console.error('Failed to load social links:', err);
  }
}

export function hideLoadingScreen() {
  const overlayEl = document.getElementById('db-loading-screen');
  if (overlayEl) {
    overlayEl.classList.add('fade-out');
  }
  loadSocialLinks();
  initForgotPassword();
}

import { auth } from './firebase-config.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export function initForgotPassword() {
  const forgotPasswordLink = document.getElementById('forgotPassword');
  if (!forgotPasswordLink) return;

  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();

    // Create/inject "Request Reset Link" modal if not already present
    let modal = document.getElementById('forgotPasswordModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'forgotPasswordModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 500px; position: relative;">
          <button class="modal-close" id="closeForgotPasswordModal"><i class="fa-solid fa-xmark"></i></button>
          <h2>Reset Password</h2>
          <p style="margin-bottom: 20px; opacity: 0.8; font-size: 0.9rem; line-height: 1.4; text-align: left;">
            Enter your email address and we'll send you a link to reset your password. 
            <strong>Please check your spam folder</strong> if you do not receive it in a few minutes.
          </p>
          <form id="forgotPasswordForm">
            <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.85rem; text-align: left;">Email Address:</label>
            <input type="email" id="forgotEmail" class="form-input" placeholder="Enter your registered email" required style="margin-bottom: 15px; width: 100%;">
            
            <button type="submit" id="forgotSubmitBtn" class="btn-request" style="width:100%; margin-top: 10px;">Send Reset Link</button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('#closeForgotPasswordModal');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.classList.remove('active');
        });
      }

      const form = modal.querySelector('#forgotPasswordForm');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = modal.querySelector('#forgotEmail').value;

          const submitBtn = modal.querySelector('#forgotSubmitBtn');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
          }

          try {
            await sendPasswordResetEmail(auth, email);
            if (window.customAlert) {
              window.customAlert('Password reset link sent! Check your email and check your spam folder.');
            } else {
              alert('Password reset link sent! Check your email and check your spam folder.');
            }
            modal.classList.remove('active');
            modal.querySelector('#forgotEmail').value = '';
          } catch (err) {
            console.error('Firebase sendPasswordResetEmail error:', err);
            let errorMsg = 'Failed to send reset link. Please try again.';
            if (err.code === 'auth/user-not-found') {
              errorMsg = 'No account found with this email address.';
            } else if (err.code === 'auth/invalid-email') {
              errorMsg = 'Please enter a valid email address.';
            } else if (err.code === 'auth/too-many-requests') {
              errorMsg = 'Too many requests. Please try again later.';
            }
            if (window.customAlert) {
              window.customAlert(errorMsg, true);
            } else {
              alert(errorMsg);
            }
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Send Reset Link';
            }
          }
        });
      }
    }

    // Close authentication modal if open
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('active');

    // Show forgot password modal
    modal.classList.add('active');
  });
}
