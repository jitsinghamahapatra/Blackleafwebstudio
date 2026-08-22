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
// CLICK RIPPLE WAVE EFFECT
// ==========================================
const rippleContainer = document.getElementById("clickRippleContainer");

if (rippleContainer) {
    document.addEventListener("click", (e) => {
        const tag = e.target.tagName;
        if (["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A"].includes(tag)) return;
        if (e.target.closest(".modal-overlay")) return;

        createRipple(e.clientX, e.clientY);
    });
}

function createRipple(x, y) {
    const size = Math.random() * 100 + 80;
    const ripple = document.createElement("div");
    ripple.className = "click-ripple";
    ripple.style.width = size + "px";
    ripple.style.height = size + "px";
    ripple.style.left = (x - size / 2) + "px";
    ripple.style.top = (y - size / 2) + "px";
    rippleContainer.appendChild(ripple);

    setTimeout(() => {
        const size2 = size * 1.6;
        const ripple2 = document.createElement("div");
        ripple2.className = "click-ripple";
        ripple2.style.width = size2 + "px";
        ripple2.style.height = size2 + "px";
        ripple2.style.left = (x - size2 / 2) + "px";
        ripple2.style.top = (y - size2 / 2) + "px";
        ripple2.style.animationDuration = "0.9s";
        rippleContainer.appendChild(ripple2);
        ripple2.addEventListener("animationend", () => ripple2.remove());
    }, 100);

    ripple.addEventListener("animationend", () => ripple.remove());
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
const heroOrderBtn = document.getElementById("heroOrderBtn");

// Modals
const authModal = document.getElementById("authModal");
const closeAuthModal = document.getElementById("closeAuthModal");
const completeRegModal = document.getElementById("completeRegModal");
const orderModal = document.getElementById("orderModal");
const closeOrderModal = document.getElementById("closeOrderModal");

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
let tempGoogleUser = null; // Temp storage during registration completion

// Helper to open/close modals
function openModal(modal) { if (modal) modal.classList.add("active"); }
function closeModal(modal) { if (modal) modal.classList.remove("active"); }

if (closeAuthModal) closeAuthModal.addEventListener("click", () => closeModal(authModal));

if (closeOrderModal) closeOrderModal.addEventListener("click", () => closeModal(orderModal));

// Toggle Order Modal
function openOrderModal(planName = '') { 
    if(!currentUser) {
        window.customAlert("Please log in first to request a web project.", true);
        openModal(authModal);
        return;
    }
    
    // Auto-fill fields
    document.getElementById("orderEmail").value = currentUser.email;
    document.getElementById("orderName").value = currentUser.name || "";
    
    const packageSelect = document.getElementById("orderPackage");
    if(planName && typeof planName === 'string') {
        for(let i=0; i<packageSelect.options.length; i++){
            if(packageSelect.options[i].value === planName) {
                packageSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    openModal(orderModal);
}

if (heroOrderBtn) {
    heroOrderBtn.addEventListener("click", () => {
        const pricingSec = document.getElementById("buy");
        if (pricingSec) {
            pricingSec.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = "services.html";
        }
    });
}

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
        const banner = document.getElementById("unreadNotificationBanner");
        if (banner) banner.style.display = "none";
    }
}

async function checkUnreadMessages() {
    const badge = document.getElementById("profileBadge");
    const banner = document.getElementById("unreadNotificationBanner");
    const textEl = document.getElementById("unreadNotificationText");
    const linkEl = document.getElementById("unreadNotificationLink");
    const closeBtn = document.getElementById("closeUnreadBanner");

    const token = localStorage.getItem("token");
    if (!token || !currentUser) {
        if (badge) badge.style.display = "none";
        if (banner) banner.classList.remove("show");
        return;
    }

    try {
        const res = await fetch("/api/messages/unread-count", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const count = data.unreadCount || 0;
            
            if (count > 0) {
                // Show badge on profile button for regular users
                if (badge && currentUser.role !== 'admin') {
                    badge.style.display = "block";
                } else if (badge) {
                    badge.style.display = "none";
                }

                if (banner && textEl && linkEl) {
                    const isAdmin = currentUser.role === 'admin';
                    if (isAdmin) {
                        textEl.textContent = `You have ${count} new unread message${count > 1 ? 's' : ''} from clients.`;
                        linkEl.href = "admin.html";
                        linkEl.textContent = "Open Admin Panel";
                    } else {
                        textEl.textContent = `You have ${count} new repl${count > 1 ? 'ies' : 'y'} from the administrator.`;
                        linkEl.href = "profile.html";
                        linkEl.textContent = "View Dashboard";
                    }
                    
                    // Show toast after 1.5 seconds delay
                    setTimeout(() => {
                        banner.classList.remove("hide");
                        banner.classList.add("show");
                    }, 1500);

                    // Add dismissal logic
                    const markAllRead = async () => {
                        try {
                            await fetch("/api/messages/read-all", {
                                method: "PUT",
                                headers: { 
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                }
                            });
                        } catch(e) { console.error("Error marking all read", e); }
                    };

                    const dismissToast = async () => {
                        banner.classList.remove("show");
                        banner.classList.add("hide");
                        if (badge) badge.style.display = "none";
                        await markAllRead();
                    };

                    closeBtn.onclick = (e) => {
                        e.preventDefault();
                        dismissToast();
                    };

                    linkEl.onclick = async (e) => {
                        e.preventDefault();
                        const targetHref = linkEl.href;
                        // Mark as read, then navigate
                        await markAllRead();
                        window.location.href = targetHref;
                    };
                }
            } else {
                if (badge) badge.style.display = "none";
                if (banner) banner.classList.remove("show");
            }
        }
    } catch (err) {
        console.error("Error checking unread messages", err);
    }
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
                // Save google details temporarily
                tempGoogleUser = {
                    email: data.email,
                    name: data.name,
                    googleId: data.googleId
                };
                
                // Show registration detail completion modal
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
// LOAD CONTENT DATA (HERO)
// ==========================================
async function loadContent() {
    try {
        const res = await fetch("/api/content/hero");
        if (res.ok) {
            const data = await res.json();
            const titleEl = document.getElementById("heroTitle");
            const descEl = document.getElementById("heroDesc");
            const priceTagEl = document.getElementById("heroPriceTag");
            const imgEl = document.getElementById("heroImg");

            if (titleEl) titleEl.innerHTML = data.title || "WE BUILD<br>YOUR WEB.";
            if (descEl) descEl.textContent = data.desc || "";
            if (priceTagEl) priceTagEl.textContent = data.priceTag || "";
            if (imgEl && data.img) imgEl.src = data.img;
        }
    } catch(err) {
        console.error("Error loading hero content", err);
    }
}

// ==========================================
// LOAD PACKAGES
// ==========================================
const packagesGrid = document.getElementById("packagesGrid");
const orderPackageSelect = document.getElementById("orderPackage");

async function loadPackages() {
    if (!packagesGrid) return;
    try {
        const res = await fetch("/api/packages");
        const packages = await res.json();
        window.allPackages = packages;

        // Clear loading state
        packagesGrid.innerHTML = "";
        if (orderPackageSelect) orderPackageSelect.innerHTML = "";

        if (packages.length === 0) {
            packagesGrid.innerHTML = `<p style="text-align:center; width:100%; opacity:0.6;">No packages available yet.</p>`;
            return;
        }

        packages.forEach((data) => {
            // Add to dropdown
            if (orderPackageSelect) {
                const option = document.createElement("option");
                option.value = data.name;
                option.textContent = `${data.name} - ${data.price}`;
                orderPackageSelect.appendChild(option);
            }

            // Add to Grid
            const featuresHTML = (data.features || []).map(f => `<li>${f}</li>`).join("");
            const rotation = data._id === "1" ? "transform: rotate(2deg);" : "";
            
            const card = document.createElement("div");
            card.className = "package-card";
            if(rotation) card.style = rotation;
            card.innerHTML = `
                <img src="${data.img || '/images/image1.png'}" class="pkg-img" alt="${data.name}">
                <h3 class="pkg-title">${data.name}</h3>
                <span class="pkg-price">${data.price}</span>
                <ul class="pkg-features">
                    ${featuresHTML}
                </ul>
                <button class="btn-request btn-ordernow" data-plan="${data.name}" style="width: 100%;">Order Now</button>
            `;
            packagesGrid.appendChild(card);
        });

        addOrderButtonListeners();

    } catch (err) {
        console.error("Error loading packages", err);
        packagesGrid.innerHTML = `<p style="text-align:center; width:100%; opacity:0.6;">Failed to load packages.</p>`;
    }
}

function addOrderButtonListeners() {
    document.querySelectorAll(".btn-ordernow").forEach(btn => {
        btn.addEventListener("click", (e) => openOrderModal(e.currentTarget.getAttribute("data-plan")));
    });
}

// ==========================================
// LOAD PROJECTS + AUTO-SLIDE & SCREENSHOTS
// ==========================================
const projectsSlider = document.getElementById("projectsSlider");
const sliderDotsContainer = document.getElementById("sliderDots");
let autoSlideInterval = null;
let projectCardCount = 0;

async function loadProjects() {
    if (!projectsSlider) return;
    try {
        const res = await fetch("/api/projects");
        const projects = await res.json();
        projectsSlider.innerHTML = "";
        
        if(projects.length === 0) {
            projectsSlider.innerHTML = "<p>No recent works to show.</p>";
            return;
        }

        projectCardCount = 0;
        projects.forEach((data) => {
            // Determine preview image url - if img is blank, fetch screenshot from URL
            const previewImgUrl = data.img ? data.img : `https://api.microlink.io/?url=${encodeURIComponent(data.link)}&screenshot=true&embed=screenshot.url`;

            const card = document.createElement("div");
            card.className = "project-card";
            card.innerHTML = `
                <img src="${previewImgUrl}" alt="${data.title}" class="project-img" onerror="this.src='/images/image1.png'">
                <div class="project-title">${data.title}</div>
                ${data.desc ? `<div class="project-desc">${data.desc}</div>` : ''}
                <a href="${data.link}" target="_blank" class="btn-request" style="font-size:0.8rem; padding:8px 15px;">View Project</a>
            `;
            projectsSlider.appendChild(card);
            projectCardCount++;
        });

        buildSliderDots();
        setMobileCardWidths();
        startAutoSlide();
    } catch(err) {
        console.error("Error loading projects", err);
    }
}

function setMobileCardWidths() {
    if (!projectsSlider) return;
    const cards = projectsSlider.querySelectorAll(".project-card");
    if (window.innerWidth <= 768 && cards.length > 0) {
        const trackWidth = projectsSlider.offsetWidth;
        cards.forEach(card => {
            card.style.minWidth = trackWidth + "px";
            card.style.maxWidth = trackWidth + "px";
        });
    } else {
        cards.forEach(card => {
            card.style.minWidth = "";
            card.style.maxWidth = "";
        });
    }
}

window.addEventListener("resize", setMobileCardWidths);

function buildSliderDots() {
    if (!sliderDotsContainer) return;
    sliderDotsContainer.innerHTML = "";
    for (let i = 0; i < projectCardCount; i++) {
        const dot = document.createElement("button");
        dot.className = "slider-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.addEventListener("click", () => {
            const cards = projectsSlider.querySelectorAll(".project-card");
            if (cards[i]) {
                cards[i].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
            }
            updateActiveDot(i);
        });
        sliderDotsContainer.appendChild(dot);
    }
}

function updateActiveDot(index) {
    if (!sliderDotsContainer) return;
    const dots = sliderDotsContainer.querySelectorAll(".slider-dot");
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
}

function getCardScrollWidth() {
    if (!projectsSlider) return 320;
    const cards = projectsSlider.querySelectorAll(".project-card");
    if (cards.length === 0) return 320;
    return cards[0].offsetWidth + 16; // card width + margin
}

function getCurrentSlideIndex() {
    if (!projectsSlider) return 0;
    const cards = projectsSlider.querySelectorAll(".project-card");
    if (cards.length === 0) return 0;
    const scrollLeft = projectsSlider.scrollLeft;
    const cardWidth = getCardScrollWidth();
    return Math.round(scrollLeft / cardWidth);
}

function startAutoSlide() {
    if (!projectsSlider) return;
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
        const cards = projectsSlider.querySelectorAll(".project-card");
        if (cards.length === 0) return;
        
        let currentIndex = getCurrentSlideIndex();
        let nextIndex = currentIndex + 1;
        
        if (nextIndex >= cards.length) {
            projectsSlider.scrollTo({ left: 0, behavior: "smooth" });
            nextIndex = 0;
        } else {
            projectsSlider.scrollBy({ left: getCardScrollWidth(), behavior: "smooth" });
        }
        updateActiveDot(nextIndex);
    }, 3500);
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

