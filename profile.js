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
        checkUnreadMessages();
    } else {
        if (authBtn) authBtn.textContent = "Login";
        if (profileBtn) profileBtn.style.display = "none";
        if (adminNav) adminNav.style.display = "none";
        const badge = document.getElementById("profileBadge");
        if (badge) badge.style.display = "none";
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
            
            // Load dashboard data
            loadDashboardData();
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
// DASHBOARD LOGS RETRIEVAL & RENDERING
// ==========================================
async function loadDashboardData() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        // 1. Fetch Requests History
        const reqRes = await fetch("/api/orders/my", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const requests = await reqRes.json();
        renderRequestsList(requests);
        
        // 2. Fetch Messages Inbox
        const msgRes = await fetch("/api/messages/my", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const messages = await msgRes.json();
        renderMessagesList(messages);
    } catch (e) {
        console.error("Failed to load dashboard data", e);
    }
}

function renderRequestsList(requests) {
    const list = document.getElementById("requestsList");
    if (!list) return;

    if (!requests || requests.length === 0) {
        list.innerHTML = `<p style="opacity: 0.6; font-style: italic; margin-top: 10px;">No project requests placed yet.</p>`;
        return;
    }

    list.innerHTML = requests.map(req => {
        const isCompleted = req.status === "Completed";
        const badgeBg = isCompleted ? "#e1ffd4" : "#ffe4cc";
        const dateStr = new Date(req.timestamp).toLocaleDateString();
        let activeStep = 1;
        if (req.status === "Pending") activeStep = 1;
        else if (req.status === "Designing") activeStep = 2;
        else if (req.status === "Coding") activeStep = 3;
        else if (req.status === "Review") activeStep = 4;
        else if (req.status === "Completed") activeStep = 5;
        else if (req.status === "Delivered") activeStep = 6;

        const paymentStatusHtml = `| <span style="font-size: 0.8rem; font-weight: bold; color: ${req.paymentStatus === 'Paid' ? '#2ecc71' : '#e74c3c'}; text-transform: uppercase;">${req.paymentStatus || 'Not Paid'}</span>`;

        return `
            <div class="request-card" style="border: 2px solid var(--ink-black); padding: 15px; background: var(--bg-cream); box-shadow: 4px 4px 0 var(--ink-black); margin-bottom: 5px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
                    <strong style="font-size: 1.1rem; font-family: 'Space Mono', monospace;">${req.package}</strong>
                    <span style="font-size: 0.8rem; background: ${badgeBg}; border: 1px solid var(--ink-black); padding: 2px 8px; font-weight: bold; text-transform: uppercase;">${req.status} ${paymentStatusHtml}</span>
                </div>
                <p style="font-size: 0.85rem; margin-bottom: 12px; color: var(--ink-black);"><strong>Details:</strong> ${req.details}</p>
                
                <!-- Stepper Progress Timeline -->
                <div style="margin: 15px 0; border: 2px solid var(--ink-black); padding: 12px; background: white; color: var(--ink-black);">
                    <div style="font-family:'Space Mono', monospace; font-size:0.75rem; margin-bottom: 8px; font-weight:bold;">BUILD TIMELINE:</div>
                    <div class="stepper" style="display: flex; justify-content: space-between; position: relative; padding: 0 5px;">
                        <div style="position: absolute; top: 12px; left: 15px; right: 15px; height: 3px; background-color: var(--ink-black); z-index: 1;"></div>
                        
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 1 ? '#dde5b6' : 'white'};">1</div>
                            <span style="font-size: 0.6rem; font-weight: bold;">Placed</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 2 ? '#dde5b6' : 'white'};">2</div>
                            <span style="font-size: 0.6rem; font-weight: bold;">Design</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 3 ? '#dde5b6' : 'white'};">3</div>
                            <span style="font-size: 0.6rem; font-weight: bold;">Code</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 4 ? '#dde5b6' : 'white'};">4</div>
                            <span style="font-size: 0.6rem; font-weight: bold;">Review</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 5 ? '#dde5b6' : 'white'};">5</div>
                            <span style="font-size: 0.6rem; font-weight: bold;">Done</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 6 ? '#dde5b6' : 'white'};">6</div>
                            <span style="font-size: 0.6rem; font-weight: bold;">Delivered</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; opacity: 0.8; flex-wrap: wrap; gap: 10px; border-top: 1px dashed #bbb; padding-top: 10px; margin-top: auto;">
                    <span>Date: ${dateStr}</span>
                </div>
            </div>
        `;
    }).join("");
}

function renderMessagesList(messages) {
    const list = document.getElementById("messagesList");
    if (!list) return;

    if (!messages || messages.length === 0) {
        list.innerHTML = `<p style="opacity: 0.6; font-style: italic; margin-top: 10px;">No support messages sent yet.</p>`;
        return;
    }

    list.innerHTML = messages.map(msg => {
        const isReplied = msg.status === "Replied";
        const badgeBg = isReplied ? "#e1ffd4" : "#ffe4cc";
        
        // Render thread replies
        const repliesHtml = msg.replies && msg.replies.length > 0
            ? msg.replies.map(reply => {
                const isUser = reply.sender === "user";
                const senderLabel = isUser ? "You" : "Admin";
                const labelColor = isUser ? "#0066ff" : "#ff0055";
                const replyDate = new Date(reply.timestamp).toLocaleString();
                return `
                    <div style="padding-left: 10px; border-left: 2px solid ${labelColor}; margin-bottom: 8px;">
                        <small style="font-weight: bold; color: ${labelColor};">${senderLabel}:</small>
                        <p style="font-size: 0.85rem; margin: 2px 0; color: var(--ink-black);">${reply.text}</p>
                        <small style="opacity: 0.6; font-size: 0.7rem;">${replyDate}</small>
                    </div>
                `;
              }).join("")
            : `<p style="font-size: 0.8rem; opacity: 0.6; font-style: italic; margin: 5px 0;">No responses yet from the admin team.</p>`;

        // Unread check dot
        const unreadIndicator = !msg.readByUser 
            ? `<span style="display:inline-block; width:8px; height:8px; background-color:#ff0055; border-radius:50%; margin-right:8px;" title="Unread Reply"></span>` 
            : "";

        return `
            <div class="message-card" data-id="${msg._id}" style="border: 2px solid var(--ink-black); padding: 15px; background: white; box-shadow: 4px 4px 0 var(--ink-black); margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center;">
                        ${unreadIndicator}
                        <strong style="font-size: 1rem; color: var(--ink-black);">Subject: ${msg.subject}</strong>
                    </div>
                    <span style="font-size: 0.75rem; background: ${badgeBg}; border: 1px solid var(--ink-black); padding: 2px 8px; font-weight: bold;">${msg.status}</span>
                </div>
                <p style="font-size: 0.85rem; margin-bottom: 10px; background: #fafafa; border: 1px dashed #ccc; padding: 10px; color: var(--ink-black);">
                    <strong>Original query:</strong><br>${msg.message}
                </p>
                
                <!-- Expanded Conversation Thread -->
                <div class="conversation-thread" style="background: #fdfdfd; border-top: 1px solid #ddd; padding: 10px 0 0 0; margin-top: 10px; display: flex; flex-direction: column; gap: 5px;">
                    <strong style="font-size: 0.85rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Thread History:</strong>
                    ${repliesHtml}
                </div>
                
                <!-- Reply Box Form -->
                <form class="thread-reply-form" data-id="${msg._id}" style="display: flex; gap: 8px; margin-top: 15px;">
                    <input type="text" placeholder="Type your reply to admin..." required style="flex: 1; border: 2px solid var(--ink-black); padding: 6px 12px; font-size: 0.85rem; font-family: inherit; background: white;">
                    <button type="submit" class="btn-request" style="padding: 6px 15px; font-size: 0.8rem; cursor: pointer;">Reply</button>
                </form>
            </div>
        `;
    }).join("");

    // Wire up quick reply submission & read-status trigger on click
    list.querySelectorAll(".message-card").forEach(card => {
        const id = card.dataset.id;
        
        // Mark as read when clicked/interacted
        card.addEventListener("click", async (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('form')) {
                return;
            }
            const dot = card.querySelector("span[title='Unread Reply']");
            if (dot) {
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`/api/messages/${id}/read`, {
                        method: "PUT",
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (res.ok) {
                        dot.remove();
                        // Trigger count badge updates in header
                        restoreSession();
                    }
                } catch (e) {}
            }
        });

        // Form reply submission
        const form = card.querySelector(".thread-reply-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = form.querySelector("input");
            const text = input.value;
            const submitBtn = form.querySelector("button[type='submit']");
            submitBtn.textContent = "...";
            submitBtn.disabled = true;

            const token = localStorage.getItem("token");
            try {
                const res = await fetch(`/api/messages/${id}/reply`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ text })
                });
                const data = await res.json();
                
                if (res.ok && data.success) {
                    window.customAlert("Reply sent!");
                    loadDashboardData(); // Reload list
                } else {
                    window.customAlert(data.message || "Failed to send reply", true);
                }
            } catch (err) {
                window.customAlert("Connection error", true);
            }
            submitBtn.textContent = "Reply";
            submitBtn.disabled = false;
        });
    });
}

