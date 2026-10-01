// firebase-service.js - Real Firebase Auth & Cloud Firestore Integration with Strict 3-Tier RBAC
// Master Admin: siddharthkoppu@gmail.com
// Roles: 'admin' (Master Admin - Siddharth Koppu), 'coach' (Coach Mr. Krishna & Coaches), 'parent' (Parents - Linked to specific child)

class FirebaseService {
    constructor() {
        this.isInitialized = false;
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.userRole = null; // 'admin' | 'coach' | 'parent' | null
        this.linkedPlayerId = null; // Set for parent accounts
        this.storageKeyPrefix = "wb_badminton_v2_";
        this.authSubscribers = [];
        this.isVerifyingAuth = false;
    }

    // Initialize Firebase Auth & Firestore
    async init() {
        if (typeof firebase !== "undefined") {
            try {
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                console.log("🔥 Firebase Auth & Firestore Connected Successfully!");
            } catch (e) {
                console.warn("Firebase initialization warning (using offline fallback if needed):", e);
            }
        }

        // Initialize local store fallback if needed
        this.initLocalStore();
        this.isInitialized = true;

        // Listen for Real Firebase Auth state changes
        if (this.auth) {
            this.auth.onAuthStateChanged(async (firebaseUser) => {
                if (firebaseUser) {
                    try {
                        await this.verifyAndSetUser(firebaseUser);
                    } catch (err) {
                        console.error("Auth verification failed:", err);
                    }
                } else {
                    this.handleUserSignOut();
                }
            });
        }

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

    // Real Google Sign-In via Firebase Auth Popup
    async signInWithGoogle() {
        if (!this.auth) {
            throw new Error("Firebase Auth is not initialized. Please check network connection.");
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;

            // Verify if user is authorized in the system
            const authResult = await this.verifyAndSetUser(user);
            return authResult;
        } catch (error) {
            console.error("Google Sign-In error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                return null;
            }
            throw error;
        }
    }

    // Verify user authorization against Master Admin & Firestore allowedGmails
    async verifyAndSetUser(firebaseUser) {
        if (!firebaseUser || !firebaseUser.email) {
            throw new Error("No valid email address found in Google account.");
        }

        const email = firebaseUser.email.toLowerCase().trim();
        console.log(`🔍 Verifying authorization for: ${email}`);

        let role = null;
        let linkedPlayerId = null;

        // 1. MASTER ADMIN CHECK (Siddharth Koppu)
        if (email === "siddharthkoppu@gmail.com") {
            role = "admin";
            console.log("👑 Master Admin Verified: siddharthkoppu@gmail.com");
        } else {
            // 2. CHECK ALLOWED GMAILS FROM FIRESTORE / DATABASE
            const allowedGmails = await this.getAllowedGmails();
            const match = allowedGmails.find(item => item.email && item.email.toLowerCase().trim() === email);

            if (match) {
                role = match.role; // 'admin', 'coach', or 'parent'
                linkedPlayerId = match.linkedPlayerId || null;
                console.log(`✅ Authorized User Verified: ${email} (Role: ${role})`);
            } else {
                // 3. UNAUTHORIZED USER - STRICT ACCESS DENIAL
                console.warn(`⛔ Unauthorized access attempt from: ${email}`);

                // Sign them out from Firebase Auth immediately
                if (this.auth) {
                    await this.auth.signOut();
                }
                this.currentUser = null;
                this.userRole = null;
                this.linkedPlayerId = null;
                this.notifyAuthSubscribers();

                const err = new Error(`ACCESS DENIED: The Google account "${email}" is not authorized to access White Birdie Badminton Academy portal.\n\nPlease contact Master Admin Siddharth Koppu (siddharthkoppu@gmail.com) to request access.`);
                err.isUnauthorized = true;
                err.email = email;
                throw err;
            }
        }

        this.currentUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (role === 'admin' ? "Siddharth Koppu (Master Admin)" : firebaseUser.email.split("@")[0]),
            photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email)}&background=0F382C&color=10B981`,
            role: role,
            linkedPlayerId: linkedPlayerId
        };

        this.userRole = role;
        this.linkedPlayerId = linkedPlayerId;

        // Persist session
        try {
            localStorage.setItem(this.storageKeyPrefix + "session_user", JSON.stringify(this.currentUser));
            localStorage.setItem(this.storageKeyPrefix + "session_role", role || "");
            if (linkedPlayerId) {
                localStorage.setItem(this.storageKeyPrefix + "session_linked_player", linkedPlayerId);
            }
        } catch (e) {}

        this.notifyAuthSubscribers();
        return { user: this.currentUser, role: this.userRole, linkedPlayerId: this.linkedPlayerId };
    }

    async signOut() {
        if (this.auth) {
            await this.auth.signOut();
        }
        this.handleUserSignOut();
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

    // ================= CLOUD FIRESTORE & LOCAL STORAGE DATA CRUD =================

    async getData(collection) {
        // Try Cloud Firestore first
        if (this.db) {
            try {
                const snapshot = await this.db.collection(collection).get();
                if (!snapshot.empty) {
                    const data = [];
                    snapshot.forEach(doc => {
                        data.push({ id: doc.id, ...doc.data() });
                    });
                    // Cache locally
                    localStorage.setItem(this.storageKeyPrefix + collection, JSON.stringify(data));
                    return data;
                }
            } catch (err) {
                console.warn(`Firestore read fallback for [${collection}]:`, err.message);
            }
        }

        // Fallback to local storage or mock initial data
        try {
            const raw = localStorage.getItem(this.storageKeyPrefix + collection);
            return raw ? JSON.parse(raw) : (window.INITIAL_ACADEMY_DATA[collection] || []);
        } catch (e) {
            return window.INITIAL_ACADEMY_DATA[collection] || [];
        }
    }

    async saveData(collection, data) {
        // Update local cache
        try {
            localStorage.setItem(this.storageKeyPrefix + collection, JSON.stringify(data));
        } catch (e) {}

        // Sync to Cloud Firestore if connected
        if (this.db) {
            try {
                const batch = this.db.batch();
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        if (item.id) {
                            const ref = this.db.collection(collection).doc(item.id);
                            batch.set(ref, item, { merge: true });
                        }
                    });
                    await batch.commit();
                }
            } catch (err) {
                console.warn(`Firestore batch write error for [${collection}]:`, err.message);
            }
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

        // Firestore direct save
        if (this.db && playerData.id) {
            try {
                await this.db.collection("players").doc(playerData.id).set(playerData, { merge: true });
            } catch (e) {
                console.warn("Firestore player save fallback:", e.message);
            }
        }

        await this.saveData("players", updated);
        return playerData;
    }

    async deletePlayer(playerId) {
        if (this.db) {
            try {
                await this.db.collection("players").doc(playerId).delete();
            } catch (e) {}
        }
        const players = await this.getPlayers();
        const updated = players.filter(p => p.id !== playerId);
        await this.saveData("players", updated);
        return updated;
    }

    // Attendance
    async getAttendance() {
        if (this.db) {
            try {
                const doc = await this.db.collection("system").doc("attendance").get();
                if (doc.exists) {
                    const data = doc.data();
                    localStorage.setItem(this.storageKeyPrefix + "attendance", JSON.stringify(data));
                    return data;
                }
            } catch (e) {}
        }

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

        // Save to Firestore
        if (this.db) {
            try {
                await this.db.collection("system").doc("attendance").set(allAttendance, { merge: true });
            } catch (e) {
                console.warn("Firestore attendance save fallback:", e.message);
            }
        }

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

        if (this.db) {
            try {
                await this.db.collection("payments").doc(payment.id).set(payment, { merge: true });
            } catch (e) {}
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

        if (this.db) {
            try {
                await this.db.collection("certificates").doc(cert.id).set(cert, { merge: true });
            } catch (e) {}
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

        if (this.db) {
            try {
                await this.db.collection("allowedGmails").doc(newEntry.id).set(newEntry);
            } catch (e) {
                console.warn("Firestore allowedGmails save fallback:", e.message);
            }
        }

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

        if (this.db) {
            try {
                await this.db.collection("allowedGmails").doc(id).delete();
            } catch (e) {}
        }

        const updated = list.filter(item => item.id !== id);
        await this.saveData("allowedGmails", updated);
        return updated;
    }

    // Subscribers for auth updates
    onAuthStateChange(callback) {
        this.authSubscribers.push(callback);
        if (this.currentUser) {
            callback({ user: this.currentUser, role: this.userRole, linkedPlayerId: this.linkedPlayerId });
        }
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
