# 🦅 Rwanda Driving Licence Practice System

A web-based exam practice platform that simulates the HAVANA SHELF DEPARTMENT (RNP) provisional driving licence online exam.

## Features
- ✅ Bilingual: Kinyarwanda & English
- ✅ Real exam simulation (20 questions, 20 minutes)
- ✅ Pass mark: 12/20 (60%)
- ✅ Matches RNP portal UI (navy blue, question bubbles, countdown timer)
- ✅ User registration & login
- ✅ Exam history tracking
- ✅ Answer review after exam

---

## Setup & Run

### 1. Backend
```bash
cd driving-exam/backend
npm install
node seed.js       # Seeds database with questions
npm start          # Starts API on http://localhost:5000
```

### 2. Frontend (new terminal)
```bash
cd driving-exam/frontend
npm install
npm start          # Starts React app on http://localhost:3000
```

### 3. Open browser
Go to: **http://localhost:3000**

---

## Default Login
| Field    | Value           |
|----------|-----------------|
| Email    | test@rnp.rw     |
| Password | test123         |

---

## Exam Rules
- 20 random questions per session
- 20 minutes time limit (auto-submits when timer reaches 0)
- Need 12/20 correct answers to pass (60%)
- Navigate between questions using number bubbles
- Green bubble = answered, Blue = current, Gray = unanswered

---

## Tech Stack
| Layer    | Technology              |
|----------|-------------------------|
| Frontend | React 18 + React Router |
| Backend  | Node.js + Express       |
| Database | SQLite (better-sqlite3) |
| Auth     | JWT tokens              |

---

## Project Structure
```
driving-exam/
├── backend/
│   ├── server.js          # Express server (port 5000)
│   ├── db.js              # SQLite database setup
│   ├── seed.js            # Question seeder (run once)
│   ├── middleware/auth.js # JWT middleware
│   └── routes/
│       ├── auth.js        # Login/register
│       ├── exam.js        # Questions & submission
│       └── admin.js       # Question management
└── frontend/
    └── src/
        ├── App.js
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js
        │   ├── ExamPage.js
        │   └── ResultPage.js
        └── index.css
```
