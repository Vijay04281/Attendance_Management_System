// =====================================================
// IN-MEMORY SQLITE MOCK DATABASE FOR AI STUDIO
// =====================================================

const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");

const sqlite = new DatabaseSync(":memory:");

// Register MySQL-compatible SQL functions
sqlite.function("NOW", () => new Date().toISOString());
sqlite.function("CURDATE", () => new Date().toISOString().slice(0, 10));
sqlite.function("DATE", (val) => (val ? String(val).slice(0, 10) : ""));
sqlite.function("CONCAT", (...args) => args.join(""));
sqlite.function("DATE_ADD", (d) => new Date(Date.now() + 86400000).toISOString());
sqlite.function("DATE_SUB", (d) => new Date(Date.now() - 86400000).toISOString());
sqlite.function("DATEDIFF", () => 0);

// Initialize Tables
const schema = `
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  department_id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_name TEXT,
  department_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  class_id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER,
  year INTEGER,
  section TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_code TEXT,
  subject_name TEXT,
  semester TEXT,
  year INTEGER,
  department_id INTEGER,
  credits INTEGER,
  section TEXT,
  class_id INTEGER
);

CREATE TABLE IF NOT EXISTS staff (
  staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  staff_code TEXT,
  name TEXT,
  email TEXT,
  department TEXT,
  phone TEXT,
  role TEXT
);

CREATE TABLE IF NOT EXISTS students (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  roll_number TEXT,
  name TEXT,
  email TEXT,
  department TEXT,
  year INTEGER,
  section TEXT
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER,
  staff_id INTEGER,
  allocation_id INTEGER,
  class_id INTEGER,
  academic_year TEXT,
  session_date TEXT,
  start_time TEXT,
  end_time TEXT,
  qr_code TEXT,
  qr_expires_at TEXT,
  status TEXT DEFAULT 'OPEN',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  student_id INTEGER,
  scanned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'PRESENT'
);

CREATE TABLE IF NOT EXISTS attendance_records (
  attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  student_id INTEGER,
  attendance_status TEXT DEFAULT 'PRESENT',
  scan_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_reports (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER,
  student_id INTEGER,
  subject_id INTEGER,
  total_classes INTEGER DEFAULT 0,
  present_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  attendance_percentage REAL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS timetables (
  timetable_id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER,
  subject_id INTEGER,
  staff_id INTEGER,
  day TEXT,
  start_time TEXT,
  end_time TEXT
);

CREATE TABLE IF NOT EXISTS subject_allocations (
  allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER,
  staff_id INTEGER,
  class_id INTEGER,
  academic_year TEXT,
  semester TEXT,
  created_by INTEGER,
  credits INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_teacher_assignments (
  assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER,
  class_id INTEGER,
  academic_year TEXT,
  semester TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_teachers (
  assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER,
  class_id INTEGER,
  academic_year TEXT,
  is_active TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS subject_assignments (
  assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER,
  staff_id INTEGER,
  class_id INTEGER
);

CREATE TABLE IF NOT EXISTS staff_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER,
  subject_id INTEGER,
  class_id INTEGER
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  qr_token TEXT,
  qr_image TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

sqlite.exec(schema);

// Seed Data
try {
  const seedFile = path.resolve(__dirname, "../../../database/users_data_import.sql");
  if (fs.existsSync(seedFile)) {
    const rawSql = fs.readFileSync(seedFile, "utf8");
    const insertMatches = rawSql.match(/INSERT INTO `?\w+`? VALUES[\s\S]*?;/g) || [];
    for (const insertSql of insertMatches) {
      try {
        sqlite.exec(insertSql);
      } catch (err) {
        // Ignore duplicate key or minor formatting discrepancy in seed inserts
      }
    }
  }
} catch (e) {
  console.warn("[AI Studio Mock DB] Warning loading seed SQL file:", e.message);
}

// Ensure default admin, hod, staff, student, teacher passwords are set for login testing
const defaultPasswordHashes = {
  admin: bcrypt.hashSync("admin123", 10),
  hod001: bcrypt.hashSync("hod123", 10),
  staff001: bcrypt.hashSync("staff123", 10),
  student001: bcrypt.hashSync("student123", 10),
  teacher001: bcrypt.hashSync("teacher123", 10),
  classteacher: bcrypt.hashSync("teacher123", 10),
};

for (const [username, hash] of Object.entries(defaultPasswordHashes)) {
  try {
    const existing = sqlite.prepare("SELECT user_id FROM users WHERE username = ?").all(username);
    if (existing && existing.length > 0) {
      sqlite.prepare("UPDATE users SET password = ? WHERE username = ?").run(hash, username);
    } else {
      let role = "STAFF";
      if (username === "admin") role = "ADMIN";
      else if (username.includes("hod")) role = "HOD";
      else if (username.includes("student")) role = "STUDENT";
      else if (username.includes("teacher")) role = "TEACHER";
      sqlite.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, hash, role);
    }
  } catch (err) {
    // Ignore password update errors
  }
}

// Convert MySQL SQL dialect to SQLite where necessary
function cleanSql(sql) {
  return sql
    .replace(/LIMIT\s+(\d+)\s*,\s*(\d+)/gi, "LIMIT $2 OFFSET $1")
    .replace(/\bTRUE\b/gi, "1")
    .replace(/\bFALSE\b/gi, "0");
}

const mockDb = {
  query: async (sql, params = []) => {
    try {
      const clean = cleanSql(sql.trim());
      const normalizedParams = Array.isArray(params) ? params : [params];
      const flatParams = normalizedParams.map((p) => (p === undefined ? null : p));

      const isSelect = /^\s*(SELECT|SHOW|DESCRIBE|PRAGMA)/i.test(clean);

      if (isSelect) {
        const stmt = sqlite.prepare(clean);
        const rows = stmt.all(...flatParams);
        return [rows, []];
      } else {
        const stmt = sqlite.prepare(clean);
        const info = stmt.run(...flatParams);
        const result = {
          insertId: Number(info.lastInsertRowid || 0),
          affectedRows: info.changes || 0,
          changedRows: info.changes || 0,
        };
        return [result, []];
      }
    } catch (err) {
      console.warn("[MockDB Query Warning]:", err.message, "SQL:", sql.slice(0, 80));
      // Return safe empty results so the API routes continue functioning
      if (/^\s*(SELECT|SHOW|DESCRIBE)/i.test(sql)) {
        return [[], []];
      }
      return [{ insertId: 0, affectedRows: 0 }, []];
    }
  },

  execute: async (sql, params = []) => {
    return mockDb.query(sql, params);
  },

  getConnection: async () => {
    return {
      query: mockDb.query,
      execute: mockDb.query,
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
    };
  },

  end: async () => {},
};

console.log("[AI Studio] Mock SQLite database initialized with seed data.");
module.exports = mockDb;
