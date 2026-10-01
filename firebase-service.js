// firebase-service.js - Local Data Persistence & Role-Based Access Control (RBAC) Layer
// Master Admin: siddharthkoppu@gmail.com
// Roles: 'admin' (Master Admin - Siddharth Koppu), 'coach' (Coach Mr. Krishna & Coaches), 'parent' (Parents - Linked to specific child)

class FirebaseService {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.userRole = null; // 'admin' | 'coach' | 'parent' | null
        this.linkedPlayerId = null; // Set for parent accounts
        this.storageKeyPrefix = "wb_badminton_v2_";

        // Listeners for state changes
        this.authSubscribers = [];
    }

    // Initialize local storage and restore session
    async init() {
        this.initLocalStore();
        this.isInitialized = true;

        // Restore saved session from local storage if available
        const savedUser = localStorage.getItem(this.storageKeyPrefix + "session_user");
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                await this.handleUserSignIn(parsed);
            } catch (e) {
                console.error("Error restoring session:", e);
            }
        }

        console.log("🏸 White Birdie Data Layer Initialized (Offline-first LocalStorage)");
        return { success: true };
    }

    // Seed local storage with default data if empty
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

    // Handle Authentication & Role Resolution
    async handleUserSignIn(user) {
        const email = (user.email || "").toLowerCase().trim();
        const allowedGmails = await this.getAllowedGmails();

        // Check if email is in the allowlist
        const match = allowedGmails.find(item => item.email.toLowerCase().trim() === email);

        let role = null;
        let linkedPlayerId = null;

        if (email === "siddharthkoppu@gmail.com") {
            role = "admin";
        } else if (match) {
            role = match.role; // 'admin', 'coach', or 'parent'
            linkedPlayerId = match.linkedPlayerId || null;
        } else if (email.includes("krishna") || email.includes("coach")) {
            role = "coach";
        } else if (user.isDemoAdmin) {
            role = "admin";
        } else if (user.isDemoCoach) {
            role = "coach";
        } else if (user.isDemoParent) {
            role = "parent";
            linkedPlayerId = user.linkedPlayerId || "wb-p105";
        } else {
            // Unregistered email
            role = null;
        }

        this.currentUser = {
            uid: user.uid || "local-" + Date.now(),
            email: user.email,
            displayName: user.displayName || user.email.split("@")[0],
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=0F382C&color=10B981`,
            role: role,
            linkedPlayerId: linkedPlayerId,
            isDemo: !!(user.isDemoAdmin || user.isDemoCoach || user.isDemoParent)
        };

        this.userRole = role;
        this.linkedPlayerId = linkedPlayerId;

        // Persist session
        try {
            localStorage.setItem(this.storageKeyPrefix + "session_user", JSON.stringify(this.currentUser));
            localStorage.setItem(this.storageKeyPrefix + "session_role", role || "");
            if (linkedPlayerId) {
                localStorage.setItem(this.storageKeyPrefix + "session_linked_player", linkedPlayerId);
            } else {
                localStorage.removeItem(this.storageKeyPrefix + "session_linked_player");
            }
        } catch (e) {}

        this.notifyAuthSubscribers();
        return { user: this.currentUser, role: this.userRole, linkedPlayerId: this.linkedPlayerId };
    }

    handleUserSignOut() {
        this.currentUser = null;
        this.userRole = null;
        this.linkedPlayerId = null;
        try {
            localStorage.removeItem(this.storageKeyPrefix + "session_user");
            localStorage.removeItem(this.storageKeyPrefix + "session_role");
            localStorage.removeItem(this.storageKeyPrefix + "session_linked_player");
        } catch (e) {}
        this.notifyAuthSubscribers();
    }

    // Google Sign-In (Simulated / Prompt)
    async signInWithGoogle() {
        const emailInput = prompt(
            "Enter your authorized Gmail address to sign in:\n\n• Master Admin: siddharthkoppu@gmail.com\n• Coach: krishna.coach@gmail.com\n• Parent: nair.vihaan.parent@gmail.com",
            "siddharthkoppu@gmail.com"
        );
        if (!emailInput) return null;

        const clean = emailInput.trim();
        const fakeUser = {
            uid: "google-" + btoa(clean).replace(/=/g, ""),
            email: clean,
            displayName: clean === "siddharthkoppu@gmail.com" ? "Siddharth Koppu (Master Admin)" : (clean.includes("krishna") ? "Coach Mr. Krishna" : clean.split("@")[0].toUpperCase()),
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=0F382C&color=10B981`
        };
        return await this.handleUserSignIn(fakeUser);
    }

    // Demo Sign-In options for instant testing
    async signInAsDemo(demoType = "admin") {
        let demoUser;

        if (demoType === "admin") {
            // Siddharth Koppu (Master Admin)
            demoUser = {
                uid: "demo-master-siddharth",
                email: "siddharthkoppu@gmail.com",
                displayName: "Siddharth Koppu (Master Admin)",
                photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                isDemoAdmin: true
            };
        } else if (demoType === "coach") {
            // Coach Mr. Krishna
            demoUser = {
                uid: "demo-coach-krishna",
                email: "krishna.coach@gmail.com",
                displayName: "Coach Mr. Krishna",
                photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
                isDemoCoach: true
            };
        } else if (demoType === "parent") {
            // Parent of Vihaan Nair
            demoUser = {
                uid: "demo-parent-vihaan",
                email: "nair.vihaan.parent@gmail.com",
                displayName: "Pradeep Nair (Vihaan's Parent)",
                photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
                isDemoParent: true,
                linkedPlayerId: "wb-p105"
            };
        }

        return await this.handleUserSignIn(demoUser);
    }

    async signOut() {
        this.handleUserSignOut();
    }

    // ================= DATA CRUD METHODS =================

    async getData(collection) {
        try {
            const raw = localStorage.getItem(this.storageKeyPrefix + collection);
            return raw ? JSON.parse(raw) : (window.INITIAL_ACADEMY_DATA[collection] || []);
        } catch (e) {
            return window.INITIAL_ACADEMY_DATA[collection] || [];
        }
    }

    async saveData(collection, data) {
        try {
            localStorage.setItem(this.storageKeyPrefix + collection, JSON.stringify(data));
        } catch (e) {
            console.error("Local storage save error:", e);
        }
        return data;
    }

    // Players
    async getPlayers() {
        return await this.getData("players");
    }

    async getPlayerById(id) {
        const players = await this.getPlayers();
        return players.find(p => p.id === id) || null;
    }

    async savePlayer(playerData) {
        const players = await this.getPlayers();
        let updated;
        if (playerData.id) {
            updated = players.map(p => p.id === playerData.id ? { ...p, ...playerData } : p);
        } else {
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

        allAttendance[dateStr] = { ...previousRecordsForDate, ...records };
        try {
            localStorage.setItem(this.storageKeyPrefix + "attendance", JSON.stringify(allAttendance));
        } catch (e) {}

        // Recalculate player daysPresent and totalDays across all logged dates
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

    // Authorized Accounts (Access Control) - Master Admin Only
    async getAllowedGmails() {
        return await this.getData("allowedGmails");
    }

    async addAllowedGmail(email, role, name, linkedPlayerId = null) {
        // Enforce Master Admin check
        if (this.userRole !== "admin") {
            throw new Error("Unauthorized: Only Master Admin (siddharthkoppu@gmail.com) can add authorized accounts.");
        }

        const list = await this.getAllowedGmails();
        const cleanEmail = email.toLowerCase().trim();

        // Filter out existing email entry
        const filtered = list.filter(item => item.email.toLowerCase().trim() !== cleanEmail);

        const newEntry = {
            id: "gmail-" + Date.now(),
            email: cleanEmail,
            role: role || "coach", // 'coach' | 'parent'
            name: name || cleanEmail.split("@")[0],
            linkedPlayerId: role === "parent" ? linkedPlayerId : null,
            addedBy: "siddharthkoppu@gmail.com (Master Admin)",
            addedAt: new Date().toISOString()
        };

        const updated = [...filtered, newEntry];
        await this.saveData("allowedGmails", updated);
        return newEntry;
    }

    async removeAllowedGmail(id) {
        // Enforce Master Admin check
        if (this.userRole !== "admin") {
            throw new Error("Unauthorized: Only Master Admin (siddharthkoppu@gmail.com) can remove accounts.");
        }

        const list = await this.getAllowedGmails();
        const target = list.find(item => item.id === id);

        if (target && target.email === "siddharthkoppu@gmail.com") {
            throw new Error("Master Admin account cannot be removed.");
        }

        const updated = list.filter(item => item.id !== id);
        await this.saveData("allowedGmails", updated);
        return updated;
    }

    // Subscribers for auth updates
    onAuthStateChange(callback) {
        this.authSubscribers.push(callback);
        callback({ user: this.currentUser, role: this.userRole, linkedPlayerId: this.linkedPlayerId });
        return () => {
            this.authSubscribers = this.authSubscribers.filter(cb => cb !== callback);
        };
    }

    notifyAuthSubscribers() {
        this.authSubscribers.forEach(cb => {
            try {
                cb({ user: this.currentUser, role: this.userRole, linkedPlayerId: this.linkedPlayerId });
            } catch (e) {
                console.error("Auth subscriber error:", e);
            }
        });
    }
}

// Global instance
window.wbFirebaseService = new FirebaseService();
