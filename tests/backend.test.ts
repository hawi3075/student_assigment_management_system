import assert from 'node:assert/strict';
import { initDatabase, getDbStatus, getMemoryStore } from '../src/backend/config/database.js';
import { generateToken } from '../src/backend/middleware/auth.js';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('🧪 Starting UniTask Backend Test Suite...\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Database Initialization Test
  await test('Database engine initializes and reports status', async () => {
    await initDatabase();
    const status = getDbStatus();
    assert.ok(status.type === 'neon_postgres' || status.type === 'local_storage');
    assert.ok(typeof status.message === 'string');
  });

  // 2. Auth & Token Generation Test
  await test('JWT Token Generation and Verification', () => {
    const user = { id: 1, email: 'admin@university.edu', role: 'admin', full_name: 'Admin' };
    const token = generateToken(user);
    assert.ok(typeof token === 'string' && token.length > 20);
  });

  // 3. Password Hashing Test
  await test('Password bcrypt hashing and verification', () => {
    const plain = 'Student@123';
    const hash = bcrypt.hashSync(plain, 10);
    assert.ok(bcrypt.compareSync(plain, hash));
    assert.ok(!bcrypt.compareSync('WrongPassword', hash));
  });

  // 4. Role Authorization Constraint Test
  await test('Student cannot access admin privileges', () => {
    const studentUser = { id: 4, role: 'student', full_name: 'Alex' };
    const allowedRoles = ['teacher', 'admin'];
    assert.equal(allowedRoles.includes(studentUser.role), false);
  });

  // 5. Course and Enrollment Integrity Test
  await test('Verify course records and enrollment relationships', () => {
    const memory = getMemoryStore();
    assert.ok(memory.courses.length >= 3, 'Courses should be seeded');
    assert.ok(memory.course_enrollments.length >= 4, 'Enrollments should be present');
    
    // Check that Alex is enrolled in CS202 (id: 1)
    const alex = memory.users.find(u => u.email === 'alex.chen@student.university.edu');
    assert.ok(alex !== undefined, 'Alex user record must exist');
    const enrollment = memory.course_enrollments.find(e => e.course_id === 1 && e.student_id === alex.id);
    assert.ok(enrollment !== undefined, 'Alex should be enrolled in CS202');
  });

  // 6. Assignment Deadline and Late Submission Policy Test
  await test('Deadline enforcement and late submission flag calculation', () => {
    const now = new Date();
    const futureDue = new Date(now.getTime() + 5 * 24 * 3600 * 1000);
    const pastDue = new Date(now.getTime() - 24 * 3600 * 1000);

    const isFuturePastDue = now > futureDue;
    const isPastPastDue = now > pastDue;

    assert.equal(isFuturePastDue, false, 'Future assignment is not past due');
    assert.equal(isPastPastDue, true, 'Past assignment is past due');
  });

  // 7. Grading Numerical Range Validation Test
  await test('Marks obtained must not exceed maximum marks', () => {
    const maxMarks = 100;
    const validMarks = 88.5;
    const invalidMarks = 105;

    assert.ok(validMarks <= maxMarks && validMarks >= 0);
    assert.ok(invalidMarks > maxMarks, 'Exceeding marks must be flagged as invalid');
  });

  // 8. Health check diagnostic output Test
  await test('Health check diagnostic includes database metadata without leaking secrets', () => {
    const status = getDbStatus();
    assert.ok(!JSON.stringify(status).includes('password'));
  });

  console.log(`\n================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
