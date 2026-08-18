// Custom Alert
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

// DOM Elements
const adminPanelWrapper = document.getElementById("adminPanelWrapper");
const adminLoginPrompt = document.getElementById("adminLoginPrompt");
const adminLogout = document.getElementById("adminLogout");

// ==========================================
// TABS LOGIC (Sidebar + Mobile Bar)
// ==========================================
const navItems = document.querySelectorAll(".nav-item");
const mobileTabs = document.querySelectorAll(".mobile-tab");
const tabPanes = document.querySelectorAll(".tab-pane");

function switchTab(targetId) {
    navItems.forEach(n => n.classList.remove("active"));
    mobileTabs.forEach(t => t.classList.remove("active"));
    tabPanes.forEach(t => t.classList.remove("active"));

    navItems.forEach(n => {
        if (n.dataset.target === targetId) n.classList.add("active");
    });
    mobileTabs.forEach(t => {
        if (t.dataset.target === targetId) t.classList.add("active");
    });
    document.getElementById(targetId).classList.add("active");
}

navItems.forEach(item => {
    item.addEventListener("click", () => switchTab(item.dataset.target));
});

mobileTabs.forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.target));
});


// ==========================================
// AUTH CHECK & PAGE INITIALIZATION
// ==========================================
let token = localStorage.getItem("token");

async function checkAdminAccess() {
    if (!token) {
        redirectToLiveSite();
        return;
    }

    try {
        const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.success && data.user.role === 'admin') {
            adminLoginPrompt.style.display = "none";
            adminPanelWrapper.style.display = "flex";
            
            // Initial Loads
            loadOrders();
            loadHeroContent();
            loadPackagesAdmin();
            loadProjectsAdmin();
            loadMessagesAdmin();
        } else {
            redirectToLiveSite();
        }
    } catch (err) {
        console.error("Admin check failed", err);
        redirectToLiveSite();
    }
}

function redirectToLiveSite() {
    adminLoginPrompt.innerHTML = "<h2>Access Denied. Redirecting to Live Site...</h2>";
    setTimeout(() => {
        window.location.href = "index.html";
    }, 2000);
}

adminLogout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
});


// ==========================================
// ORDERS / REQUESTS LOGIC
// ==========================================
const ordersTbody = document.getElementById("ordersTbody");
const mobileOrdersList = document.getElementById("mobileOrdersList");

async function loadOrders() {
    try {
        const res = await fetch("/api/orders", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const orders = await res.json();
        
        ordersTbody.innerHTML = "";
        mobileOrdersList.innerHTML = "";
        
        if (orders.length === 0) {
            ordersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">No requests yet.</td></tr>`;
            mobileOrdersList.innerHTML = `<p style="text-align:center; padding:20px; opacity:0.6;">No requests yet.</p>`;
            return;
        }

        orders.forEach((data) => {
            const dateStr = data.timestamp ? new Date(data.timestamp).toLocaleString() : "Unknown";
            
            // Desktop Row
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${data.email}</td>
                <td><strong>${data.package}</strong></td>
                <td>${data.details}</td>
                <td><span class="status-badge ${data.status === 'Completed' ? 'status-completed' : 'status-pending'}">${data.status}</span></td>
                <td>
                    <div style="display:flex; gap:5px; flex-wrap:wrap;">
                        <button class="btn-edit btn-mark" data-id="${data._id}" data-status="${data.status}">
                            ${data.status === 'Pending' ? 'Mark Done' : 'Mark Pending'}
                        </button>
                        <button class="btn-delete btn-del-order" data-id="${data._id}">Delete</button>
                    </div>
                </td>
            `;
            ordersTbody.appendChild(tr);

            // Mobile Card
            const card = document.createElement("div");
            card.className = "mobile-order-card";
            card.innerHTML = `
                <div class="order-field"><strong>Date:</strong> ${dateStr}</div>
                <div class="order-field"><strong>Email:</strong> ${data.email}</div>
                <div class="order-field"><strong>Pkg:</strong> ${data.package}</div>
                <div class="order-field"><strong>Details:</strong> ${data.details}</div>
                <div class="order-field">
                    <span class="status-badge ${data.status === 'Completed' ? 'status-completed' : 'status-pending'}">${data.status}</span>
                </div>
                <div class="order-actions">
                    <button class="btn-edit btn-mark" data-id="${data._id}" data-status="${data.status}">
                        ${data.status === 'Pending' ? 'Mark Done' : 'Mark Pending'}
                    </button>
                    <button class="btn-delete btn-del-order" data-id="${data._id}">Delete</button>
                </div>
            `;
            mobileOrdersList.appendChild(card);
        });

        // Add action listeners
        document.querySelectorAll(".btn-mark").forEach(btn => {
            btn.addEventListener("click", () => {
                toggleOrderStatus(btn.getAttribute("data-id"), btn.getAttribute("data-status"));
            });
        });
        document.querySelectorAll(".btn-del-order").forEach(btn => {
            btn.addEventListener("click", () => {
                deleteOrder(btn.getAttribute("data-id"));
            });
        });

    } catch(err) {
        console.error("Error loading orders:", err);
        window.customAlert("Error loading orders", true);
    }
}

async function toggleOrderStatus(id, currentStatus) {
    try {
        const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
        const res = await fetch(`/api/orders/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            loadOrders();
            window.customAlert("Order status updated.");
        } else {
            window.customAlert("Failed to update status", true);
        }
    } catch (err) {
        window.customAlert("Error updating order", true);
    }
}

async function deleteOrder(id) {
    if(confirm("Delete this request?")) {
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                loadOrders();
                window.customAlert("Order deleted.");
            } else {
                window.customAlert("Failed to delete order", true);
            }
        } catch (err) {
            window.customAlert("Error deleting order", true);
        }
    }
}


