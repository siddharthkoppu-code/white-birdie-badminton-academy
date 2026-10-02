# White Birdie Badminton Academy Management Portal

A comprehensive management system for badminton academies featuring player management, attendance tracking, fee management, certificate generation, and more.

## 🏸 Features

- **Player Management**: Complete CRUD operations for student profiles
- **Attendance Tracking**: Daily attendance with visual indicators
- **Fee Management**: Automatic fee calculations, payment tracking, monthly updates
- **Role-Based Access Control**: Master Admin, Coach, and Parent roles with appropriate permissions
- **Coach PIN Authentication**: Secure PIN login for coaches linked to specific Gmail accounts
- **Certificate Generation**: Generate level completion certificates
- **Data Persistence**: Firebase Firestore with localStorage fallback
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Real-time Updates**: Live synchronization across views

## 🔐 Authentication System

- **Master Admin**: Full access to all features including Access Control
- **Coach**: Access to player management, attendance, fees, certificates (except Access Control)
- **Parent**: Limited view-only access to child's progress
- **PIN Login**: Coaches can login using a 4-digit PIN linked to their Gmail account

## 💰 Fee System

The academy uses a 3-way auto-calculating fee system:
- **totalFee**: Total amount due for the plan
- **amountPaid**: Amount paid by the student
- **amountPending**: Automatically calculated (totalFee - amountPaid)
- **feeStatus**: Auto-derived as "Paid", "Partial", or "Pending"

Monthly fee updates can be run manually to add recurring fees based on plan duration.

## 📱 Mobile Responsiveness

The portal is fully responsive and optimized for:
- Mobile phones (portrait and landscape)
- Tablets
- Desktop computers
- Touch interfaces with minimum 44x44px tap targets

## 📲 Converting to Mobile Apps

See `APP_CONVERSION_GUIDE.md` for detailed instructions on converting this web portal to:
1. Progressive Web App (PWA) - Recommended for easiest deployment
2. Hybrid apps using Capacitor.js/Ionic
3. Native apps using React Native/Flutter

## 🛠️ Technical Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Firebase Firestore (with localStorage fallback)
- **Authentication**: Firebase Auth + Custom PIN system
- **Styling**: Custom CSS with glassmorphism and badminton-themed design
- **Icons**: Emoji-based for lightweight implementation

## 📁 File Structure

```
index.html          - Main portal interface
coach-portal.js     - Main application logic
firebase-service.js - Firebase integration and data services
styles.css          - Custom styling and mobile responsiveness
mock-data.js        - Initial academy data (7 demo players)
push-to-github.bat  - Manual Git push script (user-operated)
```

## 🚀 Getting Started

1. Open `index.html` in a modern web browser
2. Use Master Admin credentials to access all features
3. Set up Coach PIN in Access Control tab (Master Admin only)
4. Coaches can login using PIN for quick access
5. Parents can view child's progress through Parent Login

## 🔒 Security Features

- Role-based access restrictions
- PIN-based coach authentication
- Master Admin-only access to sensitive controls
- Input validation and sanitization
- Secure data persistence with Firebase

## 📞 Support & Contact

For technical support or feature requests, contact the system administrator.

---
*White Birdie Badminton Academy Management Portal*
*Built with ❤️ for badminton coaching excellence*