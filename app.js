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
}

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

// ================= SECRET CLICK SEQUENCE =================
function setupSecretSequence() {
    const step1 = document.getElementById("secret-trigger-step1"); // Nav Shuttlecock Logo
    const step2 = document.getElementById("secret-trigger-step2"); // Coach Krishna Badge in Hero
    const step3 = document.getElementById("secret-trigger-step3"); // Kodathi Location Pin
    const step4 = document.getElementById("secret-trigger-step4"); // Footer Gold Feather

    const triggerTargets = [
        { el: step1, step: 1, name: "Navbar Shuttlecock" },
        { el: step2, step: 2, name: "Coach Krishna Badge" },
        { el: step3, step: 3, name: "Kodathi Pin" },
        { el: step4, step: 4, name: "Footer Feather Emblem" }
    ];

    triggerTargets.forEach(({ el, step, name }) => {
        if (!el) return;
        el.addEventListener("click", (e) => {
            handleSecretStepClick(step, el, name);
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

function handleSecretStepClick(stepNumber, element, stepName) {
    if (stepNumber === secretStepProgress + 1) {
        // Correct step in sequence!
        secretStepProgress = stepNumber;
        triggerSparkleAnimation(element);

        console.log(`🎯 Secret Sequence: Step ${secretStepProgress}/${SECRET_STEPS_TOTAL} completed (${stepName})`);

        // Give subtle audio/visual feedback
        showSecretNotification(`✨ Secret Access: Step ${secretStepProgress}/${SECRET_STEPS_TOTAL} verified...`);

        if (secretStepProgress === SECRET_STEPS_TOTAL) {
            // Sequence completed!
            secretStepProgress = 0;
            if (typeof confetti !== "undefined") {
                confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
            }
            setTimeout(() => {
                openCoachLoginModal();
            }, 400);
        }
    } else if (stepNumber === 1) {
        // Reset to step 1
        secretStepProgress = 1;
        triggerSparkleAnimation(element);
        showSecretNotification(`✨ Secret Access: Step 1/${SECRET_STEPS_TOTAL} verified...`);
    } else {
        // Wrong order - reset
        secretStepProgress = 0;
        console.log("Secret sequence reset (wrong order).");
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

    // Google Sign-In button
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
                alert("Google Sign-In note: " + e.message);
            }
        });
    }

    // Demo Master Admin (Siddharth Koppu)
    const btnDemoMaster = document.getElementById("btn-demo-admin");
    if (btnDemoMaster) {
        btnDemoMaster.addEventListener("click", async () => {
            await window.wbFirebaseService.signInAsDemo("admin");
            closeCoachLoginModal();
            openCoachPortal();
        });
    }

    // Demo Coach (Mr. Krishna)
    const btnDemoCoach = document.getElementById("btn-demo-coach");
    if (btnDemoCoach) {
        btnDemoCoach.addEventListener("click", async () => {
            await window.wbFirebaseService.signInAsDemo("coach");
            closeCoachLoginModal();
            openCoachPortal();
        });
    }

    // Demo Parent (Pradeep Nair / Vihaan)
    const btnDemoParent = document.getElementById("btn-demo-parent");
    if (btnDemoParent) {
        btnDemoParent.addEventListener("click", async () => {
            await window.wbFirebaseService.signInAsDemo("parent");
            closeCoachLoginModal();
            openCoachPortal();
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
            alert("Please fill in Name and Phone Number.");
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
            status: "Active",
            photoUrl: uploadedPhotoDataUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            totalDays: 0,
            daysPresent: 0,
            medicalNotes: medicalNotes || "None reported.",
            coachNotes: "Newly registered via academy website. Scheduled for introductory assessment.",
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

        // Show confirmation popup
        alert(`🏸 Congratulations ${name}!\n\nYour registration with White Birdie Badminton Academy has been submitted successfully.\n\nCoach Mr. Krishna and our academy team will review your batch preference and contact you at ${phone}.\n\nWelcome to the Academy!`);
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