// ==========================================
// HERO CONTENT LOGIC
// ==========================================
const heroForm = document.getElementById("heroForm");
const adminHeroPrice = document.getElementById("adminHeroPrice");
const adminHeroTitle = document.getElementById("adminHeroTitle");
const adminHeroDesc = document.getElementById("adminHeroDesc");
const adminHeroImg = document.getElementById("adminHeroImg");

async function loadHeroContent() {
    try {
        const res = await fetch("/api/content/hero");
        if (res.ok) {
            const data = await res.json();
            adminHeroPrice.value = data.priceTag || "";
            adminHeroTitle.value = data.title || "";
            adminHeroDesc.value = data.desc || "";
            adminHeroImg.value = data.img || "";
        }
    } catch(err) {
        console.error("Error loading hero content:", err);
    }
}

if (heroForm) {
    heroForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/content/hero", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    priceTag: adminHeroPrice.value,
                    title: adminHeroTitle.value,
                    desc: adminHeroDesc.value,
                    img: adminHeroImg.value
                })
            });
            if (res.ok) {
                window.customAlert("Hero Content Updated Successfully!");
            } else {
                window.customAlert("Failed to save hero content", true);
            }
        } catch (err) {
            window.customAlert("Error saving hero content", true);
        }
    });
}


// ==========================================
// PACKAGES LOGIC
// ==========================================
const addPackageForm = document.getElementById("addPackageForm");
const packagesList = document.getElementById("packagesList");
const pkgFormTitle = document.getElementById("pkgFormTitle");
const pkgSubmitBtn = document.getElementById("pkgSubmitBtn");
const pkgCancelEdit = document.getElementById("pkgCancelEdit");
let editingPackageId = null;

async function loadPackagesAdmin() {
    try {
        const res = await fetch("/api/packages");
        const packages = await res.json();
        packagesList.innerHTML = "";

        if (packages.length === 0) {
            packagesList.innerHTML = `<p style="opacity:0.6;">No packages yet. Add one above.</p>`;
            return;
        }

        packages.forEach((data) => {
            const card = document.createElement("div");
            card.className = "admin-card";
            card.innerHTML = `
                ${data.img ? `<img src="${data.img}" alt="${data.name}">` : ''}
                <h4>${data.name} <span style="color: var(--accent-brown);">${data.price}</span></h4>
                <p style="font-size:0.8rem; opacity:0.7;">${(data.features || []).join(", ")}</p>
                <p style="font-size:0.7rem; opacity:0.4; margin-top:5px;">ID: ${data._id}</p>
                <div class="admin-card-actions">
                    <button class="btn-edit edit-pkg-btn" data-id="${data._id}"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="btn-delete del-pkg-btn" data-id="${data._id}"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            `;
            packagesList.appendChild(card);
        });

        // Set action handlers
        document.querySelectorAll(".edit-pkg-btn").forEach(btn => {
            btn.addEventListener("click", () => editPackage(btn.getAttribute("data-id")));
        });
        document.querySelectorAll(".del-pkg-btn").forEach(btn => {
            btn.addEventListener("click", () => deletePackage(btn.getAttribute("data-id")));
        });

    } catch(err) {
        console.error("Error loading packages:", err);
    }
}

