# UniTask - University Student Assignment Management System

A production-grade, full-stack university assignment management platform built with **React**, **Bootstrap 5**, **Node.js/Express.js**, and **Neon PostgreSQL**.

---

## 1. System Overview

UniTask streamlines coursework management for university departments:
- **Students** track assignment deadlines, upload submissions (PDF, DOCX, ZIP, code), view marks, and read detailed instructor feedback.
- **Teachers & Faculty** design assignments, publish rubrics, attach reference materials, download student submissions, grade coursework, and publish marks.
- **Administrators** monitor system activity, manage student/teacher accounts, create courses, and inspect database connectivity.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, Bootstrap 5.3, Bootstrap Icons, React Router DOM v7, Axios, React Context API.
- **Backend**: Node.js & Express.js, TypeScript (`server.ts`).
- **Database**: Neon PostgreSQL via `pg` (node-postgres) with SSL/TLS, alongside a resilient local university data engine.
- **Security**: bcrypt password hashing, JSON Web Tokens (JWT), role-based middleware, Multer sanitized uploads, Helmet headers, CORS.
- **Documentation**: Built-in interactive OpenAPI 3.0 specification (`/api-docs` and `GET /api/docs`).

---

## 3. Pre-Seeded Evaluation Accounts

For immediate evaluation, the database comes pre-seeded with sample users across all roles:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Student** | Alex Chen | `alex.chen@student.university.edu` | `Student@123` |
| **Student** | Emma Watson | `emma.watson@student.university.edu` | `Student@123` |
| **Teacher** | Dr. Robert Smith | `dr.smith@university.edu` | `Teacher@123` |
| **Teacher** | Prof. Sarah Johnson | `prof.johnson@university.edu` | `Teacher@123` |
| **Admin** | System Administrator | `admin@university.edu` | `Admin@123` |

*Tip: You can also use the 1-Click quick login buttons on the login page or the "Switch Demo Role" dropdown in the top navbar.*

---

## 4. Connecting to Neon PostgreSQL

Your existing Neon project details:
- **Organization ID**: `org-aged-queen-84768675`
- **Project ID**: `empty-wave-35284158`
- **Branch**: `production`
- **Database**: PostgreSQL

### Connecting via Connection String:
1. Open the `.env` file in the project root.
2. Set your Neon PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-empty-wave-35284158.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```
3. Restart or start the server (`npm run dev`). UniTask automatically verifies the connection, runs `migrations/001_initial_schema.sql`, and provisions all tables and indexes.

---

## 5. Security & Bootstrap Administrator Procedure

Public self-registration (`/register`) is strictly restricted to **Student** and **Teacher** roles; the backend rejects any attempt to register an administrator account publicly.

To securely bootstrap or promote an administrator:
Send a `POST` request to `/api/admin/bootstrap`:
```bash
curl -X POST http://localhost:3000/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "bootstrap_key": "unitask_admin_bootstrap_key_2026",
    "full_name": "Chief Academic Officer",
    "email": "chief.admin@university.edu",
    "password": "SecurePassword@123"
  }'
```

---

## 6. Available Scripts

- `npm run dev` &mdash; Starts the full-stack server on port 3000 (`tsx server.ts` with Vite middlewares mounted).
- `npm run build` &mdash; Builds the production Vite frontend bundle into `/dist`.
- `npm test` &mdash; Executes the backend test suite verifying authentication, role access, and deadline calculations.
- `npm run lint` &mdash; Validates TypeScript types across the codebase.

---

## 7. PostgreSQL Database Schema

The normalized PostgreSQL relational schema includes:
1. `users` &mdash; user credentials, role (`student`, `teacher`, `admin`), active status, department, bio.
2. `courses` &mdash; course code (`CS202`, etc.), title, teacher instructor foreign key, semester.
3. `course_enrollments` &mdash; student enrollments with `UNIQUE(course_id, student_id)`.
4. `assignments` &mdash; coursework title, description, instructions, max marks, deadline, `allow_late_submission`.
5. `assignment_attachments` &mdash; reference files uploaded by teachers.
6. `submissions` &mdash; student work, timestamps, `is_late` flag, with `UNIQUE(assignment_id, student_id)`.
7. `submission_files` &mdash; uploaded student files (PDF, DOCX, ZIP) with randomized storage filenames.
8. `grades` &mdash; marks obtained, teacher feedback, and publication timestamp.
9. `activity_logs` &mdash; audit trail of logins, course creations, submissions, and grade publication.
