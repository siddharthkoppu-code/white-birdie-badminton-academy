// mock-data.js - Initial seed data for White Birdie Badminton Academy

const INITIAL_ACADEMY_DATA = {
    info: {
        name: "White Birdie Badminton Academy",
        tagline: "Unleash Your True Badminton Potential",
        phone: "08105806408",
        email: "info@whitebirdieacademy.com",
        locationPlusCode: "VPV9+2CR, Kodathi, Kodathi JHC, Karnataka 560035",
        mapsUrl: "https://www.google.com/maps/search/?api=1&query=VPV9%2B2CR%2C+Kodathi%2C+Kodathi+JHC%2C+Karnataka+560035",
        headCoach: "Mr. Krishna",
        openingHours: "Mon - Sun: 5:00 AM - 11:00 PM",
        courts: "4 BWF Standard International Synthetic Courts",
        established: "2021"
    },

    // Default allowed Gmail list for coach/admin portal
    allowedGmails: [
        {
            id: "gmail-1",
            email: "admin@whitebirdieacademy.com",
            role: "edit", // "edit" = View and Edit, "view" = Only View
            name: "Head Admin (Mr. Krishna)",
            addedBy: "System Master",
            addedAt: "2026-01-01T00:00:00.000Z"
        },
        {
            id: "gmail-2",
            email: "krishna.coach@gmail.com",
            role: "edit",
            name: "Coach Krishna",
            addedBy: "admin@whitebirdieacademy.com",
            addedAt: "2026-01-15T10:00:00.000Z"
        },
        {
            id: "gmail-3",
            email: "assistant.coach@gmail.com",
            role: "edit",
            name: "Assistant Coach Rahul",
            addedBy: "krishna.coach@gmail.com",
            addedAt: "2026-02-01T12:30:00.000Z"
        },
        {
            id: "gmail-4",
            email: "observer.parent@gmail.com",
            role: "view",
            name: "Academy Observer / Guest",
            addedBy: "krishna.coach@gmail.com",
            addedAt: "2026-02-20T14:00:00.000Z"
        }
    ],

    // Default Players List with realistic data, attendance counts and photos
    players: [
        {
            id: "wb-p101",
            name: "Aarav Sharma",
            gender: "Male",
            age: 14,
            dob: "2012-05-14",
            phone: "9845012345",
            email: "aarav.badminton@gmail.com",
            emergencyContact: "Rajesh Sharma (Father) - 9845099999",
            skillLevel: "Intermediate",
            batch: "Morning Elite (6:00 AM - 8:00 AM)",
            durationMonths: 6,
            startDate: "2026-01-05",
            endDate: "2026-07-05",
            feeStatus: "Paid",
            feeAmount: 18000,
            status: "Active",
            photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
            totalDays: 45,
            daysPresent: 41,
            medicalNotes: "None. High stamina, excellent jump smash progression.",
            coachNotes: "Very quick across the baseline. Working on backhand clears with Coach Krishna.",
            registeredAt: "2026-01-02T10:00:00.000Z"
        },
        {
            id: "wb-p102",
            name: "Ananya Iyer",
            gender: "Female",
            age: 11,
            dob: "2015-08-22",
            phone: "9876543210",
            email: "iyer.ananya@gmail.com",
            emergencyContact: "Deepa Iyer (Mother) - 9876500000",
            skillLevel: "Beginner",
            batch: "Evening Kids Foundation (4:30 PM - 6:00 PM)",
            durationMonths: 3,
            startDate: "2026-02-01",
            endDate: "2026-05-01",
            feeStatus: "Paid",
            feeAmount: 9500,
            status: "Active",
            photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
            totalDays: 32,
            daysPresent: 29,
            medicalNotes: "Mild asthma (inhaler kept in sports kit).",
            coachNotes: "Grip fundamentals completed. Shifting to footwork shadow drills.",
            registeredAt: "2026-01-28T15:30:00.000Z"
        },
        {
            id: "wb-p103",
            name: "Rohan Varma",
            gender: "Male",
            age: 17,
            dob: "2009-03-10",
            phone: "9123456780",
            email: "rohan.varma@gmail.com",
            emergencyContact: "Kiran Varma - 9123499999",
            skillLevel: "Advanced",
            batch: "Morning Elite (6:00 AM - 8:00 AM)",
            durationMonths: 12,
            startDate: "2025-10-01",
            endDate: "2026-10-01",
            feeStatus: "Paid",
            feeAmount: 34000,
            status: "Active",
            photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
            totalDays: 95,
            daysPresent: 90,
            medicalNotes: "Previous ankle strain (tapes right ankle before match).",
            coachNotes: "District tournament finalist. Excellent net deception and high-power smash.",
            registeredAt: "2025-09-25T11:00:00.000Z"
        },
        {
            id: "wb-p104",
            name: "Pooja Hegde",
            gender: "Female",
            age: 24,
            dob: "2002-11-19",
            phone: "9988776655",
            email: "pooja.hegde@gmail.com",
            emergencyContact: "Suresh Hegde - 9988770000",
            skillLevel: "Intermediate",
            batch: "Adults Weekend Warriors (7:00 AM - 9:00 AM Sat/Sun)",
            durationMonths: 3,
            startDate: "2026-03-01",
            endDate: "2026-06-01",
            feeStatus: "Pending",
            feeAmount: 7500,
            status: "Active",
            photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
            totalDays: 14,
            daysPresent: 12,
            medicalNotes: "None.",
            coachNotes: "Improving doubles rotation and flick serves.",
            registeredAt: "2026-02-25T16:00:00.000Z"
        },
        {
            id: "wb-p105",
            name: "Vihaan Nair",
            gender: "Male",
            age: 9,
            dob: "2017-01-15",
            phone: "9448811223",
            email: "nair.vihaan.parent@gmail.com",
            emergencyContact: "Pradeep Nair (Father) - 9448899999",
            skillLevel: "Beginner",
            batch: "Evening Kids Foundation (4:30 PM - 6:00 PM)",
            durationMonths: 6,
            startDate: "2026-01-10",
            endDate: "2026-07-10",
            feeStatus: "Paid",
            feeAmount: 18000,
            status: "Active",
            photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
            totalDays: 40,
            daysPresent: 38,
            medicalNotes: "None.",
            coachNotes: "Energetic and passionate. Loves net taps and learning racquet control.",
            registeredAt: "2026-01-08T09:30:00.000Z"
        },
        {
            id: "wb-p106",
            name: "Tanvi Kulkarni",
            gender: "Female",
            age: 15,
            dob: "2011-07-04",
            phone: "9820112233",
            email: "tanvi.k@gmail.com",
            emergencyContact: "Sunil Kulkarni - 9820199999",
            skillLevel: "Intermediate",
            batch: "Evening Junior Competitive (6:00 PM - 7:30 PM)",
            durationMonths: 6,
            startDate: "2026-02-15",
            endDate: "2026-08-15",
            feeStatus: "Paid",
            feeAmount: 18000,
            status: "Active",
            photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
            totalDays: 28,
            daysPresent: 27,
            medicalNotes: "None.",
            coachNotes: "Ready for shift to Advanced Squad after state ranking trials.",
            registeredAt: "2026-02-10T14:15:00.000Z"
        }
    ],

    // Attendance logs keyed by date (YYYY-MM-DD)
    attendance: {
        "2026-09-23": {
            "wb-p101": "present",
            "wb-p102": "present",
            "wb-p103": "present",
            "wb-p104": "absent",
            "wb-p105": "present",
            "wb-p106": "present"
        },
        "2026-09-22": {
            "wb-p101": "present",
            "wb-p102": "present",
            "wb-p103": "present",
            "wb-p104": "present",
            "wb-p105": "absent",
            "wb-p106": "present"
        },
        "2026-09-21": {
            "wb-p101": "present",
            "wb-p102": "absent",
            "wb-p103": "present",
            "wb-p104": "present",
            "wb-p105": "present",
            "wb-p106": "present"
        }
    },

    // Payment Records
    payments: [
        {
            id: "pay-1001",
            playerId: "wb-p101",
            playerName: "Aarav Sharma",
            amount: 18000,
            date: "2026-01-05",
            mode: "UPI (GooglePay)",
            plan: "6 Months Intermediate Pro",
            status: "Paid",
            receiptNo: "WB-REC-2026-001"
        },
        {
            id: "pay-1002",
            playerId: "wb-p102",
            playerName: "Ananya Iyer",
            amount: 9500,
            date: "2026-02-01",
            mode: "Card / POS",
            plan: "3 Months Kids Foundation",
            status: "Paid",
            receiptNo: "WB-REC-2026-002"
        },
        {
            id: "pay-1003",
            playerId: "wb-p103",
            playerName: "Rohan Varma",
            amount: 34000,
            date: "2025-10-01",
            mode: "Bank Transfer (NEFT)",
            plan: "1 Year Elite National Prep",
            status: "Paid",
            receiptNo: "WB-REC-2025-089"
        },
        {
            id: "pay-1004",
            playerId: "wb-p104",
            playerName: "Pooja Hegde",
            amount: 7500,
            date: "2026-03-01",
            mode: "UPI",
            plan: "3 Months Weekend Adults",
            status: "Pending",
            receiptNo: "WB-REC-2026-PEND"
        }
    ],

    // Generated Certificates
    certificates: [
        {
            id: "cert-2026-001",
            certificateNo: "WBA-CERT-2026-081",
            playerId: "wb-p101",
            playerName: "Aarav Sharma",
            fromLevel: "Beginner Foundation",
            toLevel: "Intermediate Competitive Star",
            awardDate: "2026-02-15",
            coachName: "Mr. Krishna",
            notes: "Outstanding mastery of smashes, backcourt coverage, and sportsmanship.",
            issuedAt: "2026-02-15T18:00:00.000Z"
        },
        {
            id: "cert-2026-002",
            certificateNo: "WBA-CERT-2026-092",
            playerId: "wb-p103",
            playerName: "Rohan Varma",
            fromLevel: "Intermediate Squad",
            toLevel: "Advanced Elite Academy Champion",
            awardDate: "2026-03-01",
            coachName: "Mr. Krishna",
            notes: "Exemplary tournament performance, tactical net mastery, and relentless work ethic.",
            issuedAt: "2026-03-01T17:30:00.000Z"
        }
    ],

    // Batches list for selection
    batches: [
        "Morning Elite (6:00 AM - 8:00 AM)",
        "Morning Fitness & Drills (8:00 AM - 9:30 AM)",
        "Evening Kids Foundation (4:30 PM - 6:00 PM)",
        "Evening Junior Competitive (6:00 PM - 7:30 PM)",
        "Adults Night League (8:00 PM - 10:00 PM)",
        "Adults Weekend Warriors (7:00 AM - 9:00 AM Sat/Sun)",
        "Personal 1-on-1 Coaching with Coach Krishna"
    ],

    // Verified Reviews
    reviews: [
        {
            id: "rev-1",
            author: "Praveen Kumar (Badminton Enthusiast)",
            rating: 5,
            date: "2 weeks ago",
            isFeatured: true,
            text: "I recently had the pleasure of playing badminton at the White birdie badminton academy, and I must say, it was an excellent experience. The court is impeccably maintained, with a high standard of cleanliness that makes playing here a delight.\n\nA special mention goes to Coach Mr. Krishna. His expertise and passion for the game are evident in his coaching style. He is patient, encouraging, and provides insightful tips that have significantly improved my skills. His dedication to each player’s development is truly commendable.\n\nOverall, if you're looking for a top-notch badminton facility with a fantastic coach, I highly recommend White birdie badminton academy. It's a great place to enjoy the game and improve your skills."
        },
        {
            id: "rev-2",
            author: "Meenakshi Sundaram (Parent of Vihaan, Age 9)",
            rating: 5,
            date: "1 month ago",
            isFeatured: false,
            text: "Coach Krishna has transformed my son's attitude towards sports. The academy is spotlessly clean, the synthetic mats have great grip and shock absorption, and the coaching drills are structured yet fun. Highly recommended for kids and beginners!"
        },
        {
            id: "rev-3",
            author: "Dr. Sandeep Rao (Weekend Player)",
            rating: 5,
            date: "3 weeks ago",
            isFeatured: false,
            text: "The lighting is 100% anti-glare, true ceiling height, and great ventilation. Coach Krishna's tips on footwork and wrist action helped me avoid shoulder fatigue. Best badminton facility around Sarjapur / Kodathi area."
        }
    ],

    // Secret access sequence config (4 steps)
    secretSequenceConfig: {
        steps: [
            { id: "step1", name: "Nav Shuttlecock Icon", hint: "Click the glowing shuttlecock icon in the main navigation bar" },
            { id: "step2", name: "Coach Krishna Highlight", hint: "Click on Coach Mr. Krishna's badge in the About/Hero section" },
            { id: "step3", name: "Location Map Pin", hint: "Click the Kodathi location pin in the Contact section" },
            { id: "step4", name: "Footer White Birdie Emblem", hint: "Click the small golden feather emblem in the bottom footer" }
        ],
        unlocked: false
    }
};

// Export to window
if (typeof window !== "undefined") {
    window.INITIAL_ACADEMY_DATA = INITIAL_ACADEMY_DATA;
}