// CHECK UNREAD MESSAGES BADGES
async function checkUnreadMessages() {
    const badge = document.getElementById("profileBadge");
    if (badge) {
        badge.style.display = "none";
    }
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

function setupDashboardTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.style.display = "none");

            btn.classList.add("active");
            const target = btn.dataset.tab;
            const targetPanel = document.getElementById(`tab-${target}`);
            if (targetPanel) {
                targetPanel.style.display = "block";
            }
        });
    });
}

async function init() {
    if (window.loadThemeSettings) await window.loadThemeSettings();
    await restoreSession();
    setupTrackOrder();
    setupDashboardTabs();
}

// ==========================================
// TRACK ORDER LOGIC
// ==========================================
function setupTrackOrder() {
    const trackOrderNav = document.getElementById("trackOrderNav");
    const trackOrderModal = document.getElementById("trackOrderModal");
    const closeTrackOrderModal = document.getElementById("closeTrackOrderModal");
    const btnTrackSubmit = document.getElementById("btnTrackSubmit");
    const trackOrderIdInput = document.getElementById("trackOrderIdInput");
    const trackOrderResult = document.getElementById("trackOrderResult");

    const openM = (modal) => { if (modal) modal.classList.add("active"); };
    const closeM = (modal) => { if (modal) modal.classList.remove("active"); };

    if (trackOrderNav && trackOrderModal) {
        trackOrderNav.addEventListener("click", (e) => {
            e.preventDefault();
            trackOrderIdInput.value = "";
            trackOrderResult.style.display = "none";
            openM(trackOrderModal);
        });
    }

    if (closeTrackOrderModal) {
        closeTrackOrderModal.addEventListener("click", () => closeM(trackOrderModal));
    }

    if (btnTrackSubmit) {
        btnTrackSubmit.addEventListener("click", async () => {
            const id = trackOrderIdInput.value.trim();
            if (!id) return window.customAlert("Please enter an Invoice ID.", true);
            
            btnTrackSubmit.textContent = "...";
            try {
                const res = await fetch(`/api/orders/track/${id}`);
                const data = await res.json();
                
                if (res.ok && data.success) {
                    trackOrderResult.style.display = "block";
                    
                    const order = data.order;
                    let activeStep = 1;
                    if (order.status === "Pending") activeStep = 1;
                    else if (order.status === "Designing") activeStep = 2;
                    else if (order.status === "Coding") activeStep = 3;
                    else if (order.status === "Review") activeStep = 4;
                    else if (order.status === "Completed") activeStep = 5;
                    
                    const dateStr = new Date(order.timestamp).toLocaleDateString();

                    trackOrderResult.innerHTML = `
                        <div style="margin-bottom:15px; border-bottom:1px dashed #ccc; padding-bottom:10px;">
                            <strong>Package:</strong> ${order.package}<br>
                            <strong>Order Date:</strong> ${dateStr}<br>
                            <strong>Current Status:</strong> <span style="font-weight:bold; color:var(--accent-pink);">${order.status}</span>
                        </div>
                        
                        <div class="stepper" style="display: flex; justify-content: space-between; position: relative; margin-top: 15px; padding: 0 5px;">
                            <div style="position: absolute; top: 12px; left: 15px; right: 15px; height: 3px; background-color: var(--ink-black); z-index: 1;"></div>
                            
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                                <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 1 ? '#dde5b6' : 'white'};">1</div>
                                <span style="font-size: 0.6rem; font-weight: bold;">Placed</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                                <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 2 ? '#dde5b6' : 'white'};">2</div>
                                <span style="font-size: 0.6rem; font-weight: bold;">Design</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                                <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 3 ? '#dde5b6' : 'white'};">3</div>
                                <span style="font-size: 0.6rem; font-weight: bold;">Code</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                                <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 4 ? '#dde5b6' : 'white'};">4</div>
                                <span style="font-size: 0.6rem; font-weight: bold;">Review</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                                <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 5 ? '#dde5b6' : 'white'};">5</div>
                                <span style="font-size: 0.6rem; font-weight: bold;">Done</span>
                            </div>
                        </div>
                    `;
                } else {
                    trackOrderResult.style.display = "none";
                    window.customAlert(data.message || "Order not found. Check the ID prefix.", true);
                }
            } catch (err) {
                window.customAlert("Error querying tracker.", true);
            }
            btnTrackSubmit.textContent = "Track";
        });
    }
}

init();
