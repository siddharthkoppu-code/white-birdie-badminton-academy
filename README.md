# 🏸 White Birdie Badminton Academy

A modern, full-featured website and coach management portal for **White Birdie Badminton Academy**, Kodathi, Karnataka.

## 🌐 Live Site

Once deployed via GitHub Pages, visit:  
**https://siddharthkoppu-code.github.io/white-birdie-badminton-academy/**

---

## ✨ Features

### Public Website
- **Hero Section** with animated shuttlecock and academy branding
- **Coach Mr. Krishna Spotlight** with credentials and coaching philosophy
- **Batch Programs** — Morning, Evening, Weekend batches with pricing
- **Facilities** — Court details, equipment, amenities
- **Featured Review** — Real testimonial from a satisfied player
- **Location & Contact** — Kodathi address, Google Maps embed, phone number
- **Registration Form** — Public player sign-up with photo upload and live preview

### 🔐 Secret Coach Access (Hidden Login)
The admin portal is accessed through a **hidden 4-step click sequence** on the website:

| Step | Element | Location |
|------|---------|----------|
| 1 | 🏸 Shuttlecock Logo | Top navigation bar |
| 2 | Coach Mr. Krishna name | Hero section badge |
| 3 | 📍 Kodathi Location Pin | Contact section |
| 4 | 🪶 Golden Feather Emblem | Footer area |

**Shortcut:** Press `Ctrl + Shift + K` to skip directly to login.  
**Discreet Link:** A small "🏸" icon in the footer also opens the login modal.

### Coach Portal (After Login)
- **Dashboard** — Total players, attendance rate, fee collection summary, recent activity table
- **Player Directory** — Searchable/filterable card grid with photos, attendance bars, fee status; click any card for full profile modal with editable duration, fee status, and notes
- **Attendance Tab** — Select any date, all players listed with one-click Present / Absent / Leave toggles; bulk mark all; per-player attendance stats
- **Certificate Generator** — Enter player name and level; live preview with gold seal, ornate borders, and Coach Krishna's signature; print or download as PNG
- **Payments & Fees** — Log payments, auto-generate receipt numbers, track collected vs pending amounts
- **Gmail Access Control** — Add/remove authorized Gmail accounts with either "View & Edit" (Full Coach) or "Only View" (Guest Observer) permissions
- **Settings** — Firebase configuration, data import/export, local storage management

### 🔑 Access Roles
| Role | Capabilities |
|------|-------------|
| **View & Edit** (Coach/Admin) | Full access — add/edit players, mark attendance, generate certificates, log payments, manage Gmail access |
| **Only View** (Guest/Observer) | Read-only — browse dashboard, view players, see attendance records; all mutation buttons disabled |

---

## 🚀 Quick Start

### Option 1: Open directly
Double-click `index.html` in your browser. Everything works out of the box with **local storage** and demo data.

### Option 2: Local server (recommended)
Double-click `run-server.bat` to start a local Python server, then visit `http://localhost:8000`.

### Option 3: Demo login
1. Open the site
2. Press `Ctrl + Shift + K` or complete the secret click sequence
3. Click **"Demo Coach (View & Edit)"** or **"Demo Viewer (Only View)"**

---

## 🔥 Firebase Setup (Optional — for live multi-device sync)

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project
2. Enable **Authentication → Google Sign-In**
3. Enable **Cloud Firestore** database
4. Copy your Firebase config from Project Settings → General → Your apps → Config
5. In the Coach Portal, go to **Settings Tab** and paste each field:
   - API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID
6. Click **Save & Activate Firebase**

Without Firebase, the app runs fully functional using browser localStorage.

---

## 📁 Project Structure

```
white-birdie-badminton-academy/
├── index.html           # Main HTML — public site + coach portal
├── styles.css           # Custom styles, glassmorphism, animations, print
├── app.js               # Public interactions, secret sequence, registration
├── coach-portal.js      # Full coach portal logic (dashboard, attendance, certs)
├── firebase-service.js  # Auth + Firestore + localStorage dual-layer service
├── mock-data.js         # Seed data (players, attendance, payments, reviews)
├── push-to-github.bat   # One-click deploy to GitHub
├── run-server.bat       # One-click local development server
└── README.md            # This file
```

---

## 📞 Academy Contact

- **Address:** VPV9+2CR, Kodathi, Kodathi JHC, Karnataka 560035
- **Phone:** 08105806408
- **Head Coach:** Mr. Krishna

---

## 🛠 Tech Stack

- **HTML5 / Tailwind CSS** (via CDN) with custom glassmorphic design
- **Vanilla JavaScript** — no build step, no framework dependencies
- **Firebase Auth + Firestore** (optional live mode)
- **localStorage** (offline-first fallback)
- **html2canvas** for certificate image export
- **canvas-confetti** for celebration effects

---

*Built with 🏸 for White Birdie Badminton Academy*
