import { checkDB, hideLoadingScreen } from './db-check.js';

async function initPolicyPage() {
    const isDbConnected = await checkDB();
    if (!isDbConnected) return;

    // Detect which policy page we are on
    const path = window.location.pathname;
    let key = '';
    let defaultTitle = '';
    let defaultContent = '';

    if (path.includes('terms.html')) {
        key = 'page-terms';
        defaultTitle = 'Terms & Conditions';
        defaultContent = `
            <h2>1. Agreement to Terms</h2>
            <p>Welcome to Blackleaf Studio. By accessing our website and placing requests for our web design and development services, you agree to be bound by these terms. If you do not agree, please do not use our services.</p>
            <h2>2. Web Development Services</h2>
            <p>We provide professional design, custom coding, and optimization packages. Deliverables are created in accordance with selected tier plans. Specific custom milestones may be outlined separately.</p>
            <h2>3. Payments and Billing</h2>
            <p>Payments must be completed as per invoice structures. System-generated invoices will be automatically sent upon request submissions.</p>
        `;
    } else if (path.includes('privacy.html')) {
        key = 'page-privacy';
        defaultTitle = 'Privacy Policy';
        defaultContent = `
            <h2>1. Information We Collect</h2>
            <p>We collect your email, name, phone number, and project details to coordinate service deliveries, manage client dashboard access, and process billing invoices.</p>
            <h2>2. How We Use Information</h2>
            <p>Your details are used solely to generate projects, manage authentication (via Firebase Google Sign-In or local secure email/passwords), and communicate progress tracking statuses.</p>
            <h2>3. Secure Authentication</h2>
            <p>We do not store passwords in plain-text. Passwords are securely hashed before DB storage. Social authentication is managed by Google Firebase.</p>
        `;
    } else if (path.includes('refund.html')) {
        key = 'page-refund';
        defaultTitle = 'Refund Policy';
        defaultContent = `
            <h2>1. Satisfaction Guarantee</h2>
            <p>We strive to deliver exceptional design quality. You can request changes during the Figma wireframing blueprint phase.</p>
            <h2>2. Refund Eligibility</h2>
            <p>Refunds are eligible up to the design phase. Once HTML/CSS coding phase has started, refunds are not issued due to the resource allocation and custom work completed.</p>
            <h2>3. Requesting a Refund</h2>
            <p>To request a refund, please contact support via email or start a message thread from your client profile dashboard.</p>
        `;
    }

    if (key) {
        try {
            const res = await fetch(`/api/content/${key}`);
            if (res.ok) {
                const data = await res.json();
                const titleEl = document.getElementById('policy-title');
                const contentEl = document.getElementById('policy-content');
                if (titleEl) titleEl.innerHTML = data.title || defaultTitle;
                if (contentEl) contentEl.innerHTML = data.desc || defaultContent;
            } else {
                const titleEl = document.getElementById('policy-title');
                const contentEl = document.getElementById('policy-content');
                if (titleEl) titleEl.innerHTML = defaultTitle;
                if (contentEl) contentEl.innerHTML = defaultContent;
            }
        } catch (err) {
            console.error("Failed to fetch policy page", err);
            const titleEl = document.getElementById('policy-title');
            const contentEl = document.getElementById('policy-content');
            if (titleEl) titleEl.innerHTML = defaultTitle;
            if (contentEl) contentEl.innerHTML = defaultContent;
        }
    }

    hideLoadingScreen();
}

document.addEventListener('DOMContentLoaded', initPolicyPage);
