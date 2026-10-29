-- ============================================================================
-- UniTask - University Assignment Management System
-- Initial Development Seed Data for PostgreSQL / Neon
-- ============================================================================

-- Passwords:
-- Admin: Admin@123 ($2a$10$wTkyrQ8l.h8tFw4lJtQcEOJdgPzV9zFjY9kP9v7Sj7r0J4O4QeNcy)
-- Teacher: Teacher@123 ($2a$10$6mUq8j2zT6sU2bE2dFj.E.8T9M5v0j7r1Sj7r0J4O4QeNcykPnK)
-- Student: Student@123 ($2a$10$3pY2bE2dFj.E.8T9M5v0j7r1Sj7r0J4O4QeNcykPnK6mUq8j2zT)

-- 1. SEED USERS
INSERT INTO users (id, full_name, email, password_hash, role, is_active, department, bio)
VALUES
(1, 'University Administrator', 'admin@university.edu', '$2a$10$wTkyrQ8l.h8tFw4lJtQcEOJdgPzV9zFjY9kP9v7Sj7r0J4O4QeNcy', 'admin', true, 'Administration', 'Head of Academic Systems and Operations'),
(2, 'Dr. Robert Smith', 'dr.smith@university.edu', '$2a$10$6mUq8j2zT6sU2bE2dFj.E.8T9M5v0j7r1Sj7r0J4O4QeNcykPnK', 'teacher', true, 'Computer Science', 'Associate Professor in Algorithms and Data Structures'),
(3, 'Prof. Sarah Johnson', 'prof.johnson@university.edu', '$2a$10$6mUq8j2zT6sU2bE2dFj.E.8T9M5v0j7r1Sj7r0J4O4QeNcykPnK', 'teacher', true, 'Data Science', 'Professor of Database Engineering and Distributed Systems'),
(4, 'Alex Chen', 'alex.chen@student.university.edu', '$2a$10$3pY2bE2dFj.E.8T9M5v0j7r1Sj7r0J4O4QeNcykPnK6mUq8j2zT', 'student', true, 'Computer Science', 'Undergraduate Sophomore studying Computer Systems'),
(5, 'Emma Watson', 'emma.watson@student.university.edu', '$2a$10$3pY2bE2dFj.E.8T9M5v0j7r1Sj7r0J4O4QeNcykPnK6mUq8j2zT', 'student', true, 'Computer Science', 'Junior CS Student with focus on Software Engineering'),
(6, 'Liam Davis', 'liam.davis@student.university.edu', '$2a$10$3pY2bE2dFj.E.8T9M5v0j7r1Sj7r0J4O4QeNcykPnK6mUq8j2zT', 'student', true, 'Data Science', 'Data Science Major with focus on analytics and ML')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. SEED COURSES
INSERT INTO courses (id, course_code, course_name, description, teacher_id, semester)
VALUES
(1, 'CS202', 'Data Structures & Algorithms', 'In-depth study of abstract data types, balanced trees, graph algorithms, and asymptotic complexity.', 2, 'Fall 2026'),
(2, 'CS305', 'Database Systems & Cloud Architecture', 'Relational database theory, 3NF/BCNF normalization, indexing, transaction processing, and PostgreSQL query tuning.', 3, 'Fall 2026'),
(3, 'CS101', 'Introduction to Computer Systems', 'Machine representations of data, assembly fundamentals, dynamic memory management in C, and CPU architectures.', 2, 'Fall 2026')
ON CONFLICT (id) DO NOTHING;

SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

-- 3. SEED COURSE ENROLLMENTS
INSERT INTO course_enrollments (course_id, student_id)
VALUES
(1, 4), -- Alex -> CS202
(2, 4), -- Alex -> CS305
(3, 4), -- Alex -> CS101
(1, 5), -- Emma -> CS202
(2, 5), -- Emma -> CS305
(2, 6)  -- Liam -> CS305
ON CONFLICT (course_id, student_id) DO NOTHING;

-- 4. SEED ASSIGNMENTS
INSERT INTO assignments (id, course_id, teacher_id, title, description, instructions, max_marks, published_at, due_at, allow_late_submission, status)
VALUES
(1, 1, 2, 'Programming Assignment 1: Red-Black Tree Implementation', 'Implement an efficient balanced Red-Black Tree with insertion, deletion, and search operations.', '1. Implement all rotations.\n2. Verify color invariants.\n3. Include unit tests in C or Java.\n4. Submit a single ZIP file.', 100.00, NOW(), NOW() + INTERVAL '5 days', false, 'published'),
(2, 2, 3, 'Lab 2: Relational Schema Normalization & PostgreSQL Tuning', 'Analyze the university database schema, bring it to 3NF/BCNF, and optimize query plans.', '1. Draw functional dependencies.\n2. Write DDL migration scripts.\n3. Run EXPLAIN ANALYZE.\n4. Upload PDF report.', 100.00, NOW(), NOW() + INTERVAL '12 days', true, 'published'),
(3, 3, 2, 'Lab 1: Dynamic Memory in C & Valgrind Analysis', 'Debug dynamic memory allocation, pointers, and memory leaks using GNU Valgrind.', 'Submit your source code and the clean Valgrind memory leak report.', 50.00, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', true, 'published')
ON CONFLICT (id) DO NOTHING;

SELECT setval('assignments_id_seq', (SELECT MAX(id) FROM assignments));

-- 5. SEED SUBMISSIONS
INSERT INTO submissions (id, assignment_id, student_id, submission_text, submitted_at, status, is_late)
VALUES
(1, 3, 4, 'Resolved all memory leaks in dynamic buffer allocation. Valgrind reports 0 errors in 0 contexts.', NOW() - INTERVAL '2 days', 'graded', false),
(2, 2, 5, 'Decomposed tables into BCNF. Composite index on enrollments reduced query time by 84%.', NOW() - INTERVAL '10 hours', 'submitted', false)
ON CONFLICT (id) DO NOTHING;

SELECT setval('submissions_id_seq', (SELECT MAX(id) FROM submissions));

-- 6. SEED SUBMISSION FILES
INSERT INTO submission_files (id, submission_id, original_filename, stored_filename, mime_type, file_size)
VALUES
(1, 1, 'alex_chen_valgrind_report.pdf', 'sub_alex_chen_valgrind_report.pdf', 'application/pdf', 384000),
(2, 2, 'emma_watson_schema_tuning.pdf', 'sub_emma_watson_schema_tuning.pdf', 'application/pdf', 512000)
ON CONFLICT (id) DO NOTHING;

SELECT setval('submission_files_id_seq', (SELECT MAX(id) FROM submission_files));

-- 7. SEED GRADES
INSERT INTO grades (id, submission_id, graded_by, marks_obtained, feedback, published_at)
VALUES
(1, 1, 2, 48.50, 'Excellent work Alex. The Valgrind analysis is comprehensive and memory frees are correctly handled.', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

SELECT setval('grades_id_seq', (SELECT MAX(id) FROM grades));
