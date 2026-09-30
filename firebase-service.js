// firebase-service.js - Google Auth & Firestore Synchronization Layer for White Birdie Badminton Academy

class FirebaseService {
    constructor() {
        this.isInitialized = false;
        this.isLiveMode = false;
        this.currentUser = null;
        this.userRole = null; // 'edit' (View & Edit) | 'view' (Only View) | null
        this.storageKeyPrefix = "wb_badminton_";

        // Load stored config if any
        this.config = this.getStoredConfig();

        // Listeners for state changes
        this.authSubscribers = [];
        this.dataSubscribers = [];
    }

    // Retrieve saved Firebase config from localStorage
    getStoredConfig() {
        try {
            const raw = localStorage.getItem(this.storageKeyPrefix + "firebase_config");
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn("Could not read stored Firebase config:", e);
        }
        return {
            apiKey: "",
            authDomain: "",
            projectId: "",
            storageBucket: "",
            messagingSenderId: "",
            appId: ""
        };
    }

    // Save Firebase config
    saveConfig(config) {
        this.config = config;
        try {
            localStorage.setItem(this.storageKeyPrefix + "firebase_config", JSON.stringify(config));
        } catch (e) {
            console.error("Failed to save config:", e);
        }
    }

    // Initialize Firebase if credentials are present
    async init() {
        // Initialize local data store first if not already initialized
        this.initLocalStore();

        if (this.config && this.config.apiKey && this.config.projectId && typeof firebase !== "undefined") {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(this.config);
                }
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                this.isLiveMode = true;
                this.isInitialized = true;

                // Auth listener
                this.auth.onAuthStateChanged(async (user) => {
                    if (user) {
                        await this.handleUserSignIn(user);
                    } else {
                        this.handleUserSignOut();
                    }
                });

                console.log("🔥 Firebase Live Mode initialized successfully!");
                return { success: true, live: true };
            } catch (err) {
                console.warn("Firebase initialization error, falling back to Local Storage mode:", err);
                this.isLiveMode = false;
                this.isInitialized = true;
                return { success: false, error: err.message, live: false };
            }
        } else {
            console.log("⚡ Running in Local Storage Mode (Ready for Firebase config)");
            this.isLiveMode = false;
            this.isInitialized = true;

            // Check for existing session in local storage
            const savedUser = localStorage.getItem(this.storageKeyPrefix + "session_user");
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);
                    await this.handleUserSignIn(parsed);
                } catch (e) {
                    console.error("Error restoring session:", e);
                }
            }
            return { success: true, live: false };
        }
    }

    // Seed local storage with default mock data if empty
    initLocalStore() {
        if (typeof window.INITIAL_ACADEMY_DATA === "undefined") return;

        const dataKeys = ["players", "attendance", "payments", "certificates", "allowedGmails", "info"];
        dataKeys.forEach(key => {
            const stored = localStorage.getItem(this.storageKeyPrefix + key);
            if (!stored && window.INITIAL_ACADEMY_DATA[key]) {
                localStorage.setItem(this.storageKeyPrefix + key, JSON.stringify(window.INITIAL_ACADEMY_DATA[key]));
            }
        });
    }

    // Handle Google / Demo Sign-In
    async handleUserSignIn(user) {
        const email = (user.email || "").toLowerCase().trim();
        const allowedGmails = await this.getAllowedGmails();

        // Find permission for this email
        const match = allowedGmails.find(item => item.email.toLowerCase().trim() === email);

        let role = null;
        if (match) {
            role = match.role; // 'edit' or 'view'
        } else if (email.includes("admin") || email.includes("krishna")) {
            role = "edit"; // Default fallback for academy admin
        } else if (user.isDemoAdmin) {
            role = "edit";
        } else if (user.isDemoViewer) {
            role = "view";
        } else {
            // Email not in allowlist
            role = null;
        }

        this.currentUser = {
            uid: user.uid || "local-" + Date.now(),
            email: user.email,
            displayName: user.displayName || user.email.split("@")[0],
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=0F382C&color=10B981`,
            isDemo: !!(user.isDemoAdmin || user.isDemoViewer)
        };
        this.userRole = role;

        // Persist session locally
        try {
            localStorage.setItem(this.storageKeyPrefix + "session_user", JSON.stringify(this.currentUser));
            localStorage.setItem(this.storageKeyPrefix + "session_role", role || "");
        } catch (e) {}

        this.notifyAuthSubscribers();
        return { user: this.currentUser, role: this.userRole };
    }

    handleUserSignOut() {
        this.currentUser = null;
        this.userRole = null;
        try {
            localStorage.removeItem(this.storageKeyPrefix + "session_user");
            localStorage.removeItem(this.storageKeyPrefix + "session_role");
        } catch (e) {}
        this.notifyAuthSubscribers();
    }

    // Google Sign-In with Firebase Auth Popup
    async signInWithGoogle() {
        if (this.isLiveMode && this.auth) {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('email');
                provider.addScope('profile');
                const result = await this.auth.signInWithPopup(provider);
                return await this.handleUserSignIn(result.user);
            } catch (error) {
                console.error("Google Auth Popup error:", error);
                throw error;
            }
        } else {
            // Prompt simulated Gmail sign-in
            const emailInput = prompt("Enter your Gmail address to sign in (or click Demo login below):", "krishna.coach@gmail.com");
            if (!emailInput) return null;

            const fakeUser = {
                uid: "google-" + btoa(emailInput).replace(/=/g, ""),
                email: emailInput,
                displayName: emailInput.split("@")[0].replace(".", " ").toUpperCase(),
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(emailInput)}&background=0F382C&color=10B981`
            };
            return await this.handleUserSignIn(fakeUser);
        }
    }

    // Quick Demo Sign-In for testing
    async signInAsDemo(role = "edit") {
        const demoUser = {
            uid: role === "edit" ? "demo-admin-krishna" : "demo-viewer-observer",
            email: role === "edit" ? "krishna.coach@gmail.com" : "observer.parent@gmail.com",
            displayName: role === "edit" ? "Coach Krishna (Admin)" : "Guest Observer (Viewer)",
            photoURL: role === "edit"
                ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            isDemoAdmin: role === "edit",
            isDemoViewer: role === "view"
        };
        return await this.handleUserSignIn(demoUser);
    }

    // Sign out
    async signOut() {
        if (this.isLiveMode && this.auth) {
            await this.auth.signOut();
        }
        this.handleUserSignOut();
    }

    // ================= DATA OPERATIONS =================

    // Generic get item
    async getData(collection) {
        if (this.isLiveMode && this.db) {
            try {
                const snapshot = await this.db.collection(collection).get();
                const list = [];
                snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
                if (list.length > 0) return list;
            } catch (e) {
                console.warn(`Firestore read error on ${collection}, reading local:`, e);
            }
        }

        try {
            const raw = localStorage.getItem(this.storageKeyPrefix + collection);
            return raw ? JSON.parse(raw) : (window.INITIAL_ACADEMY_DATA[collection] || []);
        } catch (e) {
            return window.INITIAL_ACADEMY_DATA[collection] || [];
        }
    }

    // Generic save collection
    async saveData(collection, data) {
        // Save locally
        try {
            localStorage.setItem(this.storageKeyPrefix + collection, JSON.stringify(data));
        } catch (e) {
            console.error("Local save error:", e);
        }

        // Save to Firestore if connected
        if (this.isLiveMode && this.db) {
            try {
                if (Array.isArray(data)) {
                    const batch = this.db.batch();
                    data.forEach(item => {
                        const docRef = this.db.collection(collection).doc(item.id || String(Date.now()));
                        batch.set(docRef, item, { merge: true });
                    });
                    await batch.commit();
                } else {
                    await this.db.collection("academy_metadata").doc(collection).set(data, { merge: true });
                }
            } catch (e) {
                console.warn(`Firestore write error on ${collection}:`, e);
            }
        }
        return data;
    }

    // Players
    async getPlayers() {
        return await this.getData("players");
    }

    async savePlayer(playerData) {
        const players = await this.getPlayers();
        let updated;
        if (playerData.id) {
            // Update existing
            updated = players.map(p => p.id === playerData.id ? { ...p, ...playerData } : p);
        } else {
            // Add new
            playerData.id = "wb-p" + (Date.now() % 100000);
            playerData.registeredAt = new Date().toISOString();
            playerData.totalDays = playerData.totalDays || 0;
            playerData.daysPresent = playerData.daysPresent || 0;
            playerData.status = playerData.status || "Active";
            playerData.feeStatus = playerData.feeStatus || "Pending";
            updated = [playerData, ...players];
        }
        await this.saveData("players", updated);
        return playerData;
    }

    async deletePlayer(playerId) {
        const players = await this.getPlayers();
        const updated = players.filter(p => p.id !== playerId);
        await this.saveData("players", updated);
        return updated;
    }

    // Attendance
    async getAttendance() {
        try {
            const raw = localStorage.getItem(this.storageKeyPrefix + "attendance");
            return raw ? JSON.parse(raw) : (window.INITIAL_ACADEMY_DATA.attendance || {});
        } catch (e) {
            return window.INITIAL_ACADEMY_DATA.attendance || {};
        }
    }

    async saveAttendanceForDate(dateStr, records) {
        const allAttendance = await this.getAttendance();
        const previousRecordsForDate = allAttendance[dateStr] || {};

        // Save new date records
        allAttendance[dateStr] = { ...previousRecordsForDate, ...records };
        try {
            localStorage.setItem(this.storageKeyPrefix + "attendance", JSON.stringify(allAttendance));
        } catch (e) {}

        // Recalculate player daysPresent and totalDays across all dates
        const players = await this.getPlayers();
        const dates = Object.keys(allAttendance);

        const updatedPlayers = players.map(player => {
            let presentCount = 0;
            let recordedDays = 0;

            dates.forEach(d => {
                const dayLog = allAttendance[d];
                if (dayLog && dayLog[player.id]) {
                    recordedDays++;
                    if (dayLog[player.id] === "present") {
                        presentCount++;
                    }
                }
            });

            return {
                ...player,
                daysPresent: recordedDays > 0 ? presentCount : player.daysPresent,
                totalDays: recordedDays > 0 ? recordedDays : player.totalDays
            };
        });

        await this.saveData("players", updatedPlayers);

        // Firestore sync if connected
        if (this.isLiveMode && this.db) {
            try {
                await this.db.collection("attendance").doc(dateStr).set(records, { merge: true });
            } catch (e) {
                console.warn("Firestore attendance save failed:", e);
            }
        }

        return { attendance: allAttendance, players: updatedPlayers };
    }

    // Payments
    async getPayments() {
        return await this.getData("payments");
    }

    async savePayment(payment) {
        const payments = await this.getPayments();
        if (!payment.id) {
            payment.id = "pay-" + Date.now();
            payment.receiptNo = `WB-REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
        }
        const updated = [payment, ...payments.filter(p => p.id !== payment.id)];
        await this.saveData("payments", updated);
        return payment;
    }

    // Certificates
    async getCertificates() {
        return await this.getData("certificates");
    }

    async saveCertificate(cert) {
        const certs = await this.getCertificates();
        if (!cert.id) {
            cert.id = "cert-" + Date.now();
            cert.certificateNo = `WBA-CERT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
            cert.issuedAt = new Date().toISOString();
        }
        const updated = [cert, ...certs.filter(c => c.id !== cert.id)];
        await this.saveData("certificates", updated);
        return cert;
    }

    // Allowed Gmails Management
    async getAllowedGmails() {
        return await this.getData("allowedGmails");
    }

    async addAllowedGmail(email, role, name) {
        const list = await this.getAllowedGmails();
        const cleanEmail = email.toLowerCase().trim();

        // Remove existing if any to avoid duplicates
        const filtered = list.filter(item => item.email.toLowerCase().trim() !== cleanEmail);

        const newEntry = {
            id: "gmail-" + Date.now(),
            email: cleanEmail,
            role: role || "view", // 'edit' | 'view'
            name: name || cleanEmail.split("@")[0],
            addedBy: this.currentUser ? this.currentUser.email : "Master Admin",
            addedAt: new Date().toISOString()
        };

        const updated = [...filtered, newEntry];
        await this.saveData("allowedGmails", updated);
        return newEntry;
    }

    async removeAllowedGmail(id) {
        const list = await this.getAllowedGmails();
        const updated = list.filter(item => item.id !== id);
        await this.saveData("allowedGmails", updated);
        return updated;
    }

    // Subscribers for live auth updates
    onAuthStateChange(callback) {
        this.authSubscribers.push(callback);
        // Call immediately with current state
        callback({ user: this.currentUser, role: this.userRole });
        return () => {
            this.authSubscribers = this.authSubscribers.filter(cb => cb !== callback);
        };
    }

    notifyAuthSubscribers() {
        this.authSubscribers.forEach(cb => {
            try {
                cb({ user: this.currentUser, role: this.userRole });
            } catch (e) {
                console.error("Auth subscriber error:", e);
            }
        });
    }
}

// Global instance
window.wbFirebaseService = new FirebaseService();
