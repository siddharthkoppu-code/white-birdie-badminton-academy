// coach-portal.js - Coach & Admin Management Dashboard Logic for White Birdie Badminton Academy

class CoachPortal {
    constructor() {
        this.currentTab = "dashboard";
        this.players = [];
        this.attendance = {};
        this.payments = [];
        this.certificates = [];
        this.allowedGmails = [];
        this.selectedAttendanceDate = this.getTodayDateString();
        this.selectedAttendanceBatch = "all";
        this.selectedPlayer = null;
        this.filterBatch = "all";
        this.filterLevel = "all";
        this.filterStatus = "all";
        this.searchQuery = "";

        // Bind methods
        this.init = this.init.bind(this);
    }

    getTodayDateString() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    async init() {
        console.log("🏸 Initializing Coach Portal...");
        this.bindEvents();
        await this.loadAllData();
        this.renderAll();
    }

    async loadAllData() {
        if (!window.wbFirebaseService) return;
        this.players = await window.wbFirebaseService.getPlayers();
        this.attendance = await window.wbFirebaseService.getAttendance();
        this.payments = await window.wbFirebaseService.getPayments();
        this.certificates = await window.wbFirebaseService.getCertificates();
        this.allowedGmails = await window.wbFirebaseService.getAllowedGmails();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll(".portal-tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const target = btn.dataset.tab;
                this.switchTab(target);
            });
        });

        // Attendance date change
        const datePicker = document.getElementById("attendance-date-picker");
        if (datePicker) {
            datePicker.value = this.selectedAttendanceDate;
            datePicker.addEventListener("change", (e) => {
                this.selectedAttendanceDate = e.target.value;
                this.renderAttendanceTab();
            });
        }

        // Attendance Batch Filter
        const batchFilter = document.getElementById("attendance-batch-filter");
        if (batchFilter) {
            batchFilter.addEventListener("change", (e) => {
                this.selectedAttendanceBatch = e.target.value;
                this.renderAttendanceTab();
            });
        }

        // Attendance Quick Date Navigation
        const btnToday = document.getElementById("btn-att-today");
        if (btnToday) {
            btnToday.addEventListener("click", () => {
                this.selectedAttendanceDate = this.getTodayDateString();
                if (datePicker) datePicker.value = this.selectedAttendanceDate;
                this.renderAttendanceTab();
            });
        }

        const btnPrevDay = document.getElementById("btn-att-prev");
        if (btnPrevDay) {
            btnPrevDay.addEventListener("click", () => {
                const parts = this.selectedAttendanceDate.split("-").map(Number);
                const d = new Date(parts[0], parts[1] - 1, parts[2] - 1);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                this.selectedAttendanceDate = `${yyyy}-${mm}-${dd}`;
                if (datePicker) datePicker.value = this.selectedAttendanceDate;
                this.renderAttendanceTab();
            });
        }

        const btnNextDay = document.getElementById("btn-att-next");
        if (btnNextDay) {
            btnNextDay.addEventListener("click", () => {
                const parts = this.selectedAttendanceDate.split("-").map(Number);
                const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                this.selectedAttendanceDate = `${yyyy}-${mm}-${dd}`;
                if (datePicker) datePicker.value = this.selectedAttendanceDate;
                this.renderAttendanceTab();
            });
        }

        // Mark All Attendance Buttons
        const btnMarkAllPresent = document.getElementById("btn-mark-all-present");
        if (btnMarkAllPresent) {
            btnMarkAllPresent.addEventListener("click", () => this.markAllAttendance("present"));
        }
        const btnMarkAllAbsent = document.getElementById("btn-mark-all-absent");
        if (btnMarkAllAbsent) {
            btnMarkAllAbsent.addEventListener("click", () => this.markAllAttendance("absent"));
        }

        // Player Search & Filters
        const playerSearch = document.getElementById("player-search-input");
        if (playerSearch) {
            playerSearch.addEventListener("input", (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderPlayersTab();
            });
        }

        const playerBatchSelect = document.getElementById("player-filter-batch");
        if (playerBatchSelect) {
            playerBatchSelect.addEventListener("change", (e) => {
                this.filterBatch = e.target.value;
                this.renderPlayersTab();
            });
        }

        const playerLevelSelect = document.getElementById("player-filter-level");
        if (playerLevelSelect) {
            playerLevelSelect.addEventListener("change", (e) => {
                this.filterLevel = e.target.value;
                this.renderPlayersTab();
            });
        }

        const playerStatusSelect = document.getElementById("player-filter-status");
        if (playerStatusSelect) {
            playerStatusSelect.addEventListener("change", (e) => {
                this.filterStatus = e.target.value;
                this.renderPlayersTab();
            });
        }

        // Add Player Button in Portal
        const btnAddNewPlayer = document.getElementById("btn-portal-add-player");
        if (btnAddNewPlayer) {
            btnAddNewPlayer.addEventListener("click", () => this.openAddPlayerModal());
        }

        // Certificate Player Dropdown Sync
        const certPlayerSelect = document.getElementById("cert-player-select");
        if (certPlayerSelect) {
            certPlayerSelect.addEventListener("change", (e) => {
                const playerId = e.target.value;
                const player = this.players.find(p => p.id === playerId);
                if (player) {
                    document.getElementById("cert-player-name").value = player.name;
                    document.getElementById("cert-from-level").value = player.skillLevel || "Foundation";
                    this.updateCertificatePreview();
                }
            });
        }

        // Certificate Live Input Watchers
        const certInputs = ["cert-player-name", "cert-from-level", "cert-to-level", "cert-coach-name", "cert-award-date", "cert-notes"];
        certInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("input", () => this.updateCertificatePreview());
            }
        });

        // Generate Certificate Form Submit (Idempotent)
        const certForm = document.getElementById("cert-generator-form");
        if (certForm && !certForm._hasListener) {
            certForm._hasListener = true;
            certForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleGenerateCertificate();
            });
        }

        // Certificate Print & Download (Idempotent)
        const btnPrintCert = document.getElementById("btn-print-certificate");
        if (btnPrintCert && !btnPrintCert._hasListener) {
            btnPrintCert._hasListener = true;
            btnPrintCert.addEventListener("click", () => window.print());
        }

        const btnDownloadCert = document.getElementById("btn-download-certificate");
        if (btnDownloadCert && !btnDownloadCert._hasListener) {
            btnDownloadCert._hasListener = true;
            btnDownloadCert.addEventListener("click", () => this.downloadCertificateImage());
        }

        // Add Gmail Allowlist Form (Idempotent)
        const addGmailForm = document.getElementById("add-gmail-form");
        if (addGmailForm && !addGmailForm._hasListener) {
            addGmailForm._hasListener = true;
            addGmailForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleAddAllowedGmail();
            });
        }

        // Add Payment Form (Idempotent)
        const addPaymentForm = document.getElementById("add-payment-form");
        if (addPaymentForm && !addPaymentForm._hasListener) {
            addPaymentForm._hasListener = true;
            addPaymentForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleAddPayment();
            });
        }

        // Role dropdown change handler (show linkedPlayer selector for parent role)
        const roleSelect = document.getElementById("new-gmail-role");
        if (roleSelect) {
            roleSelect.addEventListener("change", (e) => {
                const container = document.getElementById("parent-player-link-container");
                if (container) {
                    if (e.target.value === "parent") {
                        container.classList.remove("hidden");
                    } else {
                        container.classList.add("hidden");
                    }
                }
            });
        }
    }

    switchTab(tabId) {
        this.currentTab = tabId;

        // Update nav buttons
        document.querySelectorAll(".portal-tab-btn").forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add("bg-emerald-600", "text-white", "shadow-lg", "shadow-emerald-900/30");
                btn.classList.remove("text-slate-400", "hover:text-white", "hover:bg-emerald-950/40");
            } else {
                btn.classList.remove("bg-emerald-600", "text-white", "shadow-lg", "shadow-emerald-900/30");
                btn.classList.add("text-slate-400", "hover:text-white", "hover:bg-emerald-950/40");
            }
        });

        // Show pane
        document.querySelectorAll(".portal-tab-pane").forEach(pane => {
            pane.classList.add("hidden");
        });
        const activePane = document.getElementById(`pane-${tabId}`);
        if (activePane) {
            activePane.classList.remove("hidden");
        }

        // Tab-specific renders
        if (tabId === "dashboard") this.renderDashboardTab();
        if (tabId === "players") this.renderPlayersTab();
        if (tabId === "attendance") this.renderAttendanceTab();
        if (tabId === "approvals") this.renderApprovalsTab();
        if (tabId === "certificates") this.renderCertificatesTab();
        if (tabId === "payments") this.renderPaymentsTab();
        if (tabId === "access") this.renderAccessTab();
        if (tabId === "parent-view") this.renderParentView();
    }

    renderAll() {
        const role = window.wbFirebaseService.userRole;

        this.renderUserBadge();
        this.applyTabVisibilityByRole(role);

        // Render content based on role
        if (role === "parent") {
            this.renderParentView();
            this.switchTab("parent-view");
        } else {
            this.renderDashboardTab();
            this.renderPlayersTab();
            this.renderAttendanceTab();
            this.renderApprovalsTab();
            this.renderCertificatesTab();
            this.renderPaymentsTab();
            if (role === "admin") {
                this.renderAccessTab();
            }
            this.populatePlayerDropdowns();
        }
    }

    renderUserBadge() {
        const user = window.wbFirebaseService.currentUser;
        const role = window.wbFirebaseService.userRole; // 'admin', 'coach', or 'parent'
        const badgeContainer = document.getElementById("portal-user-badge");

        if (!badgeContainer) return;

        let roleText, roleColor;
        if (role === "admin") {
            roleText = "👑 Master Admin";
            roleColor = "bg-gradient-to-r from-amber-500/30 to-emerald-500/30 text-amber-200 border-amber-400/60";
        } else if (role === "coach") {
            roleText = "🏸 Head Coach";
            roleColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
        } else if (role === "parent") {
            roleText = "👨‍👧 Parent View";
            roleColor = "bg-blue-500/20 text-blue-300 border-blue-500/40";
        } else {
            roleText = "👁️ View Only";
            roleColor = "bg-slate-500/20 text-slate-300 border-slate-500/40";
        }

        badgeContainer.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${user ? user.photoURL : 'https://ui-avatars.com/api/?name=User'}"
                     class="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover shadow-md" alt="Avatar">
                <div class="text-left leading-tight">
                    <div class="font-bold text-white flex items-center gap-2">
                        ${user ? user.displayName : 'User'}
                        <span class="text-xs px-2 py-0.5 rounded-full border ${roleColor} font-semibold">
                            ${roleText}
                        </span>
                    </div>
                    <div class="text-xs text-slate-400 font-mono">${user ? user.email : ''}</div>
                </div>
            </div>
        `;

        // Apply role-based restrictions
        this.applyRoleRestrictions(role);
    }

    applyRoleRestrictions(role) {
        const canEdit = (role === "admin" || role === "coach");
        document.querySelectorAll(".require-edit-role").forEach(el => {
            if (!canEdit) {
                el.disabled = true;
                el.classList.add("opacity-50", "cursor-not-allowed");
                el.setAttribute("title", "Requires Coach or Admin Permission");
            } else {
                el.disabled = false;
                el.classList.remove("opacity-50", "cursor-not-allowed");
                el.removeAttribute("title");
            }
        });
    }

    applyTabVisibilityByRole(role) {
        const allTabs = document.querySelectorAll(".portal-tab-btn");

        allTabs.forEach(btn => {
            const tab = btn.dataset.tab;

            if (role === "parent") {
                // Parents only see Child Progress tab
                if (tab === "parent-view") {
                    btn.classList.remove("hidden");
                } else {
                    btn.classList.add("hidden");
                }
            } else if (role === "coach") {
                // Coaches see all except access control and parent view
                if (tab === "access" || tab === "parent-view") {
                    btn.classList.add("hidden");
                } else {
                    btn.classList.remove("hidden");
                }
            } else if (role === "admin") {
                // Admins see everything except parent view
                if (tab === "parent-view") {
                    btn.classList.add("hidden");
                } else {
                    btn.classList.remove("hidden");
                }
            } else {
                // Fallback: hide sensitive tabs
                if (tab === "access" || tab === "parent-view") {
                    btn.classList.add("hidden");
                } else {
                    btn.classList.remove("hidden");
                }
            }
        });
    }

    populatePlayerDropdowns() {
        const certSelect = document.getElementById("cert-player-select");
        const paySelect = document.getElementById("payment-player-select");

        const options = `<option value="">-- Choose Enrolled Player --</option>` +
            this.players.map(p => `<option value="${p.id}">${p.name} (${p.batch.split('(')[0].trim()})</option>`).join("");

        if (certSelect) certSelect.innerHTML = options;
        if (paySelect) paySelect.innerHTML = options;
    }

    // ================= TAB 1: DASHBOARD OVERVIEW =================
    renderDashboardTab() {
        const total = this.players.length;
        const active = this.players.filter(p => p.status === "Active").length;

        // Calculate today's attendance
        const todayLog = this.attendance[this.selectedAttendanceDate] || {};
        let presentToday = 0;
        let absentToday = 0;

        this.players.forEach(p => {
            if (todayLog[p.id] === "present") presentToday++;
            if (todayLog[p.id] === "absent") absentToday++;
        });

        const attendanceRate = total > 0 ? Math.round((presentToday / total) * 100) : 0;

        // Pending fee count
        const pendingFees = this.players.filter(p => p.feeStatus === "Pending").length;

        // Update stat elements
        const statTotal = document.getElementById("stat-total-players");
        const statActive = document.getElementById("stat-active-players");
        const statPresent = document.getElementById("stat-today-present");
        const statRate = document.getElementById("stat-attendance-rate");
        const statPending = document.getElementById("stat-pending-fees");

        if (statTotal) statTotal.textContent = total;
        if (statActive) statActive.textContent = active;
        if (statPresent) statPresent.textContent = `${presentToday} / ${total}`;
        if (statRate) statRate.textContent = `${attendanceRate}%`;
        if (statPending) statPending.textContent = pendingFees;

        // Render Recent Activity / Attendance preview on dashboard
        const dashboardAttTable = document.getElementById("dashboard-today-attendance-body");
        if (dashboardAttTable) {
            dashboardAttTable.innerHTML = this.players.slice(0, 5).map(player => {
                const status = todayLog[player.id] || "unmarked";
                let statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Not Marked</span>`;
                if (status === "present") {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">✓ Present</span>`;
                } else if (status === "absent") {
                    statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40">✗ Absent</span>`;
                }

                const attRatio = `${player.daysPresent || 0} / ${player.totalDays || 0} Days`;
                const percent = player.totalDays > 0 ? Math.round((player.daysPresent / player.totalDays) * 100) : 0;

                return `
                    <tr class="border-b border-emerald-950/40 hover:bg-emerald-950/30 transition-colors">
                        <td class="py-3 px-4 flex items-center gap-3">
                            <img src="${player.photoUrl}" class="w-9 h-9 rounded-full object-cover border border-emerald-500/30 shadow" alt="${player.name}">
                            <div>
                                <div class="font-bold text-white hover:text-emerald-400 cursor-pointer" onclick="window.wbCoachPortal.openPlayerModal('${player.id}')">
                                    ${player.name}
                                </div>
                                <div class="text-xs text-slate-400">${player.skillLevel}</div>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-sm text-slate-300">${player.batch.split('(')[0]}</td>
                        <td class="py-3 px-4 text-sm font-mono text-emerald-300">
                            ${attRatio} <span class="text-xs text-slate-400">(${percent}%)</span>
                        </td>
                        <td class="py-3 px-4">${statusBadge}</td>
                        <td class="py-3 px-4 text-right">
                            <button onclick="window.wbCoachPortal.openPlayerModal('${player.id}')"
                                    class="text-xs px-3 py-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 transition">
                                View Profile
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    }

    // ================= TAB 2: PLAYERS DIRECTORY =================
    renderPlayersTab() {
        const container = document.getElementById("players-grid-container");
        if (!container) return;

        let filtered = this.players.filter(p => {
            // Search filter
            if (this.searchQuery) {
                const q = this.searchQuery;
                const matchName = p.name.toLowerCase().includes(q);
                const matchPhone = (p.phone || "").toLowerCase().includes(q);
                const matchEmail = (p.email || "").toLowerCase().includes(q);
                if (!matchName && !matchPhone && !matchEmail) return false;
            }
            // Batch filter
            if (this.filterBatch !== "all" && p.batch !== this.filterBatch) return false;
            // Level filter
            if (this.filterLevel !== "all" && p.skillLevel !== this.filterLevel) return false;
            // Status filter
            if (this.filterStatus !== "all" && p.status !== this.filterStatus) return false;

            return true;
        });

        const countBadge = document.getElementById("players-filtered-count");
        if (countBadge) countBadge.textContent = `${filtered.length} Players`;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-400 glass-card rounded-2xl">
                    <div class="text-4xl mb-3">🏸</div>
                    <p class="text-lg font-medium text-slate-300">No players found matching current filters.</p>
                    <p class="text-sm text-slate-500 mt-1">Try resetting search or filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(player => {
            const attPercent = player.totalDays > 0 ? Math.round((player.daysPresent / player.totalDays) * 100) : 0;
            const feeBadgeColor = player.feeStatus === "Paid" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border-amber-500/40";

            // Skill badge
            let levelColor = "bg-blue-500/20 text-blue-300 border-blue-500/40";
            if (player.skillLevel === "Advanced") levelColor = "bg-purple-500/20 text-purple-300 border-purple-500/40";
            if (player.skillLevel === "Intermediate") levelColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

            return `
                <div class="glass-card rounded-2xl p-5 border border-emerald-900/40 flex flex-col justify-between hover:border-emerald-500/50 cursor-pointer group relative overflow-hidden"
                     onclick="window.wbCoachPortal.openPlayerModal('${player.id}')">

                    <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent pointer-events-none"></div>

                    <div>
                        <!-- Header with Photo and Name -->
                        <div class="flex items-start gap-4 mb-4">
                            <div class="relative">
                                <img src="${player.photoUrl}"
                                     class="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg group-hover:scale-105 transition-transform"
                                     alt="${player.name}">
                                <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${player.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}"></span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2">
                                    <h3 class="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors truncate">
                                        ${player.name}
                                    </h3>
                                    <span class="text-xs px-2 py-0.5 rounded-full border ${levelColor} font-semibold">
                                        ${player.skillLevel}
                                    </span>
                                </div>
                                <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span>${player.age} yrs (${player.gender})</span>
                                    <span>•</span>
                                    <span class="truncate">${player.phone}</span>
                                </div>
                                <div class="text-xs text-emerald-400/90 font-medium mt-1 truncate">
                                    🏸 ${player.batch}
                                </div>
                            </div>
                        </div>

                        <!-- Attendance Stats Bar -->
                        <div class="bg-emerald-950/40 rounded-xl p-3 border border-emerald-900/30 mb-4">
                            <div class="flex justify-between items-center text-xs mb-1.5">
                                <span class="text-slate-400 font-medium">Academy Attendance:</span>
                                <span class="font-mono font-bold text-emerald-300">
                                    ${player.daysPresent || 0} / ${player.totalDays || 0} Days (${attPercent}%)
                                </span>
                            </div>
                            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                                     style="width: ${attPercent}%"></div>
                            </div>
                        </div>

                        <!-- Duration & Fee Info -->
                        <div class="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4">
                            <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                <div class="text-slate-400 text-[10px] uppercase font-bold">Duration</div>
                                <div class="font-semibold text-white truncate">${player.durationMonths || 3} Months (${player.endDate || 'Active'})</div>
                            </div>
                            <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                <div class="text-slate-400 text-[10px] uppercase font-bold">Fee Status</div>
                                <div class="font-semibold flex items-center gap-1.5 mt-0.5">
                                    <span class="w-2 h-2 rounded-full ${player.feeStatus === 'Paid' ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                                    <span class="${player.feeStatus === 'Paid' ? 'text-emerald-300' : 'text-amber-300'}">${player.feeStatus || 'Pending'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Footer -->
                    <div class="pt-3 border-t border-emerald-950/60 flex items-center justify-between">
                        <span class="text-xs text-slate-400">Click to view & edit details</span>
                        <span class="text-emerald-400 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            View Profile →
                        </span>
                    </div>

                </div>
            `;
        }).join("");
    }

    // ================= TAB 3: DEDICATED ATTENDANCE TAB =================
    renderAttendanceTab() {
        const container = document.getElementById("attendance-table-body");
        if (!container) return;

        const dateLog = this.attendance[this.selectedAttendanceDate] || {};
        const role = window.wbFirebaseService.userRole;
        const isReadOnly = (role !== "admin" && role !== "coach");

        // Filter players for attendance if batch filter is applied
        let list = this.players;
        if (this.selectedAttendanceBatch !== "all") {
            list = list.filter(p => p.batch.includes(this.selectedAttendanceBatch));
        }

        // Calculate metrics for chosen date
        let presentCount = 0;
        let absentCount = 0;
        let leaveCount = 0;

        list.forEach(p => {
            const st = dateLog[p.id];
            if (st === "present") presentCount++;
            else if (st === "absent") absentCount++;
            else if (st === "leave") leaveCount++;
        });

        const rate = list.length > 0 ? Math.round((presentCount / list.length) * 100) : 0;

        // Update headers
        const headerDate = document.getElementById("att-header-display-date");
        if (headerDate) {
            const d = new Date(this.selectedAttendanceDate + "T00:00:00");
            headerDate.textContent = d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }

        const countSummary = document.getElementById("att-summary-counts");
        if (countSummary) {
            countSummary.innerHTML = `
                <div class="flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <span class="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Present: <strong>${presentCount}</strong>
                    </span>
                    <span class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ✗ Absent: <strong>${absentCount}</strong>
                    </span>
                    <span class="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⏳ Leave: <strong>${leaveCount}</strong>
                    </span>
                    <span class="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        📊 Attendance Rate: <strong>${rate}%</strong>
                    </span>
                </div>
            `;
        }

        if (list.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="py-12 text-center text-slate-400">
                        No players registered under this batch filter.
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = list.map((player, idx) => {
            const status = dateLog[player.id] || null;
            const attPercent = player.totalDays > 0 ? Math.round((player.daysPresent / player.totalDays) * 100) : 0;

            const isPresent = status === "present";
            const isAbsent = status === "absent";
            const isLeave = status === "leave";

            return `
                <tr class="border-b border-emerald-950/40 hover:bg-emerald-950/20 transition">
                    <td class="py-3 px-4 text-slate-400 font-mono text-xs">${idx + 1}</td>

                    <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                            <img src="${player.photoUrl}"
                                 class="w-10 h-10 rounded-full object-cover border border-emerald-500/40 shadow cursor-pointer"
                                 onclick="window.wbCoachPortal.openPlayerModal('${player.id}')"
                                 alt="${player.name}">
                            <div>
                                <div class="font-bold text-white hover:text-emerald-300 cursor-pointer"
                                     onclick="window.wbCoachPortal.openPlayerModal('${player.id}')">
                                    ${player.name}
                                </div>
                                <div class="text-xs text-slate-400">${player.phone || 'No phone'}</div>
                            </div>
                        </div>
                    </td>

                    <td class="py-3 px-4 text-sm text-slate-300">
                        <div class="font-medium">${player.batch.split('(')[0]}</div>
                        <div class="text-xs text-slate-500">${player.skillLevel}</div>
                    </td>

                    <td class="py-3 px-4">
                        <div class="text-xs font-mono font-bold text-emerald-300">
                            ${player.daysPresent || 0} / ${player.totalDays || 0} Days
                        </div>
                        <div class="w-24 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div class="bg-emerald-400 h-1.5 rounded-full" style="width: ${attPercent}%"></div>
                        </div>
                    </td>

                    <td class="py-3 px-4 text-right">
                        <div class="inline-flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-emerald-900/50 shadow-inner">
                            <button onclick="window.wbCoachPortal.setAttendanceStatus('${player.id}', 'present')"
                                    ${isReadOnly ? 'disabled' : ''}
                                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${isPresent ? 'attendance-btn-active-present' : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/50'}">
                                <span>✓</span> Present
                            </button>
                            <button onclick="window.wbCoachPortal.setAttendanceStatus('${player.id}', 'absent')"
                                    ${isReadOnly ? 'disabled' : ''}
                                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${isAbsent ? 'attendance-btn-active-absent' : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/50'}">
                                <span>✗</span> Absent
                            </button>
                            <button onclick="window.wbCoachPortal.setAttendanceStatus('${player.id}', 'leave')"
                                    ${isReadOnly ? 'disabled' : ''}
                                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${isLeave ? 'attendance-btn-active-leave' : 'text-slate-400 hover:text-amber-300 hover:bg-amber-950/50'}">
                                <span>⏳</span> Leave
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    async setAttendanceStatus(playerId, status) {
        const role = window.wbFirebaseService.userRole;
        if (role !== "admin" && role !== "coach") {
            showToast("🔒 Access is in 'View Only' mode. Contact Master Coach for edit permissions.", "warning");
            return;
        }

        const dateStr = this.selectedAttendanceDate;
        const currentRecords = this.attendance[dateStr] || {};
        currentRecords[playerId] = status;

        const result = await window.wbFirebaseService.saveAttendanceForDate(dateStr, currentRecords);
        this.attendance = result.attendance;
        this.players = result.players;

        this.renderAttendanceTab();
        this.renderDashboardTab();
    }

    async markAllAttendance(status) {
        const role = window.wbFirebaseService.userRole;
        if (role !== "admin" && role !== "coach") {
            showToast("🔒 Access is in 'View Only' mode.", "warning");
            return;
        }

        const dateStr = this.selectedAttendanceDate;
        const records = {};

        let list = this.players;
        if (this.selectedAttendanceBatch !== "all") {
            list = list.filter(p => p.batch.includes(this.selectedAttendanceBatch));
        }

        list.forEach(p => {
            records[p.id] = status;
        });

        const result = await window.wbFirebaseService.saveAttendanceForDate(dateStr, records);
        this.attendance = result.attendance;
        this.players = result.players;

        this.renderAttendanceTab();
        this.renderDashboardTab();

        // Show celebration confetti on all present!
        if (status === "present" && typeof confetti !== "undefined") {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }
    }

    // ================= TAB 3.5: STUDENT ADMISSIONS & APPROVALS =================
    renderApprovalsTab() {
        const container = document.getElementById("approvals-list-container");
        const badge = document.getElementById("badge-pending-approvals");

        const pendingPlayers = this.players.filter(p => p.status === "Pending Approval" || p.status === "Pending");

        // Update badge count in navigation
        if (badge) {
            if (pendingPlayers.length > 0) {
                badge.textContent = pendingPlayers.length;
                badge.classList.remove("hidden");
            } else {
                badge.classList.add("hidden");
            }
        }

        if (!container) return;

        if (pendingPlayers.length === 0) {
            container.innerHTML = `
                <div class="glass-card rounded-3xl p-12 text-center border border-emerald-900/30">
                    <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
                        ✨
                    </div>
                    <h3 class="text-xl font-bold font-heading text-white">All Caught Up!</h3>
                    <p class="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                        There are currently no pending online registrations. When new students apply via the website, their applications will appear here for review.
                    </p>
                </div>
            `;
            return;
        }

        const role = window.wbFirebaseService.userRole;
        const canAction = (role === "admin" || role === "coach");

        container.innerHTML = pendingPlayers.map(player => {
            const fee = player.feeAmount || (player.durationMonths ? player.durationMonths * 3000 : 3000);
            const regDate = player.registeredAt ? new Date(player.registeredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recently";

            return `
                <div class="glass-card rounded-3xl p-6 border border-amber-500/30 relative overflow-hidden transition hover:border-amber-500/60 space-y-5">
                    <div class="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-amber-500/20 border-b border-l border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                        ⏳ Applied on ${regDate}
                    </div>

                    <div class="flex flex-col md:flex-row items-start md:items-center gap-5 pt-2">
                        <img src="${player.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}"
                             class="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400/50 shadow-lg flex-shrink-0" alt="${player.name}">
                        <div class="flex-1 space-y-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <h3 class="text-xl font-bold text-white font-heading">${player.name}</h3>
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Pending Approval
                                </span>
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    ${player.skillLevel || 'Beginner'}
                                </span>
                            </div>
                            <div class="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                                <span>🏸 <strong>Batch:</strong> ${player.batch}</span>
                                <span>📅 <strong>Plan:</strong> ${player.durationMonths || 1} Month(s)</span>
                                <span>💰 <strong>Joined Fee:</strong> ₹${fee.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Details Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-xs">
                        <div>
                            <span class="text-slate-400 block font-semibold mb-0.5">Contact Phone</span>
                            <a href="tel:${player.phone}" class="text-emerald-400 font-mono font-bold hover:underline flex items-center gap-1">
                                📞 ${player.phone}
                            </a>
                        </div>
                        <div>
                            <span class="text-slate-400 block font-semibold mb-0.5">Email Address</span>
                            <a href="mailto:${player.email}" class="text-slate-200 font-mono hover:underline truncate block">
                                ✉️ ${player.email}
                            </a>
                        </div>
                        <div>
                            <span class="text-slate-400 block font-semibold mb-0.5">Age / Gender</span>
                            <span class="text-slate-200 font-semibold">🎂 ${player.age || 'N/A'} yrs • ${player.gender || 'Not specified'}</span>
                        </div>
                        <div>
                            <span class="text-slate-400 block font-semibold mb-0.5">Emergency Contact</span>
                            <span class="text-slate-200 font-semibold">🛡️ ${player.emergencyContact || 'None provided'}</span>
                        </div>
                    </div>

                    ${player.medicalNotes && player.medicalNotes !== "None reported." ? `
                        <div class="px-4 py-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-200">
                            <strong>⚠️ Medical Notes:</strong> ${player.medicalNotes}
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800">
                        <button type="button" onclick="window.wbCoachPortal.rejectPlayer('${player.id}')"
                                ${!canAction ? 'disabled' : ''}
                                class="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5">
                            ✗ Reject Application
                        </button>
                        <button type="button" onclick="window.wbCoachPortal.approvePlayer('${player.id}')"
                                ${!canAction ? 'disabled' : ''}
                                class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition flex items-center gap-1.5">
                            ✓ Approve & Enroll Student
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    async approvePlayer(playerId) {
        const role = window.wbFirebaseService.userRole;
        if (role !== "admin" && role !== "coach") {
            showToast("🔒 Requires Coach or Admin permission.", "warning");
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        player.status = "Active";
        player.feeStatus = player.feeStatus || "Pending";
        player.startDate = player.startDate || this.getTodayDateString();

        if (!player.endDate) {
            const start = new Date(player.startDate);
            start.setMonth(start.getMonth() + (player.durationMonths || 1));
            player.endDate = start.toISOString().split("T")[0];
        }

        player.coachNotes = `Approved by ${role === 'admin' ? 'Master Admin Siddharth Koppu' : 'Coach Mr. Krishna'} on ${this.getTodayDateString()}.`;

        await window.wbFirebaseService.savePlayer(player);
        this.players = await window.wbFirebaseService.getPlayers();

        this.renderApprovalsTab();
        this.renderPlayersTab();
        this.renderDashboardTab();
        this.renderAttendanceTab();
        this.populatePlayerDropdowns();

        if (typeof confetti !== "undefined") {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }

        showToast(`🎉 ${player.name} has been approved and enrolled in ${player.batch}!`, "success");
    }

    async rejectPlayer(playerId) {
        const role = window.wbFirebaseService.userRole;
        if (role !== "admin" && role !== "coach") {
            showToast("🔒 Requires Coach or Admin permission.", "warning");
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        window.showConfirmModal({
            title: "Reject Registration",
            message: `Are you sure you want to reject the application for ${player.name}? This will remove the registration record.`,
            confirmText: "Yes, Reject",
            cancelText: "Cancel",
            isDanger: true,
            onConfirm: async () => {
                await window.wbFirebaseService.deletePlayer(playerId);
                this.players = await window.wbFirebaseService.getPlayers();

                this.renderApprovalsTab();
                this.renderPlayersTab();
                this.renderDashboardTab();
                this.populatePlayerDropdowns();

                showToast(`Application for ${player.name} removed.`, "info");
            }
        });
    }

    // ================= TAB 4: CERTIFICATE GENERATOR =================
    renderCertificatesTab() {
        this.updateCertificatePreview();
        this.renderCertificateHistory();
    }

    updateCertificatePreview() {
        const playerName = document.getElementById("cert-player-name")?.value || "Aarav Sharma";
        const fromLevel = document.getElementById("cert-from-level")?.value || "Junior Foundation";
        const toLevel = document.getElementById("cert-to-level")?.value || "Intermediate Competitive Star";
        const coachName = document.getElementById("cert-coach-name")?.value || "Mr. Krishna";
        const awardDate = document.getElementById("cert-award-date")?.value || this.getTodayDateString();
        const notes = document.getElementById("cert-notes")?.value || "Exemplary commitment, precision smashes, and sportsmanship.";

        const certNo = "WBA-CERT-" + new Date().getFullYear() + "-" + (Math.floor(100 + Math.random() * 900));

        // Format date
        let formattedDate = awardDate;
        try {
            const d = new Date(awardDate + "T00:00:00");
            formattedDate = d.toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' });
        } catch (e) {}

        const previewContainer = document.getElementById("certificate-live-preview");
        if (!previewContainer) return;

        previewContainer.innerHTML = `
            <div id="certificate-printable-area" class="certificate-frame rounded-2xl p-8 md:p-12 relative overflow-hidden select-none">
                <!-- Corner Ornaments -->
                <div class="cert-corner-ornament cert-corner-tl"></div>
                <div class="cert-corner-ornament cert-corner-tr"></div>
                <div class="cert-corner-ornament cert-corner-bl"></div>
                <div class="cert-corner-ornament cert-corner-br"></div>

                <div class="certificate-inner-border p-6 md:p-10 text-center relative z-10">

                    <!-- Academy Header -->
                    <div class="flex items-center justify-center gap-3 mb-2">
                        <span class="text-3xl">🏸</span>
                        <h1 class="font-certificate text-2xl md:text-3xl font-black tracking-widest text-[#0F382C] uppercase">
                            White Birdie Badminton Academy
                        </h1>
                        <span class="text-3xl">🏸</span>
                    </div>

                    <p class="text-xs tracking-[0.25em] text-[#b45309] font-bold uppercase mb-6">
                        VPV9+2CR, Kodathi, Kodathi JHC, Karnataka 560035 • Official Certificate of Excellence
                    </p>

                    <!-- Title -->
                    <div class="my-4">
                        <h2 class="font-certificate text-xl md:text-2xl font-bold tracking-wider text-[#78350f] uppercase">
                            Certificate of Level Advancement
                        </h2>
                        <div class="w-32 h-0.5 bg-[#d97706] mx-auto mt-2"></div>
                    </div>

                    <p class="text-sm text-slate-700 italic my-4">
                        This is proudly presented to
                    </p>

                    <!-- Player Name -->
                    <div class="my-4">
                        <span class="font-heading text-3xl md:text-4xl font-extrabold text-[#064e3b] underline decoration-[#d97706] decoration-2 underline-offset-8 px-4">
                            ${playerName}
                        </span>
                    </div>

                    <!-- Level Shift Description -->
                    <p class="text-sm text-slate-700 max-w-xl mx-auto leading-relaxed my-4">
                        in recognition of exceptional performance, technical mastery, and athletic discipline, officially promoting the player from
                        <strong class="text-[#0F382C] font-bold">${fromLevel}</strong> to the distinguished rank of
                    </p>

                    <div class="my-5 inline-block bg-[#0F382C] text-[#fef08a] px-6 py-2.5 rounded-full font-heading font-bold text-lg tracking-wide shadow-md border-2 border-[#fbbf24]">
                        ★ ${toLevel} ★
                    </div>

                    <p class="text-xs text-slate-600 italic max-w-lg mx-auto my-3">
                        "${notes}"
                    </p>

                    <!-- Signatures & Seal Footer -->
                    <div class="mt-10 pt-6 border-t border-[#d97706]/40 grid grid-cols-3 items-end">
                        <div class="text-center">
                            <div class="font-mono text-xs text-slate-500 font-bold mb-1">${formattedDate}</div>
                            <div class="w-28 h-0.5 bg-slate-400 mx-auto mb-1"></div>
                            <div class="text-xs uppercase tracking-wider font-bold text-slate-700">Date of Award</div>
                        </div>

                        <div class="flex justify-center">
                            <div class="gold-seal">
                                <div class="text-center">
                                    <div class="text-xs">🏸</div>
                                    <div class="text-[9px] font-bold text-[#78350f] font-certificate leading-tight uppercase">
                                        OFFICIAL<br>ACADEMY<br>SEAL
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="text-center">
                            <div class="font-heading font-bold text-base text-[#064e3b] italic mb-1 font-serif">
                                Coach ${coachName}
                            </div>
                            <div class="w-28 h-0.5 bg-slate-400 mx-auto mb-1"></div>
                            <div class="text-xs uppercase tracking-wider font-bold text-slate-700">Head Coach Signature</div>
                        </div>
                    </div>

                    <div class="mt-4 text-[9px] text-slate-400 font-mono">
                        Certificate Verification Code: ${certNo} • Verify at White Birdie Academy Portal
                    </div>

                </div>
            </div>
        `;
    }

    async handleGenerateCertificate() {
        const role = window.wbFirebaseService.userRole;
        if (role !== "admin" && role !== "coach") {
            showToast("🔒 Access is in 'View Only' mode.", "warning");
            return;
        }

        const playerName = document.getElementById("cert-player-name").value.trim();
        const fromLevel = document.getElementById("cert-from-level").value.trim();
        const toLevel = document.getElementById("cert-to-level").value.trim();
        const coachName = document.getElementById("cert-coach-name").value.trim();
        const awardDate = document.getElementById("cert-award-date").value;
        const notes = document.getElementById("cert-notes").value.trim();
        const playerId = document.getElementById("cert-player-select").value;

        if (!playerName || !toLevel) {
            showToast("Please enter Player Name and Level Shifted To.", "error");
            return;
        }

        const newCert = {
            playerId: playerId || null,
            playerName: playerName,
            fromLevel: fromLevel || "Foundation",
            toLevel: toLevel,
            awardDate: awardDate || this.getTodayDateString(),
            coachName: coachName || "Mr. Krishna",
            notes: notes || "Exemplary progress and skill mastery at White Birdie Academy.",
            certificateNo: `WBA-CERT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
        };

        await window.wbFirebaseService.saveCertificate(newCert);
        this.certificates = await window.wbFirebaseService.getCertificates();

        // If linked to an existing player, update their level
        if (playerId) {
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                player.skillLevel = toLevel.includes("Advanced") ? "Advanced" : (toLevel.includes("Intermediate") ? "Intermediate" : player.skillLevel);
                await window.wbFirebaseService.savePlayer(player);
                this.players = await window.wbFirebaseService.getPlayers();
            }
        }

        this.renderCertificateHistory();
        this.renderPlayersTab();

        // Celebration
        if (typeof confetti !== "undefined") {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        }

        showToast(`🎉 Certificate successfully generated and recorded for ${playerName}!`, "success");
    }

    renderCertificateHistory() {
        const listContainer = document.getElementById("certificate-history-list");
        if (!listContainer) return;

        if (this.certificates.length === 0) {
            listContainer.innerHTML = `<div class="p-4 text-center text-slate-500 text-sm">No certificates issued yet.</div>`;
            return;
        }

        listContainer.innerHTML = this.certificates.map(cert => `
            <div class="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/40 flex items-center justify-between">
                <div>
                    <div class="font-bold text-white flex items-center gap-2">
                        ${cert.playerName}
                        <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                            → ${cert.toLevel}
                        </span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1 font-mono">
                        ${cert.certificateNo || 'WBA-CERT'} • Awarded on ${cert.awardDate} by Coach ${cert.coachName}
                    </div>
                </div>
                <button onclick="window.wbCoachPortal.loadCertificateForPreview('${cert.id}')"
                        class="text-xs px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-medium transition">
                    View & Print
                </button>
            </div>
        `).join("");
    }

    loadCertificateForPreview(certId) {
        const cert = this.certificates.find(c => c.id === certId);
        if (!cert) return;

        document.getElementById("cert-player-name").value = cert.playerName;
        document.getElementById("cert-from-level").value = cert.fromLevel || "Foundation";
        document.getElementById("cert-to-level").value = cert.toLevel;
        document.getElementById("cert-coach-name").value = cert.coachName || "Mr. Krishna";
        document.getElementById("cert-award-date").value = cert.awardDate;
        document.getElementById("cert-notes").value = cert.notes || "";

        this.updateCertificatePreview();
        window.scrollTo({ top: document.getElementById("certificate-live-preview").offsetTop - 100, behavior: "smooth" });
    }

    async downloadCertificateImage() {
        const element = document.getElementById("certificate-printable-area");
        if (!element) return;

        if (typeof html2canvas === "undefined") {
            window.print();
            return;
        }

        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const link = document.createElement("a");
            link.download = `White-Birdie-Certificate-${document.getElementById("cert-player-name").value.replace(/\s+/g, "_")}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (e) {
            console.error("Canvas export failed, falling back to print:", e);
            window.print();
        }
    }

    // ================= TAB 5: PAYMENTS & FEES =================
    renderPaymentsTab() {
        const listContainer = document.getElementById("payments-table-body");
        if (!listContainer) return;

        // Calculate totals
        let totalCollected = 0;
        let totalPending = 0;

        this.payments.forEach(p => {
            if (p.status === "Paid") totalCollected += Number(p.amount || 0);
        });

        this.players.forEach(p => {
            if (p.status !== "Pending Approval") {
                const pend = (p.amountPending !== undefined && p.amountPending !== null)
                    ? Number(p.amountPending)
                    : (p.feeStatus === "Pending" ? Number(p.joinedFee || p.feeAmount || 0) : 0);
                totalPending += pend;
            }
        });

        const statColl = document.getElementById("stat-fee-collected");
        const statPend = document.getElementById("stat-fee-pending");
        if (statColl) statColl.textContent = `₹${totalCollected.toLocaleString("en-IN")}`;
        if (statPend) statPend.textContent = `₹${totalPending.toLocaleString("en-IN")}`;

        if (this.payments.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">No payment records logged yet.</td></tr>`;
            return;
        }

        listContainer.innerHTML = this.payments.map(pay => `
            <tr class="border-b border-emerald-950/40 hover:bg-emerald-950/20 text-sm">
                <td class="py-3 px-4 font-mono text-xs text-slate-400">${pay.receiptNo || 'WB-REC'}</td>
                <td class="py-3 px-4 font-bold text-white">${pay.playerName}</td>
                <td class="py-3 px-4 text-slate-300 font-mono font-semibold">₹${Number(pay.amount).toLocaleString("en-IN")}</td>
                <td class="py-3 px-4 text-slate-400">${pay.plan || 'Standard Coaching'}</td>
                <td class="py-3 px-4 text-xs font-mono text-slate-400">${pay.date} • ${pay.mode}</td>
                <td class="py-3 px-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${pay.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                        ${pay.status}
                    </span>
                </td>
            </tr>
        `).join("");
    }

    async handleAddPayment() {
        const role = window.wbFirebaseService.userRole;
        if (role !== "admin" && role !== "coach") {
            showToast("🔒 Access is in 'View Only' mode.", "error");
            return;
        }

        const playerId = document.getElementById("payment-player-select").value;
        const amount = document.getElementById("payment-amount").value;
        const mode = document.getElementById("payment-mode").value;
        const plan = document.getElementById("payment-plan").value;
        const date = document.getElementById("payment-date").value || this.getTodayDateString();

        if (!playerId || !amount) {
            showToast("Please choose a player and enter payment amount.", "error");
            return;
        }

        const player = this.players.find(p => p.id === playerId);

        // Get existing payments for this player to avoid duplicates
        const existingPayments = this.payments.filter(p => p.playerId === playerId);
        const totalPaid = existingPayments.reduce((sum, p) => sum + (p.amount || 0), 0) + Number(amount);

        const receiptNo = `WB-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newPay = {
            playerId: playerId,
            playerName: player ? player.name : "Registered Student",
            amount: Number(amount),
            mode: mode,
            plan: plan,
            date: date,
            status: "Paid",
            receiptNo: receiptNo
        };

        await window.wbFirebaseService.savePayment(newPay);

        // Update player fee tracking
        if (player) {
            player.amountPaid = totalPaid;
            player.amountPending = Math.max(0, (player.joinedFee || player.feeAmount || 0) - totalPaid);
            player.feeStatus = player.amountPending === 0 ? "Paid" : "Partial";
            await window.wbFirebaseService.savePlayer(player);
        }

        await this.loadAllData();
        this.renderPaymentsTab();
        this.renderPlayersTab();
        this.renderDashboardTab();

        // Generate PDF receipt
        this.generatePDFReceipt(newPay, player);

        showToast(`✅ Payment of ₹${amount} recorded successfully for ${player ? player.name : 'Player'}!`, "success");
    }

    generatePDFReceipt(payment, player) {
        if (typeof jsPDF === "undefined") {
            console.warn("jsPDF not loaded, skipping PDF generation");
            return;
        }

        const doc = new jsPDF();

        // Header - Academy Logo and Name
        doc.setFillColor(15, 56, 44); // Emerald dark
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(24);
        doc.setTextColor(16, 185, 129); // Emerald light
        doc.setFont("helvetica", "bold");
        doc.text("🏸 White Birdie Badminton Academy", 105, 15, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(203, 213, 225); // Slate light
        doc.text("VPV9+2CR, Kodathi, Kodathi JHC, Karnataka 560035", 105, 23, { align: "center" });
        doc.text("Phone: 08105806408 | Head Coach: Mr. Krishna", 105, 30, { align: "center" });

        // Receipt Title
        doc.setFontSize(18);
        doc.setTextColor(15, 56, 44);
        doc.setFont("helvetica", "bold");
        doc.text("FEE PAYMENT RECEIPT", 105, 52, { align: "center" });

        // Receipt Number and Date
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(`Receipt No: ${payment.receiptNo}`, 20, 65);
        doc.text(`Date: ${payment.date}`, 150, 65);

        // Student Details Box
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.5);
        doc.rect(20, 75, 170, 35);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Student Information", 25, 83);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Name: ${player ? player.name : payment.playerName}`, 25, 92);
        doc.text(`Student ID: ${payment.playerId}`, 25, 99);
        doc.text(`Batch: ${player ? player.batch : 'N/A'}`, 25, 106);

        // Payment Details Box
        doc.rect(20, 120, 170, 60);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Payment Details", 25, 128);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const joinedFee = player ? (player.joinedFee || player.feeAmount || 0) : 0;
        const amountPaid = player ? (player.amountPaid || 0) : Number(payment.amount);
        const amountPending = Math.max(0, joinedFee - amountPaid);

        doc.text(`Total Joined Fee:`, 25, 138);
        doc.text(`₹${joinedFee.toLocaleString('en-IN')}`, 160, 138, { align: "right" });

        doc.text(`Amount Paid (This Payment):`, 25, 148);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(16, 185, 129);
        doc.text(`₹${Number(payment.amount).toLocaleString('en-IN')}`, 160, 148, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Amount Paid:`, 25, 158);
        doc.text(`₹${amountPaid.toLocaleString('en-IN')}`, 160, 158, { align: "right" });

        doc.text(`Amount Pending:`, 25, 168);
        if (amountPending > 0) {
            doc.setTextColor(217, 119, 6); // Amber for pending
        } else {
            doc.setTextColor(16, 185, 129); // Green for paid
        }
        doc.text(`₹${amountPending.toLocaleString('en-IN')}`, 160, 168, { align: "right" });

        // Payment Mode
        doc.setTextColor(0, 0, 0);
        doc.text(`Payment Mode: ${payment.mode}`, 25, 175);

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("This is a computer-generated receipt. No signature required.", 105, 250, { align: "center" });
        doc.text("For inquiries, contact Master Admin: siddharthkoppu@gmail.com", 105, 257, { align: "center" });

        doc.setDrawColor(16, 185, 129);
        doc.line(20, 260, 190, 260);

        doc.setFontSize(8);
        doc.text("Generated by White Birdie Academy Management Portal", 105, 268, { align: "center" });

        // Save PDF
        doc.save(`WB-Receipt-${payment.receiptNo}-${player ? player.name.replace(/\s+/g, '_') : 'Student'}.pdf`);

        showToast("📄 PDF receipt generated and downloaded!", "success");
    }

    // ================= TAB 6: ACCESS CONTROL & ALLOWED GMAIL LIST =================
    renderAccessTab() {
        const listContainer = document.getElementById("allowed-gmail-list-body");
        if (!listContainer) return;

        const isAdmin = window.wbFirebaseService.userRole === "admin";

        // Clear existing content to prevent duplicates
        listContainer.innerHTML = "";

        // Helper function to get player name and batch from ID
        const getPlayerName = (playerId) => {
            const player = this.players.find(p => p.id === playerId);
            return player ? `${player.name} (${player.batch || player.skillLevel || 'Student'})` : playerId;
        };

        listContainer.innerHTML = this.allowedGmails.map(item => {
            let roleBadge;
            if (item.role === "admin") {
                roleBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/30 to-emerald-500/30 text-amber-200 border border-amber-400/60">👑 Master Admin</span>`;
            } else if (item.role === "coach") {
                roleBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">🏸 Coach</span>`;
            } else if (item.role === "parent") {
                roleBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">👨‍👧 Parent</span>`;
            } else {
                roleBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">👁️ View Only</span>`;
            }

            const linkedInfo = item.linkedPlayerId
                ? `<div class="text-[11px] text-blue-400 mt-0.5 font-medium">🔗 Linked to: ${getPlayerName(item.linkedPlayerId)}</div>`
                : '';

            return `
                <tr class="border-b border-emerald-950/40 hover:bg-emerald-950/20 text-sm">
                    <td class="py-3 px-4">
                        <div class="font-bold text-white">${item.name || item.email.split('@')[0]}</div>
                        <div class="text-xs text-emerald-400 font-mono">${item.email}</div>
                        ${linkedInfo}
                    </td>
                    <td class="py-3 px-4">${roleBadge}</td>
                    <td class="py-3 px-4 text-xs text-slate-400">
                        Added by ${item.addedBy || 'Admin'}
                    </td>
                    <td class="py-3 px-4 text-right">
                        <button onclick="window.wbCoachPortal.handleRemoveGmail('${item.id}')"
                                ${!isAdmin ? 'disabled' : ''}
                                class="text-xs px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}">
                            Remove
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        // Populate linked player dropdown in add form
        const linkedPlayerSelect = document.getElementById("new-gmail-linked-player");
        if (linkedPlayerSelect) {
            linkedPlayerSelect.innerHTML = '<option value="">-- Select Player (Child) --</option>' +
                this.players
                    .filter(p => p.status !== "Pending Approval")
                    .map(p => `<option value="${p.id}">${p.name} • ${p.batch || p.skillLevel || 'Student'}</option>`).join('');
        }

        // Display current Coach PIN if Master Admin
        if (isAdmin) {
            this.renderCoachPINSection();
        }
    }

    async renderCoachPINSection() {
        const pinContainer = document.getElementById("coach-pin-management");
        if (!pinContainer) return;

        try {
            const currentPin = await window.wbFirebaseService.getCoachPIN();
            pinContainer.innerHTML = `
                <div class="glass-card p-6 rounded-2xl border border-amber-900/40 mt-6">
                    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span>🔑</span> Coach PIN Management
                    </h3>
                    <div class="space-y-4">
                        <div class="bg-slate-900/60 p-4 rounded-xl">
                            <div class="text-sm text-slate-300 mb-2">Current Coach PIN:</div>
                            <div class="text-2xl font-mono font-bold text-emerald-300">${currentPin || 'Not Set'}</div>
                        </div>
                        <div class="flex gap-2">
                            <input type="password"
                                   id="new-coach-pin-input"
                                   placeholder="Enter new 4-digit PIN"
                                   maxlength="4"
                                   pattern="[0-9]*"
                                   class="flex-1 px-4 py-2 rounded-xl bg-slate-900/60 border border-emerald-500/30 text-white text-center text-lg font-mono tracking-widest focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition">
                            <button onclick="window.wbCoachPortal.handleSetCoachPIN()"
                                    class="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/30 transition transform hover:scale-[1.02]">
                                Set PIN
                            </button>
                        </div>
                        <p class="text-xs text-slate-400">Coaches can use this PIN for quick sign-in without Google authentication.</p>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("Failed to load Coach PIN:", e);
        }
    }

    async handleSetCoachPIN() {
        const pinInput = document.getElementById("new-coach-pin-input");
        if (!pinInput) return;

        const newPin = pinInput.value.trim();
        if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            showToast("Please enter exactly 4 digits (0-9)", "error");
            return;
        }

        try {
            await window.wbFirebaseService.setCoachPIN(newPin);
            showToast("✓ Coach PIN updated successfully!", "success");
            pinInput.value = "";
            this.renderCoachPINSection();
        } catch (e) {
            showToast("Failed to set PIN: " + e.message, "error");
        }
    }

    async handleAddAllowedGmail() {
        if (window.wbFirebaseService.userRole !== "admin") {
            showToast("🔒 Only Master Admin can add Gmail access.", "warning");
            return;
        }

        const email = document.getElementById("new-gmail-email").value.trim();
        const role = document.getElementById("new-gmail-role").value;
        const name = document.getElementById("new-gmail-name").value.trim();
        const linkedPlayerId = role === "parent" ? document.getElementById("new-gmail-linked-player").value : null;

        if (!email || !email.includes("@")) {
            showToast("Please enter a valid Gmail address.", "error");
            return;
        }

        if (role === "parent" && !linkedPlayerId) {
            showToast("Please select a child player to link this parent account to.", "error");
            return;
        }

        await window.wbFirebaseService.addAllowedGmail(email, role, name, linkedPlayerId);
        this.allowedGmails = await window.wbFirebaseService.getAllowedGmails();
        this.renderAccessTab();

        document.getElementById("new-gmail-email").value = "";
        document.getElementById("new-gmail-name").value = "";
        document.getElementById("new-gmail-linked-player").value = "";
        document.getElementById("parent-player-link-container").classList.add("hidden");

        const roleLabel = role === "admin" ? "Master Admin" : (role === "coach" ? "Coach" : "Parent");
        showToast(`✅ Access granted for ${email} as '${roleLabel}'!`, "success");
    }

    async handleRemoveGmail(id) {
        if (window.wbFirebaseService.userRole !== "admin") {
            showToast("🔒 Only Master Admin can remove Gmail access.", "warning");
            return;
        }

        const target = this.allowedGmails.find(item => item.id === id);
        const emailName = target ? target.email : "this account";

        window.showConfirmModal({
            title: "Revoke Access",
            message: `Are you sure you want to revoke system access for ${emailName}? They will no longer be able to log in.`,
            confirmText: "Yes, Revoke Access",
            cancelText: "Cancel",
            isDanger: true,
            onConfirm: async () => {
                await window.wbFirebaseService.removeAllowedGmail(id);
                this.allowedGmails = await window.wbFirebaseService.getAllowedGmails();
                this.renderAccessTab();
                showToast(`Access revoked for ${emailName}.`, "info");
            }
        });
    }

    // ================= TAB 7: PARENT VIEW (CHILD PROGRESS) =================
    renderParentView() {
        const container = document.getElementById("parent-view-container");
        if (!container) return;

        const linkedPlayerId = window.wbFirebaseService.linkedPlayerId;
        if (!linkedPlayerId) {
            container.innerHTML = `
                <div class="glass-card p-8 rounded-3xl border border-rose-500/40 text-center">
                    <div class="text-4xl mb-3">⚠️</div>
                    <h3 class="text-xl font-bold text-white mb-2">No Child Linked</h3>
                    <p class="text-sm text-slate-400">Your parent account is not linked to any player. Please contact the academy admin.</p>
                </div>
            `;
            return;
        }

        const child = this.players.find(p => p.id === linkedPlayerId);
        if (!child) {
            container.innerHTML = `
                <div class="glass-card p-8 rounded-3xl border border-rose-500/40 text-center">
                    <div class="text-4xl mb-3">❌</div>
                    <h3 class="text-xl font-bold text-white mb-2">Player Not Found</h3>
                    <p class="text-sm text-slate-400">The linked player (${linkedPlayerId}) was not found in the academy roster.</p>
                </div>
            `;
            return;
        }

        // Calculate attendance stats
        const attPercent = child.totalDays > 0 ? Math.round((child.daysPresent / child.totalDays) * 100) : 0;

        // Get child's certificates
        const childCerts = this.certificates.filter(c => c.playerId === child.id);

        // Get child's payments
        const childPayments = this.payments.filter(p => p.playerId === child.id);
        const totalPaid = childPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        container.innerHTML = `
            <!-- Child Profile Card -->
            <div class="glass-card p-6 md:p-8 rounded-3xl border border-emerald-900/40 space-y-6">

                <!-- Header with Photo -->
                <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-emerald-950/50 p-6 rounded-2xl border border-emerald-900/50">
                    <div class="relative">
                        <img src="${child.photoUrl}" class="w-28 h-28 rounded-3xl object-cover border-4 border-emerald-400 shadow-xl" alt="${child.name}">
                        <span class="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500 text-white shadow-lg">
                            ${child.status || 'Active'}
                        </span>
                    </div>
                    <div class="flex-1 text-center sm:text-left">
                        <h2 class="text-3xl font-black text-white font-heading mb-2">${child.name}</h2>
                        <div class="flex flex-wrap gap-2 justify-center sm:justify-start mb-3">
                            <span class="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                                ${child.skillLevel}
                            </span>
                            <span class="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40">
                                Age: ${child.age}
                            </span>
                        </div>
                        <div class="text-sm text-slate-300 space-y-1">
                            <div>🏸 <strong>Batch:</strong> ${child.batch}</div>
                            <div>📅 <strong>Enrolled:</strong> ${child.startDate || 'N/A'}</div>
                            <div>📞 <strong>Contact:</strong> ${child.phone}</div>
                        </div>
                    </div>
                </div>

                <!-- Attendance Stats -->
                <div>
                    <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span>📊</span> Attendance Record
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-center">
                            <div class="text-xs text-slate-400 uppercase font-bold mb-1">Total Days</div>
                            <div class="text-3xl font-bold font-mono text-white">${child.totalDays || 0}</div>
                            <div class="text-[11px] text-slate-500 mt-1">Sessions conducted</div>
                        </div>
                        <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-center">
                            <div class="text-xs text-slate-400 uppercase font-bold mb-1">Days Present</div>
                            <div class="text-3xl font-bold font-mono text-emerald-400">${child.daysPresent || 0}</div>
                            <div class="text-[11px] text-slate-500 mt-1">Classes attended</div>
                        </div>
                        <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-center">
                            <div class="text-xs text-slate-400 uppercase font-bold mb-1">Attendance Rate</div>
                            <div class="text-3xl font-bold font-mono text-teal-300">${attPercent}%</div>
                            <div class="w-full bg-slate-800 rounded-full h-2 mt-2">
                                <div class="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all duration-500" style="width: ${attPercent}%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Monthly Attendance Calendar -->
                    <div class="mt-6 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                        <h4 class="text-sm font-bold text-white mb-3 flex items-center justify-between">
                            <span>📅 Monthly Attendance Calendar</span>
                            <div class="flex gap-2">
                                <button onclick="window.wbCoachPortal.changeParentCalendarMonth(-1)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">◀</button>
                                <span class="text-emerald-400 text-xs font-mono" id="parent-calendar-month-label"></span>
                                <button onclick="window.wbCoachPortal.changeParentCalendarMonth(1)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs">▶</button>
                            </div>
                        </h4>
                        <div id="parent-attendance-calendar" class="grid grid-cols-7 gap-1 text-center"></div>
                        <div class="flex flex-wrap gap-4 justify-center mt-4 text-xs">
                            <div class="flex items-center gap-1">
                                <div class="w-4 h-4 rounded bg-emerald-500"></div>
                                <span class="text-slate-400">Present</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="w-4 h-4 rounded bg-rose-500"></div>
                                <span class="text-slate-400">Absent</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="w-4 h-4 rounded bg-slate-700"></div>
                                <span class="text-slate-400">No Session</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fee Status -->
                <div>
                    <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span>💳</span> Fee Status
                    </h3>
                    <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-slate-300">Current Status:</span>
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${child.feeStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                                ${child.feeStatus || 'Pending'}
                            </span>
                        </div>
                        <div class="text-xs text-slate-400">
                            <div>📦 Plan: ${child.durationMonths || 'N/A'} Month(s)</div>
                            <div class="mt-1">💰 Total Paid: <strong class="text-emerald-400">₹${totalPaid.toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>

                <!-- Level Certificates -->
                <div>
                    <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span>🏆</span> Level Certificates (${childCerts.length})
                    </h3>
                    ${childCerts.length > 0 ? `
                        <div class="space-y-2">
                            ${childCerts.map(cert => `
                                <div class="bg-gradient-to-r from-amber-950/60 to-emerald-950/60 p-4 rounded-xl border border-amber-500/30 flex items-center justify-between">
                                    <div>
                                        <div class="text-sm font-bold text-white">${cert.fromLevel} → ${cert.toLevel}</div>
                                        <div class="text-xs text-slate-400 mt-0.5">Awarded: ${cert.awardDate || 'N/A'}</div>
                                    </div>
                                    <div class="text-2xl">🎖️</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-center text-sm text-slate-400">
                            No certificates awarded yet. Keep training!
                        </div>
                    `}
                </div>

                <!-- Coach Remarks -->
                <div>
                    <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span>💬</span> Coach Remarks
                    </h3>
                    <div class="bg-emerald-950/40 p-5 rounded-2xl border border-emerald-900/50">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-lg flex-shrink-0">🏸</div>
                            <div class="flex-1">
                                <div class="text-sm font-bold text-emerald-300 mb-1">Coach Mr. Krishna</div>
                                <div class="text-sm text-slate-300 leading-relaxed">
                                    ${child.coachNotes || child.medicalNotes || "Great progress! Keep up the excellent work and dedication to badminton training."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;

        // After rendering parent view, initialize the calendar
        this.parentCalendarDate = new Date();
        this.renderParentCalendar(child);
    }

    renderParentCalendar(child) {
        const calendarContainer = document.getElementById("parent-attendance-calendar");
        const monthLabel = document.getElementById("parent-calendar-month-label");
        if (!calendarContainer || !monthLabel) return;

        const year = this.parentCalendarDate.getFullYear();
        const month = this.parentCalendarDate.getMonth();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthLabel.textContent = `${monthNames[month]} ${year}`;

        // Days of week header
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let html = daysOfWeek.map(d => `<div class="text-xs font-bold text-slate-400 py-1">${d}</div>`).join("");

        // First day of the month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty cells before the first day
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="p-2"></div>`;
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const attRecord = this.attendance[dateStr];

            let status = "none";
            if (attRecord && attRecord[child.id]) {
                status = attRecord[child.id];
            }

            let bgClass = "bg-slate-800 text-slate-400";
            if (status === "present") {
                bgClass = "bg-emerald-600 text-white font-bold";
            } else if (status === "absent") {
                bgClass = "bg-rose-600 text-white font-bold";
            }

            html += `
                <div class="p-2 rounded-lg ${bgClass} text-xs transition hover:scale-105 cursor-pointer" title="${dateStr}: ${status}">
                    ${day}
                </div>
            `;
        }

        calendarContainer.innerHTML = html;
    }

    changeParentCalendarMonth(offset) {
        if (!this.parentCalendarDate) this.parentCalendarDate = new Date();
        this.parentCalendarDate.setMonth(this.parentCalendarDate.getMonth() + offset);

        const linkedPlayerId = window.wbFirebaseService.linkedPlayerId;
        const child = this.players.find(p => p.id === linkedPlayerId);
        if (child) {
            this.renderParentCalendar(child);
        }
    }

    exportFullBackup() {
        const fullBackup = {
            players: this.players,
            attendance: this.attendance,
            payments: this.payments,
            certificates: this.certificates,
            allowedGmails: this.allowedGmails,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `white-birdie-academy-backup-${this.getTodayDateString()}.json`;
        a.click();
    }

    // ================= PLAYER FULL DETAILS MODAL =================
    openPlayerModal(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        this.selectedPlayer = player;

        const role = window.wbFirebaseService.userRole;
        const isReadOnly = (role !== "admin" && role !== "coach");
        const attPercent = player.totalDays > 0 ? Math.round((player.daysPresent / player.totalDays) * 100) : 0;

        const modal = document.getElementById("player-detail-modal");
        const modalBody = document.getElementById("player-detail-modal-body");
        if (!modal || !modalBody) return;

        modalBody.innerHTML = `
            <div class="p-6 md:p-8 space-y-6">
                <!-- Top Player Header Banner -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-emerald-950/50 p-6 rounded-2xl border border-emerald-900/50">
                    <div class="relative">
                        <img src="${player.photoUrl}" class="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl" alt="${player.name}">
                        <span class="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500 text-white">
                            ${player.status || 'Active'}
                        </span>
                    </div>
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-3">
                            <h2 class="text-2xl font-bold text-white font-heading">${player.name}</h2>
                            <span class="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                                ${player.skillLevel}
                            </span>
                        </div>
                        <div class="text-sm text-slate-400 mt-1 flex flex-wrap gap-4">
                            <span>📞 ${player.phone}</span>
                            <span>✉️ ${player.email}</span>
                            <span>🎂 Age: ${player.age} (${player.dob || 'N/A'})</span>
                        </div>
                        <div class="text-xs text-emerald-400 mt-2 font-medium">
                            🏸 Enrolled Batch: ${player.batch}
                        </div>
                    </div>
                </div>

                <!-- Attendance Counters Section -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
                        <div class="text-xs text-slate-400 uppercase font-bold">Total Days Recorded</div>
                        <div class="text-2xl font-bold font-mono text-white mt-1">${player.totalDays || 0}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">Total sessions conducted</div>
                    </div>
                    <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
                        <div class="text-xs text-slate-400 uppercase font-bold">Days Present</div>
                        <div class="text-2xl font-bold font-mono text-emerald-400 mt-1">${player.daysPresent || 0}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">Classes attended</div>
                    </div>
                    <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
                        <div class="text-xs text-slate-400 uppercase font-bold">Attendance Rate</div>
                        <div class="text-2xl font-bold font-mono text-teal-300 mt-1">${attPercent}%</div>
                        <div class="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                            <div class="bg-emerald-400 h-1.5 rounded-full" style="width: ${attPercent}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Editable Details Form (Coach can edit duration, batch, notes) -->
                <form id="edit-player-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Coaching Duration</label>
                            <select id="modal-edit-duration" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none">
                                <option value="1" ${player.durationMonths === 1 ? 'selected' : ''}>1 Month Plan</option>
                                <option value="3" ${player.durationMonths === 3 ? 'selected' : ''}>3 Months Plan</option>
                                <option value="6" ${player.durationMonths === 6 ? 'selected' : ''}>6 Months Pro Plan</option>
                                <option value="12" ${player.durationMonths === 12 ? 'selected' : ''}>1 Year Elite Master Plan</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Batch Assignment</label>
                            <select id="modal-edit-batch" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none">
                                ${window.INITIAL_ACADEMY_DATA.batches.map(b => `<option value="${b}" ${player.batch === b ? 'selected' : ''}>${b}</option>`).join("")}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Start Date</label>
                            <input type="date" id="modal-edit-start-date" value="${player.startDate || this.getTodayDateString()}" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">End Date / Expiry</label>
                            <input type="date" id="modal-edit-end-date" value="${player.endDate || ''}" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Skill Level</label>
                            <select id="modal-edit-skill" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none">
                                <option value="Beginner" ${player.skillLevel === 'Beginner' ? 'selected' : ''}>Begin</option>
                                <option value="Intermediate" ${player.skillLevel === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                                <option value="Advanced" ${player.skillLevel === 'Advanced' ? 'selected' : ''}>Advanced</option>
                            </select>
                        </div>

                        <!-- Fee Information Section -->
                        <div class="space-y-2">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Joined Fee (Total)</label>
                                    <input type="number" id="modal-edit-joined-fee" value="${player.joinedFee || player.feeAmount || 0}" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500 outline-none">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Amount Paid</label>
                                    <input type="number" id="modal-edit-amount-paid" value="${player.amountPaid || 0}" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500 outline-none">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Amount Pending</label>
                                    <div class="bg-slate-900 rounded-xl px-4 py-2 text-white text-sm font-mono">
                                        ₹${(player.amountPending !== undefined && player.amountPending !== null) ? Number(player.amountPending).toLocaleString('en-IN') : Math.max(0, (player.joinedFee || player.feeAmount || 0) - (player.amountPaid || 0)).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Fee Status</label>
                                    <select id="modal-edit-fee-status" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none">
                                        <option value="Paid" ${player.feeStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                                        <option value="Partial" ${player.feeStatus === 'Partial' ? 'selected' : ''}>Partial</option>
                                        <option value="Pending" ${player.feeStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Emergency Contact & Medical Notes</label>
                        <input type="text" id="modal-edit-emergency" value="${player.emergencyContact || ''}" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500 outline-none mb-2">
                        <textarea id="modal-edit-medical" ${isReadOnly ? 'disabled' : ''} rows="2" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500 outline-none">${player.medicalNotes || ''}</textarea>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-emerald-400 uppercase mb-1">Coach Krishna's Progress Remarks</label>
                        <textarea id="modal-edit-coach-notes" ${isReadOnly ? 'disabled' : ''} rows="2" class="w-full bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500 outline-none">${player.coachNotes || ''}</textarea>
                    </div>

                    <div class="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <button type="button" onclick="window.wbCoachPortal.generateCertForPlayer('${player.id}')"
                                class="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition">
                            🏆 Issue Certificate to ${player.name}
                        </button>

                        <div class="flex items-center gap-3">
                            <button type="button" onclick="window.wbCoachPortal.closePlayerModal()"
                                    class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition">
                                Close
                            </button>
                            <button type="button" onclick="window.wbCoachPortal.savePlayerDetails('${player.id}')"
                                    ${isReadOnly ? 'disabled' : ''}
                                    class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/40 transition">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove("hidden");
    }

    closePlayerModal() {
        const modal = document.getElementById("player-detail-modal");
        if (modal) modal.classList.add("hidden");
    }

    async savePlayerDetails(playerId) {
        const role = window.wbFirebaseService.userRole;
        if (role !== "admin" && role !== "coach") {
            showToast("🔒 Access is in 'View Only' mode.", "warning");
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        player.durationMonths = Number(document.getElementById("modal-edit-duration").value);
        player.batch = document.getElementById("modal-edit-batch").value;
        player.startDate = document.getElementById("modal-edit-start-date").value;
        player.endDate = document.getElementById("modal-edit-end-date").value;
        player.skillLevel = document.getElementById("modal-edit-skill").value;
        player.emergencyContact = document.getElementById("modal-edit-emergency").value;
        player.medicalNotes = document.getElementById("modal-edit-medical").value;
        player.coachNotes = document.getElementById("modal-edit-coach-notes").value;

        // Get joined fee and amount paid from inputs
        const joinedFeeInput = document.getElementById("modal-edit-joined-fee");
        if (joinedFeeInput) {
            player.joinedFee = Number(joinedFeeInput.value);
            player.totalFee = Number(joinedFeeInput.value);
            player.feeAmount = Number(joinedFeeInput.value);
        }

        const amountPaidInput = document.getElementById("modal-edit-amount-paid");
        if (amountPaidInput) {
            player.amountPaid = Number(amountPaidInput.value);
        }

        // Calculate amount pending and fee status based on joined fee and amount paid
        const joinedFee = player.joinedFee || player.feeAmount || 0;
        player.amountPending = Math.max(0, joinedFee - player.amountPaid);
        player.feeStatus = player.amountPending === 0 ? "Paid" : (player.amountPaid > 0 ? "Partial" : "Pending");

        await window.wbFirebaseService.savePlayer(player);
        this.players = await window.wbFirebaseService.getPlayers();

        this.renderPlayersTab();
        this.renderDashboardTab();
        this.renderAttendanceTab();
        this.closePlayerModal();

        showToast(`✅ Details for ${player.name} updated successfully!`, "success");
    }

    generateCertForPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        this.closePlayerModal();
        this.switchTab("certificates");

        document.getElementById("cert-player-name").value = player.name;
        document.getElementById("cert-from-level").value = player.skillLevel || "Foundation";
        document.getElementById("cert-to-level").value = player.skillLevel === "Beginner" ? "Intermediate Smash Master" : "Advanced Elite Squad Champion";
        this.updateCertificatePreview();
    }
}

// Global instance
window.wbCoachPortal = new CoachPortal();
