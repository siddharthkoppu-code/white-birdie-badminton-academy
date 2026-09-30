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
                const d = new Date(this.selectedAttendanceDate);
                d.setDate(d.getDate() - 1);
                this.selectedAttendanceDate = d.toISOString().split("T")[0];
                if (datePicker) datePicker.value = this.selectedAttendanceDate;
                this.renderAttendanceTab();
            });
        }

        const btnNextDay = document.getElementById("btn-att-next");
        if (btnNextDay) {
            btnNextDay.addEventListener("click", () => {
                const d = new Date(this.selectedAttendanceDate);
                d.setDate(d.getDate() + 1);
                this.selectedAttendanceDate = d.toISOString().split("T")[0];
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

        // Generate Certificate Form Submit
        const certForm = document.getElementById("cert-generator-form");
        if (certForm) {
            certForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleGenerateCertificate();
            });
        }

        // Certificate Print & Download
        const btnPrintCert = document.getElementById("btn-print-certificate");
        if (btnPrintCert) {
            btnPrintCert.addEventListener("click", () => window.print());
        }

        const btnDownloadCert = document.getElementById("btn-download-certificate");
        if (btnDownloadCert) {
            btnDownloadCert.addEventListener("click", () => this.downloadCertificateImage());
        }

        // Add Gmail Allowlist Form
        const addGmailForm = document.getElementById("add-gmail-form");
        if (addGmailForm) {
            addGmailForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleAddAllowedGmail();
            });
        }

        // Add Payment Form
        const addPaymentForm = document.getElementById("add-payment-form");
        if (addPaymentForm) {
            addPaymentForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleAddPayment();
            });
        }

        // Firebase Config Form
        const fbConfigForm = document.getElementById("firebase-config-form");
        if (fbConfigForm) {
            fbConfigForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSaveFirebaseConfig();
            });
        }

        // Export / Import Backup Data
        const btnExportData = document.getElementById("btn-export-backup");
        if (btnExportData) {
            btnExportData.addEventListener("click", () => this.exportBackupJSON());
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
        if (tabId === "certificates") this.renderCertificatesTab();
        if (tabId === "payments") this.renderPaymentsTab();
        if (tabId === "access") this.renderAccessTab();
        if (tabId === "settings") this.renderSettingsTab();
    }

    renderAll() {
        this.renderUserBadge();
        this.renderDashboardTab();
        this.renderPlayersTab();
        this.renderAttendanceTab();
        this.renderCertificatesTab();
        this.renderPaymentsTab();
        this.renderAccessTab();
        this.renderSettingsTab();
        this.populatePlayerDropdowns();
    }

    renderUserBadge() {
        const user = window.wbFirebaseService.currentUser;
        const role = window.wbFirebaseService.userRole; // 'edit' or 'view'
        const badgeContainer = document.getElementById("portal-user-badge");

        if (!badgeContainer) return;

        const isReadOnly = role === "view";
        const roleText = isReadOnly ? "👁️ View Only Mode" : "⚡ Full Coach Access (View & Edit)";
        const roleColor = isReadOnly ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

        badgeContainer.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${user ? user.photoURL : 'https://ui-avatars.com/api/?name=Coach+Krishna'}"
                     class="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover shadow-md" alt="Avatar">
                <div class="text-left leading-tight">
                    <div class="font-bold text-white flex items-center gap-2">
                        ${user ? user.displayName : 'Coach Mr. Krishna'}
                        <span class="text-xs px-2 py-0.5 rounded-full border ${roleColor} font-semibold">
                            ${roleText}
                        </span>
                    </div>
                    <div class="text-xs text-slate-400 font-mono">${user ? user.email : 'krishna.coach@gmail.com'}</div>
                </div>
            </div>
        `;

        // Apply read-only locks across UI if user has 'view' only
        this.applyRoleRestrictions(isReadOnly);
    }

    applyRoleRestrictions(isReadOnly) {
        document.querySelectorAll(".require-edit-role").forEach(el => {
            if (isReadOnly) {
                el.disabled = true;
                el.classList.add("opacity-50", "cursor-not-allowed");
                el.setAttribute("title", "Requires 'View & Edit' Coach Permission");
            } else {
                el.disabled = false;
                el.classList.remove("opacity-50", "cursor-not-allowed");
                el.removeAttribute("title");
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
        const isReadOnly = window.wbFirebaseService.userRole === "view";

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
        if (window.wbFirebaseService.userRole === "view") {
            alert("🔒 Access is in 'View Only' mode. Contact Master Coach for edit permissions.");
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
        if (window.wbFirebaseService.userRole === "view") {
            alert("🔒 Access is in 'View Only' mode.");
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
        if (window.wbFirebaseService.userRole === "view") {
            alert("🔒 Access is in 'View Only' mode.");
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
            alert("Please enter Player Name and Level Shifted To.");
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

        alert(`🎉 Certificate successfully generated and recorded for ${playerName}!`);
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
            if (p.feeStatus === "Pending") totalPending += Number(p.feeAmount || 5000);
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
        if (window.wbFirebaseService.userRole === "view") {
            alert("🔒 Access is in 'View Only' mode.");
            return;
        }

        const playerId = document.getElementById("payment-player-select").value;
        const amount = document.getElementById("payment-amount").value;
        const mode = document.getElementById("payment-mode").value;
        const plan = document.getElementById("payment-plan").value;
        const date = document.getElementById("payment-date").value || this.getTodayDateString();

        if (!playerId || !amount) {
            alert("Please choose a player and enter payment amount.");
            return;
        }

        const player = this.players.find(p => p.id === playerId);

        const newPay = {
            playerId: playerId,
            playerName: player ? player.name : "Registered Student",
            amount: Number(amount),
            mode: mode,
            plan: plan,
            date: date,
            status: "Paid",
            receiptNo: `WB-REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
        };

        await window.wbFirebaseService.savePayment(newPay);

        // Update player status to Paid
        if (player) {
            player.feeStatus = "Paid";
            player.feeAmount = Number(amount);
            await window.wbFirebaseService.savePlayer(player);
        }

        await this.loadAllData();
        this.renderPaymentsTab();
        this.renderPlayersTab();
        this.renderDashboardTab();

        alert(`✅ Payment of ₹${amount} recorded successfully for ${player ? player.name : 'Player'}!`);
    }

    // ================= TAB 6: ACCESS CONTROL & ALLOWED GMAIL LIST =================
    renderAccessTab() {
        const listContainer = document.getElementById("allowed-gmail-list-body");
        if (!listContainer) return;

        const isReadOnly = window.wbFirebaseService.userRole === "view";

        listContainer.innerHTML = this.allowedGmails.map(item => {
            const isEdit = item.role === "edit";
            const roleBadge = isEdit
                ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">⚡ View & Edit (Coach/Admin)</span>`
                : `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">👁️ Only View (Guest/Observer)</span>`;

            return `
                <tr class="border-b border-emerald-950/40 hover:bg-emerald-950/20 text-sm">
                    <td class="py-3 px-4">
                        <div class="font-bold text-white">${item.name || item.email.split('@')[0]}</div>
                        <div class="text-xs text-emerald-400 font-mono">${item.email}</div>
                    </td>
                    <td class="py-3 px-4">${roleBadge}</td>
                    <td class="py-3 px-4 text-xs text-slate-400">
                        Added by ${item.addedBy || 'Admin'}
                    </td>
                    <td class="py-3 px-4 text-right">
                        <button onclick="window.wbCoachPortal.handleRemoveGmail('${item.id}')"
                                ${isReadOnly ? 'disabled' : ''}
                                class="text-xs px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition">
                            Remove
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    async handleAddAllowedGmail() {
        if (window.wbFirebaseService.userRole === "view") {
            alert("🔒 Access is in 'View Only' mode.");
            return;
        }

        const email = document.getElementById("new-gmail-email").value.trim();
        const role = document.getElementById("new-gmail-role").value;
        const name = document.getElementById("new-gmail-name").value.trim();

        if (!email || !email.includes("@")) {
            alert("Please enter a valid Gmail address.");
            return;
        }

        await window.wbFirebaseService.addAllowedGmail(email, role, name);
        this.allowedGmails = await window.wbFirebaseService.getAllowedGmails();
        this.renderAccessTab();

        document.getElementById("new-gmail-email").value = "";
        document.getElementById("new-gmail-name").value = "";

        alert(`✅ Access granted for ${email} as '${role === "edit" ? "View and Edit" : "Only View"}'!`);
    }

    async handleRemoveGmail(id) {
        if (window.wbFirebaseService.userRole === "view") {
            alert("🔒 Access is in 'View Only' mode.");
            return;
        }

        if (confirm("Are you sure you want to revoke access for this Gmail?")) {
            await window.wbFirebaseService.removeAllowedGmail(id);
            this.allowedGmails = await window.wbFirebaseService.getAllowedGmails();
            this.renderAccessTab();
        }
    }

    // ================= TAB 7: SETTINGS & FIREBASE =================
    renderSettingsTab() {
        const config = window.wbFirebaseService.config || {};
        document.getElementById("fb-apiKey").value = config.apiKey || "";
        document.getElementById("fb-authDomain").value = config.authDomain || "";
        document.getElementById("fb-projectId").value = config.projectId || "";
        document.getElementById("fb-storageBucket").value = config.storageBucket || "";
        document.getElementById("fb-messagingSenderId").value = config.messagingSenderId || "";
        document.getElementById("fb-appId").value = config.appId || "";

        const statusPill = document.getElementById("firebase-connection-status");
        if (statusPill) {
            if (window.wbFirebaseService.isLiveMode) {
                statusPill.innerHTML = `
                    <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-emerald-300 font-bold">Connected to Live Firebase (Firestore + Google Auth)</span>
                `;
            } else {
                statusPill.innerHTML = `
                    <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span class="text-amber-300 font-bold">Offline LocalStorage Mode (Ready for Firebase keys)</span>
                `;
            }
        }
    }

    async handleSaveFirebaseConfig() {
        const newConfig = {
            apiKey: document.getElementById("fb-apiKey").value.trim(),
            authDomain: document.getElementById("fb-authDomain").value.trim(),
            projectId: document.getElementById("fb-projectId").value.trim(),
            storageBucket: document.getElementById("fb-storageBucket").value.trim(),
            messagingSenderId: document.getElementById("fb-messagingSenderId").value.trim(),
            appId: document.getElementById("fb-appId").value.trim()
        };

        window.wbFirebaseService.saveConfig(newConfig);
        alert("Firebase credentials saved! Reloading Firebase instance...");
        await window.wbFirebaseService.init();
        this.renderSettingsTab();
    }

    exportBackupJSON() {
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

        const isReadOnly = window.wbFirebaseService.userRole === "view";
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
                                <option value="Beginner" ${player.skillLevel === 'Beginner' ? 'selected' : ''}>Beginner</option>
                                <option value="Intermediate" ${player.skillLevel === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                                <option value="Advanced" ${player.skillLevel === 'Advanced' ? 'selected' : ''}>Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Fee Status</label>
                            <select id="modal-edit-fee-status" ${isReadOnly ? 'disabled' : ''} class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none">
                                <option value="Paid" ${player.feeStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                                <option value="Pending" ${player.feeStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                            </select>
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
        if (window.wbFirebaseService.userRole === "view") {
            alert("🔒 Access is in 'View Only' mode.");
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        player.durationMonths = Number(document.getElementById("modal-edit-duration").value);
        player.batch = document.getElementById("modal-edit-batch").value;
        player.startDate = document.getElementById("modal-edit-start-date").value;
        player.endDate = document.getElementById("modal-edit-end-date").value;
        player.skillLevel = document.getElementById("modal-edit-skill").value;
        player.feeStatus = document.getElementById("modal-edit-fee-status").value;
        player.emergencyContact = document.getElementById("modal-edit-emergency").value;
        player.medicalNotes = document.getElementById("modal-edit-medical").value;
        player.coachNotes = document.getElementById("modal-edit-coach-notes").value;

        await window.wbFirebaseService.savePlayer(player);
        this.players = await window.wbFirebaseService.getPlayers();

        this.renderPlayersTab();
        this.renderDashboardTab();
        this.renderAttendanceTab();
        this.closePlayerModal();

        alert(`✅ Details for ${player.name} updated successfully!`);
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
