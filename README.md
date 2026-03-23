# Quiz Maker 🎯

A full-stack production-ready quiz web application built with React + TypeScript (frontend) and Node.js + Express (backend), with file-based JSON storage.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18 + TypeScript + Vite      |
| Styling   | Tailwind CSS v4                   |
| Routing   | React Router DOM v6               |
| Backend   | Node.js + Express                 |
| Auth      | JWT (jsonwebtoken) + bcryptjs     |
| Storage   | JSON files (file-based DB)        |

---

## Project Structure

```
Quiz_Maker/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server entry point
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT auth + middleware
│   │   ├── routes/
│   │   │   ├── auth.js            # Login / Register
│   │   │   ├── admin.js           # Admin CRUD routes
│   │   │   ├── quiz.js            # Quiz start/submit
│   │   │   └── user.js            # User profile + history
│   │   └── utils/
│   │       ├── fileUtils.js       # JSON file read/write helpers
│   │       └── quizUtils.js       # Option generation + shuffle
│   ├── data/
│   │   ├── hierarchy.json         # Subject→Topic→Subtopic tree
│   │   ├── config.json            # Quiz global settings
│   │   └── <subject>/<topic>/<subtopic>/questions.json
│   └── users/
│       └── users.json             # All registered users + history
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Router + layout
│   │   ├── main.tsx               # React entry point
│   │   ├── api/index.ts           # Axios instance
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Auth state + hooks
│   │   ├── types/index.ts         # TypeScript interfaces
│   │   ├── utils/index.ts         # Utilities (shuffle, timer, etc.)
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   ├── Alert.tsx
│   │   │   │   └── Spinner.tsx
│   │   │   └── admin/
│   │   │       └── QuestionPreview.tsx
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── SignupPage.tsx
│   │       ├── UserDashboard.tsx
│   │       ├── QuizSelectPage.tsx
│   │       ├── QuizPlayPage.tsx
│   │       ├── ResultPage.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── HierarchyManager.tsx
│   │       ├── QuestionUploadPage.tsx
│   │       └── AdminSettings.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
```

---

## Getting Started

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Run Backend

```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### 3. Run Frontend

```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## Admin Credentials

```
ID:       akash
Password: 123
```

---

## API Reference

### Auth
| Method | Endpoint                | Description          |
|--------|-------------------------|----------------------|
| POST   | /api/auth/admin/login   | Admin login          |
| POST   | /api/auth/register      | User registration    |
| POST   | /api/auth/login         | User login           |

### Admin (requires Bearer token)
| Method | Endpoint                                              | Description                |
|--------|-------------------------------------------------------|----------------------------|
| GET    | /api/admin/hierarchy                                  | Get full hierarchy         |
| POST   | /api/admin/subject                                    | Create subject             |
| POST   | /api/admin/topic                                      | Create topic               |
| POST   | /api/admin/subtopic                                   | Create subtopic            |
| DELETE | /api/admin/subject/:slug                              | Delete subject             |
| DELETE | /api/admin/topic/:subj/:topic                         | Delete topic               |
| DELETE | /api/admin/subtopic/:subj/:topic/:subtopic            | Delete subtopic            |
| GET    | /api/admin/questions/:subj/:topic/:subtopic           | Get questions              |
| POST   | /api/admin/questions/:subj/:topic/:subtopic           | Replace all questions      |
| POST   | /api/admin/questions/:subj/:topic/:subtopic/add       | Add single question        |
| PUT    | /api/admin/questions/:subj/:topic/:subtopic/:index    | Edit a question            |
| DELETE | /api/admin/questions/:subj/:topic/:subtopic/:index    | Delete a question          |
| GET    | /api/admin/config                                     | Get quiz config            |
| PUT    | /api/admin/config                                     | Update quiz config         |

### Quiz
| Method | Endpoint                | Description                       |
|--------|-------------------------|-----------------------------------|
| GET    | /api/quiz/hierarchy     | Get hierarchy (public)            |
| GET    | /api/quiz/config        | Get config (public)               |
| POST   | /api/quiz/start         | Start a quiz session              |
| POST   | /api/quiz/submit        | Submit quiz answers               |

### User
| Method | Endpoint                | Description                       |
|--------|-------------------------|-----------------------------------|
| GET    | /api/user/profile       | Get user profile                  |
| GET    | /api/user/history       | Get quiz history                  |
| POST   | /api/user/history       | Save quiz result                  |

---

## Question JSON Format

```json
{
  "questions": [
    {
      "question": "Who invented Java?",
      "answer": "James Gosling"
    },
    {
      "question": "What is the capital of France?",
      "answer": "Paris"
    }
  ]
}
```

> No options required — they are auto-generated from other answers in the pool.

---

## Quiz Settings (config.json)

| Setting            | Default | Description                              |
|--------------------|---------|------------------------------------------|
| timerPerQuestion   | 30      | Seconds per question                     |
| marksPerQuestion   | 1       | Points for correct answer                |
| negativeMarks      | 0.25    | Points deducted for wrong answer         |
| numberOfQuestions  | 10      | Default quiz length                      |
| numberOfOptions    | 4       | Answer choices per question              |

---

## Features

### Admin
- ✅ Hardcoded admin login (akash / 123)
- ✅ Create/delete Subjects, Topics, Subtopics
- ✅ Auto-creates questions.json per subtopic
- ✅ Upload questions via JSON
- ✅ Preview, edit, add, delete questions before saving
- ✅ Configure timer, marks, negative marks, options

### User
- ✅ Register / Login
- ✅ Dashboard with quiz history
- ✅ Quiz selection (Subject → Topic → Subtopic)
- ✅ Timer per question with auto-advance
- ✅ Next/Previous navigation
- ✅ Question palette sidebar
- ✅ Auto-submit on time expiry
- ✅ Score calculation with negative marking
- ✅ Detailed result review
- ✅ Quiz state persisted in localStorage (refresh-safe)

### Security
- ✅ JWT authentication
- ✅ Passwords hashed with bcrypt
- ✅ Correct answers never sent to client (server-side validation)
- ✅ Role-based access (admin / user)
- ✅ Token expiry (24h)
