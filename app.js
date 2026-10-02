// app.js - Public Site Interactions, Secret Sequence Handler & App Core for White Birdie Badminton Academy

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

let secretStepProgress = 0;
const SECRET_STEPS_TOTAL = 4;

async function initApp() {
    console.log("🏸 White Birdie Badminton Academy Initializing...");

    // Initialize Firebase service
    if (window.wbFirebaseService) {
        await window.wbFirebaseService.init();

        // Listen to auth changes
        window.wbFirebaseService.onAuthStateChange(({ user, role }) => {
            updateAuthUI(user, role);
            if (user && window.wbCoachPortal) {
                window.wbCoachPortal.init();
            }
        });
    }

    setupNavigation();
    setupSecretSequence();
    setupPublicRegistrationForm();
    setupModals();
    setupPhotoUploadPreview();
    initToastSystem();
}

// ================= TOAST NOTIFICATION SYSTEM =================
function initToastSystem() {
    // Create toast container if it doesn't exist
    if (!document.getElementById("toast-container")) {
        const container = document.createElement("div");
        container.id = "toast-container";
        container.className = "fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none";
        document.body.appendChild(container);
    }
}

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) {
        console.warn("Toast container not found");
        return;
    }

    const toast = document.createElement("div");
    toast.className = "pointer-events-auto transform translate-x-full transition-transform duration-300 ease-out";

    const bgColors = {
        success: "bg-emerald-950/95 border-emerald-500/50",
        error: "bg-rose-950/95 border-rose-500/50",
        warning: "bg-amber-950/95 border-amber-500/50",
        info: "bg-slate-950/95 border-slate-500/50"
    };

    const textColors = {
        success: "text-emerald-300",
        error: "text-rose-300",
        warning: "text-amber-300",
        info: "text-slate-300"
    };

    const icons = {
        success: "✓",
        error: "✗",
        warning: "⚠",
        info: "ℹ"
    };

    toast.innerHTML = `
        <div class="px-4 py-3 rounded-xl ${bgColors[type]} border backdrop-blur-md shadow-2xl flex items-start gap-3 min-w-[280px] max-w-md">
            <span class="text-lg font-bold ${textColors[type]} flex-shrink-0">${icons[type]}</span>
            <p class="text-sm ${textColors[type]} flex-1 leading-relaxed">${message}</p>
            <button onclick="this.closest('.transform').remove()" class="text-slate-400 hover:text-white transition flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `;

    container.appendChild(toast);

    // Slide in
    setTimeout(() => {
        toast.classList.remove("translate-x-full");
        toast.classList.add("translate-x-0");
    }, 10);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        toast.classList.add("translate-x-full");
        toast.classList.remove("translate-x-0");
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// In-App Confirm Dialog (Replaces native browser confirm())
function showConfirmModal({ title = "Confirm Action", message = "Are you sure you want to proceed?", confirmText = "Confirm", cancelText = "Cancel", isDanger = false, onConfirm, onCancel }) {
    const existing = document.getElementById("in-app-confirm-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "in-app-confirm-modal";
    modal.className = "fixed inset-0 z-[110] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4";
    modal.innerHTML = `
        <div class="glass-card rounded-3xl max-w-md w-full border ${isDanger ? 'border-rose-500/50' : 'border-emerald-500/40'} shadow-2xl relative overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl ${isDanger ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'} flex items-center justify-center text-2xl flex-shrink-0">
                    ${isDanger ? '⚠️' : '❓'}
                </div>
                <div>
                    <h3 class="font-heading font-bold text-lg text-white">${title}</h3>
                    <p class="text-xs text-slate-400 mt-0.5">Please confirm your decision</p>
                </div>
            </div>

            <p class="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                ${message}
            </p>

            <div class="flex items-center justify-end gap-3 pt-2">
                <button type="button" id="confirm-modal-cancel" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                    ${cancelText}
                </button>
                <button type="button" id="confirm-modal-ok" class="px-5 py-2.5 rounded-xl ${isDanger ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'} text-white text-xs font-bold shadow-lg transition">
                    ${confirmText}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
        modal.classList.add("opacity-0");
        setTimeout(() => modal.remove(), 200);
    };

    document.getElementById("confirm-modal-cancel").addEventListener("click", () => {
        closeModal();
        if (typeof onCancel === "function") onCancel();
    });

    document.getElementById("confirm-modal-ok").addEventListener("click", () => {
        closeModal();
        if (typeof onConfirm === "function") onConfirm();
    });
}

window.showToast = showToast;
window.showConfirmModal = showConfirmModal;

// ================= AUTH UI STATE =================
function updateAuthUI(user, role) {
    const portalContainer = document.getElementById("coach-portal-screen");
    const publicContainer = document.getElementById("public-website-screen");
    const navCoachBtn = document.getElementById("nav-coach-portal-btn");

    if (user) {
        // User logged in
        if (navCoachBtn) {
            navCoachBtn.innerHTML = `<span>🏸 Coach Portal (${user.displayName.split(' ')[0]})</span>`;
            navCoachBtn.classList.remove("hidden");
        }
    } else {
        // User logged out
        if (portalContainer && !portalContainer.classList.contains("hidden")) {
            portalContainer.classList.add("hidden");
            if (publicContainer) publicContainer.classList.remove("hidden");
        }
    }
}

// ================= SECRET CLICK TRIGGER (3 Clicks on "Mentorship & Excellence") =================
let secretClickCount = 0;
let secretClickTimer = null;

function setupSecretSequence() {
    // 3 clicks on "Mentorship & Excellence" badge to open coach login
    const mentorshipBadges = document.querySelectorAll(".secret-trigger-mentorship");
    mentorshipBadges.forEach(el => {
        el.addEventListener("click", () => {
            secretClickCount++;
            clearTimeout(secretClickTimer);

            // Visual feedback
            el.classList.add("scale-105");
            setTimeout(() => el.classList.remove("scale-105"), 200);

            if (secretClickCount === 1) {
                showSecretNotification("✨ 1/3 clicks...");
            } else if (secretClickCount === 2) {
                showSecretNotification("✨ 2/3 clicks...");
            } else if (secretClickCount >= 3) {
                secretClickCount = 0;
                if (typeof confetti !== "undefined") {
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                }
                showSecretNotification("✨ Access unlocked! Opening Coach Login...");
                setTimeout(() => {
                    openCoachLoginModal();
                }, 300);
            }

            // Reset counter after 2 seconds of inactivity
            secretClickTimer = setTimeout(() => {
                secretClickCount = 0;
            }, 2000);
        });
    });

    // Also support keyboard shortcut: Ctrl + Shift + K (K for Krishna)
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === "K" || e.key === "k")) {
            e.preventDefault();
            showSecretNotification("✨ Secret shortcut triggered! Opening Coach Portal Login...");
            openCoachLoginModal();
        }
    });

    // Discreet footer secret button
    const discreetBtn = document.getElementById("discreet-admin-link");
    if (discreetBtn) {
        discreetBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openCoachLoginModal();
        });
    }
}

function triggerSparkleAnimation(element) {
    element.classList.add("sequence-spark");
    setTimeout(() => {
        element.classList.remove("sequence-spark");
    }, 800);
}

function showSecretNotification(message) {
    let toast = document.getElementById("secret-sequence-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "secret-sequence-toast";
        toast.className = "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-mono shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove("translate-y-10", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.add("translate-y-10", "opacity-0");
        toast.classList.remove("translate-y-0", "opacity-100");
    }, 2500);
}

// ================= MODALS & COACH PORTAL SWITCHING =================
function showUnauthorizedModal(email) {
    const existingModal = document.getElementById("unauthorized-error-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "unauthorized-error-modal";
    modal.className = "fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4";
    modal.innerHTML = `
        <div class="glass-card rounded-3xl max-w-md w-full border-2 border-rose-500/60 shadow-2xl relative overflow-hidden p-6 md:p-8 space-y-6">
            <div class="text-center">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-3xl shadow-lg shadow-rose-500/30 mx-auto mb-3">
                    🔒
                </div>
                <h3 class="font-heading font-black text-2xl text-white">Access Denied</h3>
                <p class="text-xs text-rose-400 mt-1">Unauthorized Gmail Account</p>
            </div>

            <div class="px-4 py-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-3">
                <p class="text-sm text-rose-200 leading-relaxed">
                    The Google account <span class="font-bold font-mono text-rose-100">${email}</span> is not authorized to access White Birdie Badminton Academy portal.
                </p>
                <p class="text-xs text-slate-300 leading-relaxed">
                    Please contact <span class="font-bold text-amber-300">Master Admin Siddharth Koppu</span> at <span class="font-mono text-emerald-300">siddharthkoppu@gmail.com</span> to request access.
                </p>
            </div>

            <div class="pt-2 text-center">
                <button onclick="document.getElementById('unauthorized-error-modal').remove()" class="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition">
                    Close and Return
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function openCoachLoginModal() {
    const modal = document.getElementById("coach-login-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeCoachLoginModal() {
    const modal = document.getElementById("coach-login-modal");
    if (modal) modal.classList.add("hidden");
}

function openCoachPortal() {
    const publicScreen = document.getElementById("public-website-screen");
    const portalScreen = document.getElementById("coach-portal-screen");

    if (publicScreen && portalScreen) {
        publicScreen.classList.add("hidden");
        portalScreen.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (window.wbCoachPortal) {
            window.wbCoachPortal.init();
        }
    }
}

function exitCoachPortal() {
    const publicScreen = document.getElementById("public-website-screen");
    const portalScreen = document.getElementById("coach-portal-screen");

    if (publicScreen && portalScreen) {
        portalScreen.classList.add("hidden");
        publicScreen.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function setupModals() {
    // Coach login modal close
    const btnCloseLogin = document.getElementById("btn-close-coach-login");
    if (btnCloseLogin) btnCloseLogin.addEventListener("click", closeCoachLoginModal);

    // PIN Sign-In button
    const btnPinSignIn = document.getElementById("btn-pin-signin");
    const pinInput = document.getElementById("coach-pin-input");
    if (btnPinSignIn && pinInput) {
        btnPinSignIn.addEventListener("click", async () => {
            const enteredPin = pinInput.value.trim();
            if (!enteredPin || enteredPin.length !== 4) {
                showToast("Please enter a 4-digit PIN", "error");
                return;
            }

            try {
                const result = await window.wbFirebaseService.verifyCoachPIN(enteredPin);
                if (result) {
                    showToast("✓ PIN verified! Welcome, Coach!", "success");
                    closeCoachLoginModal();
                    openCoachPortal();
                    pinInput.value = "";
                } else {
                    showToast("✗ Invalid PIN. Try again or use Google Sign-In.", "error");
                    pinInput.value = "";
                }
            } catch (e) {
                showToast("PIN verification error: " + e.message, "error");
            }
        });

        // Allow Enter key to submit PIN
        pinInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                btnPinSignIn.click();
            }
        });
    }

    // Parent/Student Login buttons (ID and class triggers)
    const btnOpenParentLogin = document.getElementById("btn-open-parent-login");
    if (btnOpenParentLogin) {
        btnOpenParentLogin.addEventListener("click", () => {
            const modal = document.getElementById("parent-login-modal");
            if (modal) modal.classList.remove("hidden");
        });
    }

    const parentTriggers = document.querySelectorAll(".btn-trigger-parent-login");
    parentTriggers.forEach(btn => {
        btn.addEventListener("click", () => {
            const modal = document.getElementById("parent-login-modal");
            if (modal) modal.classList.remove("hidden");
        });
    });

    // Parent Login Modal Close
    const btnCloseParentLogin = document.getElementById("btn-close-parent-login");
    if (btnCloseParentLogin) {
        btnCloseParentLogin.addEventListener("click", () => {
            const modal = document.getElementById("parent-login-modal");
            if (modal) modal.classList.add("hidden");
        });
    }

    // Parent Google Sign-In Button
    const btnParentGoogleAuth = document.getElementById("btn-parent-google-signin");
    if (btnParentGoogleAuth) {
        btnParentGoogleAuth.addEventListener("click", async () => {
            try {
                const res = await window.wbFirebaseService.signInWithGoogle();
                if (res) {
                    const modal = document.getElementById("parent-login-modal");
                    if (modal) modal.classList.add("hidden");
                    openCoachPortal();
                }
            } catch (e) {
                if (e.isUnauthorized) {
                    showUnauthorizedModal(e.email);
                } else {
                    showToast("⚠️ Sign-In Error: " + e.message, "error");
                }
            }
        });
    }

    // Google Sign-In button - Real Firebase Authentication
    const btnGoogleAuth = document.getElementById("btn-google-signin");
    if (btnGoogleAuth) {
        btnGoogleAuth.addEventListener("click", async () => {
            try {
                const res = await window.wbFirebaseService.signInWithGoogle();
                if (res) {
                    closeCoachLoginModal();
                    openCoachPortal();
                }
            } catch (e) {
                if (e.isUnauthorized) {
                    // Show styled error modal for unauthorized users
                    showUnauthorizedModal(e.email);
                } else {
                    showToast("⚠️ Sign-In Error: " + e.message, "error");
                }
            }
        });
    }

    // Nav switch to coach portal
    const navCoachBtn = document.getElementById("nav-coach-portal-btn");
    if (navCoachBtn) {
        navCoachBtn.addEventListener("click", () => {
            if (window.wbFirebaseService.currentUser) {
                openCoachPortal();
            } else {
                openCoachLoginModal();
            }
        });
    }

    // Portal Exit button
    const btnExitPortal = document.getElementById("btn-exit-portal");
    if (btnExitPortal) {
        btnExitPortal.addEventListener("click", exitCoachPortal);
    }

    // Portal Sign Out button
    const btnSignOut = document.getElementById("btn-portal-signout");
    if (btnSignOut) {
        btnSignOut.addEventListener("click", async () => {
            await window.wbFirebaseService.signOut();
            exitCoachPortal();
        });
    }

    // Public Registration Modal
    const btnOpenRegister = document.querySelectorAll(".btn-trigger-register");
    btnOpenRegister.forEach(btn => {
        btn.addEventListener("click", () => {
            const modal = document.getElementById("registration-modal");
            if (modal) modal.classList.remove("hidden");
        });
    });

    const btnCloseRegister = document.getElementById("btn-close-register-modal");
    if (btnCloseRegister) {
        btnCloseRegister.addEventListener("click", () => {
            const modal = document.getElementById("registration-modal");
            if (modal) modal.classList.add("hidden");
        });
    }
}

// ================= PUBLIC REGISTRATION FORM WITH PHOTO =================
let uploadedPhotoDataUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";

function setupPhotoUploadPreview() {
    const photoInput = document.getElementById("reg-player-photo");
    const previewImg = document.getElementById("reg-photo-preview");

    if (photoInput && previewImg) {
        photoInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedPhotoDataUrl = event.target.result;
                    previewImg.src = uploadedPhotoDataUrl;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function setupPublicRegistrationForm() {
    const regForm = document.getElementById("public-registration-form");
    if (!regForm) return;

    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("reg-name").value.trim();
        const phone = document.getElementById("reg-phone").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const age = Number(document.getElementById("reg-age").value);
        const gender = document.getElementById("reg-gender").value;
        const skillLevel = document.getElementById("reg-skill").value;
        const batch = document.getElementById("reg-batch").value;
        const durationMonths = Number(document.getElementById("reg-duration").value);
        const emergencyContact = document.getElementById("reg-emergency").value.trim();
        const medicalNotes = document.getElementById("reg-medical").value.trim();

        if (!name || !phone) {
            showToast("Please fill in Name and Phone Number.", "error");
            return;
        }

        // Calculate end date based on duration
        const today = new Date();
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const newPlayer = {
            id: "wb-p" + (Date.now() % 100000),
            name: name,
            gender: gender || "Male",
            age: age || 12,
            dob: "2014-01-01",
            phone: phone,
            email: email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            emergencyContact: emergencyContact || "Parent/Guardian",
            skillLevel: skillLevel || "Beginner",
            batch: batch,
            durationMonths: durationMonths,
            startDate: today.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            feeStatus: "Pending",
            feeAmount: durationMonths * 3000,
            status: "Pending Approval",
            photoUrl: uploadedPhotoDataUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            totalDays: 0,
            daysPresent: 0,
            medicalNotes: medicalNotes || "None reported.",
            coachNotes: "Newly registered via academy website. Awaiting coach approval.",
            registeredAt: new Date().toISOString()
        };

        // Save to Firebase / LocalStorage
        await window.wbFirebaseService.savePlayer(newPlayer);

        // Hide modal
        const modal = document.getElementById("registration-modal");
        if (modal) modal.classList.add("hidden");

        // Reset form
        regForm.reset();

        // Celebration confetti
        if (typeof confetti !== "undefined") {
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
        }

        // Show confirmation notification
        showToast(`🏸 Registration submitted successfully! Coach Mr. Krishna will review your application and contact you at ${phone} soon.`, "success");
    });
}

// ================= NAVIGATION =================
function setupNavigation() {
    const mobileMenuBtn = document.getElementById("mobile-menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu-dropdown");

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("hidden");
        });

        // Close on link click
        mobileMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.add("hidden");
            });
        });
    }
}
