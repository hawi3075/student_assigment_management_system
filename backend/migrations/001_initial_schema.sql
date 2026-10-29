-- ============================================================================
-- UniTask - University Student Assignment Management System
-- Database Schema for Neon PostgreSQL
-- ============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    department VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for authentication & role lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    semester VARCHAR(50) DEFAULT 'Fall 2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);

-- 3. COURSE ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS course_enrollments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_course_student UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);

-- 4. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (max_marks > 0),
    published_at TIMESTAMP WITH TIME ZONE,
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    allow_late_submission BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_at ON assignments(due_at);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- 5. ASSIGNMENT ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS assignment_attachments (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_assignment ON assignment_attachments(assignment_id);

-- 6. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'submitted' NOT NULL CHECK (status IN ('submitted', 'graded', 'resubmitted')),
    is_late BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 7. SUBMISSION FILES TABLE
CREATE TABLE IF NOT EXISTS submission_files (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submission_files_sub ON submission_files(submission_id);

-- 8. GRADES TABLE
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER UNIQUE NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    graded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    marks_obtained NUMERIC(5, 2) NOT NULL CHECK (marks_obtained >= 0),
    feedback TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grades_submission ON grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_grades_graded_by ON grades(graded_by);

-- 9. AUDIT / ACTIVITY LOGS TABLE (For Admin Monitoring)
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC);