if (projectsSlider) {
    projectsSlider.addEventListener("mouseenter", stopAutoSlide);
    projectsSlider.addEventListener("mouseleave", startAutoSlide);
    projectsSlider.addEventListener("touchstart", stopAutoSlide, { passive: true });
    projectsSlider.addEventListener("touchend", () => {
        setTimeout(startAutoSlide, 2000);
    });
    projectsSlider.addEventListener("scroll", () => {
        const idx = getCurrentSlideIndex();
        updateActiveDot(idx);
    });
}

const slideLeftBtn = document.getElementById("slideLeft");
const slideRightBtn = document.getElementById("slideRight");
if (slideLeftBtn) {
    slideLeftBtn.addEventListener("click", () => {
        stopAutoSlide();
        projectsSlider.scrollBy({ left: -getCardScrollWidth(), behavior: "smooth" });
        setTimeout(startAutoSlide, 3000);
    });
}
if (slideRightBtn) {
    slideRightBtn.addEventListener("click", () => {
        stopAutoSlide();
        projectsSlider.scrollBy({ left: getCardScrollWidth(), behavior: "smooth" });
        setTimeout(startAutoSlide, 3000);
    });
}

// ==========================================
// FAQ ACCORDION LOGIC
// ==========================================
document.querySelectorAll(".faq-question").forEach(question => {
    question.addEventListener("click", () => {
        const item = question.parentNode;
        const answer = item.querySelector(".faq-answer");
        const isActive = item.classList.contains("active");

        // Close all other FAQs
        document.querySelectorAll(".faq-item").forEach(otherItem => {
            otherItem.classList.remove("active");
            otherItem.querySelector(".faq-answer").style.maxHeight = null;
        });

        if (!isActive) {
            item.classList.add("active");
            answer.style.maxHeight = answer.scrollHeight + "px";
        }
    });
});

