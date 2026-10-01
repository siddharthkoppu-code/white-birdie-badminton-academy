# 🏸 White Birdie Badminton Academy

A modern, full-featured public website and role-based management portal for **White Birdie Badminton Academy**, Kodathi, Karnataka.

## 🌐 Live Site

Once deployed via GitHub Pages, visit:  
**https://siddharthkoppu-code.github.io/white-birdie-badminton-academy/**

---

## ✨ Features

### Public Website
- **Hero Section** with animated shuttlecock, luxury emerald & dark court aesthetic, and gold accents
- **Coach Mr. Krishna Spotlight** with credentials, certifications, and coaching philosophy
- **Batch Programs** — Beginner, Intermediate, Advanced & Weekend batches with pricing
- **Facilities** — 6 BWF standard synthetic courts, Yonex equipment, video analysis, fitness lounge
- **Featured Testimonial** — Real review from Praveen Kumar
- **Location & Contact** — Kodathi address, interactive Google Maps embed, phone number (`08105806408`)
- **Public Registration Form** — Student registration with live photo upload preview and fee computation

### 🔐 Secret Coach Access (Hidden Login)
The portal is accessed through a **sequential 4-step click sequence** on the website:

| Step | Element | Location |
|------|---------|----------|
| 1 | 🏸 Shuttlecock Logo | Top navigation bar |
| 2 | Coach Mr. Krishna Badge | Hero section |
| 3 | 📍 Kodathi Location Pin | Contact section |
| 4 | 🪶 Golden Feather Emblem | Footer area |

**Shortcut:** Press `Ctrl + Shift + K` to open the login modal directly.  
**Discreet Link:** A small hidden button in the footer also opens the login modal.

---

## 🔑 3-Tier Role-Based Access Control (RBAC)

| Role | Target User | Access & Capabilities |
|------|-------------|-----------------------|
| 👑 **Master Admin** | `siddharthkoppu@gmail.com` (Siddharth Koppu) | **Full Administrative Authority**<br>• Sole privilege to invite/remove Coach and Parent accounts<br>• Link parents to their specific child<br>• Full operational access: Players, Attendance, Certificates, Payments, Access Control |
| 🏸 **Head Coach** | Coach Mr. Krishna & Academy Coaches | **Coaching & Operations**<br>• Full access to: Dashboard, Player Directory, Daily Attendance Marking, Certificate Generation, Payment Logging<br>• Restricted: Cannot manage or view Access Control |
| 👨‍👧 **Parent** | Parents (e.g. Pradeep Nair) | **Data-Isolated Child Progress**<br>• Exclusively views their own child's progress card (`linkedPlayerId`)<br>• Total days & days present with animated attendance percentage bar<br>• Fee status and payment history<br>• Awarded certificates and Coach Krishna's notes<br>• Strictly isolated: Cannot see other students or coaching tabs |

---

## 🚀 Quick Start & Testing

### Option 1: Open Directly
Double-click `index.html` in your browser. Runs offline-first with zero configuration using browser `localStorage` (key prefix `wb_badminton_v2_`).

### Option 2: Local Server
Double-click `run-server.bat` or run:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

### Option 3: Instant Demo Logins
1. Open the website.
2. Press `Ctrl + Shift + K` or complete the 4-step secret click sequence.
3. Click any of the 3 role buttons:
   - 👑 **Demo Master Admin (Siddharth Koppu)** → Test full academy control & access management
   - 🏸 **Demo Coach (Mr. Krishna)** → Test player management, attendance, certificates, and fees
   - 👨‍👧 **Demo Parent (Vihaan's Parent)** → Test isolated child progress view

---

## 📤 Manual Deployment to GitHub

To push the latest updates to your GitHub repository and deploy on GitHub Pages:

1. Double-click **`push-to-github.bat`** in the project folder.
2. The script will automatically stage all changes, commit them, and push to the `main` branch.

---

## 📁 Project Structure

```
white-birdie-badminton-academy/
├── index.html           # Main HTML — public site + coach portal + parent view
├── styles.css           # Emerald/gold glassmorphism, animations, print stylesheet
├── app.js               # Public interactions, secret sequence, registration modal
├── coach-portal.js      # Coach portal logic (dashboard, attendance, certs, parent view)
├── firebase-service.js  # 3-tier RBAC + session management + localStorage persistence
├── mock-data.js         # Seed database (players, attendance, payments, access list)
├── push-to-github.bat   # One-click manual deploy script to GitHub
├── run-server.bat       # Local development server script
└── README.md            # Documentation
```

---

## 📞 Academy Information

- **Name:** White Birdie Badminton Academy
- **Address:** VPV9+2CR, Kodathi, Kodathi JHC, Karnataka 560035
- **Phone:** 08105806408
- **Head Coach:** Mr. Krishna
- **Master Admin:** Siddharth Koppu (`siddharthkoppu@gmail.com`)

---

*Built with 🏸 for White Birdie Badminton Academy*
