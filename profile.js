import { auth } from "./firebase-config.js";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Custom Toast Alert
window.customAlert = function(message, isError = false) {
    let container = document.getElementById('custom-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'custom-toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `custom-toast ${isError ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-xmark' : 'fa-circle-check'}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// SCROLL REVEAL ANIMATIONS
// ==========================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("anim-visible");
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
});

document.querySelectorAll(".anim-fade-up").forEach(el => {
    revealObserver.observe(el);
});

// ==========================================
// HAMBURGER TOGGLE MENU
// ==========================================
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navLinks = document.getElementById("navLinks");
const navOverlay = document.getElementById("navOverlay");

if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => {
        hamburgerBtn.classList.toggle("active");
        navLinks.classList.toggle("active");
        navOverlay.classList.toggle("active");
        document.body.style.overflow = navLinks.classList.contains("active") ? "hidden" : "";
    });
    navOverlay.addEventListener("click", closeHamburger);
    navLinks.querySelectorAll("a, button").forEach(el => {
        el.addEventListener("click", closeHamburger);
    });
}

function closeHamburger() {
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove("active");
        navLinks.classList.remove("active");
        navOverlay.classList.remove("active");
        document.body.style.overflow = "";
    }
}

// ==========================================
// DOM ELEMENTS FOR AUTH & PROFILE
// ==========================================
const authBtn = document.getElementById("authBtn");
const profileBtn = document.getElementById("profileBtn");
const adminNav = document.getElementById("adminNav");

// Modals
const authModal = document.getElementById("authModal");
const closeAuthModal = document.getElementById("closeAuthModal");
const completeRegModal = document.getElementById("completeRegModal");

// Auth Inputs
const googleAuthBtn = document.getElementById("googleAuthBtn");
const emailAuthBtn = document.getElementById("emailAuthBtn");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

// Complete Registration Inputs
const completeRegForm = document.getElementById("completeRegForm");
const regEmail = document.getElementById("regEmail");
const regName = document.getElementById("regName");
const regPhone = document.getElementById("regPhone");
const regPassword = document.getElementById("regPassword");

// Profile Inputs
const profileForm = document.getElementById("profileForm");
const profileEmail = document.getElementById("profileEmail");
const profileName = document.getElementById("profileName");
const profilePhone = document.getElementById("profilePhone");
const profileOldPassword = document.getElementById("profileOldPassword");
const profilePassword = document.getElementById("profilePassword");
const profileConfirmPassword = document.getElementById("profileConfirmPassword");

// Auth State
let currentUser = null;
let tempGoogleUser = null;

// Helper to open/close modals
function openModal(modal) { if (modal) modal.classList.add("active"); }
function closeModal(modal) { if (modal) modal.classList.remove("active"); }

if (closeAuthModal) closeAuthModal.addEventListener("click", () => closeModal(authModal));

// Update login state UI
function updateUIState() {
    if (currentUser) {
        if (authBtn) authBtn.textContent = "Logout";
        if (profileBtn) profileBtn.style.display = "inline-block";
        if (adminNav) {
            adminNav.style.display = currentUser.role === 'admin' ? "inline-block" : "none";
        }
    } else {
        if (authBtn) authBtn.textContent = "Login";
        if (profileBtn) profileBtn.style.display = "none";
        if (adminNav) adminNav.style.display = "none";
    }
}

// RESTORE USER SESSION
async function restoreSession() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
            currentUser = data.user;
            updateUIState();
            
            // Populate form
            profileEmail.value = currentUser.email;
            profileName.value = currentUser.name;
            profilePhone.value = currentUser.phone || "";
        } else {
            localStorage.removeItem("token");
            window.location.href = "index.html";
        }
    } catch (err) {
        console.error("Session restore failed", err);
        window.location.href = "index.html";
    }
}

// LOGOUT HANDLER
if (authBtn) {
    authBtn.addEventListener("click", async () => {
        if (currentUser) {
            localStorage.removeItem("token");
            try {
                await firebaseSignOut(auth);
            } catch (e) {}
            currentUser = null;
            updateUIState();
            window.customAlert("Logged out successfully.");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        } else {
            openModal(authModal);
        }
    });
}

// ==========================================
// PASSWORD EYE VISIBILITY TOGGLERS
// ==========================================
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (input && toggle) {
        toggle.addEventListener("click", () => {
            const type = input.getAttribute("type") === "password" ? "text" : "password";
            input.setAttribute("type", type);
            toggle.classList.toggle("fa-eye");
            toggle.classList.toggle("fa-eye-slash");
        });
    }
}

setupPasswordToggle("profileOldPassword", "toggleOldPassword");
setupPasswordToggle("profilePassword", "toggleNewPassword");
setupPasswordToggle("profileConfirmPassword", "toggleConfirmPassword");

// ==========================================
// PROFILE UPDATE FORM SUBMISSION
// ==========================================
if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        const newPass = profilePassword.value;
        const confirmPass = profileConfirmPassword.value;
        const oldPass = profileOldPassword.value;

        // Validation if password is changing
        if (newPass || confirmPass || oldPass) {
            if (!oldPass) {
                return window.customAlert("You must enter your current password to change password settings.", true);
            }
            if (newPass !== confirmPass) {
                return window.customAlert("New passwords do not match!", true);
            }
            if (newPass.length < 6) {
                return window.customAlert("New password must be at least 6 characters.", true);
            }
        }

        try {
            const res = await fetch("/api/auth/update-profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profileName.value,
                    phone: profilePhone.value,
                    oldPassword: oldPass || undefined,
                    password: newPass || undefined
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                currentUser = data.user;
                updateUIState();
                
                // Clear password fields
                profileOldPassword.value = "";
                profilePassword.value = "";
                profileConfirmPassword.value = "";
                
                window.customAlert("Profile updated successfully!");
            } else {
                window.customAlert(data.message || "Failed to update profile", true);
            }
        } catch (err) {
            window.customAlert("Error connecting to server", true);
        }
    });
}

// ==========================================
// AUTH ROUTE CALLS (FOR IN-PAGE LOGIN)
// ==========================================
if (googleAuthBtn) {
    googleAuthBtn.addEventListener("click", async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const res = await fetch("/api/auth/google-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    name: user.displayName,
                    googleId: user.uid
                })
            });
            const data = await res.json();
            
            if (data.isNewUser) {
                tempGoogleUser = {
                    email: data.email,
                    name: data.name,
                    googleId: data.googleId
                };
                
                regEmail.value = data.email;
                regName.value = data.name;
                regPhone.value = "";
                regPassword.value = "";
                
                closeModal(authModal);
                openModal(completeRegModal);
            } else if (data.success) {
                localStorage.setItem("token", data.token);
                currentUser = data.user;
                updateUIState();
                closeModal(authModal);
                window.customAlert("Logged in successfully!");
                restoreSession();
            }
        } catch (err) {
            window.customAlert(err.message || "Google authentication failed", true);
        }
    });
}

if (completeRegForm) {
    completeRegForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!tempGoogleUser) return;

        try {
            const res = await fetch("/api/auth/register-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: tempGoogleUser.email,
                    name: regName.value,
                    phone: regPhone.value,
                    password: regPassword.value,
                    googleId: tempGoogleUser.googleId
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem("token", data.token);
                currentUser = data.user;
                updateUIState();
                tempGoogleUser = null;
                closeModal(completeRegModal);
                window.customAlert("Account registered and logged in!");
                restoreSession();
            } else {
                window.customAlert(data.message || "Registration failed", true);
            }
        } catch (err) {
            window.customAlert("Server connection error during registration", true);
        }
    });
}

if (emailAuthBtn) {
    emailAuthBtn.addEventListener("click", async () => {
        const email = authEmail.value;
        const password = authPassword.value;
        if (!email || !password) return window.customAlert("Fill in both fields.", true);

        try {
            const res = await fetch("/api/auth/email-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem("token", data.token);
                currentUser = data.user;
                updateUIState();
                closeModal(authModal);
                authEmail.value = "";
                authPassword.value = "";
                window.customAlert("Logged in successfully!");
                restoreSession();
            } else {
                window.customAlert(data.message || "Invalid credentials", true);
            }
        } catch (err) {
            window.customAlert("Error connecting to login server", true);
        }
    });
}

// ==========================================
// INITIALIZE
// ==========================================
restoreSession();
