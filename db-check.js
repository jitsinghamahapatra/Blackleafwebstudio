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
}
