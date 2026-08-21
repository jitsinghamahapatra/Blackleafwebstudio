import { checkDB, hideLoadingScreen } from "./db-check.js";
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

async function checkUnreadMessages() {
    const badge = document.getElementById("profileBadge");
    if (badge) badge.style.display = "none";
}

// RESTORE USER SESSION
async function restoreSession() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
            currentUser = data.user;
            updateUIState();
        } else {
            localStorage.removeItem("token");
        }
    } catch (err) {
        console.error("Session restore failed", err);
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
        } else {
            openModal(authModal);
        }
    });
}



// ==========================================
// AUTH ROUTE CALLS
// ==========================================

// Google Auth Trigger
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
            }
        } catch (err) {
            window.customAlert(err.message || "Google authentication failed", true);
        }
    });
}

// Complete Registration details form submit
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
                window.customAlert("Account registered and logged in successfully!");
            } else {
                window.customAlert(data.message || "Failed to complete registration", true);
            }
        } catch (err) {
            window.customAlert("Server connection error during registration", true);
        }
    });
}

// Email Login
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
            } else {
                window.customAlert(data.message || "Invalid credentials", true);
            }
        } catch (err) {
            window.customAlert("Error connecting to login server", true);
        }
    });
}



// ==========================================
// LOAD & RENDER PROJECTS WITH FILTERING
// ==========================================
const portfolioGrid = document.getElementById("portfolioGrid");
let allProjects = [];

async function loadProjects() {
    if (!portfolioGrid) return;
    try {
        const res = await fetch("/api/projects");
        allProjects = await res.json();
        renderProjects("all");
    } catch (err) {
        console.error("Error loading portfolio projects", err);
        portfolioGrid.innerHTML = `<p style="text-align: center; grid-column:1/-1; opacity:0.6;">Failed to load portfolio items.</p>`;
    }
}

// Dynamically determine project category
function getProjectCategory(project) {
    const text = (project.title + " " + (project.desc || "")).toLowerCase();
    if (text.includes("shop") || text.includes("e-commerce") || text.includes("store") || text.includes("cart") || text.includes("checkout")) {
        return "ecommerce";
    }
    if (text.includes("landing") || text.includes("starter") || text.includes("page") || text.includes("vercel") || text.includes("blueprint")) {
        return "landing";
    }
    return "corporate";
}

function renderProjects(filter = "all") {
    portfolioGrid.innerHTML = "";

    const filtered = allProjects.filter(p => {
        if (filter === "all") return true;
        return getProjectCategory(p) === filter;
    });

    if (filtered.length === 0) {
        portfolioGrid.innerHTML = `<p style="text-align: center; grid-column: 1/-1; padding: 40px; opacity:0.6; font-style:italic;">No projects found in this category.</p>`;
        return;
    }

    filtered.forEach(project => {
        const previewImgUrl = project.img ? project.img : `https://api.microlink.io/?url=${encodeURIComponent(project.link)}&screenshot=true&embed=screenshot.url`;

        const card = document.createElement("div");
        card.className = "project-card anim-fade-up anim-visible";
        card.innerHTML = `
            <img src="${previewImgUrl}" alt="${project.title}" class="project-img" onerror="this.src='/images/image1.png'">
            <div class="project-title">${project.title}</div>
            ${project.desc ? `<div class="project-desc">${project.desc}</div>` : ''}
            <a href="${project.link}" target="_blank" class="btn-request" style="font-size:0.8rem; padding:8px 15px; width:100%; text-align:center;">Launch Website <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem; margin-left:5px;"></i></a>
        `;
        portfolioGrid.appendChild(card);
    });
}

// FILTER HANDLERS
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const filter = btn.getAttribute("data-filter");
        renderProjects(filter);
    });
});

// ==========================================
// INITIALIZE
// ==========================================
async function init() {
    const isDbConnected = await checkDB();
    if (!isDbConnected) return;

    if (window.loadThemeSettings) await window.loadThemeSettings();
    await restoreSession();
    await loadProjects();
    await loadPageIntroContent('page-portfolio');
    setupTrackOrder();

    hideLoadingScreen();
}

async function loadPageIntroContent(key) {
    try {
        const res = await fetch(`/api/content/${key}`);
        if (res.ok) {
            const data = await res.json();
            const titleEl = document.getElementById('pageIntroTitle');
            const descEl = document.getElementById('pageIntroDesc');
            if (titleEl && data.title) titleEl.innerHTML = data.title;
            if (descEl && data.desc) descEl.innerHTML = data.desc;
        }
    } catch(err) { /* silently fallback */ }
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
                    else if (order.status === "Delivered") activeStep = 6;
                    
                    const dateStr = new Date(order.timestamp).toLocaleDateString();

                    trackOrderResult.innerHTML = `
                        <div style="margin-bottom:15px; border-bottom:1px dashed #ccc; padding-bottom:10px;">
                            <strong>Package:</strong> ${order.package}<br>
                            <strong>Order Date:</strong> ${dateStr}<br>
                            <strong>Current Status:</strong> <span style="font-weight:bold; color:var(--accent-pink);">${order.status}</span> | 
                            <strong>Payment:</strong> <span style="font-weight:bold; color:${order.paymentStatus === 'Paid' ? '#2ecc71' : '#e74c3c'};">${order.paymentStatus || 'Not Paid'}</span>
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
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2;">
                                <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--ink-black); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; background: ${activeStep >= 6 ? '#dde5b6' : 'white'};">6</div>
                                <span style="font-size: 0.6rem; font-weight: bold;">Delivered</span>
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