// ==========================================
// ORDER SUBMISSION
// ==========================================
const orderForm = document.getElementById("orderForm");
if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if(!currentUser || !token) return;
        
        const submitBtn = document.getElementById("submitOrderBtn");
        submitBtn.textContent = "Submitting...";
        
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: document.getElementById("orderName").value,
                    email: currentUser.email,
                    package: document.getElementById("orderPackage").value,
                    details: document.getElementById("orderDetails").value
                })
            });
            const data = await res.json();

            if (res.ok) {
                window.customAlert("Web request submitted successfully! Auto-downloading invoice...");
                closeModal(orderModal);
                orderForm.reset();
                
                // Set price based on selected package dynamically from database
                let price = "Contact Us";
                const selectedPkgName = data.package;
                if (window.allPackages) {
                    const matched = window.allPackages.find(p => p.name === selectedPkgName);
                    if (matched) price = matched.price;
                }
                
                if (window.downloadInvoicePDF) {
                    window.downloadInvoicePDF(data, price);
                }
            } else {
                window.customAlert(data.message || "Failed to submit request", true);
            }
        } catch (err) {
            window.customAlert("Error submitting request: " + err.message, true);
        }
        submitBtn.textContent = "Submit Request";
    });
}

// ==========================================
// INITIALIZE
// ==========================================
async function init() {
    const isDbConnected = await checkDB();
    if (!isDbConnected) return;

    hideLoadingScreen();

    if (window.loadThemeSettings) window.loadThemeSettings();
    restoreSession();
    setupTrackOrder();

    Promise.all([
        loadContent(),
        loadPackages(),
        loadProjects()
    ]).catch(err => console.error("Error loading homepage elements:", err));
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
