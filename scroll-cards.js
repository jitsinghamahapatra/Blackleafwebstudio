/**
 * scroll-cards.js
 * Bi-directional scroll animation for the "How it Works" process step cards.
 *
 * Mirrors Framer Motion behaviour:
 *   - Scroll IN  → card animates from y:300 to y:50, rotate: -10  (spring bounce)
 *   - Scroll OUT → card reverses back to y:300, rotate: 0          (eases out)
 *
 * Uses IntersectionObserver (threshold: 0.45, matching ~amount:0.8 feel for
 * taller text cards) + Web Animations API with fill:"both" to hold end state.
 */

const SPRING_IN = {
    keyframes: [
        { transform: "translateY(300px) rotate(0deg)", opacity: 0 },
        { transform: "translateY(50px)  rotate(-10deg)", opacity: 1 },
    ],
    options: {
        duration: 800,
        easing: "cubic-bezier(0.25, 0.46, 0.08, 1.22)", // overshoot spring
        fill: "both",
    },
};

const SPRING_OUT = {
    keyframes: [
        { transform: "translateY(50px)  rotate(-10deg)", opacity: 1 },
        { transform: "translateY(300px) rotate(0deg)", opacity: 0 },
    ],
    options: {
        duration: 500,
        easing: "cubic-bezier(0.55, 0, 1, 0.45)", // ease-in collapse
        fill: "both",
    },
};

// Track running animations so we can cancel mid-flight
const runningAnim = new WeakMap();

function animateCard(card, direction) {
    // Cancel any in-progress animation
    const prev = runningAnim.get(card);
    if (prev) prev.cancel();

    const { keyframes, options } = direction === "in" ? SPRING_IN : SPRING_OUT;
    const anim = card.animate(keyframes, options);
    runningAnim.set(card, anim);
}

function init() {
    const wrappers = document.querySelectorAll("[data-step-card]");
    if (!wrappers.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const card = entry.target.querySelector(".process-card");
                if (!card) return;

                if (entry.isIntersecting) {
                    animateCard(card, "in");
                } else {
                    animateCard(card, "out");
                }
            });
        },
        {
            // 0.45 fires reliably for these taller text cards
            threshold: 0.45,
        }
    );

    wrappers.forEach((wrapper) => {
        // Set initial hidden state immediately (no flash of visible content)
        const card = wrapper.querySelector(".process-card");
        if (card) {
            card.style.transform = "translateY(300px) rotate(0deg)";
            card.style.opacity = "0";
        }
        observer.observe(wrapper);
    });
}

init();
