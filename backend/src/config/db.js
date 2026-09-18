// =====================================================
// DATABASE CONNECTION
// MYSQL / AIVEN
// =====================================================

import { createPool } from "mysql2/promise";

// =====================================================
// VALIDATE ENVIRONMENT
// =====================================================

if (!process.env.DB_HOST) {
  throw new Error("DB_HOST is not configured");
}

if (!process.env.DB_PORT) {
  throw new Error("DB_PORT is not configured");
}

if (!process.env.DB_USER) {
  throw new Error("DB_USER is not configured");
}

if (!process.env.DB_PASSWORD) {
  throw new Error("DB_PASSWORD is not configured");
}

if (!process.env.DB_NAME) {
  throw new Error("DB_NAME is not configured");
}

// =====================================================
// MYSQL POOL
// =====================================================

const pool = createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,

  connectTimeout: 20000,

  enableKeepAlive: true,

  keepAliveInitialDelay: 0,

  ssl: {
    rejectUnauthorized: false,
  },
});

// =====================================================
// DATABASE CONNECTION TEST
// =====================================================

(async () => {
  try {
    const connection = await pool.getConnection();

    console.log("==============================================");
    console.log("MySQL Database Connected Successfully");
    console.log("==============================================");
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log("==============================================");

    connection.release();
  } catch (error) {
    console.error("==============================================");
    console.error("MySQL Database Connection Failed");
    console.error("==============================================");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("==============================================");
  }
})();

// =====================================================
// EXPORT POOL
// =====================================================

export default pool;