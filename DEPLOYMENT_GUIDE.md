# Deploy White Birdie Academy to Firebase Hosting

## Quick Setup (5 minutes)

### Step 1: Install Firebase Tools
Open Command Prompt and run:
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase Hosting
In your project folder (white-birdie-badminton-academy):
```bash
firebase init hosting
```

When prompted:
- **Use existing project?** YES → Select "white-birdie"
- **Public directory?** Type: `.` (current directory)
- **Single-page app?** NO
- **Overwrite index.html?** NO

### Step 4: Deploy
```bash
firebase deploy --only hosting
```

Your site will be live at: **https://white-birdie.web.app**

---

## Option 2: Netlify Drop (Drag & Drop - No Command Line!)

1. Go to https://app.netlify.com/drop
2. Drag your entire `white-birdie-badminton-academy` folder onto the page
3. Wait 30 seconds - Done! You get a live URL instantly

---

## Option 3: Vercel (Simple CLI)

```bash
npx vercel
```

Follow prompts, and you'll get a live URL.

---

## Why Hosting Fixes Everything

✅ Works with Firebase Authentication (https:// protocol)
✅ Accessible from any device
✅ Share with coaches/parents via URL
✅ Automatic SSL certificate
✅ Free forever (Firebase/Netlify/Vercel free tier)
✅ Easy to update: just run deploy command again

---

## My Recommendation

Use **Firebase Hosting** since you're already on Firebase:
1. Takes 5 minutes to set up
2. Free forever for your use case
3. Integrates perfectly with Firebase Auth & Firestore
4. You get: https://white-birdie.web.app

After deployment, your authentication will work perfectly!