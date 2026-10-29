import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

export interface DbStatus {
  connected: boolean;
  type: 'neon_postgres' | 'local_storage';
  host?: string;
  database?: string;
  error?: string;
  message: string;
}

let dbStatus: DbStatus = {
  connected: false,
  type: 'local_storage',
  message: 'Initializing storage...'
};

let pgPool: pg.Pool | null = null;

// Fallback in-memory relational store that mirrors PostgreSQL schema
interface MemoryStore {
  users: any[];
  courses: any[];
  course_enrollments: any[];
  assignments: any[];
  assignment_attachments: any[];
  submissions: any[];
  submission_files: any[];
  grades: any[];
  activity_logs: any[];
  sequences: Record<string, number>;
}

const memoryStore: MemoryStore = {
  users: [],
  courses: [],
  course_enrollments: [],
  assignments: [],
  assignment_attachments: [],
  submissions: [],
  submission_files: [],
  grades: [],
  activity_logs: [],
  sequences: {
    users: 1,
    courses: 1,
    course_enrollments: 1,
    assignments: 1,
    assignment_attachments: 1,
    submissions: 1,
    submission_files: 1,
    grades: 1,
    activity_logs: 1
  }
};

export async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith('postgres') && !databaseUrl.includes('YOUR_PASSWORD')) {
    try {
      console.log('[Database] Connecting to Neon PostgreSQL...');
      pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 5000
      });

      // Test connection
      const client = await pgPool.connect();
      const res = await client.query('SELECT NOW() as current_time, current_database() as db');
      client.release();

      console.log('[Database] Successfully connected to Neon PostgreSQL:', res.rows[0]);
      dbStatus = {
        connected: true,
        type: 'neon_postgres',
        database: res.rows[0].db,
        message: 'Connected to Neon PostgreSQL'
      };

      // Run migrations on PostgreSQL
      await runPostgresMigrations();
      await seedPostgresData();
      return;
    } catch (err: any) {
      console.warn('[Database] Neon PostgreSQL connection failed or timed out:', err.message);
      dbStatus = {
        connected: false,
        type: 'local_storage',
        error: err.message,
        message: 'Neon PostgreSQL not reachable. Operating with resilient University Data Engine.'
      };
      pgPool = null;
    }
  } else {
    console.log('[Database] DATABASE_URL not set or placeholder detected. Operating with resilient University Data Engine.');
    dbStatus = {
      connected: false,
      type: 'local_storage',
      message: 'Running in Local University Data Engine. Set DATABASE_URL in .env to connect Neon PostgreSQL.'
    };
  }

  // Seed memory store
  seedMemoryData();
}

async function runPostgresMigrations() {
  if (!pgPool) return;
  const migrationPath = path.resolve(process.cwd(), 'migrations', '001_initial_schema.sql');
  if (fs.existsSync(migrationPath)) {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pgPool.query(sql);
    console.log('[Database] PostgreSQL schema migration executed successfully.');
  }
}

