// =====================================================
// DATABASE CONNECTION
// MYSQL / AI STUDIO MOCK FALLBACK
// =====================================================

const mockDb = require("./mockDb");

let dbInstance = mockDb;

if (process.env.DB_HOST && process.env.DB_USER) {
  try {
    const mysql = require("mysql2/promise");
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "attendance_management",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    (async () => {
      try {
        const connection = await pool.getConnection();
        console.log("==============================================");
        console.log("MySQL Database Connected Successfully");
        console.log(`Host: ${process.env.DB_HOST}`);
        console.log(`Database: ${process.env.DB_NAME}`);
        console.log("==============================================");
        connection.release();
        dbInstance = pool;
      } catch (error) {
        console.warn("==============================================");
        console.warn("MySQL Database Connection Failed, using in-memory mock");
        console.warn("Message:", error.message);
        console.warn("==============================================");
        dbInstance = mockDb;
      }
    })();
  } catch (err) {
    console.warn("MySQL driver initialization failed, using mock database:", err.message);
    dbInstance = mockDb;
  }
} else {
  console.log("==============================================");
  console.log("DB_HOST not configured — using active in-memory SQLite database");
  console.log("==============================================");
}

module.exports = {
  query: (...args) => dbInstance.query(...args),
  execute: (...args) => (dbInstance.execute ? dbInstance.execute(...args) : dbInstance.query(...args)),
  getConnection: (...args) => dbInstance.getConnection(...args),
  end: (...args) => (dbInstance.end ? dbInstance.end(...args) : Promise.resolve()),
};