async function editPackage(id) {
    try {
        const res = await fetch("/api/packages");
        const packages = await res.json();
        const data = packages.find(p => p._id === id);

        if (data) {
            document.getElementById("pkgId").value = id;
            document.getElementById("pkgId").disabled = true;
            document.getElementById("pkgName").value = data.name || "";
            document.getElementById("pkgPrice").value = data.price || "";
            document.getElementById("pkgImg").value = data.img || "";
            document.getElementById("pkgFeatures").value = (data.features || []).join(", ");
            
            editingPackageId = id;
            pkgFormTitle.textContent = "Edit Package";
            pkgSubmitBtn.textContent = "Update Package";
            pkgCancelEdit.style.display = "inline-block";
            addPackageForm.classList.add("form-editing");
            
            addPackageForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    } catch (err) {
        window.customAlert("Error loading package data", true);
    }
}

function resetPackageForm() {
    addPackageForm.reset();
    document.getElementById("pkgId").disabled = false;
    editingPackageId = null;
    pkgFormTitle.textContent = "Add New Package";
    pkgSubmitBtn.textContent = "Save Package";
    pkgCancelEdit.style.display = "none";
    addPackageForm.classList.remove("form-editing");
}

if (pkgCancelEdit) pkgCancelEdit.addEventListener("click", resetPackageForm);

if (addPackageForm) {
    addPackageForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = editingPackageId || document.getElementById("pkgId").value;
        const name = document.getElementById("pkgName").value;
        const price = document.getElementById("pkgPrice").value;
        const img = document.getElementById("pkgImg").value || "";
        const featuresRaw = document.getElementById("pkgFeatures").value;
        const features = featuresRaw.split(",").map(f => f.trim()).filter(f => f);

        try {
            let res;
            if (editingPackageId) {
                // PUT request for editing
                res = await fetch(`/api/packages/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, price, img, features })
                });
            } else {
                // POST request for adding new
                res = await fetch("/api/packages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ id, name, price, img, features })
                });
            }

            if (res.ok) {
                window.customAlert(editingPackageId ? "Package updated!" : "Package saved!");
                resetPackageForm();
                loadPackagesAdmin();
            } else {
                window.customAlert("Failed to save package", true);
            }
        } catch (err) {
            window.customAlert("Error saving package", true);
        }
    });
}

async function deletePackage(id) {
    if(confirm("Delete this package?")) {
        try {
            const res = await fetch(`/api/packages/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                loadPackagesAdmin();
                window.customAlert("Package deleted");
            } else {
                window.customAlert("Failed to delete package", true);
            }
        } catch (err) {
            window.customAlert("Error deleting package", true);
        }
    }
}


// ==========================================
// PROJECTS / RECENT WORKS LOGIC
// ==========================================
const addProjectForm = document.getElementById("addProjectForm");
const projectsList = document.getElementById("projectsList");
const projFormTitle = document.getElementById("projFormTitle");
const projSubmitBtn = document.getElementById("projSubmitBtn");
const projCancelEdit = document.getElementById("projCancelEdit");
let editingProjectId = null;

async function loadProjectsAdmin() {
    try {
        const res = await fetch("/api/projects");
        const projects = await res.json();
        projectsList.innerHTML = "";

        if (projects.length === 0) {
            projectsList.innerHTML = `<p style="opacity:0.6;">No projects yet. Add one above.</p>`;
            return;
        }

        projects.forEach((data) => {
            // Check preview image url (if blank, show screenshot)
            const previewImgUrl = data.img ? data.img : `https://api.microlink.io/?url=${encodeURIComponent(data.link)}&screenshot=true&embed=screenshot.url`;

            const card = document.createElement("div");
            card.className = "admin-card";
            card.innerHTML = `
                <img src="${previewImgUrl}" alt="${data.title}" onerror="this.src='/images/image1.png'">
                <p><strong>${data.title}</strong></p>
                ${data.desc ? `<p style="font-size:0.8rem; opacity:0.7;">${data.desc}</p>` : ''}
                <a href="${data.link}" target="_blank" style="font-size:0.8rem; color: var(--ink-blue);">View Link <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.7rem;"></i></a>
                <div class="admin-card-actions">
                    <button class="btn-edit edit-proj-btn" data-id="${data._id}"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="btn-delete del-proj-btn" data-id="${data._id}"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            `;
            projectsList.appendChild(card);
        });

        // Set action handlers
        document.querySelectorAll(".edit-proj-btn").forEach(btn => {
            btn.addEventListener("click", () => editProject(btn.getAttribute("data-id")));
        });
        document.querySelectorAll(".del-proj-btn").forEach(btn => {
            btn.addEventListener("click", () => deleteProject(btn.getAttribute("data-id")));
        });

    } catch(err) {
        console.error("Error loading projects:", err);
    }
}

async function editProject(id) {
    try {
        const res = await fetch("/api/projects");
        const projects = await res.json();
        const data = projects.find(p => p._id === id);

        if (data) {
            document.getElementById("projTitle").value = data.title || "";
            document.getElementById("projDesc").value = data.desc || "";
            document.getElementById("projImg").value = data.img || "";
            document.getElementById("projLink").value = data.link || "";
            
            editingProjectId = id;
            projFormTitle.textContent = "Edit Project";
            projSubmitBtn.textContent = "Update Project";
            projCancelEdit.style.display = "inline-block";
            addProjectForm.classList.add("form-editing");
            
            addProjectForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    } catch (err) {
        window.customAlert("Error loading project data", true);
    }
}

function resetProjectForm() {
    addProjectForm.reset();
    editingProjectId = null;
    projFormTitle.textContent = "Add New Project";
    projSubmitBtn.textContent = "Add Project";
    projCancelEdit.style.display = "none";
    addProjectForm.classList.remove("form-editing");
}

if (projCancelEdit) projCancelEdit.addEventListener("click", resetProjectForm);

if (addProjectForm) {
    addProjectForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("projTitle").value;
        const desc = document.getElementById("projDesc").value;
        const img = document.getElementById("projImg").value || "";
        const link = document.getElementById("projLink").value;

        try {
            let res;
            if (editingProjectId) {
                res = await fetch(`/api/projects/${editingProjectId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, desc, img, link })
                });
            } else {
                res = await fetch("/api/projects", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, desc, img, link })
                });
            }

            if (res.ok) {
                window.customAlert(editingProjectId ? "Project updated!" : "Project added!");
                resetProjectForm();
                loadProjectsAdmin();
            } else {
                window.customAlert("Failed to save project", true);
            }
        } catch (err) {
            window.customAlert("Error saving project", true);
        }
    });
}

async function deleteProject(id) {
    if(confirm("Delete this project?")) {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                loadProjectsAdmin();
                window.customAlert("Project deleted!");
            } else {
                window.customAlert("Failed to delete project", true);
            }
        } catch (err) {
            window.customAlert("Error deleting project", true);
        }
    }
}


// ==========================================
// MESSAGES & CONVERSATIONS LOGIC
// ==========================================
const messagesTableBody = document.getElementById("messagesTableBody");
const replyMessageModal = document.getElementById("replyMessageModal");
const closeReplyMessageModal = document.getElementById("closeReplyMessageModal");
const replyModalThreadHistory = document.getElementById("replyModalThreadHistory");
const adminReplyForm = document.getElementById("adminReplyForm");
const adminReplyText = document.getElementById("adminReplyText");
const replyMessageId = document.getElementById("replyMessageId");
const replyModalHeader = document.getElementById("replyModalHeader");

let currentActiveMessage = null;

async function loadMessagesAdmin() {
    if (!token) return;
    try {
        const res = await fetch("/api/messages", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const messages = await res.json();
        renderMessagesAdmin(messages);
    } catch (err) {
        console.error("Error loading admin messages", err);
    }
}

function renderMessagesAdmin(messages) {
    if (!messagesTableBody) return;
    if (!messages || messages.length === 0) {
        messagesTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; opacity:0.6;">No messages found.</td></tr>`;
        return;
    }

    messagesTableBody.innerHTML = messages.map(msg => {
        const dateStr = new Date(msg.timestamp).toLocaleDateString();
        const isReplied = msg.status === "Replied";
        const badgeBg = isReplied ? "#e1ffd4" : "#ffe4cc";
        
        // Pulse unread badge if message is open or readByAdmin is false
        const unreadLabel = !msg.readByAdmin ? `<span style="display:inline-block; width:8px; height:8px; background:#ff0055; border-radius:50%; margin-right:8px;" title="Unread Message"></span>` : "";

        return `
            <tr>
                <td>${dateStr}</td>
                <td style="font-weight:bold; display: flex; align-items: center; border: none; padding-top: 15px;">${unreadLabel}${msg.name}</td>
                <td>${msg.email}</td>
                <td>${msg.subject}</td>
                <td><span class="status-badge" style="background:${badgeBg}; padding:2px 8px; border:1px solid var(--ink-black); font-weight:bold; font-size:0.75rem; text-transform:uppercase;">${msg.status}</span></td>
                <td>
                    <button class="btn-request btn-reply-message" data-id="${msg._id}" style="padding:4px 10px; font-size:0.75rem; cursor:pointer;">View / Reply</button>
                </td>
            </tr>
        `;
    }).join("");

    // Wire up reply buttons
    messagesTableBody.querySelectorAll(".btn-reply-message").forEach(btn => {
        btn.addEventListener("click", () => {
            const msgId = btn.dataset.id;
            openReplyModal(msgId);
        });
    });
}

async function openReplyModal(msgId) {
    if (!token) return;
    try {
        const res = await fetch("/api/messages", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const messages = await res.json();
        const msg = messages.find(m => m._id === msgId);
        if (!msg) return;

        currentActiveMessage = msg;
        replyMessageId.value = msg._id;
        replyModalHeader.innerHTML = `Conversation thread with <strong>${msg.name}</strong> (${msg.email})`;
        adminReplyText.value = "";
        
        // Render thread history
        renderThreadHistory(msg);
        
        // Open Modal
        replyMessageModal.classList.add("active");

        // Mark as read by admin if unread
        if (!msg.readByAdmin) {
            await fetch(`/api/messages/${msg._id}/read`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadMessagesAdmin(); // Refresh unread count indicator list
        }
    } catch (e) {
        console.error("Failed to open reply modal", e);
    }
}

function renderThreadHistory(msg) {
    if (!replyModalThreadHistory) return;
    
    let historyHtml = `
        <div style="padding-bottom:10px; border-bottom:1px dashed #ccc; margin-bottom:10px;">
            <small style="font-weight:bold; color:var(--ink-black);">${msg.name} (Client):</small>
            <p style="font-size:0.85rem; margin:2px 0; color:var(--ink-black); font-weight:bold;">${msg.message}</p>
            <small style="opacity:0.6; font-size:0.7rem;">${new Date(msg.timestamp).toLocaleString()}</small>
        </div>
    `;

    if (msg.replies && msg.replies.length > 0) {
        historyHtml += msg.replies.map(reply => {
            const isAdmin = reply.sender === "admin";
            const senderLabel = isAdmin ? "You (Admin)" : `${msg.name} (Client)`;
            const labelColor = isAdmin ? "#ff0055" : "#0066ff";
            return `
                <div style="padding-left:10px; border-left:2px solid ${labelColor}; margin-bottom:10px;">
                    <small style="font-weight:bold; color:${labelColor};">${senderLabel}:</small>
                    <p style="font-size:0.85rem; margin:2px 0; color:var(--ink-black);">${reply.text}</p>
                    <small style="opacity:0.6; font-size:0.7rem;">${new Date(reply.timestamp).toLocaleString()}</small>
                </div>
            `;
        }).join("");
    } else {
        historyHtml += `<p style="font-size:0.8rem; opacity:0.6; font-style:italic; text-align:center;">No responses sent yet.</p>`;
    }

    replyModalThreadHistory.innerHTML = historyHtml;
    // Auto scroll to bottom
    replyModalThreadHistory.scrollTop = replyModalThreadHistory.scrollHeight;
}

// Close Modal Event
if (closeReplyMessageModal) {
    closeReplyMessageModal.addEventListener("click", () => {
        replyMessageModal.classList.remove("active");
        currentActiveMessage = null;
    });
}

// Admin Reply Form Submission
if (adminReplyForm) {
    adminReplyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msgId = replyMessageId.value;
        const text = adminReplyText.value;
        if (!token || !msgId || !text) return;

        try {
            const res = await fetch(`/api/messages/${msgId}/reply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                window.customAlert("Reply sent successfully!");
                adminReplyText.value = "";
                
                // Refresh modal history
                currentActiveMessage = data.message;
                renderThreadHistory(currentActiveMessage);
                
                // Reload messages list
                loadMessagesAdmin();
            } else {
                window.customAlert(data.message || "Failed to send reply", true);
            }
        } catch (err) {
            window.customAlert("Error sending reply", true);
        }
    });
}


// Check admin session on startup
checkAdminAccess();