async function seedPostgresData() {
  if (!pgPool) return;
  const check = await pgPool.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(check.rows[0].count) > 0) {
    return; // Already seeded
  }

  console.log('[Database] Seeding initial data into Neon PostgreSQL...');
  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('Admin@123', salt);
  const teacherPass = bcrypt.hashSync('Teacher@123', salt);
  const studentPass = bcrypt.hashSync('Student@123', salt);

  // Insert Admin
  const adminRes = await pgPool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['University Administrator', 'admin@university.edu', adminPass, 'admin', true, 'Administration', 'Head of Academic Systems']
  );

  // Insert Teachers
  const t1Res = await pgPool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Dr. Robert Smith', 'dr.smith@university.edu', teacherPass, 'teacher', true, 'Computer Science', 'Associate Professor in Algorithms and Distributed Systems']
  );
  const t2Res = await pgPool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Prof. Sarah Johnson', 'prof.johnson@university.edu', teacherPass, 'teacher', true, 'Data Science', 'Professor of Database Engineering and Applied Analytics']
  );

  // Insert Students
  const s1Res = await pgPool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Alex Chen', 'alex.chen@student.university.edu', studentPass, 'student', true, 'Computer Science', 'Sophomore CS Student passionate about systems']
  );
  const s2Res = await pgPool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Emma Watson', 'emma.watson@student.university.edu', studentPass, 'student', true, 'Computer Science', 'Junior CS Student specializing in software architecture']
  );
  const s3Res = await pgPool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    ['Liam Davis', 'liam.davis@student.university.edu', studentPass, 'student', true, 'Data Science', 'Data Science Major with focus on machine learning']
  );

  const t1Id = t1Res.rows[0].id;
  const t2Id = t2Res.rows[0].id;
  const s1Id = s1Res.rows[0].id;
  const s2Id = s2Res.rows[0].id;
  const s3Id = s3Res.rows[0].id;

  // Insert Courses
  const c1Res = await pgPool.query(
    `INSERT INTO courses (course_code, course_name, description, teacher_id, semester)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['CS202', 'Data Structures & Algorithms', 'In-depth study of abstract data types, balanced trees, graph algorithms, and complexity analysis.', t1Id, 'Fall 2026']
  );
  const c2Res = await pgPool.query(
    `INSERT INTO courses (course_code, course_name, description, teacher_id, semester)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['CS305', 'Database Systems & Cloud Architecture', 'Relational design, normalization, indexing, transaction processing, and PostgreSQL query tuning.', t2Id, 'Fall 2026']
  );
  const c3Res = await pgPool.query(
    `INSERT INTO courses (course_code, course_name, description, teacher_id, semester)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['CS101', 'Introduction to Computer Systems', 'Computer architecture, assembly fundamentals, memory management, and C programming.', t1Id, 'Fall 2026']
  );

  const c1Id = c1Res.rows[0].id;
  const c2Id = c2Res.rows[0].id;
  const c3Id = c3Res.rows[0].id;

  // Enrollments
  await pgPool.query(`INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2), ($1, $3), ($2, $2), ($2, $4), ($3, $2)`, [c1Id, s1Id, s2Id, s3Id]);

  // Assignments
  const now = new Date();
  const dueIn5Days = new Date(now.getTime() + 5 * 24 * 3600 * 1000);
  const dueIn12Days = new Date(now.getTime() + 12 * 24 * 3600 * 1000);
  const dueYesterday = new Date(now.getTime() - 1 * 24 * 3600 * 1000);

  const a1Res = await pgPool.query(
    `INSERT INTO assignments (course_id, teacher_id, title, description, instructions, max_marks, published_at, due_at, allow_late_submission, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      c1Id,
      t1Id,
      'Programming Assignment 1: Red-Black Tree Implementation',
      'Implement an efficient balanced Red-Black Tree with insertion, deletion, and search operations.',
      '1. Implement all tree rotations correctly.\n2. Maintain color invariants.\n3. Include comprehensive unit tests in C or Java.\n4. Submit a single ZIP file with documentation.',
      100.00,
      now,
      dueIn5Days,
      false,
      'published'
    ]
  );

  const a2Res = await pgPool.query(
    `INSERT INTO assignments (course_id, teacher_id, title, description, instructions, max_marks, published_at, due_at, allow_late_submission, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      c2Id,
      t2Id,
      'Lab 2: Relational Schema Normalization & PostgreSQL Tuning',
      'Analyze the provided unnormalized university database schema, bring it to 3NF/BCNF, and optimize query plans.',
      '1. Draw the functional dependency diagram.\n2. Write DDL migration scripts with constraints.\n3. Run EXPLAIN ANALYZE on sample queries and propose indexes.\n4. Upload PDF report and SQL file.',
      100.00,
      now,
      dueIn12Days,
      true,
      'published'
    ]
  );

  const a3Res = await pgPool.query(
    `INSERT INTO assignments (course_id, teacher_id, title, description, instructions, max_marks, published_at, due_at, allow_late_submission, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      c3Id,
      t1Id,
      'Lab 1: Memory Management in C & Valgrind Analysis',
      'Practice dynamic memory allocation, pointers, and memory leak detection using Valgrind.',
      'Submit your source code and the clean Valgrind memory leak report.',
      50.00,
      new Date(now.getTime() - 7 * 24 * 3600 * 1000),
      dueYesterday,
      true,
      'published'
    ]
  );

  console.log('[Database] Neon PostgreSQL seeded successfully.');
}

