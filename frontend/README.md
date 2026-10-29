# UniTask — Frontend

React 19 + TypeScript + Vite SPA with Bootstrap and Tailwind CSS.

## Structure

```
frontend/
├── index.html              # HTML entry point
├── vite.config.ts          # Vite build configuration
└── src/
    ├── App.tsx             # Root component & router
    ├── main.tsx            # React DOM entry
    ├── index.css           # Global styles
    ├── assets/             # Static images
    ├── components/
    │   └── layout/         # Navbar, Sidebar, MainLayout, ProtectedRoute
    ├── context/
    │   └── AuthContext.tsx  # Auth state & JWT management
    ├── pages/
    │   ├── admin/          # Admin dashboard, users, courses, activity
    │   ├── auth/           # Login, register, forgot password
    │   ├── common/         # Shared pages (API docs, etc.)
    │   ├── student/        # Student dashboard, assignments, grades
    │   └── teacher/        # Teacher dashboard, courses, grading
    └── services/
        └── api.ts          # Axios API client
```

## Setup

```bash
npm install
npm run dev
```

Frontend dev server starts on `http://localhost:5173`.  
Make sure the backend is running on port 3000 so API calls resolve correctly.
