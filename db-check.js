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

export function initForgotPassword() {
  const forgotPasswordLink = document.getElementById('forgotPassword');
  if (!forgotPasswordLink) return;

  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();

    // Create/inject modal if not already present
    let modal = document.getElementById('forgotPasswordModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'forgotPasswordModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 500px; position: relative;">
          <button class="modal-close" id="closeForgotPasswordModal"><i class="fa-solid fa-xmark"></i></button>
          <h2>Reset Password</h2>
          <p style="margin-bottom: 20px; opacity: 0.8; font-size: 0.9rem; line-height: 1.4; text-align: left;">Verify your email and registered phone number to reset your password.</p>
          <form id="forgotPasswordForm">
            <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.85rem; text-align: left;">Email Address:</label>
            <input type="email" id="forgotEmail" class="form-input" placeholder="Enter your email" required style="margin-bottom: 15px; width: 100%;">
            
            <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.85rem; text-align: left;">Registered Phone Number:</label>
            <input type="text" id="forgotPhone" class="form-input" placeholder="Enter your phone number" required style="margin-bottom: 15px; width: 100%;">
            
            <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.85rem; text-align: left;">New Password:</label>
            <input type="password" id="forgotNewPassword" class="form-input" placeholder="Enter new password" required style="margin-bottom: 15px; width: 100%;">
            
            <button type="submit" id="forgotSubmitBtn" class="btn-request" style="width:100%; margin-top: 10px;">Reset Password</button>
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
          const phone = modal.querySelector('#forgotPhone').value;
          const newPassword = modal.querySelector('#forgotNewPassword').value;

          const submitBtn = modal.querySelector('#forgotSubmitBtn');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Resetting...';
          }

          try {
            const res = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, phone, newPassword })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              if (window.customAlert) {
                window.customAlert('Password reset successfully! You can now log in.');
              } else {
                alert('Password reset successfully! You can now log in.');
              }
              modal.classList.remove('active');
              const authModal = document.getElementById('authModal');
              if (authModal) authModal.classList.add('active');
              
              // Clear fields
              modal.querySelector('#forgotEmail').value = '';
              modal.querySelector('#forgotPhone').value = '';
              modal.querySelector('#forgotNewPassword').value = '';
            } else {
              if (window.customAlert) {
                window.customAlert(data.message || 'Failed to reset password. Please check your inputs.', true);
              } else {
                alert(data.message || 'Failed to reset password. Please check your inputs.');
              }
            }
          } catch (err) {
            if (window.customAlert) {
              window.customAlert('Server connection error. Please try again later.', true);
            } else {
              alert('Server connection error. Please try again later.');
            }
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
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