function seedMemoryData() {
  const salt = bcrypt.genSaltSync(10);
  const superAdminPass = bcrypt.hashSync('SuperAdmin@123', salt);
  const adminPass = bcrypt.hashSync('Admin@123', salt);
  const teacherPass = bcrypt.hashSync('Teacher@123', salt);
  const studentPass = bcrypt.hashSync('Student@123', salt);

  const now = new Date();
  const dueIn5Days = new Date(now.getTime() + 5 * 24 * 3600 * 1000).toISOString();
  const dueIn12Days = new Date(now.getTime() + 12 * 24 * 3600 * 1000).toISOString();
  const dueYesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

  // Users
  memoryStore.users = [
    {
      id: 1,
      full_name: 'Chief Super Administrator',
      email: 'superadmin@university.edu',
      password_hash: superAdminPass,
      role: 'super_admin',
      is_active: true,
      department: 'Executive Academic Council',
      bio: 'Executive institutional control, master administrative credentials, and governance.',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 2,
      full_name: 'Academic Systems Administrator',
      email: 'admin@university.edu',
      password_hash: adminPass,
      role: 'admin',
      is_active: true,
      department: 'Academic Administration',
      bio: 'Operations and registrar assignment management.',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 3,
      full_name: 'Dr. Robert Smith',
      email: 'dr.smith@university.edu',
      password_hash: teacherPass,
      role: 'teacher',
      is_active: true,
      department: 'Computer Science',
      bio: 'Associate Professor of Computer Science specializing in Algorithms, Data Structures, and Systems Architecture.',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 4,
      full_name: 'Prof. Sarah Johnson',
      email: 'prof.johnson@university.edu',
      password_hash: teacherPass,
      role: 'teacher',
      is_active: true,
      department: 'Data Science & Informatics',
      bio: 'Professor of Database Engineering, Cloud Systems, and Applied Informatics.',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 5,
      full_name: 'Alex Chen',
      email: 'alex.chen@student.university.edu',
      password_hash: studentPass,
      role: 'student',
      is_active: true,
      department: 'Computer Science',
      bio: 'Second-year undergraduate student focused on distributed systems and algorithm design.',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 6,
      full_name: 'Emma Watson',
      email: 'emma.watson@student.university.edu',
      password_hash: studentPass,
      role: 'student',
      is_active: true,
      department: 'Computer Science',
      bio: 'Third-year undergraduate student focusing on software engineering and data pipelines.',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 7,
      full_name: 'Liam Davis',
      email: 'liam.davis@student.university.edu',
      password_hash: studentPass,
      role: 'student',
      is_active: true,
      department: 'Data Science',
      bio: 'Honors student exploring predictive modeling and modern cloud databases.',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
  ];
  memoryStore.sequences.users = 8;

  // Courses
  memoryStore.courses = [
    {
      id: 1,
      course_code: 'CS202',
      course_name: 'Data Structures & Algorithms',
      description: 'Comprehensive study of balanced trees, priority queues, graph algorithms, and asymptotic complexity.',
      teacher_id: 3,
      semester: 'Fall 2026',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 2,
      course_code: 'CS305',
      course_name: 'Database Systems & Cloud Architecture',
      description: 'Relational database theory, 3NF/BCNF normalization, indexing, concurrency control, and PostgreSQL tuning.',
      teacher_id: 4,
      semester: 'Fall 2026',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 3,
      course_code: 'CS101',
      course_name: 'Introduction to Computer Systems',
      description: 'Machine representations of data, assembly fundamentals, dynamic memory management in C, and CPU caches.',
      teacher_id: 3,
      semester: 'Fall 2026',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 4,
      course_code: 'DS410',
      course_name: 'Large-Scale Data Engineering',
      description: 'Distributed query engines, streaming architectures, and column-store analytical systems.',
      teacher_id: 4,
      semester: 'Fall 2026',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
  ];
  memoryStore.sequences.courses = 5;

  // Course Enrollments
  memoryStore.course_enrollments = [
    { id: 1, course_id: 1, student_id: 5, enrolled_at: now.toISOString() }, // Alex -> CS202
    { id: 2, course_id: 2, student_id: 5, enrolled_at: now.toISOString() }, // Alex -> CS305
    { id: 3, course_id: 3, student_id: 5, enrolled_at: now.toISOString() }, // Alex -> CS101
    { id: 4, course_id: 1, student_id: 6, enrolled_at: now.toISOString() }, // Emma -> CS202
    { id: 5, course_id: 2, student_id: 6, enrolled_at: now.toISOString() }, // Emma -> CS305
    { id: 6, course_id: 2, student_id: 7, enrolled_at: now.toISOString() }, // Liam -> CS305
    { id: 7, course_id: 4, student_id: 7, enrolled_at: now.toISOString() }  // Liam -> DS410
  ];
  memoryStore.sequences.course_enrollments = 8;

  // Assignments
  memoryStore.assignments = [
    {
      id: 1,
      course_id: 1,
      teacher_id: 3,
      title: 'Programming Assignment 1: Balanced Red-Black Trees',
      description: 'Implement a complete Red-Black Tree data structure in C++ or Java with guaranteed logarithmic search and insertion.',
      instructions: '1. Follow standard Sedgewick/CLRS specifications for rotation invariants.\n2. Implement insert, search, delete, and in-order traversal.\n3. Validate with 100,000 random operations and measure wall-clock times.\n4. Submit a zip archive containing clean source code and PDF benchmark report.',
      max_marks: 100.00,
      published_at: now.toISOString(),
      due_at: dueIn5Days,
      allow_late_submission: false,
      status: 'published',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 2,
      course_id: 2,
      teacher_id: 4,
      title: 'Lab 2: Relational Schema Normalization & Query Tuning',
      description: 'Decompose a unnormalized university schema to 3NF/BCNF and benchmark indexing strategies on Neon PostgreSQL.',
      instructions: '1. Identify all functional dependencies and candidate keys.\n2. Produce SQL migration scripts establishing foreign keys and indices.\n3. Run EXPLAIN ANALYZE on complex multi-table joins.\n4. Attach your SQL script and PDF analysis.',
      max_marks: 100.00,
      published_at: now.toISOString(),
      due_at: dueIn12Days,
      allow_late_submission: true,
      status: 'published',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 3,
      course_id: 3,
      teacher_id: 3,
      title: 'Lab 1: Memory Allocation & Valgrind Leak Detection',
      description: 'Debug heap memory allocation in a custom dynamic array and hash table using GNU Valgrind.',
      instructions: '1. Identify memory leaks, invalid frees, and out-of-bound writes.\n2. Fix issues without altering public API headers.\n3. Provide clean Valgrind log outputs.',
      max_marks: 50.00,
      published_at: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(),
      due_at: dueYesterday,
      allow_late_submission: true,
      status: 'published',
      created_at: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 4,
      course_id: 1,
      teacher_id: 3,
      title: 'Project 2: Graph Shortest Paths & Network Flow',
      description: 'Draft specification for Dijkstra, A*, and Ford-Fulkerson algorithms.',
      instructions: 'Course project draft currently under review.',
      max_marks: 100.00,
      published_at: null,
      due_at: new Date(now.getTime() + 25 * 24 * 3600 * 1000).toISOString(),
      allow_late_submission: false,
      status: 'draft',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
  ];
  memoryStore.sequences.assignments = 5;

  // Assignment Attachments
  memoryStore.assignment_attachments = [
    {
      id: 1,
      assignment_id: 1,
      original_filename: 'rb_tree_starter_code.zip',
      stored_filename: 'att_sample_rb_starter.zip',
      mime_type: 'application/zip',
      file_size: 45200,
      created_at: now.toISOString()
    },
    {
      id: 2,
      assignment_id: 2,
      original_filename: 'schema_benchmark_dataset.sql',
      stored_filename: 'att_sample_schema_data.sql',
      mime_type: 'application/sql',
      file_size: 128400,
      created_at: now.toISOString()
    }
  ];
  memoryStore.sequences.assignment_attachments = 3;

  // Submissions
  memoryStore.submissions = [
    {
      id: 1,
      assignment_id: 3,
      student_id: 5, // Alex submitted Lab 1
      submission_text: 'Completed all heap memory fixes. Zero leaks and 0 errors reported by Valgrind under full test suite.',
      submitted_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
      status: 'graded',
      is_late: false,
      created_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
      updated_at: now.toISOString()
    },
    {
      id: 2,
      assignment_id: 2,
      student_id: 6, // Emma submitted Lab 2
      submission_text: 'Decomposed schema into 3NF. Added composite index on (student_id, course_id) reducing sequential scan latency by 84%.',
      submitted_at: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      status: 'submitted',
      is_late: false,
      created_at: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      updated_at: now.toISOString()
    }
  ];
  memoryStore.sequences.submissions = 3;

  // Submission Files
  memoryStore.submission_files = [
    {
      id: 1,
      submission_id: 1,
      original_filename: 'alex_chen_lab1_valgrind.pdf',
      stored_filename: 'sub_alex_chen_lab1_valgrind.pdf',
      mime_type: 'application/pdf',
      file_size: 384000,
      created_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 2,
      submission_id: 2,
      original_filename: 'emma_watson_schema_tuning.pdf',
      stored_filename: 'sub_emma_watson_schema_tuning.pdf',
      mime_type: 'application/pdf',
      file_size: 512000,
      created_at: new Date(now.getTime() - 10 * 3600 * 1000).toISOString()
    }
  ];
  memoryStore.sequences.submission_files = 3;

  // Grades
  memoryStore.grades = [
    {
      id: 1,
      submission_id: 1,
      graded_by: 2, // Dr. Robert Smith
      marks_obtained: 48.50,
      feedback: 'Excellent work Alex. The Valgrind analysis is thorough and your heap cleanup functions correctly handle edge cases.',
      published_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      updated_at: now.toISOString()
    }
  ];
  memoryStore.sequences.grades = 2;

  // Activity Logs
  memoryStore.activity_logs = [
    {
      id: 1,
      user_id: 1,
      action: 'SYSTEM_STARTUP',
      details: 'University Assignment Management System initialized.',
      ip_address: '127.0.0.1',
      created_at: now.toISOString()
    },
    {
      id: 2,
      user_id: 2,
      action: 'GRADE_PUBLISHED',
      details: 'Dr. Robert Smith published grades for Lab 1 (Alex Chen).',
      ip_address: '127.0.0.1',
      created_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString()
    }
  ];
  memoryStore.sequences.activity_logs = 3;
}

export function getDbStatus(): DbStatus {
  return dbStatus;
}

export function getMemoryStore(): MemoryStore {
  return memoryStore;
}

export async function logActivity(userId: number | null, action: string, details: string, ip = '127.0.0.1') {
  if (pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [userId, action, details, ip]
      );
      return;
    } catch (e) {
      // Fall through to memory log
    }
  }
  const id = memoryStore.sequences.activity_logs++;
  memoryStore.activity_logs.unshift({
    id,
    user_id: userId,
    action,
    details,
    ip_address: ip,
    created_at: new Date().toISOString()
  });
}

export const db = {
  async query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    if (pgPool) {
      const res = await pgPool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount ?? 0 };
    }

    // In local engine fallback mode, memoryStore is queried directly via specialized controller helpers
    return { rows: [], rowCount: 0 };
  },
  getPool() {
    return pgPool;
  }
};
